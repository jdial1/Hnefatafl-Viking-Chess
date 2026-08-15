import React, { memo } from 'react';
import { PieceType, PlayerRole, AccentColor } from '../types';

interface PieceProps {
  type: PieceType;
  role: PlayerRole;
  isSelected?: boolean;
  isLastMoved?: boolean;
  isGhost?: boolean;
  accentColor?: AccentColor;
  isCapturing?: boolean;
  size?: number;
}

export const PieceComponent: React.FC<PieceProps> = memo(({
  type,
  role,
  isSelected = false,
  isGhost = false,
  accentColor = 'amber',
  isCapturing = false,
  size = 40,
}) => {
  // Accent colors mapping
  const accentHexMap: Record<AccentColor, { main: string; glow: string; border: string }> = {
    amber: { main: '#f59e0b', glow: 'rgba(245, 158, 11, 0.4)', border: '#d97706' },
    teal: { main: '#14b8a6', glow: 'rgba(20, 184, 166, 0.4)', border: '#0d9488' },
    emerald: { main: '#10b981', glow: 'rgba(16, 185, 129, 0.4)', border: '#059669' },
    ruby: { main: '#f43f5e', glow: 'rgba(244, 63, 94, 0.4)', border: '#e11d48' },
    nordic: { main: '#38bdf8', glow: 'rgba(56, 189, 248, 0.4)', border: '#0284c7' },
  };

  const accent = accentHexMap[accentColor] || accentHexMap.amber;

  if (type === 'king') {
    return (
      <div
        className={`relative flex items-center justify-center w-full h-full cursor-pointer select-none transition-[opacity,filter] duration-200 ${
          isCapturing ? 'scale-125 opacity-0' : isSelected ? 'scale-110' : 'scale-100'
        } ${isGhost ? 'opacity-45 scale-90 grayscale-[0.25] pointer-events-none' : ''}`}
      >
        {isGhost && (
          <div className="absolute inset-0 rounded-full border-2 border-dashed border-amber-400/80 animate-pulse pointer-events-none" />
        )}
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          className="filter transition-all duration-200 drop-shadow-lg"
        >
          {/* Base Crown Halo/Glow */}
          <circle
            cx="50"
            cy="50"
            r="44"
            fill="url(#kingGlow)"
            stroke={accent.main}
            strokeWidth={isSelected ? '3.5' : '2'}
            className="transition-all duration-300"
          />

          {/* Golden/Accent Crown Geometric Shield */}
          <polygon
            points="50,15 82,35 82,75 50,90 18,75 18,35"
            fill="#1e293b"
            stroke={accent.main}
            strokeWidth="3.5"
          />

          {/* Inner Crown Glyph */}
          <path
            d="M 32,68 L 32,45 L 43,56 L 50,38 L 57,56 L 68,45 L 68,68 Z"
            fill={accent.main}
            stroke="#0f172a"
            strokeWidth="1.5"
          />
          
          {/* King Jewels/Accents */}
          <circle cx="50" cy="34" r="3.5" fill="#ffffff" />
          <circle cx="32" cy="42" r="2.5" fill="#ffffff" />
          <circle cx="68" cy="42" r="2.5" fill="#ffffff" />

          {/* Base Emblem */}
          <rect x="36" y="68" width="28" height="6" rx="2" fill="#ffffff" opacity="0.9" />

          <defs>
            <radialGradient id="kingGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={accent.main} stopOpacity="0.45" />
              <stop offset="100%" stopColor="#0f172a" stopOpacity="0.9" />
            </radialGradient>
          </defs>
        </svg>

        {/* Selected Ring */}
        {isSelected && (
          <div
            className="absolute inset-0 rounded-full pointer-events-none animate-pulse"
            style={{
              boxShadow: `0 0 16px ${accent.glow}, inset 0 0 10px ${accent.glow}`,
              border: `2px solid ${accent.main}`,
            }}
          />
        )}
      </div>
    );
  }

  if (role === 'defenders') {
    return (
      <div
        className={`relative flex items-center justify-center w-full h-full cursor-pointer select-none transition-[opacity,filter] duration-200 ${
          isCapturing ? 'scale-125 opacity-0' : isSelected ? 'scale-110' : 'scale-100'
        } ${isGhost ? 'opacity-45 scale-90 grayscale-[0.25] pointer-events-none' : ''}`}
      >
        {isGhost && (
          <div className="absolute inset-0 rounded-full border-2 border-dashed border-amber-400/80 animate-pulse pointer-events-none" />
        )}
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          className="filter transition-all duration-200 drop-shadow-md"
        >
          {/* Smooth Round Defender Shield */}
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="#f8fafc"
            stroke={isSelected ? accent.main : '#cbd5e1'}
            strokeWidth={isSelected ? '4' : '2.5'}
          />
          <circle cx="50" cy="50" r="34" fill="#e2e8f0" />
          <circle cx="50" cy="50" r="26" fill="#334155" />

          {/* Defender Shield Boss Cross */}
          <path
            d="M 50,28 L 50,72 M 28,50 L 72,50"
            stroke="#f8fafc"
            strokeWidth="3.5"
            strokeLinecap="round"
          />

          {/* Central Boss Stud */}
          <circle cx="50" cy="50" r="7" fill={isSelected ? accent.main : '#f8fafc'} />
        </svg>

        {isSelected && (
          <div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              boxShadow: `0 0 12px ${accent.glow}`,
              border: `2px solid ${accent.main}`,
            }}
          />
        )}
      </div>
    );
  }

  // Attackers (Sharp Hexagonal / Angular Silhouette)
  return (
    <div
      className={`relative flex items-center justify-center w-full h-full cursor-pointer select-none transition-[opacity,filter] duration-200 ${
        isCapturing ? 'scale-125 opacity-0' : isSelected ? 'scale-110' : 'scale-100'
      } ${isGhost ? 'opacity-45 scale-90 grayscale-[0.25] pointer-events-none' : ''}`}
    >
      {isGhost && (
        <div
          className="absolute inset-0 border-2 border-dashed border-amber-400/80 animate-pulse pointer-events-none"
          style={{
            clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
          }}
        />
      )}
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        className="filter transition-all duration-200 drop-shadow-md"
      >
        {/* Hexagonal Dark Sharp Silhouette */}
        <polygon
          points="50,8 86,28 86,72 50,92 14,72 14,28"
          fill="#0f172a"
          stroke={isSelected ? accent.main : '#334155'}
          strokeWidth={isSelected ? '4' : '2.5'}
        />
        <polygon points="50,18 76,34 76,66 50,82 24,66 24,34" fill="#1e293b" />

        {/* Crossed Axes / Viking Spear Motif */}
        <path
          d="M 33,33 L 67,67 M 67,33 L 33,67"
          stroke={isSelected ? accent.main : '#94a3b8'}
          strokeWidth="3.5"
          strokeLinecap="round"
        />

        {/* Central Angular Core */}
        <polygon
          points="50,40 58,50 50,60 42,50"
          fill={isSelected ? accent.main : '#e2e8f0'}
        />
      </svg>

      {isSelected && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
            boxShadow: `0 0 12px ${accent.glow}`,
            border: `2px solid ${accent.main}`,
          }}
        />
      )}
    </div>
  );
});

PieceComponent.displayName = 'PieceComponent';

