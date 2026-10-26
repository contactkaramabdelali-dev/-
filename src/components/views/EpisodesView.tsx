import React, { useState } from 'react';
import {
  Film,
  Plus,
  Feather,
  Clock,
  CheckCircle2,
  Mic,
  Trash2,
  Edit3,
  Layers,
  ChevronDown,
  ChevronUp,
  FileText,
  Target,
  Sparkles,
  Lock,
  Unlock,
} from 'lucide-react';
import { useNovel } from '../../context/NovelContext';
import { Episode, StoryUnit } from '../../types/database';
import { EmptyState } from '../common/EmptyState';
import { Modal } from '../common/Modal';
import { EpisodePlanningModal } from './EpisodePlanningModal';

export const EpisodesView: React.FC = () => {
  const {
    activeProject,
    episodes,
    storyUnits,
    addEpisode,
    updateEpisode,
    deleteEpisode,
    addStoryUnit,
    updateStoryUnit,
    deleteStoryUnit,
    setCurrentEpisodeId,
    setCurrentUnitId,
    setActiveView,
  } = useNovel();

  // Episode Planning Engine Modal (Stage 6)
  const [isPlanningEngineOpen, setIsPlanningEngineOpen] = useState(false);

  // Episode Modal
  const [isEpModalOpen, setIsEpModalOpen] = useState(false);
  const [editingEp, setEditingEp] = useState<Episode | null>(null);

  // Episode form state
  const [epNumber, setEpNumber] = useState<number>(episodes.length + 1);
  const [epTitle, setEpTitle] = useState('');
  const [epStatus, setEpStatus] = useState<Episode['status']>('مخططة');
  const [epSynopsis, setEpSynopsis] = useState('');
  const [epOpening, setEpOpening] = useState('');
  const [epObjective, setEpObjective] = useState('');
  const [epConflict, setEpConflict] = useState('');
  const [epEnding, setEpEnding] = useState('');
  const [epPublication, setEpPublication] = useState<Episode['publication_status']>('مسودة داخلية');

  // Story Unit Modal
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [targetEpisodeIdForUnit, setTargetEpisodeIdForUnit] = useState<string>('');
  const [editingUnit, setEditingUnit] = useState<StoryUnit | null>(null);

  // Unit form state
  const [unitNumber, setUnitNumber] = useState<number>(1);
  const [unitTitle, setUnitTitle] = useState('');
  const [unitFunction, setUnitFunction] = useState<StoryUnit['function']>('تأسيس');
  const [unitStartState, setUnitStartState] = useState('');
  const [unitObjective, setUnitObjective] = useState('');
  const [unitPressure, setUnitPressure] = useState('');
  const [unitInformation, setUnitInformation] = useState('');
  const [unitPlant, setUnitPlant] = useState('');
  const [unitPayoff, setUnitPayoff] = useState('');
  const [unitTurn, setUnitTurn] = useState('');
  const [unitEndState, setUnitEndState] = useState('');
  const [unitHook, setUnitHook] = useState('');
  const [unitDraft, setUnitDraft] = useState('');
  const [unitStatus, setUnitStatus] = useState<StoryUnit['status']>('مخططة');

  // Expanded episodes list
  const [expandedEpIds, setExpandedEpIds] = useState<Record<string, boolean>>({});

  const toggleExpand = (epId: string) => {
    setExpandedEpIds(prev => ({ ...prev, [epId]: !prev[epId] }));
  };

  const openAddEpModal = () => {
    setEditingEp(null);
    setEpNumber(episodes.length + 1);
    setEpTitle('');
    setEpStatus('مخططة');
    setEpSynopsis('');
    setEpOpening('');
    setEpObjective('');
    setEpConflict('');
    setEpEnding('');
    setEpPublication('مسودة داخلية');
    setIsEpModalOpen(true);
  };

  const openEditEpModal = (ep: Episode) => {
    setEditingEp(ep);
    setEpNumber(ep.episode_number);
    setEpTitle(ep.title);
    setEpStatus(ep.status);
    setEpSynopsis(ep.synopsis);
    setEpOpening(ep.opening_state);
    setEpObjective(ep.main_objective);
    setEpConflict(ep.central_conflict);
    setEpEnding(ep.ending_state);
    setEpPublication(ep.publication_status);
    setIsEpModalOpen(true);
  };

  const handleEpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!epTitle.trim()) return;

    if (editingEp) {
      await updateEpisode(editingEp.id, {
        episode_number: epNumber,
        title: epTitle.trim(),
        status: epStatus,
        synopsis: epSynopsis.trim(),
        opening_state: epOpening.trim(),
        main_objective: epObjective.trim(),
        central_conflict: epConflict.trim(),
        ending_state: epEnding.trim(),
        publication_status: epPublication,
      });
    } else {
      await addEpisode({
        episode_number: epNumber,
        title: epTitle.trim(),
        status: epStatus,
        synopsis: epSynopsis.trim(),
        opening_state: epOpening.trim(),
        main_objective: epObjective.trim(),
        central_conflict: epConflict.trim(),
        ending_state: epEnding.trim(),
        publication_status: epPublication,
        is_locked: false,
      });
    }
    setIsEpModalOpen(false);
  };

  // Open Add Unit Modal for a specific Episode
  const openAddUnitModal = (epId: string) => {
    const unitsInEp = storyUnits.filter(u => u.episode_id === epId);
    setTargetEpisodeIdForUnit(epId);
    setEditingUnit(null);
    setUnitNumber(unitsInEp.length + 1);
    setUnitTitle('');
    setUnitFunction('تأسيس');
    setUnitStartState('');
    setUnitObjective('');
    setUnitPressure('');
    setUnitInformation('');
    setUnitPlant('');
    setUnitPayoff('');
    setUnitTurn('');
    setUnitEndState('');
    setUnitHook('');
    setUnitDraft('');
    setUnitStatus('مخططة');
    setIsUnitModalOpen(true);
  };

  const openEditUnitModal = (unit: StoryUnit) => {
    setTargetEpisodeIdForUnit(unit.episode_id);
    setEditingUnit(unit);
    setUnitNumber(unit.unit_number);
    setUnitTitle(unit.title);
    setUnitFunction(unit.function);
    setUnitStartState(unit.start_state);
    setUnitObjective(unit.objective);
    setUnitPressure(unit.pressure);
    setUnitInformation(unit.information);
    setUnitPlant(unit.plant);
    setUnitPayoff(unit.payoff);
    setUnitTurn(unit.turn);
    setUnitEndState(unit.end_state);
    setUnitHook(unit.hook);
    setUnitDraft(unit.draft_content);
    setUnitStatus(unit.status);
    setIsUnitModalOpen(true);
  };

  const handleUnitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unitTitle.trim() || !targetEpisodeIdForUnit) return;

    const words = unitDraft.trim() ? unitDraft.trim().split(/\s+/).length : 0;

    if (editingUnit) {
      await updateStoryUnit(editingUnit.id, {
        unit_number: unitNumber,
        title: unitTitle.trim(),
        function: unitFunction,
        start_state: unitStartState.trim(),
        objective: unitObjective.trim(),
        pressure: unitPressure.trim(),
        information: unitInformation.trim(),
        plant: unitPlant.trim(),
        payoff: unitPayoff.trim(),
        turn: unitTurn.trim(),
        end_state: unitEndState.trim(),
        hook: unitHook.trim(),
        draft_content: unitDraft,
        status: unitStatus,
        word_count: words,
      });
    } else {
      await addStoryUnit({
        episode_id: targetEpisodeIdForUnit,
        unit_number: unitNumber,
        title: unitTitle.trim(),
        function: unitFunction,
        start_state: unitStartState.trim(),
        objective: unitObjective.trim(),
        pressure: unitPressure.trim(),
        information: unitInformation.trim(),
        plant: unitPlant.trim(),
        payoff: unitPayoff.trim(),
        turn: unitTurn.trim(),
        end_state: unitEndState.trim(),
        hook: unitHook.trim(),
        draft_content: unitDraft,
        final_content: '',
        status: unitStatus,
        word_count: words,
      });
    }
    setExpandedEpIds(prev => ({ ...prev, [targetEpisodeIdForUnit]: true }));
    setIsUnitModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#0f1117] border border-zinc-800/80">
        <div>
          <h3 className="font-heading font-bold text-base text-zinc-100">
            خريطة الحلقات والوحدات السردية (Story Units)
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            كل حلقة تتكون من وحدات درامية محكمة (تأسيس، تصعيد، انعطاف، ذروة، وخاتمة مشوقة).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlanningEngineOpen(true)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-zinc-950 font-bold text-xs transition-colors cursor-pointer shadow-lg shadow-amber-950/40"
          >
            <Sparkles className="w-4 h-4" />
            <span>خطط الحلقة القادمة</span>
          </button>

          <button
            onClick={openAddEpModal}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-semibold cursor-pointer"
          >
            <Plus className="w-4 h-4 text-zinc-400" />
            <span>إضافة يدوية</span>
          </button>
        </div>
      </div>

      {/* Episodes List or Empty State */}
      {episodes.length === 0 ? (
        <EmptyState
          icon={Film}
          title="لم يتم تخطيط أي حلقات في قاعدة البيانات بعد"
          description="خريطة الحلقات فارغة. خطط الحلقة الأولى لتحدد هدفها الدرامي وإضافة الوحدات السردية داخلها."
          actionLabel="خطط الحلقة القادمة"
          onAction={() => setIsPlanningEngineOpen(true)}
          hintText="يمكنك استخدام محرك التخطيط السردي الذكي لتوليد الوحدات الخمس المتصلة"
        />
      ) : (
        <div className="space-y-5">
          {episodes.map((ep) => {
            const unitsInEp = storyUnits.filter(u => u.episode_id === ep.id);
            const isExpanded = expandedEpIds[ep.id] ?? true;
            const totalWordsInEp = unitsInEp.reduce((sum, u) => sum + (u.word_count || 0), 0);

            return (
              <div
                key={ep.id}
                className="rounded-2xl bg-[#0f1117] border border-zinc-800/80 hover:border-zinc-700/80 transition-all overflow-hidden shadow-lg"
              >
                {/* Episode Main Header Card */}
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="px-3 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-mono font-bold">
                          الحلقة {ep.episode_number}
                        </span>

                        <span
                          className={`text-xs px-2.5 py-1 rounded-md border ${
                            ep.status === 'مسجلة'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : ep.status === 'جاهزة للتسجيل'
                              ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                              : ep.status === 'قيد الكتابة'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                          }`}
                        >
                          {ep.status}
                        </span>

                        <span className="text-[10px] text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800 font-mono">
                          {ep.publication_status}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold font-heading text-zinc-100">
                        {ep.title}
                      </h3>

                      {ep.synopsis && (
                        <p className="text-xs text-zinc-300 leading-relaxed max-w-3xl">
                          {ep.synopsis}
                        </p>
                      )}

                      {ep.central_conflict && (
                        <div className="text-xs text-zinc-400 flex items-center gap-1.5 pt-1">
                          <Target className="w-3.5 h-3.5 text-red-400" />
                          <span>الصراع المركزي: {ep.central_conflict}</span>
                        </div>
                      )}
                    </div>

                    {/* Actions and Stats */}
                    <div className="flex flex-wrap items-center gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-zinc-800">
                      <div className="text-left text-xs font-mono text-zinc-400 px-2">
                        <div className="font-bold text-zinc-200">{unitsInEp.length} وحدات داخل الحلقة</div>
                        <div className="text-[11px] text-zinc-500">{totalWordsInEp} كلمة إجمالية</div>
                      </div>

                      <button
                        onClick={() => openAddUnitModal(ep.id)}
                        className="flex items-center gap-1 px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold text-xs transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>إضافة وحدة داخل الحلقة</span>
                      </button>

                      <button
                        onClick={() => {
                          setCurrentEpisodeId(ep.id);
                          setActiveView('writer');
                        }}
                        className="flex items-center gap-1 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-zinc-950 font-bold text-xs transition-colors cursor-pointer shadow-md"
                      >
                        <Feather className="w-3.5 h-3.5" />
                        <span>كتابة</span>
                      </button>

                      <button
                        onClick={() => openEditEpModal(ep)}
                        className="p-2 text-zinc-400 hover:text-amber-400 rounded-lg hover:bg-zinc-800 transition-colors"
                        title="تعديل الحلقة"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => {
                          if (confirm(`هل أنت متأكد من حذف الحلقة ${ep.episode_number} وكافة وحداتها؟`)) {
                            deleteEpisode(ep.id);
                          }
                        }}
                        className="p-2 text-zinc-400 hover:text-red-400 rounded-lg hover:bg-zinc-800 transition-colors"
                        title="حذف الحلقة"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => toggleExpand(ep.id)}
                        className="p-2 text-zinc-400 hover:text-zinc-200 rounded-lg hover:bg-zinc-800 transition-colors"
                        title="طي / إظهار الوحدات"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Sub-Units Drawer Inside Episode */}
                {isExpanded && (
                  <div className="bg-[#0b0c10] border-t border-zinc-850 p-5 space-y-3">
                    <div className="flex items-center justify-between text-xs text-zinc-400 font-mono mb-2">
                      <span className="flex items-center gap-1.5 text-zinc-300">
                        <Layers className="w-3.5 h-3.5 text-amber-500" />
                        <span>الوحدات السردية للحلقة (Story Units):</span>
                      </span>
                      <button
                        onClick={() => openAddUnitModal(ep.id)}
                        className="text-amber-400 hover:text-amber-300 text-xs font-semibold cursor-pointer"
                      >
                        + وحدة جديدة
                      </button>
                    </div>

                    {unitsInEp.length === 0 ? (
                      <div className="p-4 rounded-xl border border-dashed border-zinc-800 bg-zinc-900/40 text-center text-xs text-zinc-500">
                        لم يتم إنشاء أي وحدات درامية داخل هذه الحلقة بعد.{' '}
                        <button
                          onClick={() => openAddUnitModal(ep.id)}
                          className="text-amber-400 underline font-semibold cursor-pointer ml-1"
                        >
                          أنشئ أول وحدة درامية الآن
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {unitsInEp.map((unit) => (
                          <div
                            key={unit.id}
                            className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 transition-all flex flex-col justify-between"
                          >
                            <div>
                              <div className="flex items-center justify-between gap-2 mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-bold">
                                    وحدة {unit.unit_number}
                                  </span>
                                  <h4 className="text-xs font-bold text-zinc-100 font-heading">
                                    {unit.title}
                                  </h4>
                                </div>
                                <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono">
                                  {unit.function}
                                </span>
                              </div>

                              {unit.objective && (
                                <p className="text-[11px] text-zinc-400 line-clamp-1 mb-1">
                                  الهدف: {unit.objective}
                                </p>
                              )}

                              {unit.hook && (
                                <p className="text-[11px] text-amber-400/80 line-clamp-1 font-mono">
                                  العقدة / التشويق: {unit.hook}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-zinc-800/80 text-[11px] text-zinc-500 font-mono">
                              <span>{unit.word_count || 0} كلمة</span>
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => {
                                    setCurrentEpisodeId(ep.id);
                                    setCurrentUnitId(unit.id);
                                    setActiveView('writer');
                                  }}
                                  className="text-amber-400 hover:text-amber-300 font-semibold px-2 py-0.5 rounded hover:bg-zinc-800 transition-colors cursor-pointer"
                                >
                                  كتابة النص
                                </button>
                                <button
                                  onClick={() => openEditUnitModal(unit)}
                                  className="p-1 text-zinc-400 hover:text-zinc-200 transition-colors"
                                  title="تعديل الوحدة"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm(`حذف الوحدة "${unit.title}"؟`)) {
                                      deleteStoryUnit(unit.id);
                                    }
                                  }}
                                  className="p-1 text-zinc-400 hover:text-red-400 transition-colors"
                                  title="حذف الوحدة"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Episode Add/Edit Modal */}
      <Modal
        isOpen={isEpModalOpen}
        onClose={() => setIsEpModalOpen(false)}
        title={editingEp ? 'تعديل الحلقة' : 'تخطيط حلقة جديدة'}
        subtitle="حفظ بيانات الحلقة في جدول EPISODES بقاعدة البيانات الدائمة"
      >
        <form onSubmit={handleEpSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">رقم الحلقة *</label>
              <input
                type="number"
                min="1"
                value={epNumber}
                onChange={(e) => setEpNumber(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs focus:border-amber-500 focus:outline-none"
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-zinc-300 mb-1">عنوان الحلقة *</label>
              <input
                type="text"
                value={epTitle}
                onChange={(e) => setEpTitle(e.target.value)}
                placeholder="مثال: الخطوة في الظلام"
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs focus:border-amber-500 focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">حالة الإنتاج</label>
              <select
                value={epStatus}
                onChange={(e) => setEpStatus(e.target.value as Episode['status'])}
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs focus:border-amber-500 focus:outline-none"
              >
                <option value="مخططة">مخططة</option>
                <option value="قيد الكتابة">قيد الكتابة</option>
                <option value="مكتملة الصياغة">مكتملة الصياغة</option>
                <option value="جاهزة للتسجيل">جاهزة للتسجيل</option>
                <option value="مسجلة">مسجلة</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">حالة النشر</label>
              <select
                value={epPublication}
                onChange={(e) => setEpPublication(e.target.value as Episode['publication_status'])}
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs focus:border-amber-500 focus:outline-none"
              >
                <option value="مسودة داخلية">مسودة داخلية</option>
                <option value="معتمدة للنشر">معتمدة للنشر</option>
                <option value="منشورة">منشورة</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">الملخص الدرامي (Synopsis)</label>
            <textarea
              rows={2}
              value={epSynopsis}
              onChange={(e) => setEpSynopsis(e.target.value)}
              placeholder="الملخص الدرامي ومسار الحلقة الصوتي..."
              className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">الحالة عند بداية الحلقة (Opening State)</label>
              <input
                type="text"
                value={epOpening}
                onChange={(e) => setEpOpening(e.target.value)}
                placeholder="كيف يبدأ المشهد الأول؟"
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">الصراع المركزي (Central Conflict)</label>
              <input
                type="text"
                value={epConflict}
                onChange={(e) => setEpConflict(e.target.value)}
                placeholder="العقدة المتصارع عليها"
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={() => setIsEpModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-zinc-950 font-bold text-xs cursor-pointer transition-colors"
            >
              {editingEp ? 'تحديث الحلقة' : 'حفظ الحلقة في قاعدة البيانات'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Story Unit Add/Edit Modal */}
      <Modal
        isOpen={isUnitModalOpen}
        onClose={() => setIsUnitModalOpen(false)}
        title={editingUnit ? 'تعديل الوحدة السردية' : 'إضافة وحدة سردية جديدة (Story Unit)'}
        subtitle="توثيق المحطة الدرامية داخل الحلقة وربطها بـ EPISODE_ID"
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleUnitSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">رقم الوحدة داخل الحلقة *</label>
              <input
                type="number"
                min="1"
                value={unitNumber}
                onChange={(e) => setUnitNumber(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs focus:border-amber-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">عنوان الوحدة *</label>
              <input
                type="text"
                value={unitTitle}
                onChange={(e) => setUnitTitle(e.target.value)}
                placeholder="مثال: فتح الباب المسدود"
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs focus:border-amber-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">الوظيفة الدرامية</label>
              <select
                value={unitFunction}
                onChange={(e) => setUnitFunction(e.target.value as StoryUnit['function'])}
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs focus:border-amber-500 focus:outline-none"
              >
                <option value="تأسيس">تأسيس (Setup)</option>
                <option value="تصعيد">تصعيد (Escalation)</option>
                <option value="انعطاف">انعطاف (Plot Twist / Turn)</option>
                <option value="ذروة">ذروة (Climax)</option>
                <option value="أزمة">أزمة (Crisis)</option>
                <option value="تنوير">تنوير (Epiphany)</option>
                <option value="خاتمة مشوقة (Cliffhanger)">خاتمة مشوقة (Cliffhanger)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">الهدف السردي للوحدة (Objective)</label>
              <input
                type="text"
                value={unitObjective}
                onChange={(e) => setUnitObjective(e.target.value)}
                placeholder="ما الذي تسعى الشخصية لتحقيقه هنا؟"
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">مصدر الضغط والتوتر (Pressure)</label>
              <input
                type="text"
                value={unitPressure}
                onChange={(e) => setUnitPressure(e.target.value)}
                placeholder="الوقت، الخوف، صوت خطوات تقترب..."
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">ما يتم زرعه في الوحدة (Plant)</label>
              <input
                type="text"
                value={unitPlant}
                onChange={(e) => setUnitPlant(e.target.value)}
                placeholder="إشارة أو غرض أو كلمة تمهيدية"
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">ما يتم حصاده واستثماره (Payoff)</label>
              <input
                type="text"
                value={unitPayoff}
                onChange={(e) => setUnitPayoff(e.target.value)}
                placeholder="حل أو كشف لإشارة سابقة"
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">الانعطاف (Turn)</label>
              <input
                type="text"
                value={unitTurn}
                onChange={(e) => setUnitTurn(e.target.value)}
                placeholder="تغير المسار أو المفاجأة"
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">خطاف النهاية (Hook / Cliffhanger)</label>
              <input
                type="text"
                value={unitHook}
                onChange={(e) => setUnitHook(e.target.value)}
                placeholder="الجملة أو الحدث الصوتي المشوق"
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">مسودة نص الوحدة (Draft Content)</label>
            <textarea
              rows={3}
              value={unitDraft}
              onChange={(e) => setUnitDraft(e.target.value)}
              placeholder="نص المشهد الصوتي، الحوار بالدارجة، والمؤثرات..."
              className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs focus:border-amber-500 focus:outline-none font-manuscript"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={() => setIsUnitModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-zinc-950 font-bold text-xs cursor-pointer transition-colors"
            >
              {editingUnit ? 'تحديث الوحدة' : 'حفظ الوحدة في قاعدة البيانات'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Stage 6: Episode Planning Engine Modal */}
      <EpisodePlanningModal
        isOpen={isPlanningEngineOpen}
        onClose={() => setIsPlanningEngineOpen(false)}
        defaultEpisodeNumber={episodes.length + 1}
      />
    </div>
  );
};
