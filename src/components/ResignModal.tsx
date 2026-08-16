import React from 'react';
import { Modal } from './Modal';
import { ModalHeader } from './ModalHeader';
import { Btn } from './ui';

export function ResignModal({
  isOpen,
  onCancel,
  onConfirm,
}: {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal isOpen={isOpen} onClose={onCancel} ariaLabel="Resign from match" maxWidth="sm">
      <ModalHeader
        title="Quit this match?"
        subtitle="Resigning ends the game. You lose, and your opponent is awarded the field."
        onClose={onCancel}
        closeAriaLabel="Stay in the match"
        titleClassName="text-rose-300"
      />
      <p className="text-sm text-slate-300 leading-6 mb-6">
        Are you sure? This cannot be undone.
      </p>
      <div className="flex flex-col gap-2">
        <Btn onClick={onCancel} variant="primary" size="lg" className="w-full">
          Stay
        </Btn>
        <Btn onClick={onConfirm} variant="ghost" className="w-full hover:bg-rose-950 hover:text-rose-300">
          Resign
        </Btn>
      </div>
    </Modal>
  );
}
