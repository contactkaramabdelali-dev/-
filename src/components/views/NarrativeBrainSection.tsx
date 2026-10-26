import React, { useState, useEffect } from 'react';
import {
  Brain,
  Save,
  Plus,
  History,
  CheckCircle2,
  Trash2,
  RotateCcw,
  Sparkles,
  Lock,
  FileCode,
  Check,
  Clock,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { useNovel } from '../../context/NovelContext';
import { SystemPrompt } from '../../types/database';
import { Modal } from '../common/Modal';

export const NarrativeBrainSection: React.FC = () => {
  const {
    activeProject,
    systemPrompts,
    activeSystemPrompt,
    createSystemPromptVersion,
    updateSystemPrompt,
    setActiveSystemPrompt,
    deleteSystemPrompt,
    restoreSystemPromptVersion,
  } = useNovel();

  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  const [editorContent, setEditorContent] = useState<string>('');
  const [editorName, setEditorName] = useState<string>('');
  const [saveStatus, setSaveStatus] = useState<string>('');
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);

  // Sync selected prompt when active prompt or system prompts change
  useEffect(() => {
    if (selectedPromptId) {
      const found = systemPrompts.find(p => p.id === selectedPromptId);
      if (found) {
        setEditorContent(found.content || '');
        setEditorName(found.name || '');
        return;
      }
    }

    if (activeSystemPrompt) {
      setSelectedPromptId(activeSystemPrompt.id);
      setEditorContent(activeSystemPrompt.content || '');
      setEditorName(activeSystemPrompt.name || '');
    } else if (systemPrompts.length > 0) {
      setSelectedPromptId(systemPrompts[0].id);
      setEditorContent(systemPrompts[0].content || '');
      setEditorName(systemPrompts[0].name || '');
    } else {
      setSelectedPromptId(null);
      setEditorContent('');
      setEditorName('');
    }
  }, [activeSystemPrompt?.id, systemPrompts.length]);

  const currentlyViewedPrompt = systemPrompts.find(p => p.id === selectedPromptId) || null;

  // Handle Save Current Version
  const handleSaveCurrent = async () => {
    if (!selectedPromptId) {
      // Create first version
      await handleCreateNewVersion(true);
      return;
    }
    await updateSystemPrompt(selectedPromptId, editorName, editorContent);
    setSaveStatus('تم حفظ التعديلات');
    setTimeout(() => setSaveStatus(''), 2000);
  };

  // Handle Create New Version
  const handleCreateNewVersion = async (setAsActive: boolean = true) => {
    const nextVerNum = systemPrompts.length > 0 ? Math.max(...systemPrompts.map(p => p.version)) + 1 : 1;
    const name = editorName.trim() || `نسخة العقل السردي v${nextVerNum}`;
    const newId = await createSystemPromptVersion(name, editorContent, setAsActive);
    setSelectedPromptId(newId);
    setSaveStatus(`تم إصدار النسخة v${nextVerNum} بنجاح`);
    setTimeout(() => setSaveStatus(''), 2500);
  };

  // Handle Set Active
  const handleSetActive = async (id: string) => {
    await setActiveSystemPrompt(id);
    setSelectedPromptId(id);
    setSaveStatus('تم تعيين النسخة كنشطة');
    setTimeout(() => setSaveStatus(''), 2000);
  };

  // Handle Restore
  const handleRestore = async (id: string) => {
    const target = systemPrompts.find(p => p.id === id);
    if (!target) return;
    if (confirm(`هل تريد استرجاع محتوى النسخة v${target.version} كإصدار جديد نشط؟`)) {
      const newId = await restoreSystemPromptVersion(id);
      setSelectedPromptId(newId);
      setIsHistoryDrawerOpen(false);
      setSaveStatus(`تم استرجاع النسخة بنجاح`);
      setTimeout(() => setSaveStatus(''), 2500);
    }
  };

  const wordCount = editorContent.trim().length > 0 ? editorContent.trim().split(/\s+/).length : 0;
  const lineCount = editorContent.length > 0 ? editorContent.split('\n').length : 1;

  if (!activeProject) {
    return (
      <div className="p-8 text-center text-xs text-zinc-400">
        يرجى اختيار أو إنشاء مشروع رواية أولاً لإدارة العقل السردي.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top Header Card */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-zinc-950 via-[#11131c] to-zinc-900 border border-zinc-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-500 text-xs font-mono mb-1">
            <Brain className="w-4 h-4 text-amber-400" />
            <span className="font-bold">العقل السردي (Narrative Brain - System Prompt)</span>
          </div>
          <h3 className="text-lg font-bold font-heading text-zinc-100 flex items-center gap-2">
            <span>الموجه السيادي لرواية «{activeProject.title}»</span>
          </h3>
          <p className="text-xs text-zinc-400 mt-1 max-w-xl">
            يحدد القوانين العليا ونبرة الصوت والإرشادات العامة التي تلتزم بها كافة عمليات التخطيط والكتابة والمراجعة.
          </p>
        </div>

        {/* Active Version Status Pill */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs font-mono">
            <div className="text-[10px] text-zinc-500">النسخة النشطة حالياً:</div>
            <div className="text-amber-400 font-bold flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>
                {activeSystemPrompt
                  ? `v${activeSystemPrompt.version} - ${activeSystemPrompt.name}`
                  : 'لا توجد نسخة نشطة'}
              </span>
            </div>
          </div>

          <button
            onClick={() => setIsHistoryDrawerOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-semibold cursor-pointer transition-colors"
          >
            <History className="w-4 h-4 text-amber-400" />
            <span>سجل النسخ ({systemPrompts.length})</span>
          </button>
        </div>
      </div>

      {/* Editor Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-zinc-900/70 border border-zinc-800">
        <div className="flex items-center gap-2 flex-1">
          <span className="text-xs text-zinc-400 font-mono shrink-0">اسم النسخة:</span>
          <input
            type="text"
            value={editorName}
            onChange={(e) => setEditorName(e.target.value)}
            placeholder="مثال: مسودة النبرة الإذاعية المعيارية v1"
            className="w-full sm:max-w-md px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 focus:outline-none focus:border-amber-500 font-sans"
          />
          {currentlyViewedPrompt && (
            <span
              className={`text-[10px] px-2 py-0.5 rounded font-mono shrink-0 ${
                currentlyViewedPrompt.is_active
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold'
                  : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              {currentlyViewedPrompt.is_active ? 'النسخة النشطة' : `أرشيف (v${currentlyViewedPrompt.version})`}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
          {saveStatus && (
            <span className="text-xs text-emerald-400 font-mono animate-fade-in flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              <span>{saveStatus}</span>
            </span>
          )}

          {currentlyViewedPrompt && !currentlyViewedPrompt.is_active && (
            <button
              onClick={() => handleSetActive(currentlyViewedPrompt.id)}
              className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold cursor-pointer transition-colors"
            >
              تعيين كالنسخة النشطة
            </button>
          )}

          {currentlyViewedPrompt && (
            <button
              onClick={handleSaveCurrent}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold cursor-pointer transition-colors"
              title="حفظ التعديلات على هذه النسخة"
            >
              <Save className="w-3.5 h-3.5" />
              <span>حفظ</span>
            </button>
          )}

          <button
            onClick={() => handleCreateNewVersion(true)}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-zinc-950 font-bold text-xs cursor-pointer shadow-md transition-colors"
            title="إنشاء رقم إصدار جديد وتعيينه كنشط"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>إنشاء نسخة جديدة</span>
          </button>
        </div>
      </div>

      {/* Main Large System Prompt Editor */}
      <div className="relative rounded-2xl bg-[#08090d] border border-zinc-800/90 shadow-2xl overflow-hidden focus-within:border-amber-500/50">
        {/* Editor Info Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800/80 bg-zinc-950 text-[11px] text-zinc-500 font-mono">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-amber-500/80">
              <Lock className="w-3 h-3" />
              <span>حصري للمؤلف (محمي من التعديل الآلي)</span>
            </span>
            <span>|</span>
            <span>{lineCount} أسطر</span>
            <span>|</span>
            <span>{wordCount} كلمة</span>
            <span>|</span>
            <span>{editorContent.length} حرف</span>
          </div>
          <div>System Prompt Editor (UTF-8)</div>
        </div>

        <textarea
          value={editorContent}
          onChange={(e) => setEditorContent(e.target.value)}
          placeholder="أدخل هنا الـ System Prompt الخاص بالرواية...
(سيكون هذا الموجه هو المرجع السيادي للعقل السردي في جميع مراحل العمل، ولن يستطيع الذكاء الاصطناعي تعديله أبداً)"
          className="w-full h-[520px] p-6 bg-transparent text-zinc-100 placeholder-zinc-600 focus:outline-none resize-none font-mono text-sm leading-relaxed selection:bg-amber-500/30 selection:text-amber-100"
          dir="rtl"
          spellCheck={false}
        />
      </div>

      {/* Rules Banner */}
      <div className="p-3.5 rounded-xl bg-zinc-900/50 border border-zinc-850 text-xs text-zinc-400 space-y-1 font-sans">
        <div className="font-bold text-zinc-300 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>قواعد وضوابط «العقل السردي»:</span>
        </div>
        <ul className="list-disc list-inside space-y-0.5 text-zinc-400 text-[11px] pr-2">
          <li>يوجد موجه نشط واحد فقط لكل مشروع رواية (Single Active Version).</li>
          <li>لا يستطيع الذكاء الاصطناعي تعديل هذا الموجه إطلاقاً؛ الإدخال والتعديل حصري للمؤلف.</li>
          <li>جميع عمليات التخطيط، كتابة المشاهد، وفحص الاستمرارية تعتمد وتستدعي النسخة النشطة.</li>
          <li>يمكنك الرجوع في أي وقت لأي إصدار سابق عبر سجل النسخ واسترجاعه.</li>
        </ul>
      </div>

      {/* Version History Modal / Drawer */}
      <Modal
        isOpen={isHistoryDrawerOpen}
        onClose={() => setIsHistoryDrawerOpen(false)}
        title="سجل نسخ العقل السردي (Version History)"
        subtitle="كافة الإصدارات المؤرشفة والنشطة للـ System Prompt"
        maxWidth="max-w-2xl"
      >
        <div className="space-y-3">
          {systemPrompts.length === 0 ? (
            <div className="text-center py-8 text-zinc-500 text-xs">
              لم يتم حفظ أي نسخ بعد. قم بكتابة الموجه والضغط على «إنشاء نسخة جديدة».
            </div>
          ) : (
            systemPrompts.map((prompt) => {
              const isActive = prompt.is_active;
              const isSelected = prompt.id === selectedPromptId;

              return (
                <div
                  key={prompt.id}
                  className={`p-4 rounded-xl border transition-all flex flex-col justify-between gap-3 ${
                    isActive
                      ? 'bg-amber-950/20 border-amber-500/40 shadow-md'
                      : isSelected
                      ? 'bg-zinc-900 border-zinc-700'
                      : 'bg-zinc-950/60 border-zinc-850 hover:border-zinc-750'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-zinc-800 text-amber-300 font-mono font-bold text-xs">
                          v{prompt.version}
                        </span>
                        <h4 className="font-bold text-sm text-zinc-100 font-heading">
                          {prompt.name}
                        </h4>
                        {isActive && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500 text-zinc-950 font-bold font-mono">
                            النسخة النشطة
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-zinc-500 font-mono mt-1 flex items-center gap-2">
                        <Clock className="w-3 h-3 text-zinc-600" />
                        <span>
                          {new Date(prompt.created_at).toLocaleString('ar-MA', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </span>
                        <span>•</span>
                        <span>{prompt.content.trim().split(/\s+/).filter(Boolean).length} كلمة</span>
                      </div>
                    </div>
                  </div>

                  {/* Snippet preview */}
                  {prompt.content && (
                    <div className="p-2.5 rounded-lg bg-black/50 border border-zinc-850 text-xs font-mono text-zinc-300 line-clamp-2">
                      {prompt.content}
                    </div>
                  )}

                  {/* Version Actions */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-850/80 text-xs">
                    <button
                      onClick={() => {
                        setSelectedPromptId(prompt.id);
                        setEditorContent(prompt.content || '');
                        setEditorName(prompt.name || '');
                        setIsHistoryDrawerOpen(false);
                      }}
                      className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold cursor-pointer"
                    >
                      تحميل في المحرر
                    </button>

                    {!isActive && (
                      <button
                        onClick={() => handleSetActive(prompt.id)}
                        className="px-2.5 py-1 rounded bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold cursor-pointer"
                      >
                        تعيين كنشط
                      </button>
                    )}

                    <button
                      onClick={() => handleRestore(prompt.id)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold cursor-pointer"
                      title="استرجاع كإصدار جديد"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>استرجاع</span>
                    </button>

                    <button
                      onClick={() => {
                        if (confirm(`حذف النسخة v${prompt.version} (${prompt.name})؟`)) {
                          deleteSystemPrompt(prompt.id);
                        }
                      }}
                      className="p-1 text-zinc-400 hover:text-red-400 transition-colors"
                      title="حذف النسخة"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Modal>
    </div>
  );
};
