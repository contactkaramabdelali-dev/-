import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  hintText?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  hintText,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-dashed border-zinc-800 bg-[#0d0f14]/60 backdrop-blur-sm my-4">
      <div className="w-16 h-16 rounded-2xl bg-zinc-900/90 border border-zinc-700/60 flex items-center justify-center text-amber-500/80 mb-4 shadow-inner shadow-black/60 relative group">
        <div className="absolute inset-0 bg-amber-500/10 rounded-2xl blur-md group-hover:bg-amber-500/20 transition-all duration-500" />
        <Icon className="w-8 h-8 relative z-10 stroke-[1.5]" />
      </div>

      <h3 className="text-lg font-bold text-zinc-100 font-heading mb-2">
        {title}
      </h3>

      <p className="text-sm text-zinc-400 max-w-md leading-relaxed mb-6 font-sans">
        {description}
      </p>

      {hintText && (
        <div className="text-xs text-amber-500/70 bg-amber-950/20 px-3 py-1.5 rounded-md border border-amber-900/40 mb-6 font-mono">
          {hintText}
        </div>
      )}

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-zinc-950 font-bold text-sm shadow-lg shadow-amber-950/40 hover:shadow-amber-600/30 transition-all duration-200 active:scale-95 cursor-pointer"
        >
          <span>{actionLabel}</span>
        </button>
      )}
    </div>
  );
};
