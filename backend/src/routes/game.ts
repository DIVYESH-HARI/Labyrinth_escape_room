import { Router } from 'express';
import { gameStateManager } from '../gameState';
import { generateMazeDFS } from '../algorithms/dfs';
import { dijkstraStamina } from '../algorithms/dijkstra';
import { Position, GameState, GhostState } from '../types';

const router = Router();

const MAZE_SIZES = [
  { rows: 12, cols: 16 },
  { rows: 16, cols: 22 },
  { rows: 20, cols: 28 },
  { rows: 24, cols: 32 },
];

router.post('/start', (req, res) => {
    const sessionId = req.sessionID;
    const level = req.body.level || 1;
    const requestSeed = req.body.seed;
    const activePower = req.body.activePower || null;
    const existingState = gameStateManager.getSession(sessionId);
    const unlockedCards = req.body.unlockedCards || existingState?.unlockedCards || [];
    
    const sizeIdx = Math.min(level - 1, MAZE_SIZES.length - 1);
    const { rows, cols } = MAZE_SIZES[sizeIdx];
    
    // Seed system
    const seed = requestSeed || Math.random().toString(36).substring(2, 8).toUpperCase();
    const grid = generateMazeDFS(rows, cols, seed);
    
    const playerPos = { row: 0, col: 0 };
    const exitPos = { row: rows - 1, col: cols - 1 };
    
    const ghostPositions: GhostState[] = [{
        id: 'ghost_astar',
        type: 'astar',
        pos: { row: rows - 1, col: 0 },
        path: []
    }];

    // Add Greedy Ghost if level >= 2 or if enemies count grows
    if (level >= 2) {
        ghostPositions.push({
            id: 'ghost_greedy',
            type: 'greedy',
            pos: { row: 0, col: cols - 1 },
            path: []
        });
    }

    const numKeys = Math.min(level + 1, 5);
    const keys: Position[] = [];
    while (keys.length < numKeys) {
        const kr = Math.floor(Math.random() * rows);
        const kc = Math.floor(Math.random() * cols);
        if ((kr === 0 && kc === 0) || (kr === rows - 1 && kc === cols - 1)) continue;
        if (keys.some(k => k.row === kr && k.col === kc)) continue;
        keys.push({ row: kr, col: kc });
    }

    let initialStamina = 100;
    if (activePower === 'Stamina_Surge') initialStamina = 150;

    const state: GameState = {
        sessionId,
        seed,
        grid,
        rows,
        cols,
        playerPos,
        exitPos,
        ghostPositions,
        keys,
        collectedKeys: [],
        stamina: initialStamina,
        score: req.body.preserveScore || 0,
        sonarCharges: activePower === 'Extra_Sonar' ? 5 : 3,
        floorLevel: level,
        unlockedCards,
        activePower
    };

    gameStateManager.createSession(sessionId, state);
    res.json(state);
});

router.post('/move', (req, res) => {
    const sessionId = req.sessionID;
    const state = gameStateManager.getSession(sessionId);
    if (!state) return res.status(404).json({ error: 'Session not found' });
    
    const { direction } = req.body;
    let dr = 0, dc = 0;
    if (direction === 'up') dr = -1;
    if (direction === 'down') dr = 1;
    if (direction === 'left') dc = -1;
    if (direction === 'right') dc = 1;

    let newRow = state.playerPos.row + dr;
    let newCol = state.playerPos.col + dc;

    if (newRow < 0 || newRow >= state.rows || newCol < 0 || newCol >= state.cols) {
        return res.json({ state, staminaDrain: 0, moved: false });
    }

    const cell = state.grid[state.playerPos.row][state.playerPos.col];
    let wallIdx = -1;
    if (dr === -1) wallIdx = 0;
    if (dc === 1) wallIdx = 1;
    if (dr === 1) wallIdx = 2;
    if (dc === -1) wallIdx = 3;

    if (wallIdx >= 0 && cell.walls[wallIdx]) {
        return res.json({ state, staminaDrain: 0, moved: false });
    }

    // Cost computation
    // Dijkstra returns regular paths and ignores speed boost negatively, returns 0 for boost and 3 for slow
    // We will just process the step drain
    const { staminaDrain } = dijkstraStamina(state.grid, { row: newRow, col: newCol });
    
    let drain = staminaDrain;
    const nCell = state.grid[newRow][newCol];

    // Speed boost gives positive stamina back as Bellman-Ford could path it, but simply stepping on it functions here natively
    if (nCell.isSpeedBoost) {
        drain = -5; // Recovers 5 stamina
    }

    let newStamina = state.stamina - drain;
    if (newStamina < 0) newStamina = 0;
    if (newStamina > 200) newStamina = 200;

    let newScore = state.score + 1;
    
    const checkKey = `${newRow},${newCol}`;
    let newCollected = [...state.collectedKeys];
    if (state.keys.some(k => `${k.row},${k.col}` === checkKey) && !newCollected.includes(checkKey)) {
        newCollected.push(checkKey);
        newScore += 100;
        
        // Potential roguelite mechanic: keys give stamina
        newStamina += 10;
    }

    state.playerPos = { row: newRow, col: newCol };
    state.stamina = newStamina;
    state.score = newScore;
    state.collectedKeys = newCollected;

    gameStateManager.updateSession(sessionId, state);
    res.json({ state, staminaDrain: drain, moved: true });
});

router.post('/power', (req, res) => {
    const sessionId = req.sessionID;
    const state = gameStateManager.getSession(sessionId);
    if (!state) return res.status(404).json({ error: 'Session not found' });

    const { cardType } = req.body;
    // apply logic...
    if (cardType === 'Heal') {
        state.stamina += 50;
    }
    gameStateManager.updateSession(sessionId, state);
    res.json({ success: true, state });
});

router.get('/state', (req, res) => {
    const sessionId = req.sessionID;
    const state = gameStateManager.getSession(sessionId);
    if (!state) return res.status(404).json({ error: 'Session not found' });
    res.json(state);
});

router.post('/reset', (req, res) => {
    const sessionId = req.sessionID;
    gameStateManager.deleteSession(sessionId);
    res.json({ message: 'Session reset' });
});

export default router;
