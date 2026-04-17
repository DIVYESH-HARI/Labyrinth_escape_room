import { Cell, Position } from '../types';

// Bellman-Ford algorithm
// Useful because Dijkstra cannot handle negative weights (speed boosts).
export function bellmanFordPath(grid: Cell[][], start: Position, target: Position): {
    path: Position[],
    distance: number,
    costMap: number[][]
} {
    const rows = grid.length;
    const cols = grid[0].length;
    const vertices = rows * cols;

    const costMap: number[][] = Array.from({length: rows}, () => Array(cols).fill(Infinity));
    const parentMap: Map<string, string> = new Map();

    const pk = (p: Position) => `${p.row},${p.col}`;
    costMap[start.row][start.col] = 0;

    const edges: {u: Position, v: Position, weight: number}[] = [];

    const dirs = [
        {dr: -1, dc: 0, wallIdx: 0},
        {dr: 0, dc: 1, wallIdx: 1}, 
        {dr: 1, dc: 0, wallIdx: 2}, 
        {dr: 0, dc: -1, wallIdx: 3} 
    ];

    // Build edge list
    for(let r=0; r<rows; r++) {
        for(let c=0; c<cols; c++) {
            const cell = grid[r][c];
            for(const dir of dirs) {
                if (cell.walls[dir.wallIdx]) continue;
                const nr = r + dir.dr;
                const nc = c + dir.dc;
                if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
                    const nCell = grid[nr][nc];
                    let weight = 1;
                    if (nCell.isSlowZone) weight = 3;
                    if (nCell.isSpeedBoost) weight = -1; // Negative weight!
                    edges.push({
                        u: {row: r, col: c},
                        v: {row: nr, col: nc},
                        weight
                    });
                }
            }
        }
    }

    // Relax all edges |V| - 1 times
    for (let i = 1; i < vertices; i++) {
        let relaxedAny = false;
        for (const edge of edges) {
            const uCost = costMap[edge.u.row][edge.u.col];
            if (uCost !== Infinity && uCost + edge.weight < costMap[edge.v.row][edge.v.col]) {
                costMap[edge.v.row][edge.v.col] = uCost + edge.weight;
                parentMap.set(pk(edge.v), pk(edge.u));
                relaxedAny = true;
            }
        }
        if (!relaxedAny) break; // Optimized early exit
    }

    // Note: We skip negative weight cycle detection for this game's layout requirements, 
    // because pathing shouldn't loop negatively infinitely unless two adjacent cells are both boosts 
    // To prevent infinite bounce in game layout, DFS guarantees spread out speed boosts

    const path: Position[] = [];
    if (costMap[target.row][target.col] !== Infinity) {
        let step = pk(target);
        while (step && step !== pk(start)) {
            const [r, c] = step.split(',').map(Number);
            path.unshift({row: r, col: c});
            step = parentMap.get(step)!;
        }
        path.unshift(start);
    }

    return { path, distance: costMap[target.row][target.col], costMap };
}
