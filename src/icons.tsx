import React from 'react';
import type { IconType } from 'react-icons';
import {
  GiAnticlockwiseRotation,
  GiCog,
  GiCrossedSwords,
  GiCrossMark,
  GiCrown,
  GiCycle,
  GiExitDoor,
  GiEyeball,
  GiInfo,
  GiKeyboard,
  GiLightningTrio,
  GiOpenBook,
  GiPerson,
  GiPlainArrow,
  GiRoundBottomFlask,
  GiSandsOfTime,
  GiSpeaker,
  GiSpeakerOff,
  GiThreeFriends,
  GiTrophy,
  GiVikingShield,
} from 'react-icons/gi';

type IconProps = React.SVGProps<SVGSVGElement>;

function asIcon(Icon: IconType) {
  return function GameIcon({ className }: IconProps) {
    return <Icon className={className} aria-hidden />;
  };
}

export const Shield = asIcon(GiVikingShield);
export const Swords = asIcon(GiCrossedSwords);
export const Crown = asIcon(GiCrown);
export const History = asIcon(GiSandsOfTime);
export const Volume2 = asIcon(GiSpeaker);
export const VolumeX = asIcon(GiSpeakerOff);
export const RotateCcw = asIcon(GiAnticlockwiseRotation);
export const BookOpen = asIcon(GiOpenBook);
export const Settings = asIcon(GiCog);
export const RefreshCw = asIcon(GiCycle);
export const Eye = asIcon(GiEyeball);
export const X = asIcon(GiCrossMark);
export const Users = asIcon(GiThreeFriends);
export const User = asIcon(GiPerson);
export const Trophy = asIcon(GiTrophy);
export const Info = asIcon(GiInfo);
export const Zap = asIcon(GiLightningTrio);
export const Flask = asIcon(GiRoundBottomFlask);
export const Keyboard = asIcon(GiKeyboard);
export const LogOut = asIcon(GiExitDoor);

export function ChevronDown({ className = '' }: IconProps) {
  return <GiPlainArrow className={`rotate-180 ${className}`} aria-hidden />;
}

export function Menu({ className = '' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <rect x="4" y="6" width="16" height="2" />
      <rect x="4" y="11" width="16" height="2" />
      <rect x="4" y="16" width="16" height="2" />
    </svg>
  );
}

export function GoogleG({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.16 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}
