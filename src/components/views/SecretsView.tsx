import React, { useState } from 'react';
import { KeyRound, Plus, ShieldAlert, Eye, EyeOff, CheckCircle2, Trash2, Edit3, Filter, Sparkles, Users } from 'lucide-react';
import { useNovel } from '../../context/NovelContext';
import { Secret } from '../../types/database';
import { EmptyState } from '../common/EmptyState';
import { Modal } from '../common/Modal';

export const SecretsView: React.FC = () => {
  const {
    activeProject,
    secrets,
    clues,
    characters,
    episodes,
    addSecret,
    updateSecret,
    deleteSecret,
    setActiveView,
  } = useNovel();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSecret, setEditingSecret] = useState<Secret | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Form State
  const [title, setTitle] = useState('');
  const [hiddenTruth, setHiddenTruth] = useState('');
  const [importance, setImportance] = useState<Secret['importance']>('حرج جداً');
  const [status, setStatus] = useState<Secret['status']>('نشط وغير معلن');
  const [revealStage, setRevealStage] = useState<Secret['reveal_stage']>('مكتوم تماماً');
  const [falseAssumptions, setFalseAssumptions] = useState('');
  const [plannedEpisode, setPlannedEpisode] = useState<string>('');
  const [knownByIds, setKnownByIds] = useState<string[]>([]);
  const [unknownByIds, setUnknownByIds] = useState<string[]>([]);

  const openAddModal = () => {
    setEditingSecret(null);
    setTitle('');
    setHiddenTruth('');
    setImportance('حرج جداً');
    setStatus('نشط وغير معلن');
    setRevealStage('مكتوم تماماً');
    setFalseAssumptions('');
    setPlannedEpisode('');
    setKnownByIds([]);
    setUnknownByIds([]);
    setIsModalOpen(true);
  };

  const openEditModal = (s: Secret) => {
    setEditingSecret(s);
    setTitle(s.title);
    setHiddenTruth(s.hidden_truth);
    setImportance(s.importance);
    setStatus(s.status);
    setRevealStage(s.reveal_stage);
    setFalseAssumptions(s.false_assumptions || '');
    setPlannedEpisode(s.planned_reveal_episode ? String(s.planned_reveal_episode) : '');
    setKnownByIds(s.known_by || []);
    setUnknownByIds(s.unknown_by || []);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !hiddenTruth.trim()) return;

    const plannedEpNum = plannedEpisode ? parseInt(plannedEpisode) || undefined : undefined;

    if (editingSecret) {
      await updateSecret(editingSecret.id, {
        title: title.trim(),
        hidden_truth: hiddenTruth.trim(),
        importance,
        status,
        reveal_stage: revealStage,
        false_assumptions: falseAssumptions.trim(),
        planned_reveal_episode: plannedEpNum,
        known_by: knownByIds,
        unknown_by: unknownByIds,
      });
    } else {
      await addSecret({
        title: title.trim(),
        hidden_truth: hiddenTruth.trim(),
        importance,
        status,
        reveal_stage: revealStage,
        false_assumptions: falseAssumptions.trim(),
        planned_reveal_episode: plannedEpNum,
        known_by: knownByIds,
        unknown_by: unknownByIds,
      });
    }
    setIsModalOpen(false);
  };

  const filteredSecrets = secrets.filter(s =>
    statusFilter === 'all' ? true : s.status === statusFilter
  );

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#0f1117] border border-zinc-800/80">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-zinc-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
            >
              <option value="all">كل الأسرار ({secrets.length})</option>
              <option value="نشط وغير معلن">نشط وغير معلن للمستمع</option>
              <option value="تلميح جزئي">تلميح جزئي</option>
              <option value="مكشوف للمستمع">مكشوف للمستمع</option>
              <option value="محسوم كلياً">محسوم كلياً</option>
            </select>
          </div>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-zinc-950 font-bold text-xs transition-colors cursor-pointer shadow-lg shadow-amber-950/40"
        >
          <Plus className="w-4 h-4" />
          <span>توثيق سر جديد</span>
        </button>
      </div>

      {/* Secrets List or Empty State */}
      {secrets.length === 0 ? (
        <EmptyState
          icon={KeyRound}
          title="لم يتم توثيق أي أسرار في قاعدة البيانات الدائمة بعد"
          description="الأسرار هي الوقود الحقيقي لرواية الغموض. سجّل الحقيقة الصادمة ومن يعلم بها ومرحلة كشفها للمستمع."
          actionLabel="توثيق السر الأول"
          onAction={openAddModal}
          hintText="نصيحة: ميزة هذا السجل أنه للمؤلف فقط، لحفظ الحقيقة الدفينة حتى لا تناقض نفسك أثناء كتابة الحلقات"
        />
      ) : filteredSecrets.length === 0 ? (
        <div className="text-center py-12 text-zinc-500 text-sm">
          لا توجد أسرار بهذه الحالة حالياً.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredSecrets.map((secret) => {
            const keepers = characters.filter(c => secret.known_by?.includes(c.id));
            const ignorant = characters.filter(c => secret.unknown_by?.includes(c.id));
            const attachedClues = clues.filter(c => c.secret_id === secret.id);

            return (
              <div
                key={secret.id}
                className="p-6 rounded-2xl bg-[#0f1117] border border-zinc-800/80 hover:border-zinc-700/80 transition-all flex flex-col justify-between group shadow-lg shadow-black/50"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <KeyRound className="w-4 h-4 text-amber-500 shrink-0" />
                      <h3 className="font-heading font-bold text-base text-zinc-100">
                        {secret.title}
                      </h3>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={`text-[10px] px-2.5 py-1 rounded-md font-semibold border ${
                          secret.status === 'نشط وغير معلن'
                            ? 'bg-red-500/10 text-red-400 border-red-500/20'
                            : secret.status === 'تلميح جزئي'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }`}
                      >
                        {secret.status}
                      </span>
                    </div>
                  </div>

                  {/* The secret truth container */}
                  <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-850 mb-3">
                    <span className="text-[10px] text-amber-500/80 font-mono block mb-1">
                      الحقيقة الدفينة (للكاتب فقط):
                    </span>
                    <p className="text-xs text-zinc-200 leading-relaxed font-sans">
                      {secret.hidden_truth}
                    </p>
                  </div>

                  {secret.false_assumptions && (
                    <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-850 text-xs text-zinc-400 mb-3">
                      <span className="text-[10px] text-zinc-500 font-mono block">الافتراضات الخاطئة لدى الأبطال/المستمع:</span>
                      <span>{secret.false_assumptions}</span>
                    </div>
                  )}

                  {/* Linked Clues */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-xs text-zinc-400 mb-1.5">
                      <span className="flex items-center gap-1 font-mono text-[11px]">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>التلميحات المرتبطة ({attachedClues.length}):</span>
                      </span>
                      <button
                        onClick={() => setActiveView('hints')}
                        className="text-[11px] text-amber-400 hover:text-amber-300"
                      >
                        + زراعة تلميح
                      </button>
                    </div>

                    {attachedClues.length > 0 ? (
                      <div className="space-y-1">
                        {attachedClues.map(c => (
                          <div key={c.id} className="text-[11px] p-2 rounded bg-zinc-900/80 border border-zinc-800 text-zinc-300 flex items-center justify-between">
                            <span className="truncate">{c.description}</span>
                            <span className="text-amber-500 font-mono text-[10px] shrink-0">حلقة {c.planted_episode}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-[11px] text-zinc-500 italic">
                        لا توجد تلميحات مرتبطة بهذا السر بعد.
                      </div>
                    )}
                  </div>

                  {keepers.length > 0 && (
                    <div className="flex items-center gap-2 text-xs text-zinc-400 mb-2">
                      <span className="text-[11px] text-zinc-500">حراس السر:</span>
                      <div className="flex flex-wrap gap-1">
                        {keepers.map((k) => (
                          <span
                            key={k.id}
                            className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300"
                          >
                            {k.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer and controls */}
                <div className="flex items-center justify-between pt-4 mt-2 border-t border-zinc-850 text-xs">
                  <span className="text-[11px] font-mono text-zinc-500">
                    الأهمية: {secret.importance}
                    {secret.planned_reveal_episode && ` | كشف متوقع حلقة ${secret.planned_reveal_episode}`}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditModal(secret)}
                      className="p-1.5 text-zinc-400 hover:text-amber-400 rounded-lg hover:bg-zinc-800 transition-colors"
                      title="تعديل السر"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`هل أنت متأكد من حذف هذا السر؟`)) {
                          deleteSecret(secret.id);
                        }
                      }}
                      className="p-1.5 text-zinc-400 hover:text-red-400 rounded-lg hover:bg-zinc-800 transition-colors"
                      title="حذف السر"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSecret ? 'تعديل السر' : 'توثيق سر وحقيقة دفينة'}
        subtitle="حفظ الحقيقة الخفية في جدول SECRETS بقاعدة البيانات الدائمة"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              عنوان السر *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: حقيقة وصية الحاج التهامي في قاع البئر"
              className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-sm focus:border-amber-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              الحقيقة الكاملة الدفينة (ما حدث بالفعل) *
            </label>
            <textarea
              rows={3}
              value={hiddenTruth}
              onChange={(e) => setHiddenTruth(e.target.value)}
              placeholder="اكتب الحقيقة العارية التي لا يعلمها أحد في القصة حتى الآن..."
              className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-sm focus:border-amber-500 focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">الحالة</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Secret['status'])}
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs focus:border-amber-500 focus:outline-none"
              >
                <option value="نشط وغير معلن">نشط وغير معلن</option>
                <option value="تلميح جزئي">تلميح جزئي</option>
                <option value="مكشوف للمستمع">مكشوف للمستمع</option>
                <option value="محسوم كلياً">محسوم كلياً</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">الأهمية</label>
              <select
                value={importance}
                onChange={(e) => setImportance(e.target.value as Secret['importance'])}
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs focus:border-amber-500 focus:outline-none"
              >
                <option value="حرج جداً">حرج جداً</option>
                <option value="متوسط">متوسط</option>
                <option value="بطيء الاشتعال">بطيء الاشتعال</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">حلقة الكشف المخططة</label>
              <input
                type="number"
                min="1"
                value={plannedEpisode}
                onChange={(e) => setPlannedEpisode(e.target.value)}
                placeholder="رقم الحلقة"
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              الافتراضات الخاطئة (ما يظنه المستمع أو الشخصيات خطأً)
            </label>
            <input
              type="text"
              value={falseAssumptions}
              onChange={(e) => setFalseAssumptions(e.target.value)}
              placeholder="مثال: يظنون أنه مات منتحراً غرقاً"
              className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs focus:border-amber-500 focus:outline-none"
            />
          </div>

          {characters.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                الشخصيات التي تعرف هذا السر (Known By)
              </label>
              <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto p-2 bg-zinc-900 rounded-xl border border-zinc-800">
                {characters.map((c) => {
                  const isSelected = knownByIds.includes(c.id);
                  return (
                    <button
                      type="button"
                      key={c.id}
                      onClick={() => {
                        setKnownByIds(prev =>
                          isSelected ? prev.filter(id => id !== c.id) : [...prev, c.id]
                        );
                      }}
                      className={`text-xs px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                          : 'bg-zinc-800/80 text-zinc-400 border-zinc-700 hover:text-zinc-200'
                      }`}
                    >
                      {c.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-zinc-950 font-bold text-xs cursor-pointer transition-colors"
            >
              {editingSecret ? 'تحديث السر' : 'حفظ السر في قاعدة البيانات'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
