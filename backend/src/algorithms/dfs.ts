import { Cell } from '../types';
import seedrandom from 'seedrandom';

export function generateMazeDFS(rows: number, cols: number, seed?: string): Cell[][] {
    const defaultSeed = Math.random().toString(36).substring(2, 8);
    const prng = seedrandom(seed || defaultSeed);
    const grid: Cell[][] = Array.from({ length: rows }, (_, r) => 
        Array.from({ length: cols }, (_, c) => ({
            walls: [true, true, true, true],
            isSlowZone: false,
            isSpeedBoost: false,
            visited: false,
            row: r,
            col: c
        }))
    );

    const stack: {r: number, c: number}[] = [];
    const startR = 0;
    const startC = 0;
    grid[startR][startC].visited = true;
    stack.push({r: startR, c: startC});

    // dx/dy matching walls: 0: top, 1: right, 2: bottom, 3: left
    const directions = [
        {dr: -1, dc: 0, wallIndex: 0, oppWallIndex: 2}, // top
        {dr: 0, dc: 1, wallIndex: 1, oppWallIndex: 3},  // right
        {dr: 1, dc: 0, wallIndex: 2, oppWallIndex: 0},  // bottom
        {dr: 0, dc: -1, wallIndex: 3, oppWallIndex: 1}  // left
    ];

    while (stack.length > 0) {
        const current = stack[stack.length - 1];
        
        const unvisited: typeof directions = [];
        for (const dir of directions) {
            const nr = current.r + dir.dr;
            const nc = current.c + dir.dc;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !grid[nr][nc].visited) {
                unvisited.push(dir);
            }
        }

        if (unvisited.length > 0) {
            const chosen = unvisited[Math.floor(prng() * unvisited.length)];
            const nr = current.r + chosen.dr;
            const nc = current.c + chosen.dc;

            grid[current.r][current.c].walls[chosen.wallIndex] = false;
            grid[nr][nc].walls[chosen.oppWallIndex] = false;

            grid[nr][nc].visited = true;
            stack.push({r: nr, c: nc});
        } else {
            stack.pop();
        }
    }

    // Cleanup visited flag
    for(let r=0; r<rows; r++){
        for(let c=0; c<cols; c++){
            delete grid[r][c].visited;
        }
    }
    
    // Add slow zones
    let slowZonesAdded = 0;
    const maxSlow = Math.min(6, Math.floor((rows * cols) * 0.08));
    while(slowZonesAdded < maxSlow) {
        const sr = Math.floor(prng() * rows);
        const sc = Math.floor(prng() * cols);
        if (!grid[sr][sc].isSlowZone && !grid[sr][sc].isSpeedBoost && !(sr === 0 && sc === 0) && !(sr === rows-1 && sc === cols-1)) {
            grid[sr][sc].isSlowZone = true;
            slowZonesAdded++;
        }
    }

    // Add speed boosts
    let speedBoostsAdded = 0;
    const maxSpeed = Math.min(4, Math.floor((rows * cols) * 0.05));
    while(speedBoostsAdded < maxSpeed) {
        const sr = Math.floor(prng() * rows);
        const sc = Math.floor(prng() * cols);
        if (!grid[sr][sc].isSlowZone && !grid[sr][sc].isSpeedBoost && !(sr === 0 && sc === 0) && !(sr === rows-1 && sc === cols-1)) {
            grid[sr][sc].isSpeedBoost = true;
            speedBoostsAdded++;
        }
    }

    return grid;
}
