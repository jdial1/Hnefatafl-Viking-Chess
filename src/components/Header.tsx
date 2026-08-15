import { Crown, Eye, RotateCcw, BookOpen, Settings, Users, RefreshCw, Flask } from "../icons";
import React from 'react';
import { OnlineMatchState } from '../types';

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
}) => {

  return (
    <header className="w-full max-w-4xl mx-auto px-2 py-2 sm:p-3 bg-slate-900/95 border border-slate-800 rounded-xl sm:rounded-2xl flex flex-col gap-2 shadow-lg">
      {/* Row 1: Brand + Home Nav + Player Name + Online Count */}
      <div className="flex items-center justify-between w-full gap-2">
        {/* Brand & Home Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={onGoHome}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity text-left group"
            title="Return to Homepage"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0 group-hover:border-amber-400 transition-colors">
              <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-black tracking-wider text-slate-100 uppercase font-celtic leading-tight">
                Hnefatæfl
              </h1>
              <p className="text-xs text-amber-400 font-mono font-medium leading-none">
                Viking Strategy
              </p>
            </div>
          </button>

          {viewMode === 'game' && onGoHome && (
            <button
              onClick={onGoHome}
              title="Return to Home & Lobby"
              className="ml-1 px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-1 text-xs font-bold font-mono shrink-0"
            >
              <span>← Home</span>
            </button>
          )}
        </div>

        {/* Top Right Header Area: Player Name & Online Count */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Player Name with Small Randomize Button (Hidden on Mobile) */}
          {onlineState.username && (
            <div
              title={`Player Name: ${onlineState.username}`}
              className="hidden sm:flex items-center gap-1.5 bg-slate-950 px-2 sm:px-2.5 py-1 rounded-xl border border-slate-800 text-xs"
            >
              <span className="text-amber-400 font-bold max-w-[100px] sm:max-w-[160px] truncate font-celtic tracking-wider text-sm sm:text-base">
                {onlineState.username}
              </span>
              {onRandomizeName && (
                <button
                  type="button"
                  onClick={onRandomizeName}
                  title="Randomize Norse Name"
                  className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-amber-400 transition-colors shrink-0"
                >
                  <RefreshCw className="w-3 h-3" />
                </button>
              )}
            </div>
          )}

          {/* Online Players Connected */}
          <div
            title="Online Players Connected"
            className="flex items-center gap-1.5 bg-slate-950 px-2 sm:px-2.5 py-1 rounded-xl border border-slate-800 text-xs font-mono font-semibold text-slate-300 shrink-0"
          >
            <Users className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>{onlineCount} Online</span>
          </div>
        </div>
      </div>

      {/* Row 2: Action Controls Split across screen cleanly */}
      <div className="flex items-center justify-between w-full pt-1.5 border-t border-slate-800/80 gap-1 overflow-x-auto">
        {/* Left Action Controls */}
        <div className="flex items-center gap-1 sm:gap-1.5 flex-1 sm:flex-none min-w-0">
          {/* Player Name with Small Randomize Button (Visible on Mobile Only) */}
          {onlineState.username && (
            <div
              title={`Player Name: ${onlineState.username}`}
              className="sm:hidden flex flex-1 items-center justify-between gap-1 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800 text-xs mr-1 min-w-0"
            >
              <span className="text-amber-400 font-bold truncate font-celtic tracking-wider text-xs">
                {onlineState.username}
              </span>
              {onRandomizeName && (
                <button
                  type="button"
                  onClick={onRandomizeName}
                  title="Randomize Norse Name"
                  className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-amber-400 transition-colors shrink-0"
                >
                  <RefreshCw className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
          )}

          {/* Only show in game mode */}
          {viewMode === 'game' && (
            <>
              <button
                id="btn-undo"
                onClick={onUndo}
                disabled={!canUndo}
                title="Undo Last Move"
                className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors border border-slate-700/60 text-xs font-medium shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden xs:inline sm:inline">Undo</span>
              </button>

              <button
                id="btn-history"
                onClick={onToggleMoveHistory}
                title="Move Log"
                className={`flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl border transition-colors text-xs font-medium shrink-0 ${
                  showMoveHistory
                    ? 'bg-slate-800 text-amber-400 border-amber-500/40'
                    : 'bg-slate-800/90 text-slate-300 border-slate-700/60 hover:bg-slate-700'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span className="hidden xs:inline sm:inline">Log</span>
              </button>
            </>
          )}
        </div>

        {/* Right Utility Controls */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          <button
            id="btn-rules"
            onClick={onOpenRules}
            title="How to Play"
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700/60 text-xs font-medium flex items-center gap-1 shrink-0"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Rules</span>
          </button>

          <button
            id="btn-sandbox"
            onClick={onOpenSandbox}
            title="Sandbox Mode"
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 transition-colors border border-amber-500/30 text-xs font-medium flex items-center gap-1 shrink-0"
          >
            <Flask className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Sandbox</span>
          </button>

          <button
            id="btn-settings"
            onClick={onOpenSettings}
            title="Settings"
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700/60 text-xs font-medium flex items-center gap-1 shrink-0"
          >
            <Settings className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Settings</span>
          </button>
        </div>
      </div>
    </header>
  );
};
