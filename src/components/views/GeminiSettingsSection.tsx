import React, { useState } from 'react';
import {
  Sparkles,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Sliders,
  ShieldCheck,
  Clock,
  Layers,
  Check,
  Lock,
  ChevronRight,
  Eye,
} from 'lucide-react';
import { useNovel } from '../../context/NovelContext';
import { Modal } from '../common/Modal';

export const GeminiSettingsSection: React.FC = () => {
  const {
    activeProject,
    modelConfig,
    updateModelConfig,
    testGeminiConnection,
    testContextWithGemini,
    lastConnectionTest,
    episodes,
    storyUnits,
  } = useNovel();

  const [selectedModel, setSelectedModel] = useState<string>(
    modelConfig?.default_model || 'gemini-3.8-flash'
  );
  const [temps, setTemps] = useState<Record<string, number>>({
    plan_episode: modelConfig?.temperatures?.plan_episode ?? 0.4,
    write_unit: modelConfig?.temperatures?.write_unit ?? 0.75,
    review_unit: modelConfig?.temperatures?.review_unit ?? 0.3,
    revise_unit: modelConfig?.temperatures?.revise_unit ?? 0.7,
    extract_memory: modelConfig?.temperatures?.extract_memory ?? 0.2,
    continuity_check: modelConfig?.temperatures?.continuity_check ?? 0.2,
  });

  const [isTesting, setIsTesting] = useState(false);
  const [connResult, setConnResult] = useState<{
    connected?: boolean;
    status: string;
    model: string;
    message?: string;
    timestamp: string;
  } | null>(lastConnectionTest);
  const [connError, setConnError] = useState<{
    connected: boolean;
    error_code: string;
    message: string;
    http_status?: number;
    technical_summary?: string;
  } | null>(null);

  const [isTestingContext, setIsTestingContext] = useState(false);
  const [contextResult, setContextResult] = useState<any | null>(null);
  const [contextError, setContextError] = useState<string | null>(null);
  const [isContextModalOpen, setIsContextModalOpen] = useState(false);

  const [saveSuccess, setSaveSuccess] = useState(false);

  // Handle Testing Gemini Connection (Section 8)
  const handleTestConnection = async () => {
    if (isTesting) return; // Prevent repeated clicks
    setIsTesting(true);
    setConnError(null);
    setConnResult(null);

    try {
      const res = await testGeminiConnection(selectedModel);
      setConnResult(res);
    } catch (err: any) {
      setConnError({
        connected: false,
        error_code: err?.error_code || 'CONNECTION_FAILED',
        message: err?.message || 'فشل الاتصال بـGemini',
        http_status: err?.http_status,
        technical_summary: err?.technical_summary || err?.message || '',
      });
      setConnResult(null);
    } finally {
      setIsTesting(false);
    }
  };

  // Handle Testing Context Integration (Section 9)
  const handleTestContext = async () => {
    if (!activeProject) {
      setContextError('يرجى اختيار مشروع أولاً لتنفيذ اختبار السياق');
      return;
    }

    setIsTestingContext(true);
    setContextError(null);
    try {
      const res = await testContextWithGemini();
      setContextResult(res);
      setIsContextModalOpen(true);
    } catch (err: any) {
      setContextError(err.message || 'فشل اختبار السياق مع Gemini');
    } finally {
      setIsTestingContext(false);
    }
  };

  // Save Model Configurations
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateModelConfig(selectedModel, temps);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-zinc-950 via-[#0e111a] to-zinc-900 border border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-amber-500 text-xs font-mono mb-1">
            <Cpu className="w-4 h-4 text-amber-400" />
            <span className="font-bold">Google Gen AI Runtime (Server-Side)</span>
          </div>
          <h3 className="text-lg font-bold font-heading text-zinc-100 flex items-center gap-2">
            <span>إعدادات نموذج الكتابة والاستدلال السردي</span>
          </h3>
          <p className="text-xs text-zinc-400 mt-1 max-w-xl">
            إدارة النماذج ومعاملات التوليد لعمليات التخطيط، الصياغة الصوتية، التدقيق، واستخراج الذاكرة.
          </p>
        </div>

        {/* Connection Status Badge */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs font-mono">
            <div className="text-[10px] text-zinc-500">حالة الربط:</div>
            {connResult?.status === 'connected' ? (
              <div className="text-emerald-400 font-bold flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>متصل بنجاح ({connResult.model})</span>
              </div>
            ) : connError ? (
              <div className="text-red-400 font-bold flex items-center gap-1.5 mt-0.5">
                <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                <span>غير متصل ({connError.error_code})</span>
              </div>
            ) : (
              <div className="text-amber-400 font-bold flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>جاهز للاختبار</span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleTestConnection}
            disabled={isTesting}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-zinc-950 font-bold text-xs cursor-pointer shadow-lg shadow-amber-950/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isTesting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>جاري اختبار الاتصال...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>اختبار الاتصال بـGemini</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Secret Key Security Notice */}
      <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-900/40 text-xs text-emerald-300 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold block text-emerald-200 mb-0.5">
            حماية المفاتيح والأمان (Server-Side Secrets Policy):
          </span>
          <p className="text-emerald-300/80 leading-relaxed text-[11px]">
            يتم استدعاء Gemini API عبر مسار الخادم الداخلي (`/api/gemini/*`) حصراً، وتُحقن قيمة `GEMINI_API_KEY` مباشرة من إعدادات المنصة دون كشفها في المتصفح أو تخزينها في قاعدة البيانات.
          </p>
        </div>
      </div>

      {/* Connection Test Output Alert */}
      {connResult && connResult.status === 'connected' && (
        <div className="p-4 rounded-xl bg-zinc-900/70 border border-emerald-500/30 text-xs font-mono space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-emerald-400 font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>{connResult.message || 'تم الاتصال بـGemini بنجاح'}</span>
            </span>
            <span className="text-[10px] text-zinc-500">
              {new Date(connResult.timestamp).toLocaleString('ar-MA')}
            </span>
          </div>
          <div className="p-2.5 rounded bg-black border border-zinc-800 text-[11px] text-emerald-300">
            <pre className="whitespace-pre-wrap">{JSON.stringify({
              connected: true,
              status: connResult.status,
              model: connResult.model,
              message: connResult.message || 'تم الاتصال بـGemini بنجاح'
            }, null, 2)}</pre>
          </div>
        </div>
      )}

      {connError && (
        <div className="p-4 rounded-xl bg-red-950/30 border border-red-800 text-xs space-y-2">
          <div className="font-bold flex items-center justify-between text-red-400">
            <span className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span>فشل اختبار الاتصال ({connError.error_code})</span>
            </span>
            {connError.http_status && (
              <span className="px-2 py-0.5 rounded bg-red-900/50 text-[10px] font-mono text-red-300">
                HTTP {connError.http_status}
              </span>
            )}
          </div>
          <p className="text-[12px] text-zinc-200">{connError.message}</p>
          <div className="p-2.5 rounded bg-black border border-red-900/50 text-[11px] font-mono text-red-300">
            <pre className="whitespace-pre-wrap">{JSON.stringify({
              connected: false,
              error_code: connError.error_code,
              message: connError.message,
              ...(connError.http_status ? { http_status: connError.http_status } : {}),
              ...(connError.technical_summary ? { technical_summary: connError.technical_summary } : {})
            }, null, 2)}</pre>
          </div>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSaveConfig} className="p-6 rounded-2xl bg-[#0f1117] border border-zinc-800/80 space-y-6">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-amber-500" />
            <h4 className="font-heading font-bold text-sm text-zinc-100">
              النموذج ومعاملات التوليد المركزية (DEFAULT_NARRATIVE_MODEL)
            </h4>
          </div>
          {saveSuccess && (
            <span className="text-xs text-emerald-400 font-mono flex items-center gap-1 animate-fade-in">
              <Check className="w-3.5 h-3.5" />
              <span>تم حفظ الإعدادات بنجاح</span>
            </span>
          )}
        </div>

        {/* Model Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              اسم النموذج الافتراضي (Model ID) *
            </label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs focus:border-amber-500 focus:outline-none font-mono"
            >
              <option value="gemini-3-flash-preview">gemini-3-flash-preview (سريع ومستقر للاستدلال السردي)</option>
              <option value="gemini-3.8-flash">gemini-3.8-flash (الموصى به - متوازن، سريع، وسياق طويل)</option>
              <option value="gemini-flash-latest">gemini-flash-latest (أحدث إصدار Flash مستقر)</option>
              <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (خفيف وسريع جداً للمراجعات)</option>
            </select>
            <p className="text-[10px] text-zinc-500 mt-1 font-mono">
              يُطبق مركزياً على كافة وظائف الاستدلال مع إمكانية التخصيص.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              الحد الأقصى للرموز (Max Output Tokens)
            </label>
            <input
              type="number"
              value={modelConfig?.default_model ? 8192 : 8192}
              disabled
              className="w-full px-3 py-2.5 rounded-xl bg-zinc-900/50 border border-zinc-800 text-zinc-400 text-xs font-mono"
            />
            <p className="text-[10px] text-zinc-500 mt-1 font-mono">
              مضبوط افتراضياً على 8192 رمزاً لاستيعاب الوحدات الطويلة.
            </p>
          </div>
        </div>

        {/* Operation Temperatures Grid */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-300">
              درجة الإبداعية والحرارة حسب نوع العملية (Temperature per Operation)
            </span>
            <span className="text-[11px] text-zinc-500 font-mono">
              (منخفضة للدقة واستخراج الحقائق، متوسطة للصياغة الروائية)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            {/* Write Unit */}
            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-850 space-y-2">
              <div className="flex justify-between font-mono text-[11px]">
                <span className="text-zinc-300">كتابة الوحدة (write_unit)</span>
                <span className="text-amber-400 font-bold">{temps.write_unit}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={temps.write_unit}
                onChange={(e) => setTemps({ ...temps, write_unit: parseFloat(e.target.value) })}
                className="w-full accent-amber-500"
              />
              <span className="text-[10px] text-zinc-500 block">إبداعية متوسطة-مرتفعة للحوار والتشويق</span>
            </div>

            {/* Plan Episode */}
            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-850 space-y-2">
              <div className="flex justify-between font-mono text-[11px]">
                <span className="text-zinc-300">تخطيط الحلقة (plan_episode)</span>
                <span className="text-amber-400 font-bold">{temps.plan_episode}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={temps.plan_episode}
                onChange={(e) => setTemps({ ...temps, plan_episode: parseFloat(e.target.value) })}
                className="w-full accent-amber-500"
              />
              <span className="text-[10px] text-zinc-500 block">توازن هيكلي دقيق للصراعات</span>
            </div>

            {/* Review Unit */}
            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-850 space-y-2">
              <div className="flex justify-between font-mono text-[11px]">
                <span className="text-zinc-300">مراجعة النص (review_unit)</span>
                <span className="text-amber-400 font-bold">{temps.review_unit}</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.05"
                value={temps.review_unit}
                onChange={(e) => setTemps({ ...temps, review_unit: parseFloat(e.target.value) })}
                className="w-full accent-amber-500"
              />
              <span className="text-[10px] text-zinc-500 block">منخفضة للصرامة ورصد الثغرات</span>
            </div>

            {/* Revise Unit */}
            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-850 space-y-2">
              <div className="flex justify-between font-mono text-[11px]">
                <span className="text-zinc-300">تنقيح المسودة (revise_unit)</span>
                <span className="text-amber-400 font-bold">{temps.revise_unit}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={temps.revise_unit}
                onChange={(e) => setTemps({ ...temps, revise_unit: parseFloat(e.target.value) })}
                className="w-full accent-amber-500"
              />
              <span className="text-[10px] text-zinc-500 block">معالجة التحذيرات مع الحفاظ على النبرة</span>
            </div>

            {/* Extract Memory */}
            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-850 space-y-2">
              <div className="flex justify-between font-mono text-[11px]">
                <span className="text-zinc-300">استخراج الذاكرة (extract_memory)</span>
                <span className="text-amber-400 font-bold">{temps.extract_memory}</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.05"
                value={temps.extract_memory}
                onChange={(e) => setTemps({ ...temps, extract_memory: parseFloat(e.target.value) })}
                className="w-full accent-amber-500"
              />
              <span className="text-[10px] text-zinc-500 block">دقة مطلقة لاستخراج الحقائق فقط</span>
            </div>

            {/* Continuity Check */}
            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-850 space-y-2">
              <div className="flex justify-between font-mono text-[11px]">
                <span className="text-zinc-300">فحص الاستمرارية (continuity_check)</span>
                <span className="text-amber-400 font-bold">{temps.continuity_check}</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.05"
                value={temps.continuity_check}
                onChange={(e) => setTemps({ ...temps, continuity_check: parseFloat(e.target.value) })}
                className="w-full accent-amber-500"
              />
              <span className="text-[10px] text-zinc-500 block">مطابقة منطقية صارمة دون تخمين</span>
            </div>
          </div>
        </div>

        {/* Buttons footer */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-zinc-800">
          {/* Section 9 Button: اختبار السياق مع Gemini */}
          <button
            type="button"
            onClick={handleTestContext}
            disabled={isTestingContext}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-850 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-semibold cursor-pointer transition-colors disabled:opacity-50"
          >
            {isTestingContext ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                <span>جاري فحص بنية السياق...</span>
              </>
            ) : (
              <>
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                <span>اختبار التكامل: فحص السياق مع Gemini</span>
              </>
            )}
          </button>

          <button
            type="submit"
            className="px-6 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-zinc-950 font-bold text-xs cursor-pointer shadow-md transition-colors"
          >
            حفظ إعدادات النموذج
          </button>
        </div>
      </form>

      {/* Context Integration Modal (Section 9) */}
      <Modal
        isOpen={isContextModalOpen}
        onClose={() => setIsContextModalOpen(false)}
        title="نتائج فحص تكامل السياق مع Gemini (Context Test)"
        subtitle="فحص بنيوي للتأكد من استلام أقسام الذاكرة دون كتابة نصوص"
      >
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/30 text-xs text-amber-300 font-mono flex items-center justify-between">
            <span>جاهزية التوليد المباشر:</span>
            <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-750 text-amber-400 font-bold">
              ready_for_generation: false (المرحلة الخامسة: ربط API فقط)
            </span>
          </div>

          {contextResult && (
            <div className="space-y-3 text-xs font-mono">
              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
                <span className="text-zinc-500 text-[10px] block">الأقسام التي تم رصدها (Sections Detected):</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {contextResult.sections_detected?.map((s: string, idx: number) => (
                    <span key={idx} className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-750 text-zinc-200 text-[11px]">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {contextResult.missing_sections?.length > 0 && (
                <div className="p-3 rounded-xl bg-red-950/20 border border-red-900/40 text-red-300 space-y-1">
                  <span className="text-[10px] font-bold block">الأقسام الناقصة التي تم اكتشافها:</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {contextResult.missing_sections.map((m: string, idx: number) => (
                      <span key={idx} className="px-2 py-0.5 rounded bg-red-950 border border-red-800 text-red-200 text-[11px]">
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-3 rounded-xl bg-black border border-zinc-850 text-zinc-300 text-[11px]">
                <pre>{JSON.stringify(contextResult, null, 2)}</pre>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
