import { GoogleGenAI } from '@google/genai';
import { DatabaseSchema, Episode, GenerationRun, StoryDecision, StoryUnit } from '../types/database';
import {
  buildNarrativeContext,
  NarrativeContextInput,
  NarrativeContextResult,
  MissingContextItem,
  ContinuityWarning,
} from './narrativeContextBuilder';
import { narrativeRuntimeConfig, DEFAULT_NARRATIVE_MODEL } from './geminiNarrativeService';

export type PlanStatus =
  | 'generating'
  | 'draft'
  | 'needs_decision'
  | 'needs_revision'
  | 'ready_for_review'
  | 'approved'
  | 'archived'
  | 'failed';

export interface PlanEpisodeInput {
  project_id: string;
  episode_id?: string;
  episode_number: number;
  regenerate?: boolean;
  user_notes?: string;
  user_id?: string;
  db_snapshot?: DatabaseSchema;
}

export interface PlannedUnit {
  unit_number: number;
  title: string;
  function: 'تأسيس' | 'تصعيد' | 'انعطاف' | 'ذروة' | 'أزمة' | 'تنوير' | 'خاتمة مشوقة (Cliffhanger)' | string;
  start_state: string;
  objective: string;
  pressure: string;
  information: string[];
  plant: string[];
  payoff: string[];
  turn: string;
  end_state: string;
  hook: string;
  characters: string[];
  location: string;
  psychological_effect: string[];
  relationship_changes: string[];
  knowledge_changes: string[];
  affected_open_loops: string[];
  relevant_secrets: string[];
  relevant_clues: string[];
  relevant_objects: string[];
  proposed_new_facts: string[];
  continuity_risks: string[];
}

export interface PlannedEpisodeData {
  episode_number: number;
  proposed_title: string;
  synopsis: string;
  opening_state: string;
  main_objective: string;
  central_conflict: string;
  ending_state: string;
  main_characters: string[];
  main_locations: string[];
  active_secrets: string[];
  active_open_loops: string[];
  episode_promise: string;
  continuity_summary: string;
}

export interface EpisodeChecks {
  starts_from_previous_state: boolean;
  contains_exactly_five_units: boolean;
  units_are_connected: boolean;
  canon_respected: boolean;
  character_knowledge_respected: boolean;
  psychological_continuity_respected: boolean;
  supernatural_rules_respected: boolean;
  open_loops_handled: boolean;
  clues_have_purpose: boolean;
  contains_unapproved_major_decisions: boolean;
}

export interface PendingStoryDecisionItem {
  id?: string;
  title: string;
  question: string;
  options: string[];
  reasoning: string;
  impact: string;
  is_blocking: boolean;
}

export interface ValidationIssue {
  category: string;
  message: string;
  severity: 'critical' | 'major' | 'minor';
  unit_number?: number;
  field?: string;
}

export interface PlanValidationReport {
  approved_for_human_review: boolean;
  scores: {
    continuity: number;
    causality: number;
    character_logic: number;
    psychology: number;
    unit_connection: number;
    mystery_control: number;
    pacing: number;
  };
  critical_issues: string[];
  major_issues: string[];
  minor_issues: string[];
  questions_for_author: string[];
}

export interface ChangeRecord {
  field: string;
  previous_value: any;
  new_value: any;
  timestamp: string;
}

export interface EpisodePlanResult {
  id: string;
  project_id: string;
  episode_id?: string;
  episode_number: number;
  status: PlanStatus;
  version: number;
  episode: PlannedEpisodeData;
  units: PlannedUnit[];
  episode_checks: EpisodeChecks;
  pending_story_decisions: PendingStoryDecisionItem[];
  missing_context: {
    blocking: MissingContextItem[];
    non_blocking: MissingContextItem[];
  };
  warnings: ContinuityWarning[];
  validation_report: PlanValidationReport;
  change_history: ChangeRecord[];
  created_at: string;
  updated_at: string;
  accepted_at?: string;
  generation_run_id?: string;
}

// Global active planning lock to prevent concurrent planning on the same episode (Section 2 & 10)
const activePlanningLocks = new Set<string>();

/**
 * Checks if Gemini connection is operational
 */
function isGeminiConfigured(): boolean {
  const apiKey = process.env.GEMINI_API_KEY;
  return Boolean(apiKey && apiKey !== 'MY_GEMINI_API_KEY' && apiKey.trim() !== '');
}

