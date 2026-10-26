import React from 'react';
import { Menu, Feather, Plus, FolderKanban } from 'lucide-react';
import { useNovel, ViewType } from '../../context/NovelContext';

interface HeaderProps {
  onToggleMobile: () => void;
  onOpenCreateProject: () => void;
}

const viewTitles: Record<ViewType, { title: string; subtitle: string }> = {
  dashboard: {
    title: 'لوحة التحكم المركزية',
    subtitle: 'نظرة شاملة على تقدم الرواية الصوتية، الأسرار، وذاكرة السرد',
  },
  bible: {
    title: 'دستور الرواية (الكودكس)',
    subtitle: 'الفرضية الكبرى، نبرة الغموض، توجيهات الأداء الصوتي وسياسة الدارجة المغربية',
  },
  characters: {
    title: 'سجل الشخصيات والعلاقات',
    subtitle: 'ملفات الشخصيات، نبرة الصوت، خصوصية اللهجة، شبكة العلاقات والأسرار',
  },
  episodes: {
    title: 'خريطة الحلقات والوحدات السردية',
    subtitle: 'تخطيط الأجزاء الصوتية وتقسيم كل حلقة إلى وحدات درامية (Story Units)',
  },
  timeline: {
    title: 'الخط الزمني الممتد',
    subtitle: 'تسلسل الوقائع التاريخية وتثبيت الحقائق والنتائج الدرامية',
  },
  locations: {
    title: 'أطلس الأماكن والمشاهد',
    subtitle: 'الفضاءات المغربية ذات الطابع الغامض، وقواعد الفضاء والمؤثرات الصوتية',
  },
  secrets: {
    title: 'سرداب الأسرار والحقائق',
    subtitle: 'الحقائق الدفينة، من يعلم ومن يجهل، ومراحل كشفها للمستمع',
  },
  hints: {
    title: 'شبكة التلميحات والإشارات',
    subtitle: 'التلميحات الصوتية والرمزية المزروعة والمرتبطة مباشرة بالأسرار',
  },
  threads: {
    title: 'الخيوط السردية المفتوحة (Open Loops)',
    subtitle: 'الأسئلة العالقة والعُقد التي تنتظر حسماً أو تفسيراً درامياً',
  },
  objects: {
    title: 'أرشيف الأغراض والمقتنيات',
    subtitle: 'المخطوطات، المفاتيح، والآثار التي تدير دفة الصراع والغموض',
  },
  decisions: {
    title: 'سجل القرارات السردية',
    subtitle: 'المفترقات الدرامية وحسم خيارات الحبكة للمؤلف',
  },
  writer: {
    title: 'غرفة الكتابة الصوتية',
    subtitle: 'محرر الحلقات والوحدات، ضبط الحوارات بالدارجة، وتوثيق المؤثرات الصوتية',
  },
  review: {
    title: 'مركز المراجعة والاتساق السردي',
    subtitle: 'سجل التدقيق (Continuity Log)، فحص التناقضات، وربط التلميحات بالأسرار',
  },
  memory: {
    title: 'ذاكرة الرواية الدائمة',
    subtitle: 'القوانين الثابتة، معجم الكلمات والدارجة، وقواعد العالم الدرامي',
  },
  settings: {
    title: 'المشاريع والإعدادات',
    subtitle: 'إدارة مشاريع الروايات، النسخ الاحتياطي لقاعدة البيانات، والتصدير والاستيراد',
  },
};

export const Header: React.FC<HeaderProps> = ({ onToggleMobile, onOpenCreateProject }) => {
  const {
    activeView,
    setActiveView,
    projects,
    activeProjectId,
    setActiveProjectId,
    activeProject,
    episodes,
    currentEpisodeId,
    storyUnits,
    currentUnitId,
  } = useNovel();

  const currentViewMeta = viewTitles[activeView] || viewTitles.dashboard;
  const currentEp = episodes.find(e => e.id === currentEpisodeId);
  const currentUnit = storyUnits.find(u => u.id === currentUnitId);

  return (
    <header className="sticky top-0 z-30 bg-[#0d0f14]/90 backdrop-blur-md border-b border-zinc-800/80 px-4 sm:px-8 py-3.5 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobile}
          className="lg:hidden p-2 text-zinc-400 hover:text-zinc-100 rounded-xl hover:bg-zinc-800 focus:outline-none"
          aria-label="القائمة"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h2 className="text-base sm:text-lg font-bold text-zinc-100 font-heading tracking-wide flex items-center gap-2">
            <span>{currentViewMeta.title}</span>
          </h2>
          <p className="text-xs text-zinc-400 font-sans hidden sm:block">
            {currentViewMeta.subtitle}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Project Selector */}
        <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 rounded-xl px-2 py-1">
          <FolderKanban className="w-3.5 h-3.5 text-amber-500" />
          {projects.length > 0 ? (
            <select
              value={activeProjectId || ''}
              onChange={(e) => setActiveProjectId(e.target.value)}
              className="bg-transparent text-xs text-zinc-200 font-semibold focus:outline-none cursor-pointer"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id} className="bg-zinc-900 text-zinc-200">
                  {p.title}
                </option>
              ))}
            </select>
          ) : (
            <span className="text-xs text-zinc-400">لا يوجد مشروع</span>
          )}

          <button
            onClick={onOpenCreateProject}
            className="p-1 hover:bg-zinc-800 text-amber-400 hover:text-amber-300 rounded transition-colors"
            title="إنشاء مشروع جديد"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Current Episode & Unit Indicators */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs">
          <span className="text-zinc-400">الحلقة:</span>
          <span className="font-semibold text-zinc-200">
            {currentEp ? `الحلقة ${currentEp.episode_number}` : 'غير محددة'}
          </span>
          {currentUnit && (
            <>
              <span className="text-zinc-600">|</span>
              <span className="text-zinc-400">الوحدة:</span>
              <span className="font-semibold text-amber-400">
                {currentUnit.unit_number}: {currentUnit.title}
              </span>
            </>
          )}
        </div>

        {/* Quick jump to Writer Room */}
        {activeView !== 'writer' && (
          <button
            onClick={() => setActiveView('writer')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold transition-colors cursor-pointer"
          >
            <Feather className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">غرفة الكتابة</span>
          </button>
        )}
      </div>
    </header>
  );
};
