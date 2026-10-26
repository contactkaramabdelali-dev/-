import React, { useState } from 'react';
import {
  Clock,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  Filter,
  Trash2,
  Layers,
  RotateCw,
} from 'lucide-react';
import { useNovel } from '../../context/NovelContext';
import { GenerationRun } from '../../types/database';
import { Modal } from '../common/Modal';

export const GeminiRunsLog: React.FC = () => {
  const { generationRuns, deleteGenerationRun, projects, episodes, storyUnits } = useNovel();
  const [selectedRun, setSelectedRun] = useState<GenerationRun | null>(null);
  const [filterOp, setFilterOp] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredRuns = generationRuns.filter((run) => {
    if (filterOp !== 'all' && run.operation_type !== filterOp) return false;
    if (filterStatus !== 'all' && (run.status || (run.output ? 'succeeded' : 'pending')) !== filterStatus) return false;
    return true;
  });

  const getStatusBadge = (run: GenerationRun) => {
    const status = run.status || (run.output ? 'succeeded' : 'pending');
    switch (status) {
      case 'succeeded':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>ناجح (Succeeded)</span>
          </span>
        );
      case 'failed':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-950 text-red-300 border border-red-800 flex items-center gap-1">
            <XCircle className="w-3 h-3 text-red-400" />
            <span>فشل ({run.error_code || 'Failed'})</span>
          </span>
        );
      case 'blocked':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-800 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            <span>تم منعه ({run.error_code || 'Blocked'})</span>
          </span>
        );
      case 'running':
      case 'pending':
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-950 text-blue-300 border border-blue-800 flex items-center gap-1">
            <RotateCw className="w-3 h-3 text-blue-400 animate-spin" />
            <span>قيد المعالجة (Running)</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters and Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-zinc-950 border border-zinc-850">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-400" />
          <h4 className="font-heading font-bold text-sm text-zinc-100">
            سجل عمليات Gemini (Gemini Operations Log) ({filteredRuns.length})
          </h4>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Operation Filter */}
          <select
            value={filterOp}
            onChange={(e) => setFilterOp(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-mono focus:outline-none"
          >
            <option value="all">كافة العمليات</option>
            <option value="connection_test">connection_test</option>
            <option value="write_unit">write_unit</option>
            <option value="plan_episode">plan_episode</option>
            <option value="review_unit">review_unit</option>
            <option value="revise_unit">revise_unit</option>
            <option value="extract_memory">extract_memory</option>
            <option value="continuity_check">continuity_check</option>
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-mono focus:outline-none"
          >
            <option value="all">كافة الحالات</option>
            <option value="succeeded">ناجح (succeeded)</option>
            <option value="failed">فشل (failed)</option>
            <option value="blocked">تم منعه (blocked)</option>
            <option value="running">قيد التشغيل (running)</option>
          </select>
        </div>
      </div>

      {/* Log Entries */}
      {filteredRuns.length === 0 ? (
        <div className="p-8 text-center text-xs text-zinc-500 font-mono bg-[#0f1117] rounded-xl border border-zinc-800">
          لا توجد عمليات مسجلة تطابق التصفية المحددة.
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredRuns.map((run) => {
            const ep = episodes.find((e) => e.id === run.episode_id);
            const unit = storyUnits.find((u) => u.id === run.unit_id);

            return (
              <div
                key={run.id}
                className="p-3.5 rounded-xl bg-[#0f1117] border border-zinc-800/80 hover:border-zinc-750 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-zinc-100 font-mono text-[11px] px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800">
                      {run.operation_type}
                    </span>
                    {getStatusBadge(run)}
                    {run.model && (
                      <span className="text-[10px] text-zinc-400 font-mono">
                        Model: {run.model}
                      </span>
                    )}
                    <span className="text-[10px] text-zinc-500 font-mono">
                      البداية: {new Date(run.created_at).toLocaleTimeString('ar-MA')}
                    </span>
                    {run.completed_at && (
                      <span className="text-[10px] text-zinc-500 font-mono">
                        • الانتهاء: {new Date(run.completed_at).toLocaleTimeString('ar-MA')}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-zinc-400 font-mono">
                    {ep && <span>الحلقة {ep.episode_number}: {ep.title}</span>}
                    {unit && <span>| الوحدة {unit.unit_number}: {unit.title}</span>}
                    {run.error_code && (
                      <span className="text-red-400 font-bold">
                        | كود الخطأ: {run.error_code}
                      </span>
                    )}
                  </div>

                  {run.validation_result && (
                    <div className="text-[11px] text-zinc-400 font-mono line-clamp-1">
                      النتيجة: {run.validation_result}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
                  <button
                    onClick={() => setSelectedRun(run)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-750 text-zinc-200 text-xs font-semibold cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-amber-400" />
                    <span>تفاصيل العملية</span>
                  </button>

                  <button
                    onClick={() => {
                      if (confirm('حذف هذا السجل من تاريخ العمليات؟')) {
                        deleteGenerationRun(run.id);
                      }
                    }}
                    className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors"
                    title="حذف"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Details Modal */}
      <Modal
        isOpen={Boolean(selectedRun)}
        onClose={() => setSelectedRun(null)}
        title="تفاصيل عملية Gemini"
        subtitle={`معرف التشغيل: ${selectedRun?.id}`}
        maxWidth="max-w-2xl"
      >
        {selectedRun && (
          <div className="space-y-4 text-xs font-mono">
            <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-zinc-950 border border-zinc-850">
              <div>نوع العملية: <span className="text-amber-400 font-bold">{selectedRun.operation_type}</span></div>
              <div>النموذج: <span className="text-zinc-200">{selectedRun.model || 'غير محدد'}</span></div>
              <div>الحالة: <span className="text-zinc-200">{selectedRun.status || 'مكتمل'}</span></div>
              <div>تاريخ الإنشاء: <span className="text-zinc-400">{new Date(selectedRun.created_at).toLocaleString('ar-MA')}</span></div>
              {selectedRun.error_code && (
                <div className="col-span-2 text-red-400 font-bold">
                  كود الخطأ: {selectedRun.error_code} ({selectedRun.error_message})
                </div>
              )}
            </div>

            {selectedRun.task_prompt && (
              <div>
                <span className="text-[10px] text-zinc-500 block mb-1">المهمة الموجهة للنموذج (Task Prompt):</span>
                <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-850 text-zinc-200 text-[11px]">
                  {selectedRun.task_prompt}
                </div>
              </div>
            )}

            {selectedRun.output && (
              <div>
                <span className="text-[10px] text-zinc-500 block mb-1">مخرجات النموذج (Output):</span>
                <div className="p-3 rounded-lg bg-black border border-zinc-850 text-zinc-200 text-[11px] max-h-60 overflow-y-auto leading-relaxed">
                  <pre className="whitespace-pre-wrap">{selectedRun.output}</pre>
                </div>
              </div>
            )}

            <div className="text-[10px] text-zinc-500 pt-2 border-t border-zinc-800">
              * تم حجب تفاصيل المفاتيح والبيانات الحساسة طبقاً لمعايير أمان بيئة Google AI Studio.
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
