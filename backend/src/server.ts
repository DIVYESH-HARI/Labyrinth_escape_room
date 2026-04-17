import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import session from 'express-session';

import mazeRoutes from './routes/maze';
import pathfindRoutes from './routes/pathfind';
import gameRoutes from './routes/game';
import scoreRoutes from './routes/score';
import debugRoutes from './routes/debug';

import { gameStateManager } from './gameState';
import { aStarPath } from './algorithms/astar';
import { greedyBestFirstPath } from './algorithms/greedy_bfs';
import { dijkstraGhostPath } from './algorithms/dijkstra_ghost';

export let GHOST_INTERVAL = 800;
export let DIJKSTRA_GHOST_ENABLED = false;

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: 'http://localhost:8080',
        methods: ["GET", "POST"],
        credentials: true
    }
});

const sessionMiddleware = session({
    secret: 'labyrinth-secret-key-1234',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 1000 * 60 * 60 * 24 }
});

app.use(cors({ origin: 'http://localhost:8080', credentials: true }));
app.use(express.json());
app.use(sessionMiddleware);
io.engine.use(sessionMiddleware);

app.use('/api/maze', mazeRoutes);
app.use('/api/pathfind', pathfindRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/score', scoreRoutes);
app.use('/api/debug', debugRoutes);

// Ghost speed up (decrease interval = faster)
app.post('/api/game/ghost_speed_up', (req, res) => {
    GHOST_INTERVAL = Math.max(100, GHOST_INTERVAL - 100);
    res.json({ speed: GHOST_INTERVAL });
});

// Ghost speed down (increase interval = slower)
app.post('/api/game/ghost_speed_down', (req, res) => {
    GHOST_INTERVAL = Math.min(1500, GHOST_INTERVAL + 100);
    res.json({ speed: GHOST_INTERVAL });
});

// Toggle Dijkstra ghost mode
app.post('/api/game/toggle_dijkstra_ghost', (req, res) => {
    DIJKSTRA_GHOST_ENABLED = !DIJKSTRA_GHOST_ENABLED;
    res.json({ enabled: DIJKSTRA_GHOST_ENABLED });
});

io.on('connection', (socket) => {
    // @ts-ignore
    const sessionId = socket.request.session?.id;
    if (sessionId) {
        socket.join(sessionId);
    }
});

// Global game loop for ghosts
function scheduleGhosts() {
    setTimeout(() => {
        const sessions = gameStateManager.getAllSessions();
        
        for (const [sessionId, state] of sessions.entries()) {
            if (!state.grid || state.grid.length === 0) continue;

            let needsUpdate = false;

            const playerCell = state.grid[state.playerPos.row][state.playerPos.col];
            // Cross-System constraint: If player is in slow zone, A* alert radius increases.
            const alertRadius = playerCell.isSlowZone ? 6 : 3;

            for (const ghost of state.ghostPositions) {
                
                if (ghost.type === 'astar') {
                    // If Dijkstra ghost mode is on, override astar ghost with dijkstra pathfinding
                    const pathInfo = DIJKSTRA_GHOST_ENABLED
                        ? dijkstraGhostPath(state.grid, ghost.pos, state.playerPos)
                        : aStarPath(state.grid, ghost.pos, state.playerPos, 'manhattan');

                    if (pathInfo.nextStep) {
                        ghost.pos = pathInfo.nextStep;
                        ghost.path = pathInfo.fullPath;
                        ghost.openSet = pathInfo.openSet;
                        needsUpdate = true;

                        const pathLength = pathInfo.fullPath.length;
                        if (pathLength <= alertRadius) {
                            io.to(sessionId).emit('ghost:alert', {
                                ghostId: ghost.id,
                                distance: pathLength,
                                radius: alertRadius
                            });
                        }
                    }
                } else if (ghost.type === 'greedy') {
                    const greedInfo = greedyBestFirstPath(state.grid, ghost.pos, state.playerPos);
                    if (greedInfo.nextStep) {
                        ghost.pos = greedInfo.nextStep;
                        ghost.path = greedInfo.fullPath;
                        ghost.openSet = greedInfo.openSet;
                        needsUpdate = true;
                    }
                }
            }

            if (needsUpdate) {
                gameStateManager.updateSession(sessionId, { ghostPositions: state.ghostPositions });
                io.to(sessionId).emit('ghost:move', {
                    ghostPositions: state.ghostPositions
                });
            }
        }
        scheduleGhosts();
    }, GHOST_INTERVAL);
}

scheduleGhosts();

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
});
