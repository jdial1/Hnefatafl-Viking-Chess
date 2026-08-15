import { io, Socket } from 'socket.io-client';
import { BoardState, Move, PlayerRole, Position } from '../types';

class SocketService {
  private socket: Socket | null = null;
  private isConnected = false;

  public connect(): Socket {
    if (this.socket && this.socket.connected) {
      return this.socket;
    }

    // Connect to current location origin
    this.socket = io({
      autoConnect: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      this.isConnected = true;
    });

    this.socket.on('disconnect', () => {
      this.isConnected = false;
    });

    return this.socket;
  }

  public getSocket(): Socket | null {
    return this.socket;
  }

  public sendStateSync(board: BoardState, currentTurn: PlayerRole): void {
    if (this.socket) {
      this.socket.emit('game:state_sync', { board, currentTurn });
    }
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  public setUsername(username: string): void {
    if (this.socket) {
      this.socket.emit('set_username', username);
    }
  }

  public joinQueue(): void {
    if (this.socket) {
      this.socket.emit('queue:join');
    }
  }

  public leaveQueue(): void {
    if (this.socket) {
      this.socket.emit('queue:leave');
    }
  }

  public createRoom(): void {
    if (this.socket) {
      this.socket.emit('room:create');
    }
  }

  public joinRoom(roomId: string): void {
    if (this.socket) {
      this.socket.emit('room:join', roomId);
    }
  }

  public leaveRoom(): void {
    if (this.socket) {
      this.socket.emit('room:leave');
    }
  }

  public sendMove(payload: {
    from: Position;
    to: Position;
    board?: BoardState;
    nextTurn?: PlayerRole;
    moveRecord?: Move;
  }): void {
    if (this.socket) {
      this.socket.emit('game:move', payload);
    }
  }

  public syncState(state: any): void {
    if (this.socket) {
      this.socket.emit('game:state_sync', state);
    }
  }

  public restartGame(): void {
    if (this.socket) {
      this.socket.emit('game:restart');
    }
  }

  public requestRematch(): void {
    if (this.socket) {
      this.socket.emit('game:rematch_request');
    }
  }

  public acceptRematch(): void {
    if (this.socket) {
      this.socket.emit('game:rematch_accept');
    }
  }
}

export const socketService = new SocketService();
