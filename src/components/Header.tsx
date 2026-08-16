import React, { useEffect, useRef, useState } from 'react';
import { Crown, BookOpen, Settings, Users, RefreshCw, Flask, Menu, House } from '../icons';
import { OnlineMatchState } from '../types';
import { Avatar, Btn, Chip } from './ui';

interface HeaderProps {
  onlineState: OnlineMatchState;
  onlineCount?: number;
  mobileCenter?: React.ReactNode;
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
      {signedIn && <Avatar src={photoURL} signedIn />}
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
  onlineState,
  onlineCount = 0,
  mobileCenter,
  onOpenRules,
  onOpenSandbox,
  onOpenSettings,
  onGoHome,
  onRandomizeName,
  onOpenPlayers,
  photoURL,
}) => {
  const signedIn = onlineState.isSignedIn;

  const routes = (
    <nav className="hidden sm:flex items-center gap-0.5 sm:gap-1.5 shrink-0">
      {onGoHome && (
        <Btn id="btn-home" onClick={onGoHome} title="Return to Home & Lobby" variant="ghost" size="icon" className="sm:px-2">
          <House className="w-3.5 h-3.5" />
          <span className="hidden sm:inline text-xs">Home</span>
        </Btn>
      )}
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
    </nav>
  );

  const menuItems: { id: string; label: string; icon: React.ReactNode; onClick: () => void; hint?: React.ReactNode }[] = [
    ...(onGoHome
      ? [{ id: 'home', label: 'Home', icon: <House className="w-4 h-4 text-amber-400" />, onClick: onGoHome }]
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
      <div className="flex items-center w-full gap-2">
        <div className="flex-1 flex items-center min-w-0">
          <button
            type="button"
            onClick={onGoHome}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity text-left min-w-0"
            title="Return to Homepage"
          >
            <Crown className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400 shrink-0" />
            <h1 className={`text-base sm:text-lg font-semibold text-slate-100 font-celtic leading-tight truncate ${mobileCenter ? 'hidden sm:block' : ''}`}>
              Hnefatæfl
            </h1>
          </button>
        </div>

        {mobileCenter && (
          <div className="sm:hidden min-w-0 max-w-[min(100%,16rem)] flex justify-center">
            {mobileCenter}
          </div>
        )}

        {routes}

        <div className="flex-1 flex items-center justify-end gap-1.5 sm:gap-2 min-w-0">
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
          <OverflowMenu items={menuItems} />
        </div>
      </div>

      {onlineState.username && (
        <UsernameChip
          name={onlineState.username}
          photoURL={photoURL}
          signedIn={signedIn}
          onRandomize={onRandomizeName}
          className="sm:hidden"
        />
      )}
    </header>
  );
};
