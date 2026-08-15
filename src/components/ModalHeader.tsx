import React from 'react';
import { X } from "../icons";

interface ModalHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>;
  iconColorClass?: string;
  onClose: () => void;
  closeAriaLabel?: string;
}

export const ModalHeader: React.FC<ModalHeaderProps> = ({
  title,
  subtitle,
  icon: Icon,
  iconColorClass = 'text-amber-400',
  onClose,
  closeAriaLabel = 'Close modal',
}) => {
  return (
    <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4 shrink-0">
      <div className="flex items-center gap-2.5 min-w-0">
        {Icon && (
          <div className="w-9 h-9 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0">
            <Icon className={`w-4 h-4 ${iconColorClass}`} />
          </div>
        )}
        <div className="min-w-0">
          <h2 className="text-base sm:text-lg font-black font-mono uppercase text-slate-100 leading-tight truncate">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs text-slate-400 truncate">{subtitle}</p>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label={closeAriaLabel}
        className="p-1.5 sm:p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 active:scale-95 text-slate-400 hover:text-slate-100 transition-all focus:outline-none focus:ring-2 focus:ring-amber-500/50 shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
