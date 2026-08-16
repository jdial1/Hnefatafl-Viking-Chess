import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  BoardState,
  DyingPiece,
  CLEAR_MATCH,
  EMPTY_ONLINE,
  EMPTY_STATS,
  GameSettings,
  GameStats,
  GameStatus,
  LiveRoom,
  LobbyUser,
  MatchFound,
  Move,
  OnlineMatchState,
  Piece,
  PlayerRole,
  Position,
  Scar,
  VICTORY_REASON,
} from './types';
import {
  checkGameStatus,
  countPieces,
  createInitialBoard,
  executeMove,
  formatNotation,
  getValidMoves,
  hydrateBoard,
  isKingThreatened,
  isPosition,
} from './utils/hnefataflEngine';
import { JUICE, hitStopDuration, shakeAmplitude, useScreenShake } from './utils/juice';
import { createMoveRecord, hydrateMove } from './utils/sagaVoice';
import { soundEngine } from './utils/soundEngine';
import { opponentOf, resolveDisplayName, roomPlayers, sessionService, storeDisplayName } from './utils/sessionService';
import { applyOnlineResult, applyRoleTally, personalResult, statsService, winnerFromStatus } from './utils/statsService';
import { generateRandomNorseName } from './utils/norseNames';
import { registerFcmToken, unregisterFcmToken } from './utils/fcmService';
import { notifyTurn, requestTurnNotifications } from './utils/turnNotifier';
import { useBackButton } from './utils/useBackButton';
import { Header } from './components/Header';
import { TurnBanner } from './components/TurnBanner';
import { Board } from './components/Board';
import { VictoryModal } from './components/VictoryModal';
import { RulesModal } from './components/RulesModal';
import { SettingsModal } from './components/SettingsModal';
import { PlayersModal } from './components/PlayersModal';
import { MatchFoundModal } from './components/MatchFoundModal';
import { ResignModal } from './components/ResignModal';
import { MoveHistory } from './components/MoveHistory';
import { HomeView } from './components/HomeView';
import { UpdateBanner } from './components/UpdateBanner';
import { Btn, Panel, ViewErrorBoundary } from './components/ui';
import { useAppUpdate } from './utils/appUpdate';

const STORAGE = {
  stats: 'hnefatafl_stats_v1',
  save: 'hnefatafl_save',
  rules: 'hnefatafl_rules_read',
};

interface GameSnapshot {
  board: BoardState;
  turn: PlayerRole;
}

function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function playCaptureFeedback(killedKing: boolean) {
  soundEngine.playCapture();
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(killedKing ? [...JUICE.haptic.kingCapture] : [...JUICE.haptic.capture]);
  }
}

