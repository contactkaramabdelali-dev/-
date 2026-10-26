import React, { useState } from 'react';
import { Brain, Plus, Search, Sparkles, Trash2, Edit3, Filter, BookOpen, HelpCircle, CheckCircle, Cpu, FileText } from 'lucide-react';
import { useNovel } from '../../context/NovelContext';
import { StoryDecision } from '../../types/database';
import { EmptyState } from '../common/EmptyState';
import { Modal } from '../common/Modal';
import { NarrativeContextTester } from './NarrativeContextTester';
import { GeminiRunsLog } from './GeminiRunsLog';
import { Activity } from 'lucide-react';

export const MemoryView: React.FC = () => {
  const {
    activeProject,
    storyDecisions,
    addStoryDecision,
    updateStoryDecision,
    deleteStoryDecision,
    storyBible,
  } = useNovel();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDecision, setEditingDecision] = useState<StoryDecision | null>(null);
  const [activeSection, setActiveSection] = useState<'tester' | 'decisions' | 'gemini_log'>('tester');

  const [title, setTitle] = useState('');
  const [question, setQuestion] = useState('');
  const [optionsStr, setOptionsStr] = useState('');
  const [selectedOption, setSelectedOption] = useState('');
  const [reasoning, setReasoning] = useState('');
  const [impact, setImpact] = useState('');
  const [status, setStatus] = useState<StoryDecision['status']>('محسوم');

  const openAddModal = () => {
    setEditingDecision(null);
    setTitle('');
    setQuestion('');
    setOptionsStr('');
    setSelectedOption('');
    setReasoning('');
    setImpact('');
    setStatus('محسوم');
    setIsModalOpen(true);
  };

  const openEditModal = (d: StoryDecision) => {
    setEditingDecision(d);
    setTitle(d.title);
    setQuestion(d.question);
    setOptionsStr(d.options ? d.options.join('\n') : '');
    setSelectedOption(d.selected_option || '');
    setReasoning(d.reasoning || '');
    setImpact(d.impact || '');
    setStatus(d.status);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !question.trim()) return;

    const optionsList = optionsStr
      .split('\n')
      .map(o => o.trim())
      .filter(Boolean);

    if (editingDecision) {
      await updateStoryDecision(editingDecision.id, {
        title: title.trim(),
        question: question.trim(),
        options: optionsList,
        selected_option: selectedOption.trim(),
        reasoning: reasoning.trim(),
        impact: impact.trim(),
        status,
      });
    } else {
      await addStoryDecision({
        title: title.trim(),
        question: question.trim(),
        options: optionsList,
        selected_option: selectedOption.trim(),
        reasoning: reasoning.trim(),
        impact: impact.trim(),
        status,
      });
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* View Switcher Tabs */}
      <div className="flex items-center gap-2 p-2 rounded-2xl bg-[#0f1117] border border-zinc-800/80">
        <button
          onClick={() => setActiveSection('tester')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSection === 'tester'
              ? 'bg-amber-500 text-zinc-950 shadow-lg shadow-amber-950/40'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>اختبار السياق السردي (Narrative Context Tester)</span>
        </button>

        <button
          onClick={() => setActiveSection('decisions')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSection === 'decisions'
              ? 'bg-amber-500 text-zinc-950 shadow-lg shadow-amber-950/40'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
          }`}
        >
          <Brain className="w-4 h-4" />
          <span>ذاكرة القرارات السردية ({storyDecisions.length})</span>
        </button>

        <button
          onClick={() => setActiveSection('gemini_log')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSection === 'gemini_log'
              ? 'bg-amber-500 text-zinc-950 shadow-lg shadow-amber-950/40'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>سجل عمليات Gemini</span>
        </button>
      </div>

      {/* Section 1: Narrative Context Tester */}
      {activeSection === 'tester' && <NarrativeContextTester />}

      {/* Section 1.5: Gemini Operations Log */}
      {activeSection === 'gemini_log' && <GeminiRunsLog />}

      {/* Section 2: Story Decisions */}
      {activeSection === 'decisions' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#0f1117] border border-zinc-800/80">
            <div>
              <h3 className="font-heading font-bold text-base text-zinc-100">
                ذاكرة القرارات السردية (Story Decisions)
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                توثيق القرارات والمفترقات التي حسمها المؤلف مع الأسباب والآثار حتى لا يتراجع عنها لاحقاً.
              </p>
            </div>

            <button
              onClick={openAddModal}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-zinc-950 font-bold text-xs transition-colors cursor-pointer shadow-lg shadow-amber-950/40"
            >
              <Plus className="w-4 h-4" />
              <span>توثيق قرار سردي جديد</span>
            </button>
          </div>

      {/* Decisions List or Empty State */}
      {storyDecisions.length === 0 ? (
        <EmptyState
          icon={Brain}
          title="لم يتم توثيق أي قرارات سردية بعد"
          description="عندما تقف أمام مفترق طرق (مثال: هل الجد توفي أم مختفٍ؟ هل الخادم خائن أم وفيّ؟)، سجّل قرارك النهائي هنا لحفظ ذاكرة الرواية."
          actionLabel="توثيق أول قرار"
          onAction={openAddModal}
          hintText="نصيحة: توثيق أسباب القرار (Reasoning) يمنع التردد وإعادة كتابة المسودات السابقة"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {storyDecisions.map((d) => (
            <div
              key={d.id}
              className="p-5 rounded-2xl bg-[#0f1117] border border-zinc-800/80 hover:border-zinc-700/80 transition-all flex flex-col justify-between group shadow-lg"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-heading font-bold text-base text-zinc-100 group-hover:text-amber-400 transition-colors">
                    {d.title}
                  </h3>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-amber-400 font-mono">
                    {d.status}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-850 mb-3 text-xs">
                  <span className="text-[10px] text-zinc-500 font-mono block mb-0.5">السؤال الدرامي:</span>
                  <p className="text-zinc-200 font-sans">{d.question}</p>
                </div>

                {d.selected_option && (
                  <div className="mb-2 p-2 rounded-xl bg-emerald-950/20 border border-emerald-900/30 text-xs text-emerald-300 flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>الخيار المحسوم: {d.selected_option}</span>
                  </div>
                )}

                {d.reasoning && (
                  <div className="mb-2 text-xs text-zinc-400">
                    <span className="text-zinc-500 font-mono text-[10px] block">سبب الاختيار (Reasoning):</span>
                    <p>{d.reasoning}</p>
                  </div>
                )}

                {d.impact && (
                  <div className="text-xs text-zinc-400">
                    <span className="text-zinc-500 font-mono text-[10px] block">الأثر على الحلقات (Impact):</span>
                    <p>{d.impact}</p>
                  </div>
                )}
              </div>

              {/* Actions footer */}
              <div className="flex items-center justify-end gap-2 pt-3 mt-3 border-t border-zinc-850">
                <button
                  onClick={() => openEditModal(d)}
                  className="p-1.5 text-zinc-400 hover:text-amber-400 rounded-lg hover:bg-zinc-800 transition-colors"
                  title="تعديل"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    if (confirm(`حذف القرار "${d.title}"؟`)) {
                      deleteStoryDecision(d.id);
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
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingDecision ? 'تعديل القرار السردي' : 'توثيق قرار سردي جديد'}
        subtitle="حفظ القرار في جدول STORY_DECISIONS بقاعدة البيانات الدائمة"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">عنوان القرار *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: حسم مصير العم في الحلقة 10"
              className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs focus:border-amber-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">السؤال الدرامي المحير *</label>
            <textarea
              rows={2}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="مثال: هل يكون العم هو القاتل الحقيقي أم أنه مجرد كبش فداء تم الإيقاع به؟"
              className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs focus:border-amber-500 focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">الخيارات المطروحة (كل خيار في سطر)</label>
              <textarea
                rows={3}
                value={optionsStr}
                onChange={(e) => setOptionsStr(e.target.value)}
                placeholder="الخيار الأول&#10;الخيار الثاني"
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">الخيار المعتمد والمحسوم</label>
              <input
                type="text"
                value={selectedOption}
                onChange={(e) => setSelectedOption(e.target.value)}
                placeholder="ما تم الاستقرار عليه نهائياً"
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">أسباب الحسم (Reasoning)</label>
              <input
                type="text"
                value={reasoning}
                onChange={(e) => setReasoning(e.target.value)}
                placeholder="لماذا هذا الخيار أقوى درامياً وصوتياً؟"
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">الأثر على سير الحبكة (Impact)</label>
              <input
                type="text"
                value={impact}
                onChange={(e) => setImpact(e.target.value)}
                placeholder="كيف سيؤثر على الحلقات اللاحقة؟"
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs focus:border-amber-500 focus:outline-none"
              />
            </div>
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
              {editingDecision ? 'تحديث القرار' : 'حفظ القرار في قاعدة البيانات'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
