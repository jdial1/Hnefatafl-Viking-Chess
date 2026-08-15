import { BookOpen, Shield, Swords, Crown } from "../icons";
import React from 'react';
import { Modal } from './Modal';
import { ModalHeader } from './ModalHeader';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="lg" className="max-h-[90vh] flex flex-col p-3.5 sm:p-5">
      <ModalHeader
        title="Hnefatafl Rules"
        subtitle="Viking Tafl Strategy Guide"
        icon={BookOpen}
        onClose={onClose}
        closeAriaLabel="Close rules modal"
      />

      {/* Scrollable Rules Content */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-3 text-xs text-slate-300">
        {/* Core Objectives */}
        <section className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
          <h3 className="text-xs font-bold text-amber-400 mb-1.5 flex items-center gap-1.5 font-mono uppercase">
            <Crown className="w-3.5 h-3.5" />
            Victory Objectives
          </h3>
          <div className="space-y-1.5 text-xs">
            <div className="flex items-start gap-2">
              <Shield className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              <span>
                <strong className="text-slate-100">Defenders (12 + King):</strong> Escape the King to any of the 4 corner refuges.
              </span>
            </div>
            <div className="flex items-start gap-2">
              <Swords className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5 rotate-90" />
              <span>
                <strong className="text-slate-100">Attackers (24):</strong> Surround and capture the King before he reaches safety.
              </span>
            </div>
          </div>
        </section>

        {/* Piece Movement */}
        <section className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/80 space-y-1.5">
          <h3 className="text-xs font-bold text-slate-100 font-mono uppercase">1. Rook-Like Movement</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            All pieces move orthogonally any number of unblocked squares (like Rooks in Chess). No leaping over other pieces.
          </p>
          <div className="text-xs text-amber-400/90 font-medium">
            * Special Squares: Only the King can enter the 4 Corner Refuges and central Throne.
          </div>
        </section>

        {/* Custodial Capture */}
        <section className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/80 space-y-1.5">
          <h3 className="text-xs font-bold text-slate-100 font-mono uppercase">2. Custodial ("Sandwich") Capture</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Flank an enemy piece on 2 opposite sides (horizontally or vertically) to capture it.
          </p>
          <ul className="list-disc list-inside text-xs text-slate-400 space-y-0.5 pt-0.5">
            <li>Corner refuges and empty Throne count as hostile capture squares.</li>
            <li>Moving voluntarily between 2 enemies is safe and NOT captured.</li>
          </ul>
        </section>

        {/* Capturing the King */}
        <section className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/80 space-y-1">
          <h3 className="text-xs font-bold text-slate-100 font-mono uppercase">3. Capturing the King</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Adjacent to or on the central Throne, the King requires a <strong>4-sided surround</strong> (or 3 attackers + Throne). On open tiles, 2-sided capture applies.
          </p>
        </section>
      </div>
    </Modal>
  );
};

