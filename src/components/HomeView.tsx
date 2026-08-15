import React, { useEffect, useState } from 'react';
import { RefreshCw, Zap } from '../icons';
import { OnlineMatchState } from '../types';
import { ROLE_META } from '../utils/roles';
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
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-7 sm:gap-9 px-4 py-3 sm:py-6">
      <section
        className={celticKnotClass(
          onlineState.inQueue,
          'bg-slate-900 border border-slate-800 rounded-xl p-5 py-7 sm:p-7 flex flex-col gap-7'
        )}
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

        <RoleSummary field="goal" className="grid grid-cols-2 gap-3 sm:gap-6 pt-5 border-t border-slate-800 z-10" />

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
          ) : onlineState.isConnected ? (
            <div className={onlineState.isSignedIn ? '' : 'grid grid-cols-5 gap-2'}>
              <Btn
                onClick={onJoinQueue}
                variant="primary"
                className={`min-h-14 text-sm sm:text-base font-bold ${onlineState.isSignedIn ? 'w-full' : 'col-span-4 w-full'}`}
              >
                <Zap className="w-5 h-5 fill-current" />
                Play Online Match
              </Btn>
              {!onlineState.isSignedIn && (
                <GoogleSignInButton onClick={onSignIn} iconOnly className="col-span-1 w-full min-h-14" />
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <Btn onClick={onPlayAsGuest} variant="primary" className="w-full min-h-14 text-sm sm:text-base font-bold">
                Play as Guest
              </Btn>
              <GoogleSignInButton onClick={onSignIn} className="w-full min-h-14" />
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
