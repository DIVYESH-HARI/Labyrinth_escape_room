import { Cell, Position } from '../types';

export function dijkstraStamina(grid: Cell[][], start: Position): { costMap: number[][], staminaDrain: number } {
    const rows = grid.length;
    const cols = grid[0].length;
    
    const costMap: number[][] = Array.from({length: rows}, () => Array(cols).fill(Infinity));
    costMap[start.row][start.col] = 0;
    
    // Priority queue simulation
    const pq: {pos: Position, cost: number}[] = [{pos: start, cost: 0}];
    
    const dirs = [
        {dr: -1, dc: 0, wallIdx: 0}, 
        {dr: 0, dc: 1, wallIdx: 1},  
        {dr: 1, dc: 0, wallIdx: 2},  
        {dr: 0, dc: -1, wallIdx: 3}  
    ];

    while(pq.length > 0) {
        pq.sort((a,b) => a.cost - b.cost);
        const {pos, cost} = pq.shift()!;
        
        if (cost > costMap[pos.row][pos.col]) continue;
        
        const cell = grid[pos.row][pos.col];
        
        for (const dir of dirs) {
            if (cell.walls[dir.wallIdx]) continue;
            
            const nr = pos.row + dir.dr;
            const nc = pos.col + dir.dc;
            
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
                const nCell = grid[nr][nc];
                // Dijkstra strictly cannot support negative weights, so speed boost is at minimum 1 cost or 0
                const edgeWeight = nCell.isSlowZone ? 3 : nCell.isSpeedBoost ? 0 : 1; 
                const newCost = cost + edgeWeight;
                
                if (newCost < costMap[nr][nc]) {
                    costMap[nr][nc] = newCost;
                    pq.push({pos: {row: nr, col: nc}, cost: newCost});
                }
            }
        }
    }

    const currentCellCost = grid[start.row][start.col].isSlowZone ? 3 : grid[start.row][start.col].isSpeedBoost ? 0 : 1;

    return { costMap, staminaDrain: currentCellCost };
}
