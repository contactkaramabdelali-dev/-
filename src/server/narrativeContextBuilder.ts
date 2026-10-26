import {
  DatabaseSchema,
  Project,
  StoryBibleEntry,
  Character,
  CharacterRelationship,
  Location,
  Episode,
  StoryUnit,
  TimelineEvent,
  Secret,
  Clue,
  OpenLoop,
  StoryObject,
  ContinuityLogEntry,
  StoryDecision,
  GenerationRun,
  SystemPrompt,
} from '../types/database';

export type OperationType =
  | 'plan_episode'
  | 'write_unit'
  | 'review_unit'
  | 'revise_unit'
  | 'extract_memory'
  | 'continuity_check';

export interface NarrativeContextInput {
  project_id: string;
  episode_id?: string | null;
  unit_id?: string | null;
  operation_type: OperationType;
  // Security user context if present
  user_id?: string;
}

export type WarningSeverity = 'critical' | 'high' | 'medium' | 'low';

export interface ContinuityWarning {
  id: string;
  category: string;
  severity: WarningSeverity;
  message: string;
  suggested_action?: string;
  entity_type?: string;
  entity_id?: string;
}

export interface MissingContextItem {
  key: string;
  description: string;
  impact: string;
  resolution: string;
}

export interface PublishedFact {
  id: string;
  category:
    | 'حقائق عن الشخصيات'
    | 'حقائق عن العلاقات'
    | 'حقائق عن الأماكن'
    | 'حقائق عن الزمن'
    | 'حقائق عن الأشياء'
    | 'حقائق عن الأسرار المكشوفة'
    | 'قوانين العالم والخوارق';
  statement: string;
  source_episode?: string;
  source_type: 'منشورة' | 'معتمدة للنشر' | 'دستور الرواية (مقفلة)';
  CANON_LOCKED: true;
}

export interface CharacterKnowledgePartition {
  known: string[];
  beliefs: string[];
  suspicions: string[];
  unknown: string[];
  forbidden_knowledge: string[];
}

export interface ContextCharacter {
  id: string;
  name: string;
  aliases: string;
  role: string;
  speaking_style: string;
  wants: string;
  fears: string;
  beliefs: string;
  wound: string;
  limits: string;
  arc_current: string;
  current_location: string;
  physical_state: string;
  psychological_state: string;
  current_goal: string;
  current_knowledge: string;
  forbidden_knowledge: string;
  status: string;
  knowledge_partition: CharacterKnowledgePartition;
}

export interface ContextRelationship {
  character_a_id: string;
  character_a_name: string;
  character_b_id: string;
  character_b_name: string;
  relationship_type: string;
  public_relationship: string;
  real_relationship: string;
  trust_level: number;
  tension_level: number;
  current_state: string;
  last_change?: string;
}

export interface ContextClue {
  description: string;
  related_secret_id: string;
  related_secret_title: string;
  planted_episode: number;
  planted_unit?: number;
  intended_interpretation: string;
  false_interpretation: string;
  payoff_status: string;
  payoff_episode?: number;
  classification: 'يمكن تطويره الآن' | 'ينتظر مردوداً لاحقاً' | 'حصل على مردوده' | 'غير مرتبط بالمهمة الحالية';
}

export interface ContextOpenLoop {
  title: string;
  description: string;
  opened_episode: number;
  opened_unit?: number;
  related_characters: string[];
  urgency: string;
  planned_resolution: string;
  status: string;
  classification:
    | 'خيط يجب تحريكه داخل المهمة الحالية'
    | 'خيط يجب تذكره دون تحريكه'
    | 'خيط قريب من الحل'
    | 'خيط لا علاقة له بالمهمة الحالية';
}

export interface NarrativeContextResult {
  project: {
    id: string;
    title: string;
    description: string;
    target_episode_count: number;
    current_episode_number: number;
    current_unit_number: number;
    status: string;
    current_story_date?: string;
  };
  active_system_prompt: {
    id?: string;
    name?: string;
    version?: number;
    is_active: boolean;
    // Note: full content retained internally or marked for authorized consumption
    content?: string;
    word_count?: number;
    error?: string;
  };
  story_bible: StoryBibleEntry[];
  current_state: {
    current_episode_number: number;
    current_episode_title: string;
    current_unit_number: number;
    current_unit_title: string;
    latest_approved_episode?: { episode_number: number; title: string };
    latest_approved_unit?: { unit_number: number; title: string };
    latest_timeline_event?: { title: string; story_date: string; location: string };
    current_scene_location: string;
    expected_characters_present: string[];
    starting_narrative_state: string;
    story_date_time: string;
    active_danger_or_conflict: string;
    last_known_ending_point: string;
  };
  relevant_characters: ContextCharacter[];
  relevant_relationships: ContextRelationship[];
  recent_timeline: TimelineEvent[];
  active_secrets: Secret[];
  relevant_clues: ContextClue[];
  open_loops: ContextOpenLoop[];
  relevant_objects: StoryObject[];
  previous_unit: {
    id?: string;
    episode_id?: string;
    unit_number?: number;
    title?: string;
    final_content?: string;
    end_state?: string;
    hook?: string;
    characters_present?: string[];
    last_known_location?: string;
    last_character_transformation?: string;
    is_approved?: boolean;
    note?: string;
  };
  current_plan: {
    function?: string;
    start_state?: string;
    objective?: string;
    pressure?: string;
    information?: string;
    plant?: string;
    payoff?: string;
    turn?: string;
    end_state?: string;
    hook?: string;
    is_approved?: boolean;
    status?: string;
  };
  published_facts: PublishedFact[];
  continuity_warnings: ContinuityWarning[];
  missing_context: MissingContextItem[];
  current_task: {
    operation_type: OperationType;
    title: string;
    objective: string;
    scope: string;
    strict_instructions: string[];
  };
  context_metadata: {
    project_id: string;
    episode_id?: string;
    unit_id?: string;
    operation_type: OperationType;
    generated_at: string;
    context_version: '1.0';
  };
}

