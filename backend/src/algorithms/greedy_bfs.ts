import { Cell, Position } from '../types';

export function greedyBestFirstPath(
    grid: Cell[][], 
    start: Position, 
    goal: Position
): { nextStep: Position | null, fullPath: Position[], openSet: Position[] } {
    const rows = grid.length;
    const cols = grid[0].length;
    
    interface Node {
        pos: Position;
        hCost: number;
        parent: Node | null;
    }

    const openSet: Node[] = [];
    const closedSet = new Set<string>();
    const recordedOpenSet: Position[] = [];

    const pk = (p: Position) => `${p.row},${p.col}`;

    // pure manhattan heuristic
    const heuristic = (a: Position, b: Position) => Math.abs(a.row - b.row) + Math.abs(a.col - b.col);

    openSet.push({
        pos: start,
        hCost: heuristic(start, goal),
        parent: null
    });

    const dirs = [
        {dr: -1, dc: 0, wallIdx: 0}, 
        {dr: 0, dc: 1, wallIdx: 1},  
        {dr: 1, dc: 0, wallIdx: 2},  
        {dr: 0, dc: -1, wallIdx: 3}  
    ];

    while (openSet.length > 0) {
        // Sort ONLY by heuristic (greedy)
        openSet.sort((a, b) => a.hCost - b.hCost);
        const current = openSet.shift()!;

        recordedOpenSet.push(current.pos);

        if (current.pos.row === goal.row && current.pos.col === goal.col) {
            const path: Position[] = [];
            let curr: Node | null = current;
            while (curr) {
                path.unshift(curr.pos);
                curr = curr.parent;
            }
            return {
                nextStep: path.length > 1 ? path[1] : path[0],
                fullPath: path,
                openSet: recordedOpenSet
            };
        }

        closedSet.add(pk(current.pos));
        const cell = grid[current.pos.row][current.pos.col];

        for (const dir of dirs) {
            if (cell.walls[dir.wallIdx]) continue;

            const nr = current.pos.row + dir.dr;
            const nc = current.pos.col + dir.dc;

            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
                const neighborPos = { row: nr, col: nc };
                const nKey = pk(neighborPos);

                if (closedSet.has(nKey)) continue;
                
                // If it's already in openSet, do nothing (no G-cost to compare)
                if (!openSet.find(n => pk(n.pos) === nKey)) {
                    openSet.push({
                        pos: neighborPos,
                        hCost: heuristic(neighborPos, goal),
                        parent: current
                    });
                }
            }
        }
    }

    return { nextStep: null, fullPath: [], openSet: recordedOpenSet };
}
