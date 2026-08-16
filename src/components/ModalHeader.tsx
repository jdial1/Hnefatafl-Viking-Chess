import React from 'react';
import { X } from '../icons';
import { Btn } from './ui';

interface ModalHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  titleClassName?: string;
  onClose: () => void;
  closeAriaLabel?: string;
}

export const ModalHeader: React.FC<ModalHeaderProps> = ({
  title,
  subtitle,
  icon,
  titleClassName = '',
  onClose,
  closeAriaLabel = 'Close modal',
}) => {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-4 mb-5 shrink-0">
      <div className="flex items-start gap-3 min-w-0 pt-1">
        {icon && <div className="shrink-0 mt-0.5">{icon}</div>}
        <div className="min-w-0">
          <h2 className={`text-lg sm:text-xl font-semibold leading-tight ${titleClassName || 'text-slate-100'}`}>
            {title}
          </h2>
          {subtitle && <p className="text-sm text-slate-300 mt-1 leading-5">{subtitle}</p>}
        </div>
      </div>
      <Btn
        onClick={onClose}
        aria-label={closeAriaLabel}
        title={closeAriaLabel}
        variant="ghost"
        size="icon"
        className="w-11 h-11 p-0 text-slate-400 hover:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
      >
        <X className="w-5 h-5" />
      </Btn>
    </div>
  );
};
