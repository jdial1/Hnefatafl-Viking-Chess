import { Volume2, VolumeX, Eye, Info, Settings, Swords, Trophy, Keyboard, RotateCcw, LogOut, ChevronDown } from '../icons';
import React, { useEffect, useState } from 'react';
import { GameSettings, GameStats } from '../types';
import { ROLE_META } from '../utils/roles';
import { Modal, ModalBody } from './Modal';
import { ModalHeader } from './ModalHeader';
import { Avatar, Btn, Kbd, MetricRow, SectionTitle, Toggle } from './ui';

interface SettingsModalProps {
  isOpen: boolean;
  settings: GameSettings;
  stats?: GameStats;
  isSignedIn?: boolean;
  account?: { name: string; email: string | null; photoURL: string | null } | null;
  username?: string;
  onUpdateSettings: (newSettings: Partial<GameSettings>) => void;
  onResetStats?: () => void;
  onSignOut?: () => void;
  onClose: () => void;
}

const SHORTCUTS = [
  ['Arrow Keys', 'Navigate Grid'],
  ['Enter/Space', 'Select / Move'],
  ['Esc', 'Deselect / Close'],
  ['U', 'Undo Move'],
  ['M', 'Toggle Sound'],
  ['R', 'Open Rules'],
  ['H', 'Move Log'],
];

function SettingRow({
  icon,
  title,
  hint,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-slate-800">
      <div className="flex items-center gap-2.5 min-w-0">
        {icon}
        <div className="min-w-0">
          <div className="font-semibold text-slate-200 truncate">{title}</div>
          <div className="text-xs text-slate-300 truncate">{hint}</div>
        </div>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  settings,
  stats,
  onUpdateSettings,
  onResetStats,
  isSignedIn,
  account,
  username,
  onSignOut,
  onClose,
}) => {
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) setShortcutsOpen(false);
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} ariaLabel="Settings and records" maxWidth="md">
      <ModalHeader
        title="Settings & Records"
        subtitle="Preferences, statistics, and controls"
        icon={<Settings className="w-5 h-5 text-amber-300" />}
        onClose={onClose}
        closeAriaLabel="Close settings modal"
      />

      <ModalBody className="space-y-5 text-sm">
        {stats && (
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <SectionTitle as="h3" icon={Trophy}>Battle records</SectionTitle>
              {onResetStats && stats.totalGames > 0 && (
                <Btn
                  onClick={onResetStats}
                  variant="danger"
                  size="sm"
                  title="Reset Statistics"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset
                </Btn>
              )}
            </div>

            <MetricRow
              className="border-y border-slate-800"
              items={[
                { label: 'Total games', value: stats.totalGames },
                {
                  label: 'Defender wins',
                  value: stats.defendersWins,
                  valueClassName: ROLE_META.defenders.mutedClass,
                },
                {
                  label: 'Attacker wins',
                  value: stats.attackersWins,
                  valueClassName: ROLE_META.attackers.mutedClass,
                },
                { label: 'Online wins', value: stats.onlineWins },
                { label: 'Online losses', value: stats.onlineLosses },
                { label: 'Online draws', value: stats.onlineDraws },
                {
                  label: 'Fastest victory',
                  value: stats.fastestWinMoves ? `${stats.fastestWinMoves} moves` : '—',
                  valueClassName: 'text-amber-300',
                },
                { label: 'Total moves', value: stats.totalMoves },
              ]}
            />
          </section>
        )}

        <SettingRow
          icon={settings.soundEnabled ? <Volume2 className="w-4 h-4 text-amber-400 shrink-0" /> : <VolumeX className="w-4 h-4 text-slate-500 shrink-0" />}
          title="Sound Effects"
          hint="Move and capture audio"
        >
          <Toggle
            label="Toggle sound effects"
            on={settings.soundEnabled}
            onToggle={() => onUpdateSettings({ soundEnabled: !settings.soundEnabled })}
          />
        </SettingRow>

        <SettingRow icon={<Eye className="w-4 h-4 text-amber-400 shrink-0" />} title="Move Highlights" hint="Highlight legal destination squares">
          <Toggle
            label="Toggle move highlights"
            on={settings.showValidMoves}
            onToggle={() => onUpdateSettings({ showValidMoves: !settings.showValidMoves })}
          />
        </SettingRow>

        <SettingRow
          icon={<Swords className="w-4 h-4 text-amber-400 shrink-0" />}
          title="Impact Feedback"
          hint="Board shake, capture pauses, and landing weight"
        >
          <Toggle
            label="Toggle impact feedback"
            on={settings.juiceEnabled}
            onToggle={() => onUpdateSettings({ juiceEnabled: !settings.juiceEnabled })}
          />
        </SettingRow>

        {isSignedIn && account && (
          <SettingRow
            icon={
              <Avatar
                src={account.photoURL}
                className="w-8 h-8 rounded-lg"
                fallback={
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-300 font-semibold flex items-center justify-center shrink-0">
                    {(username || account.name).trim().charAt(0).toUpperCase() || '?'}
                  </div>
                }
              />
            }
            title={username || account.name}
            hint={account.email || account.name}
          >
            {onSignOut && (
              <Btn onClick={onSignOut} variant="danger" size="sm">
                <LogOut className="w-3.5 h-3.5" />
                Sign out
              </Btn>
            )}
          </SettingRow>
        )}

        <section className="space-y-3 pt-1">
          <button
            type="button"
            onClick={() => setShortcutsOpen((open) => !open)}
            aria-expanded={shortcutsOpen}
            className="w-full flex items-center justify-between gap-2 text-left"
          >
            <SectionTitle as="h3" icon={Keyboard}>Keyboard shortcuts</SectionTitle>
            <ChevronDown className={`w-4 h-4 text-amber-300 shrink-0 transition-transform ${shortcutsOpen ? 'rotate-180' : ''}`} />
          </button>
          {shortcutsOpen && (
            <MetricRow
              className="border-y border-slate-800"
              items={SHORTCUTS.map(([key, action]) => ({
                label: action,
                value: <Kbd>{key}</Kbd>,
                valueClassName: 'text-sm font-normal',
              }))}
            />
          )}
        </section>

        <section className="text-sm text-slate-300 space-y-2 pt-4 border-t border-slate-800">
          <SectionTitle as="h3" icon={Info} className="text-slate-200">
            Asset credits and licensing
          </SectionTitle>
          <p className="leading-relaxed">
            Vector game icons designed via{' '}
            <a href="https://game-icons.net" target="_blank" rel="noreferrer" className="text-amber-400 underline font-medium hover:text-amber-300">
              Game-icons.net
            </a>{' '}
            under the CC-BY 3.0 License.
          </p>
        </section>
      </ModalBody>
    </Modal>
  );
};
