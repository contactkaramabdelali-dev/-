import React, { useState } from 'react';
import { Package, Plus, Trash2, Edit3, ShieldAlert, Sparkles, Filter } from 'lucide-react';
import { useNovel } from '../../context/NovelContext';
import { StoryObject } from '../../types/database';
import { EmptyState } from '../common/EmptyState';
import { Modal } from '../common/Modal';

export const ObjectsView: React.FC = () => {
  const {
    activeProject,
    objects,
    addObject,
    updateObject,
    deleteObject,
  } = useNovel();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingObj, setEditingObj] = useState<StoryObject | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [currentOwner, setCurrentOwner] = useState('');
  const [currentLocation, setCurrentLocation] = useState('');
  const [narrativeImportance, setNarrativeImportance] = useState<StoryObject['narrative_importance']>('أثر جوهري');
  const [hiddenInformation, setHiddenInformation] = useState('');
  const [status, setStatus] = useState<StoryObject['status']>('موجود');

  const openAddModal = () => {
    setEditingObj(null);
    setName('');
    setDescription('');
    setCurrentOwner('');
    setCurrentLocation('');
    setNarrativeImportance('أثر جوهري');
    setHiddenInformation('');
    setStatus('موجود');
    setIsModalOpen(true);
  };

  const openEditModal = (obj: StoryObject) => {
    setEditingObj(obj);
    setName(obj.name);
    setDescription(obj.description);
    setCurrentOwner(obj.current_owner);
    setCurrentLocation(obj.current_location);
    setNarrativeImportance(obj.narrative_importance);
    setHiddenInformation(obj.hidden_information);
    setStatus(obj.status);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingObj) {
      await updateObject(editingObj.id, {
        name: name.trim(),
        description: description.trim(),
        current_owner: currentOwner.trim(),
        current_location: currentLocation.trim(),
        narrative_importance: narrativeImportance,
        hidden_information: hiddenInformation.trim(),
        status,
      });
    } else {
      await addObject({
        name: name.trim(),
        description: description.trim(),
        current_owner: currentOwner.trim(),
        current_location: currentLocation.trim(),
        narrative_importance: narrativeImportance,
        hidden_information: hiddenInformation.trim(),
        status,
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
            أرشيف الأغراض والمقتنيات (Objects & Relics)
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            المفاتيح، المخطوطات القديمة، الرسائل المرموزة، والآثار التي تدير دفة الأحداث.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-zinc-950 font-bold text-xs transition-colors cursor-pointer shadow-lg shadow-amber-950/40"
        >
          <Plus className="w-4 h-4" />
          <span>توثيق غرض جديد</span>
        </button>
      </div>

      {/* Objects List or Empty State */}
      {objects.length === 0 ? (
        <EmptyState
          icon={Package}
          title="لم يتم توثيق أي أغراض أو مقتنيات بعد"
          description="الأغراض في روايات الغموض (مثل مفتاح الباب السري، خنجر قديم، وصية ممزقة) هي محركات أساسية للحبكة."
          actionLabel="توثيق أول غرض"
          onAction={openAddModal}
          hintText="نصيحة: وثق المالك الحالي وموقع الغرض بدقة لتفادي الخلل في الاستمرارية"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {objects.map((obj) => (
            <div
              key={obj.id}
              className="p-5 rounded-2xl bg-[#0f1117] border border-zinc-800/80 hover:border-zinc-700/80 transition-all flex flex-col justify-between group shadow-lg shadow-black/40"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-heading font-bold text-base text-zinc-100 group-hover:text-amber-400 transition-colors">
                    {obj.name}
                  </h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 font-mono">
                    {obj.status}
                  </span>
                </div>

                <p className="text-xs text-zinc-300 leading-relaxed mb-3">
                  {obj.description}
                </p>

                <div className="space-y-1.5 text-xs text-zinc-400 font-mono mb-3">
                  {obj.current_owner && (
                    <div>
                      <span className="text-zinc-500">الحائز الحالي:</span> {obj.current_owner}
                    </div>
                  )}
                  {obj.current_location && (
                    <div>
                      <span className="text-zinc-500">الموقع الحالي:</span> {obj.current_location}
                    </div>
                  )}
                  <div>
                    <span className="text-zinc-500">الأهمية:</span>{' '}
                    <span className="text-amber-400">{obj.narrative_importance}</span>
                  </div>
                </div>

                {obj.hidden_information && (
                  <div className="p-2.5 rounded-xl bg-red-950/20 border border-red-900/30 text-xs text-red-200">
                    <span className="text-[10px] text-red-400 block font-mono">المعلومة السرية المكنونة:</span>
                    <span>{obj.hidden_information}</span>
                  </div>
                )}
              </div>

              {/* Actions footer */}
              <div className="flex items-center justify-end gap-2 pt-3 mt-3 border-t border-zinc-850">
                <button
                  onClick={() => openEditModal(obj)}
                  className="p-1.5 text-zinc-400 hover:text-amber-400 rounded-lg hover:bg-zinc-800 transition-colors"
                  title="تعديل"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    if (confirm(`حذف الغرض "${obj.name}"؟`)) {
                      deleteObject(obj.id);
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
        title={editingObj ? 'تعديل الغرض' : 'توثيق غرض ومقتنى جديد'}
        subtitle="حفظ الغرض في جدول OBJECTS بقاعدة البيانات الدائمة"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">اسم الغرض *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: مفتاح قفل القبو النحاسي"
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs focus:border-amber-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">حالة الغرض</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as StoryObject['status'])}
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs focus:border-amber-500 focus:outline-none"
              >
                <option value="موجود">موجود</option>
                <option value="مفقود">مفقود</option>
                <option value="تالف">تالف</option>
                <option value="مدفون">مدفون ومخبأ</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">الوصف والمظهر</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="نقوشه، مادته، حالته الظاهرة..."
              className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">المالك / الحائز الحالي</label>
              <input
                type="text"
                value={currentOwner}
                onChange={(e) => setCurrentOwner(e.target.value)}
                placeholder="من يحمله الآن؟"
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">الموقع الحالي</label>
              <input
                type="text"
                value={currentLocation}
                onChange={(e) => setCurrentLocation(e.target.value)}
                placeholder="أين يوضع؟"
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">الأهمية السردية</label>
              <select
                value={narrativeImportance}
                onChange={(e) => setNarrativeImportance(e.target.value as StoryObject['narrative_importance'])}
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs focus:border-amber-500 focus:outline-none"
              >
                <option value="أثر جوهري">أثر جوهري</option>
                <option value="دليل مفتاحي">دليل مفتاحي</option>
                <option value="غرض رمزي">غرض رمزي</option>
                <option value="عابر">عابر</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">المعلومة السرية المكنونة في الغرض</label>
            <textarea
              rows={2}
              value={hiddenInformation}
              onChange={(e) => setHiddenInformation(e.target.value)}
              placeholder="شفرة محفورة، قاع مزدوج، رسالة داخلية..."
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
              {editingObj ? 'تحديث الغرض' : 'حفظ الغرض في قاعدة البيانات'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