export default function App() {
  const [viewMode, setViewMode] = useState<'home' | 'game'>('home');
  const [board, setBoard] = useState<BoardState>(() => createInitialBoard());
  const [currentTurn, setCurrentTurn] = useState<PlayerRole>('defenders');
  const [selectedPos, setSelectedPos] = useState<Position | null>(null);
  const [validMoves, setValidMoves] = useState<Position[]>([]);
  const [lastMove, setLastMove] = useState<{ from: Position; to: Position; piece?: Piece } | null>(null);
  const [dyingPieces, setDyingPieces] = useState<DyingPiece[]>([]);
  const [scars, setScars] = useState<Scar[]>([]);
  const [gameStatus, setGameStatus] = useState<GameStatus>('playing');
  const [statusReason, setStatusReason] = useState('');
  const [moveHistory, setMoveHistory] = useState<Move[]>([]);
  const [historyStack, setHistoryStack] = useState<GameSnapshot[]>([]);
  const [showMoveHistory, setShowMoveHistory] = useState(false);
  const [lobbyUsers, setLobbyUsers] = useState<LobbyUser[]>([]);
  const [onlineState, setOnlineState] = useState<OnlineMatchState>(EMPTY_ONLINE);
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPlayersOpen, setIsPlayersOpen] = useState(false);
  const [isResignOpen, setIsResignOpen] = useState(false);
  const [pendingMatch, setPendingMatch] = useState<MatchFound | null>(null);
  const [matchReady, setMatchReady] = useState(false);
  const [opponentReady, setOpponentReady] = useState(false);
  const [isSandboxMode, setIsSandboxMode] = useState(false);
  const [matchStartedAt, setMatchStartedAt] = useState(0);
  const [matchEndedAt, setMatchEndedAt] = useState<number | null>(null);
  const [boardBroken, setBoardBroken] = useState(false);
  const [settings, setSettings] = useState<GameSettings>({
    soundEnabled: true,
    showValidMoves: true,
    juiceEnabled: true,
  });
  const [stats, setStats] = useState<GameStats>(() => ({ ...EMPTY_STATS, ...loadJson(STORAGE.stats, EMPTY_STATS) }));

  const appUpdate = useAppUpdate();
  const playState = useMemo(() => {
    try {
      const nextBoard = hydrateBoard(board);
      const pieceCounts = countPieces(nextBoard);
      const empty = pieceCounts.attackers + pieceCounts.defenders === 0 && !pieceCounts.hasKing;
      return {
        playBoard: nextBoard,
        pieceCounts,
        isEscapeThreat: empty ? false : isKingThreatened(nextBoard),
        broken: empty,
      };
    } catch {
      const nextBoard = hydrateBoard(null);
      return {
        playBoard: nextBoard,
        pieceCounts: countPieces(nextBoard),
        isEscapeThreat: false,
        broken: true,
      };
    }
  }, [board]);
  const playBoard = playState.playBoard;
  const pieceCounts = playState.pieceCounts;
  const isEscapeThreat = playState.isEscapeThreat;
  const { scope: boardScope, shake } = useScreenShake(settings.juiceEnabled);

  const boardRef = useRef(board);
  const currentTurnRef = useRef(currentTurn);
  const onlineStateRef = useRef(onlineState);
  const moveHistoryRef = useRef(moveHistory);
  const historyStackRef = useRef(historyStack);
  const gameStatusRef = useRef(gameStatus);
  const prevEscapeThreatRef = useRef(false);
  const isFrozenRef = useRef(false);
  const lastAppliedStateAtRef = useRef(0);
  const lastRestartAtRef = useRef(0);
  const pendingMatchRef = useRef<MatchFound | null>(null);
  const scarsRef = useRef(scars);
  const roomMetaRef = useRef({ createdAt: 0, restartAt: null as number | null, players: {} as Record<string, { role: PlayerRole; displayName: string }> });
  const indexedRoomRef = useRef<string | null>(null);

  boardRef.current = playBoard;
  currentTurnRef.current = currentTurn;
  onlineStateRef.current = onlineState;
  moveHistoryRef.current = moveHistory;
  historyStackRef.current = historyStack;
  gameStatusRef.current = gameStatus;
  scarsRef.current = scars;

  useEffect(() => {
    localStorage.setItem(STORAGE.stats, JSON.stringify(stats));
  }, [stats]);

  useEffect(() => {
    if (playState.broken) setBoardBroken(true);
  }, [playState.broken]);

  useEffect(() => {
    if (isEscapeThreat && !prevEscapeThreatRef.current && gameStatus === 'playing') {
      soundEngine.playEscapeThreat();
    }
    prevEscapeThreatRef.current = isEscapeThreat;
  }, [isEscapeThreat, gameStatus]);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE.rules)) setIsRulesOpen(true);
    const parsed = loadJson<Record<string, unknown> | null>(STORAGE.save, null);
    if (!parsed) return;
    if (parsed.board) setBoard(hydrateBoard(parsed.board));
    if (parsed.currentTurn) setCurrentTurn(parsed.currentTurn as PlayerRole);
    if (Array.isArray(parsed.moveHistory)) {
      const history = (parsed.moveHistory as Move[])
        .map(hydrateMove)
        .filter((move) => isPosition(move.from) && isPosition(move.to) && move.piece);
      setMoveHistory(history);
      if (history.length > 0) {
        const last = history[history.length - 1];
        setLastMove({ from: last.from, to: last.to, piece: last.piece });
      }
    }
    if (Array.isArray(parsed.historyStack)) {
      setHistoryStack(
        (parsed.historyStack as GameSnapshot[]).map((snap) => ({
          ...snap,
          board: hydrateBoard(snap.board),
        }))
      );
    }
    if (Array.isArray(parsed.scars)) setScars(parsed.scars as Scar[]);
    if (parsed.gameStatus) setGameStatus(parsed.gameStatus as GameStatus);
  }, []);

  useEffect(() => {
    localStorage.setItem(
      STORAGE.save,
      JSON.stringify({
        board: playBoard,
        currentTurn,
        moveHistory,
        historyStack,
        scars,
        gameStatus,
        onlineState: {
          roomId: onlineState.roomId,
          role: onlineState.role,
          isMaster: onlineState.isMaster,
          opponentId: onlineState.opponentId,
          opponentName: onlineState.opponentName,
          username: onlineState.username,
        },
      })
    );
  }, [board, currentTurn, moveHistory, historyStack, scars, gameStatus, onlineState]);

  useEffect(() => {
    soundEngine.setEnabled(settings.soundEnabled);
  }, [settings.soundEnabled]);

  const recordGameResult = useCallback((status: GameStatus, totalMoveCount: number) => {
    if (status === 'playing') return;
    const online = onlineStateRef.current;
    const meta = roomMetaRef.current;
    const winner = winnerFromStatus(status);

    setStats((prev) => {
      const next = applyRoleTally(prev, status, totalMoveCount);
      const withOnline =
        online.roomId && winner && online.role
          ? applyOnlineResult(next, personalResult(winner, online.role))
          : next;

      if (sessionService.isGoogleUser()) {
        void statsService
          .recordFinishedGame({
            uid: sessionService.currentUid(),
            prev,
            status,
            moveCount: totalMoveCount,
            online: online.roomId
              ? {
                  roomId: online.roomId,
                  matchKey: meta.restartAt ?? meta.createdAt,
                  players: meta.players,
                }
              : undefined,
          })
          .then((cloud) => setStats(cloud))
          .catch(() => undefined);
      }

      if (online.roomId && winner && online.uid) {
        void sessionService.writeResult(online.roomId, {
          winner,
          moveCount: totalMoveCount,
          writtenBy: online.uid,
        });
      }

      return withOnline;
    });
  }, []);

  const clearSelection = () => {
    setSelectedPos(null);
    setValidMoves([]);
  };

  const applyMoveResult = useCallback(
    (
      finalBoard: BoardState,
      nextTurn: PlayerRole,
      from: Position,
      to: Position,
      captured: Position[],
      piece: Piece | undefined,
      moveRecord: Move | undefined
    ) => {
      const dying = captured
        .map((pos) => ({ pos, piece: boardRef.current[pos.r]?.[pos.c] }))
        .filter((entry): entry is DyingPiece => Boolean(entry.piece));

      setBoard(finalBoard);
      boardRef.current = finalBoard;
      setCurrentTurn(nextTurn);
      currentTurnRef.current = nextTurn;
      setLastMove({ from, to, piece });
      clearSelection();

      const moveNumber = moveHistoryRef.current.length + (moveRecord ? 1 : 0);
      if (moveRecord) {
        setMoveHistory((prev) => [...prev, moveRecord]);
      }

      if (dying.length > 0) {
        const killedKing = dying.some((entry) => entry.piece.type === 'king');

        setDyingPieces(dying);
        setTimeout(() => setDyingPieces([]), JUICE.deathMs);

        setScars((prev) => [
          ...prev,
          ...dying.map(({ pos, piece: dead }) => ({
            r: pos.r,
            c: pos.c,
            role: dead.role,
            moveIndex: moveNumber,
          })),
        ]);

        playCaptureFeedback(killedKing);
        shake(shakeAmplitude(dying.length, killedKing));

        isFrozenRef.current = true;
        window.setTimeout(() => {
          isFrozenRef.current = false;
        }, hitStopDuration(killedKing));
      } else if (piece?.type === 'king') {
        soundEngine.playKingMove();
      } else {
        soundEngine.playMove();
      }

      const statusCheck = checkGameStatus(finalBoard, nextTurn);
      if (statusCheck.status !== 'playing') {
        setGameStatus(statusCheck.status);
        setStatusReason(statusCheck.reason || '');
        soundEngine.playVictory();
        recordGameResult(statusCheck.status, moveNumber);
      }
    },
    [recordGameResult, shake]
  );

  const handleNewGame = useCallback(() => {
    const initB = createInitialBoard();
    setBoard(initB);
    boardRef.current = initB;
    setCurrentTurn('defenders');
    currentTurnRef.current = 'defenders';
    clearSelection();
    setLastMove(null);
    setDyingPieces([]);
    setScars([]);
    setMoveHistory([]);
    setHistoryStack([]);
    setGameStatus('playing');
    setStatusReason('');
    setBoardBroken(false);
  }, []);

  const offerMatch = useCallback((match: MatchFound) => {
    requestTurnNotifications();
    soundEngine.playMatchFound();
    pendingMatchRef.current = match;
    setPendingMatch(match);
    roomMetaRef.current = {
      ...roomMetaRef.current,
      createdAt: match.createdAt,
    };
    setOnlineState((prev) => ({
      ...prev,
      roomId: match.roomId,
      role: match.role,
      isMaster: match.isMaster,
      opponentId: match.opponentId,
      opponentName: match.opponentName,
      inQueue: false,
    }));
  }, []);

  const beginPendingGame = useCallback(() => {
    pendingMatchRef.current = null;
    setPendingMatch(null);
    setMatchReady(false);
    setOpponentReady(false);
    handleNewGame();
    setViewMode('game');
  }, [handleNewGame]);

  const handleAcceptMatch = useCallback(() => {
    const match = pendingMatchRef.current;
    if (!match) return;
    setMatchReady(true);
    void sessionService.acceptMatch(match.roomId).catch(() => {
      soundEngine.playError();
      setMatchReady(false);
    });
  }, []);

  const handleDeclineMatch = useCallback(() => {
    const roomId = pendingMatchRef.current?.roomId ?? onlineStateRef.current.roomId;
    pendingMatchRef.current = null;
    setPendingMatch(null);
    setMatchReady(false);
    setOpponentReady(false);
    if (roomId) void sessionService.leaveRoom(roomId);
    setOnlineState((prev) => ({ ...prev, ...CLEAR_MATCH }));
  }, []);

  const handleRematch = useCallback(() => {
    handleNewGame();
    lastAppliedStateAtRef.current = 0;
    const roomId = onlineStateRef.current.roomId;
    const uid = onlineStateRef.current.uid;
    if (roomId) {
      void sessionService.restartGame(roomId).then((stateAt) => {
        lastAppliedStateAtRef.current = stateAt;
        if (uid) void statsService.setActiveRoomId(uid, roomId);
        indexedRoomRef.current = roomId;
      });
    }
  }, [handleNewGame]);

  const handleOpenSandbox = useCallback(() => {
    if (onlineStateRef.current.roomId) return;
    setIsSandboxMode(true);
    setViewMode('game');
    handleNewGame();
  }, [handleNewGame]);

  const handleGoHome = useCallback(() => {
    setViewMode('home');
    setIsSandboxMode(false);
    setBoardBroken(false);
  }, []);

  const handleSetUsername = useCallback(async (name: string) => {
    const clipped = await sessionService.setDisplayName(name);
    if (sessionService.isGoogleUser()) {
      const authUid = sessionService.currentUid();
      if (authUid) await statsService.setDisplayName(authUid, clipped);
    }
    setOnlineState((prev) => ({ ...prev, username: clipped }));
  }, []);

  const handleRandomizeName = useCallback(() => {
    const name = generateRandomNorseName(lobbyUsers.map((user) => user.username));
    void handleSetUsername(name);
    return name;
  }, [lobbyUsers, handleSetUsername]);

  const handlePlayAsGuest = useCallback(async () => {
    try {
      const ok = await sessionService.ensureGuestSession();
      if (!ok) {
        soundEngine.playError();
        alert('Guest play is unavailable.');
      }
    } catch (error) {
      soundEngine.playError();
      alert(error instanceof Error ? error.message : 'Guest play failed.');
    }
  }, []);

  const handleSignIn = useCallback(async () => {
    try {
      await sessionService.signInWithGoogle();
    } catch (error) {
      soundEngine.playError();
      alert(error instanceof Error ? error.message : 'Google sign-in failed.');
    }
  }, []);

  const handleSignOut = useCallback(() => {
    const uid = onlineStateRef.current.uid;
    setOnlineState((prev) => ({
      ...EMPTY_ONLINE,
      username: prev.username,
      uid: null,
    }));
    setViewMode('home');
    setIsSettingsOpen(false);
    void (async () => {
      await unregisterFcmToken(uid);
      await sessionService.signOut().catch(() => {
        soundEngine.playError();
      });
    })();
  }, []);

  const handleJoinQueue = useCallback(() => {
    if (!onlineStateRef.current.isConnected || onlineStateRef.current.roomId) return;
    setOnlineState((prev) => ({ ...prev, inQueue: true }));
    void sessionService.joinQueue(onlineStateRef.current.username, offerMatch);
  }, [offerMatch]);

  const handleLeaveQueue = useCallback(() => {
    void sessionService.leaveQueue();
    setOnlineState((prev) => ({ ...prev, inQueue: false }));
  }, []);

  const handleResignRequest = useCallback(() => {
    if (pendingMatchRef.current) {
      handleDeclineMatch();
      return;
    }
    if (!onlineStateRef.current.roomId) return;
    setIsResignOpen(true);
  }, [handleDeclineMatch]);

  const handleResignConfirm = useCallback(() => {
    const roomId = onlineStateRef.current.roomId;
    const uid = onlineStateRef.current.uid;
    setIsResignOpen(false);
    if (!roomId) return;
    void sessionService.resign(roomId).then(() => {
      if (uid) void statsService.setActiveRoomId(uid, null);
      indexedRoomRef.current = null;
    });
  }, []);

  const handleUndo = useCallback(() => {
    const stack = historyStackRef.current;
    const history = moveHistoryRef.current;
    if (stack.length === 0 || gameStatusRef.current !== 'playing') return;
    const targetState = stack[stack.length - 1];
    if (!targetState) return;
    setBoard(targetState.board);
    boardRef.current = targetState.board;
    setCurrentTurn(targetState.turn);
    currentTurnRef.current = targetState.turn;
    const newHistory = history.slice(0, -1);
    setHistoryStack((prev) => prev.slice(0, -1));
    setMoveHistory(newHistory);
    setScars((prev) => prev.filter((scar) => scar.moveIndex <= newHistory.length));
    clearSelection();
    const prevMove = newHistory[newHistory.length - 1];
    setLastMove(prevMove ? { from: prevMove.from, to: prevMove.to, piece: prevMove.piece } : null);
  }, []);

  const handleCloseRules = useCallback(() => {
    localStorage.setItem(STORAGE.rules, 'true');
    setIsRulesOpen(false);
  }, []);

  const handleResetStats = useCallback(() => {
    setStats(EMPTY_STATS);
    const uid = sessionService.isGoogleUser() ? sessionService.currentUid() : null;
    if (uid) void statsService.resetStats(uid);
  }, []);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') return;
      if (isRulesOpen || isSettingsOpen || isPlayersOpen || isResignOpen || gameStatus !== 'playing') return;
      if (e.key === 'u' || e.key === 'U') handleUndo();
      else if (e.key === 'm' || e.key === 'M') setSettings((prev) => ({ ...prev, soundEnabled: !prev.soundEnabled }));
      else if (e.key === 'r' || e.key === 'R') setIsRulesOpen(true);
      else if (e.key === 'h' || e.key === 'H') setShowMoveHistory((prev) => !prev);
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isRulesOpen, isSettingsOpen, isPlayersOpen, isResignOpen, gameStatus, handleUndo]);

  useBackButton(() => {
    if (showMoveHistory) setShowMoveHistory(false);
    else if (isResignOpen) setIsResignOpen(false);
    else if (pendingMatch) handleDeclineMatch();
    else if (isPlayersOpen) setIsPlayersOpen(false);
    else if (isSettingsOpen) setIsSettingsOpen(false);
    else if (isRulesOpen) handleCloseRules();
    else if (gameStatus !== 'playing') setGameStatus('playing');
    else if (viewMode === 'game') handleGoHome();
    else return false;
    return true;
  });

  const applyRoomSnapshot = useCallback(
    (room: LiveRoom, uid: string, animate: boolean) => {
      const state = room.state;
      if (!state) return;
      const restored = hydrateBoard(state.board);
      setBoard(restored);
      boardRef.current = restored;
      setCurrentTurn(state.currentTurn);
      currentTurnRef.current = state.currentTurn;
      setHistoryStack([]);
      if (Array.isArray(state.moveHistory)) {
        const history = state.moveHistory
          .map(hydrateMove)
          .filter((move) => isPosition(move.from) && isPosition(move.to) && move.piece);
        setMoveHistory(history);
        moveHistoryRef.current = history;
      }
      if (Array.isArray(state.scars)) {
        setScars(state.scars);
        scarsRef.current = state.scars;
      }
      const nextStatus = state.gameStatus ?? (room.status === 'finished' && room.result
        ? room.result.winner === 'attackers'
          ? 'attackers_win'
          : room.result.winner === 'defenders'
            ? 'defenders_win'
            : 'draw'
        : 'playing');
      if (nextStatus !== 'playing' && gameStatusRef.current === 'playing') {
        setGameStatus(nextStatus);
        const reason =
          nextStatus === 'defenders_win'
            ? VICTORY_REASON.defenders
            : nextStatus === 'attackers_win'
              ? VICTORY_REASON.attackers
              : '';
        setStatusReason(reason);
        soundEngine.playVictory();
        recordGameResult(nextStatus, (state.moveHistory ?? moveHistoryRef.current).length);
      } else if (nextStatus === 'playing') {
        setGameStatus('playing');
      }
      const highlight = room.lastMove;
      if (highlight && isPosition(highlight.from) && isPosition(highlight.to)) {
        setLastMove({ from: highlight.from, to: highlight.to, piece: highlight.moveRecord?.piece });
      } else {
        setLastMove(null);
      }
      clearSelection();
      if (animate && room.lastMoveBy && room.lastMoveBy !== uid && onlineStateRef.current.role === state.currentTurn) {
        void notifyTurn();
      }
    },
    [recordGameResult]
  );

  useEffect(() => {
    let cancelled = false;
    let unsub = () => {};

    void sessionService.completeRedirectSignIn().finally(() => {
      if (cancelled) return;
      unsub = sessionService.subscribeAuth(async (user) => {
        if (cancelled) return;
        if (!user) {
          const username = resolveDisplayName(onlineStateRef.current.username);
          storeDisplayName(username);
          setOnlineState((prev) => ({
            ...prev,
            uid: null,
            isSignedIn: false,
            isConnected: false,
            username: prev.username || username,
          }));
          return;
        }

        const isGoogle = !user.isAnonymous;
        const username = resolveDisplayName(onlineStateRef.current.username);
        storeDisplayName(username);
        setOnlineState((prev) => ({
          ...prev,
          uid: user.uid,
          isSignedIn: isGoogle,
          isConnected: true,
          username: prev.username || username,
        }));

        const local = loadJson<GameStats>(STORAGE.stats, EMPTY_STATS);
        try {
          const profile = await statsService.ensureProfile(user, local, username);
          if (cancelled) return;
          if (isGoogle) setStats(profile.stats);
          setOnlineState((prev) => ({
            ...prev,
            username: profile.displayName,
            roomId: profile.activeRoomId || prev.roomId,
          }));
          await sessionService.goOnline(profile.displayName, profile.photoURL);
          void registerFcmToken(user.uid);
        } catch (error) {
          soundEngine.playError();
          console.error(error);
          await sessionService.goOnline(username).catch(() => undefined);
        }
      });
    });

    return () => {
      cancelled = true;
      unsub();
    };
  }, []);

  useEffect(() => sessionService.subscribePresence(setLobbyUsers), []);

  useEffect(() => {
    const roomId = onlineState.roomId;
    const uid = onlineState.uid;
    if (!roomId || !uid) return;

    return sessionService.subscribeRoom(roomId, {
      onUpdate: (room) => {
        roomMetaRef.current = {
          createdAt: room.createdAt,
          restartAt: room.restartAt ?? null,
          players: roomPlayers(room),
        };
        setMatchStartedAt(room.restartAt ?? room.createdAt);
        setMatchEndedAt(room.status === 'finished' ? (room.lastMoveAt ?? Date.now()) : null);

        if (room.status === 'playing') {
          sessionService.persistRoom(roomId);
          if (indexedRoomRef.current !== roomId) {
            indexedRoomRef.current = roomId;
            void statsService.setActiveRoomId(uid, roomId);
          }
        }

        if (room.status === 'finished' && indexedRoomRef.current === roomId) {
          indexedRoomRef.current = null;
          void statsService.setActiveRoomId(uid, null);
        }

        if (pendingMatchRef.current && Object.keys(room.players ?? {}).length < 2) {
          pendingMatchRef.current = null;
          setPendingMatch(null);
          setMatchReady(false);
          setOpponentReady(false);
          void sessionService.leaveRoom(roomId);
          setOnlineState((prev) => ({ ...prev, ...CLEAR_MATCH }));
          return;
        }

        const opponent = opponentOf(room, uid);
        if (pendingMatchRef.current) {
          setOpponentReady(Boolean(opponent && room.players?.[opponent.id]?.ready));
          if (room.status === 'playing') {
            beginPendingGame();
          }
        }
        setOnlineState((prev) => ({
          ...prev,
          role: room.roles?.[uid] ?? prev.role,
          isMaster: room.hostUid === uid,
          opponentId: opponent?.id ?? null,
          opponentName: opponent?.name ?? null,
        }));

        const stamp = room.state?.stateAt ?? room.lastMoveAt ?? room.restartAt ?? 0;
        if (stamp !== lastAppliedStateAtRef.current) {
          const animate = lastAppliedStateAtRef.current !== 0 && room.lastMoveBy !== uid;
          lastAppliedStateAtRef.current = stamp;
          applyRoomSnapshot(room, uid, animate);
        }

        if (room.restartAt && room.restartAt !== lastRestartAtRef.current) {
          lastRestartAtRef.current = room.restartAt;
          if (!room.state) handleNewGame();
        }
      },
      onGone: () => {
        pendingMatchRef.current = null;
        setPendingMatch(null);
        setMatchReady(false);
        setOpponentReady(false);
        indexedRoomRef.current = null;
        lastAppliedStateAtRef.current = 0;
        setMatchStartedAt(0);
        setMatchEndedAt(null);
        setOnlineState((prev) => ({ ...prev, ...CLEAR_MATCH }));
        if (uid) void statsService.setActiveRoomId(uid, null);
      },
    });
  }, [onlineState.roomId, onlineState.uid, handleNewGame, beginPendingGame, applyRoomSnapshot]);

  const handleSelectPiece = useCallback((pos: Position) => {
    if (gameStatusRef.current !== 'playing' || isFrozenRef.current) return;
    const myRole = onlineStateRef.current.role;
    const curTurn = currentTurnRef.current;
    if (myRole && curTurn !== myRole) return;
    if (pos.r === -1 && pos.c === -1) {
      clearSelection();
      return;
    }
    const curBoard = boardRef.current;
    const piece = curBoard[pos.r]?.[pos.c];
    if (piece && piece.role === curTurn) {
      soundEngine.playSelect();
      setSelectedPos(pos);
      setValidMoves(getValidMoves(curBoard, pos));
    } else {
      clearSelection();
    }
  }, []);

  const handleMakeMove = useCallback(
    (from: Position, to: Position) => {
      if (isFrozenRef.current) return;
      const piece = boardRef.current[from.r]?.[from.c];
      if (!piece) return;
      const myRole = onlineStateRef.current.role;
      const curTurn = currentTurnRef.current;
      if (myRole && curTurn !== myRole) return;

      setHistoryStack((prev) => [...prev, { board: boardRef.current, turn: curTurn }]);

      const { newBoard, captured } = executeMove(boardRef.current, from, to);
      const nextTurn: PlayerRole = curTurn === 'defenders' ? 'attackers' : 'defenders';
      const moveRecord = createMoveRecord(
        { from, to, piece, captures: captured, board: newBoard },
        formatNotation(from, to, piece)
      );

      const dying = captured
        .map((pos) => ({ pos, piece: boardRef.current[pos.r]?.[pos.c] }))
        .filter((entry): entry is { pos: Position; piece: Piece } => Boolean(entry.piece));
      const nextHistory = [...moveHistoryRef.current, moveRecord];
      const nextScars = [
        ...scarsRef.current,
        ...dying.map(({ pos, piece: dead }) => ({
          r: pos.r,
          c: pos.c,
          role: dead.role,
          moveIndex: nextHistory.length,
        })),
      ];
      const statusCheck = checkGameStatus(newBoard, nextTurn);
      const stateAt = Date.now();

      applyMoveResult(newBoard, nextTurn, from, to, captured, piece, moveRecord);
      const roomId = onlineStateRef.current.roomId;
      if (roomId) {
        lastAppliedStateAtRef.current = stateAt;
        void sessionService.sendMove(
          roomId,
          { from, to, board: newBoard, nextTurn, moveRecord },
          {
            board: newBoard,
            currentTurn: nextTurn,
            moveHistory: nextHistory,
            scars: nextScars,
            gameStatus: statusCheck.status,
          },
          stateAt
        );
      }
    },
    [applyMoveResult]
  );

  const pendingOpponent = lobbyUsers.find((user) => user.id === pendingMatch?.opponentId);

  return (
    <div className="screen-safe w-full bg-norse-argyle text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      <div className={`w-full mx-auto px-4 sm:px-8 pt-3 sm:pt-5 pb-4 sm:pb-6 flex flex-col flex-1 min-h-0 ${viewMode === 'home' ? 'max-w-6xl' : 'max-w-4xl'}`}>
        {appUpdate.available && (
          <UpdateBanner
            currentId={appUpdate.currentId}
            latestId={appUpdate.latestId}
            onUpdate={() => {
              soundEngine.playSignIn();
              appUpdate.apply();
            }}
          />
        )}
        <Header
          canUndo={historyStack.length > 0}
          showMoveHistory={showMoveHistory}
          onlineState={onlineState}
          onlineCount={new Set(lobbyUsers.map((user) => user.id)).size}
          viewMode={viewMode}
          onUndo={handleUndo}
          onToggleMoveHistory={() => setShowMoveHistory((prev) => !prev)}
          onOpenRules={() => setIsRulesOpen(true)}
          onOpenSandbox={handleOpenSandbox}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onGoHome={handleGoHome}
          onRandomizeName={handleRandomizeName}
          onOpenPlayers={() => setIsPlayersOpen(true)}
          photoURL={onlineState.isSignedIn ? sessionService.accountInfo()?.photoURL : null}
        />

        <main className="flex-1 flex flex-col items-stretch justify-start sm:justify-center mt-5 sm:mt-6 w-full min-w-0">
          {viewMode === 'home' ? (
            <HomeView
              onlineState={onlineState}
              currentTurn={currentTurn}
              gameStatus={gameStatus}
              moveCount={moveHistory.length}
              pieceCounts={pieceCounts}
              matchStartedAt={matchStartedAt}
              matchEndedAt={matchEndedAt}
              onJoinQueue={handleJoinQueue}
              onLeaveQueue={handleLeaveQueue}
              onResign={handleResignRequest}
              onEnterBoard={() => (pendingMatch ? handleAcceptMatch() : setViewMode('game'))}
              onPlayAsGuest={() => void handlePlayAsGuest()}
              onSignIn={() => void handleSignIn()}
            />
          ) : boardBroken ? (
            <Panel
              knot
              className="px-6 py-10 sm:px-8 flex flex-col gap-5 w-full min-w-0"
            >
              <div className="space-y-3 max-w-prose">
                <h2 className="text-xl sm:text-2xl text-slate-100 font-semibold leading-tight">This match could not be restored</h2>
                <p className="text-base text-slate-200 leading-relaxed">
                  The board data is unreadable, likely from a mid-game reload. Return home and start another game.
                </p>
              </div>
              <div className="flex flex-col gap-3 w-full min-w-0">
                <Btn onClick={handleGoHome} variant="primary" size="lg" className="w-full">
                  Return home
                </Btn>
                {onlineState.roomId && (
                  <Btn onClick={handleResignRequest} variant="danger" size="lg" className="w-full">
                    Resign
                  </Btn>
                )}
              </div>
            </Panel>
          ) : (
            <>
              {(onlineState.roomId || isSandboxMode) && (
                <TurnBanner
                  currentTurn={currentTurn}
                  playerRole={onlineState.role}
                  moveCount={moveHistory.length}
                  lastMoveRecord={moveHistory[moveHistory.length - 1] || null}
                  isSandboxMode={isSandboxMode}
                  pieceCounts={pieceCounts}
                  isEscapeThreat={isEscapeThreat}
                  onResetBoard={handleNewGame}
                  onOpenHistory={() => setShowMoveHistory(true)}
                />
              )}
              <div className="w-full pt-2 sm:pt-3">
                <ViewErrorBoundary
                  resetKey={moveHistory.length}
                  onError={() => setBoardBroken(true)}
                  fallback={null}
                >
                  <motion.div ref={boardScope} className="w-full">
                    <Board
                      board={playBoard}
                      selectedPos={selectedPos}
                      validMoves={validMoves}
                      lastMove={lastMove}
                      dyingPieces={dyingPieces}
                      scars={scars}
                      moveCount={moveHistory.length}
                      currentTurn={currentTurn}
                      playerRole={onlineState.role}
                      showValidMoves={settings.showValidMoves}
                      juiceEnabled={settings.juiceEnabled}
                      isEscapeThreat={isEscapeThreat}
                      onSelectPiece={handleSelectPiece}
                      onMovePiece={(to) => {
                        if (selectedPos) handleMakeMove(selectedPos, to);
                      }}
                    />
                  </motion.div>
                </ViewErrorBoundary>
              </div>
            </>
          )}
        </main>
      </div>

      <MoveHistory isOpen={showMoveHistory} moves={moveHistory} onClose={() => setShowMoveHistory(false)} />
      <PlayersModal isOpen={isPlayersOpen} users={lobbyUsers} onClose={() => setIsPlayersOpen(false)} />
      <MatchFoundModal
        isOpen={Boolean(pendingMatch)}
        opponentName={pendingMatch?.opponentName || onlineState.opponentName || ''}
        opponentPhotoURL={pendingOpponent?.photoURL}
        opponentSignedIn={pendingOpponent?.signedIn}
        yourRole={pendingMatch?.role || onlineState.role || 'defenders'}
        accepted={matchReady}
        opponentReady={opponentReady}
        onJoin={handleAcceptMatch}
        onLeave={handleDeclineMatch}
      />
      <ResignModal
        isOpen={isResignOpen}
        onCancel={() => setIsResignOpen(false)}
        onConfirm={handleResignConfirm}
      />
      <VictoryModal
        status={gameStatus}
        reason={statusReason}
        totalMoves={moveHistory.length}
        onReplay={handleRematch}
        onClose={() => setGameStatus('playing')}
      />
      <RulesModal isOpen={isRulesOpen} onClose={handleCloseRules} />
      <SettingsModal
        isOpen={isSettingsOpen}
        settings={settings}
        stats={stats}
        onUpdateSettings={(newS) => setSettings((prev) => ({ ...prev, ...newS }))}
        onResetStats={handleResetStats}
        isSignedIn={onlineState.isSignedIn}
        account={onlineState.isSignedIn ? sessionService.accountInfo() : null}
        username={onlineState.username}
        onSignOut={onlineState.isSignedIn ? handleSignOut : undefined}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}
