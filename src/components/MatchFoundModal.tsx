import React from 'react';
import { GoogleG, User } from '../icons';
import { PlayerRole } from '../types';
import { ROLE_META } from '../utils/roles';
import { Modal } from './Modal';
import { ModalHeader } from './ModalHeader';
import { Avatar, Btn, RoleIcon } from './ui';

interface MatchFoundModalProps {
  isOpen: boolean;
  opponentName: string;
  opponentPhotoURL?: string | null;
  opponentSignedIn?: boolean;
  yourRole: PlayerRole;
  accepted: boolean;
  opponentReady: boolean;
  onJoin: () => void;
  onLeave: () => void;
}

export const MatchFoundModal: React.FC<MatchFoundModalProps> = ({
  isOpen,
  opponentName,
  opponentPhotoURL,
  opponentSignedIn,
  yourRole,
  accepted,
  opponentReady,
  onJoin,
  onLeave,
}) => {
  const opponentRole: PlayerRole = yourRole === 'defenders' ? 'attackers' : 'defenders';
  const theirMeta = ROLE_META[opponentRole];
  const yourMeta = ROLE_META[yourRole];
  const name = opponentName || 'Unknown';

  return (
    <Modal isOpen={isOpen} onClose={onLeave} ariaLabel="Opponent found" maxWidth="sm">
      <ModalHeader
        title="A rival has arrived"
        subtitle={`${name} stands as ${theirMeta.plural}`}
        icon={<RoleIcon role={opponentRole} className={`w-6 h-6 ${theirMeta.colorClass}`} />}
        onClose={onLeave}
        closeAriaLabel="Leave match"
      />

      <div className="flex items-center gap-3 mb-5 min-w-0">
        <Avatar
          src={opponentPhotoURL}
          className="w-14 h-14 rounded-xl"
          fallback={
            opponentSignedIn ? (
              <GoogleG className="w-7 h-7 shrink-0" />
            ) : (
              <User className="w-7 h-7 text-emerald-400 shrink-0" />
            )
          }
        />
        <div className="min-w-0">
          <div className="text-amber-300 font-semibold truncate font-celtic text-lg">{name}</div>
          <div className={`text-sm ${theirMeta.colorClass}`}>{theirMeta.plural}</div>
        </div>
      </div>

      <p className="text-sm text-slate-300 leading-6 mb-6">
        You take the field as <strong className={yourMeta.colorClass}>{yourMeta.plural}</strong>.
        {accepted
          ? ` Waiting for ${name} to join.`
          : opponentReady
            ? ` ${name} is ready.`
            : ' Both must join to begin.'}
      </p>

      <div className="flex flex-col gap-2">
        <Btn onClick={onJoin} variant="primary" size="lg" className="w-full" disabled={accepted}>
          {accepted ? `Waiting for ${name}` : 'Join match'}
        </Btn>
        <Btn onClick={onLeave} variant="ghost" className="w-full hover:text-rose-300">
          Leave
        </Btn>
      </div>
    </Modal>
  );
};