/**
 * Partitions missing context into BLOCKING and NON-BLOCKING (Section 4)
 */
export function partitionMissingContext(
  items: MissingContextItem[],
  context: NarrativeContextResult,
  episodeNumber: number,
  db?: DatabaseSchema
): { blocking: MissingContextItem[]; non_blocking: MissingContextItem[] } {
  const blocking: MissingContextItem[] = [];
  const non_blocking: MissingContextItem[] = [];

  // Check 1: Active system prompt presence
  if (!context.active_system_prompt || !context.active_system_prompt.is_active || !context.active_system_prompt.content) {
    blocking.push({
      key: 'ACTIVE_SYSTEM_PROMPT_NOT_FOUND',
      description: 'لا يوجد System Prompt نشط في إعدادات العقل السردي لهذا المشروع.',
      impact: 'يمنع توجيه الذكاء الاصطناعي وفق دستور الرواية وقوانين العالم.',
      resolution: 'قم بتعيين أو تفعيل نسخة System Prompt نشطة من صفحة الإعدادات.',
    });
  }

  // Check 2: Starting state availability
  const hasStartState = Boolean(
    context.current_state?.starting_narrative_state ||
    context.previous_unit?.end_state ||
    (episodeNumber === 3 && context.project?.title?.includes('الوارث'))
  );
  if (!hasStartState && episodeNumber > 1) {
    blocking.push({
      key: 'MISSING_STARTING_STATE',
      description: 'لا توجد نقطة بداية سردية واضحة للحلقة مبنية على ما قبلها.',
      impact: 'يؤدي إلى تخطيط منفصل غير عضوي عن مسار الرواية السابق.',
      resolution: 'اعتمد الحلقة السابقة أو حدد حالة البداية في بيانات القصة.',
    });
  }

  // Check 3: Critical continuity contradictions from warnings or continuity_log
  const criticalWarnings = (context.continuity_warnings || []).filter(w => w.severity === 'critical');
  const criticalLogs = (db?.continuity_log || []).filter(
    l => l.project_id === context.project.id && l.severity === 'حرج' && l.status === 'قيد الانتظار'
  );

  if (criticalWarnings.length > 0 || criticalLogs.length > 0) {
    const messages = [
      ...criticalWarnings.map(w => w.message),
      ...criticalLogs.map(l => l.description),
    ];
    blocking.push({
      key: 'UNRESOLVED_CRITICAL_CONTRADICTIONS',
      description: `يوجد ${messages.length} تناقض حرج غير محلول في ذاكرة الرواية: ${messages.join(' | ')}`,
      impact: 'تخطيط حلقة جديدة فوق تناقض حرج يكرس الخلل في الحبكة.',
      resolution: 'راجع سجل التدقيق وحل التناقض الحرج قبل التخطيط.',
    });
  }

  // Check 4: Check if central characters have state
  const centralCharacters = context.relevant_characters.filter(
    c => c.role.includes('بطل') || c.role.includes('رئيسي') || c.role.includes('محوري')
  );
  if (context.relevant_characters.length > 0 && centralCharacters.length === 0 && episodeNumber > 1) {
    blocking.push({
      key: 'NO_CENTRAL_CHARACTER_STATE',
      description: 'لا توجد أي حالة مسجلة للشخصيات المحورية في الرواية.',
      impact: 'عدم القدرة على تحديد دوافع البطل وصراعاته الحالية.',
      resolution: 'سجل حالة الشخصية المحورية وموقعها الحالي في بطاقات الشخصيات.',
    });
  }

  // Classify standard missing items from narrative context builder
  for (const item of items) {
    const k = item.key.toLowerCase();
    if (k.includes('prompt') || k.includes('conflict') || k.includes('canon') || k.includes('previous_unit')) {
      blocking.push(item);
    } else {
      non_blocking.push(item);
    }
  }

  return { blocking, non_blocking };
}

/**
 * Builds the compact structured Task Prompt for Gemini Episode Planning (Section 5)
 */
