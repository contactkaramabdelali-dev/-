import React, { useState } from 'react';
import { MapPin, Plus, Sparkles, Trash2, Edit3, ShieldAlert, BookOpen } from 'lucide-react';
import { useNovel } from '../../context/NovelContext';
import { Location } from '../../types/database';
import { EmptyState } from '../common/EmptyState';
import { Modal } from '../common/Modal';

export const LocationsView: React.FC = () => {
  const {
    activeProject,
    locations,
    addLocation,
    updateLocation,
    deleteLocation,
  } = useNovel();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLoc, setEditingLoc] = useState<Location | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [atmosphere, setAtmosphere] = useState('');
  const [rules, setRules] = useState('');
  const [hiddenInformation, setHiddenInformation] = useState('');
  const [currentState, setCurrentState] = useState('');

  const openAddModal = () => {
    setEditingLoc(null);
    setName('');
    setDescription('');
    setAtmosphere('');
    setRules('');
    setHiddenInformation('');
    setCurrentState('مأهول');
    setIsModalOpen(true);
  };

  const openEditModal = (loc: Location) => {
    setEditingLoc(loc);
    setName(loc.name);
    setDescription(loc.description);
    setAtmosphere(loc.atmosphere);
    setRules(loc.rules);
    setHiddenInformation(loc.hidden_information);
    setCurrentState(loc.current_state);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingLoc) {
      await updateLocation(editingLoc.id, {
        name: name.trim(),
        description: description.trim(),
        atmosphere: atmosphere.trim(),
        rules: rules.trim(),
        hidden_information: hiddenInformation.trim(),
        current_state: currentState.trim(),
      });
    } else {
      await addLocation({
        name: name.trim(),
        description: description.trim(),
        atmosphere: atmosphere.trim(),
        rules: rules.trim(),
        hidden_information: hiddenInformation.trim(),
        current_state: currentState.trim() || 'مأهول',
      });
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#0f1117] border border-zinc-800/80">
        <div>
          <h3 className="font-heading font-bold text-base text-zinc-100">
            أطلس الأماكن والفضاءات المغربية (Locations)
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            توثيق الفضاءات وقواعد المكان والمعلومات الخفية عنه في قاعدة البيانات الدائمة.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-zinc-950 font-bold text-xs transition-colors cursor-pointer shadow-lg shadow-amber-950/40"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة مكان جديد</span>
        </button>
      </div>

      {/* Locations List or Empty State */}
      {locations.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="لم يتم توثيق أي أماكن في قاعدة البيانات بعد"
          description="أضف الفضاءات المغربية الرئيسية (كالرياض العتيق، الدرب الضيق، الأرشيف المهجور) لضبط أجوائها وقوانينها."
          actionLabel="توثيق أول مكان"
          onAction={openAddModal}
          hintText="نصيحة: وثق 'قواعد المكان' (مثل: ممنوع الدخول بعد الغروب، أو صدى الصوت يكشف الهمسات)"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {locations.map((loc) => (
            <div
              key={loc.id}
              className="p-5 rounded-2xl bg-[#0f1117] border border-zinc-800/80 hover:border-zinc-700/80 transition-all flex flex-col justify-between group shadow-lg shadow-black/40"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-heading font-bold text-lg text-zinc-100 group-hover:text-amber-400 transition-colors">
                    {loc.name}
                  </h3>
                  {loc.current_state && (
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-800 text-amber-400 border border-zinc-700 font-mono">
                      {loc.current_state}
                    </span>
                  )}
                </div>

                <p className="text-xs text-zinc-300 leading-relaxed mb-3">
                  {loc.description || 'لا يوجد وصف مدون للمكان.'}
                </p>

                {loc.atmosphere && (
                  <div className="mb-2 p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-850 text-xs text-zinc-300">
                    <span className="text-[10px] text-amber-400 block font-mono">الجو والغموض:</span>
                    <span>{loc.atmosphere}</span>
                  </div>
                )}

                {loc.rules && (
                  <div className="mb-2 p-2.5 rounded-xl bg-zinc-900/40 border border-zinc-850 text-xs text-zinc-400">
                    <span className="text-[10px] text-zinc-500 block font-mono">قوانين المكان (Rules):</span>
                    <span>{loc.rules}</span>
                  </div>
                )}

                {loc.hidden_information && (
                  <div className="p-2.5 rounded-xl bg-red-950/20 border border-red-900/30 text-xs text-red-200">
                    <span className="text-[10px] text-red-400 block font-mono">معلومات وسر مدفون في المكان:</span>
                    <span>{loc.hidden_information}</span>
                  </div>
                )}
              </div>

              {/* Actions footer */}
              <div className="flex items-center justify-end gap-2 pt-3 mt-3 border-t border-zinc-850">
                <button
                  onClick={() => openEditModal(loc)}
                  className="p-1.5 text-zinc-400 hover:text-amber-400 rounded-lg hover:bg-zinc-800 transition-colors"
                  title="تعديل"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    if (confirm(`حذف المكان "${loc.name}"؟`)) {
                      deleteLocation(loc.id);
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
        title={editingLoc ? 'تعديل المكان' : 'إضافة مكان جديد'}
        subtitle="حفظ الفضاء الجغرافي في جدول LOCATIONS بقاعدة البيانات الدائمة"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">اسم المكان *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: رياض دار الضمانة"
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs focus:border-amber-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">الحالة الراهنة (Current State)</label>
              <input
                type="text"
                value={currentState}
                onChange={(e) => setCurrentState(e.target.value)}
                placeholder="مثال: مهجور، مغلق بالشمع الأحمر، مأهول"
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">الوصف العام</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="وصف المعمار والغرف والممرات..."
              className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">الجو العام والغموض (Atmosphere)</label>
            <input
              type="text"
              value={atmosphere}
              onChange={(e) => setAtmosphere(e.target.value)}
              placeholder="ظلمة خانقة، رطوبة، صرير أبواب، صدى صوت خافت..."
              className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">قواعد الفضاء (Rules)</label>
            <input
              type="text"
              value={rules}
              onChange={(e) => setRules(e.target.value)}
              placeholder="مثال: لا أحد يدخل الجناح الشمالي، النوافذ مغلقة دائماً..."
              className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">معلومات وسر خفي في المكان (Hidden Info)</label>
            <textarea
              rows={2}
              value={hiddenInformation}
              onChange={(e) => setHiddenInformation(e.target.value)}
              placeholder="سرداب سري، ممر هروب قديم، أو وثائق مخبأة في الجدار..."
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
              {editingLoc ? 'تحديث المكان' : 'حفظ المكان في قاعدة البيانات'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
