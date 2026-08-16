import { History } from '../icons';
import React from 'react';
import { Move } from '../types';
import { ROLE_META } from '../utils/roles';
import { Modal, ModalBody } from './Modal';
import { ModalHeader } from './ModalHeader';

interface MoveHistoryProps {
  isOpen: boolean;
  moves: Move[];
  onClose: () => void;
}

export const MoveHistory: React.FC<MoveHistoryProps> = ({ isOpen, moves, onClose }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} ariaLabel="Move log" maxWidth="sm">
      <ModalHeader
        title={`Saga of the Board (${moves.length})`}
        subtitle="The battle as it was told"
        icon={<History className="w-5 h-5 text-amber-300" />}
        onClose={onClose}
        closeAriaLabel="Close move log"
      />

      <ModalBody className="text-sm">
        {moves.length === 0 ? (
          <div className="py-8 text-slate-300">The board is still and nothing has been told.</div>
        ) : (
          <ol className="divide-y divide-slate-800/80">
            {moves.map((move, idx) => (
              <li key={`${move.timestamp}-${idx}`} className="py-2.5 flex items-start gap-2.5">
                <span className="font-mono text-xs text-slate-500 pt-0.5 shrink-0">{idx + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className={`leading-snug ${ROLE_META[move.piece.role].mutedClass}`}>
                    {move.saga ?? move.notation}
                  </p>
                  {move.saga && (
                    <p className="font-mono text-xs text-slate-500 mt-0.5">{move.notation}</p>
                  )}
                </div>
                {move.captures.length > 0 && (
                  <span className="px-2 py-0.5 rounded-lg bg-rose-500/15 text-rose-300 font-semibold text-xs shrink-0">
                    +{move.captures.length}
                  </span>
                )}
              </li>
            ))}
          </ol>
        )}
      </ModalBody>
    </Modal>
  );
};
