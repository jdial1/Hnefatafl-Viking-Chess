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

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-0 mb-1">
      <div
        className={`w-full rounded-xl bg-slate-900 border overflow-hidden ${
          isSandboxMode || isMyTurn ? 'border-slate-700' : 'border-slate-800'
        }`}
      >
        <div className="px-2 sm:px-3 py-1.5 sm:py-2 flex items-center justify-between gap-1.5 sm:gap-2">
          <div className="flex items-center gap-1.5 shrink-0">
            {isSandboxMode ? (
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
            )}
          </div>

          <div className="flex items-center justify-center flex-1 truncate px-1 gap-1.5 sm:gap-2 min-w-0">
            <div
              className={`flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-sm font-bold ${
                isMyTurn ? turnMeta.turnClass : 'bg-slate-950 text-slate-300 border border-slate-800'
              }`}
            >
              <RoleIcon role={currentTurn} className="w-4 h-4 shrink-0" />
              <span className="truncate">
                {turnLabel}
                {!isSandboxMode && (
                  <span className="hidden sm:inline font-semibold">
                    {isMyTurn ? ` · ${turnMeta.plural}` : ` · ${turnMeta.plural} to move`}
                  </span>
                )}
              </span>
            </div>

            {isEscapeThreat && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-400 text-slate-950 font-semibold text-xs shrink-0">
                <Crown className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">King can escape</span>
                <span className="sm:hidden">Escape</span>
              </div>
            )}
          </div>

          {pieceCounts && (
            <div className="flex sm:hidden items-center gap-2 shrink-0 text-xs font-mono">
              {PLAYER_ROLES.map((role) => {
                const { meta, live, lost, cap } = forceStats(role, pieceCounts);
                return (
                  <div key={role} className={`flex items-center gap-0.5 ${meta.mutedClass}`} title={`${meta.plural} ${live}/${cap}`}>
                    <RoleIcon role={role} className={`w-3 h-3 ${meta.colorClass}`} />
                    <span className={`font-semibold ${meta.countClass}`}>{live}</span>
                    {role === 'defenders' && pieceCounts.hasKing && (
                      <Crown className="w-3 h-3 text-amber-300" />
                    )}
                    {lost > 0 && <span className="text-rose-300">-{lost}</span>}
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
            {isSandboxMode && onResetBoard && (
              <Btn onClick={onResetBoard} title="Reset Board" variant="ghost" size="icon" className="sm:px-2">
                <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline text-xs">Reset</span>
              </Btn>
            )}
            <Btn onClick={onOpenHistory} variant="ghost" size="icon" className="font-mono sm:px-2" title="Open Move Log">
              <History className="w-3.5 h-3.5 text-amber-400 shrink-0 hidden sm:block" />
              <span className="font-semibold text-slate-200 text-xs">#{moveCount}</span>
              {lastMoveRecord && (
                <span className="hidden md:inline text-xs text-slate-300">
                  {lastMoveRecord.notation}
                </span>
              )}
            </Btn>
          </div>
        </div>

        {pieceCounts && (
          <div className="hidden sm:flex px-3 py-2 border-t border-slate-800 items-center justify-between gap-x-4 text-xs font-mono">
            {PLAYER_ROLES.map((role) => {
              const { meta, live, lost, cap } = forceStats(role, pieceCounts);
              return (
                <div key={role} className={`flex items-center gap-1.5 ${meta.mutedClass}`}>
                  <RoleIcon role={role} className={`w-3 h-3 ${meta.colorClass}`} />
                  <span className="font-semibold">{meta.plural}</span>
                  <span className={meta.countClass}>{live}/{cap}</span>
                  {role === 'defenders' && pieceCounts.hasKing && (
                    <span className="text-amber-300 font-semibold">+ King</span>
                  )}
                  {lost > 0 && <span className="text-rose-300 ml-1">({lost} lost)</span>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
