import { RefreshCw } from '../icons';
import React from 'react';
import { GameStatus } from '../types';
import { ROLE_META } from '../utils/roles';
import { Modal } from './Modal';
import { ModalHeader } from './ModalHeader';
import { Btn, RoleIcon } from './ui';

interface VictoryModalProps {
  status: GameStatus;
  reason?: string;
  totalMoves: number;
  onReplay: () => void;
  onClose: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  status,
  reason,
  totalMoves,
  onReplay,
  onClose,
}) => {
  if (status === 'playing' || status === 'draw') return null;

  const winner: 'defenders' | 'attackers' = status === 'defenders_win' ? 'defenders' : 'attackers';
  const meta = ROLE_META[winner];

  return (
    <Modal isOpen onClose={onClose} ariaLabel={`${meta.plural} victory`} maxWidth="md" className="p-5 sm:p-6">
      <ModalHeader
        title={`${meta.plural} win`}
        subtitle={reason || meta.victory}
        icon={<RoleIcon role={winner} className={`w-6 h-6 ${meta.colorClass}`} />}
        titleClassName={meta.colorClass}
        onClose={onClose}
        closeAriaLabel="Close victory modal"
      />

      <p className="text-sm text-slate-300 leading-6 mb-6">
        The game ended after <strong className="text-slate-100">{totalMoves} moves</strong> under Fetlar 11x11 rules.
      </p>

      <div className="flex flex-col gap-2">
        <Btn id="btn-same-rematch" onClick={onReplay} variant="primary" size="lg" className="w-full">
          <RefreshCw className="w-4 h-4" />
          Play Again
        </Btn>
        <Btn
          id="btn-review-board"
          onClick={onClose}
          variant="ghost"
          className="w-full"
        >
          Review Board State
        </Btn>
      </div>
    </Modal>
  );
};