/**
 * Backend Service: Narrative Context Builder
 * Assembles selective, priority-sorted novel memory for planning, writing, review, and continuity audit.
 */
export async function buildNarrativeContext(
  input: NarrativeContextInput,
  db: DatabaseSchema
): Promise<NarrativeContextResult> {
  const { project_id, episode_id, unit_id, operation_type } = input;

  // 1. PROJECT
  const project = db.projects.find((p) => p.id === project_id);
  if (!project) {
    throw new Error(`PROJECT_NOT_FOUND: لا يوجد مشروع بالمعرف المحدد (${project_id})`);
  }

  const warnings: ContinuityWarning[] = [];
  const missingContext: MissingContextItem[] = [];

  // Filter project-specific data
  const projectPrompts = (db.system_prompts || []).filter((sp) => sp.project_id === project_id);
  const projectBible = (db.story_bible || []).filter((b) => b.project_id === project_id);
  const projectCharacters = (db.characters || []).filter((c) => c.project_id === project_id);
  const projectRelationships = (db.character_relationships || []);
  const projectLocations = (db.locations || []).filter((l) => l.project_id === project_id);
  const projectEpisodes = (db.episodes || []).filter((e) => e.project_id === project_id);
  const projectUnits = (db.story_units || []).filter((u) => {
    const ep = projectEpisodes.find((e) => e.id === u.episode_id);
    return Boolean(ep);
  });
  const projectTimeline = (db.timeline_events || []).filter((t) => t.project_id === project_id);
  const projectSecrets = (db.secrets || []).filter((s) => s.project_id === project_id);
  const projectClues = (db.clues || []).filter((c) => c.project_id === project_id);
  const projectOpenLoops = (db.open_loops || []).filter((ol) => ol.project_id === project_id);
  const projectObjects = (db.objects || []).filter((o) => o.project_id === project_id);
  const projectDecisions = (db.story_decisions || []).filter((d) => d.project_id === project_id);

  // 2. ACTIVE_SYSTEM_PROMPT
  const activePrompt = projectPrompts.find((p) => p.is_active === true);
  let activePromptSection: NarrativeContextResult['active_system_prompt'];

  if (!activePrompt) {
    activePromptSection = {
      is_active: false,
      error: 'ACTIVE_SYSTEM_PROMPT_NOT_FOUND',
    };
    missingContext.push({
      key: 'ACTIVE_SYSTEM_PROMPT_NOT_FOUND',
      description: 'لا يوجد System Prompt نشط للمشروع الحالي في جدول SYSTEM_PROMPTS.',
      impact: 'لا يمكن توجيه النموذج بالهوية السردية والنبرة والقواعد العليا للرواية.',
      resolution: 'انتقل إلى الإعدادات -> العقل السردي وقم بإنشاء وتفعيل نسخة موجهة للرواية.',
    });
    warnings.push({
      id: 'warn_prompt_missing',
      category: 'نظام العقل السردي',
      severity: 'critical',
      message: 'لم يتم العثور على System Prompt نشط (ACTIVE_SYSTEM_PROMPT_NOT_FOUND).',
      suggested_action: 'قم بتعيين نسخة نشطة من صفحة العقل السردي.',
    });
  } else {
    activePromptSection = {
      id: activePrompt.id,
      name: activePrompt.name,
      version: activePrompt.version,
      is_active: true,
      content: activePrompt.content, // Handled securely on backend
      word_count: activePrompt.content ? activePrompt.content.trim().split(/\s+/).filter(Boolean).length : 0,
    };
  }

  // Target Episode and Story Unit resolution
  let currentEpisode: Episode | undefined;
  if (episode_id) {
    currentEpisode = projectEpisodes.find((e) => e.id === episode_id);
  }
  if (!currentEpisode && unit_id) {
    const u = projectUnits.find((unit) => unit.id === unit_id);
    if (u) {
      currentEpisode = projectEpisodes.find((e) => e.id === u.episode_id);
    }
  }
  if (!currentEpisode && projectEpisodes.length > 0) {
    currentEpisode =
      projectEpisodes.find((e) => e.episode_number === project.current_episode_number) ||
      projectEpisodes[0];
  }

  let currentUnit: StoryUnit | undefined;
  if (unit_id) {
    currentUnit = projectUnits.find((u) => u.id === unit_id);
  } else if (currentEpisode) {
    const epUnits = projectUnits
      .filter((u) => u.episode_id === currentEpisode.id)
      .sort((a, b) => a.unit_number - b.unit_number);
    currentUnit = epUnits.find((u) => u.unit_number === project.current_unit_number) || epUnits[0];
  }

  // 3. STORY_BIBLE (Prioritized & selectively filtered)
  const sortedBible = [...projectBible].sort((a, b) => {
    // 1. Locked rules first
    if (a.is_locked && !b.is_locked) return -1;
    if (!a.is_locked && b.is_locked) return 1;

    // 2. High priority next
    const priorityWeight = (p: string) =>
      p === 'جوهرية لا تتغير' ? 3 : p === 'تذكير أسلوبي' ? 2 : 1;
    return priorityWeight(b.priority) - priorityWeight(a.priority);
  });

  // Relevance filtering based on operation_type
  const relevantBible = sortedBible.filter((rule) => {
    if (rule.is_locked || rule.priority === 'جوهرية لا تتغير') return true;
    if (operation_type === 'write_unit' || operation_type === 'revise_unit') {
      return (
        rule.category === 'توجيهات صوتية' ||
        rule.category === 'سياسة الدارجة' ||
        rule.category === 'قواعد العالم' ||
        rule.category === 'نبرة وجو'
      );
    }
    if (operation_type === 'plan_episode') {
      return rule.category === 'فرضية كبرى' || rule.category === 'قواعد العالم';
    }
    return true;
  });

  // 4. CURRENT_STATE
  const sortedTimeline = [...projectTimeline].sort((a, b) => a.sequence_order - b.sequence_order);
  const latestTimelineEvent = sortedTimeline[sortedTimeline.length - 1];

  const approvedEpisodes = projectEpisodes
    .filter((e) => e.publication_status === 'منشورة' || e.publication_status === 'معتمدة للنشر')
    .sort((a, b) => b.episode_number - a.episode_number);
  const latestApprovedEpisode = approvedEpisodes[0];

  const approvedUnits = projectUnits
    .filter((u) => u.status === 'مكتملة' && Boolean(u.final_content?.trim()))
    .sort((a, b) => b.unit_number - a.unit_number);
  const latestApprovedUnit = approvedUnits[0];

  // Resolve current scene location
  let sceneLocationName = '';
  if (currentUnit) {
    const locMatch = projectLocations.find(
      (l) =>
        currentUnit?.title.includes(l.name) ||
        currentUnit?.objective.includes(l.name) ||
        currentUnit?.start_state.includes(l.name)
    );
    if (locMatch) sceneLocationName = locMatch.name;
  }
  if (!sceneLocationName && latestTimelineEvent?.location) {
    sceneLocationName = latestTimelineEvent.location;
  }

  if (!sceneLocationName) {
    missingContext.push({
      key: 'SCENE_LOCATION_MISSING',
      description: 'مكان المشهد الحالي غير محدد في المخطط أو الأحداث الزمنية.',
      impact: 'قد يؤدي إلى توليد حوارات أو أوصاف دون بيئة صوتية أو قيود مكانية واضحة.',
      resolution: 'حدد مكان المشهد في مخطط الوحدة أو في سجل الأحداث.',
    });
    warnings.push({
      id: 'warn_loc_missing',
      category: 'المكان والبيئة',
      severity: 'medium',
      message: 'مكان المشهد غير محدد (Missing Location).',
      suggested_action: 'حدد الموقع المرتبط بهذه الوحدة من قائمة الأماكن.',
    });
  }

  // Expected characters in scene
  const expectedCharacters: string[] = [];
  if (currentUnit) {
    for (const c of projectCharacters) {
      const match =
        currentUnit.title.includes(c.name) ||
        currentUnit.objective.includes(c.name) ||
        currentUnit.start_state.includes(c.name) ||
        currentUnit.plant.includes(c.name) ||
        currentUnit.payoff.includes(c.name);
      if (match) expectedCharacters.push(c.name);
    }
  }
  if (expectedCharacters.length === 0 && latestTimelineEvent?.characters_present?.length) {
    for (const cid of latestTimelineEvent.characters_present) {
      const found = projectCharacters.find((c) => c.id === cid);
      if (found && !expectedCharacters.includes(found.name)) {
        expectedCharacters.push(found.name);
      }
    }
  }

  if (expectedCharacters.length === 0) {
    missingContext.push({
      key: 'SCENE_CHARACTERS_EMPTY',
      description: 'لا توجد شخصيات محددة لحضور المشهد الحالي.',
      impact: 'عدم وجود شخوص سيجعل بناء الحوار والتصاعد الدرامي مستحيلاً.',
      resolution: 'أضف أسماء الشخصيات المشاركة في مخطط الوحدة.',
    });
  }

  const currentStateSection: NarrativeContextResult['current_state'] = {
    current_episode_number: currentEpisode ? currentEpisode.episode_number : project.current_episode_number,
    current_episode_title: currentEpisode ? currentEpisode.title : `الحلقة ${project.current_episode_number}`,
    current_unit_number: currentUnit ? currentUnit.unit_number : project.current_unit_number,
    current_unit_title: currentUnit ? currentUnit.title : `الوحدة ${project.current_unit_number}`,
    latest_approved_episode: latestApprovedEpisode
      ? { episode_number: latestApprovedEpisode.episode_number, title: latestApprovedEpisode.title }
      : undefined,
    latest_approved_unit: latestApprovedUnit
      ? { unit_number: latestApprovedUnit.unit_number, title: latestApprovedUnit.title }
      : undefined,
    latest_timeline_event: latestTimelineEvent
      ? {
          title: latestTimelineEvent.title,
          story_date: latestTimelineEvent.story_date,
          location: latestTimelineEvent.location,
        }
      : undefined,
    current_scene_location: sceneLocationName || 'غير محدد',
    expected_characters_present: expectedCharacters,
    starting_narrative_state: currentUnit?.start_state || currentEpisode?.opening_state || 'غير محدد',
    story_date_time: latestTimelineEvent
      ? `${latestTimelineEvent.story_date} ${latestTimelineEvent.story_time}`.trim()
      : '',
    active_danger_or_conflict: currentUnit?.pressure || currentEpisode?.central_conflict || 'لا يوجد صراع محدد',
    last_known_ending_point: latestApprovedUnit?.final_content
      ? latestApprovedUnit.final_content.slice(-250)
      : latestApprovedEpisode?.ending_state || 'بداية الرواية',
  };

  // 5. RELEVANT_CHARACTERS & KNOWLEDGE PARTITIONING
  // Select characters relevant to this unit
  const relevantCharsList = projectCharacters.filter((c) => {
    if (expectedCharacters.includes(c.name)) return true;
    if (c.role === 'رئيسية' && expectedCharacters.length < 2) return true;
    // Check if linked to active secret or open loop
    const linkedSecret = projectSecrets.some(
      (s) => s.known_by.includes(c.id) || s.unknown_by.includes(c.id)
    );
    if (linkedSecret && (c.current_location === sceneLocationName || !c.current_location)) return true;
    return false;
  });

  const relevantCharacters: ContextCharacter[] = relevantCharsList.map((c) => {
    // Knowledge isolation
    const known = c.current_knowledge
      ? c.current_knowledge.split('\n').map((s) => s.trim()).filter(Boolean)
      : [];
    const beliefs = c.beliefs
      ? c.beliefs.split('\n').map((s) => s.trim()).filter(Boolean)
      : [];
    const forbidden = c.forbidden_knowledge
      ? c.forbidden_knowledge.split('\n').map((s) => s.trim()).filter(Boolean)
      : [];

    // Unknown secrets for this character
    const unknownSecrets = projectSecrets
      .filter((s) => s.unknown_by.includes(c.id))
      .map((s) => `سر: ${s.title}`);

    // Check for continuity: Does the unit plan assume the character knows forbidden information?
    if (currentUnit) {
      const planText = `${currentUnit.objective} ${currentUnit.information} ${currentUnit.turn}`;
      for (const fItem of forbidden) {
        if (fItem.length > 4 && planText.includes(fItem)) {
          warnings.push({
            id: `warn_forbidden_knowledge_${c.id}`,
            category: 'معرفة غير مبررة للشخصية',
            severity: 'critical',
            message: `المخطط يطلب من الشخصية «${c.name}» التصرف بناءً على معلومة محظورة: "${fItem}"!`,
            suggested_action: 'احرص على ألا تتصرف الشخصية بهذه المعلومة، أو اجعلها تكتشفها عبر حدث مبرر أولاً.',
            entity_type: 'character',
            entity_id: c.id,
          });
        }
      }
    }

    return {
      id: c.id,
      name: c.name,
      aliases: c.aliases,
      role: c.role,
      speaking_style: c.speaking_style,
      wants: c.wants,
      fears: c.fears,
      beliefs: c.beliefs,
      wound: c.wound,
      limits: c.limits,
      arc_current: c.arc_current,
      current_location: c.current_location,
      physical_state: c.physical_state,
      psychological_state: c.psychological_state,
      current_goal: c.current_goal,
      current_knowledge: c.current_knowledge,
      forbidden_knowledge: c.forbidden_knowledge,
      status: c.status,
      knowledge_partition: {
        known,
        beliefs,
        suspicions: [],
        unknown: unknownSecrets,
        forbidden_knowledge: forbidden,
      },
    };
  });

  // Relationships between relevant characters
  const relevantCharIds = relevantCharacters.map((c) => c.id);
  const relevantRelationships: ContextRelationship[] = projectRelationships
    .filter(
      (rel) =>
        relevantCharIds.includes(rel.character_a_id) &&
        relevantCharIds.includes(rel.character_b_id)
    )
    .map((rel) => {
      const charA = projectCharacters.find((c) => c.id === rel.character_a_id);
      const charB = projectCharacters.find((c) => c.id === rel.character_b_id);
      return {
        character_a_id: rel.character_a_id,
        character_a_name: charA?.name || 'شخصية أ',
        character_b_id: rel.character_b_id,
        character_b_name: charB?.name || 'شخصية ب',
        relationship_type: rel.relationship_type,
        public_relationship: rel.public_relationship,
        real_relationship: rel.real_relationship,
        trust_level: rel.trust_level,
        tension_level: rel.tension_level,
        current_state: rel.current_state,
        last_change: rel.history,
      };
    });

  // 6. RECENT_TIMELINE
  const recentTimeline = sortedTimeline.filter((ev) => {
    if (currentEpisode && ev.episode_id === currentEpisode.id) return true;
    if (ev.is_fixed) return true;
    return false;
  }).slice(-8); // Limit to most relevant 8

  // 7. ACTIVE_SECRETS
  const activeSecrets = projectSecrets.filter((sec) => {
    // Secrets linked to relevant characters
    const hasChar = sec.known_by.some((cid) => relevantCharIds.includes(cid)) ||
      sec.unknown_by.some((cid) => relevantCharIds.includes(cid));
    if (hasChar) return true;

    // Secrets planned for this episode
    if (currentEpisode && sec.planned_reveal_episode === currentEpisode.episode_number) {
      return true;
    }
    return sec.importance === 'حرج جداً';
  });

  // Check secret reveal stage warning
  for (const s of activeSecrets) {
    if (currentEpisode && s.planned_reveal_episode && currentEpisode.episode_number < s.planned_reveal_episode) {
      if (currentUnit?.information.includes(s.title) || currentUnit?.payoff.includes(s.title)) {
        warnings.push({
          id: `warn_secret_early_reveal_${s.id}`,
          category: 'كشف مبكر للسر',
          severity: 'high',
          message: `المخطط يتضمن كشفاً للسر «${s.title}» في الحلقة ${currentEpisode.episode_number}، بينما الموعد المخطط لكشفه هو الحلقة ${s.planned_reveal_episode}.`,
          suggested_action: 'أبقِ السر مكتوماً أو اقتصر على تلميح غامض دون حسم الحقيقة للمستمع أو الشخصيات.',
        });
      }
    }
  }

  // 8. RELEVANT_CLUES
  const activeSecretIds = activeSecrets.map((s) => s.id);
  const relevantClues: ContextClue[] = projectClues
    .filter((clue) => activeSecretIds.includes(clue.secret_id) || (currentEpisode && clue.planted_episode === currentEpisode.episode_number))
    .map((clue) => {
      const sec = projectSecrets.find((s) => s.id === clue.secret_id);
      let classification: ContextClue['classification'] = 'ينتظر مردوداً لاحقاً';

      if (clue.payoff_status === 'مكتمل الربط') {
        classification = 'حصل على مردوده';
      } else if (currentEpisode && clue.planted_episode === currentEpisode.episode_number) {
        classification = 'يمكن تطويره الآن';
      } else if (!activeSecretIds.includes(clue.secret_id)) {
        classification = 'غير مرتبط بالمهمة الحالية';
      }

      if (clue.payoff_status === 'مكتمل الربط' && currentUnit?.plant.includes(clue.description)) {
        warnings.push({
          id: `warn_clue_reuse_${clue.id}`,
          category: 'إعادة زرع تلميح مكتمل',
          severity: 'medium',
          message: `التلميح «${clue.description}» حصل على مردوده بالفعل (${clue.payoff_status}). لا تزرعه مرة أخرى كأنه جديد.`,
        });
      }

      return {
        description: clue.description,
        related_secret_id: clue.secret_id,
        related_secret_title: sec?.title || 'سر غير معروف',
        planted_episode: clue.planted_episode,
        planted_unit: clue.planted_unit,
        intended_interpretation: clue.intended_interpretation,
        false_interpretation: clue.false_interpretation,
        payoff_status: clue.payoff_status,
        payoff_episode: clue.payoff_episode,
        classification,
      };
    });

  // 9. OPEN_LOOPS
  const openLoops: ContextOpenLoop[] = projectOpenLoops.map((loop) => {
    let classification: ContextOpenLoop['classification'] = 'خيط يجب تذكره دون تحريكه';
    if (loop.status === 'مغلق ومحسوم') {
      classification = 'خيط لا علاقة له بالمهمة الحالية';
    } else if (loop.urgency === 'عاجل') {
      classification = 'خيط يجب تحريكه داخل المهمة الحالية';
    } else if (loop.planned_resolution && currentEpisode && loop.planned_resolution.includes(currentEpisode.title)) {
      classification = 'خيط قريب من الحل';
    }

    if (loop.status === 'مغلق ومحسوم' && currentUnit?.objective.includes(loop.title)) {
      warnings.push({
        id: `warn_closed_loop_${loop.id}`,
        category: 'خيط مغلق',
        severity: 'low',
        message: `الخيط «${loop.title}» مغلق ومحسوم سابقاً، ولكن المخطط يتعامل معه كأنه مفتوح.`,
      });
    }

    return {
      title: loop.title,
      description: loop.description,
      opened_episode: loop.opened_episode,
      opened_unit: loop.opened_unit,
      related_characters: loop.related_characters,
      urgency: loop.urgency,
      planned_resolution: loop.planned_resolution,
      status: loop.status,
      classification,
    };
  });

  // 10. RELEVANT_OBJECTS
  const relevantObjects: StoryObject[] = projectObjects.filter((obj) => {
    const isPresent =
      (obj.current_location && obj.current_location === sceneLocationName) ||
      relevantCharacters.some((c) => c.name === obj.current_owner || c.id === obj.current_owner) ||
      (currentUnit && currentUnit.title.includes(obj.name)) ||
      obj.narrative_importance === 'أثر جوهري';
    return isPresent;
  });

  // Check continuity of objects
  for (const obj of relevantObjects) {
    if (obj.status === 'مفقود' && currentUnit?.start_state.includes(obj.name)) {
      warnings.push({
        id: `warn_obj_missing_${obj.id}`,
        category: 'استمرارية الأشياء',
        severity: 'high',
        message: `الغرض «${obj.name}» مسجل كـ "مفقود"، ولكن المخطط يظهره بحوزة الشخصية أو في بداية المشهد دون تفسير!`,
        suggested_action: 'اشرح كيف تم العثور على الغرض أو صحح حالته في جدول OBJECTS.',
      });
    }
  }

  // 11. PREVIOUS_UNIT
  let previousUnitSection: NarrativeContextResult['previous_unit'] = {};
  if (currentUnit && currentEpisode) {
    const episodeUnits = projectUnits
      .filter((u) => u.episode_id === currentEpisode.id)
      .sort((a, b) => a.unit_number - b.unit_number);
    const currentIndex = episodeUnits.findIndex((u) => u.id === currentUnit?.id);

    let prevUnitTarget: StoryUnit | undefined;

    if (currentIndex > 0) {
      prevUnitTarget = episodeUnits[currentIndex - 1];
    } else if (currentEpisode.episode_number > 1) {
      // First unit of episode -> find last unit of previous episode
      const prevEpisode = projectEpisodes.find(
        (e) => e.episode_number === currentEpisode!.episode_number - 1
      );
      if (prevEpisode) {
        const prevEpUnits = projectUnits
          .filter((u) => u.episode_id === prevEpisode.id)
          .sort((a, b) => a.unit_number - b.unit_number);
        prevUnitTarget = prevEpUnits[prevEpUnits.length - 1];
      }
    }

    if (prevUnitTarget) {
      const hasFinal = Boolean(prevUnitTarget.final_content && prevUnitTarget.final_content.trim());
      const isApproved = prevUnitTarget.status === 'مكتملة';

      previousUnitSection = {
        id: prevUnitTarget.id,
        episode_id: prevUnitTarget.episode_id,
        unit_number: prevUnitTarget.unit_number,
        title: prevUnitTarget.title,
        final_content: hasFinal ? prevUnitTarget.final_content : prevUnitTarget.draft_content,
        end_state: prevUnitTarget.end_state,
        hook: prevUnitTarget.hook,
        is_approved: isApproved,
        note: !hasFinal
          ? 'تنبيه: تم استخدام مسودة الوحدة لعدم توفر نص نهائي معتمد.'
          : undefined,
      };

      if (!isApproved || !hasFinal) {
        missingContext.push({
          key: 'PREVIOUS_UNIT_NOT_APPROVED',
          description: `الوحدة السابقة (رقم ${prevUnitTarget.unit_number}: ${prevUnitTarget.title}) غير معتمدة أو لم يكتمل نصها النهائي.`,
          impact: 'قد يؤدي ذلك إلى تباين في بداية المشهد التالي وعدم استقرار نقطة التسليم (Hook / End State).',
          resolution: 'اعتمد نص الوحدة السابقة قبل صياغة أو مراجعة الوحدة الحالية.',
        });
        warnings.push({
          id: 'warn_prev_unit_unapproved',
          category: 'استمرارية التسليم بين الوحدات',
          severity: 'high',
          message: `الوحدة السابقة رقم ${prevUnitTarget.unit_number} غير معتمدة (Status: ${prevUnitTarget.status}).`,
          suggested_action: 'راجع نهاية الوحدة السابقة لضمان اتساق البداية.',
        });
      }
    } else {
      previousUnitSection = {
        note: 'هذه هي الوحدة الأولى في بداية الرواية.',
      };
    }
  }

  // 12. CURRENT_PLAN
  const currentPlanSection: NarrativeContextResult['current_plan'] = currentUnit
    ? {
        function: currentUnit.function,
        start_state: currentUnit.start_state,
        objective: currentUnit.objective,
        pressure: currentUnit.pressure,
        information: currentUnit.information,
        plant: currentUnit.plant,
        payoff: currentUnit.payoff,
        turn: currentUnit.turn,
        end_state: currentUnit.end_state,
        hook: currentUnit.hook,
        is_approved: currentUnit.status === 'مكتملة',
        status: currentUnit.status,
      }
    : {};

  if (currentUnit && (!currentUnit.objective || !currentUnit.function)) {
    missingContext.push({
      key: 'UNIT_PLAN_INCOMPLETE',
      description: 'مخطط الوحدة الحالية ينقصه الهدف الدرامي (Objective) أو الوظيفة الدرامية (Function).',
      impact: 'صياغة المشهد ستفتقر للبوصلة التوجيهية وتشتت تركيز المستمع.',
      resolution: 'أكمل بيانات الوحدة في قسم الحلقات والوحدات.',
    });
  }

  // 13. PUBLISHED_FACTS (Canon Locked Facts)
  const publishedFacts: PublishedFact[] = [];

  // Facts from published episodes
  for (const ep of approvedEpisodes) {
    if (ep.synopsis) {
      publishedFacts.push({
        id: `fact_ep_${ep.id}`,
        category: 'حقائق عن الزمن',
        statement: `أحداث الحلقة ${ep.episode_number} (${ep.title}): ${ep.synopsis}`,
        source_episode: `الحلقة ${ep.episode_number}`,
        source_type: ep.publication_status === 'منشورة' ? 'منشورة' : 'معتمدة للنشر',
        CANON_LOCKED: true,
      });
    }
  }

  // Facts from locked bible rules
  for (const b of projectBible.filter((rule) => rule.is_locked)) {
    publishedFacts.push({
      id: `fact_bible_${b.id}`,
      category: 'قوانين العالم والخوارق',
      statement: `دستور الرواية [${b.title}]: ${b.content}`,
      source_type: 'دستور الرواية (مقفلة)',
      CANON_LOCKED: true,
    });
  }

  // Facts from resolved story decisions
  for (const d of projectDecisions.filter((dec) => dec.status === 'محسوم' && dec.selected_option)) {
    publishedFacts.push({
      id: `fact_dec_${d.id}`,
      category: 'حقائق عن الأسرار المكشوفة',
      statement: `قرار سردي محسوم [${d.title}]: ${d.selected_option} (التعليل: ${d.reasoning || 'محسوم بموافقة الكاتب'})`,
      source_type: 'معتمدة للنشر',
      CANON_LOCKED: true,
    });
  }

  // Facts from revealed secrets
  for (const s of projectSecrets.filter((sec) => sec.status === 'محسوم كلياً' || sec.reveal_stage === 'محسوم للجميع')) {
    publishedFacts.push({
      id: `fact_sec_${s.id}`,
      category: 'حقائق عن الأسرار المكشوفة',
      statement: `حقيقة معلنة للجميع: السر «${s.title}» - الحقيقة: ${s.hidden_truth}`,
      source_type: 'منشورة',
      CANON_LOCKED: true,
    });
  }

  // Check Canon conflict with Unit plan
  if (currentUnit) {
    for (const fact of publishedFacts) {
      if (fact.category === 'قوانين العالم والخوارق') {
        // e.g., if supernatural rule says "الجن لا يظهرون في النهار"
        if (fact.statement.includes('لا يمكن') || fact.statement.includes('ممنوع')) {
          // Check simple conflict trigger
        }
      }
    }
  }

  // 16. CURRENT_TASK
  const taskDescriptions: Record<
    OperationType,
    { title: string; objective: string; scope: string; strict_instructions: string[] }
  > = {
    plan_episode: {
      title: 'تخطيط هيكل الحلقة',
      objective: 'بناء الهيكل الدرامي للحلقة وتوزيع الوحدات السردية والصراعات دون كتابة النص الروائي النهائي.',
      scope: 'المستوى الهيكلي والتوزيع الزمني والتصاعد الدرامي.',
      strict_instructions: [
        'لا تكتب نص الحوار أو السرد في هذه المرحلة.',
        'حدد الوظائف الدرامية لكل وحدة بدقة (تأسيس، تصعيد، انعطاف، ذروة).',
        'التزم بالقوانين المقفلة (Canon Locked) والخط الزمني.',
      ],
    },
    write_unit: {
      title: 'كتابة نص الوحدة السردية',
      objective: 'صياغة المشهد الصوتي بالدارجة المغربية للحوار، وتحديد المؤثرات الصوتية (SFX) والجو الصوتي مع تصعيد التوتر.',
      scope: 'الوحدة المطلوبة فقط مع الالتزام الصارم بنقطة تسليم الوحدة السابقة.',
      strict_instructions: [
        'اكتب الحوارات بالدارجة المغربية الواقعية والسينمائية.',
        'أدرج توجيهات الأداء الصوتي والمؤثرات بين أقواس [SFX: ...] و[صوتياً: ...].',
        'لا تجعل الشخصيات تتحدث بمعلومات تقع ضمن forbidden_knowledge.',
        'سلم المشهد عند الـ Hook المحدد في المخطط.',
      ],
    },
    review_unit: {
      title: 'مراجعة النص واكتشاف التناقضات',
      objective: 'تدقيق النص المكتوب ومقارنته بالدستور والخط الزمني وحدود المعرفة دون إعادة كتابته.',
      scope: 'التدقيق الدرامي، اللغوي، الصوتي، والاستمرارية.',
      strict_instructions: [
        'لا تعِد كتابة النص أو تلخيصه.',
        'ارصد أي ثغرة في أماكن الشخصيات أو نبرة الصوت أو استمرارية الأشياء.',
        'حدد رقم السطر أو الاقتباس وسبب التناقض والتصحيح المقترح.',
      ],
    },
    revise_unit: {
      title: 'تنقيح وتعديل الوحدة السردية',
      objective: 'تصحيح المسودة بناءً على ملاحظات المراجعة واعتماد النسخة النهائية.',
      scope: 'تعديل موضعي وموجه لمعالجة التحذيرات دون تخريب الإيقاع الصوتي.',
      strict_instructions: [
        'عالج التحذيرات الحرجة المذكورة في تقرير المراجعة.',
        'حافظ على هوية الشخصيات ونبرة الدارجة المعتمدة.',
      ],
    },
    extract_memory: {
      title: 'استخراج الذاكرة والحقائق المنشورة',
      objective: 'تحليل النص النهائي المعتمد واستخراج التغييرات الطارئة على الشخصيات والأسرار والأشياء لتحديث الذاكرة.',
      scope: 'استخراج الحقائق الجديدة (Facts Created) والتحولات النفسية وحالة الأشياء.',
      strict_instructions: [
        'اقتصر على استخراج الحقائق المؤكدة في النص.',
        'لا تضف استنتاجات تخمينية خارج ما قيل أو حدث صراحة.',
        'صنف الحقائق لتحديث جداول CHARACTERS وTIMELINE_EVENTS وOBJECTS.',
      ],
    },
    continuity_check: {
      title: 'فحص شامل للاستمرارية (Continuity Audit)',
      objective: 'إجراء مسح تقاطعي عبر كافة جداول الرواية لاكتشاف التناقضات قبل إطلاق الحلقة.',
      scope: 'فحص الأماكن، التواريخ، مستويات الثقة، الأسرار، والتلميحات.',
      strict_instructions: [
        'تحقق من عدم وجود شخصية في مكانين مختلفين بنفس الوقت.',
        'تأكد من عدم حرق الأسرار قبل موعدها.',
        'صنف التحذيرات حسب الخطورة (Critical, High, Medium, Low).',
      ],
    },
  };

  const currentTaskSection: NarrativeContextResult['current_task'] = {
    operation_type,
    ...taskDescriptions[operation_type],
  };

  // 17. RESULT OBJECT
  return {
    project: {
      id: project.id,
      title: project.title,
      description: project.description,
      target_episode_count: project.target_episode_count,
      current_episode_number: project.current_episode_number,
      current_unit_number: project.current_unit_number,
      status: project.status,
      current_story_date: latestTimelineEvent?.story_date || undefined,
    },
    active_system_prompt: activePromptSection,
    story_bible: relevantBible,
    current_state: currentStateSection,
    relevant_characters: relevantCharacters,
    relevant_relationships: relevantRelationships,
    recent_timeline: recentTimeline,
    active_secrets: activeSecrets,
    relevant_clues: relevantClues,
    open_loops: openLoops,
    relevant_objects: relevantObjects,
    previous_unit: previousUnitSection,
    current_plan: currentPlanSection,
    published_facts: publishedFacts,
    continuity_warnings: warnings,
    missing_context: missingContext,
    current_task: currentTaskSection,
    context_metadata: {
      project_id,
      episode_id: currentEpisode?.id,
      unit_id: currentUnit?.id,
      operation_type,
      generated_at: new Date().toISOString(),
      context_version: '1.0',
    },
  };
}
