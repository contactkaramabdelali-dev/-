import React, { useState } from 'react';
import { Scroll, Plus, Save, Trash2, Edit3, Lock, Unlock, Sparkles, Filter } from 'lucide-react';
import { useNovel } from '../../context/NovelContext';
import { StoryBibleEntry } from '../../types/database';
import { EmptyState } from '../common/EmptyState';
import { Modal } from '../common/Modal';

export const BibleView: React.FC = () => {
  const {
    activeProject,
    storyBible,
    addBibleEntry,
    updateBibleEntry,
    deleteBibleEntry,
  } = useNovel();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<StoryBibleEntry | null>(null);
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Form State
  const [category, setCategory] = useState<StoryBibleEntry['category']>('فرضية كبرى');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<StoryBibleEntry['priority']>('جوهرية لا تتغير');
  const [isLocked, setIsLocked] = useState(false);

  const openAddModal = () => {
    setEditingEntry(null);
    setCategory('فرضية كبرى');
    setTitle('');
    setContent('');
    setPriority('جوهرية لا تتغير');
    setIsLocked(false);
    setIsModalOpen(true);
  };

  const openEditModal = (entry: StoryBibleEntry) => {
    setEditingEntry(entry);
    setCategory(entry.category);
    setTitle(entry.title);
    setContent(entry.content);
    setPriority(entry.priority);
    setIsLocked(entry.is_locked);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    if (editingEntry) {
      await updateBibleEntry(editingEntry.id, {
        category,
        title: title.trim(),
        content: content.trim(),
        priority,
        is_locked: isLocked,
      });
    } else {
      await addBibleEntry({
        category,
        title: title.trim(),
        content: content.trim(),
        priority,
        is_locked: isLocked,
      });
    }
    setIsModalOpen(false);
  };

  const filteredEntries = storyBible.filter(
    e => categoryFilter === 'all' || e.category === categoryFilter
  );

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#0f1117] border border-zinc-800/80">
        <div>
          <h3 className="font-heading font-bold text-base text-zinc-100">
            دستور الرواية (Story Bible & Canon)
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            القواعد التأسيسية، فرضية الرواية، توجيهات الأداء الصوتي، وسياسة الدارجة المغربية.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-zinc-950 font-bold text-xs transition-colors cursor-pointer shadow-lg shadow-amber-950/40"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة بند في الدستور</span>
        </button>
      </div>

      {/* Story Bible List or Empty State */}
      {storyBible.length === 0 ? (
        <EmptyState
          icon={Scroll}
          title="دستور الرواية فارغ حالياً في قاعدة البيانات"
          description="دستور الرواية (Story Bible) هو المرجع القانوني لعالم روايتك (الفرضية، ميثاق الدارجة، وقواعد الغموض التي لا تُكسر)."
          actionLabel="إضافة أول بند دستوري"
          onAction={openAddModal}
          hintText="نصيحة: وثق الفرضية الكبرى وتوجيهات الأداء الصوتي للممثل والراوي"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredEntries.map((entry) => (
            <div
              key={entry.id}
              className="p-5 rounded-2xl bg-[#0f1117] border border-zinc-800/80 hover:border-zinc-700/80 transition-all flex flex-col justify-between group shadow-lg"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">
                    {entry.category}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {entry.is_locked && <Lock className="w-3.5 h-3.5 text-amber-500" />}
                    <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">
                      {entry.priority}
                    </span>
                  </div>
                </div>

                <h3 className="font-heading font-bold text-base text-zinc-100 group-hover:text-amber-400 transition-colors mb-2">
                  {entry.title}
                </h3>

                <p className="text-xs text-zinc-300 leading-relaxed font-sans whitespace-pre-line">
                  {entry.content}
                </p>
              </div>

              {/* Actions footer */}
              <div className="flex items-center justify-end gap-2 pt-3 mt-3 border-t border-zinc-850">
                <button
                  onClick={() => openEditModal(entry)}
                  className="p-1.5 text-zinc-400 hover:text-amber-400 rounded-lg hover:bg-zinc-800 transition-colors"
                  title="تعديل"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    if (confirm(`حذف البند "${entry.title}"؟`)) {
                      deleteBibleEntry(entry.id);
                    }
                  }}
                  className="p-1.5 text-zinc-400 hover:text-red-400 rounded-lg hover:bg-zinc-800 transition-colors"
                  title="حذف"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingEntry ? 'تعديل بند الدستور' : 'إضافة بند جديد في دستور الرواية'}
        subtitle="حفظ البند في جدول STORY_BIBLE بقاعدة البيانات الدائمة"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">تصنيف البند *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as StoryBibleEntry['category'])}
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs focus:border-amber-500 focus:outline-none"
              >
                <option value="فرضية كبرى">فرضية كبرى (Premise & Logline)</option>
                <option value="نبرة وجو">نبرة وجو (Tone & Atmosphere)</option>
                <option value="توجيهات صوتية">توجيهات صوتية (Audio Directives)</option>
                <option value="سياسة الدارجة">سياسة الدارجة المغربية والفصحى</option>
                <option value="قواعد العالم">قواعد العالم الدرامي (World Rules)</option>
                <option value="أخرى">أخرى</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">الأولوية</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as StoryBibleEntry['priority'])}
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs focus:border-amber-500 focus:outline-none"
              >
                <option value="جوهرية لا تتغير">جوهرية لا تتغير (قانون مطلق)</option>
                <option value="قابلة للتطور">قابلة للتطور</option>
                <option value="تذكير أسلوبي">تذكير أسلوبي</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">عنوان البند *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: ميثاق استخدام الدارجة في الحوارات والسرد"
              className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs focus:border-amber-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">نص وتفاصيل البند *</label>
            <textarea
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="اكتب المعايير والتعليمات الدستورية الثابتة..."
              className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs focus:border-amber-500 focus:outline-none"
              required
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isLockedCheck"
              checked={isLocked}
              onChange={(e) => setIsLocked(e.target.checked)}
              className="accent-amber-500 rounded cursor-pointer"
            />
            <label htmlFor="isLockedCheck" className="text-xs text-zinc-300 cursor-pointer">
              قفل البند لمنع التعديل غير المقصود (is_locked)
            </label>
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
              {editingEntry ? 'تحديث البند' : 'حفظ البند في قاعدة البيانات'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
