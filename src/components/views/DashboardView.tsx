import React, { useState } from 'react';
import {
  Feather,
  PlusCircle,
  CheckCheck,
  Users,
  KeyRound,
  GitFork,
  Film,
  Compass,
  FileText,
  Clock,
  Sparkles,
  ChevronLeft,
  Calendar,
  AlertCircle,
  FolderPlus,
} from 'lucide-react';
import { useNovel } from '../../context/NovelContext';
import { EmptyState } from '../common/EmptyState';
import { Modal } from '../common/Modal';
import { EpisodePlanningModal } from './EpisodePlanningModal';

interface DashboardViewProps {
  onOpenCreateProject: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onOpenCreateProject }) => {
  const {
    activeProject,
    setActiveView,
    episodes,
    currentEpisodeId,
    setCurrentEpisodeId,
    characters,
    secrets,
    openLoops,
    storyUnits,
    currentUnitId,
    setCurrentUnitId,
    addEpisode,
    continuityLogs,
  } = useNovel();

  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [newEpTitle, setNewEpTitle] = useState('');
  const [newEpNumber, setNewEpNumber] = useState<number>(episodes.length + 1);
  const [newEpSynopsis, setNewEpSynopsis] = useState('');
  const [newEpOpening, setNewEpOpening] = useState('');
  const [newEpConflict, setNewEpConflict] = useState('');

  const currentEpisode = episodes.find(e => e.id === currentEpisodeId) || (episodes.length > 0 ? episodes[0] : null);
  const currentUnit = storyUnits.find(u => u.id === currentUnitId) || (currentEpisode ? storyUnits.find(u => u.episode_id === currentEpisode.id) : null);

  const activeSecretsCount = secrets.filter(s => s.status === 'نشط وغير معلن').length;
  const openThreadsCount = openLoops.filter(t => t.status === 'مفتوح').length;

  const handleCreateEpisode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEpTitle.trim()) return;

    await addEpisode({
      episode_number: newEpNumber,
      title: newEpTitle.trim(),
      synopsis: newEpSynopsis.trim(),
      opening_state: newEpOpening.trim(),
      main_objective: '',
      central_conflict: newEpConflict.trim(),
      ending_state: '',
      publication_status: 'مسودة داخلية',
      status: 'مخططة',
      is_locked: false,
    });

    setNewEpTitle('');
    setNewEpSynopsis('');
    setNewEpOpening('');
    setNewEpConflict('');
    setIsPlanModalOpen(false);
    setActiveView('episodes');
  };

  // If no project exists at all
  if (!activeProject) {
    return (
      <div className="py-12">
        <EmptyState
          icon={FolderPlus}
          title="لا يوجد مشروع رواية مفتوح حالياً"
          description="ابدأ بإنشاء مشروع الرواية الصوتية الجديد لتأسيس قاعدة البيانات الدائمة والشخصيات والحلقات."
          actionLabel="إنشاء مشروع رواية جديد"
          onAction={onOpenCreateProject}
          hintText="سيتم حفظ كافة البيانات فورياً وبشكل دائم في قاعدة بيانات المتصفح"
        />
      </div>
    );
  }

  // Find latest worked draft
  const latestUnitWithContent = [...storyUnits]
    .filter(u => u.draft_content && u.draft_content.trim().length > 0)
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0];

  const lastWorkedText = latestUnitWithContent ? latestUnitWithContent.draft_content : (currentEpisode?.synopsis || null);

  return (
    <div className="space-y-6">
      {/* Studio Header / Action Hub */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-zinc-950 via-[#12141c] to-zinc-900 border border-zinc-800/80 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 left-0 w-96 h-96 bg-amber-600/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2 text-amber-500 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              <span>استوديو تأليف الرواية الصوتية المغربية</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-heading text-zinc-100 tracking-tight">
              «{activeProject.title}»
            </h1>
            <p className="text-sm text-zinc-400 mt-1 max-w-xl">
              {activeProject.description || 'إدارة الذاكرة السردية، ترصّد الأسرار المكتومة، وضبط حبكة الحلقات الصوتية دون أي انقطاع في الاستمرارية.'}
            </p>
          </div>

          {/* Primary Action Buttons required by user */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setActiveView('writer')}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-zinc-950 font-bold text-sm shadow-lg shadow-amber-950/60 hover:shadow-amber-600/30 transition-all duration-200 active:scale-95 cursor-pointer"
            >
              <Feather className="w-4 h-4 stroke-[2.5]" />
              <span>كمل الكتابة</span>
            </button>

            <button
              onClick={() => {
                setNewEpNumber(episodes.length + 1);
                setIsPlanModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-zinc-600 text-zinc-200 font-semibold text-sm transition-all duration-200 active:scale-95 cursor-pointer shadow-md"
            >
              <PlusCircle className="w-4 h-4 text-amber-400" />
              <span>خطط الحلقة القادمة</span>
            </button>

            <button
              onClick={() => setActiveView('review')}
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-zinc-600 text-zinc-200 font-semibold text-sm transition-all duration-200 active:scale-95 cursor-pointer shadow-md"
            >
              <CheckCheck className="w-4 h-4 text-emerald-400" />
              <span>راجع الاستمرارية</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Stats Counters */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* عدد الشخصيات */}
        <div
          onClick={() => setActiveView('characters')}
          className="p-5 rounded-2xl bg-[#0f1117] border border-zinc-800/80 hover:border-zinc-700 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-zinc-400 mb-3">
            <span className="text-xs font-semibold text-zinc-400">عدد الشخصيات</span>
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-amber-400 transition-colors">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black font-heading text-zinc-100">
            {characters.length}
          </div>
          <p className="text-[11px] text-zinc-500 mt-1 font-sans">
            {characters.length === 0 ? 'لا توجد شخصيات مسجلة' : 'شخصية موثقة في الأرشيف'}
          </p>
        </div>

        {/* الأسرار النشطة */}
        <div
          onClick={() => setActiveView('secrets')}
          className="p-5 rounded-2xl bg-[#0f1117] border border-zinc-800/80 hover:border-zinc-700 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-zinc-400 mb-3">
            <span className="text-xs font-semibold text-zinc-400">الأسرار النشطة</span>
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-amber-400 transition-colors">
              <KeyRound className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black font-heading text-amber-400">
            {activeSecretsCount}
          </div>
          <p className="text-[11px] text-zinc-500 mt-1 font-sans">
            {activeSecretsCount === 0 ? 'لا توجد أسرار معلقة' : 'أسرار دفينة لم تنكشف للمستمع'}
          </p>
        </div>

        {/* الخيوط المفتوحة */}
        <div
          onClick={() => setActiveView('threads')}
          className="p-5 rounded-2xl bg-[#0f1117] border border-zinc-800/80 hover:border-zinc-700 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-zinc-400 mb-3">
            <span className="text-xs font-semibold text-zinc-400">الخيوط المفتوحة</span>
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-amber-400 transition-colors">
              <GitFork className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black font-heading text-red-400">
            {openThreadsCount}
          </div>
          <p className="text-[11px] text-zinc-500 mt-1 font-sans">
            {openThreadsCount === 0 ? 'كل الحبكات مغلقة' : 'عقد درامية تنتظر الحسم'}
          </p>
        </div>

        {/* الحلقات */}
        <div
          onClick={() => setActiveView('episodes')}
          className="p-5 rounded-2xl bg-[#0f1117] border border-zinc-800/80 hover:border-zinc-700 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-zinc-400 mb-3">
            <span className="text-xs font-semibold text-zinc-400">الحلقات الإجمالية</span>
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-amber-400 transition-colors">
              <Film className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black font-heading text-zinc-100">
            {episodes.length}
          </div>
          <p className="text-[11px] text-zinc-500 mt-1 font-sans">
            {episodes.length === 0 ? 'لم تخطط أي حلقة بعد' : `${storyUnits.length} وحدة سردية مسجلة`}
          </p>
        </div>
      </div>

      {/* Grid: الحلقة الحالية + الوحدة الحالية */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* الحلقة الحالية */}
        <div className="rounded-2xl bg-[#0f1117] border border-zinc-800/80 p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4 mb-4">
            <div className="flex items-center gap-2.5">
              <Film className="w-5 h-5 text-amber-500" />
              <h3 className="font-heading font-bold text-zinc-100 text-base">
                الحلقة الحالية
              </h3>
            </div>
            {episodes.length > 0 && (
              <button
                onClick={() => setActiveView('episodes')}
                className="text-xs text-amber-400 hover:text-amber-300 font-semibold cursor-pointer"
              >
                تغيير الحلقة
              </button>
            )}
          </div>

          {currentEpisode ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="inline-block px-2.5 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-mono font-bold mb-2">
                    الحلقة رقم {currentEpisode.episode_number}
                  </span>
                  <h4 className="text-xl font-bold font-heading text-zinc-100">
                    {currentEpisode.title}
                  </h4>
                  {currentEpisode.central_conflict && (
                    <p className="text-xs text-zinc-400 mt-1 font-sans">
                      الصراع: {currentEpisode.central_conflict}
                    </p>
                  )}
                </div>
                <span className="text-xs px-2.5 py-1 rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700">
                  {currentEpisode.status}
                </span>
              </div>

              {currentEpisode.synopsis && (
                <p className="text-sm text-zinc-300 line-clamp-2 bg-zinc-950/60 p-3 rounded-xl border border-zinc-850">
                  {currentEpisode.synopsis}
                </p>
              )}

              <div className="pt-2 flex items-center gap-3">
                <button
                  onClick={() => {
                    setCurrentEpisodeId(currentEpisode.id);
                    setActiveView('writer');
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold cursor-pointer"
                >
                  <Feather className="w-3.5 h-3.5" />
                  <span>فتح نص الحلقة في غرفة الكتابة</span>
                </button>
              </div>
            </div>
          ) : (
            <EmptyState
              icon={Film}
              title="لم يتم تحديد حلقة حالية بعد"
              description="حدد الحلقة التي تعمل عليها الآن أو قم بتخطيط حلقة جديدة لتظهر إحصائياتها وتفاصيلها هنا."
              actionLabel="خطط حلقة جديدة"
              onAction={() => setIsPlanModalOpen(true)}
            />
          )}
        </div>

        {/* الوحدة الحالية */}
        <div className="rounded-2xl bg-[#0f1117] border border-zinc-800/80 p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4 mb-4">
            <div className="flex items-center gap-2.5">
              <Compass className="w-5 h-5 text-amber-500" />
              <h3 className="font-heading font-bold text-zinc-100 text-base">
                الوحدة الحالية (Story Unit)
              </h3>
            </div>
            <button
              onClick={() => setActiveView('episodes')}
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold cursor-pointer"
            >
              عرض كل الوحدات
            </button>
          </div>

          {currentUnit ? (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-zinc-900 to-zinc-950 p-4 rounded-xl border border-zinc-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-amber-500 font-mono">
                    الوحدة {currentUnit.unit_number} ({currentUnit.function})
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                    {currentUnit.status}
                  </span>
                </div>
                <h4 className="text-lg font-bold font-heading text-zinc-100">
                  {currentUnit.title}
                </h4>
                {currentUnit.objective && (
                  <p className="text-xs text-zinc-400 mt-2">
                    الهدف: {currentUnit.objective}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
                <span>الكلمات المنجزة: {currentUnit.word_count || 0} كلمة</span>
                <button
                  onClick={() => {
                    setCurrentEpisodeId(currentUnit.episode_id);
                    setCurrentUnitId(currentUnit.id);
                    setActiveView('writer');
                  }}
                  className="text-amber-400 hover:text-amber-300 font-semibold"
                >
                  تحرير الوحدة في غرفة الكتابة
                </button>
              </div>
            </div>
          ) : (
            <EmptyState
              icon={Compass}
              title="لم يتم تحديد وحدة سردية حالية بعد"
              description="الوحدات السردية تُفصّل كل حلقة إلى محطات درامية (تأسيس، تصعيد، انعطاف، وذروة)."
              actionLabel="إدارة الوحدات والحلقات"
              onAction={() => setActiveView('episodes')}
            />
          )}
        </div>
      </div>

      {/* آخر نص تم العمل عليه */}
      <div className="rounded-2xl bg-[#0f1117] border border-zinc-800/80 p-6">
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-amber-500" />
            <h3 className="font-heading font-bold text-zinc-100 text-base">
              آخر نص تم العمل عليه
            </h3>
          </div>
          {lastWorkedText && (
            <button
              onClick={() => setActiveView('writer')}
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>متابعة التحرير</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {lastWorkedText && lastWorkedText.trim().length > 0 ? (
          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-black/40 border border-zinc-850 font-manuscript text-base text-zinc-300 leading-relaxed max-h-36 overflow-hidden relative">
              <div className="whitespace-pre-line">
                {lastWorkedText.slice(0, 320)}
                {lastWorkedText.length > 320 ? '...' : ''}
              </div>
              <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
            </div>

            <div className="flex items-center justify-between text-xs text-zinc-500 font-mono">
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5" />
                <span>محفوظ في قاعدة البيانات الدائمة</span>
              </div>
              <span>
                {lastWorkedText.trim().split(/\s+/).length} كلمة
              </span>
            </div>
          </div>
        ) : (
          <EmptyState
            icon={FileText}
            title="لا توجد مسودات أو نصوص مكتوبة حتى الآن"
            description="غرفة الكتابة بانتظار قلمك لبدء صياغة المشاهد والحوارات بالدارجة المغربية والمؤثرات الصوتية."
            actionLabel="ابدأ الكتابة الآن"
            onAction={() => setActiveView('writer')}
          />
        )}
      </div>

      {/* آخر الأنشطة / سجل التدقيق */}
      <div className="rounded-2xl bg-[#0f1117] border border-zinc-800/80 p-6">
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <Clock className="w-5 h-5 text-amber-500" />
            <h3 className="font-heading font-bold text-zinc-100 text-base">
              سجل التدقيق والملاحظات (Continuity & Activity)
            </h3>
          </div>
          {continuityLogs.length > 0 && (
            <span className="text-xs text-zinc-500 font-mono">
              {continuityLogs.length} بند مسجل
            </span>
          )}
        </div>

        {continuityLogs.length > 0 ? (
          <div className="space-y-3">
            {continuityLogs.slice(0, 5).map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/50 hover:bg-zinc-900/70 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${log.severity === 'حرج' ? 'bg-red-500' : 'bg-amber-500'}`} />
                  <div>
                    <span className="text-xs font-bold text-zinc-300 block">{log.category}</span>
                    <span className="text-xs text-zinc-400 font-sans">{log.description}</span>
                  </div>
                </div>
                <span className="text-[11px] text-zinc-500 font-mono">
                  {log.status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Clock}
            title="لا توجد ملاحظات أو أنشطة مسجلة بعد"
            description="عند إضافة شخصيات، أحداث، تخطيط حلقات أو رصد نقاط عدم اتساق، ستظهر هنا تلقائياً."
          />
        )}
      </div>

      {/* Plan Episode Modal */}
      {/* Stage 6: Episode Planning Engine Modal */}
      <EpisodePlanningModal
        isOpen={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
        defaultEpisodeNumber={episodes.length + 1}
      />
    </div>
  );
};
