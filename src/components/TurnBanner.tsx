import { Shield, Swords, Sparkles, Clock, Crown, History, Flask, RefreshCcw } from "../icons";
import React from 'react';

import { Move, PlayerRole } from '../types';

interface TurnBannerProps {
  currentTurn: PlayerRole;
  playerRole: PlayerRole | null;
  opponentName: string | null;
  moveCount: number;
  lastMoveRecord: Move | null;
  isSandboxMode?: boolean;
  pieceCounts?: {
    attackers: number;
    defenders: number;
    hasKing: boolean;
    capturedAttackers: number;
    capturedDefenders: number;
  };
  isEscapeThreat?: boolean;
  onResetBoard?: () => void;
  onOpenHistory: () => void;
}

export const TurnBanner: React.FC<TurnBannerProps> = ({
  currentTurn,
  playerRole,
  opponentName,
  moveCount,
  lastMoveRecord,
  isSandboxMode,
  pieceCounts,
  isEscapeThreat = false,
  onResetBoard,
  onOpenHistory,
}) => {
  if (!playerRole && !isSandboxMode) return null;

  const isMyTurn = isSandboxMode ? true : (currentTurn === playerRole);

  const getRoleInfo = (role: PlayerRole) => {
    if (role === 'defenders') {
      return {
        label: 'Defender',
        icon: Shield,
        colorClass: 'text-amber-400',
        bgClass: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
      };
    }
    return {
      label: 'Attacker',
      icon: (p: any) => <Swords {...p} className={`${p?.className || ''} rotate-90`} />,
      colorClass: 'text-sky-400',
      bgClass: 'bg-sky-500/10 border-sky-500/30 text-sky-300',
    };
  };

  const myRoleInfo = playerRole ? getRoleInfo(playerRole) : null;
  const currentTurnInfo = getRoleInfo(currentTurn);

  return (
    <div className="w-full max-w-4xl mx-auto px-2 sm:px-0 mb-1 space-y-1.5">
      <div
        className={`w-full rounded-xl bg-slate-900/90 border transition-all duration-300 px-2 sm:px-3 py-1.5 flex items-center justify-between gap-2 ${
          isSandboxMode
            ? 'border-amber-500/40 ring-1 ring-amber-500/20'
            : isMyTurn
            ? 'border-amber-500/50 ring-1 ring-amber-500/20'
            : 'border-slate-800'
        }`}
      >
        {/* Left: Player Side or Sandbox Badge */}
        <div className="flex items-center gap-1.5 shrink-0">
          {isSandboxMode ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-amber-500/40 bg-amber-500/10 text-amber-300 text-xs font-extrabold font-mono">
              <Flask className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="uppercase">SANDBOX</span>
            </div>
          ) : myRoleInfo ? (
            <div
              className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-xs font-extrabold font-mono ${myRoleInfo.bgClass}`}
            >
              <myRoleInfo.icon className="w-3.5 h-3.5 shrink-0" />
              <span className="uppercase">{myRoleInfo.label}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-slate-800 bg-slate-950 text-slate-400 text-xs font-mono font-bold">
              <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="hidden sm:inline">LOCAL</span>
            </div>
          )}
        </div>

        {/* Center: Turn Action Badge & Threat Alert */}
        <div className="flex items-center justify-center flex-1 truncate px-1 gap-2">
          <div
            className={`flex items-center justify-center gap-1.5 px-3 py-1 rounded-lg border font-mono text-xs font-black uppercase tracking-wider ${
              currentTurn === 'defenders'
                ? 'bg-amber-500 text-slate-950 border-amber-300'
                : 'bg-sky-500 text-slate-950 border-sky-300'
            }`}
          >
            <currentTurnInfo.icon className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{currentTurnInfo.label} Turn</span>
          </div>

          {isEscapeThreat && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-400/80 text-amber-300 font-mono font-black text-xs uppercase tracking-wider animate-pulse shadow-lg shadow-amber-500/20 shrink-0">
              <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="hidden sm:inline">Escape Threat!</span>
              <span className="sm:hidden">Threat!</span>
            </div>
          )}

          {isSandboxMode && onResetBoard && (
            <button
              onClick={onResetBoard}
              title="Reset Board"
              className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-mono font-bold transition-colors shrink-0"
            >
              <RefreshCcw className="w-3 h-3 text-amber-400" />
              <span>Reset Board</span>
            </button>
          )}
        </div>

        {/* Right: Reset Board (mobile) & Move Log */}
        <div className="flex items-center gap-1.5 shrink-0">
          {isSandboxMode && onResetBoard && (
            <button
              onClick={onResetBoard}
              title="Reset Board"
              className="sm:hidden p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            >
              <RefreshCcw className="w-3.5 h-3.5 text-amber-400" />
            </button>
          )}

          <button
            onClick={onOpenHistory}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-950/80 hover:bg-slate-800 border border-slate-800 text-xs font-mono text-slate-300 transition-colors shrink-0"
            title="Open Move Log"
          >
            <History className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="font-bold text-slate-200">#{moveCount}</span>
            {lastMoveRecord && (
              <span className="hidden md:inline text-xs text-slate-400 font-medium">
                ({lastMoveRecord.notation})
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Material Tally Bar */}
      {pieceCounts && (
        <div className="w-full bg-slate-950/80 border border-slate-800/80 rounded-lg px-2.5 py-1 flex items-center justify-between text-[11px] sm:text-xs font-mono">
          {/* Defenders Stats */}
          <div className="flex items-center gap-1.5 text-amber-300">
            <Shield className="w-3 h-3 text-amber-400" />
            <span className="font-bold">Defenders:</span>
            <span className="text-amber-200">{pieceCounts.defenders}</span>
            <span className="text-slate-500">/12</span>
            {pieceCounts.hasKing && <span className="text-amber-400 font-bold ml-0.5">+ King</span>}
            {pieceCounts.capturedDefenders > 0 && (
              <span className="text-rose-400 text-[10px] ml-1">({pieceCounts.capturedDefenders} lost)</span>
            )}
          </div>

          {/* Attackers Stats */}
          <div className="flex items-center gap-1.5 text-sky-300">
            <Swords className="w-3 h-3 text-sky-400 rotate-90" />
            <span className="font-bold">Attackers:</span>
            <span className="text-sky-200">{pieceCounts.attackers}</span>
            <span className="text-slate-500">/24</span>
            {pieceCounts.capturedAttackers > 0 && (
              <span className="text-rose-400 text-[10px] ml-1">({pieceCounts.capturedAttackers} lost)</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
