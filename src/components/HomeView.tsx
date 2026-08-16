import React, { useEffect, useMemo, useState } from 'react';
import { LogOut, RefreshCw, Zap } from '../icons';
import { GameStatus, OnlineMatchState, PieceCounts, PlayerRole } from '../types';
import { BOARD_SIZE, createInitialBoard } from '../utils/hnefataflEngine';
import { SquareMarks } from './Board';
import { PieceComponent } from './Piece';
import { Btn, ForceCounts, GoogleSignInButton, Metric, Panel, RoleSummary, celticKnotClass } from './ui';

const SEARCH_FLAVOR = [
  'Watching the shoreline for sails',
  'Horns are quiet. The next shield-wall has not formed',
  'Ravens circle, waiting for a worthy foe',
  'The mead-hall is empty. A rival is still on the road',
  'The pieces are set. Listening for footsteps',
  'Fog on the fjord. No enemy banners yet',
  'The king sits the throne. His hunters have not arrived',
  'The wait is sharpened into a weapon',
  'Snow on the board. A challenger is still crossing it',
  'The watch-fire burns. No sails on the dark water',
  'A contest is called. The wind has not answered',
  'Spears are stacked. The other host is still gathering',
];

let lastFlavor = -1;

function formatPlayedDuration(startedAt: number, endedAt: number | null, now: number): string {
  if (!startedAt) return '0h 0m';
  const elapsed = Math.max(0, (endedAt ?? now) - startedAt);
  const totalMin = Math.floor(elapsed / 60000);
  const hours = Math.floor(totalMin / 60);
  const minutes = totalMin % 60;
  return `${hours}h ${minutes}m`;
}

function nextFlavor(): number {
  let index = Math.floor(Math.random() * SEARCH_FLAVOR.length);
  if (SEARCH_FLAVOR.length > 1 && index === lastFlavor) {
    index = (index + 1) % SEARCH_FLAVOR.length;
  }
  lastFlavor = index;
  return index;
}

