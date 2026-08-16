import React from 'react';
import { Modal, ModalActions, ModalBody } from './Modal';
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
      <ModalBody>
        <p className="text-sm text-slate-300 leading-6 mb-6">
          Are you sure? This cannot be undone.
        </p>
      </ModalBody>
      <ModalActions>
        <Btn onClick={onCancel} variant="primary" size="lg" className="w-full">
          Stay
        </Btn>
        <Btn onClick={onConfirm} variant="danger" className="w-full">
          Resign
        </Btn>
      </ModalActions>
    </Modal>
  );
}
