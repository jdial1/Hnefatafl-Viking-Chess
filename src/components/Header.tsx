import React, { useEffect, useRef, useState } from 'react';
import { Crown, History, RotateCcw, BookOpen, Settings, Users, RefreshCw, Flask, GoogleG, Menu } from '../icons';
import { OnlineMatchState } from '../types';
import { Avatar, Btn, Chip } from './ui';

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
      {signedIn && (
        <Avatar src={photoURL} fallback={<GoogleG className="w-4 h-4 shrink-0" />} />
      )}
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

function OverflowMenu({
  items,
}: {
  items: { id: string; label: string; icon: React.ReactNode; onClick: () => void; hint?: React.ReactNode }[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointer);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative sm:hidden">
      <Btn
        onClick={() => setOpen((value) => !value)}
        variant="ghost"
        size="icon"
        aria-label="Menu"
        aria-expanded={open}
        aria-haspopup="menu"
        title="Menu"
        className="min-h-11 min-w-11"
      >
        <Menu className="w-5 h-5" />
      </Btn>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-1.5 z-50 w-52 rounded-xl border border-slate-800 bg-slate-900 py-1"
        >
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                item.onClick();
              }}
              className="w-full flex items-center gap-2.5 px-3 min-h-11 text-sm text-slate-200 hover:bg-slate-800"
            >
              {item.icon}
              <span className="flex-1 text-left">{item.label}</span>
              {item.hint}
            </button>
          ))}
        </div>
      )}
    </div>
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

  const metaButtons = (
    <div className={`items-center gap-0.5 sm:gap-1.5 ${isGame ? 'hidden sm:flex' : 'flex'}`}>
      <Btn id="btn-rules" onClick={onOpenRules} title="How to Play" variant="ghost" size="icon" className="sm:px-2">
        <BookOpen className="w-3.5 h-3.5" />
        <span className="hidden sm:inline text-xs">Rules</span>
      </Btn>
      <Btn id="btn-sandbox" onClick={onOpenSandbox} title="Sandbox Mode" variant="ghost" size="icon" className="sm:px-2 text-amber-400">
        <Flask className="w-3.5 h-3.5" />
        <span className="hidden sm:inline text-xs">Sandbox</span>
      </Btn>
      <Btn id="btn-settings" onClick={onOpenSettings} title="Settings" variant="ghost" size="icon" className="sm:px-2">
        <Settings className="w-3.5 h-3.5" />
        <span className="hidden sm:inline text-xs">Settings</span>
      </Btn>
    </div>
  );

  const menuItems: { id: string; label: string; icon: React.ReactNode; onClick: () => void; hint?: React.ReactNode }[] = [
    ...(onGoHome
      ? [{ id: 'home', label: 'Home', icon: <Crown className="w-4 h-4 text-amber-400" />, onClick: onGoHome }]
      : []),
    ...(onOpenPlayers
      ? [{
          id: 'players',
          label: 'Players',
          icon: <Users className="w-4 h-4 text-emerald-400" />,
          onClick: onOpenPlayers,
          hint: <span className="font-mono text-slate-400">{onlineCount}</span>,
        }]
      : []),
    { id: 'rules', label: 'Rules', icon: <BookOpen className="w-4 h-4 text-amber-400" />, onClick: onOpenRules },
    { id: 'sandbox', label: 'Sandbox', icon: <Flask className="w-4 h-4 text-amber-400" />, onClick: onOpenSandbox },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4 text-amber-400" />, onClick: onOpenSettings },
  ];

  return (
    <header className="w-full flex flex-col gap-1.5">
      <div className={`items-center justify-between w-full gap-2 ${isGame ? 'hidden sm:flex' : 'flex'}`}>
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={onGoHome}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity text-left min-w-0"
            title="Return to Homepage"
          >
            <Crown className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400 shrink-0" />
            <h1 className="text-base sm:text-lg font-semibold text-slate-100 font-celtic leading-tight truncate">
              Hnefatæfl
            </h1>
          </button>

          {isGame && onGoHome && (
            <Btn onClick={onGoHome} variant="ghost" size="sm" title="Return to Home & Lobby">
              Home
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

      <div className="flex items-center justify-between w-full gap-1">
        <div className="flex items-center gap-0.5 sm:gap-1.5 flex-1 min-w-0">
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
              <Btn
                id="btn-undo"
                onClick={onUndo}
                disabled={!canUndo}
                title="Undo Last Move"
                variant="ghost"
                size="icon"
                className="min-h-11 min-w-11 sm:min-h-0 sm:min-w-0 sm:px-2"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-xs">Undo</span>
              </Btn>
              <Btn
                id="btn-history"
                onClick={onToggleMoveHistory}
                title="Move Log"
                variant={showMoveHistory ? 'amber' : 'ghost'}
                size="icon"
                className="min-h-11 min-w-11 sm:min-h-0 sm:min-w-0 sm:px-2"
              >
                <History className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-xs">Log</span>
              </Btn>
            </>
          )}
        </div>

        {metaButtons}

        {isGame && <OverflowMenu items={menuItems} />}
      </div>
    </header>
  );
};