function HomeBoardPreview() {
  const board = useMemo(() => createInitialBoard(), []);

  return (
    <div className="hidden lg:flex w-full min-w-0 items-center justify-center" aria-hidden>
      <div className={celticKnotClass(false, 'w-full max-w-[min(100%,70vh)] pointer-events-none select-none')}>
        <div className="w-full aspect-square rounded-xl bg-slate-900 border border-slate-800 p-2">
          <div className="grid grid-cols-11 grid-rows-11 gap-0.5 sm:gap-1 w-full h-full rounded-lg bg-slate-950 border border-slate-800 p-1">
            {Array.from({ length: BOARD_SIZE }, (_, r) =>
              Array.from({ length: BOARD_SIZE }, (_, c) => {
                const piece = board[r][c];
                return (
                  <div
                    key={`${r}-${c}`}
                    className="relative flex items-center justify-center rounded-md sm:rounded-lg bg-slate-900/40"
                  >
                    <SquareMarks r={r} c={c} occupied={Boolean(piece)} />
                    {piece && (
                      <div className="w-full h-full p-0.5 sm:p-1 z-20 relative">
                        <PieceComponent type={piece.type} role={piece.role} />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface HomeViewProps {
  onlineState: OnlineMatchState;
  currentTurn: PlayerRole;
  gameStatus: GameStatus;
  moveCount: number;
  pieceCounts: PieceCounts;
  matchStartedAt: number;
  matchEndedAt: number | null;
  onJoinQueue: () => void;
  onLeaveQueue: () => void;
  onResign: () => void;
  onEnterBoard: () => void;
  onPlayAsGuest: () => void;
  onSignIn: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onlineState,
  currentTurn,
  gameStatus,
  moveCount,
  pieceCounts,
  matchStartedAt,
  matchEndedAt,
  onJoinQueue,
  onLeaveQueue,
  onResign,
  onEnterBoard,
  onPlayAsGuest,
  onSignIn,
}) => {
  const [flavorIndex, setFlavorIndex] = useState(0);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (onlineState.inQueue) setFlavorIndex(nextFlavor());
  }, [onlineState.inQueue]);

  useEffect(() => {
    if (!onlineState.roomId || !matchStartedAt || matchEndedAt) return;
    const id = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(id);
  }, [onlineState.roomId, matchStartedAt, matchEndedAt]);

  return (
    <div className="w-full min-w-0 grid grid-cols-1 lg:grid-cols-2 gap-8 xl:gap-12 items-center">
      <Panel
        knot
        knotActive={onlineState.inQueue}
        className="px-6 pt-10 pb-8 sm:px-8 sm:pt-12 sm:pb-10 flex flex-col gap-8 w-full min-w-0"
      >
        <div className="max-w-prose space-y-4 text-base text-slate-200 leading-relaxed z-10">
          <h2 className="text-xl sm:text-2xl text-slate-100 font-semibold leading-tight">
            How Hnefatæfl <span className="font-normal text-slate-400">(nef-ah-tah-fel)</span> is played
          </h2>
          <p>
            Viking Chess is a Norse strategy game played on an 11x11 grid. Two unequal forces pursue different paths to victory.
          </p>
          <RoleSummary field="goal" className="space-y-3" />
        </div>

        <div className="pt-1 z-10 flex flex-col gap-3 w-full min-w-0">
          {onlineState.roomId ? (
            <div className="flex flex-col gap-3 w-full min-w-0 pt-5 border-t border-slate-800">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <p className="text-slate-100 font-semibold">
                    {onlineState.opponentName ? `Match vs ${onlineState.opponentName}` : 'Online match'}
                  </p>
                  <p className="text-sm text-slate-400">
                    {gameStatus !== 'playing'
                      ? 'This match has ended.'
                      : onlineState.role && onlineState.role === currentTurn
                        ? 'Your turn'
                        : `Waiting for ${onlineState.opponentName || 'your opponent'}`}
                  </p>
                </div>
                <Btn
                  onClick={onResign}
                  variant="danger"
                  size="icon"
                  title="Resign"
                  aria-label="Resign"
                  className="min-h-11 min-w-11"
                >
                  <LogOut className="w-5 h-5" />
                </Btn>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                <Metric label="Moves" value={moveCount} />
                <Metric label="Played" value={formatPlayedDuration(matchStartedAt, matchEndedAt, now)} />
                <ForceCounts pieceCounts={pieceCounts} />
              </div>
              <Btn onClick={onEnterBoard} variant="success" size="lg" className="w-full font-bold">
                {gameStatus !== 'playing'
                  ? 'Review board'
                  : onlineState.role === currentTurn
                    ? 'Take your turn'
                    : 'Return to board'}
              </Btn>
            </div>
          ) : onlineState.inQueue ? (
            <Btn
              onClick={onLeaveQueue}
              variant="amber"
              size="lg"
              className="w-full font-bold flex-col gap-0.5 group hover:bg-rose-950/30 hover:text-rose-300"
            >
              <span className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin shrink-0" />
                {SEARCH_FLAVOR[flavorIndex]}
              </span>
              <span className="text-xs text-amber-200/70 group-hover:text-rose-200/70 font-medium leading-none">
                Tap to cancel
              </span>
            </Btn>
          ) : (
            <>
              {onlineState.isConnected ? (
                <Btn onClick={onJoinQueue} variant="primary" size="lg" className="w-full">
                  <Zap className="w-5 h-5 fill-current" />
                  Play Online Match
                </Btn>
              ) : (
                <Btn onClick={onPlayAsGuest} variant="primary" size="lg" className="w-full">
                  Play as Guest
                </Btn>
              )}
              {!onlineState.isSignedIn && (
                <GoogleSignInButton onClick={onSignIn} className="w-full" />
              )}
            </>
          )}
        </div>
      </Panel>

      <HomeBoardPreview />
    </div>
  );
};
