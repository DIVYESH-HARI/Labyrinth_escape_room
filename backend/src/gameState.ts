import { GameState } from './types';

// In-memory store for game sessions
class GameStateManager {
    private sessions: Map<string, GameState> = new Map();

    createSession(sessionId: string, state: GameState) {
        this.sessions.set(sessionId, state);
    }

    getSession(sessionId: string): GameState | undefined {
        return this.sessions.get(sessionId);
    }

    updateSession(sessionId: string, state: Partial<GameState>) {
        const existing = this.sessions.get(sessionId);
        if (existing) {
            this.sessions.set(sessionId, { ...existing, ...state });
        }
    }

    deleteSession(sessionId: string) {
        this.sessions.delete(sessionId);
    }

    getAllSessions() {
        return this.sessions;
    }
}

export const gameStateManager = new GameStateManager();
