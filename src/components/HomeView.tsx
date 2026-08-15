import React, { useEffect, useState } from 'react';
import { RefreshCw, Zap } from '../icons';
import { OnlineMatchState } from '../types';
import { PLAYER_ROLES, ROLE_META } from '../utils/roles';
import { Btn, RoleIcon } from './ui';

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

interface HomeViewProps {
  onlineState: OnlineMatchState;
  onJoinQueue: () => void;
  onLeaveQueue: () => void;
  onLeaveRoom: () => void;
  onEnterBoard: () => void;
  onSignIn: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onlineState,
  onJoinQueue,
  onLeaveQueue,
  onLeaveRoom,
  onEnterBoard,
  onSignIn,
}) => {
  const [flavorIndex, setFlavorIndex] = useState(0);

  useEffect(() => {
    if (onlineState.inQueue) setFlavorIndex(nextFlavor());
  }, [onlineState.inQueue]);

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-7 sm:gap-9 px-4 py-3 sm:py-6">
      <section
        className={`relative bg-slate-900 border border-slate-800 rounded-xl p-5 py-7 sm:p-7 flex flex-col gap-7 celtic-knot-border ${
          onlineState.inQueue ? 'celtic-knot-active' : ''
        }`}
      >
        <div className="max-w-3xl space-y-4 text-sm sm:text-base text-slate-200 leading-7 z-10">
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 pt-5 border-t border-slate-800 z-10">
          {PLAYER_ROLES.map((role) => {
            const meta = ROLE_META[role];
            return (
              <div key={role} className="flex items-start gap-3 min-w-0">
                <RoleIcon role={role} className={`w-5 h-5 ${meta.colorClass} shrink-0 mt-0.5`} />
                <div className="min-w-0">
                  <span className="font-semibold text-slate-100 block">
                    {meta.plural} ({meta.force})
                  </span>
                  <span className="text-slate-300 text-sm block">{meta.goal}</span>
                </div>
              </div>
            );
          })}
        </div>

        {!onlineState.isSignedIn ? (
          <div className="pt-1 z-10 flex flex-col gap-3">
            <Btn onClick={onSignIn} variant="primary" className="w-full min-h-14 text-sm sm:text-base font-bold">
              Sign in with Google
            </Btn>
            <p className="text-sm text-slate-400 text-center">Sign in to play an online match. Sandbox stays open without an account.</p>
          </div>
        ) : (
          <div className="pt-1 z-10 flex flex-col gap-3">
            {onlineState.roomId ? (
              <div className="flex flex-col sm:flex-row gap-2">
                <Btn onClick={onLeaveRoom} variant="ghost" className="w-full min-h-14 hover:bg-rose-950 hover:text-rose-300">
                  Leave match
                </Btn>
                <Btn onClick={onEnterBoard} variant="success" className="w-full min-h-14 text-sm sm:text-base font-bold">
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
              <Btn onClick={onJoinQueue} variant="primary" className="w-full min-h-14 text-sm sm:text-base font-bold">
                <Zap className="w-5 h-5 fill-current" />
                Play Online Match
              </Btn>
            )}
          </div>
        )}
      </section>
    </div>
  );
};
