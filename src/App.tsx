import React, { useState } from 'react';
import { NovelProvider, useNovel, ViewType } from './context/NovelContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { DashboardView } from './components/views/DashboardView';
import { BibleView } from './components/views/BibleView';
import { CharactersView } from './components/views/CharactersView';
import { EpisodesView } from './components/views/EpisodesView';
import { TimelineView } from './components/views/TimelineView';
import { LocationsView } from './components/views/LocationsView';
import { SecretsView } from './components/views/SecretsView';
import { HintsView } from './components/views/HintsView';
import { ThreadsView } from './components/views/ThreadsView';
import { ObjectsView } from './components/views/ObjectsView';
import { WriterView } from './components/views/WriterView';
import { ReviewView } from './components/views/ReviewView';
import { MemoryView } from './components/views/MemoryView';
import { SettingsView } from './components/views/SettingsView';
import { Modal } from './components/common/Modal';
import { Project } from './types/database';

const StudioMain: React.FC = () => {
  const { activeView, createProject, isLoaded } = useNovel();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isCreateProjModalOpen, setIsCreateProjModalOpen] = useState(false);

  // Project Creation Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newStatus, setNewStatus] = useState<Project['status']>('قيد التطوير');
  const [newTargetEpisodes, setNewTargetEpisodes] = useState<number>(30);

  const handleCreateProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    await createProject({
      title: newTitle.trim(),
      description: newDescription.trim(),
      status: newStatus,
      target_episode_count: newTargetEpisodes,
      current_episode_number: 1,
      current_unit_number: 1,
    });

    setNewTitle('');
    setNewDescription('');
    setNewStatus('قيد التطوير');
    setNewTargetEpisodes(30);
    setIsCreateProjModalOpen(false);
  };

  const renderActiveView = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardView onOpenCreateProject={() => setIsCreateProjModalOpen(true)} />;
      case 'bible':
        return <BibleView />;
      case 'characters':
        return <CharactersView />;
      case 'episodes':
        return <EpisodesView />;
      case 'timeline':
        return <TimelineView />;
      case 'locations':
        return <LocationsView />;
      case 'secrets':
        return <SecretsView />;
      case 'hints':
        return <HintsView />;
      case 'threads':
        return <ThreadsView />;
      case 'objects':
        return <ObjectsView />;
      case 'writer':
        return <WriterView />;
      case 'review':
        return <ReviewView />;
      case 'memory':
        return <MemoryView />;
      case 'settings':
        return <SettingsView onOpenCreateProject={() => setIsCreateProjModalOpen(true)} />;
      default:
        return <DashboardView onOpenCreateProject={() => setIsCreateProjModalOpen(true)} />;
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#08090d] text-amber-500 font-mono text-sm">
        <div className="flex items-center gap-3">
          <span className="w-3 h-3 rounded-full bg-amber-500 animate-ping" />
          <span>جاري تحميل قاعدة البيانات الدائمة لرواية «الوارث»...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#08090d] text-[#c5c6c7] overflow-hidden antialiased select-text">
      {/* Sidebar Navigation */}
      <Sidebar
        mobileOpen={mobileMenuOpen}
        setMobileOpen={setMobileMenuOpen}
        onOpenCreateProject={() => setIsCreateProjModalOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden bg-[#0a0b10]">
        <Header
          onToggleMobile={() => setMobileMenuOpen(prev => !prev)}
          onOpenCreateProject={() => setIsCreateProjModalOpen(true)}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-8">
          <div className="max-w-7xl mx-auto">
            {renderActiveView()}
          </div>
        </main>
      </div>

      {/* Global Create Project Modal */}
      <Modal
        isOpen={isCreateProjModalOpen}
        onClose={() => setIsCreateProjModalOpen(false)}
        title="إنشاء مشروع رواية جديدة"
        subtitle="تأسيس سجل جديد في جدول PROJECTS بقاعدة البيانات الدائمة"
      >
        <form onSubmit={handleCreateProjectSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">عنوان الرواية *</label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="مثال: الوارث - سر دار الضمانة"
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs focus:border-amber-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">وصف الرواية وموجز الفكرة</label>
            <textarea
              rows={2}
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="رواية صوتية مغربية طويلة ذات طابع غموض وإثارة..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">حالة المشروع</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as Project['status'])}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs focus:border-amber-500 focus:outline-none"
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
                value={newTargetEpisodes}
                onChange={(e) => setNewTargetEpisodes(parseInt(e.target.value) || 30)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={() => setIsCreateProjModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-zinc-950 font-bold text-xs cursor-pointer transition-colors"
            >
              إنشاء المشروع في قاعدة البيانات
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default function App() {
  return (
    <NovelProvider>
      <StudioMain />
    </NovelProvider>
  );
}
