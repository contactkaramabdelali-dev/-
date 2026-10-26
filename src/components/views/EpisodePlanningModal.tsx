import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Layers,
  Film,
  Compass,
  FileText,
  KeyRound,
  GitFork,
  Users,
  ShieldAlert,
  HelpCircle,
  Edit3,
  Save,
  RotateCcw,
  Check,
  Archive,
  X,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCheck,
} from 'lucide-react';
import { useNovel } from '../../context/NovelContext';
import { Modal } from '../common/Modal';
import {
  EpisodePlanResult,
  PlannedUnit,
  PlanValidationReport,
  ChangeRecord,
} from '../../server/episodePlanningService';
import { NarrativeContextResult } from '../../server/narrativeContextBuilder';

interface EpisodePlanningModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultEpisodeNumber?: number;
}

export const EpisodePlanningModal: React.FC<EpisodePlanningModalProps> = ({
  isOpen,
  onClose,
  defaultEpisodeNumber,
}) => {
  const {
    activeProject,
    projects,
    setActiveProjectId,
    episodes,
    buildContext,
    planEpisodeWorkflow,
    validateEpisodePlanWorkflow,
    saveEpisodePlanWorkflow,
    approveEpisodePlanWorkflow,
    archiveEpisodePlanWorkflow,
    isPlanningEpisode,
  } = useNovel();

  // Planning setup state
  const [selectedProjectId, setSelectedProjectId] = useState<string>(activeProject?.id || '');
  const [episodeNum, setEpisodeNum] = useState<number>(defaultEpisodeNumber || (episodes.length + 1));
  const [userNotes, setUserNotes] = useState<string>('');
  const [isPreflightLoading, setIsPreflightLoading] = useState(false);
  const [contextPreview, setContextPreview] = useState<NarrativeContextResult | null>(null);
  const [preflightError, setPreflightError] = useState<string | null>(null);

  // Active Plan State
  const [currentPlan, setCurrentPlan] = useState<EpisodePlanResult | null>(null);
  const [activeStep, setActiveStep] = useState<'setup' | 'view_plan' | 'editing'>('setup');
  const [planningError, setPlanningError] = useState<{
    code: string;
    message: string;
    blocking_items?: any[];
    validation_errors?: string[];
  } | null>(null);

  // Manual Editing state
  const [editingUnitIndex, setEditingUnitIndex] = useState<number | null>(null);
  const [editedPlan, setEditedPlan] = useState<EpisodePlanResult | null>(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Units expanded states
  const [expandedUnits, setExpandedUnits] = useState<Record<number, boolean>>({
    1: true,
    2: true,
    3: true,
    4: true,
    5: true,
  });

  // Sync project & episode number
  useEffect(() => {
    if (activeProject) {
      setSelectedProjectId(activeProject.id);
    }
  }, [activeProject]);

  useEffect(() => {
    if (defaultEpisodeNumber) {
      setEpisodeNum(defaultEpisodeNumber);
    } else {
      setEpisodeNum(episodes.length + 1);
    }
  }, [defaultEpisodeNumber, episodes.length]);

  // Load preflight narrative context on opening or project change
  useEffect(() => {
    if (isOpen && selectedProjectId) {
      loadContextPreflight();
    }
  }, [isOpen, selectedProjectId, episodeNum]);

  const loadContextPreflight = async () => {
    setIsPreflightLoading(true);
    setPreflightError(null);
    try {
      const { result } = await buildContext(null, null, 'plan_episode');
      setContextPreview(result);
    } catch (err: any) {
      setPreflightError(err.message || 'تعذر تحميل سياق الرواية للمعاينة');
    } finally {
      setIsPreflightLoading(false);
    }
  };

  const handleStartPlanning = async (isRegenerate: boolean = false) => {
    setPlanningError(null);
    setSaveSuccessMsg(null);

    try {
      const plan = await planEpisodeWorkflow({
        episode_number: episodeNum,
        user_notes: userNotes,
        regenerate: isRegenerate,
      });

      setCurrentPlan(plan);
      setEditedPlan(JSON.parse(JSON.stringify(plan)));
      setActiveStep('view_plan');
    } catch (err: any) {
      setPlanningError({
        code: err.code || 'PLANNING_FAILED',
        message: err.message || 'حدث خطأ أثناء بناء مخطط الحلقة',
        blocking_items: err.blocking_items,
        validation_errors: err.validation_errors,
      });
    }
  };

  const toggleUnitExpand = (num: number) => {
    setExpandedUnits(prev => ({ ...prev, [num]: !prev[num] }));
  };

  // Re-run Validation Pass
  const handleReviewPlan = async () => {
    if (!editedPlan) return;
    setIsValidating(true);
    try {
      const report = await validateEpisodePlanWorkflow(editedPlan);
      const updated = {
        ...editedPlan,
        validation_report: report,
        status: report.critical_issues.length > 0 || report.major_issues.length > 0 ? ('needs_revision' as const) : ('ready_for_review' as const),
      };
      setEditedPlan(updated);
      setCurrentPlan(updated);
      setSaveSuccessMsg('تمت إعادة مراجعة وتدقيق المخطط بنجاح');
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    } catch (err: any) {
      alert(err.message || 'فشل تدقيق المخطط');
    } finally {
      setIsValidating(false);
    }
  };

  // Save Plan as Draft
  const handleSaveAsDraft = async () => {
    if (!editedPlan) return;
    setIsSaving(true);
    try {
      await saveEpisodePlanWorkflow(editedPlan, true);
      setSaveSuccessMsg('تم حفظ المخطط كمسودة بنجاح وتحديث الوحدات الخمس (دون كتابة نصوص مسودات)');
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    } catch (err: any) {
      alert(err.message || 'تعذر حفظ المسودة');
    } finally {
      setIsSaving(false);
    }
  };

  // Approve Plan
  const handleApprovePlan = async () => {
    if (!editedPlan) return;
    setIsSaving(true);
    try {
      await approveEpisodePlanWorkflow(editedPlan);
      setSaveSuccessMsg('تم اعتماد المخطط بنجاح وتثبيت الحلقة جاهزة للإنتاج والتسجيل!');
      setTimeout(() => {
        setSaveSuccessMsg(null);
        onClose();
      }, 2000);
    } catch (err: any) {
      alert(err.message || 'تعذر اعتماد المخطط');
    } finally {
      setIsSaving(false);
    }
  };

  // Archive Plan
  const handleArchivePlan = async () => {
    if (!editedPlan) return;
    if (confirm('هل أنت متأكد من أرشفة هذا المخطط؟ سيتم تسجيله في سجل الأرشيف.')) {
      await archiveEpisodePlanWorkflow(editedPlan.id);
      setSaveSuccessMsg('تمت أرشفة المخطط بنجاح');
      setTimeout(() => {
        setSaveSuccessMsg(null);
        setActiveStep('setup');
      }, 1500);
    }
  };

  // Track field modification
  const handleUpdateUnitField = (unitIndex: number, field: keyof PlannedUnit, value: any) => {
    if (!editedPlan) return;
    const oldVal = editedPlan.units[unitIndex][field];
    const newUnits = [...editedPlan.units];
    newUnits[unitIndex] = { ...newUnits[unitIndex], [field]: value };

    const newHistory: ChangeRecord[] = [
      ...editedPlan.change_history,
      {
        field: `units[${unitIndex}].${field}`,
        previous_value: oldVal,
        new_value: value,
        timestamp: new Date().toISOString(),
      },
    ];

    setEditedPlan({
      ...editedPlan,
      units: newUnits,
      change_history: newHistory,
      status: 'draft',
    });
  };

  const handleUpdateEpisodeField = (field: string, value: string) => {
    if (!editedPlan) return;
    const oldVal = (editedPlan.episode as any)[field];
    setEditedPlan({
      ...editedPlan,
      episode: {
        ...editedPlan.episode,
        [field]: value,
      },
      change_history: [
        ...editedPlan.change_history,
        {
          field: `episode.${field}`,
          previous_value: oldVal,
          new_value: value,
          timestamp: new Date().toISOString(),
        },
      ],
      status: 'draft',
    });
  };

  const activeDisplayPlan = editedPlan || currentPlan;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={activeStep === 'setup' ? 'محرك تخطيط الحلقات السردية (Episode Planning Engine)' : `مخطط الحلقة ${activeDisplayPlan?.episode_number}: ${activeDisplayPlan?.episode.proposed_title}`}
      maxWidth="max-w-5xl"
    >
      <div className="space-y-6">
        {saveSuccessMsg && (
          <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-600/50 text-emerald-200 text-xs font-semibold flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{saveSuccessMsg}</span>
          </div>
        )}

        {/* ================= STEP 1: SETUP & PREFLIGHT ================= */}
        {activeStep === 'setup' && (
          <div className="space-y-6">
            {/* Context Summary Cards */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-zinc-950 via-[#10121a] to-zinc-900 border border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-amber-500 text-xs font-mono mb-1">
                  <Film className="w-4 h-4" />
                  <span>تخطيط حركة سردية واحدة مقسمة إنتاجياً إلى 5 وحدات</span>
                </div>
                <h4 className="font-heading font-bold text-zinc-100 text-base">
                  إعداد مدخلات وفحص جاهزية الحلقة رقم {episodeNum}
                </h4>
                <p className="text-xs text-zinc-400 mt-1 max-w-2xl leading-relaxed">
                  يقوم المحرك ببناء الذاكرة، والتأكد من انطلاق الحلقة عضوياً من آخر حالة معتمدة، وتوزيع الوحدات الخمس بمبدأ (الزرع والتطوير والمردود) دون تكرار مقدمات أو كليشيهات.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 font-mono text-xs">
                  الوحدات المطلوبة: <strong className="text-amber-400 font-bold">5 وحدات</strong>
                </span>
              </div>
            </div>

            {/* Form Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">المشروع النشط *</label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => {
                    setSelectedProjectId(e.target.value);
                    setActiveProjectId(e.target.value);
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs focus:border-amber-500 focus:outline-none"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">رقم الحلقة المستهدفة *</label>
                <input
                  type="number"
                  min="1"
                  value={episodeNum}
                  onChange={(e) => setEpisodeNum(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs font-mono focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="md:col-span-1">
                <label className="block text-xs font-semibold text-zinc-300 mb-1">حالة الذاكرة ونقطة الانطلاق</label>
                <div className="px-3 py-2 rounded-xl bg-zinc-900/80 border border-zinc-800 text-[11px] text-zinc-400 truncate">
                  {contextPreview?.current_state?.latest_approved_episode ? (
                    <span>بعد الحلقة {contextPreview.current_state.latest_approved_episode.episode_number}: «{contextPreview.current_state.latest_approved_episode.title}»</span>
                  ) : episodeNum === 3 && activeProject?.title?.includes('الوارث') ? (
                    <span className="text-amber-400 font-bold">Canon: «عرفت بلي هاد الليلة ما غاديش تسالي مزيان»</span>
                  ) : (
                    <span>بداية المسار الدرامي للمشروع</span>
                  )}
                </div>
              </div>
            </div>

            {/* Author Optional Notes */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                ملاحظات ورغبات المؤلف الاختيارية (User Notes)
              </label>
              <textarea
                rows={2}
                value={userNotes}
                onChange={(e) => setUserNotes(e.target.value)}
                placeholder="أضف أي توجه درامي ترغب فيه (مثال: ركز على تصاعد الشك بين حميد وكريم، أو ارفع الضغط على رحيم داخل القبو)..."
                className="w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs focus:border-amber-500 focus:outline-none leading-relaxed"
              />
              <p className="text-[10px] text-zinc-500 mt-1">
                تُراعى الملاحظات بمرونة بشرط ألا تناقض Canon المنشور أو القوانين المقفلة.
              </p>
            </div>

            {/* Preflight Narrative Context Dashboard */}
            {contextPreview && (
              <div className="space-y-4 pt-2 border-t border-zinc-800/80">
                <h5 className="font-heading font-bold text-xs text-zinc-300 flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-amber-500" />
                  <span>معاينة جاهزية سياق الذاكرة قبل التوليد:</span>
                </h5>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  {/* آخر حالة معتمدة */}
                  <div className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800 space-y-1">
                    <span className="text-[10px] font-bold text-amber-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>آخر حالة معتمدة:</span>
                    </span>
                    <p className="text-[11px] text-zinc-300 line-clamp-3 leading-relaxed">
                      {contextPreview.current_state?.starting_narrative_state ||
                        (episodeNum === 3 && activeProject?.title?.includes('الوارث')
                          ? '«عرفت بلي هاد الليلة ما غاديش تسالي مزيان» (بداية الصدمة والهلع الجسدي)'
                          : 'النقطة التأسيسية الأولى')}
                    </p>
                  </div>

                  {/* الشخصيات المتوقع حضورها */}
                  <div className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800 space-y-1">
                    <span className="text-[10px] font-bold text-zinc-400 flex items-center gap-1">
                      <Users className="w-3 h-3 text-amber-400" />
                      <span>الشخصيات المرتبطة:</span>
                    </span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {contextPreview.relevant_characters.slice(0, 5).map((c) => (
                        <span key={c.id} className="px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] text-zinc-200">
                          {c.name}
                        </span>
                      ))}
                      {contextPreview.relevant_characters.length === 0 && (
                        <span className="text-zinc-500 text-[10px]">لا توجد شخصيات محددة</span>
                      )}
                    </div>
                  </div>

                  {/* الخيوط المفتوحة ذات الأولوية */}
                  <div className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800 space-y-1">
                    <span className="text-[10px] font-bold text-red-400 flex items-center gap-1">
                      <GitFork className="w-3 h-3" />
                      <span>الخيوط المفتوحة النشطة:</span>
                    </span>
                    <p className="text-[11px] text-zinc-300 line-clamp-2">
                      {contextPreview.open_loops.length > 0
                        ? `${contextPreview.open_loops.length} خيوط معلقة تنتظر الحسم والتحريك`
                        : 'لا توجد خيوط حرجة معلقة'}
                    </p>
                  </div>
                </div>

                {/* Missing Context Warnings: Blocking vs Non-Blocking */}
                {contextPreview.missing_context.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-900/40 text-xs space-y-2">
                    <div className="font-bold text-amber-300 flex items-center gap-1.5 text-xs">
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      <span>تنبيهات السياق الناقص (Missing Context):</span>
                    </div>
                    <ul className="space-y-1 text-[11px] text-zinc-300">
                      {contextPreview.missing_context.map((m, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-amber-400">•</span>
                          <span><strong>{m.key}:</strong> {m.description} ({m.resolution})</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Planning Error Display */}
            {planningError && (
              <div className="p-4 rounded-xl bg-red-950/30 border border-red-800 text-xs text-red-200 space-y-2 animate-fade-in">
                <div className="font-bold flex items-center gap-2 text-red-400">
                  <AlertCircle className="w-4 h-4" />
                  <span>خطأ في عملية التخطيط: {planningError.code}</span>
                </div>
                <p className="text-[12px] text-zinc-200">{planningError.message}</p>

                {planningError.blocking_items && planningError.blocking_items.length > 0 && (
                  <div className="p-3 rounded-lg bg-black/60 border border-red-900/50 space-y-1 font-mono text-[11px]">
                    <span className="text-red-300 font-bold block mb-1">العناصر الحرجة المانعة للتخطيط (BLOCKING):</span>
                    {planningError.blocking_items.map((b: any, i: number) => (
                      <div key={i} className="text-red-300">
                        • {b.description} &rarr; {b.resolution}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Preflight Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold cursor-pointer"
              >
                إلغاء
              </button>

              <button
                type="button"
                onClick={() => handleStartPlanning(false)}
                disabled={isPlanningEpisode}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-zinc-950 font-bold text-xs cursor-pointer shadow-lg shadow-amber-950/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPlanningEpisode ? (
                  <>
                    <RotateCcw className="w-4 h-4 animate-spin" />
                    <span>جاري بناء مخطط الحلقة...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>إنشاء المخطط</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 2: PLAN VIEWER & EDITOR ================= */}
        {(activeStep === 'view_plan' || activeStep === 'editing') && activeDisplayPlan && (
          <div className="space-y-6">
            {/* Top Toolbar */}
            <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 flex flex-wrap items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-bold ${
                  activeDisplayPlan.status === 'ready_for_review'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : activeDisplayPlan.status === 'needs_decision'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : activeDisplayPlan.status === 'needs_revision'
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                    : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                }`}>
                  الحالة: {activeDisplayPlan.status}
                </span>

                <span className="text-xs text-zinc-400 font-mono">
                  النسخة v{activeDisplayPlan.version} • {activeDisplayPlan.units.length} وحدات
                </span>
              </div>

              {/* Action Buttons (Section 13) */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveAsDraft}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold cursor-pointer border border-zinc-700"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>حفظ كمسودة</span>
                </button>

                <button
                  type="button"
                  onClick={handleReviewPlan}
                  disabled={isValidating}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-amber-300 text-xs font-semibold cursor-pointer border border-zinc-700"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>راجع المخطط</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (confirm('هل ترغب في إعادة التخطيط؟ ستتم أرشفة هذا المخطط وإنشاء نسخة جديدة بالكامل.')) {
                      handleStartPlanning(true);
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold cursor-pointer border border-zinc-700"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>إعادة التخطيط</span>
                </button>

                <button
                  type="button"
                  onClick={handleArchivePlan}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 text-xs font-semibold cursor-pointer border border-zinc-800"
                >
                  <Archive className="w-3.5 h-3.5" />
                  <span>أرشفة المخطط</span>
                </button>

                <button
                  type="button"
                  onClick={handleApprovePlan}
                  disabled={isSaving || (activeDisplayPlan.validation_report?.critical_issues?.length ?? 0) > 0}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer shadow-lg shadow-emerald-950/40 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Check className="w-4 h-4" />
                  <span>اعتماد المخطط</span>
                </button>
              </div>
            </div>

            {/* Validation Pass Score & Alert Banner */}
            {activeDisplayPlan.validation_report && (
              <div className="p-4 rounded-xl bg-[#0f121a] border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="font-heading font-bold text-xs text-zinc-200">
                      تقرير المراجعة الآلية (Plan Validation Pass)
                    </span>
                  </div>
                  <span className={`text-[11px] font-mono font-bold ${
                    activeDisplayPlan.validation_report.approved_for_human_review ? 'text-emerald-400' : 'text-amber-400'
                  }`}>
                    {activeDisplayPlan.validation_report.approved_for_human_review
                      ? 'مؤهل للمراجعة البشرية'
                      : 'يحتاج تدقيق ملاحظات'}
                  </span>
                </div>

                {/* Scores Grid */}
                <div className="grid grid-cols-4 md:grid-cols-7 gap-2 text-center font-mono">
                  {Object.entries(activeDisplayPlan.validation_report.scores).map(([k, v]) => (
                    <div key={k} className="p-2 rounded-lg bg-zinc-900 border border-zinc-800/60">
                      <div className="text-[10px] text-zinc-500 uppercase">{k}</div>
                      <div className="text-sm font-bold text-amber-400">{v}/10</div>
                    </div>
                  ))}
                </div>

                {/* Critical or Major Issues */}
                {activeDisplayPlan.validation_report.critical_issues.length > 0 && (
                  <div className="p-3 rounded-lg bg-red-950/40 border border-red-800/80 text-xs text-red-200 space-y-1">
                    <span className="font-bold flex items-center gap-1 text-red-300">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>مشاكل حرجة (تمنع الاعتماد):</span>
                    </span>
                    {activeDisplayPlan.validation_report.critical_issues.map((iss, i) => (
                      <p key={i} className="text-[11px] text-red-300 font-sans">• {iss}</p>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 1. Episode Card (Section 11) */}
            <div className="p-5 rounded-2xl bg-[#0e1017] border border-zinc-800 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <Film className="w-5 h-5 text-amber-500" />
                  <h4 className="font-heading font-bold text-base text-zinc-100">
                    بطاقة الحلقة {activeDisplayPlan.episode_number}: {activeDisplayPlan.episode.proposed_title}
                  </h4>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1">العنوان المقترح</label>
                  <input
                    type="text"
                    value={activeDisplayPlan.episode.proposed_title}
                    onChange={(e) => handleUpdateEpisodeField('proposed_title', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1">وعد الحلقة للمستمع (Promise)</label>
                  <input
                    type="text"
                    value={activeDisplayPlan.episode.episode_promise}
                    onChange={(e) => handleUpdateEpisodeField('episode_promise', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1">ملخص الحبكة (Synopsis)</label>
                  <textarea
                    rows={2}
                    value={activeDisplayPlan.episode.synopsis}
                    onChange={(e) => handleUpdateEpisodeField('synopsis', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1">حالة البداية (Opening State)</label>
                  <textarea
                    rows={2}
                    value={activeDisplayPlan.episode.opening_state}
                    onChange={(e) => handleUpdateEpisodeField('opening_state', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1">حالة النهاية (Ending State)</label>
                  <textarea
                    rows={2}
                    value={activeDisplayPlan.episode.ending_state}
                    onChange={(e) => handleUpdateEpisodeField('ending_state', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1">الهدف الرئيسي (Objective)</label>
                  <input
                    type="text"
                    value={activeDisplayPlan.episode.main_objective}
                    onChange={(e) => handleUpdateEpisodeField('main_objective', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1">الصراع المركزي (Conflict)</label>
                  <input
                    type="text"
                    value={activeDisplayPlan.episode.central_conflict}
                    onChange={(e) => handleUpdateEpisodeField('central_conflict', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* 2. Five Units Cards (Section 11) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-heading font-bold text-sm text-zinc-200 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-500" />
                  <span>الوحدات السردية الخمس (5 Story Units):</span>
                </h4>
                <span className="text-xs text-zinc-500 font-mono">
                  حركة درامية واحدة متصلة
                </span>
              </div>

              {activeDisplayPlan.units.map((unit, idx) => {
                const isExpanded = expandedUnits[unit.unit_number] ?? true;

                return (
                  <div
                    key={unit.unit_number}
                    className="rounded-2xl bg-[#0f1117] border border-zinc-800 overflow-hidden shadow-md"
                  >
                    {/* Unit Header */}
                    <div
                      onClick={() => toggleUnitExpand(unit.unit_number)}
                      className="p-4 bg-zinc-900/60 hover:bg-zinc-900/90 border-b border-zinc-800 flex items-center justify-between cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-xs font-mono">
                          {unit.unit_number}
                        </span>
                        <div>
                          <span className="text-xs font-bold text-zinc-200 font-heading block">
                            {unit.title}
                          </span>
                          <span className="text-[10px] text-amber-400 font-mono">
                            الوظيفة: {unit.function} • المكان: {unit.location || 'غير محدد'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
                      </div>
                    </div>

                    {/* Unit Body */}
                    {isExpanded && (
                      <div className="p-4 space-y-4 text-xs">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-semibold text-zinc-400 mb-0.5">حالة البداية (Start State) *</label>
                            <textarea
                              rows={2}
                              value={unit.start_state}
                              onChange={(e) => handleUpdateUnitField(idx, 'start_state', e.target.value)}
                              className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs focus:border-amber-500 focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-semibold text-zinc-400 mb-0.5">حالة النهاية (End State) *</label>
                            <textarea
                              rows={2}
                              value={unit.end_state}
                              onChange={(e) => handleUpdateUnitField(idx, 'end_state', e.target.value)}
                              className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs focus:border-amber-500 focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-semibold text-zinc-400 mb-0.5">الهدف الدرامي والضغط</label>
                            <input
                              type="text"
                              value={`${unit.objective} (ضغط: ${unit.pressure})`}
                              onChange={(e) => handleUpdateUnitField(idx, 'objective', e.target.value)}
                              className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs focus:border-amber-500 focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-semibold text-zinc-400 mb-0.5">نقطة التحول (Turn) والخطاف (Hook)</label>
                            <input
                              type="text"
                              value={`تحول: ${unit.turn} | خطاف: ${unit.hook}`}
                              onChange={(e) => handleUpdateUnitField(idx, 'hook', e.target.value)}
                              className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs focus:border-amber-500 focus:outline-none"
                            />
                          </div>
                        </div>

                        {/* Badges / Micro details */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2 border-t border-zinc-800/60 text-[11px] font-mono">
                          <div className="p-2 rounded bg-black/40 border border-zinc-800/70">
                            <span className="text-[10px] text-zinc-500 block">الزرع (Plant):</span>
                            <span className="text-zinc-300">{Array.isArray(unit.plant) ? unit.plant.join(', ') || '—' : unit.plant}</span>
                          </div>
                          <div className="p-2 rounded bg-black/40 border border-zinc-800/70">
                            <span className="text-[10px] text-zinc-500 block">المردود (Payoff):</span>
                            <span className="text-zinc-300">{Array.isArray(unit.payoff) ? unit.payoff.join(', ') || '—' : unit.payoff}</span>
                          </div>
                          <div className="p-2 rounded bg-black/40 border border-zinc-800/70">
                            <span className="text-[10px] text-zinc-500 block">الشخصيات:</span>
                            <span className="text-amber-400">{Array.isArray(unit.characters) ? unit.characters.join(', ') || '—' : unit.characters}</span>
                          </div>
                          <div className="p-2 rounded bg-black/40 border border-zinc-800/70">
                            <span className="text-[10px] text-zinc-500 block">مخاطر الاستمرارية:</span>
                            <span className="text-red-400">{Array.isArray(unit.continuity_risks) ? unit.continuity_risks.join(', ') || 'لا توجد' : unit.continuity_risks}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* 3. Pending Story Decisions (Section 15) */}
            {activeDisplayPlan.pending_story_decisions && activeDisplayPlan.pending_story_decisions.length > 0 && (
              <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-800/60 space-y-3">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                  <HelpCircle className="w-4 h-4" />
                  <span>قرارات قصصية مطلوب حسمها من المؤلف (Pending Story Decisions):</span>
                </div>
                <div className="space-y-2">
                  {activeDisplayPlan.pending_story_decisions.map((dec, i) => (
                    <div key={i} className="p-3 rounded-lg bg-zinc-900 border border-amber-900/30 text-xs space-y-1">
                      <div className="font-bold text-zinc-200">{dec.question || dec.title}</div>
                      <p className="text-[11px] text-zinc-400">{dec.reasoning}</p>
                      {dec.options && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {dec.options.map((opt, oi) => (
                            <span key={oi} className="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300 text-[10px]">
                              {opt}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Back Button */}
            <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setActiveStep('setup')}
                className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold cursor-pointer"
              >
                العودة للإعدادات
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold cursor-pointer"
              >
                إغلاق الشاشة
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
