import { useCallback } from 'react';
import { useAnimate, useReducedMotion } from 'motion/react';

/**
 * Every tactile "feel" number in the game lives here so impact stays consistent
 * and tunable from one place. Components must not inline these values.
 */
export const JUICE = {
  /** How long a doomed piece stays on the board dying before it is gone for good. */
  deathMs: 260,
  /** Input stays locked for the opening beat of a capture so the blow reads before the next move. */
  hitStopMs: 140,
  /** Extra lock while the king falls, since that ends the match. */
  kingHitStopMs: 320,

  shake: {
    /** Pixels of displacement for a single kill. Scales up with the body count. */
    basePx: 5,
    perExtraKillPx: 3,
    maxPx: 16,
    /** A king capture is the heaviest event in the game. */
    kingPx: 22,
    durationMs: 380,
  },

  /** Landing compression: the piece squats along Y and spreads along X, then recovers. */
  squash: {
    scaleX: 1.16,
    scaleY: 0.84,
    durationMs: 260,
  },

  /** Scars never vanish, they only settle to this opacity as the battle moves on. */
  scar: {
    freshOpacity: 0.5,
    settledOpacity: 0.16,
    /** Moves taken to fade from fresh to settled. */
    agingMoves: 12,
  },

  /** Cents of random detune applied to synthesised sounds so repeats are not identical. */
  audioDetuneCents: 55,
  audioGainJitter: 0.12,

  signIn: {
    freqStart: 392,
    freqEnd: 523.25,
    durationMs: 160,
    gain: 0.14,
  },

  matchFound: {
    freqStart: 196,
    freqEnd: 392,
    durationMs: 240,
    gain: 0.16,
    thumpStart: 90,
    thumpEnd: 40,
    thumpGain: 0.12,
  },

  turnPulse: {
    durationMs: 1400,
    minOpacity: 0.18,
    maxOpacity: 0.5,
    scale: 1.14,
  },
} as const;

/** Displacement for a capture, louder for more kills and loudest for the king. */
export function shakeAmplitude(killCount: number, killedKing: boolean): number {
  if (killedKing) return JUICE.shake.kingPx;
  const { basePx, perExtraKillPx, maxPx } = JUICE.shake;
  return Math.min(maxPx, basePx + Math.max(0, killCount - 1) * perExtraKillPx);
}

/** Milliseconds input should stay locked after a capture. */
export function hitStopDuration(killedKing: boolean): number {
  return killedKing ? JUICE.kingHitStopMs : JUICE.hitStopMs;
}

/**
 * Fades a scar from fresh toward its settled floor as the battle moves past it,
 * never below the floor so the board keeps its history.
 */
export function scarOpacity(movesSince: number): number {
  const { freshOpacity, settledOpacity, agingMoves } = JUICE.scar;
  const aged = Math.min(1, Math.max(0, movesSince) / agingMoves);
  return freshOpacity + (settledOpacity - freshOpacity) * aged;
}

/**
 * Shakes a container to push impact past the avatar and into the player's view.
 * Returns a ref to attach and a trigger; both are inert when motion is unwanted.
 */
export function useScreenShake(enabled: boolean) {
  const [scope, animate] = useAnimate();
  const prefersReducedMotion = useReducedMotion();
  const allowed = enabled && !prefersReducedMotion;

  const shake = useCallback(
    (amplitudePx: number) => {
      if (!allowed || !scope.current) return;
      animate(
        scope.current,
        {
          x: [0, -amplitudePx, amplitudePx * 0.7, -amplitudePx * 0.45, amplitudePx * 0.25, 0],
          y: [0, amplitudePx * 0.6, -amplitudePx * 0.5, amplitudePx * 0.3, -amplitudePx * 0.15, 0],
        },
        { duration: JUICE.shake.durationMs / 1000, ease: 'easeOut' }
      );
    },
    [allowed, animate, scope]
  );

  return { scope, shake, motionAllowed: allowed };
}
