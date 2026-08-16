import React from 'react';
import { Crown, History, Flask, RefreshCw } from '../icons';
import { Move, PieceCounts, PlayerRole } from '../types';
import { ROLE_META } from '../utils/roles';
import { Btn, Chip, ForceCounts, RoleIcon } from './ui';

export function TurnPill({
  currentTurn,
  playerRole,
  isSandboxMode,
}: {
  currentTurn: PlayerRole;
  playerRole: PlayerRole | null;
  isSandboxMode?: boolean;
}) {
  if (!playerRole && !isSandboxMode) return null;

  const isMyTurn = isSandboxMode || currentTurn === playerRole;
  const turnMeta = ROLE_META[currentTurn];
  const turnLabel = isSandboxMode
    ? `${turnMeta.plural} to move`
    : isMyTurn
      ? 'Your turn'
      : 'Waiting';

  return (
    <div
      className={`flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-lg text-sm font-semibold min-w-0 ${
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
}

function EscapeChip({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-400 text-slate-950 font-semibold text-xs shrink-0 ${className}`}>
      <Crown className="w-3.5 h-3.5 shrink-0" />
      <span className="hidden sm:inline">King can escape</span>
      <span className="sm:hidden">Escape</span>
    </div>
  );
}

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

  const myRole = playerRole ? ROLE_META[playerRole] : null;

  const identity = isSandboxMode ? (
    <Chip title="Sandbox mode" className="text-amber-300 font-semibold">
      <Flask className="w-3.5 h-3.5 text-amber-400 shrink-0" />
      <span>Sandbox</span>
    </Chip>
  ) : myRole && playerRole ? (
    <Chip title={`You are ${myRole.plural}`} className={`font-semibold ${myRole.bgClass}`}>
      <RoleIcon role={playerRole} className="w-3.5 h-3.5 shrink-0" />
      <span>You</span>
    </Chip>
  ) : (
    <Chip className="text-slate-300">
      <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
      <span>Local</span>
    </Chip>
  );

  const turnPill = (
    <TurnPill currentTurn={currentTurn} playerRole={playerRole} isSandboxMode={isSandboxMode} />
  );

  const counts = pieceCounts ? (
    <ForceCounts pieceCounts={pieceCounts} capClassName="hidden sm:inline font-mono text-xs text-slate-400" />
  ) : null;

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
    <div className="w-full mb-3 flex items-center justify-between gap-2 sm:gap-3">
      <div className="flex items-center gap-2 min-w-0">
        {identity}
        {counts && <div className="hidden sm:flex items-center gap-3">{counts}</div>}
      </div>
      <div className="hidden sm:flex items-center justify-center gap-1.5 min-w-0">
        {turnPill}
        {isEscapeThreat && <EscapeChip />}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {counts && <div className="flex sm:hidden items-center gap-2.5">{counts}</div>}
        {isEscapeThreat && <EscapeChip className="sm:hidden" />}
        {actions}
      </div>
    </div>
  );
};
