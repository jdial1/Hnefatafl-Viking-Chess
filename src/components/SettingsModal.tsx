import { Volume2, VolumeX, Eye, Info, Settings, Trophy, Keyboard, RotateCcw } from "../icons";
import React from 'react';
import { GameSettings, GameStats } from '../types';
import { Modal } from './Modal';
import { ModalHeader } from './ModalHeader';

interface SettingsModalProps {
  isOpen: boolean;
  settings: GameSettings;
  stats?: GameStats;
  onUpdateSettings: (newSettings: Partial<GameSettings>) => void;
  onResetStats?: () => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  settings,
  stats,
  onUpdateSettings,
  onResetStats,
  onClose,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="md">
      <ModalHeader
        title="Settings & Records"
        subtitle="Preferences, Statistics & Controls"
        icon={Settings}
        onClose={onClose}
        closeAriaLabel="Close settings modal"
      />

      <div className="space-y-4 text-xs sm:text-sm">
        {/* Battle Records Summary */}
        {stats && (
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <div className="flex items-center gap-1.5 font-bold text-amber-400 font-mono uppercase tracking-wider text-xs">
                <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Viking Battle Records</span>
              </div>
              {onResetStats && stats.totalGames > 0 && (
                <button
                  onClick={onResetStats}
                  className="text-[10px] text-slate-500 hover:text-rose-400 flex items-center gap-1 font-mono transition-colors"
                  title="Reset Statistics"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2 text-center font-mono">
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800/80">
                <div className="text-slate-400 text-[10px]">TOTAL GAMES</div>
                <div className="text-slate-100 font-extrabold text-sm sm:text-base mt-0.5">{stats.totalGames}</div>
              </div>
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800/80">
                <div className="text-amber-400 text-[10px]">DEFENDER WINS</div>
                <div className="text-amber-300 font-extrabold text-sm sm:text-base mt-0.5">{stats.defendersWins}</div>
              </div>
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800/80">
                <div className="text-sky-400 text-[10px]">ATTACKER WINS</div>
                <div className="text-sky-300 font-extrabold text-sm sm:text-base mt-0.5">{stats.attackersWins}</div>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 px-1 pt-0.5">
              <span>Fastest Victory: <strong className="text-amber-300">{stats.fastestWinMoves ? `${stats.fastestWinMoves} moves` : 'N/A'}</strong></span>
              <span>Total Moves: <strong className="text-slate-200">{stats.totalMoves}</strong></span>
            </div>
          </div>
        )}

        {/* Sound Toggle */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
          <div className="flex items-center gap-2.5">
            {settings.soundEnabled ? (
              <Volume2 className="w-4 h-4 text-amber-400 shrink-0" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-500 shrink-0" />
            )}
            <div>
              <div className="font-semibold text-slate-200">Sound Effects</div>
              <div className="text-xs text-slate-400">Move and capture audio</div>
            </div>
          </div>
          <button
            onClick={() => onUpdateSettings({ soundEnabled: !settings.soundEnabled })}
            className={`w-10 h-5.5 rounded-full p-0.5 transition-colors shrink-0 ${
              settings.soundEnabled ? 'bg-amber-500' : 'bg-slate-800'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-slate-950 transition-transform ${
                settings.soundEnabled ? 'translate-x-4.5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Valid Moves Helper Toggle */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
          <div className="flex items-center gap-2.5">
            <Eye className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <div className="font-semibold text-slate-200">Move Highlights</div>
              <div className="text-xs text-slate-400">Highlight legal destination squares</div>
            </div>
          </div>
          <button
            onClick={() => onUpdateSettings({ showValidMoves: !settings.showValidMoves })}
            className={`w-10 h-5.5 rounded-full p-0.5 transition-colors shrink-0 ${
              settings.showValidMoves ? 'bg-amber-500' : 'bg-slate-800'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-slate-950 transition-transform ${
                settings.showValidMoves ? 'translate-x-4.5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Keyboard Navigation Shortcuts Guide */}
        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 font-bold text-amber-400 font-mono text-xs">
            <Keyboard className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Keyboard Shortcuts</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono text-slate-300">
            <div className="flex items-center gap-1.5"><kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-amber-300 text-[10px]">Arrow Keys</kbd> Navigate Grid</div>
            <div className="flex items-center gap-1.5"><kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-amber-300 text-[10px]">Enter/Space</kbd> Select / Move</div>
            <div className="flex items-center gap-1.5"><kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-amber-300 text-[10px]">Esc</kbd> Deselect / Close</div>
            <div className="flex items-center gap-1.5"><kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-amber-300 text-[10px]">U</kbd> Undo Move</div>
            <div className="flex items-center gap-1.5"><kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-amber-300 text-[10px]">M</kbd> Toggle Sound</div>
            <div className="flex items-center gap-1.5"><kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-amber-300 text-[10px]">R</kbd> Open Rules</div>
          </div>
        </div>

        {/* Asset Credits & Licensing */}
        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs text-slate-400 space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-slate-200">
            <Info className="w-3.5 h-3.5 text-amber-400" />
            <span>Asset Credits & Licensing</span>
          </div>
          <p className="leading-relaxed">
            Vector game icons designed via{' '}
            <a
              href="https://game-icons.net"
              target="_blank"
              rel="noreferrer"
              className="text-amber-400 underline font-medium hover:text-amber-300"
            >
              Game-icons.net
            </a>{' '}
            under the CC-BY 3.0 License.
          </p>
        </div>
      </div>
    </Modal>
  );
};

