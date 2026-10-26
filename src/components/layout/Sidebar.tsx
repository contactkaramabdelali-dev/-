import React, { useState } from 'react';
import {
  LayoutDashboard,
  Scroll,
  Users,
  Film,
  Milestone,
  MapPin,
  KeyRound,
  Sparkles,
  GitFork,
  Package,
  Feather,
  CheckCheck,
  Brain,
  Settings,
  X,
  Radio,
  BookOpen,
  Plus,
} from 'lucide-react';
import { useNovel, ViewType } from '../../context/NovelContext';

interface SidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  onOpenCreateProject: () => void;
}

interface NavItem {
  id: ViewType;
  label: string;
  icon: React.ElementType;
  badge?: number | string;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, setMobileOpen, onOpenCreateProject }) => {
  const {
    activeView,
    setActiveView,
    activeProject,
    characters,
    episodes,
    timelineEvents,
    locations,
    secrets,
    clues,
    openLoops,
    objects,
    storyBible,
  } = useNovel();

  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'لوحة التحكم',
      icon: LayoutDashboard,
    },
    {
      id: 'bible',
      label: 'دستور الرواية',
      icon: Scroll,
      badge: storyBible.length > 0 ? storyBible.length : undefined,
    },
    {
      id: 'characters',
      label: 'الشخصيات والعلاقات',
      icon: Users,
      badge: characters.length > 0 ? characters.length : undefined,
    },
    {
      id: 'episodes',
      label: 'الحلقات والوحدات',
      icon: Film,
      badge: episodes.length > 0 ? episodes.length : undefined,
    },
    {
      id: 'timeline',
      label: 'الخط الزمني',
      icon: Milestone,
      badge: timelineEvents.length > 0 ? timelineEvents.length : undefined,
    },
    {
      id: 'locations',
      label: 'الأماكن والفضاءات',
      icon: MapPin,
      badge: locations.length > 0 ? locations.length : undefined,
    },
    {
      id: 'secrets',
      label: 'سرداب الأسرار',
      icon: KeyRound,
      badge: secrets.filter(s => s.status === 'نشط وغير معلن').length > 0
        ? secrets.filter(s => s.status === 'نشط وغير معلن').length
        : undefined,
    },
    {
      id: 'hints',
      label: 'التلميحات والإشارات',
      icon: Sparkles,
      badge: clues.filter(c => c.payoff_status === 'مزروع في النص').length > 0
        ? clues.filter(c => c.payoff_status === 'مزروع في النص').length
        : undefined,
    },
    {
      id: 'threads',
      label: 'الخيوط المفتوحة',
      icon: GitFork,
      badge: openLoops.filter(t => t.status === 'مفتوح').length > 0
        ? openLoops.filter(t => t.status === 'مفتوح').length
        : undefined,
    },
    {
      id: 'objects',
      label: 'الأغراض والمقتنيات',
      icon: Package,
      badge: objects.length > 0 ? objects.length : undefined,
    },
    {
      id: 'writer',
      label: 'غرفة الكتابة الصوتية',
      icon: Feather,
    },
    {
      id: 'review',
      label: 'مركز المراجعة والاتساق',
      icon: CheckCheck,
    },
    {
      id: 'memory',
      label: 'ذاكرة الرواية الدائمة',
      icon: Brain,
    },
    {
      id: 'settings',
      label: 'المشاريع والإعدادات',
      icon: Settings,
    },
  ];

  const handleSelect = (id: ViewType) => {
    setActiveView(id);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 right-0 z-50 w-72 bg-[#0d0f14] border-l border-zinc-800/80 flex flex-col transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* App Title & Branding */}
        <div className="p-5 border-b border-zinc-800/80 flex items-center justify-between bg-gradient-to-b from-[#131720] to-[#0d0f14]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-600 via-amber-700 to-zinc-950 border border-amber-500/30 flex items-center justify-center text-amber-200 shadow-lg shadow-amber-950/50">
              <BookOpen className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <h1 className="font-heading font-black text-base text-zinc-100 tracking-tight flex items-center gap-2">
                <span>كاتب الوارث</span>
                <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              </h1>
              <p className="text-[11px] text-amber-500/80 font-mono tracking-wider">
                استوديو الرواية الصوتية
              </p>
            </div>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1.5 text-zinc-400 hover:text-zinc-100 rounded-lg hover:bg-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Active Project Card */}
        <div className="px-3 pt-3">
          {activeProject ? (
            <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between">
              <div className="overflow-hidden">
                <span className="text-[10px] text-amber-500 font-mono block">المشروع الحالي:</span>
                <span className="text-xs font-bold text-zinc-100 truncate block font-heading">
                  {activeProject.title}
                </span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                {activeProject.status}
              </span>
            </div>
          ) : (
            <button
              onClick={onOpenCreateProject}
              className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-amber-600/10 hover:bg-amber-600/20 border border-amber-500/30 text-amber-300 text-xs font-bold transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إنشاء مشروع رواية</span>
            </button>
          )}
        </div>

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-medium transition-all group cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-l from-amber-500/20 to-amber-600/10 text-amber-300 border border-amber-500/30 shadow-sm shadow-amber-950/50'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-amber-400' : 'text-zinc-500 group-hover:text-zinc-300'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold ${
                      isActive
                        ? 'bg-amber-400 text-zinc-950 font-bold'
                        : 'bg-zinc-800 text-zinc-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Database Status in Footer */}
        <div className="p-3.5 border-t border-zinc-800/80 bg-[#0a0b0e] text-xs">
          <div className="flex items-center justify-between text-zinc-400 mb-1">
            <span className="text-[11px] font-mono flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>قاعدة بيانات دائمة</span>
            </span>
            <span className="text-[10px] text-zinc-500 font-mono">IndexedDB</span>
          </div>
          <div className="text-[10px] text-zinc-500">
            {episodes.length} حلقات | {characters.length} شخصيات | {secrets.length} أسرار
          </div>
        </div>
      </aside>
    </>
  );
};
