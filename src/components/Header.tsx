import React from 'react';
import { Crown, History, RotateCcw, BookOpen, Settings, Users, RefreshCw, Flask, GoogleG } from '../icons';
import { OnlineMatchState } from '../types';
import { Btn, Chip } from './ui';

interface HeaderProps {
  canUndo: boolean;
  showMoveHistory: boolean;
  onlineState: OnlineMatchState;
  onlineCount?: number;
  viewMode?: 'home' | 'game';
  onUndo: () => void;
  onToggleMoveHistory: () => void;
  onOpenRules: () => void;
  onOpenSandbox: () => void;
  onOpenSettings: () => void;
  onGoHome?: () => void;
  onRandomizeName?: () => void;
  onOpenPlayers?: () => void;
  photoURL?: string | null;
}

function UsernameChip({
  name,
  photoURL,
  signedIn,
  onRandomize,
  className = '',
}: {
  name: string;
  photoURL?: string | null;
  signedIn?: boolean;
  onRandomize?: () => void;
  className?: string;
}) {
  return (
    <Chip title={`Player Name: ${name}`} className={className}>
      {signedIn &&
        (photoURL ? (
          <img
            src={photoURL}
            alt=""
            referrerPolicy="no-referrer"
            className="w-5 h-5 rounded-md object-cover shrink-0"
          />
        ) : (
          <GoogleG className="w-4 h-4 shrink-0" />
        ))}
      <span className="text-amber-300 font-semibold truncate font-celtic">{name}</span>
      {onRandomize && (
        <Btn
          onClick={onRandomize}
          title="Randomize Norse Name"
          aria-label="Randomize Norse Name"
          variant="ghost"
          size="icon"
          className="p-1 rounded-lg border-transparent bg-transparent text-slate-400 hover:text-amber-400"
        >
          <RefreshCw className="w-3 h-3" />
        </Btn>
      )}
    </Chip>
  );
}

export const Header: React.FC<HeaderProps> = ({
  canUndo,
  showMoveHistory,
  onlineState,
  onlineCount = 0,
  viewMode = 'game',
  onUndo,
  onToggleMoveHistory,
  onOpenRules,
  onOpenSandbox,
  onOpenSettings,
  onGoHome,
  onRandomizeName,
  onOpenPlayers,
  photoURL,
}) => {
  const isGame = viewMode === 'game';
  const signedIn = onlineState.isSignedIn;

  return (
    <header className="w-full max-w-4xl mx-auto px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl flex flex-col gap-2">
      <div className={`items-center justify-between w-full gap-2 ${isGame ? 'hidden sm:flex' : 'flex'}`}>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onGoHome}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity text-left group"
            title="Return to Homepage"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
              <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-semibold text-slate-100 font-celtic leading-tight">
                Hnefatæfl
              </h1>
              <p className="text-xs text-amber-300 font-medium leading-tight">
                Viking Strategy
              </p>
            </div>
          </button>

          {isGame && onGoHome && (
            <Btn onClick={onGoHome} size="sm" title="Return to Home & Lobby" className="ml-1 font-mono font-bold">
              ← Home
            </Btn>
          )}
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {onlineState.username && (
            <UsernameChip
              name={onlineState.username}
              photoURL={photoURL}
              signedIn={signedIn}
              onRandomize={onRandomizeName}
              className="hidden sm:flex sm:px-2.5"
            />
          )}
          <button
            type="button"
            onClick={onOpenPlayers}
            title="Online Players Connected"
            aria-label="Online Players Connected"
            className="rounded-lg"
          >
            <Chip className="font-mono font-medium text-slate-200 shrink-0 sm:px-2.5 hover:border-slate-600">
              <Users className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{onlineCount}</span>
            </Chip>
          </button>
        </div>
      </div>

      <div
        className={`flex items-center justify-between w-full gap-1 ${
          isGame ? 'sm:pt-1.5 sm:border-t sm:border-slate-800/80' : 'pt-1.5 border-t border-slate-800/80'
        }`}
      >
        <div className="flex items-center gap-0.5 sm:gap-1.5 flex-1 min-w-0">
          {isGame && onGoHome && (
            <Btn
              onClick={onGoHome}
              title="Return to Home & Lobby"
              aria-label="Return to Home & Lobby"
              variant="ghost"
              size="icon"
              className="sm:hidden text-amber-400"
            >
              <Crown className="w-4 h-4" />
            </Btn>
          )}

          {onlineState.username && (
            <UsernameChip
              name={onlineState.username}
              photoURL={photoURL}
              signedIn={signedIn}
              onRandomize={onRandomizeName}
              className={isGame ? 'hidden' : 'sm:hidden flex-1 mr-1'}
            />
          )}

          {isGame && (
            <>
              <Btn id="btn-undo" onClick={onUndo} disabled={!canUndo} title="Undo Last Move" variant="ghost" size="icon" className="sm:px-2">
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-xs">Undo</span>
              </Btn>
              <Btn
                id="btn-history"
                onClick={onToggleMoveHistory}
                title="Move Log"
                variant={showMoveHistory ? 'amber' : 'ghost'}
                size="icon"
                className="sm:px-2"
              >
                <History className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-xs">Log</span>
              </Btn>
            </>
          )}
        </div>

        <div className="flex items-center gap-0.5 sm:gap-1.5">
          <Btn id="btn-rules" onClick={onOpenRules} title="How to Play" variant="ghost" size="icon" className="sm:px-2">
            <BookOpen className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-xs">Rules</span>
          </Btn>
          <Btn id="btn-sandbox" onClick={onOpenSandbox} title="Sandbox Mode" variant="amber" size="icon" className="sm:px-2">
            <Flask className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline text-xs">Sandbox</span>
          </Btn>
          <Btn id="btn-settings" onClick={onOpenSettings} title="Settings" variant="ghost" size="icon" className="sm:px-2">
            <Settings className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-xs">Settings</span>
          </Btn>
        </div>
      </div>
    </header>
  );
};
