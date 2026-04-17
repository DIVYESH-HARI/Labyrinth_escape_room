import { Cell, Position } from '../types';

export function bfsSonar(
    grid: Cell[][], 
    startPos: Position, 
    targets: Position[],
    tier: number // 1: nearest target (key), 2: specific target (exit), 3: full map sweep
): {
    path: Position[],
    distance: number,
    sonarWaves: Position[][] // frontiers
} {
    const rows = grid.length;
    const cols = grid[0].length;
    let queue: Position[] = [startPos];
    const visited = new Set<string>();
    const parent = new Map<string, string>();
    const distances = new Map<string, number>();

    const pk = (p: Position) => `${p.row},${p.col}`;
    visited.add(pk(startPos));
    distances.set(pk(startPos), 0);
    
    let path: Position[] = [];
    let distance = 0;
    
    const targetKeys = new Set(targets.map(pk));
    const sonarWaves: Position[][] = [[startPos]];

    const dirs = [
        {dr: -1, dc: 0, wallIdx: 0},
        {dr: 0, dc: 1, wallIdx: 1}, 
        {dr: 1, dc: 0, wallIdx: 2}, 
        {dr: 0, dc: -1, wallIdx: 3} 
    ];

    let foundTarget = false;
    let targetKeyFound = '';

    while (queue.length > 0 && !foundTarget) {
        const nextQueue: Position[] = [];
        const currentWave: Position[] = [];

        for (const curr of queue) {
            const currKey = pk(curr);
            const currDist = distances.get(currKey) || 0;

            if ((tier === 1 || tier === 2) && targetKeys.has(currKey)) {
                foundTarget = true;
                distance = currDist;
                targetKeyFound = currKey;
                break;
            }

            const cell = grid[curr.row][curr.col];
            for (const dir of dirs) {
                if (cell.walls[dir.wallIdx]) continue;

                const nr = curr.row + dir.dr;
                const nc = curr.col + dir.dc;

                if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
                    const nPos = { row: nr, col: nc };
                    const nKey = pk(nPos);
                    if (!visited.has(nKey)) {
                        visited.add(nKey);
                        parent.set(nKey, currKey);
                        distances.set(nKey, currDist + 1);
                        nextQueue.push(nPos);
                        currentWave.push(nPos);
                    }
                }
            }
        }
        
        if (currentWave.length > 0) {
            sonarWaves.push(currentWave);
        }
        queue = nextQueue;
    }

    if (foundTarget) {
        let step: string | undefined = targetKeyFound;
        while (step && step !== pk(startPos)) {
            const [r, c] = step.split(',').map(Number);
            path.unshift({row: r, col: c});
            step = parent.get(step);
        }
        path.unshift(startPos);
    }

    return { path, distance, sonarWaves };
}
