import React, { memo } from 'react';
import { PieceType, PlayerRole } from '../types';
import { ROLE_META } from '../utils/roles';

interface PieceProps {
  type: PieceType;
  role: PlayerRole;
  isSelected?: boolean;
  isGhost?: boolean;
  isCapturing?: boolean;
  isAlert?: boolean;
  isTurnPulse?: boolean;
  size?: number;
}

const ACCENT = '#f59e0b';
const ATTACKER_CLIP = 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)';

function PieceShell({
  isSelected,
  isGhost,
  isCapturing,
  isAlert,
  isTurnPulse,
  pulseClass,
  clipPath,
  children,
}: {
  isSelected: boolean;
  isGhost: boolean;
  isCapturing: boolean;
  isAlert: boolean;
  isTurnPulse: boolean;
  pulseClass: string;
  clipPath?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`relative flex items-center justify-center w-full h-full cursor-pointer select-none transition-[transform,opacity,filter] duration-200 ${
        isSelected && !isCapturing ? 'scale-105' : 'scale-100'
      } ${
        /* Transform and fade of a dying piece are owned by the motion wrapper in Board. */
        isCapturing ? 'pointer-events-none brightness-150 saturate-50' : ''
      } ${isGhost ? 'opacity-45 scale-90 grayscale-[0.25] pointer-events-none' : ''}`}
    >
      {isGhost && (
        <div
          className={`absolute inset-0 border border-dashed border-amber-300/70 pointer-events-none ${clipPath ? '' : 'rounded-full'}`}
          style={clipPath ? { clipPath } : undefined}
        />
      )}
      {isAlert && (
        <div
          className={`absolute -inset-1 bg-amber-400/30 animate-ping pointer-events-none ${clipPath ? '' : 'rounded-full'}`}
          style={clipPath ? { clipPath } : undefined}
        />
      )}
      {isTurnPulse && !isAlert && (
        <div
          className={`absolute -inset-1 turn-pulse pointer-events-none ${pulseClass} ${clipPath ? '' : 'rounded-full'}`}
          style={clipPath ? { clipPath } : undefined}
        />
      )}
      {children}
      {isSelected && (
        <div
          className={`absolute inset-0 border-2 border-amber-400 pointer-events-none ${clipPath ? '' : 'rounded-full'}`}
          style={{
            clipPath,
          }}
        />
      )}
    </div>
  );
}

export const PieceComponent: React.FC<PieceProps> = memo(({
  type,
  role,
  isSelected = false,
  isGhost = false,
  isCapturing = false,
  isAlert = false,
  isTurnPulse = false,
  size = 40,
}) => {
  const shell = {
    isSelected,
    isGhost,
    isCapturing,
    isAlert,
    isTurnPulse,
    pulseClass: ROLE_META[role].pulseClass,
  };

  if (type === 'king') {
    return (
      <PieceShell {...shell}>
        <svg width={size} height={size} viewBox="0 0 100 100" className="filter drop-shadow-sm">
          <circle cx="50" cy="50" r="44" fill="url(#kingGlow)" stroke={ACCENT} strokeWidth={isSelected ? '3.5' : '2'} />
          <polygon points="50,15 82,35 82,75 50,90 18,75 18,35" fill="#1e293b" stroke={ACCENT} strokeWidth="3.5" />
          <path d="M 32,68 L 32,45 L 43,56 L 50,38 L 57,56 L 68,45 L 68,68 Z" fill={ACCENT} stroke="#0f172a" strokeWidth="1.5" />
          <circle cx="50" cy="34" r="3.5" fill="#ffffff" />
          <circle cx="32" cy="42" r="2.5" fill="#ffffff" />
          <circle cx="68" cy="42" r="2.5" fill="#ffffff" />
          <rect x="36" y="68" width="28" height="6" rx="2" fill="#ffffff" opacity="0.9" />
          <defs>
            <radialGradient id="kingGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={ACCENT} stopOpacity="0.45" />
              <stop offset="100%" stopColor="#0f172a" stopOpacity="0.9" />
            </radialGradient>
          </defs>
        </svg>
      </PieceShell>
    );
  }

  if (role === 'defenders') {
    return (
      <PieceShell {...shell}>
        <svg width={size} height={size} viewBox="0 0 100 100" className="filter drop-shadow-sm">
          <circle cx="50" cy="50" r="42" fill="#f8fafc" stroke={isSelected ? ACCENT : '#cbd5e1'} strokeWidth={isSelected ? '4' : '2.5'} />
          <circle cx="50" cy="50" r="34" fill="#e2e8f0" />
          <circle cx="50" cy="50" r="26" fill="#334155" />
          <path d="M 50,28 L 50,72 M 28,50 L 72,50" stroke="#f8fafc" strokeWidth="3.5" strokeLinecap="round" />
          <circle cx="50" cy="50" r="7" fill={isSelected ? ACCENT : '#f8fafc'} />
        </svg>
      </PieceShell>
    );
  }

  return (
    <PieceShell {...shell} clipPath={ATTACKER_CLIP}>
      <svg width={size} height={size} viewBox="0 0 100 100" className="filter drop-shadow-sm">
        <polygon points="50,8 86,28 86,72 50,92 14,72 14,28" fill="#0f172a" stroke={isSelected ? ACCENT : '#334155'} strokeWidth={isSelected ? '4' : '2.5'} />
        <polygon points="50,18 76,34 76,66 50,82 24,66 24,34" fill="#1e293b" />
        <path d="M 33,33 L 67,67 M 67,33 L 33,67" stroke={isSelected ? ACCENT : '#94a3b8'} strokeWidth="3.5" strokeLinecap="round" />
        <polygon points="50,40 58,50 50,60 42,50" fill={isSelected ? ACCENT : '#e2e8f0'} />
      </svg>
    </PieceShell>
  );
});

PieceComponent.displayName = 'PieceComponent';
