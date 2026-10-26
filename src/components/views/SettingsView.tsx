import React, { useState, useRef } from 'react';
import {
  Settings,
  Download,
  Upload,
  RotateCcw,
  Check,
  AlertTriangle,
  FolderKanban,
  Plus,
  Trash2,
  Edit3,
  Database,
  Film,
  Brain,
  HardDrive,
} from 'lucide-react';
import { useNovel } from '../../context/NovelContext';
import { Project } from '../../types/database';
import { Modal } from '../common/Modal';
import { NarrativeBrainSection } from './NarrativeBrainSection';
import { GeminiSettingsSection } from './GeminiSettingsSection';
import { GeminiRunsLog } from './GeminiRunsLog';
import { Cpu, Activity } from 'lucide-react';

interface SettingsViewProps {
  onOpenCreateProject: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onOpenCreateProject }) => {
  const {
    projects,
    activeProjectId,
    activeProject,
    setActiveProjectId,
    updateProject,
    deleteProject,
    exportDatabaseJSON,
    importDatabaseJSON,
    resetDatabase,
    episodes,
    characters,
    secrets,
    clues,
    storyUnits,
    systemPrompts,
  } = useNovel();

  const [activeTab, setActiveTab] = useState<'model' | 'brain' | 'gemini_log' | 'projects' | 'backup'>('model');
  const [isEditProjModalOpen, setIsEditProjModalOpen] = useState(false);
  const [editingTitle, setEditingTitle] = useState('');
  const [editingDesc, setEditingDesc] = useState('');
  const [editingStatus, setEditingStatus] = useState<Project['status']>('قيد التطوير');
  const [editingTargetEpisodes, setEditingTargetEpisodes] = useState<number>(30);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const openEditProject = () => {
    if (!activeProject) return;
    setEditingTitle(activeProject.title);
    setEditingDesc(activeProject.description);
    setEditingStatus(activeProject.status);
    setEditingTargetEpisodes(activeProject.target_episode_count || 30);
    setIsEditProjModalOpen(true);
  };

  const handleUpdateProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject || !editingTitle.trim()) return;

    await updateProject(activeProject.id, {
      title: editingTitle.trim(),
      description: editingDesc.trim(),
      status: editingStatus,
      target_episode_count: editingTargetEpisodes,
    });

    setIsEditProjModalOpen(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleExportJSON = () => {
    const jsonStr = exportDatabaseJSON();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(jsonStr);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `kateb_al_warith_relational_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        await importDatabaseJSON(text);
        alert('تم استيراد قاعدة البيانات بنجاح!');
      } catch (err) {
        alert('حدث خطأ أثناء قراءة ملف النسخة الاحتياطية.');
      }
    };
    reader.readAsText(file);
  };

  const handleReset = async () => {
    if (confirm('تحذير: هل أنت متأكد من رغبتك في تفريغ قاعدة البيانات ومسح كافة المشاريع والشخصيات والحلقات؟')) {
      await resetDatabase();
      alert('تم تفريغ قاعدة البيانات.');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Settings Navigation Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-3 p-2 rounded-2xl bg-[#0f1117] border border-zinc-800/80">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setActiveTab('model')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'model'
                ? 'bg-amber-500 text-zinc-950 shadow-lg shadow-amber-950/40'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>إعدادات نموذج الكتابة (Gemini)</span>
          </button>

          <button
            onClick={() => setActiveTab('brain')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'brain'
                ? 'bg-amber-500 text-zinc-950 shadow-lg shadow-amber-950/40'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
            }`}
          >
            <Brain className="w-4 h-4" />
            <span>العقل السردي (System Prompt)</span>
            {systemPrompts.length > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                activeTab === 'brain' ? 'bg-zinc-950 text-amber-300' : 'bg-zinc-800 text-zinc-300'
              }`}>
                v{systemPrompts[0].version}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('gemini_log')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'gemini_log'
                ? 'bg-amber-500 text-zinc-950 shadow-lg shadow-amber-950/40'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>سجل عمليات Gemini</span>
          </button>

          <button
            onClick={() => setActiveTab('projects')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'projects'
                ? 'bg-amber-500 text-zinc-950 shadow-lg shadow-amber-950/40'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
            }`}
          >
            <FolderKanban className="w-4 h-4" />
            <span>إدارة المشاريع ({projects.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('backup')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'backup'
                ? 'bg-amber-500 text-zinc-950 shadow-lg shadow-amber-950/40'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
            }`}
          >
            <HardDrive className="w-4 h-4" />
            <span>النسخ الاحتياطي والجداول</span>
          </button>
        </div>

        {activeTab === 'projects' && (
          <button
            onClick={onOpenCreateProject}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-zinc-950 font-bold text-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>مشروع جديد</span>
          </button>
        )}
      </div>

      {/* Tab 0: إعدادات نموذج الكتابة (Gemini) */}
      {activeTab === 'model' && (
        <GeminiSettingsSection />
      )}

      {/* Tab 1: العقل السردي (System Prompt) */}
      {activeTab === 'brain' && (
        <NarrativeBrainSection />
      )}

      {/* Tab 1.5: سجل عمليات Gemini */}
      {activeTab === 'gemini_log' && (
        <GeminiRunsLog />
      )}

      {/* Tab 2: إدارة المشاريع */}
      {activeTab === 'projects' && (
        <div className="space-y-4">
          <div className="p-6 rounded-2xl bg-[#0f1117] border border-zinc-800/80 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <FolderKanban className="w-4 h-4 text-amber-500" />
                <h3 className="font-heading font-bold text-base text-zinc-100">
                  مشاريع الروايات في قاعدة البيانات ({projects.length})
                </h3>
              </div>
            </div>

            {projects.length === 0 ? (
              <div className="p-6 text-center text-xs text-zinc-400">
                لا يوجد مشاريع حتى الآن.{' '}
                <button onClick={onOpenCreateProject} className="text-amber-400 underline font-bold">
                  أنشئ أول مشروع
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {projects.map((p) => {
                  const isActive = p.id === activeProjectId;
                  return (
                    <div
                      key={p.id}
                      className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isActive
                          ? 'bg-amber-950/15 border-amber-500/40 shadow-md'
                          : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2.5 mb-1">
                          <h4 className="font-heading font-bold text-sm text-zinc-100">
                            {p.title}
                          </h4>
                          {isActive && (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500 text-zinc-950 font-bold">
                              المشروع النشط
                            </span>
                          )}
                          <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono">
                            {p.status}
                          </span>
                        </div>
                        {p.description && (
                          <p className="text-xs text-zinc-400 line-clamp-1">{p.description}</p>
                        )}
                        <div className="text-[11px] text-zinc-500 font-mono mt-1">
                          هدف الحلقات: {p.target_episode_count} حلقة | تاريخ الإنشاء:{' '}
                          {new Date(p.created_at).toLocaleDateString('ar-MA')}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {!isActive && (
                          <button
                            onClick={() => setActiveProjectId(p.id)}
                            className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold cursor-pointer"
                          >
                            تفعيل المشروع
                          </button>
                        )}
                        {isActive && (
                          <button
                            onClick={openEditProject}
                            className="p-2 text-zinc-400 hover:text-amber-400 rounded-lg hover:bg-zinc-800 transition-colors"
                            title="تعديل بيانات المشروع"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (confirm(`هل أنت متأكد من حذف مشروع "${p.title}"؟`)) {
                              deleteProject(p.id);
                            }
                          }}
                          className="p-2 text-zinc-400 hover:text-red-400 rounded-lg hover:bg-zinc-800 transition-colors"
                          title="حذف المشروع"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: النسخ الاحتياطي والجداول */}
      {activeTab === 'backup' && (
        <div className="space-y-5">
          {/* Database Schema Status Card */}
          <div className="p-6 rounded-2xl bg-[#0f1117] border border-zinc-800/80 space-y-4">
            <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
              <Database className="w-4 h-4 text-emerald-400" />
              <h3 className="font-heading font-bold text-base text-zinc-100">
                جداول قاعدة البيانات الدائمة (16 Relational Stores)
              </h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                <span className="text-zinc-500 block text-[10px]">PROJECTS</span>
                <span className="text-zinc-100 font-bold text-base">{projects.length}</span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                <span className="text-amber-400 block text-[10px]">SYSTEM_PROMPTS</span>
                <span className="text-amber-400 font-bold text-base">{systemPrompts.length}</span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                <span className="text-zinc-500 block text-[10px]">CHARACTERS</span>
                <span className="text-zinc-100 font-bold text-base">{characters.length}</span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                <span className="text-zinc-500 block text-[10px]">EPISODES</span>
                <span className="text-zinc-100 font-bold text-base">{episodes.length}</span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                <span className="text-zinc-500 block text-[10px]">STORY_UNITS</span>
                <span className="text-zinc-100 font-bold text-base">{storyUnits.length}</span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                <span className="text-zinc-500 block text-[10px]">SECRETS</span>
                <span className="text-zinc-100 font-bold text-base">{secrets.length}</span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                <span className="text-zinc-500 block text-[10px]">CLUES</span>
                <span className="text-zinc-100 font-bold text-base">{clues.length}</span>
              </div>
            </div>
          </div>

          {/* Backup and Data Portability */}
          <div className="p-6 rounded-2xl bg-[#0f1117] border border-zinc-800/80 space-y-4">
            <div>
              <h3 className="font-heading font-bold text-base text-zinc-100">
                النسخ الاحتياطي وتصدير قاعدة البيانات
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                تخزين محلي دائم عبر IndexedDB يشمل جدول SYSTEM_PROMPTS وكافة الجداول. يمكنك تصدير ملف JSON كامل لاستعادته في أي وقت.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={handleExportJSON}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 font-semibold text-xs transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4 text-amber-400" />
                <span>تصدير نسخة كاملة لقاعدة البيانات (JSON)</span>
              </button>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImportFile}
                accept=".json"
                className="hidden"
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 font-semibold text-xs transition-colors cursor-pointer"
              >
                <Upload className="w-4 h-4 text-emerald-400" />
                <span>استيراد نسخة احتياطية</span>
              </button>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="p-6 rounded-2xl bg-red-950/10 border border-red-900/30 space-y-3">
            <div className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-heading font-bold text-base">
                منطقة الخطر
              </h3>
            </div>
            <p className="text-xs text-zinc-400">
              إعادة ضبط المصنع سيمسح جميع الجداول في قاعدة بيانات المتصفح بشكل نهائي.
            </p>

            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-900/40 hover:bg-red-800/60 border border-red-800 text-red-200 text-xs font-semibold transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>تفريغ قاعدة البيانات بالكامل</span>
            </button>
          </div>
        </div>
      )}

      {/* Edit Project Modal */}
      <Modal
        isOpen={isEditProjModalOpen}
        onClose={() => setIsEditProjModalOpen(false)}
        title="تعديل بيانات المشروع الحالي"
        subtitle="تحديث سجل المشروع في جدول PROJECTS"
      >
        <form onSubmit={handleUpdateProjectSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">عنوان الرواية / المشروع *</label>
            <input
              type="text"
              value={editingTitle}
              onChange={(e) => setEditingTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs focus:border-amber-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">وصف المشروع</label>
            <textarea
              rows={2}
              value={editingDesc}
              onChange={(e) => setEditingDesc(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">الحالة</label>
              <select
                value={editingStatus}
                onChange={(e) => setEditingStatus(e.target.value as Project['status'])}
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs focus:border-amber-500 focus:outline-none"
              >
                <option value="قيد التطوير">قيد التطوير</option>
                <option value="قيد الكتابة">قيد الكتابة</option>
                <option value="مكتمل">مكتمل</option>
                <option value="مؤرشف">مؤرشف</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">عدد الحلقات المستهدف</label>
              <input
                type="number"
                min="1"
                value={editingTargetEpisodes}
                onChange={(e) => setEditingTargetEpisodes(parseInt(e.target.value) || 30)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={() => setIsEditProjModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-zinc-950 font-bold text-xs cursor-pointer transition-colors"
            >
              حفظ التعديلات
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
