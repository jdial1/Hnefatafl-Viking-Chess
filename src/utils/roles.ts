import { PieceCounts, PlayerRole, STARTING_SOLDIER_COUNTS, VICTORY_REASON } from '../types';

export const PLAYER_ROLES: readonly PlayerRole[] = ['defenders', 'attackers'];

export const ROLE_META: Record<
  PlayerRole,
  {
    label: string;
    plural: string;
    force: string;
    goal: string;
    rules: string;
    victory: string;
    colorClass: string;
    mutedClass: string;
    countClass: string;
    bgClass: string;
    turnClass: string;
    pulseClass: string;
    scarClass: string;
  }
> = {
  defenders: {
    label: 'Defender',
    plural: 'Defenders',
    force: '12 + King',
    goal: 'Escort King to corner',
    rules: 'Escape the King to any of the 4 corner refuges.',
    victory: VICTORY_REASON.defenders,
    colorClass: 'text-amber-400',
    mutedClass: 'text-amber-300',
    countClass: 'text-amber-200',
    bgClass: 'bg-amber-500/10 text-amber-300',
    turnClass: 'bg-amber-500 text-slate-950',
    pulseClass: 'bg-amber-400',
    scarClass: 'bg-amber-400',
  },
  attackers: {
    label: 'Attacker',
    plural: 'Attackers',
    force: '24',
    goal: 'Surround & capture King',
    rules: 'Surround and capture the King before he reaches safety.',
    victory: VICTORY_REASON.attackers,
    colorClass: 'text-sky-400',
    mutedClass: 'text-sky-300',
    countClass: 'text-sky-200',
    bgClass: 'bg-sky-500/10 text-sky-300',
    turnClass: 'bg-sky-500 text-slate-950',
    pulseClass: 'bg-sky-400',
    scarClass: 'bg-sky-400',
  },
};

export function forceStats(role: PlayerRole, pieceCounts: PieceCounts) {
  const live = pieceCounts[role];
  const lost = role === 'defenders' ? pieceCounts.capturedDefenders : pieceCounts.capturedAttackers;
  return {
    meta: ROLE_META[role],
    live,
    lost,
    cap: STARTING_SOLDIER_COUNTS[role],
  };
}
