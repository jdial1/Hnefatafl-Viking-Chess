import React from 'react';
import { Users } from '../icons';
import { LobbyUser } from '../types';
import { Modal, ModalBody } from './Modal';
import { ModalHeader } from './ModalHeader';
import { Avatar } from './ui';

interface PlayersModalProps {
  isOpen: boolean;
  users: LobbyUser[];
  onClose: () => void;
}

export const PlayersModal: React.FC<PlayersModalProps> = ({ isOpen, users, onClose }) => {
  const roster = [...users].sort((a, b) => a.username.localeCompare(b.username));

  return (
    <Modal isOpen={isOpen} onClose={onClose} ariaLabel="Connected players" maxWidth="sm">
      <ModalHeader
        title={`Connected players (${roster.length})`}
        subtitle="Everyone currently in the hall"
        icon={<Users className="w-5 h-5 text-amber-300" />}
        onClose={onClose}
        closeAriaLabel="Close connected players"
      />

      <ModalBody>
        {roster.length === 0 ? (
          <div className="py-8 text-sm text-slate-300">The hall is empty.</div>
        ) : (
          <ul className="flex flex-col gap-1">
            {roster.map((user) => (
              <li
                key={user.id}
                className="flex items-center gap-2 px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 min-w-0"
              >
                <Avatar
                  src={user.photoURL}
                  signedIn={user.signedIn}
                  className="w-5 h-5 rounded-md"
                />
                <span className="text-sm text-amber-300 font-semibold truncate leading-tight">
                  {user.username || 'Unknown'}
                  {user.signedIn && user.googleInitials ? ` (${user.googleInitials})` : ''}
                </span>
              </li>
            ))}
          </ul>
        )}
      </ModalBody>
    </Modal>
  );
};
