import React, { useEffect } from 'react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  ariaLabel: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  children: React.ReactNode;
}

const MAX_WIDTH = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
};

export function ModalBody({
  className = '',
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={`modal-body ${className}`}>{children}</div>;
}

export function ModalActions({
  className = '',
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={`flex flex-col gap-2 shrink-0 ${className}`}>{children}</div>;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  ariaLabel,
  maxWidth = 'md',
  className = '',
  children,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        className={`relative w-full ${MAX_WIDTH[maxWidth]} max-h-[85vh] flex flex-col min-h-0 overflow-hidden bg-slate-900 border border-slate-700 rounded-xl p-5 sm:p-6 text-slate-200 ${className}`}
      >
        {children}
      </div>
    </div>
  );
};
