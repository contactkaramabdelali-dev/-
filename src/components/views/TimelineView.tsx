import React, { useState } from 'react';
import { Milestone, Plus, Calendar, Clock, Trash2, Edit3, ShieldAlert, Sparkles, Filter, MapPin, Users } from 'lucide-react';
import { useNovel } from '../../context/NovelContext';
import { TimelineEvent } from '../../types/database';
import { EmptyState } from '../common/EmptyState';
import { Modal } from '../common/Modal';

export const TimelineView: React.FC = () => {
  const {
    activeProject,
    timelineEvents,
    characters,
    episodes,
    storyUnits,
    locations,
    addTimelineEvent,
    updateTimelineEvent,
    deleteTimelineEvent,
  } = useNovel();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<TimelineEvent | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [storyDate, setStoryDate] = useState('');
  const [storyTime, setStoryTime] = useState('');
  const [sequenceOrder, setSequenceOrder] = useState<number>(timelineEvents.length + 1);
  const [description, setDescription] = useState('');
  const [locationName, setLocationName] = useState('');
  const [selectedCharIds, setSelectedCharIds] = useState<string[]>([]);
  const [factsCreated, setFactsCreated] = useState('');
  const [consequences, setConsequences] = useState('');
  const [isFixed, setIsFixed] = useState(true);
  const [episodeId, setEpisodeId] = useState('');
  const [unitId, setUnitId] = useState('');

  const openAddModal = () => {
    setEditingEvent(null);
    setTitle('');
    setStoryDate('');
    setStoryTime('');
    setSequenceOrder(timelineEvents.length + 1);
    setDescription('');
    setLocationName('');
    setSelectedCharIds([]);
    setFactsCreated('');
    setConsequences('');
    setIsFixed(true);
    setEpisodeId('');
    setUnitId('');
    setIsModalOpen(true);
  };

  const openEditModal = (item: TimelineEvent) => {
    setEditingEvent(item);
    setTitle(item.title);
    setStoryDate(item.story_date || '');
    setStoryTime(item.story_time || '');
    setSequenceOrder(item.sequence_order);
    setDescription(item.description);
    setLocationName(item.location || '');
    setSelectedCharIds(item.characters_present || []);
    setFactsCreated(item.facts_created || '');
    setConsequences(item.consequences || '');
    setIsFixed(item.is_fixed);
    setEpisodeId(item.episode_id || '');
    setUnitId(item.unit_id || '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (editingEvent) {
      await updateTimelineEvent(editingEvent.id, {
        title: title.trim(),
        story_date: storyDate.trim(),
        story_time: storyTime.trim(),
        sequence_order: sequenceOrder,
        description: description.trim(),
        location: locationName.trim(),
        characters_present: selectedCharIds,
        facts_created: factsCreated.trim(),
        consequences: consequences.trim(),
        is_fixed: isFixed,
        episode_id: episodeId || undefined,
        unit_id: unitId || undefined,
      });
    } else {
      await addTimelineEvent({
        title: title.trim(),
        story_date: storyDate.trim(),
        story_time: storyTime.trim(),
        sequence_order: sequenceOrder,
        description: description.trim(),
        location: locationName.trim(),
        characters_present: selectedCharIds,
        facts_created: factsCreated.trim(),
        consequences: consequences.trim(),
        is_fixed: isFixed,
        episode_id: episodeId || undefined,
        unit_id: unitId || undefined,
      });
    }
    setIsModalOpen(false);
  };

  const availableUnitsForSelectedEp = episodeId
    ? storyUnits.filter(u => u.episode_id === episodeId)
    : [];

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#0f1117] border border-zinc-800/80">
        <div>
          <h3 className="font-heading font-bold text-base text-zinc-100">
            الخط الزمني وتسلسل الوقائع (Timeline Events)
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            توثيق الترتيب الزمني للأحداث، التواريخ، والنتائج الدرامية المترتبة عليها.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-zinc-950 font-bold text-xs transition-colors cursor-pointer shadow-lg shadow-amber-950/40"
        >
          <Plus className="w-4 h-4" />
          <span>توثيق حدث زمني</span>
        </button>
      </div>

      {/* Timeline List or Empty State */}
      {timelineEvents.length === 0 ? (
        <EmptyState
          icon={Milestone}
          title="لم يتم توثيق أي أحداث في الخط الزمني بعد"
          description="الخط الزمني يحفظ ترتيب الأحداث والحقائق المستحدثة والنتائج لتفادي أي تناقض سردي بين الحلقات."
          actionLabel="توثيق أول حدث زمني"
          onAction={openAddModal}
          hintText="يمكنك ربط كل حدث بالحلقة والوحدة السردية الخاصة به والشخصيات الحاضرة"
        />
      ) : (
        <div className="relative pr-4 sm:pr-8 border-r-2 border-zinc-800/80 space-y-6">
          {timelineEvents.map((evt) => {
            const relatedChars = characters.filter(c => evt.characters_present?.includes(c.id));
            const ep = episodes.find(e => e.id === evt.episode_id);

            return (
              <div key={evt.id} className="relative group">
                <div className="absolute -right-[23px] sm:-right-[39px] top-6 w-4 h-4 rounded-full bg-zinc-950 border-2 border-amber-500 group-hover:scale-125 transition-transform" />

                <div className="p-6 rounded-2xl bg-[#0f1117] border border-zinc-800/80 hover:border-zinc-700 transition-all shadow-md">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] px-2.5 py-1 rounded-md font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">
                        #{evt.sequence_order}
                      </span>

                      {evt.story_date && (
                        <span className="flex items-center gap-1 text-xs text-zinc-300 font-mono bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                          <Calendar className="w-3 h-3 text-amber-500" />
                          <span>{evt.story_date}</span>
                        </span>
                      )}

                      {evt.story_time && (
                        <span className="flex items-center gap-1 text-xs text-zinc-400 font-mono bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                          <Clock className="w-3 h-3 text-zinc-500" />
                          <span>{evt.story_time}</span>
                        </span>
                      )}

                      {ep && (
                        <span className="text-xs text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                          الحلقة {ep.episode_number}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 self-end sm:self-auto">
                      <button
                        onClick={() => openEditModal(evt)}
                        className="p-1.5 text-zinc-400 hover:text-amber-400 rounded-lg hover:bg-zinc-800 transition-colors"
                        title="تعديل"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`حذف الحدث "${evt.title}"؟`)) {
                            deleteTimelineEvent(evt.id);
                          }
                        }}
                        className="p-1.5 text-zinc-400 hover:text-red-400 rounded-lg hover:bg-zinc-800 transition-colors"
                        title="حذف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-base font-bold font-heading text-zinc-100 mb-2">
                    {evt.title}
                  </h3>

                  <p className="text-xs text-zinc-300 leading-relaxed mb-3">
                    {evt.description}
                  </p>

                  {evt.facts_created && (
                    <div className="mb-2 p-2 rounded-xl bg-zinc-900/60 border border-zinc-850 text-xs text-zinc-300">
                      <span className="text-[10px] text-amber-400 font-mono block">الحقائق الجديدة المتولدة:</span>
                      <span>{evt.facts_created}</span>
                    </div>
                  )}

                  {evt.consequences && (
                    <div className="mb-2 p-2 rounded-xl bg-red-950/20 border border-red-900/30 text-xs text-red-200">
                      <span className="text-[10px] text-red-400 font-mono block">النتائج والآثار المترتبة:</span>
                      <span>{evt.consequences}</span>
                    </div>
                  )}

                  {relatedChars.length > 0 && (
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-zinc-850 text-xs text-zinc-400">
                      <span className="text-[11px] text-zinc-500">الشخصيات الحاضرة:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {relatedChars.map((c) => (
                          <span
                            key={c.id}
                            className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 text-[11px]"
                          >
                            {c.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
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
        title={editingEvent ? 'تعديل الحدث الزمني' : 'توثيق حدث زمني جديد'}
        subtitle="حفظ الحدث في جدول TIMELINE_EVENTS بقاعدة البيانات الدائمة"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-zinc-300 mb-1">عنوان الحدث *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثال: اكتشاف الخزنة السرية تحت قاع النافورة"
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs focus:border-amber-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">الترتيب الزمني *</label>
              <input
                type="number"
                min="1"
                value={sequenceOrder}
                onChange={(e) => setSequenceOrder(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs focus:border-amber-500 focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">التاريخ السردي (Story Date)</label>
              <input
                type="text"
                value={storyDate}
                onChange={(e) => setStoryDate(e.target.value)}
                placeholder="مثال: ليلة الخميس، 14 أكتوبر 1994"
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">التوقيت السردي (Story Time)</label>
              <input
                type="text"
                value={storyTime}
                onChange={(e) => setStoryTime(e.target.value)}
                placeholder="مثال: 02:45 صباحاً قبل الفجر"
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">المكان</label>
              <input
                type="text"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="مثال: قبو دار الضمانة"
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">مرتبط بالحلقة (اختياري)</label>
              <select
                value={episodeId}
                onChange={(e) => {
                  setEpisodeId(e.target.value);
                  setUnitId('');
                }}
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs focus:border-amber-500 focus:outline-none"
              >
                <option value="">حدث تاريخي عام (خارج الحلقات)</option>
                {episodes.map((ep) => (
                  <option key={ep.id} value={ep.id}>الحلقة {ep.episode_number}: {ep.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">مرتبط بالوحدة (اختياري)</label>
              <select
                value={unitId}
                onChange={(e) => setUnitId(e.target.value)}
                disabled={!episodeId}
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs focus:border-amber-500 focus:outline-none disabled:opacity-50"
              >
                <option value="">بدون وحدة محددة</option>
                {availableUnitsForSelectedEp.map((u) => (
                  <option key={u.id} value={u.id}>وحدة {u.unit_number}: {u.title}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">وصف الحدث بالتفصيل</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="ما الذي حدث بالضبط في هذا المشهد؟"
              className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">الحقائق الجديدة المستحدثة (Facts Created)</label>
              <input
                type="text"
                value={factsCreated}
                onChange={(e) => setFactsCreated(e.target.value)}
                placeholder="ما الذي أصبح حقيقة لا تتغير بعد هذا الحدث؟"
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">النتائج الدرامية (Consequences)</label>
              <input
                type="text"
                value={consequences}
                onChange={(e) => setConsequences(e.target.value)}
                placeholder="الأثر المترتب على الشخصيات"
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {characters.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">الشخصيات الحاضرة في الحدث</label>
              <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto p-2 bg-zinc-900 rounded-xl border border-zinc-800">
                {characters.map((c) => {
                  const isSelected = selectedCharIds.includes(c.id);
                  return (
                    <button
                      type="button"
                      key={c.id}
                      onClick={() => {
                        setSelectedCharIds(prev =>
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
              {editingEvent ? 'تحديث الحدث' : 'حفظ الحدث في قاعدة البيانات'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
