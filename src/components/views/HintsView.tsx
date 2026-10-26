import React, { useState } from 'react';
import { Sparkles, Plus, KeyRound, Film, CheckCircle2, Trash2, Edit3, Filter, AlertCircle } from 'lucide-react';
import { useNovel } from '../../context/NovelContext';
import { Clue } from '../../types/database';
import { EmptyState } from '../common/EmptyState';
import { Modal } from '../common/Modal';

export const HintsView: React.FC = () => {
  const {
    activeProject,
    clues,
    secrets,
    episodes,
    addClue,
    updateClue,
    deleteClue,
    setActiveView,
  } = useNovel();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClue, setEditingClue] = useState<Clue | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Form State
  const [secretId, setSecretId] = useState<string>('');
  const [description, setDescription] = useState('');
  const [plantedEpisode, setPlantedEpisode] = useState<number>(1);
  const [plantedUnit, setPlantedUnit] = useState<string>('');
  const [intendedInterpretation, setIntendedInterpretation] = useState('');
  const [falseInterpretation, setFalseInterpretation] = useState('');
  const [payoffStatus, setPayoffStatus] = useState<Clue['payoff_status']>('مزروع في النص');
  const [payoffEpisode, setPayoffEpisode] = useState<string>('');

  const openAddModal = () => {
    setEditingClue(null);
    setSecretId(secrets.length > 0 ? secrets[0].id : '');
    setDescription('');
    setPlantedEpisode(1);
    setPlantedUnit('');
    setIntendedInterpretation('');
    setFalseInterpretation('');
    setPayoffStatus('مزروع في النص');
    setPayoffEpisode('');
    setIsModalOpen(true);
  };

  const openEditModal = (clue: Clue) => {
    setEditingClue(clue);
    setSecretId(clue.secret_id);
    setDescription(clue.description);
    setPlantedEpisode(clue.planted_episode);
    setPlantedUnit(clue.planted_unit ? String(clue.planted_unit) : '');
    setIntendedInterpretation(clue.intended_interpretation || '');
    setFalseInterpretation(clue.false_interpretation || '');
    setPayoffStatus(clue.payoff_status);
    setPayoffEpisode(clue.payoff_episode ? String(clue.payoff_episode) : '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !secretId) {
      alert('يرجى كتابة وصف التلميح واختيار السر المرتبط به.');
      return;
    }

    const unitNum = plantedUnit ? parseInt(plantedUnit) || undefined : undefined;
    const payoffEpNum = payoffEpisode ? parseInt(payoffEpisode) || undefined : undefined;

    if (editingClue) {
      await updateClue(editingClue.id, {
        secret_id: secretId,
        description: description.trim(),
        planted_episode: plantedEpisode,
        planted_unit: unitNum,
        intended_interpretation: intendedInterpretation.trim(),
        false_interpretation: falseInterpretation.trim(),
        payoff_status: payoffStatus,
        payoff_episode: payoffEpNum,
      });
    } else {
      await addClue({
        secret_id: secretId,
        description: description.trim(),
        planted_episode: plantedEpisode,
        planted_unit: unitNum,
        intended_interpretation: intendedInterpretation.trim(),
        false_interpretation: falseInterpretation.trim(),
        payoff_status: payoffStatus,
        payoff_episode: payoffEpNum,
      });
    }
    setIsModalOpen(false);
  };

  const filteredClues = clues.filter(c =>
    statusFilter === 'all' ? true : c.payoff_status === statusFilter
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
              <option value="all">كل التلميحات ({clues.length})</option>
              <option value="مزروع في النص">مزروع في النص</option>
              <option value="متروك">متروك (مسار مضلل / Red Herring)</option>
              <option value="مكتشف من المستمع">مكتشف من المستمع</option>
              <option value="مكتمل الربط">مكتمل الربط مع السر</option>
            </select>
          </div>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-zinc-950 font-bold text-xs transition-colors cursor-pointer shadow-lg shadow-amber-950/40"
        >
          <Plus className="w-4 h-4" />
          <span>زراعة تلميح جديد</span>
        </button>
      </div>

      {/* Clues List or Empty State */}
      {clues.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="لم يتم توثيق أي تلميحات في قاعدة البيانات بعد"
          description="التلميحات (Clues) تربط المشاهد الصوتية والحوارات بالأسرار الكبرى لتمهيد الحل للمستمع."
          actionLabel="زراعة أول تلميح"
          onAction={openAddModal}
          hintText="ملاحظة: يمكنك ربط كل تلميح بالسر المقابل له في قاعدة البيانات لضمان اتساق الحبكة"
        />
      ) : filteredClues.length === 0 ? (
        <div className="text-center py-12 text-zinc-500 text-sm">
          لا توجد تلميحات بهذه الحالة.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredClues.map((clue) => {
            const linkedSecret = secrets.find(s => s.id === clue.secret_id);

            return (
              <div
                key={clue.id}
                className="p-6 rounded-2xl bg-[#0f1117] border border-zinc-800/80 hover:border-zinc-700/80 transition-all flex flex-col justify-between group shadow-lg shadow-black/40"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                      <span className="font-mono text-xs text-amber-400 font-bold">
                        تلميح في الحلقة {clue.planted_episode}
                        {clue.planted_unit ? ` (الوحدة ${clue.planted_unit})` : ''}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] px-2.5 py-1 rounded-md font-semibold border ${
                        clue.payoff_status === 'مزروع في النص'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : clue.payoff_status === 'مكتمل الربط'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                      }`}
                    >
                      {clue.payoff_status}
                    </span>
                  </div>

                  <p className="text-xs text-zinc-200 leading-relaxed mb-3 p-3 rounded-xl bg-zinc-950/60 border border-zinc-850">
                    {clue.description}
                  </p>

                  {/* Linked Secret Badge */}
                  <div className="mb-3 p-2.5 rounded-xl bg-amber-950/15 border border-amber-900/30 flex items-start gap-2 text-xs">
                    <KeyRound className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-[10px] text-amber-500/80 block font-mono">
                        مرتبط بالسر (Foreign Key: secret_id):
                      </span>
                      <span className="font-bold text-zinc-100 font-sans">
                        {linkedSecret ? linkedSecret.title : 'سر غير محدد'}
                      </span>
                    </div>
                  </div>

                  {clue.intended_interpretation && (
                    <div className="text-[11px] text-zinc-400 mb-1">
                      <span className="text-zinc-500 font-mono">المعنى الحقيقي المقصود:</span>{' '}
                      {clue.intended_interpretation}
                    </div>
                  )}

                  {clue.false_interpretation && (
                    <div className="text-[11px] text-zinc-400">
                      <span className="text-zinc-500 font-mono">التفسير المضلل الأولي:</span>{' '}
                      {clue.false_interpretation}
                    </div>
                  )}
                </div>

                {/* Actions footer */}
                <div className="flex items-center justify-between pt-3 mt-3 border-t border-zinc-850 text-xs">
                  <span className="text-[11px] font-mono text-zinc-500">
                    {clue.payoff_episode ? `حصاد في الحلقة ${clue.payoff_episode}` : 'لم يُحدد موعد الحصاد بعد'}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditModal(clue)}
                      className="p-1.5 text-zinc-400 hover:text-amber-400 rounded-lg hover:bg-zinc-800 transition-colors"
                      title="تعديل التلميح"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`هل أنت متأكد من حذف هذا التلميح؟`)) {
                          deleteClue(clue.id);
                        }
                      }}
                      className="p-1.5 text-zinc-400 hover:text-red-400 rounded-lg hover:bg-zinc-800 transition-colors"
                      title="حذف التلميح"
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

      {/* Add / Edit Clue Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingClue ? 'تعديل التلميح' : 'زراعة تلميح جديد وربطه بالسر'}
        subtitle="توثيق الإشارة في جدول CLUES بقاعدة البيانات مع الربط الإلزامي بـ secret_id"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Linked Secret Select */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-amber-500" />
              <span>السر المرتبط بهذا التلميح (secret_id) *</span>
            </label>
            {secrets.length === 0 ? (
              <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-900/40 text-xs text-amber-300 flex items-center justify-between">
                <span>لا يوجد أسرار مسجلة بعد في قاعدة البيانات.</span>
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setActiveView('secrets');
                  }}
                  className="underline font-bold"
                >
                  أنشئ سراً أولاً
                </button>
              </div>
            ) : (
              <select
                value={secretId}
                onChange={(e) => setSecretId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs focus:border-amber-500 focus:outline-none"
                required
              >
                <option value="">اختر السر المرتبط...</option>
                {secrets.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title} ({s.status})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              وصف التلميح الصوتي أو اللفظي المزروع *
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="مثال: يذكر الراوي بصوت هامس أن الساعة القديمة تدق فجأة عند الساعة 03:15..."
              className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs focus:border-amber-500 focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                رقم حلقة الزراعة *
              </label>
              <input
                type="number"
                min="1"
                value={plantedEpisode}
                onChange={(e) => setPlantedEpisode(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs focus:border-amber-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                رقم الوحدة داخل الحلقة
              </label>
              <input
                type="number"
                min="1"
                value={plantedUnit}
                onChange={(e) => setPlantedUnit(e.target.value)}
                placeholder="رقم الوحدة (اختياري)"
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                حالة الحصاد
              </label>
              <select
                value={payoffStatus}
                onChange={(e) => setPayoffStatus(e.target.value as Clue['payoff_status'])}
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs focus:border-amber-500 focus:outline-none"
              >
                <option value="مزروع في النص">مزروع في النص</option>
                <option value="متروك">متروك (مسار مضلل)</option>
                <option value="مكتشف من المستمع">مكتشف من المستمع</option>
                <option value="مكتمل الربط">مكتمل الربط</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                التفسير الحقيقي المقصود (Intended)
              </label>
              <input
                type="text"
                value={intendedInterpretation}
                onChange={(e) => setIntendedInterpretation(e.target.value)}
                placeholder="ما يعنيه هذا التلميح حقيقة للحبكة"
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                التفسير المضلل للمستمع (False Lead)
              </label>
              <input
                type="text"
                value={falseInterpretation}
                onChange={(e) => setFalseInterpretation(e.target.value)}
                placeholder="الافتراض الخاطئ الذي نوهم به المستمع"
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

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
              {editingClue ? 'تحديث التلميح' : 'حفظ التلميح وربطه بالسر'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
