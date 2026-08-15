import { History } from "../icons";
import React from 'react';
import { Move } from '../types';
import { Modal } from './Modal';
import { ModalHeader } from './ModalHeader';

interface MoveHistoryProps {
  isOpen: boolean;
  moves: Move[];
  onClose: () => void;
}

export const MoveHistory: React.FC<MoveHistoryProps> = ({ isOpen, moves, onClose }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="sm" className="max-h-[85vh] flex flex-col">
      <ModalHeader
        title={`Move Log (${moves.length})`}
        subtitle="Algebraic Notation"
        icon={History}
        onClose={onClose}
        closeAriaLabel="Close move log"
      />

      <div className="mt-4 overflow-y-auto max-h-[55vh] space-y-2 pr-1 text-xs">
        {moves.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            No moves played yet.
          </div>
        ) : (
          moves.map((move, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 font-mono"
            >
              <div className="flex items-center gap-2">
                <span className="text-slate-400 text-xs w-6">#{idx + 1}</span>
                <span
                  className={`font-semibold ${
                    move.piece.role === 'defenders' ? 'text-amber-400' : 'text-slate-300'
                  }`}
                >
                  {move.notation}
                </span>
              </div>
              {move.captures.length > 0 && (
                <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 font-bold text-xs border border-rose-500/30">
                  +{move.captures.length} CAPTURE
                </span>
              )}
            </div>
          ))
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-800 text-center text-xs text-slate-400 font-mono">
        Standard Algebraic Movement Log
      </div>
    </Modal>
  );
};

