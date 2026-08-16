import React from 'react';
import { Crown, History, Flask, RefreshCw } from '../icons';
import { Move, PieceCounts, PlayerRole, STARTING_SOLDIER_COUNTS } from '../types';
import { PLAYER_ROLES, ROLE_META } from '../utils/roles';
import { Btn, RoleIcon } from './ui';

interface TurnBannerProps {
  currentTurn: PlayerRole;
  playerRole: PlayerRole | null;
  moveCount: number;
  lastMoveRecord: Move | null;
  isSandboxMode?: boolean;
  pieceCounts?: PieceCounts;
  isEscapeThreat?: boolean;
  onResetBoard?: () => void;
  onOpenHistory: () => void;
}

function forceStats(role: PlayerRole, pieceCounts: PieceCounts) {
  const live = pieceCounts[role];
  const lost = role === 'defenders' ? pieceCounts.capturedDefenders : pieceCounts.capturedAttackers;
  return {
    meta: ROLE_META[role],
    live,
    lost,
    cap: STARTING_SOLDIER_COUNTS[role],
  };
}

export const TurnBanner: React.FC<TurnBannerProps> = ({
  currentTurn,
  playerRole,
  moveCount,
  lastMoveRecord,
  isSandboxMode,
  pieceCounts,
  isEscapeThreat = false,
  onResetBoard,
  onOpenHistory,
}) => {
  if (!playerRole && !isSandboxMode) return null;

  const isMyTurn = isSandboxMode || currentTurn === playerRole;
  const myRole = playerRole ? ROLE_META[playerRole] : null;
  const turnMeta = ROLE_META[currentTurn];
  const turnLabel = isSandboxMode
    ? `${turnMeta.plural} to move`
    : isMyTurn
      ? 'Your turn'
      : 'Waiting';

  const identity = isSandboxMode ? (
    <div title="Sandbox mode" className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-amber-500/10 text-amber-300 text-xs font-semibold">
      <Flask className="w-3.5 h-3.5 text-amber-400 shrink-0" />
      <span>Sandbox</span>
    </div>
  ) : myRole && playerRole ? (
    <div title={`You are ${myRole.plural}`} className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-semibold ${myRole.bgClass}`}>
      <RoleIcon role={playerRole} className="w-3.5 h-3.5 shrink-0" />
      <span>You</span>
    </div>
  ) : (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-950 text-slate-300 text-xs font-medium">
      <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
      <span>Local</span>
    </div>
  );

  const turnPill = (
    <div
      className={`flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-lg text-sm font-semibold ${
        isMyTurn ? turnMeta.turnClass : 'bg-slate-950 text-slate-300 border border-slate-800'
      }`}
    >
      <RoleIcon role={currentTurn} className="w-4 h-4 shrink-0" />
      <span className="truncate">
        {turnLabel}
        {!isSandboxMode && (
          <span className="hidden sm:inline">
            {isMyTurn ? ` · ${turnMeta.plural}` : ` · ${turnMeta.plural} to move`}
          </span>
        )}
      </span>
    </div>
  );

  const counts = pieceCounts
    ? PLAYER_ROLES.map((role) => {
        const { meta, live, lost, cap } = forceStats(role, pieceCounts);
        return (
          <div key={role} className={`flex items-center gap-1 ${meta.mutedClass}`} title={`${meta.plural} ${live}/${cap}`}>
            <RoleIcon role={role} className={`w-3.5 h-3.5 ${meta.colorClass}`} />
            <span className={`font-mono font-semibold text-sm ${meta.countClass}`}>{live}</span>
            <span className="hidden sm:inline font-mono text-xs text-slate-400">/{cap}</span>
            {role === 'defenders' && pieceCounts.hasKing && (
              <Crown className="w-3.5 h-3.5 text-amber-300" />
            )}
            {lost > 0 && <span className="font-mono text-xs text-rose-300">-{lost}</span>}
          </div>
        );
      })
    : null;

  const actions = (
    <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
      {isSandboxMode && onResetBoard && (
        <Btn onClick={onResetBoard} title="Reset Board" variant="ghost" size="icon" className="min-h-11 min-w-11 sm:min-h-0 sm:min-w-0 sm:px-2">
          <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline text-xs">Reset</span>
        </Btn>
      )}
      <Btn onClick={onOpenHistory} variant="ghost" size="icon" className="font-mono min-h-11 min-w-11 sm:min-h-0 sm:min-w-0 sm:px-2" title="Open Move Log">
        <History className="w-3.5 h-3.5 text-amber-400 shrink-0 hidden sm:block" />
        <span className="font-semibold text-slate-200 text-xs">#{moveCount}</span>
        {lastMoveRecord && (
          <span className="hidden md:inline text-xs text-slate-300">
            {lastMoveRecord.notation}
          </span>
        )}
      </Btn>
    </div>
  );

  return (
    <div className="w-full mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
      <div className="flex items-center justify-center sm:contents">
        <div className="sm:order-2 flex items-center justify-center gap-1.5 min-w-0">
          {turnPill}
          {isEscapeThreat && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-400 text-slate-950 font-semibold text-xs shrink-0">
              <Crown className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">King can escape</span>
              <span className="sm:hidden">Escape</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 sm:contents">
        <div className="sm:order-1 flex items-center gap-2 min-w-0">
          {identity}
          {counts && <div className="hidden sm:flex items-center gap-3">{counts}</div>}
        </div>
        {counts && <div className="flex sm:hidden items-center gap-2.5">{counts}</div>}
        <div className="sm:order-3">{actions}</div>
      </div>
    </div>
  );
};
