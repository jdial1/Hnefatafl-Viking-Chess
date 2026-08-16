import { User } from 'firebase/auth';
import { doc, getDoc, runTransaction, setDoc } from 'firebase/firestore';
import {
  EMPTY_STATS,
  FcmPlatform,
  FcmTokenMeta,
  GameStats,
  GameStatus,
  MatchWinner,
  PersonalResult,
  PlayerRole,
  UserProfile,
} from '../types';
import { firestore } from './firebase';
import { clipDisplayName, generateRandomNorseName } from './norseNames';
import { resolvePhotoURL } from './sessionService';

function asStats(value: Partial<GameStats> | undefined): GameStats {
  return { ...EMPTY_STATS, ...value };
}

export function winnerFromStatus(status: GameStatus): MatchWinner | null {
  if (status === 'defenders_win') return 'defenders';
  if (status === 'attackers_win') return 'attackers';
  if (status === 'draw') return 'draw';
  return null;
}

export function personalResult(winner: MatchWinner, role: PlayerRole): PersonalResult {
  if (winner === 'draw') return 'draw';
  return winner === role ? 'win' : 'loss';
}

export function applyRoleTally(prev: GameStats, status: GameStatus, moveCount: number): GameStats {
  if (status === 'playing') return prev;
  const fastest =
    prev.fastestWinMoves === null || (moveCount > 0 && moveCount < prev.fastestWinMoves)
      ? moveCount
      : prev.fastestWinMoves;
  return {
    ...prev,
    defendersWins: status === 'defenders_win' ? prev.defendersWins + 1 : prev.defendersWins,
    attackersWins: status === 'attackers_win' ? prev.attackersWins + 1 : prev.attackersWins,
    totalGames: prev.totalGames + 1,
    totalMoves: prev.totalMoves + moveCount,
    fastestWinMoves: fastest,
  };
}

export function applyOnlineResult(prev: GameStats, result: PersonalResult): GameStats {
  return {
    ...prev,
    onlineWins: result === 'win' ? prev.onlineWins + 1 : prev.onlineWins,
    onlineLosses: result === 'loss' ? prev.onlineLosses + 1 : prev.onlineLosses,
    onlineDraws: result === 'draw' ? prev.onlineDraws + 1 : prev.onlineDraws,
  };
}

class StatsService {
  public async ensureProfile(user: User, localStats: GameStats, preferredName?: string): Promise<UserProfile> {
    const userRef = doc(firestore, 'users', user.uid);
    const snap = await getDoc(userRef);
    const googleName = user.displayName ?? null;
    const photoURL = resolvePhotoURL(user);

    if (!snap.exists()) {
      const displayName = clipDisplayName(preferredName || generateRandomNorseName());
      const stats = localStats.totalGames > 0 ? asStats(localStats) : { ...EMPTY_STATS };
      const profile: UserProfile = { displayName, photoURL, googleName, stats, activeRoomId: null };
      await setDoc(userRef, {
        displayName,
        photoURL,
        googleName,
        createdAt: Date.now(),
        stats,
        recordedMatchIds: {},
        activeRoomId: null,
      });
      return profile;
    }

    const data = snap.data();
    let stats = asStats(data.stats);
    const displayName = clipDisplayName(data.displayName || preferredName || generateRandomNorseName());
    const storedPhoto = typeof data.photoURL === 'string' ? data.photoURL : null;
    const nextPhoto = photoURL || storedPhoto;

    if (stats.totalGames === 0 && localStats.totalGames > 0) {
      stats = asStats(localStats);
      await setDoc(userRef, { stats }, { merge: true });
    }

    if (!data.displayName || (nextPhoto && data.photoURL !== nextPhoto)) {
      await setDoc(userRef, { displayName, photoURL: nextPhoto, googleName }, { merge: true });
    }

    return {
      displayName,
      photoURL: nextPhoto,
      googleName,
      stats,
      activeRoomId: typeof data.activeRoomId === 'string' ? data.activeRoomId : null,
    };
  }

  public async setActiveRoomId(uid: string, roomId: string | null): Promise<void> {
    await setDoc(doc(firestore, 'users', uid), { activeRoomId: roomId }, { merge: true });
  }

  public async saveFcmToken(uid: string, token: string, platform: FcmPlatform): Promise<void> {
    const meta: FcmTokenMeta = { platform, updatedAt: Date.now() };
    await setDoc(doc(firestore, 'users', uid), { fcmTokens: { [token]: meta } }, { merge: true });
  }

  public async removeFcmToken(uid: string, token: string): Promise<void> {
    const userRef = doc(firestore, 'users', uid);
    const snap = await getDoc(userRef);
    const tokens = { ...((snap.data()?.fcmTokens ?? {}) as Record<string, FcmTokenMeta>) };
    delete tokens[token];
    await setDoc(userRef, { fcmTokens: tokens }, { merge: true });
  }

  public async setDisplayName(uid: string, name: string): Promise<string> {
    const displayName = clipDisplayName(name);
    await setDoc(doc(firestore, 'users', uid), { displayName }, { merge: true });
    return displayName;
  }

  public async recordFinishedGame(input: {
    uid: string | null;
    playerId?: string;
    prev: GameStats;
    status: GameStatus;
    moveCount: number;
    online?: {
      roomId: string;
      matchKey: number;
      players: Record<string, { role: PlayerRole; displayName: string }>;
    };
  }): Promise<GameStats> {
    const local = applyRoleTally(input.prev, input.status, input.moveCount);
    if (!input.uid || input.status === 'playing') return local;

    const winner = winnerFromStatus(input.status);
    const matchId = input.online && winner ? `${input.online.roomId}_${input.online.matchKey}` : null;
    const seat = input.playerId ?? input.uid;
    const myRole = input.online ? input.online.players[seat]?.role : undefined;

    if (matchId && winner && input.online) {
      try {
        await setDoc(doc(firestore, 'matches', matchId), {
          roomId: input.online.roomId,
          endedAt: Date.now(),
          winner,
          moveCount: input.moveCount,
          players: Object.fromEntries(
            Object.entries(input.online.players).map(([id, player]) => [
              id,
              { ...player, result: personalResult(winner, player.role) },
            ])
          ),
        });
      } catch {
        /* first writer wins */
      }
    }

    const userRef = doc(firestore, 'users', input.uid);
    return runTransaction(firestore, async (tx) => {
      const snap = await tx.get(userRef);
      const data = snap.data() ?? {};
      const recorded = (data.recordedMatchIds ?? {}) as Record<string, boolean>;
      let stats = applyRoleTally(asStats(data.stats), input.status, input.moveCount);
      if (matchId && winner && myRole && !recorded[matchId]) {
        stats = applyOnlineResult(stats, personalResult(winner, myRole));
        tx.set(userRef, { stats, recordedMatchIds: { ...recorded, [matchId]: true }, activeRoomId: null }, { merge: true });
      } else {
        tx.set(userRef, input.online ? { stats, activeRoomId: null } : { stats }, { merge: true });
      }
      return stats;
    });
  }

  public async resetStats(uid: string): Promise<void> {
    await setDoc(doc(firestore, 'users', uid), { stats: { ...EMPTY_STATS } }, { merge: true });
  }
}

export const statsService = new StatsService();
