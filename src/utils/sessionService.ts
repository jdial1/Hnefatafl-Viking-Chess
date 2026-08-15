import { Capacitor } from '@capacitor/core';
import {
  GoogleAuthProvider,
  browserPopupRedirectResolver,
  getRedirectResult,
  onAuthStateChanged,
  signInWithCredential,
  signInWithPopup,
  signInWithRedirect,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth';
import {
  get,
  onDisconnect,
  onValue,
  ref,
  remove,
  runTransaction,
  set,
  update,
  type Unsubscribe,
} from 'firebase/database';
import {
  BoardState,
  LiveRoom,
  LobbyUser,
  MatchFound,
  MovePayload,
  PlayerRole,
  RoomResult,
} from '../types';
import { auth, rtdb } from './firebase';
import { clipDisplayName } from './norseNames';
import { soundEngine } from './soundEngine';

function requireUid(): string {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Sign in required.');
  return uid;
}

function opponentOf(room: LiveRoom, uid: string): { id: string; name: string } | null {
  const entry = Object.entries(room.players ?? {}).find(([id]) => id !== uid);
  return entry ? { id: entry[0], name: entry[1].displayName } : null;
}

function toMatch(roomId: string, room: LiveRoom, uid: string): MatchFound {
  const opponent = opponentOf(room, uid);
  return {
    roomId,
    role: room.roles?.[uid] ?? 'defenders',
    isMaster: room.hostUid === uid,
    opponentId: opponent?.id ?? null,
    opponentName: opponent?.name ?? null,
    createdAt: room.createdAt,
  };
}

let redirectSignIn: Promise<void> | null = null;

class SessionService {
  private presenceUnsub: Unsubscribe | null = null;
  private queuedRoomUnsub: Unsubscribe | null = null;
  private queuedRoomId: string | null = null;
  private displayName = '';

  public currentUid(): string | null {
    return auth.currentUser?.uid ?? null;
  }

  public subscribeAuth(onUser: (user: User | null) => void): Unsubscribe {
    return onAuthStateChanged(auth, onUser);
  }

  public completeRedirectSignIn(): Promise<void> {
    if (!redirectSignIn) {
      redirectSignIn = getRedirectResult(auth, browserPopupRedirectResolver).then((result) => {
        if (result?.user) soundEngine.playSignIn();
      });
    }
    return redirectSignIn;
  }

  public async signInWithGoogle(): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication');
      const result = await FirebaseAuthentication.signInWithGoogle();
      const idToken = result.credential?.idToken;
      if (!idToken) throw new Error('Google sign-in failed.');
      await signInWithCredential(auth, GoogleAuthProvider.credential(idToken));
    } else {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      try {
        await signInWithPopup(auth, provider, browserPopupRedirectResolver);
      } catch (error) {
        const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : '';
        if (code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-this-environment') {
          await signInWithRedirect(auth, provider, browserPopupRedirectResolver);
          return;
        }
        throw error;
      }
    }
    soundEngine.playSignIn();
  }

  public async signOut(): Promise<void> {
    await this.leaveQueue();
    if (this.queuedRoomId) await this.leaveRoom(this.queuedRoomId);
    await this.goOffline();
    if (Capacitor.isNativePlatform()) {
      const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication');
      await FirebaseAuthentication.signOut();
    }
    await firebaseSignOut(auth);
  }

  public async goOnline(displayName: string): Promise<void> {
    const uid = requireUid();
    this.displayName = clipDisplayName(displayName);
    this.presenceUnsub?.();

    const presenceRef = ref(rtdb, `presence/${uid}`);
    const connectedRef = ref(rtdb, '.info/connected');

    this.presenceUnsub = onValue(connectedRef, async (snap) => {
      if (snap.val() !== true) return;
      await onDisconnect(presenceRef).remove();
      await set(presenceRef, {
        id: uid,
        username: this.displayName,
        joinedAt: Date.now(),
        inQueue: false,
        roomId: null,
      });
    });
  }

  public async goOffline(): Promise<void> {
    this.presenceUnsub?.();
    this.presenceUnsub = null;
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    await remove(ref(rtdb, `presence/${uid}`));
  }

  public async setDisplayName(name: string): Promise<string> {
    const clipped = clipDisplayName(name);
    this.displayName = clipped;
    const uid = auth.currentUser?.uid;
    if (uid) await update(ref(rtdb, `presence/${uid}`), { username: clipped });
    return clipped;
  }

  public subscribePresence(onUsers: (users: LobbyUser[]) => void): Unsubscribe {
    return onValue(ref(rtdb, 'presence'), (snap) => {
      const value = (snap.val() ?? {}) as Record<string, LobbyUser>;
      onUsers(Object.values(value));
    });
  }

  public subscribeRoom(
    roomId: string,
    handlers: {
      onUpdate: (room: LiveRoom) => void;
      onGone: () => void;
    }
  ): Unsubscribe {
    return onValue(ref(rtdb, `rooms/${roomId}`), (snap) => {
      if (!snap.exists()) {
        handlers.onGone();
        return;
      }
      handlers.onUpdate(snap.val() as LiveRoom);
    });
  }

  public async createRoom(displayName: string): Promise<MatchFound> {
    const uid = requireUid();
    const roomId = `room_${uid.slice(0, 5)}_${Date.now()}`;
    const room: LiveRoom = {
      status: 'waiting',
      hostUid: uid,
      createdAt: Date.now(),
      players: { [uid]: { displayName: clipDisplayName(displayName), joinedAt: Date.now() } },
      roles: { [uid]: 'defenders' },
      lastMove: null,
      lastMoveBy: null,
      lastMoveAt: null,
      restartAt: null,
      result: null,
    };
    const roomRef = ref(rtdb, `rooms/${roomId}`);
    await set(roomRef, room);
    await onDisconnect(roomRef).remove();
    await update(ref(rtdb, `presence/${uid}`), { roomId, inQueue: false });
    return toMatch(roomId, room, uid);
  }

  public async joinRoom(roomId: string, displayName: string): Promise<MatchFound> {
    const uid = requireUid();
    const roomRef = ref(rtdb, `rooms/${roomId}`);
    const result = await runTransaction(roomRef, (room: LiveRoom | null) => {
      if (!room) return room;
      const players = room.players ?? {};
      if (players[uid]) return room;
      if (room.status !== 'waiting' || Object.keys(players).length >= 2) return;
      return {
        ...room,
        status: 'playing',
        players: {
          ...players,
          [uid]: { displayName: clipDisplayName(displayName), joinedAt: Date.now() },
        },
        roles: { ...room.roles, [uid]: 'attackers' as PlayerRole },
      };
    });

    if (!result.committed || !result.snapshot.exists()) {
      throw new Error('Room is full or no longer exists.');
    }

    const room = result.snapshot.val() as LiveRoom;
    await update(ref(rtdb, `presence/${uid}`), { roomId, inQueue: false });
    return toMatch(roomId, room, uid);
  }

  public async leaveRoom(roomId: string): Promise<void> {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const roomRef = ref(rtdb, `rooms/${roomId}`);
    await runTransaction(roomRef, (room: LiveRoom | null) => {
      if (!room) return room;
      const players = { ...room.players };
      delete players[uid];
      if (Object.keys(players).length === 0 || room.status === 'waiting') return null;
      const roles = { ...room.roles };
      delete roles[uid];
      return { ...room, players, roles };
    });
    await update(ref(rtdb, `presence/${uid}`), { roomId: null, inQueue: false });
  }

  public async joinQueue(displayName: string, onMatch: (match: MatchFound) => void): Promise<void> {
    const uid = requireUid();
    await this.leaveQueue();
    await update(ref(rtdb, `presence/${uid}`), { inQueue: true });

    const queueSnap = await get(ref(rtdb, 'queue'));
    const queue = (queueSnap.val() ?? {}) as Record<string, { joinedAt: number; roomId: string }>;
    const waiting = Object.entries(queue).find(([id]) => id !== uid);

    if (waiting) {
      try {
        const match = await this.joinRoom(waiting[1].roomId, displayName);
        onMatch(match);
        return;
      } catch {
        /* host queue entry is theirs to clear */
      }
    }

    const created = await this.createRoom(displayName);
    this.queuedRoomId = created.roomId;
    const queueRef = ref(rtdb, `queue/${uid}`);
    await onDisconnect(queueRef).remove();
    await set(queueRef, { joinedAt: Date.now(), roomId: created.roomId });
    await update(ref(rtdb, `presence/${uid}`), { roomId: null, inQueue: true });

    this.queuedRoomUnsub = this.subscribeRoom(created.roomId, {
      onUpdate: (room) => {
        if (Object.keys(room.players ?? {}).length < 2) return;
        this.persistRoom(created.roomId);
        this.clearQueueWatch();
        remove(queueRef).catch(() => undefined);
        update(ref(rtdb, `presence/${uid}`), { roomId: created.roomId, inQueue: false }).catch(() => undefined);
        onMatch(toMatch(created.roomId, room, uid));
      },
      onGone: () => {
        this.clearQueueWatch();
      },
    });
  }

  public async leaveQueue(): Promise<void> {
    const uid = auth.currentUser?.uid;
    const queuedRoomId = this.queuedRoomId;
    this.clearQueueWatch();
    if (!uid) return;
    await remove(ref(rtdb, `queue/${uid}`));
    await update(ref(rtdb, `presence/${uid}`), { inQueue: false });
    if (queuedRoomId) await this.leaveRoom(queuedRoomId);
  }

  public persistRoom(roomId: string): void {
    void onDisconnect(ref(rtdb, `rooms/${roomId}`)).cancel();
  }

  public async sendMove(roomId: string, payload: MovePayload, board: BoardState, currentTurn: PlayerRole): Promise<void> {
    const uid = requireUid();
    await update(ref(rtdb, `rooms/${roomId}`), {
      lastMove: payload,
      lastMoveBy: uid,
      lastMoveAt: Date.now(),
      state: { board, currentTurn },
    });
  }

  public async sendState(roomId: string, board: BoardState, currentTurn: PlayerRole): Promise<void> {
    await update(ref(rtdb, `rooms/${roomId}`), { state: { board, currentTurn } });
  }

  public async restartGame(roomId: string): Promise<void> {
    await update(ref(rtdb, `rooms/${roomId}`), {
      restartAt: Date.now(),
      lastMove: null,
      lastMoveBy: null,
      lastMoveAt: null,
      result: null,
      status: 'playing',
    });
  }

  public async writeResult(roomId: string, result: RoomResult): Promise<void> {
    await runTransaction(ref(rtdb, `rooms/${roomId}`), (room: LiveRoom | null) => {
      if (!room || room.result) return room;
      return { ...room, status: 'finished', result };
    });
  }

  private clearQueueWatch() {
    this.queuedRoomUnsub?.();
    this.queuedRoomUnsub = null;
    this.queuedRoomId = null;
  }
}

export const sessionService = new SessionService();
