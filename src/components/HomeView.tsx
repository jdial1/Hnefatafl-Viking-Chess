import React from 'react';
import {
  Shield,
  Swords,
  Zap,
  Radio,
  Play,
  RefreshCw,
  UserCheck,
} from '../icons';
import { LobbyUser, OnlineMatchState } from '../types';

interface HomeViewProps {
  onlineState: OnlineMatchState;
  lobbyUsers: LobbyUser[];
  onSetUsername: (name: string) => void;
  onJoinQueue: () => void;
  onLeaveQueue: () => void;
  onEnterBoard: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onlineState,
  lobbyUsers: _lobbyUsers,
  onSetUsername: _onSetUsername,
  onJoinQueue,
  onLeaveQueue,
  onEnterBoard,
}) => {
  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-4 sm:gap-5 px-1 sm:px-4 py-2 mt-2 sm:mt-8">
      {/* Hero Summary & Matchmaking Card */}
      <section className={`relative min-h-[360px] sm:min-h-0 bg-slate-900 border-y sm:border border-slate-800 sm:rounded-2xl p-4 py-8 sm:p-6 sm:py-8 shadow-xl flex flex-col justify-center gap-6 sm:gap-6 celtic-knot-border ${onlineState.inQueue ? 'celtic-knot-active' : ''}`}>
        
        {/* Full Summary Description */}
        <div className="space-y-3 sm:space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed font-sans z-10">
          <p>
            <strong className="text-slate-100 font-celtic text-base tracking-wider">Hnefatæfl</strong> (Viking Chess) is a legendary Norse strategy board game played on an 11x11 grid. It is an asymmetric game pitting two unequal forces against each other.
          </p>
          <p>
            The <span className="text-amber-400 font-semibold">12 Defenders</span> and their King start in the center. Their goal is to escort the King to safety by reaching any of the four corner refuge squares. 
          </p>
          <p>
            The <span className="text-sky-400 font-semibold">24 Attackers</span> surround the defenders from the edges. Their objective is to capture the King by completely surrounding him on all four sides.
          </p>

        </div>

        {/* Quick Highlights */}
        <div className="grid grid-cols-2 gap-2 sm:gap-4 text-xs pt-4 border-t border-slate-800/70 z-10">
          <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
            <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 shrink-0" />
            <div className="min-w-0">
              <span className="font-bold text-slate-100 block truncate">Defenders (12 + King)</span>
              <span className="text-slate-400 text-xs block truncate">Escort King to corner</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
            <Swords className="w-4 h-4 sm:w-5 sm:h-5 text-sky-400 shrink-0 rotate-90" />
            <div className="min-w-0">
              <span className="font-bold text-slate-100 block truncate">Attackers (24)</span>
              <span className="text-slate-400 text-xs block truncate">Surround & capture King</span>
            </div>
          </div>
        </div>

        {/* Online Matchmaking Controls */}
        <div className="pt-4 z-10 mt-2">
          {onlineState.roomId ? (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-amber-400 font-mono uppercase">
                    Connected
                  </span>
                </div>

                <div className="text-xs text-slate-300">
                  {onlineState.opponentName ? (
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5" />
                      Matched with <span className="font-celtic text-sm">{onlineState.opponentName}</span> ({onlineState.role})
                    </span>
                  ) : (
                    <span className="text-amber-400 flex items-center gap-1">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Waiting for opponent...
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                <button
                  onClick={onEnterBoard}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-colors flex-1 sm:flex-none"
                >
                  Enter Game Board
                </button>
              </div>
            </div>
          ) : (
            <div className="w-full">
              {onlineState.inQueue ? (
                <button
                  onClick={onLeaveQueue}
                  className="w-full h-[60px] sm:h-[64px] rounded-xl bg-amber-500/10 border border-amber-500/30 hover:bg-rose-950/30 hover:border-rose-500/30 text-amber-400 hover:text-rose-400 text-sm sm:text-base font-black uppercase tracking-wider flex flex-col items-center justify-center gap-0.5 transition-colors group"
                >
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-5 h-5 animate-spin shrink-0 group-hover:text-rose-400" />
                    <span>Searching for opponent...</span>
                  </div>
                  <span className="text-xs text-amber-400/60 group-hover:text-rose-400/60 font-bold normal-case tracking-normal leading-none">
                    Tap to cancel
                  </span>
                </button>
              ) : (
                <button
                  onClick={onJoinQueue}
                  className="w-full h-[60px] sm:h-[64px] rounded-xl bg-amber-500 text-slate-950 hover:bg-amber-400 text-sm sm:text-base font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
                >
                  <Zap className="w-5 h-5 fill-current" />
                  <span>Play Online Match</span>
                </button>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

