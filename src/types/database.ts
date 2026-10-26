export interface Project {
  id: string;
  title: string;
  description: string;
  status: 'قيد التطوير' | 'قيد الكتابة' | 'مكتمل' | 'مؤرشف';
  target_episode_count: number;
  current_episode_number: number;
  current_unit_number: number;
  created_at: string;
  updated_at: string;
}

export interface StoryBibleEntry {
  id: string;
  project_id: string;
  category: 'فرضية كبرى' | 'نبرة وجو' | 'توجيهات صوتية' | 'سياسة الدارجة' | 'قواعد العالم' | 'أخرى';
  title: string;
  content: string;
  priority: 'جوهرية لا تتغير' | 'قابلة للتطور' | 'تذكير أسلوبي';
  is_locked: boolean;
  created_at: string;
  updated_at: string;
}

export interface Character {
  id: string;
  project_id: string;
  name: string;
  aliases: string;
  role: 'رئيسية' | 'ثانوية' | 'غامضة' | 'عابرة';
  age?: number | string;
  background: string;
  physical_description: string;
  personality: string;
  speaking_style: string;
  wants: string;
  fears: string;
  beliefs: string;
  wound: string;
  secret: string;
  limits: string;
  arc_start: string;
  arc_current: string;
  arc_destination: string;
  current_location: string;
  physical_state: string;
  psychological_state: string;
  current_goal: string;
  current_knowledge: string;
  forbidden_knowledge: string;
  status: 'حي' | 'مختفي' | 'متوفى' | 'مجهول';
  created_at: string;
  updated_at: string;
}

export interface CharacterRelationship {
  id: string;
  character_a_id: string;
  character_b_id: string;
  relationship_type: 'قرابة عائلية' | 'عداوة' | 'تحالف مؤقت' | 'حب خفي' | 'شك وريبة' | 'سيد وخادم';
  public_relationship: string;
  real_relationship: string;
  trust_level: number; // 1 to 10
  tension_level: number; // 1 to 10
  current_state: string;
  history: string;
}

export interface Location {
  id: string;
  project_id: string;
  name: string;
  description: string;
  atmosphere: string;
  rules: string;
  hidden_information: string;
  current_state: string;
}

export interface Episode {
  id: string;
  project_id: string;
  episode_number: number;
  title: string;
  status: 'مخططة' | 'قيد الكتابة' | 'مكتملة الصياغة' | 'جاهزة للتسجيل' | 'مسجلة';
  synopsis: string;
  opening_state: string;
  main_objective: string;
  central_conflict: string;
  ending_state: string;
  publication_status: 'مسودة داخلية' | 'معتمدة للنشر' | 'منشورة';
  is_locked: boolean;
  created_at: string;
  updated_at: string;
}

export interface StoryUnit {
  id: string;
  episode_id: string;
  unit_number: number;
  title: string;
  function: 'تأسيس' | 'تصعيد' | 'انعطاف' | 'ذروة' | 'أزمة' | 'تنوير' | 'خاتمة مشوقة (Cliffhanger)';
  start_state: string;
  objective: string;
  pressure: string;
  information: string;
  plant: string;
  payoff: string;
  turn: string;
  end_state: string;
  hook: string;
  draft_content: string;
  final_content: string;
  status: 'مخططة' | 'قيد الصياغة' | 'مكتملة' | 'مراجعة';
  word_count: number;
  created_at: string;
  updated_at: string;
}

export interface TimelineEvent {
  id: string;
  project_id: string;
  episode_id?: string;
  unit_id?: string;
  story_date: string;
  story_time: string;
  sequence_order: number;
  title: string;
  description: string;
  location: string;
  characters_present: string[]; // Character IDs
  facts_created: string;
  consequences: string;
  is_fixed: boolean;
}

