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
  LobbyUser,
  MatchFound,
  Move,
  MovePayload,
  OnlineMatchState,
  Piece,
  PlayerRole,
  Position,
  Scar,
} from './types';
import {
  checkGameStatus,
  countPieces,
  createInitialBoard,
  executeMove,
  formatNotation,
  getValidMoves,
  isKingThreatened,
} from './utils/hnefataflEngine';
import { JUICE, hitStopDuration, shakeAmplitude, useScreenShake } from './utils/juice';
import { createMoveRecord } from './utils/sagaVoice';
import { soundEngine } from './utils/soundEngine';
import { opponentOf, resolveDisplayName, roomPlayers, sessionService, storeDisplayName } from './utils/sessionService';
import { applyOnlineResult, applyRoleTally, personalResult, statsService, winnerFromStatus } from './utils/statsService';
import { generateRandomNorseName } from './utils/norseNames';
import { notifyTurn, requestTurnNotifications } from './utils/turnNotifier';
import { useBackButton } from './utils/useBackButton';
import { Header } from './components/Header';
import { TurnBanner } from './components/TurnBanner';
import { Board } from './components/Board';
import { VictoryModal } from './components/VictoryModal';
import { RulesModal } from './components/RulesModal';
import { SettingsModal } from './components/SettingsModal';
import { PlayersModal } from './components/PlayersModal';
import { MoveHistory } from './components/MoveHistory';
import { HomeView } from './components/HomeView';
import { UpdateBanner } from './components/UpdateBanner';
import { celticKnotClass } from './components/ui';
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
    navigator.vibrate(killedKing ? [30, 50, 30, 50, 80] : [20, 40, 20]);
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
  const [isSandboxMode, setIsSandboxMode] = useState(false);
  const [settings, setSettings] = useState<GameSettings>({
    soundEnabled: true,
    showValidMoves: true,
    juiceEnabled: true,
  });
  const [stats, setStats] = useState<GameStats>(() => ({ ...EMPTY_STATS, ...loadJson(STORAGE.stats, EMPTY_STATS) }));

  const appUpdate = useAppUpdate();
  const pieceCounts = useMemo(() => countPieces(board), [board]);
  const isEscapeThreat = useMemo(() => isKingThreatened(board), [board]);
  const { scope: boardScope, shake } = useScreenShake(settings.juiceEnabled);

  const boardRef = useRef(board);
  const currentTurnRef = useRef(currentTurn);
  const onlineStateRef = useRef(onlineState);
  const moveHistoryRef = useRef(moveHistory);
  const historyStackRef = useRef(historyStack);
  const gameStatusRef = useRef(gameStatus);
  const prevEscapeThreatRef = useRef(false);
  const isReconnectingRef = useRef(false);
  const isFrozenRef = useRef(false);
  const handleRemoteMoveRef = useRef<((data: MovePayload) => void) | null>(null);
  const lastAppliedMoveAtRef = useRef(0);
  const lastRestartAtRef = useRef(0);
  const roomMetaRef = useRef({ createdAt: 0, restartAt: null as number | null, players: {} as Record<string, { role: PlayerRole; displayName: string }> });

  boardRef.current = board;
  currentTurnRef.current = currentTurn;
  onlineStateRef.current = onlineState;
  moveHistoryRef.current = moveHistory;
  historyStackRef.current = historyStack;
  gameStatusRef.current = gameStatus;

  useEffect(() => {
    localStorage.setItem(STORAGE.stats, JSON.stringify(stats));
  }, [stats]);

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
    if (parsed.board) setBoard(parsed.board as BoardState);
    if (parsed.currentTurn) setCurrentTurn(parsed.currentTurn as PlayerRole);
    if (Array.isArray(parsed.moveHistory)) {
      const history = parsed.moveHistory as Move[];
      setMoveHistory(history);
      if (history.length > 0) {
        const last = history[history.length - 1];
        setLastMove({ from: last.from, to: last.to, piece: last.piece });
      }
    }
    if (parsed.historyStack) setHistoryStack(parsed.historyStack as GameSnapshot[]);
    if (Array.isArray(parsed.scars)) setScars(parsed.scars as Scar[]);
    if (parsed.gameStatus) setGameStatus(parsed.gameStatus as GameStatus);
    if (parsed.onlineState) {
      setOnlineState((prev) => ({
        ...prev,
        ...(parsed.onlineState as Partial<OnlineMatchState>),
        isConnected: prev.isConnected,
        isSignedIn: prev.isSignedIn,
        uid: prev.uid,
        inQueue: false,
      }));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      STORAGE.save,
      JSON.stringify({
        board,
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
            playerId: sessionService.playerId(),
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
  }, []);

  const enterMatch = useCallback(
    (match: MatchFound) => {
      requestTurnNotifications();
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
      handleNewGame();
      setViewMode('game');
    },
    [handleNewGame]
  );

  const handleRematch = useCallback(() => {
    handleNewGame();
    if (onlineStateRef.current.roomId) void sessionService.restartGame(onlineStateRef.current.roomId);
  }, [handleNewGame]);

  const handleOpenSandbox = useCallback(() => {
    setIsSandboxMode(true);
    setOnlineState((prev) => ({ ...prev, ...CLEAR_MATCH }));
    setViewMode('game');
    handleNewGame();
  }, [handleNewGame]);

  const handleGoHome = useCallback(() => {
    setViewMode('home');
    setIsSandboxMode(false);
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
    const roomId = onlineStateRef.current.roomId;
    setOnlineState((prev) => ({
      ...EMPTY_ONLINE,
      username: prev.username,
      uid: sessionService.playerId(),
    }));
    setViewMode('home');
    setIsSettingsOpen(false);
    void (async () => {
      if (roomId) await sessionService.leaveRoom(roomId).catch(() => undefined);
      await sessionService.signOut().catch(() => {
        soundEngine.playError();
      });
    })();
  }, []);

  const handleJoinQueue = useCallback(() => {
    if (!onlineStateRef.current.isConnected) return;
    setOnlineState((prev) => ({ ...prev, inQueue: true }));
    void sessionService.joinQueue(onlineStateRef.current.username, enterMatch);
  }, [enterMatch]);

  const handleLeaveQueue = useCallback(() => {
    void sessionService.leaveQueue();
    setOnlineState((prev) => ({ ...prev, inQueue: false }));
  }, []);

  const handleLeaveRoom = useCallback(() => {
    const roomId = onlineStateRef.current.roomId;
    if (roomId) void sessionService.leaveRoom(roomId);
    setOnlineState((prev) => ({ ...prev, ...CLEAR_MATCH }));
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
      if (isRulesOpen || isSettingsOpen || isPlayersOpen || gameStatus !== 'playing') return;
      if (e.key === 'u' || e.key === 'U') handleUndo();
      else if (e.key === 'm' || e.key === 'M') setSettings((prev) => ({ ...prev, soundEnabled: !prev.soundEnabled }));
      else if (e.key === 'r' || e.key === 'R') setIsRulesOpen(true);
      else if (e.key === 'h' || e.key === 'H') setShowMoveHistory((prev) => !prev);
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isRulesOpen, isSettingsOpen, isPlayersOpen, gameStatus, handleUndo]);

  useBackButton(() => {
    if (showMoveHistory) setShowMoveHistory(false);
    else if (isPlayersOpen) setIsPlayersOpen(false);
    else if (isSettingsOpen) setIsSettingsOpen(false);
    else if (isRulesOpen) handleCloseRules();
    else if (gameStatus !== 'playing') setGameStatus('playing');
    else if (viewMode === 'game') handleGoHome();
    else return false;
    return true;
  });

  const handleRemoteMove = useCallback(
    (data: MovePayload) => {
      const { from, to, board: incomingBoard, nextTurn: incomingNextTurn, moveRecord } = data;
      let finalBoard: BoardState;
      let captured: Position[] = [];

      if (incomingBoard && incomingNextTurn) {
        finalBoard = incomingBoard;
        captured = moveRecord?.captures || [];
      } else {
        const res = executeMove(boardRef.current, from, to);
        finalBoard = res.newBoard;
        captured = res.captured;
      }

      const nextTurn = incomingNextTurn || (currentTurnRef.current === 'defenders' ? 'attackers' : 'defenders');
      if (onlineStateRef.current.role === nextTurn) notifyTurn();

      const remotePiece =
        moveRecord?.piece ??
        (incomingBoard ? incomingBoard[to.r]?.[to.c] : undefined) ??
        finalBoard[to.r]?.[to.c] ??
        undefined;

      let record = moveRecord;
      if (!record && remotePiece) {
        record = createMoveRecord(
          { from, to, piece: remotePiece, captures: captured, board: finalBoard },
          formatNotation(from, to, remotePiece)
        );
      }

      applyMoveResult(finalBoard, nextTurn, from, to, captured, remotePiece, record);
    },
    [applyMoveResult]
  );

  useEffect(() => {
    handleRemoteMoveRef.current = handleRemoteMove;
  }, [handleRemoteMove]);

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
            uid: sessionService.playerId(),
            isSignedIn: false,
            isConnected: false,
            username: prev.username || username,
          }));
          return;
        }

        const isGoogle = !user.isAnonymous;
        const username = resolveDisplayName(onlineStateRef.current.username);
        storeDisplayName(username);

        if (onlineStateRef.current.roomId) isReconnectingRef.current = true;
        setOnlineState((prev) => ({
          ...prev,
          uid: sessionService.playerId(),
          isSignedIn: isGoogle,
          isConnected: true,
          username: prev.username || username,
        }));

        if (!isGoogle) {
          await sessionService.goOnline(username);
          return;
        }

        const local = loadJson<GameStats>(STORAGE.stats, EMPTY_STATS);
        try {
          const profile = await statsService.ensureProfile(user, local, username);
          if (cancelled) return;
          setStats(profile.stats);
          setOnlineState((prev) => ({ ...prev, username: profile.displayName }));
          await sessionService.goOnline(profile.displayName);
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

        if (Object.keys(room.players ?? {}).length >= 2) sessionService.persistRoom(roomId);

        const opponent = opponentOf(room, uid);
        setOnlineState((prev) => ({
          ...prev,
          role: room.roles?.[uid] ?? prev.role,
          isMaster: room.hostUid === uid,
          opponentId: opponent?.id ?? null,
          opponentName: opponent?.name ?? null,
        }));

        if (isReconnectingRef.current) {
          isReconnectingRef.current = false;
          lastAppliedMoveAtRef.current = room.lastMoveAt ?? 0;
          lastRestartAtRef.current = room.restartAt ?? 0;
          if (room.state) {
            setBoard(room.state.board);
            boardRef.current = room.state.board;
            setCurrentTurn(room.state.currentTurn);
            currentTurnRef.current = room.state.currentTurn;
            void sessionService.sendState(roomId, boardRef.current, currentTurnRef.current);
          }
          return;
        }

        if (
          room.lastMove &&
          room.lastMoveBy &&
          room.lastMoveBy !== uid &&
          (room.lastMoveAt ?? 0) !== lastAppliedMoveAtRef.current
        ) {
          lastAppliedMoveAtRef.current = room.lastMoveAt ?? 0;
          handleRemoteMoveRef.current?.(room.lastMove);
        }

        if (room.restartAt && room.restartAt !== lastRestartAtRef.current) {
          lastRestartAtRef.current = room.restartAt;
          handleNewGame();
        }
      },
      onGone: () => {
        setOnlineState((prev) => ({ ...prev, ...CLEAR_MATCH }));
      },
    });
  }, [onlineState.roomId, onlineState.uid, handleNewGame]);

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

      applyMoveResult(newBoard, nextTurn, from, to, captured, piece, moveRecord);
      const roomId = onlineStateRef.current.roomId;
      if (roomId) {
        void sessionService.sendMove(roomId, { from, to, board: newBoard, nextTurn, moveRecord }, newBoard, nextTurn);
      }
    },
    [applyMoveResult]
  );

  return (
    <div className="screen-safe w-full bg-norse-argyle text-slate-100 flex flex-col justify-between font-sans selection:bg-amber-500 selection:text-slate-950">
      <div className="w-full px-4 pt-3 sm:pt-4">
        {appUpdate.available && (
          <UpdateBanner
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
      </div>

      <main className="flex-1 flex flex-col items-center justify-start sm:justify-center my-4 sm:my-3 px-0 sm:px-4 pb-3 sm:pb-4 w-full">
        {viewMode === 'home' ? (
          <HomeView
            onlineState={onlineState}
            onJoinQueue={handleJoinQueue}
            onLeaveQueue={handleLeaveQueue}
            onLeaveRoom={handleLeaveRoom}
            onEnterBoard={() => setViewMode('game')}
            onPlayAsGuest={() => void handlePlayAsGuest()}
            onSignIn={() => void handleSignIn()}
          />
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
            <div className="w-full flex justify-center items-center py-4">
              <motion.div
                ref={boardScope}
                className={celticKnotClass(isEscapeThreat, 'p-2 sm:p-3')}
              >
                <Board
                  board={board}
                  selectedPos={selectedPos}
                  validMoves={validMoves}
                  lastMove={lastMove}
                  dyingPieces={dyingPieces}
                  scars={scars}
                  moveCount={moveHistory.length}
                  currentTurn={currentTurn}
                  showValidMoves={settings.showValidMoves}
                  juiceEnabled={settings.juiceEnabled}
                  isEscapeThreat={isEscapeThreat}
                  onSelectPiece={handleSelectPiece}
                  onMovePiece={(to) => {
                    if (selectedPos) handleMakeMove(selectedPos, to);
                  }}
                />
              </motion.div>
            </div>
          </>
        )}
      </main>

      <MoveHistory isOpen={showMoveHistory} moves={moveHistory} onClose={() => setShowMoveHistory(false)} />
      <PlayersModal isOpen={isPlayersOpen} users={lobbyUsers} onClose={() => setIsPlayersOpen(false)} />
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
