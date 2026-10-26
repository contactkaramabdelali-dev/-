import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'max-w-2xl',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-black/80 backdrop-blur-md transition-all">
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />
      
      <div className={`relative w-full ${maxWidth} bg-[#111319] border border-zinc-800 rounded-2xl shadow-2xl shadow-black/90 z-10 overflow-hidden transform transition-all my-8`}>
        {/* Modal Header */}
        <div className="flex items-start justify-between p-5 border-b border-zinc-800/80 bg-gradient-to-b from-zinc-900/60 to-transparent">
          <div>
            <h3 className="text-lg font-bold text-zinc-100 font-heading tracking-wide">
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs text-amber-500/80 mt-1 font-sans">
                {subtitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-100 rounded-lg hover:bg-zinc-800 transition-colors"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto font-sans">
          {children}
        </div>
      </div>
    </div>
  );
};
