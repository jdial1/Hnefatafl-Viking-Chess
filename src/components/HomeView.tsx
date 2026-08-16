import React, { useEffect, useMemo, useState } from 'react';
import { Crown, RefreshCw, Shield, Zap } from '../icons';
import { OnlineMatchState } from '../types';
import { BOARD_SIZE, createInitialBoard, isCorner, isThrone } from '../utils/hnefataflEngine';
import { ROLE_META } from '../utils/roles';
import { PieceComponent } from './Piece';
import { Btn, GoogleSignInButton, RoleSummary, celticKnotClass } from './ui';

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
                const corner = isCorner(r, c);
                const throne = isThrone(r, c);
                return (
                  <div
                    key={`${r}-${c}`}
                    className="relative flex items-center justify-center rounded-md sm:rounded-lg bg-slate-900/40"
                  >
                    {!corner && !throne && !piece && <div className="w-1 h-1 rounded-full bg-slate-700/40" />}
                    {corner && (
                      <div className="absolute inset-0 flex items-center justify-center bg-cyan-950/60 rounded-md sm:rounded-lg overflow-hidden">
                        <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400 opacity-80" />
                      </div>
                    )}
                    {throne && (
                      <div className="absolute inset-0 flex items-center justify-center bg-amber-950/50 rounded-md sm:rounded-lg overflow-hidden">
                        <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400/70" />
                      </div>
                    )}
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
  onJoinQueue: () => void;
  onLeaveQueue: () => void;
  onLeaveRoom: () => void;
  onEnterBoard: () => void;
  onPlayAsGuest: () => void;
  onSignIn: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onlineState,
  onJoinQueue,
  onLeaveQueue,
  onLeaveRoom,
  onEnterBoard,
  onPlayAsGuest,
  onSignIn,
}) => {
  const [flavorIndex, setFlavorIndex] = useState(0);

  useEffect(() => {
    if (onlineState.inQueue) setFlavorIndex(nextFlavor());
  }, [onlineState.inQueue]);

  return (
    <div className="w-full min-w-0 grid grid-cols-1 lg:grid-cols-2 gap-8 xl:gap-12 items-center">
      <section
        className={celticKnotClass(
          onlineState.inQueue,
          'bg-slate-900 border border-slate-800 rounded-xl px-6 pt-10 pb-8 sm:px-8 sm:pt-12 sm:pb-10 flex flex-col gap-8 w-full min-w-0'
        )}
      >
        <div className="max-w-prose space-y-4 text-base text-slate-200 leading-relaxed z-10">
          <h2 className="text-xl sm:text-2xl text-slate-100 font-semibold leading-tight">
            How Hnefatæfl <span className="font-normal text-slate-400">(nef-ah-tah-fel)</span> is played
          </h2>
          <p>
            Viking Chess is a Norse strategy game played on an 11x11 grid. Two unequal forces pursue different paths to victory.
          </p>
          <p>
            The <span className={`${ROLE_META.defenders.colorClass} font-semibold`}>12 Defenders</span> and their King start in the center. Their goal is to escort the King to safety by reaching any of the four corner refuge squares.
          </p>
          <p>
            The <span className={`${ROLE_META.attackers.colorClass} font-semibold`}>24 Attackers</span> surround the defenders from the edges. Their objective is to capture the King by completely surrounding him on all four sides.
          </p>
        </div>

        <RoleSummary field="goal" className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-8 pt-6 border-t border-slate-800 z-10" />

        <div className="pt-1 z-10 flex flex-col gap-3 w-full min-w-0">
          {onlineState.roomId ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full min-w-0">
              <Btn onClick={onLeaveRoom} variant="ghost" className="w-full min-w-0 min-h-14 hover:bg-rose-950 hover:text-rose-300">
                Leave match
              </Btn>
              <Btn onClick={onEnterBoard} variant="success" className="w-full min-w-0 min-h-14 text-sm sm:text-base font-bold">
                Return to board
              </Btn>
            </div>
          ) : onlineState.inQueue ? (
            <Btn
              onClick={onLeaveQueue}
              variant="amber"
              className="w-full min-h-14 text-sm sm:text-base font-bold flex-col gap-0.5 group hover:bg-rose-950/30 hover:text-rose-300"
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
                <Btn
                  onClick={onJoinQueue}
                  variant="primary"
                  className="w-full min-h-14 text-sm sm:text-base font-bold"
                >
                  <Zap className="w-5 h-5 fill-current" />
                  Play Online Match
                </Btn>
              ) : (
                <Btn onClick={onPlayAsGuest} variant="primary" className="w-full min-h-14 text-sm sm:text-base font-bold">
                  Play as Guest
                </Btn>
              )}
              {!onlineState.isSignedIn && (
                <GoogleSignInButton onClick={onSignIn} className="w-full" />
              )}
            </>
          )}
        </div>
      </section>

      <HomeBoardPreview />
    </div>
  );
};