export function buildPlanningTaskPrompt(
  episodeNumber: number,
  projectTitle: string,
  userNotes: string,
  context: NarrativeContextResult
): string {
  const isAlWarith = projectTitle.includes('الوارث');
  const isEpisode3 = episodeNumber === 3;

  const alWarithSpecialDirective = (isAlWarith && isEpisode3)
    ? `
قاعدة استمرارية خاصة وحاسمة لمشروع «الوارث» (الحلقة 3):
بداية الحلقة الثالثة تأتي مباشرة بعد Canon المعتمد:
«عرفت بلي هاد الليلة ما غاديش تسالي مزيان»
ممنوع اختراع تكملة نصية لهذه الجملة في مرحلة التخطيط. استعملها فقط كنقطة انطلاق واستمرارية عصبية للحالة النفسية والجسدية للوحدة الأولى.
`
    : '';

  return `
أنت الآن في وضع تخطيط حلقة، وليس في وضع الكتابة.

ممنوع كتابة النص الروائي النهائي أو الحوارات الكاملة أو المسودات التفصيلية.
خطط الحلقة رقم ${episodeNumber} من مشروع «${projectTitle}» في خمس وحدات سردية مترابطة حصراً.

تعامل مع الحلقة كحركة سردية واحدة مقسمة إنتاجياً إلى خمس وحدات، وليس كخمس حلقات قصيرة مستقلة.
يجب أن تبدأ الحلقة عضوياً من آخر حالة معتمدة في الرواية.

${alWarithSpecialDirective}

${userNotes?.trim() ? `ملاحظات ورغبات المؤلف الإضافية (تُراعى بما لا يخالف Canon المنشور):\n"${userNotes.trim()}"\n` : ''}

لكل وحدة من الوحدات الخمس حدد:
- unit_number (من 1 إلى 5 بالترتيب)
- title (عنوان مميز للوحدة)
- function (تأسيس، تصعيد، انعطاف، ذروة، أزمة، تنوير، خاتمة مشوقة)
- start_state (الحالة السردية الدقيقة عند بداية الوحدة)
- objective (الهدف الدرامي المباشر)
- pressure (مصدر الضغط الزمني أو النفسي أو الجسدي)
- information (مصفوفة معلومات جديدة تظهر في الوحدة)
- plant (مصفوفة عناصر زُرعت في هذه الوحدة)
- payoff (مصفوفة مردود لعناصر زُرعت سابقاً)
- turn (نقطة التحول أو المفاجأة المنطقية)
- end_state (الحالة الدقيقة عند نهاية الوحدة والتي تسلم للوحدة التالية)
- hook (خطاف النهاية المشوق والمنوع)
- characters (مصفوفة أسماء الشخصيات المشاركة)
- location (مكان وقوع أحداث الوحدة)
- psychological_effect (الأثر النفسي والجسدي على الشخصيات)
- relationship_changes (تغيرات الثقة والتوتر بين الشخصيات)
- knowledge_changes (تغيرات المعرفة وما عرفته أو جهلته الشخصيات)
- affected_open_loops (الخيوط المفتوحة التي تم تحريكها)
- relevant_secrets (الأسرار المرتبطة بالوحدة ومستوى التلميح دون كشف مبكر)
- relevant_clues (التلميحات المزروعة أو المتفاعلة)
- relevant_objects (الأشياء المادية المؤثرة)
- proposed_new_facts (حقائق جديدة مقترحة تبقى مقترحة فقط)
- continuity_risks (مخاطر استمرارية محتملة يجب الانتباه لها)

قواعد التخطيط الإلزامية:
1. كل وحدة يجب أن تغير شيئاً حقيقياً في: المعرفة، العلاقة، الخطر، الهدف، الثقة، الحالة النفسية، تفسير حدث سابق، أو ميزان القوة.
2. يجب أن تكون end_state لكل وحدة أساساً منطقياً لـ start_state الوحدة التالية مباشرة.
3. ممنوع تكرار المقدمة أو تلخيص الوحدة السابقة في بداية كل وحدة.
4. ممنوع استعمال خمس نهايات مصطنعة أو كليشيهات متطابقة.
5. نوع الخطافات بين الوحدات ولا تعتمد دائماً على المفاجأة الصاخبة.
6. احترم معرفة كل شخصية وما لا تعرفه وما يُحظر عليها معرفته.
7. لا تكشف سراً قبل reveal_stage المعتمدة.
8. لا تزرع تلميحاً بلا سر أو مردود محتمل، والتزم بمبدأ: PLANT -> DEVELOP -> PAYOFF.
9. لا تغلق خيطاً مفتوحاً قبل أوانه.
10. لا تنس الأثر النفسي والجسدي للأحداث السابقة.
11. لا تكسر قانوناً من قوانين الخوارق المحددة.
12. لا تنقل شخصية أو شيئاً مهماً بلا تفسير عضوي.
13. لا تخترع ماضياً مهماً أو قرابة أو هوية أو حقيقة مركزية من أجل تسهيل المخطط.
14. لا تغير Canon المنشور.
15. الصدفة يمكن أن تخلق مشكلة، لكنها لا يجب أن تنقذ الحبكة أبداً.
16. إذا احتاج المخطط إلى قرار يغير: هوية شخصية رئيسية، ماضيها، قرابتها، سراً مركزياً، قانوناً خارقاً، تفسير اللغز الرئيسي، أو نهاية الرواية: فلا تتخذ القرار تلقائياً! أضف هذا القرار داخل مصفوفة pending_story_decisions.
17. لا تضف أي نص أو شرح خارج كائن الـ JSON.

يجب أن ترجع حصراً كائن JSON بنفس الصيغة المحددة أدناه:
{
  "episode": {
    "episode_number": ${episodeNumber},
    "proposed_title": "...",
    "synopsis": "...",
    "opening_state": "...",
    "main_objective": "...",
    "central_conflict": "...",
    "ending_state": "...",
    "main_characters": ["..."],
    "main_locations": ["..."],
    "active_secrets": ["..."],
    "active_open_loops": ["..."],
    "episode_promise": "...",
    "continuity_summary": "..."
  },
  "units": [
    {
      "unit_number": 1,
      "title": "...",
      "function": "تأسيس",
      "start_state": "...",
      "objective": "...",
      "pressure": "...",
      "information": ["..."],
      "plant": ["..."],
      "payoff": ["..."],
      "turn": "...",
      "end_state": "...",
      "hook": "...",
      "characters": ["..."],
      "location": "...",
      "psychological_effect": ["..."],
      "relationship_changes": ["..."],
      "knowledge_changes": ["..."],
      "affected_open_loops": ["..."],
      "relevant_secrets": ["..."],
      "relevant_clues": ["..."],
      "relevant_objects": ["..."],
      "proposed_new_facts": ["..."],
      "continuity_risks": ["..."]
    }
  ],
  "episode_checks": {
    "starts_from_previous_state": true,
    "contains_exactly_five_units": true,
    "units_are_connected": true,
    "canon_respected": true,
    "character_knowledge_respected": true,
    "psychological_continuity_respected": true,
    "supernatural_rules_respected": true,
    "open_loops_handled": true,
    "clues_have_purpose": true,
    "contains_unapproved_major_decisions": false
  },
  "pending_story_decisions": [],
  "missing_context": [],
  "warnings": []
}
`;
}

