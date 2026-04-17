const API_BASE = 'http://localhost:3001/api';

export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
    options.credentials = 'include';
    options.headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };
    
    const res = await fetch(`${API_BASE}${endpoint}`, options);
    if (!res.ok) {
        throw new Error(await res.text());
    }
    return res.json();
};

export const GameAPI = {
    start: (level: number, preserveScore: number = 0, seed?: string, activePower?: string | null, unlockedCards?: string[]) => 
        apiFetch('/game/start', {
            method: 'POST',
            body: JSON.stringify({ level, preserveScore, seed, activePower, unlockedCards })
        }),
    move: (direction: 'up' | 'down' | 'left' | 'right') => 
        apiFetch('/game/move', {
            method: 'POST',
            body: JSON.stringify({ direction })
        }),
    state: () => apiFetch('/game/state'),
    reset: () => apiFetch('/game/reset', { method: 'POST' }),
    power: (cardType: string) => apiFetch('/game/power', {
        method: 'POST',
        body: JSON.stringify({ cardType })
    }),
    sonar: (grid: any, start: any, targets: any, tier: number = 1) => 
        apiFetch('/pathfind/bfs', {
            method: 'POST',
            body: JSON.stringify({ grid, start, targets, tier })
        }),
    dijkstra: (grid: any, playerPos: any) => 
        apiFetch('/pathfind/dijkstra', {
            method: 'POST',
            body: JSON.stringify({ grid, playerPos })
        }),
    astar: (grid: any, start: any, goal: any, heuristic: string) => 
        apiFetch('/pathfind/astar', {
            method: 'POST',
            body: JSON.stringify({ grid, start, goal, heuristic })
        }),
    bellman: (grid: any, start: any, goal: any) => 
        apiFetch('/pathfind/bellman', {
            method: 'POST',
            body: JSON.stringify({ grid, start, goal })
        }),
    greedy: (grid: any, start: any, goal: any) => 
        apiFetch('/pathfind/greedy', {
            method: 'POST',
            body: JSON.stringify({ grid, start, goal })
        }),
    ghostSpeed: () => 
        apiFetch('/game/ghost_speed_up', { method: 'POST' }),
    ghostSpeedDown: () => 
        apiFetch('/game/ghost_speed_down', { method: 'POST' }),
    toggleDijkstraGhost: () =>
        apiFetch('/game/toggle_dijkstra_ghost', { method: 'POST' })
};

export const ScoreAPI = {
    submit: (playerName: string, score: number, floorReached: number, timeSeconds: number) => apiFetch('/score/submit', {
        method: 'POST',
        body: JSON.stringify({ playerName, score, floorReached, timeSeconds })
    }),
    leaderboard: () => apiFetch('/score/leaderboard')
};
