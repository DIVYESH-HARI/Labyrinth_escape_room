import { Cell, Position } from '../types';

export function aStarPath(
    grid: Cell[][], 
    start: Position, 
    goal: Position, 
    heuristicType: 'manhattan' | 'euclidean' = 'manhattan'
): { nextStep: Position | null, fullPath: Position[], cost: number, openSet: Position[] } {
    
    const rows = grid.length;
    const cols = grid[0].length;

    interface Node {
        pos: Position;
        gCost: number;
        hCost: number;
        fCost: number;
        parent: Node | null;
    }

    const openSet: Node[] = [];
    const closedSet = new Set<string>();
    const recordedExploration: Position[] = [];

    const pk = (p: Position) => `${p.row},${p.col}`;

    const heuristic = (a: Position, b: Position) => {
        if (heuristicType === 'manhattan') {
            return Math.abs(a.row - b.row) + Math.abs(a.col - b.col);
        } else {
            return Math.sqrt(Math.pow(a.row - b.row, 2) + Math.pow(a.col - b.col, 2));
        }
    };

    const startNode: Node = {
        pos: start,
        gCost: 0,
        hCost: heuristic(start, goal),
        fCost: 0,
        parent: null
    };
    startNode.fCost = startNode.gCost + startNode.hCost;
    
    openSet.push(startNode);

    const dirs = [
        {dr: -1, dc: 0, wallIdx: 0}, // up
        {dr: 0, dc: 1, wallIdx: 1},  // right
        {dr: 1, dc: 0, wallIdx: 2},  // down
        {dr: 0, dc: -1, wallIdx: 3}  // left
    ];

    while (openSet.length > 0) {
        // Sort to simulate Priority Queue
        openSet.sort((a, b) => a.fCost - b.fCost || a.hCost - b.hCost);
        const current = openSet.shift()!;

        recordedExploration.push(current.pos);

        if (current.pos.row === goal.row && current.pos.col === goal.col) {
            // Reconstruct path
            const path: Position[] = [];
            let curr: Node | null = current;
            while (curr) {
                path.unshift(curr.pos);
                curr = curr.parent;
            }
            return {
                nextStep: path.length > 1 ? path[1] : path[0],
                fullPath: path,
                cost: current.gCost,
                openSet: recordedExploration
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

                const nCell = grid[nr][nc];
                const movementCost = nCell.isSlowZone ? 3 : nCell.isSpeedBoost ? 0.5 : 1;
                const tentativeGCost = current.gCost + movementCost;

                let neighborNode = openSet.find(n => pk(n.pos) === nKey);

                if (!neighborNode) {
                    neighborNode = {
                        pos: neighborPos,
                        gCost: tentativeGCost,
                        hCost: heuristic(neighborPos, goal),
                        fCost: 0,
                        parent: current
                    };
                    neighborNode.fCost = neighborNode.gCost + neighborNode.hCost;
                    openSet.push(neighborNode);
                } else if (tentativeGCost < neighborNode.gCost) {
                    neighborNode.gCost = tentativeGCost;
                    neighborNode.fCost = neighborNode.gCost + neighborNode.hCost;
                    neighborNode.parent = current;
                }
            }
        }
    }

    return { nextStep: null, fullPath: [], cost: 0, openSet: recordedExploration };
}