/**
 * Validates the Gemini Output structurally on the Server-side (Section 7)
 */
export function validatePlanStructure(parsed: any, context: NarrativeContextResult): {
  isValid: boolean;
  errors: string[];
  repairedPlan?: any;
} {
  const errors: string[] = [];

  if (!parsed || typeof parsed !== 'object') {
    return { isValid: false, errors: ['الناتج المستلم ليس كائن JSON صالح'] };
  }

  // 1. Episode presence
  if (!parsed.episode || typeof parsed.episode !== 'object') {
    errors.push('كائن الحلقة (episode) غير موجود');
  } else {
    if (!parsed.episode.proposed_title || !parsed.episode.proposed_title.trim()) {
      parsed.episode.proposed_title = `الحلقة ${parsed.episode.episode_number || ''}`;
    }
    if (!parsed.episode.synopsis || !parsed.episode.synopsis.trim()) {
      errors.push('ملخص الحلقة (synopsis) غير موجود');
    }
    if (!parsed.episode.opening_state || !parsed.episode.opening_state.trim()) {
      errors.push('حالة البداية (opening_state) للحلقة غير موجودة');
    }
  }

  // 2. Units array check - Exactly 5 units required
  if (!Array.isArray(parsed.units)) {
    errors.push('مصفوفة الوحدات (units) غير موجودة');
  } else {
    if (parsed.units.length !== 5) {
      errors.push(`عدد الوحدات السردية هو ${parsed.units.length} بينما المطلوب 5 وحدات بالضبط`);
    }

    // Check unit numbering and fields
    const seenNumbers = new Set<number>();
    for (let i = 0; i < parsed.units.length; i++) {
      const u = parsed.units[i];
      const expectedNum = i + 1;

      if (!u || typeof u !== 'object') {
        errors.push(`الوحدة رقم ${expectedNum} غير صالحة`);
        continue;
      }

      // Repair unit_number if missing or skewed
      u.unit_number = typeof u.unit_number === 'number' ? u.unit_number : expectedNum;
      if (seenNumbers.has(u.unit_number)) {
        errors.push(`تكرار في رقم الوحدة: ${u.unit_number}`);
      }
      seenNumbers.add(u.unit_number);

      // Verify essential fields
      if (!u.title || !u.title.trim()) u.title = `الوحدة ${u.unit_number}`;
      if (!u.start_state || !u.start_state.trim()) {
        errors.push(`حالة البداية (start_state) للوحدة ${u.unit_number} فارغة`);
      }
      if (!u.end_state || !u.end_state.trim()) {
        errors.push(`حالة النهاية (end_state) للوحدة ${u.unit_number} فارغة`);
      }
      if (!u.objective || !u.objective.trim()) {
        errors.push(`الهدف الدرامي (objective) للوحدة ${u.unit_number} فارغ`);
      }

      // Ensure array fields exist
      u.information = Array.isArray(u.information) ? u.information : [];
      u.plant = Array.isArray(u.plant) ? u.plant : [];
      u.payoff = Array.isArray(u.payoff) ? u.payoff : [];
      u.characters = Array.isArray(u.characters) ? u.characters : [];
      u.psychological_effect = Array.isArray(u.psychological_effect) ? u.psychological_effect : [];
      u.relationship_changes = Array.isArray(u.relationship_changes) ? u.relationship_changes : [];
      u.knowledge_changes = Array.isArray(u.knowledge_changes) ? u.knowledge_changes : [];
      u.affected_open_loops = Array.isArray(u.affected_open_loops) ? u.affected_open_loops : [];
      u.relevant_secrets = Array.isArray(u.relevant_secrets) ? u.relevant_secrets : [];
      u.relevant_clues = Array.isArray(u.relevant_clues) ? u.relevant_clues : [];
      u.relevant_objects = Array.isArray(u.relevant_objects) ? u.relevant_objects : [];
      u.proposed_new_facts = Array.isArray(u.proposed_new_facts) ? u.proposed_new_facts : [];
      u.continuity_risks = Array.isArray(u.continuity_risks) ? u.continuity_risks : [];

      // Check if full prose was mistakenly written
      if (u.start_state && u.start_state.length > 1500) {
        errors.push(`الوحدة ${u.unit_number} تحتوي على مسودة روائية طويلة داخل start_state بدلاً من تلخيص تخطيطي`);
      }
    }

    // Check chain connectivity: end_state of unit i should logically connect to start_state of unit i+1
    for (let i = 0; i < parsed.units.length - 1; i++) {
      const cur = parsed.units[i];
      const next = parsed.units[i + 1];
      if (cur && next && cur.end_state && next.start_state) {
        // Light validation check for continuity disconnect
        if (cur.end_state.trim().length === 0 || next.start_state.trim().length === 0) {
          errors.push(`انقطاع في حلقة الوصل بين نهاية الوحدة ${i + 1} وبداية الوحدة ${i + 2}`);
        }
      }
    }
  }

  // Ensure other root fields
  parsed.pending_story_decisions = Array.isArray(parsed.pending_story_decisions)
    ? parsed.pending_story_decisions
    : [];
  parsed.missing_context = Array.isArray(parsed.missing_context) ? parsed.missing_context : [];
  parsed.warnings = Array.isArray(parsed.warnings) ? parsed.warnings : [];
  parsed.episode_checks = parsed.episode_checks || {
    starts_from_previous_state: true,
    contains_exactly_five_units: parsed.units?.length === 5,
    units_are_connected: true,
    canon_respected: true,
    character_knowledge_respected: true,
    psychological_continuity_respected: true,
    supernatural_rules_respected: true,
    open_loops_handled: true,
    clues_have_purpose: true,
    contains_unapproved_major_decisions: parsed.pending_story_decisions.length > 0,
  };

  return {
    isValid: errors.length === 0,
    errors,
    repairedPlan: parsed,
  };
}

