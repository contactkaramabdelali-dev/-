import React, { useState } from 'react';
import {
  Brain,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  FileCode,
  ShieldAlert,
  HelpCircle,
  Clock,
  Layers,
  ArrowRight,
  Database,
  Trash2,
  RefreshCw,
  Eye,
} from 'lucide-react';
import { useNovel } from '../../context/NovelContext';
import {
  NarrativeContextResult,
  OperationType,
  WarningSeverity,
} from '../../server/narrativeContextBuilder';
import { GenerationRun } from '../../types/database';

export const NarrativeContextTester: React.FC = () => {
  const {
    projects,
    activeProjectId,
    activeProject,
    setActiveProjectId,
    episodes,
    storyUnits,
    generationRuns,
    deleteGenerationRun,
    buildContext,
  } = useNovel();

  const [selectedEpisodeId, setSelectedEpisodeId] = useState<string>('');
  const [selectedUnitId, setSelectedUnitId] = useState<string>('');
  const [selectedOpType, setSelectedOpType] = useState<OperationType>('write_unit');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [contextResult, setContextResult] = useState<NarrativeContextResult | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'warnings' | 'missing' | 'canon' | 'characters' | 'secrets' | 'raw'>('overview');
  const [copiedJson, setCopiedJson] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>('warnings');

  // Filter units for selected episode
  const filteredUnits = storyUnits.filter((u) => {
    if (!selectedEpisodeId) return true;
    return u.episode_id === selectedEpisodeId;
  });

  const handleBuild = async () => {
    if (!activeProjectId) {
      setErrorMsg('يرجى اختيار مشروع أولاً');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const { result } = await buildContext(
        selectedEpisodeId || null,
        selectedUnitId || null,
        selectedOpType
      );
      setContextResult(result);
      if (result.continuity_warnings.length > 0) {
        setExpandedSection('warnings');
      } else if (result.missing_context.length > 0) {
        setExpandedSection('missing');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ أثناء بناء السياق');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyJSON = () => {
    if (!contextResult) return;
    // Copy sanitized JSON without raw secret system prompt
    const sanitizedCopy = {
      ...contextResult,
      active_system_prompt: {
        id: contextResult.active_system_prompt.id,
        name: contextResult.active_system_prompt.name,
        version: contextResult.active_system_prompt.version,
        is_active: contextResult.active_system_prompt.is_active,
        word_count: contextResult.active_system_prompt.word_count,
        note: 'تم إخفاء النص الكامل للموجه السيادي للحفاظ على الأمان',
      },
    };
    navigator.clipboard.writeText(JSON.stringify(sanitizedCopy, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const getSeverityBadge = (severity: WarningSeverity) => {
    switch (severity) {
      case 'critical':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-950/80 text-red-300 border border-red-800">
            حرج (Critical)
          </span>
        );
      case 'high':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950/80 text-amber-300 border border-amber-800">
            مرتفع (High)
          </span>
        );
      case 'medium':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-yellow-950/80 text-yellow-300 border border-yellow-800">
            متوسط (Medium)
          </span>
        );
      case 'low':
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-950/80 text-blue-300 border border-blue-800">
            طفيف (Low)
          </span>
        );
    }
  };

  const opTypeLabels: Record<OperationType, { name: string; desc: string }> = {
    plan_episode: { name: 'تخطيط حلقة (plan_episode)', desc: 'تجهيز سياق تخطيط الحلقة دون كتابة النص النهائي' },
    write_unit: { name: 'كتابة وحدة (write_unit)', desc: 'تجهيز سياق كتابة الوحدة السردية المطلوبة فقط' },
    review_unit: { name: 'مراجعة وحدة (review_unit)', desc: 'تجهيز سياق مراجعة النص واكتشاف التناقضات دون إعادة كتابته' },
    revise_unit: { name: 'تنقيح مسودة (revise_unit)', desc: 'تجهيز المسودة وتقرير المراجعة والتصحيحات' },
    extract_memory: { name: 'استخراج الذاكرة (extract_memory)', desc: 'تجهيز النص المعتمد لاستخراج الحقائق والتحولات' },
    continuity_check: { name: 'فحص الاستمرارية (continuity_check)', desc: 'إجراء مسح تقاطعي شامل لاكتشاف الثغرات' },
  };

  if (!activeProject) {
    return (
      <div className="p-8 text-center text-xs text-zinc-400 bg-[#0f1117] rounded-2xl border border-zinc-800">
        يرجى اختيار أو إنشاء مشروع أولاً لتشغيل محرك الذاكرة.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Configuration & Control Panel */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-[#0c0d12] via-[#10131d] to-[#0a0b0e] border border-zinc-800 shadow-2xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-850 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base text-zinc-100 flex items-center gap-2">
                <span>اختبار السياق السردي (Narrative Context Builder)</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono border border-amber-500/30">
                  Backend Service v1.0
                </span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                تجميع وانتقاء ذاكرة الرواية وفحص الاستمرارية وقوانين Canon تلقائياً قبل أي عملية.
              </p>
            </div>
          </div>

          <button
            onClick={handleBuild}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-zinc-950 font-bold text-xs shadow-lg shadow-amber-950/50 cursor-pointer transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>جاري بناء السياق...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>بناء السياق السردي</span>
              </>
            )}
          </button>
        </div>

        {/* Input Parameters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Project Selector */}
          <div>
            <label className="block text-[11px] font-mono text-zinc-400 mb-1.5">المشروع (Project)</label>
            <select
              value={activeProjectId || ''}
              onChange={(e) => setActiveProjectId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs focus:border-amber-500 focus:outline-none"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} ({p.status})
                </option>
              ))}
            </select>
          </div>

          {/* Episode Selector */}
          <div>
            <label className="block text-[11px] font-mono text-zinc-400 mb-1.5">الحلقة (Episode)</label>
            <select
              value={selectedEpisodeId}
              onChange={(e) => {
                setSelectedEpisodeId(e.target.value);
                setSelectedUnitId('');
              }}
              className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs focus:border-amber-500 focus:outline-none"
            >
              <option value="">-- الحلقة الحالية التلقائية --</option>
              {episodes.map((ep) => (
                <option key={ep.id} value={ep.id}>
                  الحلقة {ep.episode_number}: {ep.title} ({ep.publication_status})
                </option>
              ))}
            </select>
          </div>

          {/* Story Unit Selector */}
          <div>
            <label className="block text-[11px] font-mono text-zinc-400 mb-1.5">الوحدة السردية (Story Unit)</label>
            <select
              value={selectedUnitId}
              onChange={(e) => setSelectedUnitId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs focus:border-amber-500 focus:outline-none"
            >
              <option value="">-- الوحدة الحالية التلقائية --</option>
              {filteredUnits.map((u) => (
                <option key={u.id} value={u.id}>
                  وحدة {u.unit_number}: {u.title} ({u.status})
                </option>
              ))}
            </select>
          </div>

          {/* Operation Type Selector */}
          <div>
            <label className="block text-[11px] font-mono text-zinc-400 mb-1.5">نوع العملية (Operation Type)</label>
            <select
              value={selectedOpType}
              onChange={(e) => setSelectedOpType(e.target.value as OperationType)}
              className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-amber-500/40 text-amber-300 text-xs focus:border-amber-500 focus:outline-none font-mono"
            >
              <option value="write_unit">write_unit (كتابة المشهد الصوتي)</option>
              <option value="plan_episode">plan_episode (تخطيط الحلقة)</option>
              <option value="review_unit">review_unit (مراجعة وتدقيق النص)</option>
              <option value="revise_unit">revise_unit (تنقيح المسودة)</option>
              <option value="extract_memory">extract_memory (استخراج الذاكرة)</option>
              <option value="continuity_check">continuity_check (فحص الاستمرارية)</option>
            </select>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-red-950/30 border border-red-800 text-xs text-red-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Results View */}
      {contextResult && (
        <div className="space-y-5 animate-fade-in">
          {/* Metadata & System Prompt Header */}
          <div className="p-5 rounded-2xl bg-[#0f1117] border border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono font-bold text-zinc-100">
                  {contextResult.current_task.title}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono">
                  {contextResult.current_task.operation_type}
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">
                  تاريخ الإنشاء: {new Date(contextResult.context_metadata.generated_at).toLocaleTimeString('ar-MA')}
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                {contextResult.current_task.objective}
              </p>
            </div>

            {/* System Prompt Security Badge (Rule: Name, Version, Active status only - no full prompt) */}
            <div className="flex items-center gap-3">
              <div className="px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono">
                <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 mb-0.5">
                  <Lock className="w-3 h-3 text-amber-400" />
                  <span>العقل السردي (Active System Prompt):</span>
                </div>
                {contextResult.active_system_prompt.is_active ? (
                  <div className="flex items-center gap-2 text-emerald-400 font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>
                      v{contextResult.active_system_prompt.version} - {contextResult.active_system_prompt.name}
                    </span>
                    <span className="text-[10px] text-zinc-500">
                      ({contextResult.active_system_prompt.word_count} كلمة)
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-red-400 font-bold">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                    <span>ACTIVE_SYSTEM_PROMPT_NOT_FOUND</span>
                  </div>
                )}
              </div>

              <button
                onClick={handleCopyJSON}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-750 text-zinc-200 text-xs font-semibold cursor-pointer transition-colors"
                title="نسخ السياق بصيغة JSON"
              >
                {copiedJson ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400 font-mono">تم النسخ</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-amber-400" />
                    <span>نسخ JSON</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Continuity Warnings & Missing Context Top Alert Bars */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Continuity Warnings Card */}
            <div
              className={`p-4 rounded-2xl border transition-all ${
                contextResult.continuity_warnings.length > 0
                  ? 'bg-amber-950/15 border-amber-500/40'
                  : 'bg-emerald-950/15 border-emerald-500/30'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <ShieldAlert className={`w-4 h-4 ${contextResult.continuity_warnings.length > 0 ? 'text-amber-400' : 'text-emerald-400'}`} />
                  <h4 className="font-bold text-xs font-heading text-zinc-200">
                    تحذيرات الاستمرارية (Continuity Warnings)
                  </h4>
                </div>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-zinc-900 text-zinc-300">
                  {contextResult.continuity_warnings.length}
                </span>
              </div>

              {contextResult.continuity_warnings.length === 0 ? (
                <div className="text-[11px] text-emerald-400/90 font-mono flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>لا توجد تناقضات أو ثغرات استمرارية في السياق الحالي.</span>
                </div>
              ) : (
                <div className="space-y-2 mt-2 max-h-48 overflow-y-auto pr-1">
                  {contextResult.continuity_warnings.map((w) => (
                    <div key={w.id} className="p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-850 text-xs">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-[10px] text-zinc-400 font-mono">{w.category}</span>
                        {getSeverityBadge(w.severity)}
                      </div>
                      <p className="text-zinc-200 font-sans text-xs">{w.message}</p>
                      {w.suggested_action && (
                        <div className="text-[11px] text-amber-400/90 font-mono mt-1">
                          مقترح: {w.suggested_action}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Missing Context Card */}
            <div
              className={`p-4 rounded-2xl border transition-all ${
                contextResult.missing_context.length > 0
                  ? 'bg-red-950/15 border-red-500/30'
                  : 'bg-emerald-950/15 border-emerald-500/30'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <HelpCircle className={`w-4 h-4 ${contextResult.missing_context.length > 0 ? 'text-red-400' : 'text-emerald-400'}`} />
                  <h4 className="font-bold text-xs font-heading text-zinc-200">
                    السياق الناقص (Missing Context)
                  </h4>
                </div>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-zinc-900 text-zinc-300">
                  {contextResult.missing_context.length}
                </span>
              </div>

              {contextResult.missing_context.length === 0 ? (
                <div className="text-[11px] text-emerald-400/90 font-mono flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>جميع البيانات والوثائق الضرورية للمهمة متوفرة بالكامل.</span>
                </div>
              ) : (
                <div className="space-y-2 mt-2 max-h-48 overflow-y-auto pr-1">
                  {contextResult.missing_context.map((m) => (
                    <div key={m.key} className="p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-850 text-xs">
                      <div className="font-bold font-mono text-[10px] text-red-400 mb-0.5">{m.key}</div>
                      <p className="text-zinc-200 text-xs">{m.description}</p>
                      <div className="text-[11px] text-zinc-400 font-mono mt-1">الحل: {m.resolution}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Section Explorer Tabs */}
          <div className="p-5 rounded-2xl bg-[#0f1117] border border-zinc-800 space-y-4">
            <div className="flex items-center gap-2 flex-wrap border-b border-zinc-800 pb-3">
              {[
                { id: 'overview', label: 'الحالة الحالية والتسليم', badge: null },
                { id: 'canon', label: 'حقائق Canon المقفلة', badge: contextResult.published_facts.length },
                { id: 'characters', label: 'الشخصيات وحدود المعرفة', badge: contextResult.relevant_characters.length },
                { id: 'secrets', label: 'الأسرار والتلميحات', badge: contextResult.active_secrets.length + contextResult.relevant_clues.length },
                { id: 'raw', label: 'معاينة JSON المنظم', badge: null },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                    activeTab === tab.id
                      ? 'bg-amber-500 text-zinc-950 font-bold'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.badge !== null && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      activeTab === tab.id ? 'bg-zinc-950 text-amber-300' : 'bg-zinc-800 text-zinc-300'
                    }`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Tab 1: Overview */}
            {activeTab === 'overview' && (
              <div className="space-y-4 text-xs font-sans">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Current State Box */}
                  <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-850 space-y-2">
                    <h5 className="font-heading font-bold text-amber-400 text-xs flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5" />
                      <span>الحالة الراهنة (Current State):</span>
                    </h5>
                    <div className="space-y-1.5 text-zinc-300 font-mono text-[11px]">
                      <div>الحلقة: {contextResult.current_state.current_episode_title} (#{contextResult.current_state.current_episode_number})</div>
                      <div>الوحدة: {contextResult.current_state.current_unit_title} (#{contextResult.current_state.current_unit_number})</div>
                      <div>المكان: <span className="text-amber-300 font-bold">{contextResult.current_state.current_scene_location}</span></div>
                      <div>الشخصيات المتوقعة: {contextResult.current_state.expected_characters_present.join(', ') || 'لا توجد'}</div>
                      <div>الضغط / الصراع النشط: {contextResult.current_state.active_danger_or_conflict}</div>
                    </div>
                  </div>

                  {/* Previous Unit Handover */}
                  <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-850 space-y-2">
                    <div className="flex items-center justify-between">
                      <h5 className="font-heading font-bold text-amber-400 text-xs flex items-center gap-1.5">
                        <ArrowRight className="w-3.5 h-3.5" />
                        <span>الوحدة السابقة (Previous Unit Delivery):</span>
                      </h5>
                      {contextResult.previous_unit.is_approved && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono border border-emerald-500/30">
                          معتمدة (Approved)
                        </span>
                      )}
                    </div>
                    {contextResult.previous_unit.final_content ? (
                      <div>
                        <div className="text-[10px] text-zinc-500 font-mono mb-1">
                          نهاية الوحدة السابقة (Hook / Handover):
                        </div>
                        <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200 font-mono text-xs leading-relaxed max-h-36 overflow-y-auto">
                          {contextResult.previous_unit.final_content}
                        </div>
                      </div>
                    ) : (
                      <div className="text-zinc-500 font-mono text-[11px]">
                        {contextResult.previous_unit.note || 'لا توجد وحدة سابقة معتمدة.'}
                      </div>
                    )}
                  </div>
                </div>

                {/* Current Unit Plan */}
                {contextResult.current_plan.objective && (
                  <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-850 space-y-2">
                    <div className="flex items-center justify-between">
                      <h5 className="font-heading font-bold text-amber-400 text-xs">
                        مخطط الوحدة الحالية (Current Plan):
                      </h5>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono">
                        الوظيفة: {contextResult.current_plan.function}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] font-mono">
                      <div className="p-2 rounded bg-zinc-900">
                        <span className="text-zinc-500 block">الهدف (Objective):</span>
                        <span className="text-zinc-200">{contextResult.current_plan.objective}</span>
                      </div>
                      <div className="p-2 rounded bg-zinc-900">
                        <span className="text-zinc-500 block">المعلومة (Information):</span>
                        <span className="text-zinc-200">{contextResult.current_plan.information || 'لا توجد'}</span>
                      </div>
                      <div className="p-2 rounded bg-zinc-900">
                        <span className="text-zinc-500 block">الزرع والربط (Plant & Payoff):</span>
                        <span className="text-zinc-200">
                          {contextResult.current_plan.plant || 'لا يوجد'} / {contextResult.current_plan.payoff || 'لا يوجد'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Canon Facts */}
            {activeTab === 'canon' && (
              <div className="space-y-3">
                <div className="text-xs text-zinc-400 flex items-center justify-between">
                  <span>حقائق Canon المستخرجة من الحلقات المنشورة ودستور الرواية (غير قابلة للكسر)</span>
                  <span className="text-amber-400 font-mono text-[11px] flex items-center gap-1">
                    <Lock className="w-3 h-3" /> CANON_LOCKED = true
                  </span>
                </div>

                {contextResult.published_facts.length === 0 ? (
                  <div className="p-6 text-center text-xs text-zinc-500 font-mono">
                    لا توجد حقائق معتمدة أو منشورة مسجلة حتى الآن.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {contextResult.published_facts.map((fact) => (
                      <div key={fact.id} className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-start gap-2.5">
                        <Lock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-300 font-mono border border-emerald-500/20">
                              {fact.category}
                            </span>
                            <span className="text-[10px] text-zinc-500 font-mono">
                              {fact.source_episode || fact.source_type}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-200 leading-relaxed">{fact.statement}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Characters & Knowledge Partitioning */}
            {activeTab === 'characters' && (
              <div className="space-y-4">
                <div className="text-xs text-zinc-400">
                  فصل صارم لحدود معرفة كل شخصية (ما تعرفه، ما تعتقده، والممنوع أن تتصرف على أساسه).
                </div>

                {contextResult.relevant_characters.length === 0 ? (
                  <div className="p-6 text-center text-xs text-zinc-500 font-mono">
                    لم يتم العثور على شخصيات مرتبطة بالمشهد الحالي.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {contextResult.relevant_characters.map((c) => (
                      <div key={c.id} className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h5 className="font-heading font-bold text-sm text-zinc-100 flex items-center gap-2">
                              <span>{c.name}</span>
                              <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-amber-400 font-mono">
                                {c.role}
                              </span>
                            </h5>
                            <div className="text-[11px] text-zinc-500 font-mono mt-0.5">
                              الموقع: {c.current_location || 'غير محدد'} | الحالة النفسية: {c.psychological_state || 'مستقرة'}
                            </div>
                          </div>
                        </div>

                        {/* Knowledge partition */}
                        <div className="space-y-2 text-xs font-mono">
                          {c.knowledge_partition.forbidden_knowledge.length > 0 && (
                            <div className="p-2.5 rounded-lg bg-red-950/20 border border-red-900/40 text-red-300">
                              <span className="text-[10px] font-bold block mb-1">المعلومات المحظورة (Forbidden Knowledge):</span>
                              <ul className="list-disc list-inside text-[11px] space-y-0.5">
                                {c.knowledge_partition.forbidden_knowledge.map((f, i) => (
                                  <li key={i}>{f}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {c.current_knowledge && (
                            <div className="p-2 rounded bg-zinc-900 text-zinc-300">
                              <span className="text-[10px] text-zinc-500 block">ما تعرفه الشخصية:</span>
                              <p className="text-[11px] text-zinc-200 line-clamp-3">{c.current_knowledge}</p>
                            </div>
                          )}

                          {c.speaking_style && (
                            <div className="text-[11px] text-amber-400/90 font-mono">
                              نبرة الصوت والأسلوب: {c.speaking_style}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab 4: Secrets & Clues */}
            {activeTab === 'secrets' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Secrets */}
                  <div className="space-y-3">
                    <h5 className="font-heading font-bold text-xs text-amber-400">
                      الأسرار النشطة ({contextResult.active_secrets.length})
                    </h5>
                    {contextResult.active_secrets.map((sec) => (
                      <div key={sec.id} className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-zinc-200">{sec.title}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-amber-400 font-mono">
                            {sec.reveal_stage}
                          </span>
                        </div>
                        <p className="text-zinc-400 text-xs">{sec.hidden_truth}</p>
                        <div className="text-[10px] text-zinc-500 font-mono">
                          الحلقة المخططة للكشف: {sec.planned_reveal_episode || 'غير محددة'}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Clues */}
                  <div className="space-y-3">
                    <h5 className="font-heading font-bold text-xs text-amber-400">
                      التلميحات المصنفة ({contextResult.relevant_clues.length})
                    </h5>
                    {contextResult.relevant_clues.map((clue, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-zinc-200">{clue.description}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-900 text-amber-300 font-mono border border-zinc-800">
                            {clue.classification}
                          </span>
                        </div>
                        <div className="text-[11px] text-zinc-400 font-mono">
                          مرتبط بـ: {clue.related_secret_title} | الحالة: {clue.payoff_status}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Tab 5: Raw JSON */}
            {activeTab === 'raw' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-400 font-mono">Context Payload (Sanitized)</span>
                  <button
                    onClick={handleCopyJSON}
                    className="text-xs text-amber-400 hover:underline font-mono"
                  >
                    نسخ إلى الحافظة
                  </button>
                </div>
                <pre className="p-4 rounded-xl bg-black border border-zinc-800 text-zinc-300 font-mono text-[11px] leading-relaxed max-h-96 overflow-auto" dir="ltr">
                  {JSON.stringify(
                    {
                      ...contextResult,
                      active_system_prompt: {
                        id: contextResult.active_system_prompt.id,
                        name: contextResult.active_system_prompt.name,
                        version: contextResult.active_system_prompt.version,
                        is_active: contextResult.active_system_prompt.is_active,
                        word_count: contextResult.active_system_prompt.word_count,
                        protected: true,
                      },
                    },
                    null,
                    2
                  )}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Generation Runs History (Permanent Audit Log) */}
      <div className="p-6 rounded-2xl bg-[#0f1117] border border-zinc-800/80 space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <h4 className="font-heading font-bold text-sm text-zinc-100">
              سجل استدعاءات السياق السردي (GENERATION_RUNS - {generationRuns.length})
            </h4>
          </div>
          <span className="text-[11px] text-zinc-500 font-mono">محفوظ دائماً في قاعدة البيانات</span>
        </div>

        {generationRuns.length === 0 ? (
          <div className="p-6 text-center text-xs text-zinc-500 font-mono">
            لم يتم إنشاء أي سياق سردي بعد. اضغط على «بناء السياق السردي» أعلاه لبدء أول تشغيل.
          </div>
        ) : (
          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
            {generationRuns.map((run) => (
              <div
                key={run.id}
                className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-850 hover:border-zinc-750 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-amber-300 font-mono font-bold">
                      {run.operation_type}
                    </span>
                    <span className="text-[11px] text-zinc-400 font-mono">
                      {new Date(run.created_at).toLocaleString('ar-MA')}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 font-mono border border-zinc-800">
                      accepted: {String(run.accepted)}
                    </span>
                  </div>
                  <div className="text-[11px] text-zinc-400 font-mono">
                    {run.validation_result}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      try {
                        const parsed = JSON.parse(run.input_context);
                        setContextResult(parsed);
                      } catch {
                        alert('تعذر تحميل تفاصيل السياق');
                      }
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-750 text-zinc-200 text-xs font-semibold cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>عرض السياق</span>
                  </button>

                  <button
                    onClick={() => {
                      if (confirm('حذف هذا السجل من تاريخ التشغيل؟')) {
                        deleteGenerationRun(run.id);
                      }
                    }}
                    className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors"
                    title="حذف السجل"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
