import { Volume2, VolumeX, Eye, Info, Settings, Swords, Trophy, Keyboard, RotateCcw, LogOut, ChevronDown } from '../icons';
import React, { useEffect, useState } from 'react';
import { GameSettings, GameStats } from '../types';
import { ROLE_META } from '../utils/roles';
import { Modal } from './Modal';
import { ModalHeader } from './ModalHeader';
import { Btn, Kbd, Metric, SectionTitle, Toggle } from './ui';

interface SettingsModalProps {
  isOpen: boolean;
  settings: GameSettings;
  stats?: GameStats;
  isSignedIn?: boolean;
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
      <div className="flex items-center gap-2.5">
        {icon}
        <div>
          <div className="font-semibold text-slate-200">{title}</div>
          <div className="text-xs text-slate-400">{hint}</div>
        </div>
      </div>
      {children}
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

      <div className="space-y-5 text-sm">
        {stats && (
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <SectionTitle as="h3" icon={Trophy}>Battle records</SectionTitle>
              {onResetStats && stats.totalGames > 0 && (
                <button
                  type="button"
                  onClick={onResetStats}
                  className="text-xs text-slate-400 hover:text-rose-300 flex items-center gap-1 transition-colors"
                  title="Reset Statistics"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset
                </button>
              )}
            </div>

            <div className="grid grid-cols-3 divide-x divide-slate-800 border-y border-slate-800 py-3">
              {[
                { label: 'Total Games', value: stats.totalGames },
                {
                  label: 'Defender Wins',
                  value: stats.defendersWins,
                  valueClassName: ROLE_META.defenders.mutedClass,
                },
                {
                  label: 'Attacker Wins',
                  value: stats.attackersWins,
                  valueClassName: ROLE_META.attackers.mutedClass,
                },
              ].map((metric) => (
                <Metric
                  key={metric.label}
                  {...metric}
                  className="px-2 sm:px-3"
                />
              ))}
            </div>

            <div className="grid grid-cols-3 divide-x divide-slate-800 border-b border-slate-800 py-3">
              {[
                { label: 'Online Wins', value: stats.onlineWins },
                { label: 'Online Losses', value: stats.onlineLosses },
                { label: 'Online Draws', value: stats.onlineDraws },
              ].map((metric) => (
                <Metric key={metric.label} {...metric} className="px-2 sm:px-3" />
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-slate-300">
              <span>
                Fastest Victory:{' '}
                <strong className="text-amber-300">{stats.fastestWinMoves ? `${stats.fastestWinMoves} moves` : 'N/A'}</strong>
              </span>
              <span>
                Total Moves: <strong className="text-slate-200">{stats.totalMoves}</strong>
              </span>
            </div>
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

        {isSignedIn && onSignOut && (
          <SettingRow
            icon={<LogOut className="w-4 h-4 text-rose-300 shrink-0" />}
            title="Account"
            hint="Sign out of Google"
          >
            <Btn onClick={onSignOut} variant="ghost" size="sm" className="text-slate-400 hover:text-rose-300">
              Sign out
            </Btn>
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
            <table className="w-full text-sm font-mono text-slate-300">
              <tbody>
                {SHORTCUTS.map(([key, action]) => (
                  <tr key={key}>
                    <td className="py-1 pr-3 whitespace-nowrap">
                      <Kbd>{key}</Kbd>
                    </td>
                    <td>{action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
      </div>
    </Modal>
  );
};
