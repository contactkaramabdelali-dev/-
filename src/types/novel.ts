export type ViewType =
  | 'dashboard'
  | 'bible'
  | 'characters'
  | 'episodes'
  | 'timeline'
  | 'locations'
  | 'secrets'
  | 'hints'
  | 'threads'
  | 'writer'
  | 'review'
  | 'memory'
  | 'settings';

export interface Character {
  id: string;
  name: string;
  alias?: string;
  role: 'رئيسية' | 'ثانوية' | 'غامضة' | 'عابرة';
  dialectNotes: string; // ملاحظات اللهجة والدارجة
  audioVoiceNotes: string; // نبرة الصوت والمؤثرات الصوتية
  description: string;
  hiddenAgenda?: string;
  status: 'حي' | 'مختفي' | 'متوفى' | 'مجهول';
  createdAt: string;
}

export type EpisodeStatus = 'مخططة' | 'قيد الكتابة' | 'مكتملة الصياغة' | 'جاهزة للتسجيل' | 'مسجلة';

export interface Episode {
  id: string;
  number: number;
  unit: string; // الوحدة / القوس الدرامي
  title: string;
  synopsis: string;
  targetDurationMinutes?: number;
  status: EpisodeStatus;
  scriptContent: string;
  audioNotes?: string;
  recordedDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TimelineEvent {
  id: string;
  title: string;
  era: 'قبل بداية الرواية' | 'الأحداث الجارية' | 'أحداث مستقبلية متوقعة';
  timeframe: string; // e.g. شتاء 1984، منتصف ليل الخميس، الخ
  description: string;
  relatedCharacterIds: string[];
  relatedEpisodeId?: string;
  impactLevel: 'حاسم' | 'مهم' | 'تأسيسي';
  createdAt: string;
}

export interface Location {
  id: string;
  name: string;
  cityRegion: string; // فاس العتيقة، الدار البيضاء، أطلس، إلخ
  atmosphere: string; // جو المكان والغموض
  soundscape: string; // المؤثرات الصوتية المحيطة (حمام قديم، صرير أبواب، ريح، زقاق ضيق...)
  description: string;
  createdAt: string;
}

export type SecretStatus = 'نشط وغير معلن' | 'تلميح جزئي' | 'مكشوف للمستمع' | 'محسوم كلياً';

export interface Secret {
  id: string;
  title: string;
  theTruth: string; // الحقيقة المخفية
  status: SecretStatus;
  urgency: 'حرج جداً' | 'متوسط' | 'بطيء الاشتعال';
  relatedCharacterIds: string[];
  revealEpisodeId?: string;
  createdAt: string;
}

export type HintStatus = 'مزروع في النص' | 'متروك' | 'مكتشف من المستمع' | 'مكتمل الربط';

export interface Hint {
  id: string;
  title: string;
  clueDetail: string; // تفاصيل التلميح الصوتي أو اللفظي
  plantedEpisodeId?: string;
  payoffEpisodeId?: string;
  targetSecretId?: string;
  status: HintStatus;
  createdAt: string;
}

export type ThreadStatus = 'مفتوح' | 'معلق' | 'مغلق ومحسوم';

export interface OpenThread {
  id: string;
  title: string;
  description: string;
  openedEpisodeId?: string;
  priority: 'عاجل' | 'متوسط' | 'طويل الأمد';
  status: ThreadStatus;
  createdAt: string;
}

export interface MemoryEntry {
  id: string;
  category: 'قاعدة عالم' | 'مفردة دارجة' | 'قانون سردي' | 'قاعدة صوتية' | 'تاريخ وسلالة' | 'أخرى';
  title: string;
  content: string;
  importance: 'جوهرية لا تتغير' | 'قابلة للتطور' | 'تذكير أسلوبي';
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  type: 'creation' | 'writing' | 'status_change' | 'system';
  description: string;
  timestamp: string;
}

export interface NovelBible {
  title: string;
  subTitle: string;
  premise: string; // الفرضية الكبرى
  tone: string; // النبرة والجو العام (غموض، توتر، سينمائي، صوتي)
  audioStyleDirectives: string; // تعليمات الأداء الصوتي والمؤثرات
  dialectPolicy: string; // سياسة استخدام الدارجة المغربية والفصحى
  worldRules: string; // قواعد العالم الدرامي
}

export interface NovelState {
  bible: NovelBible;
  currentUnit: string;
  currentEpisodeId: string | null;
  lastWorkedManuscript: string | null;
  lastWorkedDate: string | null;
  characters: Character[];
  episodes: Episode[];
  timeline: TimelineEvent[];
  locations: Location[];
  secrets: Secret[];
  hints: Hint[];
  openThreads: OpenThread[];
  memory: MemoryEntry[];
  activities: ActivityLog[];
}