export interface Secret {
  id: string;
  project_id: string;
  title: string;
  hidden_truth: string;
  importance: 'حرج جداً' | 'متوسط' | 'بطيء الاشتعال';
  known_by: string[]; // Character IDs
  unknown_by: string[]; // Character IDs
  false_assumptions: string;
  reveal_stage: 'مكتوم تماماً' | 'شكوك أولية' | 'مكشوف للمستمع فقط' | 'محسوم للجميع';
  planned_reveal_episode?: number;
  status: 'نشط وغير معلن' | 'تلميح جزئي' | 'مكشوف للمستمع' | 'محسوم كلياً';
}

export interface Clue {
  id: string;
  project_id: string;
  secret_id: string;
  description: string;
  planted_episode: number;
  planted_unit?: number;
  intended_interpretation: string;
  false_interpretation: string;
  payoff_status: 'مزروع في النص' | 'متروك' | 'مكتشف من المستمع' | 'مكتمل الربط';
  payoff_episode?: number;
}

export interface OpenLoop {
  id: string;
  project_id: string;
  title: string;
  description: string;
  opened_episode: number;
  opened_unit?: number;
  related_characters: string[]; // Character IDs
  urgency: 'عاجل' | 'متوسط' | 'طويل الأمد';
  planned_resolution: string;
  status: 'مفتوح' | 'معلق' | 'مغلق ومحسوم';
}

export interface StoryObject {
  id: string;
  project_id: string;
  name: string;
  description: string;
  current_owner: string; // Character ID or name
  current_location: string; // Location ID or name
  narrative_importance: 'أثر جوهري' | 'دليل مفتاحي' | 'غرض رمزي' | 'عابر';
  hidden_information: string;
  status: 'موجود' | 'مفقود' | 'تالف' | 'مدفون';
}

export interface ContinuityLogEntry {
  id: string;
  project_id: string;
  episode_id?: string;
  unit_id?: string;
  category: 'تناقض زمني' | 'خلل شخصية' | 'تلميح معلق' | 'تناقض مكان' | 'قاعدة عالم مكسورة' | 'أخرى';
  description: string;
  severity: 'حرج' | 'متوسط' | 'طفيف';
  suggested_fix: string;
  status: 'قيد الانتظار' | 'تم التصحيح' | 'تجاهل متعمد';
  created_at: string;
}

export interface StoryDecision {
  id: string;
  project_id: string;
  title: string;
  question: string;
  options: string[];
  selected_option: string;
  reasoning: string;
  impact: string;
  status: 'محسوم' | 'قيد النقاش' | 'مؤجل';
}

export interface GenerationRun {
  id: string;
  project_id: string;
  episode_id?: string;
  unit_id?: string;
  operation_type:
    | 'plan_episode'
    | 'write_unit'
    | 'review_unit'
    | 'revise_unit'
    | 'extract_memory'
    | 'continuity_check'
    | 'توليد مشهد'
    | 'تدقيق استمرارية'
    | 'اقتراح حوار'
    | 'تحليل شخصية'
    | string;
  context_version?: string;
  model?: string;
  task_prompt?: string;
  response_format?: 'json' | 'text' | string;
  status?: 'pending' | 'running' | 'succeeded' | 'failed' | 'blocked';
  input_context: string;
  output: string;
  validation_result: string;
  error_code?: string;
  error_message?: string;
  accepted: boolean;
  created_at: string;
  completed_at?: string;
}

export interface SystemPrompt {
  id: string;
  project_id: string;
  name: string;
  content: string;
  version: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DatabaseSchema {
  projects: Project[];
  story_bible: StoryBibleEntry[];
  characters: Character[];
  character_relationships: CharacterRelationship[];
  locations: Location[];
  episodes: Episode[];
  story_units: StoryUnit[];
  timeline_events: TimelineEvent[];
  secrets: Secret[];
  clues: Clue[];
  open_loops: OpenLoop[];
  objects: StoryObject[];
  continuity_log: ContinuityLogEntry[];
  story_decisions: StoryDecision[];
  generation_runs: GenerationRun[];
  system_prompts: SystemPrompt[];
}

