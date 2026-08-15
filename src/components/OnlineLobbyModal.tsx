import { Radio, Check, Copy, UserCheck, RefreshCw, Zap, Play, Globe, Crown, Users } from "../icons";
import React, { useState } from 'react';
import { LobbyUser, OnlineMatchState } from '../types';
import { generateRandomNorseName } from '../utils/norseNames';
import { Modal } from './Modal';
import { ModalHeader } from './ModalHeader';

interface OnlineLobbyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onlineState: OnlineMatchState;
  lobbyUsers: LobbyUser[];
  onSetUsername: (name: string) => void;
  onJoinQueue: () => void;
  onLeaveQueue: () => void;
  onCreateRoom: () => void;
  onJoinRoom: (roomId: string) => void;
  onLeaveRoom: () => void;
}

export const OnlineLobbyModal: React.FC<OnlineLobbyModalProps> = ({
  isOpen,
  onClose,
  onlineState,
  lobbyUsers,
  onSetUsername,
  onJoinQueue,
  onLeaveQueue,
  onCreateRoom,
  onJoinRoom,
  onLeaveRoom,
}) => {
  const [usernameInput, setUsernameInput] = useState(onlineState.username || '');
  const [customRoomInput, setCustomRoomInput] = useState('');
  const [copiedRoomId, setCopiedRoomId] = useState(false);

  const masterUser = [...lobbyUsers].sort((a, b) => a.joinedAt - b.joinedAt)[0];

  const handleCopyRoom = () => {
    if (onlineState.roomId) {
      navigator.clipboard.writeText(onlineState.roomId);
      setCopiedRoomId(true);
      setTimeout(() => setCopiedRoomId(false), 2000);
    }
  };

  const handleRandomizeName = () => {
    const existingNames = lobbyUsers.map(u => u.username);
    const newName = generateRandomNorseName(existingNames);
    setUsernameInput(newName);
    onSetUsername(newName);
  };

  const handleUpdateName = (e: React.FormEvent) => {
    e.preventDefault();
    if (usernameInput.trim()) {
      onSetUsername(usernameInput.trim());
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="xl" className="max-h-[90vh] overflow-y-auto">
      <div className="flex flex-col gap-5">
        <ModalHeader
          title="Multiplayer Lobby"
          subtitle="Matchmaking & Private Rooms"
          icon={Globe}
          onClose={onClose}
          closeAriaLabel="Close multiplayer lobby modal"
        />

        {/* User Profile Bar */}
        <form onSubmit={handleUpdateName} className="flex items-center gap-2 bg-slate-950 p-2.5 rounded-2xl border border-slate-800">
          <div className="flex-1 flex items-center gap-2">
            <span className="text-xs text-slate-400 font-mono pl-1">Name:</span>
            <input
              type="text"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              maxLength={24}
              placeholder="Norse Name"
              className="bg-slate-900 text-slate-100 px-3 py-1.5 rounded-xl border border-slate-700/80 focus:outline-none focus:border-amber-500 font-celtic text-sm tracking-wider w-full"
            />
          </div>
          <button
            type="button"
            onClick={handleRandomizeName}
            title="Randomize Name"
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 transition-colors shrink-0"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            type="submit"
            className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-amber-500 text-slate-950 hover:bg-amber-400 transition-colors shrink-0"
          >
            Save
          </button>
        </form>

        {/* Active Room Status / Matchmaking controls */}
        {onlineState.roomId ? (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-amber-400 font-mono uppercase">
                  Active Room
                </span>
              </div>
              {onlineState.isMaster && (
                <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 text-xs font-bold border border-amber-500/30 flex items-center gap-1">
                  <Crown className="w-3 h-3" /> MASTER HOST
                </span>
              )}
            </div>

            <div className="flex items-center justify-between bg-slate-950 px-3 py-2 rounded-xl border border-slate-800">
              <span className="font-mono text-xs text-slate-300 select-all">{onlineState.roomId}</span>
              <button
                onClick={handleCopyRoom}
                className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 font-medium"
              >
                {copiedRoomId ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy ID</span>
                  </>
                )}
              </button>
            </div>

            <div className="text-xs text-slate-300">
              {onlineState.opponentName ? (
                <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                  <UserCheck className="w-4 h-4" />
                  <span>Matched with: <span className="font-celtic text-sm">{onlineState.opponentName}</span> ({onlineState.role})</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-amber-400 animate-pulse">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Waiting for opponent to join room...</span>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={onLeaveRoom}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-800 text-slate-300 hover:bg-rose-950 hover:text-rose-300 border border-slate-700 transition-colors"
              >
                Leave Room
              </button>
              {onlineState.opponentName && (
                <button
                  onClick={onClose}
                  className="px-4 py-1.5 text-xs font-bold rounded-xl bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-colors"
                >
                  Play Game
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Automatic Quick Matchmaking Queue */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-slate-200 font-bold text-sm mb-1">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>Quick Matchmaking</span>
                </div>
                <p className="text-xs text-slate-400">
                  Queue up and automatically match with the next available player.
                </p>
              </div>

              {onlineState.inQueue ? (
                <button
                  onClick={onLeaveQueue}
                  className="w-full py-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 text-xs font-bold flex items-center justify-center gap-2 hover:bg-amber-500/30 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Searching... (Click to Cancel)</span>
                </button>
              ) : (
                <button
                  onClick={onJoinQueue}
                  className="w-full py-2.5 rounded-xl bg-amber-500 text-slate-950 hover:bg-amber-400 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Find Match</span>
                </button>
              )}
            </div>

            {/* Private Host Room */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-slate-200 font-bold text-sm mb-1">
                  <Radio className="w-4 h-4 text-amber-400" />
                  <span>Host / Join Direct</span>
                </div>
                <p className="text-xs text-slate-400">
                  Host a private game room or join using a room code.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  onClick={onCreateRoom}
                  className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors"
                >
                  Create Private Room
                </button>

                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    placeholder="Paste Room ID"
                    value={customRoomInput}
                    onChange={(e) => setCustomRoomInput(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-800 text-xs px-2.5 py-1.5 rounded-xl text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
                  />
                  <button
                    onClick={() => customRoomInput.trim() && onJoinRoom(customRoomInput.trim())}
                    disabled={!customRoomInput.trim()}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
                  >
                    Join
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Active Online Users List (Broadcast by Master Host) */}
        <div className="flex flex-col gap-2.5 pt-2 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                Lobby Broadcast ({lobbyUsers.length} Online)
              </span>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Oldest user is Master Host
            </span>
          </div>

          <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
            {lobbyUsers.length === 0 ? (
              <div className="text-xs text-slate-500 py-3 text-center italic">
                Connecting to server...
              </div>
            ) : (
              lobbyUsers.map((user) => {
                const isMaster = user.id === masterUser?.id;
                return (
                  <div
                    key={user.id}
                    className="flex items-center justify-between bg-slate-950/60 px-3 py-2 rounded-xl border border-slate-800/80 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      {isMaster && (
                        <span title="Master Host (Holds & syncs user list)">
                          <Crown className="w-3.5 h-3.5 text-amber-400" />
                        </span>
                      )}
                      <span className="font-semibold text-slate-200 font-celtic text-sm tracking-wider">{user.username}</span>
                      {user.roomId && (
                        <span className="text-xs px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded font-mono">
                          In Game
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-slate-400 font-mono text-xs">
                      {user.inQueue && (
                        <span className="text-amber-400 font-bold">
                          In Queue
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

