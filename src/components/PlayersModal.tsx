import React from 'react';
import { Users, User, GoogleG } from '../icons';
import { LobbyUser } from '../types';
import { Modal } from './Modal';
import { ModalHeader } from './ModalHeader';
import { Avatar, Chip } from './ui';

interface PlayersModalProps {
  isOpen: boolean;
  users: LobbyUser[];
  onClose: () => void;
}

export const PlayersModal: React.FC<PlayersModalProps> = ({ isOpen, users, onClose }) => {
  const roster = [...users].sort((a, b) => a.username.localeCompare(b.username));

  return (
    <Modal isOpen={isOpen} onClose={onClose} ariaLabel="Connected players" maxWidth="sm" scrollable>
      <ModalHeader
        title={`Connected players (${roster.length})`}
        subtitle="Everyone currently in the hall"
        icon={<Users className="w-5 h-5 text-amber-300" />}
        onClose={onClose}
        closeAriaLabel="Close connected players"
      />

      <div className="overflow-y-auto max-h-[55vh] pr-2">
        {roster.length === 0 ? (
          <div className="py-8 text-sm text-slate-300">The hall is empty.</div>
        ) : (
          <ul className="flex flex-col gap-2">
            {roster.map((user) => (
              <li key={user.id}>
                <Chip className="w-full px-2.5 py-1.5">
                  <Avatar
                    src={user.photoURL}
                    className="w-6 h-6 rounded-md"
                    fallback={
                      user.signedIn ? (
                        <GoogleG className="w-4 h-4 shrink-0" />
                      ) : (
                        <User className="w-4 h-4 text-emerald-400 shrink-0" />
                      )
                    }
                  />
                  <span className="text-amber-300 font-semibold truncate font-celtic">
                    {user.username || 'Unknown'}
                  </span>
                </Chip>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
};
