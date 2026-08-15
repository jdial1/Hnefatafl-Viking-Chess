import { Capacitor } from '@capacitor/core';
import {
  GoogleAuthProvider,
  browserPopupRedirectResolver,
  getRedirectResult,
  linkWithCredential,
  linkWithPopup,
  onAuthStateChanged,
  signInAnonymously,
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
import { clipDisplayName, generateRandomNorseName } from './norseNames';
import { soundEngine } from './soundEngine';

const DEVICE_KEY = 'hnefatafl_device_id';
const NAME_KEY = 'hnefatafl_display_name';
const POPUP_FALLBACK = new Set(['auth/popup-blocked', 'auth/operation-not-supported-in-this-environment']);
const LINK_TAKEN = new Set(['auth/credential-already-in-use', 'auth/email-already-in-use']);

export function getDeviceId(): string {
  let id = localStorage.getItem(DEVICE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(DEVICE_KEY, id);
  }
  return id;
}

export function getStoredDisplayName(): string {
  return localStorage.getItem(NAME_KEY) ?? '';
}

export function storeDisplayName(name: string): void {
  localStorage.setItem(NAME_KEY, clipDisplayName(name));
}

export function resolveDisplayName(current?: string): string {
  return current || getStoredDisplayName() || generateRandomNorseName();
}

function requirePlayerId(): string {
  if (!auth.currentUser) throw new Error('Session is not ready.');
  return getDeviceId();
}

function authCode(error: unknown): string {
  return typeof error === 'object' && error && 'code' in error ? String(error.code) : '';
}

export function opponentOf(room: LiveRoom, playerId: string): { id: string; name: string } | null {
  const entry = Object.entries(room.players ?? {}).find(([id]) => id !== playerId);
  return entry ? { id: entry[0], name: entry[1].displayName } : null;
}

export function roomPlayers(room: LiveRoom): Record<string, { role: PlayerRole; displayName: string }> {
  return Object.fromEntries(
    Object.entries(room.players ?? {}).map(([id, player]) => [
      id,
      { role: room.roles?.[id] ?? 'defenders', displayName: player.displayName },
    ])
  );
}

function toMatch(roomId: string, room: LiveRoom, playerId: string): MatchFound {
  const opponent = opponentOf(room, playerId);
  return {
    roomId,
    role: room.roles?.[playerId] ?? 'defenders',
    isMaster: room.hostUid === playerId,
    opponentId: opponent?.id ?? null,
    opponentName: opponent?.name ?? null,
    createdAt: room.createdAt,
  };
}

async function applyGoogleCredential(credential: ReturnType<typeof GoogleAuthProvider.credential>): Promise<void> {
  if (auth.currentUser?.isAnonymous) {
    try {
      await linkWithCredential(auth.currentUser, credential);
      return;
    } catch (error) {
      if (!LINK_TAKEN.has(authCode(error))) throw error;
    }
  }
  await signInWithCredential(auth, credential);
}

async function signInGoogleWeb(provider: GoogleAuthProvider): Promise<boolean> {
  const popup = () =>
    auth.currentUser?.isAnonymous
      ? linkWithPopup(auth.currentUser, provider, browserPopupRedirectResolver)
      : signInWithPopup(auth, provider, browserPopupRedirectResolver);

  try {
    await popup();
    return true;
  } catch (error) {
    const code = authCode(error);
    if (LINK_TAKEN.has(code)) {
      await signInWithPopup(auth, provider, browserPopupRedirectResolver);
      return true;
    }
    if (POPUP_FALLBACK.has(code)) {
      await signInWithRedirect(auth, provider, browserPopupRedirectResolver);
      return false;
    }
    throw error;
  }
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

  public playerId(): string {
    return getDeviceId();
  }

  public isGoogleUser(): boolean {
    return Boolean(auth.currentUser && !auth.currentUser.isAnonymous);
  }

  public async ensureGuestSession(): Promise<void> {
    if (auth.currentUser) return;
    await signInAnonymously(auth);
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
    await this.ensureGuestSession();
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    if (Capacitor.isNativePlatform()) {
      const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication');
      const result = await FirebaseAuthentication.signInWithGoogle({ useCredentialManager: false });
      const idToken = result.credential?.idToken;
      if (!idToken) throw new Error('Google sign-in failed.');
      await applyGoogleCredential(GoogleAuthProvider.credential(idToken));
    } else if (!(await signInGoogleWeb(provider))) {
      return;
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
    await this.ensureGuestSession();
  }

  public async goOnline(displayName: string): Promise<void> {
    const playerId = requirePlayerId();
    this.displayName = clipDisplayName(displayName);
    storeDisplayName(this.displayName);
    this.presenceUnsub?.();

    const presenceRef = ref(rtdb, `presence/${playerId}`);
    this.presenceUnsub = onValue(ref(rtdb, '.info/connected'), async (snap) => {
      if (snap.val() !== true) return;
      await onDisconnect(presenceRef).remove();
      await set(presenceRef, {
        id: playerId,
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
    await remove(ref(rtdb, `presence/${getDeviceId()}`));
  }

  public async setDisplayName(name: string): Promise<string> {
    const clipped = clipDisplayName(name);
    this.displayName = clipped;
    storeDisplayName(clipped);
    await this.patchPresence({ username: clipped });
    return clipped;
  }

  public subscribePresence(onUsers: (users: LobbyUser[]) => void): Unsubscribe {
    return onValue(ref(rtdb, 'presence'), (snap) => {
      const value = (snap.val() ?? {}) as Record<string, Omit<LobbyUser, 'id'>>;
      onUsers(
        Object.entries(value).map(([deviceId, user]) => ({
          ...user,
          id: deviceId,
        }))
      );
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

  private async patchPresence(patch: Record<string, unknown>, playerId = getDeviceId()): Promise<void> {
    await update(ref(rtdb, `presence/${playerId}`), patch);
  }

  private async createRoom(displayName: string): Promise<MatchFound> {
    const playerId = requirePlayerId();
    const roomId = `room_${playerId.slice(0, 8)}_${Date.now()}`;
    const room: LiveRoom = {
      status: 'waiting',
      hostUid: playerId,
      createdAt: Date.now(),
      players: { [playerId]: { displayName: clipDisplayName(displayName), joinedAt: Date.now() } },
      roles: { [playerId]: 'defenders' },
      lastMove: null,
      lastMoveBy: null,
      lastMoveAt: null,
      restartAt: null,
      result: null,
    };
    const roomRef = ref(rtdb, `rooms/${roomId}`);
    await set(roomRef, room);
    await onDisconnect(roomRef).remove();
    await this.patchPresence({ roomId, inQueue: false }, playerId);
    return toMatch(roomId, room, playerId);
  }

  private async joinRoom(roomId: string, displayName: string): Promise<MatchFound> {
    const playerId = requirePlayerId();
    const roomRef = ref(rtdb, `rooms/${roomId}`);
    const result = await runTransaction(roomRef, (room: LiveRoom | null) => {
      if (!room) return room;
      const players = room.players ?? {};
      if (players[playerId]) return room;
      if (room.status !== 'waiting' || Object.keys(players).length >= 2) return;
      return {
        ...room,
        status: 'playing',
        players: {
          ...players,
          [playerId]: { displayName: clipDisplayName(displayName), joinedAt: Date.now() },
        },
        roles: { ...room.roles, [playerId]: 'attackers' as PlayerRole },
      };
    });

    if (!result.committed || !result.snapshot.exists()) {
      throw new Error('Room is full or no longer exists.');
    }

    const room = result.snapshot.val() as LiveRoom;
    await this.patchPresence({ roomId, inQueue: false }, playerId);
    return toMatch(roomId, room, playerId);
  }

  public async leaveRoom(roomId: string): Promise<void> {
    const playerId = getDeviceId();
    await runTransaction(ref(rtdb, `rooms/${roomId}`), (room: LiveRoom | null) => {
      if (!room) return room;
      const players = { ...room.players };
      delete players[playerId];
      if (Object.keys(players).length === 0 || room.status === 'waiting') return null;
      const roles = { ...room.roles };
      delete roles[playerId];
      return { ...room, players, roles };
    });
    await this.patchPresence({ roomId: null, inQueue: false }, playerId);
  }

  public async joinQueue(displayName: string, onMatch: (match: MatchFound) => void): Promise<void> {
    const playerId = requirePlayerId();
    await this.leaveQueue();
    await this.patchPresence({ inQueue: true }, playerId);

    const queueSnap = await get(ref(rtdb, 'queue'));
    const queue = (queueSnap.val() ?? {}) as Record<string, { joinedAt: number; roomId: string }>;
    const waiting = Object.entries(queue).find(([id]) => id !== playerId);

    if (waiting) {
      try {
        onMatch(await this.joinRoom(waiting[1].roomId, displayName));
        return;
      } catch {}
    }

    const created = await this.createRoom(displayName);
    this.queuedRoomId = created.roomId;
    const queueRef = ref(rtdb, `queue/${playerId}`);
    await onDisconnect(queueRef).remove();
    await set(queueRef, { joinedAt: Date.now(), roomId: created.roomId });
    await this.patchPresence({ roomId: null, inQueue: true }, playerId);

    this.queuedRoomUnsub = this.subscribeRoom(created.roomId, {
      onUpdate: (room) => {
        if (Object.keys(room.players ?? {}).length < 2) return;
        this.persistRoom(created.roomId);
        this.clearQueueWatch();
        remove(queueRef).catch(() => undefined);
        this.patchPresence({ roomId: created.roomId, inQueue: false }, playerId).catch(() => undefined);
        onMatch(toMatch(created.roomId, room, playerId));
      },
      onGone: () => {
        this.clearQueueWatch();
      },
    });
  }

  public async leaveQueue(): Promise<void> {
    const queuedRoomId = this.queuedRoomId;
    this.clearQueueWatch();
    const playerId = getDeviceId();
    await remove(ref(rtdb, `queue/${playerId}`));
    await this.patchPresence({ inQueue: false }, playerId);
    if (queuedRoomId) await this.leaveRoom(queuedRoomId);
  }

  public persistRoom(roomId: string): void {
    void onDisconnect(ref(rtdb, `rooms/${roomId}`)).cancel();
  }

  public async sendMove(roomId: string, payload: MovePayload, board: BoardState, currentTurn: PlayerRole): Promise<void> {
    const playerId = requirePlayerId();
    await update(ref(rtdb, `rooms/${roomId}`), {
      lastMove: payload,
      lastMoveBy: playerId,
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
