import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  BoardState,
  GameSettings,
  GameStats,
  GameStatus,
  LobbyUser,
  Move,
  OnlineMatchState,
  Piece,
  PlayerRole,
  Position,
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
import { soundEngine } from './utils/soundEngine';
import { socketService } from './utils/socketService';
import { generateRandomNorseName } from './utils/norseNames';
import { Header } from './components/Header';
import { TurnBanner } from './components/TurnBanner';
import { Board } from './components/Board';
import { VictoryModal } from './components/VictoryModal';
import { RulesModal } from './components/RulesModal';
import { SettingsModal } from './components/SettingsModal';
import { MoveHistory } from './components/MoveHistory';
import { OnlineLobbyModal } from './components/OnlineLobbyModal';
import { HomeView } from './components/HomeView';

export default function App() {
  // Navigation / View Mode
  const [viewMode, setViewMode] = useState<'home' | 'game'>('home');

  // Game state
  const [board, setBoard] = useState<BoardState>(() => createInitialBoard());
  const [currentTurn, setCurrentTurn] = useState<PlayerRole>('defenders');
  const [selectedPos, setSelectedPos] = useState<Position | null>(null);
  const [validMoves, setValidMoves] = useState<Position[]>([]);
  const [lastMove, setLastMove] = useState<{ from: Position; to: Position; piece?: Piece } | null>(null);
  const [capturingPositions, setCapturingPositions] = useState<Position[]>([]);
  
  const [gameStatus, setGameStatus] = useState<GameStatus>('playing');
  const [statusReason, setStatusReason] = useState<string>('');

  // Move history and undo stack
  const [moveHistory, setMoveHistory] = useState<Move[]>([]);
  const [historyStack, setHistoryStack] = useState<{ board: BoardState; turn: PlayerRole }[]>([]);

  // UI Drawer / Modals
  const [showMoveHistory, setShowMoveHistory] = useState<boolean>(false);
  const [isLobbyOpen, setIsLobbyOpen] = useState<boolean>(false);
  const [lobbyUsers, setLobbyUsers] = useState<LobbyUser[]>([]);

  // Online Multiplayer Socket.IO state
  const [onlineState, setOnlineState] = useState<OnlineMatchState>({
    roomId: null,
    role: null,
    isMaster: false,
    opponentId: null,
    opponentName: null,
    isConnected: false,
    inQueue: false,
    username: '',
  });

  const [isRulesOpen, setIsRulesOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isSandboxMode, setIsSandboxMode] = useState<boolean>(false);

  const [settings, setSettings] = useState<GameSettings>({
    soundEnabled: true,
    hapticsEnabled: true,
    gridStyle: 'dots',
    accentColor: 'amber',
    showValidMoves: true,
  });

  // Battle Records Stats
  const [stats, setStats] = useState<GameStats>(() => {
    if (typeof window === 'undefined') {
      return { defendersWins: 0, attackersWins: 0, totalGames: 0, totalMoves: 0, fastestWinMoves: null };
    }
    const saved = localStorage.getItem('hnefatafl_stats_v1');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse stats:', e);
      }
    }
    return { defendersWins: 0, attackersWins: 0, totalGames: 0, totalMoves: 0, fastestWinMoves: null };
  });

  useEffect(() => {
    localStorage.setItem('hnefatafl_stats_v1', JSON.stringify(stats));
  }, [stats]);

  // Derived Piece Counts & Escape Threat
  const pieceCounts = useMemo(() => countPieces(board), [board]);
  const isEscapeThreat = useMemo(() => isKingThreatened(board), [board]);

  const prevEscapeThreatRef = useRef<boolean>(false);
  useEffect(() => {
    if (isEscapeThreat && !prevEscapeThreatRef.current && gameStatus === 'playing') {
      soundEngine.playEscapeThreat();
    }
    prevEscapeThreatRef.current = isEscapeThreat;
  }, [isEscapeThreat, gameStatus]);

  // Keep state refs in sync to prevent stale closure bugs
  const boardRef = useRef<BoardState>(board);
  useEffect(() => { boardRef.current = board; }, [board]);

  const currentTurnRef = useRef<PlayerRole>(currentTurn);
  useEffect(() => { currentTurnRef.current = currentTurn; }, [currentTurn]);

  const onlineStateRef = useRef<OnlineMatchState>(onlineState);
  useEffect(() => { onlineStateRef.current = onlineState; }, [onlineState]);

  const settingsRef = useRef<GameSettings>(settings);
  useEffect(() => { settingsRef.current = settings; }, [settings]);

  const isReconnectingRef = useRef(false);

  // Request Notification Permission
  const requestNotificationPermission = useCallback(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Send Notification
  const notifyTurn = useCallback(() => {
    if (
      'Notification' in window &&
      Notification.permission === 'granted' &&
      document.visibilityState !== 'visible'
    ) {
      new Notification('Your Turn!', {
        body: 'It is your turn to move in Hnefatafl.',
        icon: '/pwa-192x192.png',
      });
    }
  }, []);

  // Rules modal initial load check
  useEffect(() => {
    const hasReadRules = localStorage.getItem('hnefatafl_rules_read');
    if (!hasReadRules) {
      setIsRulesOpen(true);
    }
  }, []);

  const handleCloseRules = useCallback(() => {
    localStorage.setItem('hnefatafl_rules_read', 'true');
    setIsRulesOpen(false);
  }, []);

  // Local Storage Save/Load
  useEffect(() => {
    // Load state on mount
    const savedState = localStorage.getItem('hnefatafl_save');
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        if (parsed.board) setBoard(parsed.board);
        if (parsed.currentTurn) setCurrentTurn(parsed.currentTurn);
        if (parsed.moveHistory) {
          setMoveHistory(parsed.moveHistory);
          if (parsed.moveHistory.length > 0) {
            const last = parsed.moveHistory[parsed.moveHistory.length - 1];
            setLastMove({ from: last.from, to: last.to, piece: last.piece });
          }
        }
        if (parsed.historyStack) setHistoryStack(parsed.historyStack);
        if (parsed.gameStatus) setGameStatus(parsed.gameStatus);
        if (parsed.onlineState) {
          // Do not overwrite isConnected or inQueue
          setOnlineState((prev) => ({
            ...prev,
            ...parsed.onlineState,
            isConnected: prev.isConnected,
            inQueue: false,
          }));
        }
      } catch (e) {
        console.error('Failed to load save state:', e);
      }
    }
  }, []);

  useEffect(() => {
    // Save state on change
    const stateToSave = {
      board,
      currentTurn,
      moveHistory,
      historyStack,
      gameStatus,
      onlineState: {
        roomId: onlineState.roomId,
        role: onlineState.role,
        isMaster: onlineState.isMaster,
        opponentId: onlineState.opponentId,
        opponentName: onlineState.opponentName,
        username: onlineState.username,
      },
    };
    localStorage.setItem('hnefatafl_save', JSON.stringify(stateToSave));
  }, [board, currentTurn, moveHistory, historyStack, gameStatus, onlineState]);

  // Keep soundEngine in sync with settings
  useEffect(() => {
    soundEngine.setEnabled(settings.soundEnabled);
  }, [settings.soundEnabled]);

  const recordGameResult = useCallback((status: GameStatus, totalMoveCount: number) => {
    if (status === 'playing') return;
    setStats(prev => {
      const isDef = status === 'defenders_win';
      const isAtk = status === 'attackers_win';
      const newDefWins = isDef ? prev.defendersWins + 1 : prev.defendersWins;
      const newAtkWins = isAtk ? prev.attackersWins + 1 : prev.attackersWins;
      const newTotalGames = prev.totalGames + 1;
      const newTotalMoves = prev.totalMoves + totalMoveCount;
      const newFastest = (prev.fastestWinMoves === null || (totalMoveCount > 0 && totalMoveCount < prev.fastestWinMoves))
        ? totalMoveCount
        : prev.fastestWinMoves;

      return {
        defendersWins: newDefWins,
        attackersWins: newAtkWins,
        totalGames: newTotalGames,
        totalMoves: newTotalMoves,
        fastestWinMoves: newFastest,
      };
    });
  }, []);

  // Global Keyboard Shortcuts (U = Undo, M = Mute sound, R = Rules, H = History)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') {
        return;
      }
      if (isRulesOpen || isSettingsOpen || isLobbyOpen || gameStatus !== 'playing') {
        return;
      }

      if (e.key === 'u' || e.key === 'U') {
        handleUndo();
      } else if (e.key === 'm' || e.key === 'M') {
        setSettings(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }));
      } else if (e.key === 'r' || e.key === 'R') {
        setIsRulesOpen(true);
      } else if (e.key === 'h' || e.key === 'H') {
        setShowMoveHistory(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isRulesOpen, isSettingsOpen, isLobbyOpen, gameStatus]);

  // Restart / Reset Game
  const handleNewGame = useCallback(() => {
    const initB = createInitialBoard();
    setBoard(initB);
    boardRef.current = initB;

    setCurrentTurn('defenders');
    currentTurnRef.current = 'defenders';

    setSelectedPos(null);
    setValidMoves([]);
    setLastMove(null);
    setCapturingPositions([]);
    setMoveHistory([]);
    setHistoryStack([]);
    setGameStatus('playing');
    setStatusReason('');
  }, []);

  const handleOpenSandbox = useCallback(() => {
    setIsSandboxMode(true);
    setOnlineState(prev => ({ ...prev, roomId: null, role: null }));
    setViewMode('game');
    handleNewGame();
  }, [handleNewGame]);

  // Remote Move Handler Ref
  const handleRemoteMoveRef = useRef<((data: {
    from: Position;
    to: Position;
    board?: BoardState;
    nextTurn?: PlayerRole;
    moveRecord?: Move;
  }) => void) | null>(null);

  const handleRemoteMove = useCallback((data: {
    from: Position;
    to: Position;
    board?: BoardState;
    nextTurn?: PlayerRole;
    moveRecord?: Move;
  }) => {
    const { from, to, board: incomingBoard, nextTurn: incomingNextTurn, moveRecord } = data;

    let finalBoard: BoardState;
    let captured: Position[] = [];

    if (incomingBoard && incomingNextTurn) {
      finalBoard = incomingBoard;
      if (moveRecord && moveRecord.captures) {
        captured = moveRecord.captures;
      }
    } else {
      const res = executeMove(boardRef.current, from, to);
      finalBoard = res.newBoard;
      captured = res.captured;
    }

    setBoard(finalBoard);
    boardRef.current = finalBoard;

    const nextTurn = incomingNextTurn || (currentTurnRef.current === 'defenders' ? 'attackers' : 'defenders');
    setCurrentTurn(nextTurn);
    currentTurnRef.current = nextTurn;

    if (onlineStateRef.current.role === nextTurn) {
      notifyTurn();
    }

    const remotePiece = moveRecord?.piece || boardRef.current[from.r]?.[from.c] || (incomingBoard ? incomingBoard[to.r]?.[to.c] : undefined);
    setLastMove({ from, to, piece: remotePiece });
    setSelectedPos(null);
    setValidMoves([]);

    if (captured.length > 0) {
      setCapturingPositions(captured);
      soundEngine.playCapture();
      if (settingsRef.current.hapticsEnabled && typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([20, 40, 20]);
      }
      setTimeout(() => setCapturingPositions([]), 400);
    } else {
      soundEngine.playMove();
    }

    if (moveRecord) {
      setMoveHistory(prev => [...prev, moveRecord]);
    } else {
      const piece = finalBoard[to.r]?.[to.c];
      if (piece) {
        const notation = formatNotation(from, to, piece);
        setMoveHistory(prev => [...prev, {
          from,
          to,
          piece,
          captures: captured,
          timestamp: Date.now(),
          notation,
        }]);
      }
    }

    const statusCheck = checkGameStatus(finalBoard, nextTurn);
    if (statusCheck.status !== 'playing') {
      setGameStatus(statusCheck.status);
      setStatusReason(statusCheck.reason || '');
      soundEngine.playVictory();
      recordGameResult(statusCheck.status, moveHistory.length + 1);
    }
  }, []);

  useEffect(() => {
    handleRemoteMoveRef.current = handleRemoteMove;
  }, [handleRemoteMove]);

  // Connect & handle Socket.IO peer messages
  useEffect(() => {
    const socket = socketService.connect();

    socket.on('connected', ({ userId: _userId, username }) => {
      setOnlineState((prev) => {
        if (prev.roomId) {
           isReconnectingRef.current = true;
           socketService.joinRoom(prev.roomId);
        }
        return {
          ...prev,
          isConnected: true,
          username: prev.username || username,
        };
      });
    });

    socket.on('lobby:users', (users: LobbyUser[]) => {
      setLobbyUsers(users);
    });

    socket.on('match:found', (data: {
      roomId: string;
      role: PlayerRole;
      opponentId: string;
      opponentName: string;
      isMaster: boolean;
    }) => {
      requestNotificationPermission();
      setOnlineState((prev) => ({
        ...prev,
        roomId: data.roomId,
        role: data.role,
        isMaster: data.isMaster,
        opponentId: data.opponentId,
        opponentName: data.opponentName,
        inQueue: false,
      }));

      handleNewGame();
      setIsLobbyOpen(false);
      setViewMode('game');
    });

    socket.on('room:created', (data: { roomId: string; isMaster: boolean; role: PlayerRole }) => {
      requestNotificationPermission();
      setOnlineState((prev) => ({
        ...prev,
        roomId: data.roomId,
        isMaster: data.isMaster,
        role: data.role,
      }));
      handleNewGame();
      setViewMode('game');
    });

    socket.on('room:joined', (data: { roomId: string; isMaster: boolean; role: PlayerRole }) => {
      requestNotificationPermission();
      setOnlineState((prev) => ({
        ...prev,
        roomId: data.roomId,
        // If we are reconnecting, we probably shouldn't blindly overwrite our old role
        isMaster: isReconnectingRef.current ? prev.isMaster : data.isMaster,
        role: isReconnectingRef.current ? prev.role : data.role,
      }));
      
      if (isReconnectingRef.current) {
        isReconnectingRef.current = false;
        socketService.sendStateSync(boardRef.current, currentTurnRef.current);
      } else {
        handleNewGame();
      }
      setViewMode('game');
    });

    socket.on('room:player_joined', (data: { playerId: string; playerName: string }) => {
      setOnlineState((prev) => ({
        ...prev,
        opponentId: data.playerId,
        opponentName: data.playerName,
      }));
      setIsLobbyOpen(false);
    });

    socket.on('room:player_left', () => {
      setOnlineState((prev) => ({
        ...prev,
        opponentId: null,
        opponentName: null,
      }));
    });

    socket.on('game:move', (data: {
      from: Position;
      to: Position;
      board?: BoardState;
      nextTurn?: PlayerRole;
      moveRecord?: Move;
    }) => {
      if (handleRemoteMoveRef.current) {
        handleRemoteMoveRef.current(data);
      }
    });

    socket.on('game:restart', () => {
      handleNewGame();
    });

    socket.on('game:state_sync', (syncedData: { board: BoardState; currentTurn: PlayerRole }) => {
      setBoard(syncedData.board);
      boardRef.current = syncedData.board;
      setCurrentTurn(syncedData.currentTurn);
      currentTurnRef.current = syncedData.currentTurn;
    });

    socket.on('room:error', (errMsg: string) => {
      alert(errMsg || 'Failed to join room.');
      setOnlineState(prev => ({ ...prev, roomId: null, role: null }));
    });

    return () => {
      socket.off('connected');
      socket.off('lobby:users');
      socket.off('match:found');
      socket.off('room:created');
      socket.off('room:joined');
      socket.off('room:player_joined');
      socket.off('room:player_left');
      socket.off('room:error');
      socket.off('game:move');
      socket.off('game:restart');
      socket.off('game:state_sync');
    };
  }, [handleNewGame]);

  // Handle piece selection
  const handleSelectPiece = useCallback(
    (pos: Position) => {
      if (gameStatus !== 'playing') return;

      const myRole = onlineStateRef.current.role;
      const curTurn = currentTurnRef.current;

      // In online mode, only allow selecting if it's your turn and role matches
      if (myRole && curTurn !== myRole) {
        return;
      }

      if (pos.r === -1 && pos.c === -1) {
        setSelectedPos(null);
        setValidMoves([]);
        return;
      }

      const curBoard = boardRef.current;
      const piece = curBoard[pos.r]?.[pos.c];
      if (piece && piece.role === curTurn) {
        soundEngine.playSelect();
        setSelectedPos(pos);
        const moves = getValidMoves(curBoard, pos);
        setValidMoves(moves);
      } else {
        setSelectedPos(null);
        setValidMoves([]);
      }
    },
    [gameStatus]
  );

  // Execute local move logic
  const handleMakeMove = useCallback(
    (from: Position, to: Position) => {
      const piece = boardRef.current[from.r]?.[from.c];
      if (!piece) return;

      const myRole = onlineStateRef.current.role;
      const curTurn = currentTurnRef.current;

      if (myRole && curTurn !== myRole) {
        return;
      }

      const { newBoard, captured } = executeMove(boardRef.current, from, to);
      const nextTurn: PlayerRole = curTurn === 'defenders' ? 'attackers' : 'defenders';

      const notation = formatNotation(from, to, piece);
      const moveRecord: Move = {
        from,
        to,
        piece,
        captures: captured,
        timestamp: Date.now(),
        notation,
      };

      setBoard(newBoard);
      boardRef.current = newBoard;

      setCurrentTurn(nextTurn);
      currentTurnRef.current = nextTurn;

      setLastMove({ from, to, piece });
      setSelectedPos(null);
      setValidMoves([]);

      setMoveHistory(prev => [...prev, moveRecord]);
      setHistoryStack(prev => [...prev, { board: newBoard, turn: nextTurn }]);

      if (captured.length > 0) {
        setCapturingPositions(captured);
        soundEngine.playCapture();
        if (settingsRef.current.hapticsEnabled && typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate([20, 40, 20]);
        }
        setTimeout(() => setCapturingPositions([]), 400);
      } else {
        if (piece.type === 'king') {
          soundEngine.playKingMove();
        } else {
          soundEngine.playMove();
        }
      }

      // Send payload over Socket.IO to opponent
      socketService.sendMove({
        from,
        to,
        board: newBoard,
        nextTurn,
        moveRecord,
      });

      // Check win condition
      const statusCheck = checkGameStatus(newBoard, nextTurn);
      if (statusCheck.status !== 'playing') {
        setGameStatus(statusCheck.status);
        setStatusReason(statusCheck.reason || '');
        soundEngine.playVictory();
        recordGameResult(statusCheck.status, moveHistory.length + 1);
      }
    },
    []
  );

  // Undo move
  const handleUndo = () => {
    if (historyStack.length === 0 || gameStatus !== 'playing') return;

    const targetStateIndex = historyStack.length - 1;
    const targetState = historyStack[targetStateIndex];

    if (targetState) {
      setBoard(targetState.board);
      boardRef.current = targetState.board;

      setCurrentTurn(targetState.turn);
      currentTurnRef.current = targetState.turn;

      const newHistory = moveHistory.slice(0, moveHistory.length - 1);
      setHistoryStack(prev => prev.slice(0, targetStateIndex));
      setMoveHistory(newHistory);
      setSelectedPos(null);
      setValidMoves([]);

      if (newHistory.length > 0) {
        const prevMove = newHistory[newHistory.length - 1];
        setLastMove({ from: prevMove.from, to: prevMove.to, piece: prevMove.piece });
      } else {
        setLastMove(null);
      }
    }
  };

  return (
    <div className="min-h-screen w-full bg-norse-argyle text-slate-100 flex flex-col justify-between px-0 py-2 sm:p-4 font-sans selection:bg-amber-500 selection:text-slate-950">
      
      {/* Top Header Bar Container */}
      <div className="w-full px-1 sm:px-0">
        <Header
          canUndo={historyStack.length > 0}
          showMoveHistory={showMoveHistory}
          onlineState={onlineState}
          onlineCount={lobbyUsers.length}
          viewMode={viewMode}
          onUndo={handleUndo}
          onToggleMoveHistory={() => setShowMoveHistory(prev => !prev)}
          onOpenRules={() => setIsRulesOpen(true)}
          onOpenSandbox={handleOpenSandbox}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onGoHome={() => {
            setViewMode('home');
            setIsSandboxMode(false);
          }}
          onRandomizeName={() => {
            const existingNames = lobbyUsers.map(u => u.username);
            const newName = generateRandomNorseName(existingNames);
            socketService.setUsername(newName);
            setOnlineState(prev => ({ ...prev, username: newName }));
          }}
        />
      </div>

      {/* Main Area: Home View or Playing Board */}
      <main className="flex-1 flex flex-col items-center justify-start sm:justify-center my-4 sm:my-3 px-0 w-full">
        {viewMode === 'home' ? (
          <HomeView
            onlineState={onlineState}
            lobbyUsers={lobbyUsers}
            onSetUsername={(name) => {
              socketService.setUsername(name);
              setOnlineState(prev => ({ ...prev, username: name }));
            }}
            onJoinQueue={() => {
              socketService.joinQueue();
              setOnlineState(prev => ({ ...prev, inQueue: true }));
            }}
            onLeaveQueue={() => {
              socketService.leaveQueue();
              setOnlineState(prev => ({ ...prev, inQueue: false }));
            }}
            onEnterBoard={() => setViewMode('game')}
          />
        ) : (
          <>
            {/* Turn Status & Side Role Indicator Banner (Only shown in active game or sandbox) */}
            {(onlineState.roomId || isSandboxMode) && (
              <TurnBanner
                currentTurn={currentTurn}
                playerRole={onlineState.role}
                opponentName={onlineState.opponentName}
                moveCount={moveHistory.length}
                lastMoveRecord={moveHistory.length > 0 ? moveHistory[moveHistory.length - 1] : null}
                isSandboxMode={isSandboxMode}
                pieceCounts={pieceCounts}
                isEscapeThreat={isEscapeThreat}
                onResetBoard={handleNewGame}
                onOpenHistory={() => setShowMoveHistory(true)}
              />
            )}

            {/* Board */}
            <div className="w-full flex justify-center items-center py-4">
              <div className="relative celtic-knot-border p-2 sm:p-4 bg-slate-900 rounded-2xl border border-slate-800">
                <Board
                  board={board}
                  selectedPos={selectedPos}
                  validMoves={validMoves}
                  lastMove={lastMove}
                  capturingPositions={capturingPositions}
                  currentTurn={currentTurn}
                  gridStyle={settings.gridStyle}
                  accentColor={settings.accentColor}
                  showValidMoves={settings.showValidMoves}
                  onSelectPiece={handleSelectPiece}
                  onMovePiece={to => {
                    if (selectedPos) {
                      handleMakeMove(selectedPos, to);
                    }
                  }}
                />
              </div>
            </div>
          </>
        )}
      </main>

      {/* Side Move History Drawer */}
      <MoveHistory
        isOpen={showMoveHistory}
        moves={moveHistory}
        onClose={() => setShowMoveHistory(false)}
      />

      {/* Modals */}
      <VictoryModal
        status={gameStatus}
        reason={statusReason}
        totalMoves={moveHistory.length}
        onSwapRolesAndReplay={handleNewGame}
        onReplaySame={handleNewGame}
        onClose={() => setGameStatus('playing')}
      />

      <RulesModal
        isOpen={isRulesOpen}
        onClose={handleCloseRules}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        settings={settings}
        stats={stats}
        onUpdateSettings={newS => setSettings(prev => ({ ...prev, ...newS }))}
        onResetStats={() => setStats({ defendersWins: 0, attackersWins: 0, totalGames: 0, totalMoves: 0, fastestWinMoves: null })}
        onClose={() => setIsSettingsOpen(false)}
      />

      <OnlineLobbyModal
        isOpen={isLobbyOpen}
        onClose={() => setIsLobbyOpen(false)}
        onlineState={onlineState}
        lobbyUsers={lobbyUsers}
        onSetUsername={(name) => {
          socketService.setUsername(name);
          setOnlineState(prev => ({ ...prev, username: name }));
        }}
        onJoinQueue={() => {
          socketService.joinQueue();
          setOnlineState(prev => ({ ...prev, inQueue: true }));
        }}
        onLeaveQueue={() => {
          socketService.leaveQueue();
          setOnlineState(prev => ({ ...prev, inQueue: false }));
        }}
        onCreateRoom={() => socketService.createRoom()}
        onJoinRoom={(roomId) => socketService.joinRoom(roomId)}
        onLeaveRoom={() => {
          socketService.leaveRoom();
          setOnlineState(prev => ({
            ...prev,
            roomId: null,
            role: null,
            opponentId: null,
            opponentName: null,
          }));
        }}
      />
    </div>
  );
}
