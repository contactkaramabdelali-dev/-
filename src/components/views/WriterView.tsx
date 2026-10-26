import React, { useState, useEffect, useRef } from 'react';
import {
  Feather,
  Save,
  Volume2,
  Clock,
  Mic,
  Users,
  KeyRound,
  Sparkles,
  Check,
  ChevronDown,
  BookOpen,
  Info,
  Maximize2,
  Minimize2,
  Layers,
} from 'lucide-react';
import { useNovel } from '../../context/NovelContext';

export const WriterView: React.FC = () => {
  const {
    activeProject,
    episodes,
    currentEpisodeId,
    setCurrentEpisodeId,
    storyUnits,
    currentUnitId,
    setCurrentUnitId,
    updateStoryUnit,
    updateEpisode,
    characters,
    secrets,
    clues,
  } = useNovel();

  const selectedEpisode = episodes.find(e => e.id === currentEpisodeId) || (episodes.length > 0 ? episodes[0] : null);
  const unitsInSelectedEp = selectedEpisode ? storyUnits.filter(u => u.episode_id === selectedEpisode.id) : [];
  const selectedUnit = unitsInSelectedEp.find(u => u.id === currentUnitId) || (unitsInSelectedEp.length > 0 ? unitsInSelectedEp[0] : null);

  const [content, setContent] = useState<string>('');
  const [savedStatus, setSavedStatus] = useState<string>('محفوظ');
  const [showDrawer, setShowDrawer] = useState<boolean>(true);
  const [drawerTab, setDrawerTab] = useState<'chars' | 'secrets' | 'hints'>('chars');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync content whenever episode or unit changes
  useEffect(() => {
    if (selectedUnit) {
      setContent(selectedUnit.draft_content || '');
    } else if (selectedEpisode) {
      setContent(selectedEpisode.synopsis || '');
    } else {
      setContent('');
    }
    setSavedStatus('محفوظ');
  }, [selectedEpisode?.id, selectedUnit?.id]);

  const wordCount = content.trim().length > 0 ? content.trim().split(/\s+/).length : 0;
  const audioMinutesEstimate = Math.ceil(wordCount / 125);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    setSavedStatus('تغييرات غير محفوظة...');
  };

  const handleManualSave = async () => {
    if (selectedUnit) {
      await updateStoryUnit(selectedUnit.id, {
        draft_content: content,
        word_count: wordCount,
      });
      setSavedStatus('تم الحفظ في قاعدة البيانات');
    } else if (selectedEpisode) {
      await updateEpisode(selectedEpisode.id, {
        synopsis: content,
      });
      setSavedStatus('تم الحفظ في قاعدة البيانات');
    }
    setTimeout(() => setSavedStatus('محفوظ'), 2000);
  };

  const insertTag = (tag: string) => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const textBefore = content.substring(0, start);
    const textAfter = content.substring(end);
    const newText = textBefore + tag + textAfter;
    setContent(newText);
    setSavedStatus('تغييرات غير محفوظة...');

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + tag.length, start + tag.length);
    }, 50);
  };

  return (
    <div className={`space-y-4 ${isFullscreen ? 'fixed inset-0 z-50 bg-[#0b0c10] p-6 overflow-y-auto' : ''}`}>
      {/* Editor Top Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#0f1117] border border-zinc-800/80">
        <div className="flex flex-wrap items-center gap-3">
          {/* Episode Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400 font-mono">الحلقة:</span>
            <select
              value={selectedEpisode?.id || ''}
              onChange={(e) => {
                const epId = e.target.value || null;
                setCurrentEpisodeId(epId);
                const firstUnit = storyUnits.find(u => u.episode_id === epId);
                setCurrentUnitId(firstUnit ? firstUnit.id : null);
              }}
              className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 font-semibold focus:outline-none focus:border-amber-500"
            >
              {episodes.map((ep) => (
                <option key={ep.id} value={ep.id}>
                  الحلقة {ep.episode_number}: {ep.title}
                </option>
              ))}
              {episodes.length === 0 && (
                <option value="">لا توجد حلقات مخططة بعد</option>
              )}
            </select>
          </div>

          {/* Unit Selector */}
          {selectedEpisode && unitsInSelectedEp.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-400 font-mono">الوحدة:</span>
              <select
                value={selectedUnit?.id || ''}
                onChange={(e) => setCurrentUnitId(e.target.value || null)}
                className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-amber-300 font-semibold focus:outline-none focus:border-amber-500"
              >
                {unitsInSelectedEp.map((u) => (
                  <option key={u.id} value={u.id}>
                    وحدة {u.unit_number}: {u.title} ({u.function})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="h-4 w-[1px] bg-zinc-800 hidden sm:block" />

          {/* Audio Metrics */}
          <div className="flex items-center gap-3 text-xs text-zinc-400 font-mono">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>{wordCount} كلمة</span>
            </span>
            <span>|</span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-zinc-500" />
              <span>{audioMinutesEstimate} دقيقة صوتية تقديرية</span>
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-zinc-500 font-mono px-2">
            {savedStatus}
          </span>

          <button
            onClick={() => setShowDrawer(!showDrawer)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
              showDrawer
                ? 'bg-zinc-800 text-amber-300 border-zinc-700'
                : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
            }`}
          >
            ذاكرة المشهد
          </button>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 text-zinc-400 hover:text-zinc-200 rounded-xl hover:bg-zinc-800 transition-colors"
            title={isFullscreen ? 'تصغير' : 'ملء الشاشة'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button
            onClick={handleManualSave}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-zinc-950 font-bold text-xs cursor-pointer shadow-md transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            <span>حفظ النص في قاعدة البيانات</span>
          </button>
        </div>
      </div>

      {/* Audio Drama Cues Toolbar */}
      <div className="flex flex-wrap items-center gap-2 p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/60 text-xs">
        <span className="text-[11px] font-mono text-zinc-500 ml-1">إدراج وسوم صوتية:</span>

        <button
          onClick={() => insertTag('\n[مؤثر صوتي: ]\n')}
          className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-750 text-amber-300 hover:text-amber-200 border border-zinc-700 text-xs cursor-pointer transition-colors"
        >
          + [مؤثر صوتي: ...]
        </button>

        <button
          onClick={() => insertTag('\n[الراوي - بهدوء وترقب]: ')}
          className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-750 text-zinc-200 hover:text-white border border-zinc-700 text-xs cursor-pointer transition-colors"
        >
          + [صوت الراوي]
        </button>

        <button
          onClick={() => insertTag('\n[وقفة صمت: 3 ثوان]\n')}
          className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-750 text-zinc-300 hover:text-white border border-zinc-700 text-xs cursor-pointer transition-colors"
        >
          + [صمت وترقب]
        </button>

        <button
          onClick={() => insertTag('\n[همس متوتر]: ')}
          className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-750 text-purple-300 hover:text-purple-200 border border-zinc-700 text-xs cursor-pointer transition-colors"
        >
          + [همس متوتر]
        </button>

        <button
          onClick={() => insertTag('\n[حوار بالدارجة]: ')}
          className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-750 text-emerald-300 hover:text-emerald-200 border border-zinc-700 text-xs cursor-pointer transition-colors"
        >
          + [حوار بالدارجة]
        </button>
      </div>

      {/* Main Workspace Layout (Editor + Context Drawer) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start">
        {/* Editor Textarea */}
        <div className={`${showDrawer ? 'lg:col-span-3' : 'lg:col-span-4'} transition-all`}>
          <div className="relative rounded-2xl bg-[#0d0e14] border border-zinc-800/90 shadow-2xl overflow-hidden focus-within:border-amber-500/50">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleContentChange}
              placeholder="اكتب هنا سيناريو الرواية الصوتية...
يمكنك كتابة السرد باللغة العربية الفصحى السينمائية، والحوارات بالدارجة المغربية الواقعية.
استخدم وسوم المؤثرات الصوتية [مؤثر صوتي: صرير الباب الخشبي، رعد خافت، خطوات مسرعة في الزقاق...]"
              className="w-full h-[650px] p-6 sm:p-8 bg-transparent text-zinc-100 placeholder-zinc-600 focus:outline-none resize-none font-manuscript text-lg sm:text-xl leading-loose selection:bg-amber-500/30 selection:text-amber-100"
              dir="rtl"
            />
          </div>
        </div>

        {/* Scene Memory & References Drawer */}
        {showDrawer && (
          <div className="lg:col-span-1 space-y-4">
            <div className="p-4 rounded-2xl bg-[#0f1117] border border-zinc-800/80 space-y-3">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <span className="text-xs font-bold font-heading text-zinc-200">
                  ذاكرة المشهد
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setDrawerTab('chars')}
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                      drawerTab === 'chars'
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    الشخصيات
                  </button>
                  <button
                    onClick={() => setDrawerTab('secrets')}
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                      drawerTab === 'secrets'
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    الأسرار
                  </button>
                  <button
                    onClick={() => setDrawerTab('hints')}
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                      drawerTab === 'hints'
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    التلميحات
                  </button>
                </div>
              </div>

              {/* Characters Tab */}
              {drawerTab === 'chars' && (
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {characters.length === 0 ? (
                    <div className="text-center py-6 text-zinc-500 text-xs">
                      لا توجد شخصيات مسجلة بعد.
                    </div>
                  ) : (
                    characters.map((c) => (
                      <div
                        key={c.id}
                        className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-850 hover:border-zinc-750 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-zinc-200">
                            {c.name}
                          </span>
                          <span className="text-[10px] text-amber-400 font-mono">
                            {c.role}
                          </span>
                        </div>
                        {c.speaking_style && (
                          <p className="text-[11px] text-zinc-400 font-mono">
                            🎙 {c.speaking_style}
                          </p>
                        )}
                        {c.secret && (
                          <p className="text-[11px] text-red-300 font-mono mt-0.5 line-clamp-1">
                            🔒 {c.secret}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Secrets Tab */}
              {drawerTab === 'secrets' && (
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {secrets.length === 0 ? (
                    <div className="text-center py-6 text-zinc-500 text-xs">
                      لا توجد أسرار مسجلة بعد.
                    </div>
                  ) : (
                    secrets.map((s) => (
                      <div
                        key={s.id}
                        className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-850"
                      >
                        <span className="text-xs font-bold text-amber-400 block mb-1">
                          {s.title}
                        </span>
                        <p className="text-[11px] text-zinc-300 leading-relaxed font-sans line-clamp-2">
                          {s.hidden_truth}
                        </p>
                        <span className="text-[10px] text-zinc-500 block mt-1 font-mono">
                          الحالة: {s.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Hints Tab */}
              {drawerTab === 'hints' && (
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {clues.length === 0 ? (
                    <div className="text-center py-6 text-zinc-500 text-xs">
                      لا توجد تلميحات مسجلة بعد.
                    </div>
                  ) : (
                    clues.map((h) => (
                      <div
                        key={h.id}
                        className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-850"
                      >
                        <span className="text-[10px] text-amber-400 font-mono block mb-1">
                          حلقة {h.planted_episode}
                        </span>
                        <p className="text-[11px] text-zinc-300 font-sans">
                          {h.description}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