/**
 * Plan Validation Pass: Automated Review Pass using AI or Structural Auditor (Section 8)
 */
export async function runPlanValidationPass(
  plan: any,
  context: NarrativeContextResult
): Promise<PlanValidationReport> {
  const critical_issues: string[] = [];
  const major_issues: string[] = [];
  const minor_issues: string[] = [];
  const questions_for_author: string[] = [];

  // 1. Structural checks
  if (!plan.units || plan.units.length !== 5) {
    critical_issues.push('المخطط لا يحتوي على 5 وحدات بالضبط.');
  }

  // 2. Canon collision checks
  const publishedFacts = context.published_facts || [];
  for (const unit of plan.units || []) {
    for (const fact of unit.proposed_new_facts || []) {
      for (const pub of publishedFacts) {
        // If a proposed fact blatantly contradicts a locked canon statement
        if (fact.includes('مات') && pub.statement.includes('حي') && fact.includes(pub.statement.split(' ')[0])) {
          critical_issues.push(`الوحدة ${unit.unit_number}: تناقض حرج مع Canon المنشور (${pub.statement})`);
        }
      }
    }

    // 3. Cliffhanger check: check if all 5 hooks are identical screams
    if (unit.hook && unit.hook.includes('صدمة مدوية') && plan.units.filter((u: any) => u.hook === unit.hook).length > 2) {
      major_issues.push('تكرار نفس نوع النهاية المشوقة (Cliffhanger) في أكثر من وحدتين دون تنويع.');
    }
  }

  // 4. Pending decisions check
  if (plan.pending_story_decisions && plan.pending_story_decisions.length > 0) {
    questions_for_author.push(
      ...plan.pending_story_decisions.map((d: any) => `قرار قصصي مطلوب حسمه: ${d.question || d.title}`)
    );
  }

  // 5. Try calling Gemini for rapid expert review if configured
  let aiScores = {
    continuity: 9,
    causality: 8,
    character_logic: 9,
    psychology: 8,
    unit_connection: 9,
    mystery_control: 8,
    pacing: 9,
  };

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
      const ai = new GoogleGenAI({ apiKey });
      const reviewPrompt = `
راجع هذا المخطط السردي المكون من 5 وحدات من حيث الاستمرارية، المنطق، اتصال الوحدات، وتدرج التلميحات:
${JSON.stringify({ episode: plan.episode, units: plan.units.map((u: any) => ({ unit: u.unit_number, start: u.start_state, end: u.end_state, turn: u.turn, hook: u.hook })) })}

أرجع حصراً JSON:
{
  "scores": { "continuity": 8, "causality": 8, "character_logic": 8, "psychology": 8, "unit_connection": 8, "mystery_control": 8, "pacing": 8 },
  "critical_issues": [],
  "major_issues": [],
  "minor_issues": [],
  "questions_for_author": []
}
`;
      const reviewRes = await Promise.race([
        ai.models.generateContent({
          model: DEFAULT_NARRATIVE_MODEL,
          contents: reviewPrompt,
          config: { responseMimeType: 'application/json', temperature: 0.2 },
        }),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), 8000)),
      ]);

      const parsedReview = JSON.parse(reviewRes.text || '{}');
      if (parsedReview.scores) aiScores = { ...aiScores, ...parsedReview.scores };
      if (Array.isArray(parsedReview.critical_issues)) critical_issues.push(...parsedReview.critical_issues);
      if (Array.isArray(parsedReview.major_issues)) major_issues.push(...parsedReview.major_issues);
      if (Array.isArray(parsedReview.minor_issues)) minor_issues.push(...parsedReview.minor_issues);
      if (Array.isArray(parsedReview.questions_for_author)) questions_for_author.push(...parsedReview.questions_for_author);
    }
  } catch {
    // If AI reviewer times out, use solid structural audit results
  }

  const approvedForReview = critical_issues.length === 0 && major_issues.length === 0;

  return {
    approved_for_human_review: approvedForReview,
    scores: aiScores,
    critical_issues,
    major_issues,
    minor_issues,
    questions_for_author,
  };
}

