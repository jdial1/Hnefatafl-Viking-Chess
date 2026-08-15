import { Crown, Swords, ArrowRightLeft, RefreshCcw, X } from "../icons";
import React from 'react';
import { GameStatus } from '../types';
import { Modal } from './Modal';

interface VictoryModalProps {
  status: GameStatus;
  reason?: string;
  totalMoves: number;
  onSwapRolesAndReplay: () => void;
  onReplaySame: () => void;
  onClose: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  status,
  reason,
  totalMoves,
  onSwapRolesAndReplay,
  onReplaySame,
  onClose,
}) => {
  if (status === 'playing') return null;

  const isDefendersWin = status === 'defenders_win';

  return (
    <Modal isOpen={status !== 'playing'} onClose={onClose} maxWidth="md" className="p-6 sm:p-8 text-center">
      {/* Absolute top-right close button */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close victory modal"
        className="absolute top-4 right-4 z-10 p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500/50"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Top Decorative Background Glow (Contained) */}
      <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
        <div
          className={`absolute -top-24 -left-24 w-64 h-64 rounded-full blur-3xl opacity-20 ${
            isDefendersWin ? 'bg-amber-500' : 'bg-sky-500'
          }`}
        />
      </div>

      {/* Icon Header */}
      <div className="relative mx-auto mb-4 w-20 h-20 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center">
        {isDefendersWin ? (
          <Crown className="w-10 h-10 text-amber-400" />
        ) : (
          <Swords className="w-10 h-10 text-sky-400 rotate-90" />
        )}
      </div>

      {/* Victory Heading */}
      <h2 className="text-2xl sm:text-3xl font-black uppercase font-mono tracking-wider text-slate-100 mb-2">
        {isDefendersWin ? (
          <span className="text-amber-400">DEFENDERS VICTORY</span>
        ) : (
          <span className="text-sky-400">ATTACKERS VICTORY</span>
        )}
      </h2>

      <p className="text-sm text-slate-300 font-medium mb-6">
        {reason || (isDefendersWin ? 'The King has escaped to safety!' : 'The King has been captured!')}
      </p>

      {/* Match Stats Pill */}
      <div className="flex items-center justify-center gap-6 py-3 px-4 rounded-xl bg-slate-950/80 border border-slate-800/80 mb-6 text-xs text-slate-400 font-mono">
        <div>
          <div className="text-slate-200 font-bold text-base">{totalMoves}</div>
          <div>TOTAL MOVES</div>
        </div>
        <div className="w-px h-8 bg-slate-800" />
        <div>
          <div className="text-amber-400 font-bold text-base">FETLAR</div>
          <div>RULES 11x11</div>
        </div>
      </div>

      {/* Prominent Action Loops */}
      <div className="flex flex-col gap-3">
        <button
          id="btn-swap-rematch"
          onClick={onSwapRolesAndReplay}
          className="w-full py-3.5 px-6 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black tracking-wide text-sm flex items-center justify-center gap-2.5 transition-all shadow-lg active:scale-98"
        >
          <ArrowRightLeft className="w-5 h-5 stroke-[2.5]" />
          <span>SWAP ROLES & REPLAY</span>
        </button>

        <button
          id="btn-same-rematch"
          onClick={onReplaySame}
          className="w-full py-3 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm border border-slate-700 flex items-center justify-center gap-2 transition-colors"
        >
          <RefreshCcw className="w-4 h-4 text-slate-400" />
          <span>Replay (Same Roles)</span>
        </button>

        <button
          id="btn-review-board"
          onClick={onClose}
          className="text-xs text-slate-400 hover:text-slate-200 py-1 transition-colors"
        >
          Review Board State
        </button>
      </div>
    </Modal>
  );
};

