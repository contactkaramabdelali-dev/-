import React, { useState } from 'react';
import {
  CheckCheck,
  AlertTriangle,
  GitFork,
  KeyRound,
  Sparkles,
  Milestone,
  Film,
  CheckCircle2,
  Clock,
  Feather,
  Plus,
  Trash2,
  Edit3,
} from 'lucide-react';
import { useNovel } from '../../context/NovelContext';
import { ContinuityLogEntry } from '../../types/database';
import { EmptyState } from '../common/EmptyState';
import { Modal } from '../common/Modal';

export const ReviewView: React.FC = () => {
  const {
    activeProject,
    characters,
    episodes,
    storyUnits,
    secrets,
    clues,
    openLoops,
    continuityLogs,
    addContinuityLog,
    updateContinuityLog,
    deleteContinuityLog,
    setActiveView,
    setCurrentEpisodeId,
  } = useNovel();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<ContinuityLogEntry | null>(null);

  // Form State
  const [category, setCategory] = useState<ContinuityLogEntry['category']>('تناقض زمني');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<ContinuityLogEntry['severity']>('متوسط');
  const [suggestedFix, setSuggestedFix] = useState('');
  const [status, setStatus] = useState<ContinuityLogEntry['status']>('قيد الانتظار');
  const [episodeId, setEpisodeId] = useState('');

  // Automated continuity checks
  const unresolvedThreads = openLoops.filter(t => t.status === 'مفتوح');
  const activeSecrets = secrets.filter(s => s.status === 'نشط وغير معلن');
  const secretsWithoutHints = activeSecrets.filter(
    s => !clues.some(c => c.secret_id === s.id)
  );
  const pendingClues = clues.filter(c => c.payoff_status === 'مزروع في النص');
  const episodesWithoutUnits = episodes.filter(
    e => !storyUnits.some(u => u.episode_id === e.id)
  );

  let continuityScore = 100;
  if (unresolvedThreads.length > 5) continuityScore -= 15;
  if (secretsWithoutHints.length > 2) continuityScore -= 15;
  if (episodesWithoutUnits.length > 1) continuityScore -= 10;
  if (continuityLogs.filter(l => l.status === 'قيد الانتظار' && l.severity === 'حرج').length > 0) continuityScore -= 20;
  continuityScore = Math.max(15, Math.min(100, continuityScore));

  const hasData =
    characters.length > 0 ||
    episodes.length > 0 ||
    secrets.length > 0 ||
    openLoops.length > 0 ||
    continuityLogs.length > 0;

  const openAddModal = () => {
    setEditingLog(null);
    setCategory('تناقض زمني');
    setDescription('');
    setSeverity('متوسط');
    setSuggestedFix('');
    setStatus('قيد الانتظار');
    setEpisodeId('');
    setIsModalOpen(true);
  };

  const openEditModal = (log: ContinuityLogEntry) => {
    setEditingLog(log);
    setCategory(log.category);
    setDescription(log.description);
    setSeverity(log.severity);
    setSuggestedFix(log.suggested_fix);
    setStatus(log.status);
    setEpisodeId(log.episode_id || '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    if (editingLog) {
      await updateContinuityLog(editingLog.id, {
        category,
        description: description.trim(),
        severity,
        suggested_fix: suggestedFix.trim(),
        status,
        episode_id: episodeId || undefined,
      });
    } else {
      await addContinuityLog({
        category,
        description: description.trim(),
        severity,
        suggested_fix: suggestedFix.trim(),
        status,
        episode_id: episodeId || undefined,
      });
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-[#0f1117] border border-zinc-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono mb-1">
            <CheckCheck className="w-4 h-4" />
            <span>نظام التدقيق والاتساق السردي (Continuity Auditor)</span>
          </div>
          <h2 className="text-xl font-bold font-heading text-zinc-100">
            فحص استمرارية الرواية الصوتية وحبكة الغموض
          </h2>
          <p className="text-xs text-zinc-400 mt-1 max-w-xl">
            يرصد هذا المركز التناقضات السردية، الخيوط المنسية، وتفاصيل الأسرار لضمان تجربة استماع محكمة ومقنعة.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {hasData && (
            <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-zinc-900 border border-zinc-800">
              <div className="text-left font-mono">
                <div className="text-xs text-zinc-400">مؤشر الاتساق</div>
                <div className="text-2xl font-black font-heading text-emerald-400">
                  {continuityScore}%
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
          )}

          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-zinc-950 font-bold text-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>تسجيل ملاحظة تدقيق</span>
          </button>
        </div>
      </div>

      {!hasData ? (
        <EmptyState
          icon={CheckCheck}
          title="لا توجد بيانات كافية لإجراء فحص الاستمرارية"
          description="يبدأ مركز المراجعة في العمل التلقائي بمجرد إضافة حلقات، أسرار، أو خيوط سردية، ليراقب عدم وقوع أي تناقض أثناء كتابتك."
          actionLabel="العودة للوحة التحكم"
          onAction={() => setActiveView('dashboard')}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card: Unresolved Threads */}
          <div className="p-6 rounded-2xl bg-[#0f1117] border border-zinc-800/80 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <GitFork className="w-4 h-4 text-amber-500" />
                <h3 className="font-heading font-bold text-sm text-zinc-200">
                  خيوط سردية مفتوحة بحاجة لمتابعة ({unresolvedThreads.length})
                </h3>
              </div>
              <button
                onClick={() => setActiveView('threads')}
                className="text-xs text-amber-400 hover:text-amber-300 font-semibold"
              >
                إدارة الخيوط
              </button>
            </div>

            {unresolvedThreads.length === 0 ? (
              <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-900/30 text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>ممتاز! كل الخيوط السردية التي فُتحت تم حسمها بنجاح.</span>
              </div>
            ) : (
              <div className="space-y-2">
                {unresolvedThreads.map((t) => (
                  <div
                    key={t.id}
                    className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-850 flex items-start justify-between gap-3 text-xs"
                  >
                    <div>
                      <span className="font-bold text-zinc-200 block">{t.title}</span>
                      <span className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5">
                        {t.description}
                      </span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-red-950/40 text-red-400 border border-red-900/40 shrink-0 font-mono">
                      {t.urgency}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Card: Secrets without Clues */}
          <div className="p-6 rounded-2xl bg-[#0f1117] border border-zinc-800/80 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-500" />
                <h3 className="font-heading font-bold text-sm text-zinc-200">
                  أسرار نشطة دون تلميحات ممهدة في النص ({secretsWithoutHints.length})
                </h3>
              </div>
              <button
                onClick={() => setActiveView('hints')}
                className="text-xs text-amber-400 hover:text-amber-300 font-semibold"
              >
                زراعة تلميحات
              </button>
            </div>

            {secretsWithoutHints.length === 0 ? (
              <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-900/30 text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>جميع أسرارك الكبرى تم التمهيد لها بإشارات وتلميحات في النص.</span>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-zinc-400">
                  لتفادي الحلول المفاجئة (Deus Ex Machina)، يُنصح بزراعة تلميح مسبق قبل كشف هذه الأسرار:
                </p>
                {secretsWithoutHints.map((s) => (
                  <div
                    key={s.id}
                    className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-850 flex items-center justify-between text-xs"
                  >
                    <span className="font-bold text-amber-300">{s.title}</span>
                    <span className="text-[10px] text-zinc-500 font-mono">يحتاج تلميحاً</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Card: Planted Clues Awaiting Payoff */}
          <div className="p-6 rounded-2xl bg-[#0f1117] border border-zinc-800/80 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <h3 className="font-heading font-bold text-sm text-zinc-200">
                  تلميحات مزروعة تنتظر وفاء الوعد الدرامي ({pendingClues.length})
                </h3>
              </div>
              <button
                onClick={() => setActiveView('hints')}
                className="text-xs text-amber-400 hover:text-amber-300 font-semibold"
              >
                عرض التلميحات
              </button>
            </div>

            {pendingClues.length === 0 ? (
              <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-850 text-xs text-zinc-400">
                لا توجد تلميحات معلقة في النص حالياً.
              </div>
            ) : (
              <div className="space-y-2">
                {pendingClues.map((h) => (
                  <div
                    key={h.id}
                    className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-850 flex items-center justify-between text-xs"
                  >
                    <span className="font-medium text-zinc-200">{h.description}</span>
                    <span className="text-[10px] text-amber-400 font-mono">حلقة {h.planted_episode}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Card: Continuity Log (Table) */}
          <div className="p-6 rounded-2xl bg-[#0f1117] border border-zinc-800/80 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h3 className="font-heading font-bold text-sm text-zinc-200">
                  سجل التدقيق والتناقضات (Continuity Log: {continuityLogs.length})
                </h3>
              </div>
              <button
                onClick={openAddModal}
                className="text-xs text-amber-400 hover:text-amber-300 font-semibold"
              >
                + إضافة ملاحظة
              </button>
            </div>

            {continuityLogs.length === 0 ? (
              <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-850 text-xs text-zinc-400">
                لم يتم تسجيل أي ملاحظات عدم اتساق يدوية بعد.
              </div>
            ) : (
              <div className="space-y-2">
                {continuityLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-850 flex items-start justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-zinc-200">{log.category}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded ${
                            log.severity === 'حرج'
                              ? 'bg-red-950 text-red-400'
                              : 'bg-amber-950 text-amber-400'
                          }`}
                        >
                          {log.severity}
                        </span>
                      </div>
                      <p className="text-zinc-300">{log.description}</p>
                      {log.suggested_fix && (
                        <p className="text-zinc-500 text-[11px] mt-1 font-mono">
                          الحل المقترح: {log.suggested_fix}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => openEditModal(log)}
                        className="p-1 text-zinc-400 hover:text-amber-400"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteContinuityLog(log.id)}
                        className="p-1 text-zinc-400 hover:text-red-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Continuity Log Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingLog ? 'تعديل ملاحظة التدقيق' : 'تسجيل ملاحظة تدقيق واتساق'}
        subtitle="حفظ الملاحظة في جدول CONTINUITY_LOG بقاعدة البيانات الدائمة"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">تصنيف الخلل *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ContinuityLogEntry['category'])}
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs focus:border-amber-500 focus:outline-none"
              >
                <option value="تناقض زمني">تناقض زمني</option>
                <option value="خلل شخصية">خلل شخصية / تصرف غير مبرر</option>
                <option value="تلميح معلق">تلميح معلق بدون وفاء</option>
                <option value="تناقض مكان">تناقض مكان أو مسافة</option>
                <option value="قاعدة عالم مكسورة">قاعدة عالم درامي مكسورة</option>
                <option value="أخرى">أخرى</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">درجة الخطورة</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as ContinuityLogEntry['severity'])}
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs focus:border-amber-500 focus:outline-none"
              >
                <option value="حرج">حرج (يكسر حبكة الرواية)</option>
                <option value="متوسط">متوسط</option>
                <option value="طفيف">طفيف</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">وصف نقطة عدم الاتساق *</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="ما هو التناقض أو الخلل السردي المرصود؟"
              className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs focus:border-amber-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">الحل المقترح للتصحيح</label>
            <input
              type="text"
              value={suggestedFix}
              onChange={(e) => setSuggestedFix(e.target.value)}
              placeholder="كيف يمكن تعديل المشهد أو الحوار ليتسق السرد؟"
              className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">الحالة</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ContinuityLogEntry['status'])}
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs focus:border-amber-500 focus:outline-none"
              >
                <option value="قيد الانتظار">قيد الانتظار</option>
                <option value="تم التصحيح">تم التصحيح</option>
                <option value="تجاهل متعمد">تجاهل متعمد</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">الحلقة المرتبطة (اختياري)</label>
              <select
                value={episodeId}
                onChange={(e) => setEpisodeId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs focus:border-amber-500 focus:outline-none"
              >
                <option value="">عام</option>
                {episodes.map((ep) => (
                  <option key={ep.id} value={ep.id}>الحلقة {ep.episode_number}: {ep.title}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-zinc-950 font-bold text-xs cursor-pointer transition-colors"
            >
              {editingLog ? 'تحديث الملاحظة' : 'حفظ الملاحظة في قاعدة البيانات'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