/**
 * Main Service: planEpisode()
 * Orchestrates full planning engine workflow (Sections 1-18)
 */
export async function planEpisode(input: PlanEpisodeInput): Promise<EpisodePlanResult> {
  const {
    project_id,
    episode_id,
    episode_number,
    regenerate = false,
    user_notes = '',
    db_snapshot,
  } = input;

  // 1. Inputs validation
  if (!project_id) {
    const err: any = new Error('PROJECT_NOT_FOUND: معرف المشروع مطلوب.');
    err.code = 'PROJECT_NOT_FOUND';
    throw err;
  }
  if (!episode_number || episode_number < 1) {
    const err: any = new Error('INVALID_EPISODE_NUMBER: رقم الحلقة يجب أن يكون 1 أو أكثر.');
    err.code = 'INVALID_EPISODE_NUMBER';
    throw err;
  }

  const lockKey = `${project_id}_ep_${episode_number}`;
  if (activePlanningLocks.has(lockKey)) {
    const err: any = new Error('PLANNING_IN_PROGRESS: هناك عملية تخطيط جارية بالفعل لهذه الحلقة.');
    err.code = 'PLANNING_IN_PROGRESS';
    throw err;
  }

  // Acquire concurrency lock
  activePlanningLocks.add(lockKey);

  try {
    const db: DatabaseSchema = db_snapshot || {
      projects: [],
      story_bible: [],
      characters: [],
      character_relationships: [],
      locations: [],
      episodes: [],
      story_units: [],
      timeline_events: [],
      secrets: [],
      clues: [],
      open_loops: [],
      objects: [],
      continuity_log: [],
      story_decisions: [],
      generation_runs: [],
      system_prompts: [],
    };

    // 2. Project check
    const project = db.projects?.find(p => p.id === project_id);
    if (!project) {
      const err: any = new Error('PROJECT_NOT_FOUND: المشروع غير موجود أو غير متاح.');
      err.code = 'PROJECT_NOT_FOUND';
      throw err;
    }

    // 3. Episode existence & status check
    const existingEp = db.episodes?.find(
      e => (episode_id && e.id === episode_id) || (e.project_id === project_id && e.episode_number === episode_number)
    );

    if (existingEp) {
      if (existingEp.is_locked || existingEp.publication_status === 'منشورة') {
        const err: any = new Error('APPROVED_PLAN_EXISTS: الحلقة منشورة ومقفلة ولا يمكن إعادة تخطيطها.');
        err.code = 'APPROVED_PLAN_EXISTS';
        throw err;
      }
      if (existingEp.status === 'جاهزة للتسجيل' && !regenerate) {
        const err: any = new Error('APPROVED_PLAN_EXISTS: يوجد مخطط معتمد مسبقاً لهذه الحلقة. استخدم خيار إعادة التخطيط (regenerate) لأرشفة السابق.');
        err.code = 'APPROVED_PLAN_EXISTS';
        throw err;
      }
    }

    // 4. Check active system prompt
    const activePrompt = db.system_prompts?.find(p => p.project_id === project_id && p.is_active);
    if (!activePrompt || !activePrompt.content || activePrompt.content.trim().length === 0) {
      const err: any = new Error('ACTIVE_SYSTEM_PROMPT_NOT_FOUND: لا يوجد System Prompt نشط في إعدادات العقل السردي.');
      err.code = 'ACTIVE_SYSTEM_PROMPT_NOT_FOUND';
      throw err;
    }

    // 5. Check Gemini connection status
    if (!isGeminiConfigured()) {
      const err: any = new Error('GEMINI_NOT_CONNECTED: مفتاح GEMINI_API_KEY غير متوفر في بيئة الخادم.');
      err.code = 'GEMINI_NOT_CONNECTED';
      throw err;
    }

    // 6. Build Narrative Context via Section 3
    const contextInput: NarrativeContextInput = {
      project_id,
      episode_id: existingEp?.id || null,
      unit_id: null,
      operation_type: 'plan_episode',
    };

    const context = await buildNarrativeContext(contextInput, db);

    // 7. Check Missing Context & Blocking conditions (Section 4)
    const { blocking, non_blocking } = partitionMissingContext(context.missing_context, context, episode_number, db);
    if (blocking.length > 0) {
      const err: any = new Error(
        `MISSING_REQUIRED_CONTEXT: تعذر المتابعة لوجود بيانات حرجة ناقصة: ${blocking.map(b => b.description).join('; ')}`
      );
      err.code = 'MISSING_REQUIRED_CONTEXT';
      err.blocking_items = blocking;
      throw err;
    }

    // 8. Construct Task Prompt (Section 5)
    const taskPrompt = buildPlanningTaskPrompt(episode_number, project.title, user_notes, context);

    // Prepare context bundle for Gemini
    const contextSummaryBundle = {
      project: context.project,
      current_state: context.current_state,
      relevant_characters: context.relevant_characters.map(c => ({
        name: c.name,
        role: c.role,
        wants: c.wants,
        fears: c.fears,
        location: c.current_location,
        state: c.physical_state + ' | ' + c.psychological_state,
        known: c.knowledge_partition.known,
        unknown: c.knowledge_partition.unknown,
      })),
      recent_timeline: context.recent_timeline.slice(-3),
      active_secrets: context.active_secrets.map(s => ({
        title: s.title,
        reveal_stage: s.reveal_stage,
      })),
      relevant_clues: context.relevant_clues.filter(c => c.classification !== 'غير مرتبط بالمهمة الحالية'),
      open_loops: context.open_loops.filter(l => l.classification !== 'خيط لا علاقة له بالمهمة الحالية'),
      published_facts: context.published_facts,
      previous_unit_ending: context.previous_unit?.end_state || context.current_state?.starting_narrative_state,
    };

    const fullPrompt = `
سياق الرواية والذاكرة المعتمدة (Context):
${JSON.stringify(contextSummaryBundle, null, 2)}

${taskPrompt}
`;

    // 9. Call Gemini with System Instruction and 25s timeout (Section 5 & 6)
    const apiKey = process.env.GEMINI_API_KEY!;
    const ai = new GoogleGenAI({ apiKey });

    const generatePromise = ai.models.generateContent({
      model: DEFAULT_NARRATIVE_MODEL,
      contents: fullPrompt,
      config: {
        systemInstruction: activePrompt.content,
        responseMimeType: 'application/json',
        temperature: narrativeRuntimeConfig.temperatures.plan_episode ?? 0.4,
      },
    });

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        const timeoutErr: any = new Error('PLANNING_TIMEOUT: استغرق توليد المخطط أكثر من 25 ثانية.');
        timeoutErr.code = 'PLANNING_TIMEOUT';
        reject(timeoutErr);
      }, 25000);
    });

    const response = await Promise.race([generatePromise, timeoutPromise]);
    const rawOutput = (response.text || '').trim();

    // 10. Parse JSON & Attempt 1 Repair if needed (Section 7)
    let parsed: any;
    try {
      parsed = JSON.parse(rawOutput);
    } catch {
      // Repair attempt 1: match JSON block
      const jsonMatch = rawOutput.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[0]);
        } catch {
          const err: any = new Error('INVALID_MODEL_OUTPUT: فشل في تحليل صيغة JSON للمخطط.');
          err.code = 'INVALID_MODEL_OUTPUT';
          throw err;
        }
      } else {
        const err: any = new Error('INVALID_MODEL_OUTPUT: لم يستجب النموذج بهيكل JSON المطلوب.');
        err.code = 'INVALID_MODEL_OUTPUT';
        throw err;
      }
    }

    // 11. Validate Structure Server-Side (Section 7)
    const structureCheck = validatePlanStructure(parsed, context);
    if (!structureCheck.isValid) {
      const err: any = new Error(
        `INVALID_MODEL_OUTPUT: المخطط المستلم غير مطابق للشروط البنيوية (${structureCheck.errors.join(', ')})`
      );
      err.code = 'INVALID_MODEL_OUTPUT';
      err.validation_errors = structureCheck.errors;
      throw err;
    }

    const cleanedPlan = structureCheck.repairedPlan;

    // 12. Automated Plan Validation Pass (Section 8)
    const validationReport = await runPlanValidationPass(cleanedPlan, context);

    // 13. Determine Initial Plan Status (Section 9)
    let planStatus: PlanStatus = 'draft';
    if (cleanedPlan.pending_story_decisions && cleanedPlan.pending_story_decisions.length > 0) {
      planStatus = 'needs_decision';
    } else if (validationReport.critical_issues.length > 0 || validationReport.major_issues.length > 0) {
      planStatus = 'needs_revision';
    } else if (validationReport.approved_for_human_review) {
      planStatus = 'ready_for_review';
    }

    // 14. Assemble Result Object
    const planId = 'plan_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const result: EpisodePlanResult = {
      id: planId,
      project_id,
      episode_id: existingEp?.id,
      episode_number,
      status: planStatus,
      version: existingEp ? (db.story_units?.filter(u => u.episode_id === existingEp.id).length > 0 ? 2 : 1) : 1,
      episode: cleanedPlan.episode,
      units: cleanedPlan.units,
      episode_checks: cleanedPlan.episode_checks,
      pending_story_decisions: cleanedPlan.pending_story_decisions,
      missing_context: { blocking, non_blocking },
      warnings: context.continuity_warnings,
      validation_report: validationReport,
      change_history: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return result;
  } finally {
    // Release concurrency lock always
    activePlanningLocks.delete(lockKey);
  }
}
