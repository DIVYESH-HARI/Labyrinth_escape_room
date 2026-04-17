import { Cell, Position } from '../types';

/**
 * Dijkstra pathfinding for ghost movement.
 * Considers cell weights: slow zones cost more, speed boosts cost less.
 * Returns the next step toward the target and the full reconstructed path.
 */
export function dijkstraGhostPath(
    grid: Cell[][],
    start: Position,
    goal: Position
): { nextStep: Position | null, fullPath: Position[], openSet: Position[] } {
    const rows = grid.length;
    const cols = grid[0].length;

    const dist: number[][] = Array.from({ length: rows }, () => Array(cols).fill(Infinity));
    const prev: (Position | null)[][] = Array.from({ length: rows }, () => Array(cols).fill(null));
    dist[start.row][start.col] = 0;

    const pq: { pos: Position; cost: number }[] = [{ pos: start, cost: 0 }];
    const recordedOpenSet: Position[] = [];

    const pk = (p: Position) => `${p.row},${p.col}`;

    const dirs = [
        { dr: -1, dc: 0, wallIdx: 0 },
        { dr: 0,  dc: 1, wallIdx: 1 },
        { dr: 1,  dc: 0, wallIdx: 2 },
        { dr: 0, dc: -1, wallIdx: 3 },
    ];

    while (pq.length > 0) {
        pq.sort((a, b) => a.cost - b.cost);
        const { pos, cost } = pq.shift()!;

        if (cost > dist[pos.row][pos.col]) continue;

        recordedOpenSet.push(pos);

        if (pos.row === goal.row && pos.col === goal.col) break;

        const cell = grid[pos.row][pos.col];

        for (const dir of dirs) {
            if (cell.walls[dir.wallIdx]) continue;

            const nr = pos.row + dir.dr;
            const nc = pos.col + dir.dc;

            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
                const nCell = grid[nr][nc];
                const weight = nCell.isSlowZone ? 3 : nCell.isSpeedBoost ? 0 : 1;
                const newCost = cost + weight;

                if (newCost < dist[nr][nc]) {
                    dist[nr][nc] = newCost;
                    prev[nr][nc] = pos;
                    pq.push({ pos: { row: nr, col: nc }, cost: newCost });
                }
            }
        }
    }

    // Reconstruct path
    const path: Position[] = [];
    let cur: Position | null = goal;
    while (cur && (cur.row !== start.row || cur.col !== start.col)) {
        path.unshift(cur);
        cur = prev[cur.row][cur.col];
    }
    if (cur) path.unshift(cur); // include start

    if (path.length < 2) return { nextStep: null, fullPath: [], openSet: recordedOpenSet };

    return {
        nextStep: path[1],
        fullPath: path,
        openSet: recordedOpenSet
    };
}
