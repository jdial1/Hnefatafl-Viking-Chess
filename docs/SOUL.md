# The Soul of the Board

This document exists because the fastest way to hollow out a game is to add
features that are mechanically correct and sensorily dead. A move that only
mutates an array is a spreadsheet. A capture that only decrements a counter is
accounting. Hnefatafl is a game about a king surrounded, and it should feel like
one.

The companion rule at `.cursor/rules/soul-and-juice.mdc` states the constraints
in enforceable terms. This file explains why they exist.

## The two problems being solved

**Soul** is intentionality and consequence: the sense that a human considered you
being here, and that what you did left a mark. Its enemy is the stateless world
that resets the moment you look away.

**Juice** is sensory amplification: large cascading feedback in response to small
input. Its enemy is the frictionless, mathematically correct interaction that
communicates no weight.

Both are additive layers over rules that were already correct. The engine in
`src/utils/hnefataflEngine.ts` was never the problem, and this work did not
change a single rule of play.

## Three domains of game feel

| Domain | Question it answers | Where it lives here |
| --- | --- | --- |
| Physicality | Does this object have mass? | Landing squash in `Board.tsx`, the spring on the `layoutId` wrapper |
| Amplification | Did the game notice what I just did? | `useScreenShake`, dying-piece animation, layered capture audio |
| Support | Did the game understand what I meant? | `snapToValidMove` in `Board.tsx`, keyboard grid navigation |

Support is the one most often skipped and the one players feel most. An 11x11
grid on a phone gives roughly 30px cells; requiring a pixel-exact drag release is
a design failure, not player error.

## What was actually hollow, and what fixed it

Three real defects motivated the current implementation.

**The death animation was dead code.** `Piece.tsx` had an `isCapturing` style and
`Board.tsx` passed the flag, but `applyMoveResult` committed the post-capture
board in the same breath as the capture highlight. The cell was already empty, so
no piece existed to animate and all you saw was a flat red rectangle. Captures,
the emotional core of the game, had no body.

The fix reads doomed pieces off the *outgoing* board before it is replaced:

```ts
const dying = captured
  .map((pos) => ({ pos, piece: boardRef.current[pos.r]?.[pos.c] }))
  .filter((entry): entry is DyingPiece => Boolean(entry.piece));
```

They then render as a short-lived overlay that squashes flat and fades, so a
piece visibly dies instead of being deleted.

**The escape-threat cue was audio only.** `playEscapeThreat()` fired when the
king gained an open path to a corner, but nothing on the board reacted. Worse, a
gold scrolling knot border already existed in `index.css` as `.celtic-knot-active`
and was only used for the online queue. That affordance now frames the board
whenever the king's road is open, and the king itself pulses.

**Every move sounded identical.** `playMove()` synthesised a fixed 320 Hz to
140 Hz ramp on every call. Sounds now pass through `vary()` and `varyGain()`, and
impacts carry a sub-bass `thump()` layer so a kill lands in the chest.

## Permanence

Hollow worlds reset. When a piece dies here, the square keeps a scar for the rest
of the match. Scars fade toward `JUICE.scar.settledOpacity` as the battle moves
on but never disappear, so a late-game board carries a visible record of where
the fighting was worst. They persist through reload in the existing
`hnefatafl_save` blob and are cleared only by starting a new game.

## Narrative that reads the board

`formatNotation` produces `A F6 → F10`, which is correct and says nothing.
`sagaVoice.ts` produces a line chosen from what actually happened: how many fell,
whether the king moved, whether the move touched the throne ring, whether it
opened or closed the road to the corners.

The important discipline is that no line is drawn at random from a generic pool.
Flavour text that ignores the position is the same hollowness expressed in prose.
Notation is retained beneath each saga line for players who want the coordinates.

## Adding something new without hollowing the game

1. Make the rule correct first, in the engine, with no presentation concerns.
2. Give it a sound in `soundEngine.ts`, varied so repeats differ.
3. Give it something visible: motion, colour, or shake, scaled to how much the
   event matters.
4. Ask whether it should leave a trace. If it destroys something, it should.
5. Put every timing and amplitude in `src/utils/juice.ts`, not in the component.
6. Ask what a player who *almost* did it correctly deserves, and be generous.
7. Confirm it degrades cleanly with `juiceEnabled` off and under
   `prefers-reduced-motion`.

## Where the knobs are

| Concern | File |
| --- | --- |
| All feel timings, amplitudes, curves | `src/utils/juice.ts` |
| Synthesised audio and variation | `src/utils/soundEngine.ts` |
| Saga lines and move records | `src/utils/sagaVoice.ts` |
| Role colours including scars | `src/utils/roles.ts` |
| Capture pipeline, scars, hit stop | `src/App.tsx` (`applyMoveResult`) |
| Squash, scars, dying overlay, drag snapping | `src/components/Board.tsx` |
| Theme tokens and knot borders | `src/index.css`, `src/utils/celticTheme.ts` |

## A caution on scale

Adding more content is not the same as adding more game. Five squares that
respond richly beat fifty that are inert. If a choice is between another feature
and making an existing interaction feel deliberate, choose the latter.
