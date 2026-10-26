import React, { useState } from 'react';
import { GitFork, Plus, CheckCircle2, Clock, Trash2, Edit3, Film, AlertCircle, Filter } from 'lucide-react';
import { useNovel } from '../../context/NovelContext';
import { OpenLoop } from '../../types/database';
import { EmptyState } from '../common/EmptyState';
import { Modal } from '../common/Modal';

export const ThreadsView: React.FC = () => {
  const {
    activeProject,
    openLoops,
    characters,
    episodes,
    addOpenLoop,
    updateOpenLoop,
    deleteOpenLoop,
  } = useNovel();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLoop, setEditingLoop] = useState<OpenLoop | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [openedEpisode, setOpenedEpisode] = useState<number>(1);
  const [openedUnit, setOpenedUnit] = useState<string>('');
  const [urgency, setUrgency] = useState<OpenLoop['urgency']>('عاجل');
  const [plannedResolution, setPlannedResolution] = useState('');
  const [status, setStatus] = useState<OpenLoop['status']>('مفتوح');
  const [selectedCharIds, setSelectedCharIds] = useState<string[]>([]);

  const openAddModal = () => {
    setEditingLoop(null);
    setTitle('');
    setDescription('');
    setOpenedEpisode(1);
    setOpenedUnit('');
    setUrgency('عاجل');
    setPlannedResolution('');
    setStatus('مفتوح');
    setSelectedCharIds([]);
    setIsModalOpen(true);
  };

  const openEditModal = (loop: OpenLoop) => {
    setEditingLoop(loop);
    setTitle(loop.title);
    setDescription(loop.description);
    setOpenedEpisode(loop.opened_episode);
    setOpenedUnit(loop.opened_unit ? String(loop.opened_unit) : '');
    setUrgency(loop.urgency);
    setPlannedResolution(loop.planned_resolution || '');
    setStatus(loop.status);
    setSelectedCharIds(loop.related_characters || []);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const unitNum = openedUnit ? parseInt(openedUnit) || undefined : undefined;

    if (editingLoop) {
      await updateOpenLoop(editingLoop.id, {
        title: title.trim(),
        description: description.trim(),
        opened_episode: openedEpisode,
        opened_unit: unitNum,
        urgency,
        planned_resolution: plannedResolution.trim(),
        status,
        related_characters: selectedCharIds,
      });
    } else {
      await addOpenLoop({
        title: title.trim(),
        description: description.trim(),
        opened_episode: openedEpisode,
        opened_unit: unitNum,
        urgency,
        planned_resolution: plannedResolution.trim(),
        status,
        related_characters: selectedCharIds,
      });
    }
    setIsModalOpen(false);
  };

  const filteredLoops = openLoops.filter(l =>
    statusFilter === 'all' ? true : l.status === statusFilter
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
              <option value="all">كل الخيوط ({openLoops.length})</option>
              <option value="مفتوح">مفتوح وعالق</option>
              <option value="معلق">معلق مؤقتاً</option>
              <option value="مغلق ومحسوم">مغلق ومحسوم</option>
            </select>
          </div>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-zinc-950 font-bold text-xs transition-colors cursor-pointer shadow-lg shadow-amber-950/40"
        >
          <Plus className="w-4 h-4" />
          <span>فتح خيط سردي جديد</span>
        </button>
      </div>

      {/* Loops List or Empty State */}
      {openLoops.length === 0 ? (
        <EmptyState
          icon={GitFork}
          title="لا توجد خيوط سردية مفتوحة في قاعدة البيانات بعد"
          description="الخيوط المفتوحة (Open Loops) هي الأسئلة العالقة والعُقد التي يشتاق المستمع لإجابتها."
          actionLabel="تسجيل أول خيط سردي"
          onAction={openAddModal}
          hintText="نصيحة: كلما بدأت عقدة جديدة في حلقة، سجلها فوراً هنا لتتذكر إغلاقها في الحلقات اللاحقة"
        />
      ) : filteredLoops.length === 0 ? (
        <div className="text-center py-12 text-zinc-500 text-sm">
          لا توجد خيوط سردية بهذه الحالة.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredLoops.map((loop) => {
            const chars = characters.filter(c => loop.related_characters?.includes(c.id));

            return (
              <div
                key={loop.id}
                className="p-6 rounded-2xl bg-[#0f1117] border border-zinc-800/80 hover:border-zinc-700/80 transition-all flex flex-col justify-between group shadow-lg shadow-black/40"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <GitFork className="w-4 h-4 text-amber-500 shrink-0" />
                      <h3 className="font-heading font-bold text-base text-zinc-100">
                        {loop.title}
                      </h3>
                    </div>
                    <span
                      className={`text-[10px] px-2.5 py-1 rounded-md font-semibold border ${
                        loop.status === 'مفتوح'
                          ? 'bg-red-500/10 text-red-400 border-red-500/20'
                          : loop.status === 'معلق'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      }`}
                    >
                      {loop.status}
                    </span>
                  </div>

                  <p className="text-xs text-zinc-300 leading-relaxed mb-3">
                    {loop.description}
                  </p>

                  {loop.planned_resolution && (
                    <div className="p-2 rounded-xl bg-zinc-900/60 border border-zinc-850 text-xs text-zinc-300 mb-3">
                      <span className="text-[10px] text-zinc-500 font-mono block">الحل المخطط له:</span>
                      <span>{loop.planned_resolution}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-zinc-400 font-mono">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                      أولوية: {loop.urgency}
                    </span>
                    <span className="text-[11px] text-zinc-500">
                      فُتح في الحلقة {loop.opened_episode}
                      {loop.opened_unit ? ` (الوحدة ${loop.opened_unit})` : ''}
                    </span>
                  </div>
                </div>

                {/* Actions footer */}
                <div className="flex items-center justify-end gap-2 pt-3 mt-3 border-t border-zinc-850">
                  {loop.status === 'مفتوح' && (
                    <button
                      onClick={() => updateOpenLoop(loop.id, { status: 'مغلق ومحسوم' })}
                      className="text-xs px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold cursor-pointer transition-colors"
                    >
                      حسم وإغلاق
                    </button>
                  )}
                  <button
                    onClick={() => openEditModal(loop)}
                    className="p-1.5 text-zinc-400 hover:text-amber-400 rounded-lg hover:bg-zinc-800 transition-colors"
                    title="تعديل"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`حذف الخيط "${loop.title}"؟`)) {
                        deleteOpenLoop(loop.id);
                      }
                    }}
                    className="p-1.5 text-zinc-400 hover:text-red-400 rounded-lg hover:bg-zinc-800 transition-colors"
                    title="حذف"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
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
        title={editingLoop ? 'تعديل الخيط السردي' : 'فتح خيط سردي جديد (Open Loop)'}
        subtitle="حفظ العقدة في جدول OPEN_LOOPS بقاعدة البيانات الدائمة"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">عنوان الخيط *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: من الذي سرق خاتم الياقوت من الجثة؟"
              className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs focus:border-amber-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">وصف العقدة والسؤال الدرامي</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="وصف ملابسات السؤال وما ينتظره المستمع..."
              className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">رقم حلقة الفتح *</label>
              <input
                type="number"
                min="1"
                value={openedEpisode}
                onChange={(e) => setOpenedEpisode(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs focus:border-amber-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">رقم الوحدة (اختياري)</label>
              <input
                type="number"
                min="1"
                value={openedUnit}
                onChange={(e) => setOpenedUnit(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">الأولوية</label>
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value as OpenLoop['urgency'])}
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs focus:border-amber-500 focus:outline-none"
              >
                <option value="عاجل">عاجل</option>
                <option value="متوسط">متوسط</option>
                <option value="طويل الأمد">طويل الأمد</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">الحل والتفكيك المخطط له (Planned Resolution)</label>
            <input
              type="text"
              value={plannedResolution}
              onChange={(e) => setPlannedResolution(e.target.value)}
              placeholder="كيف ومتى سيتم حسم هذا الخيط؟"
              className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs focus:border-amber-500 focus:outline-none"
            />
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
              {editingLoop ? 'تحديث الخيط' : 'حفظ الخيط في قاعدة البيانات'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
