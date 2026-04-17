// Cell walls: top, right, bottom, left
export interface Cell {
  walls: [boolean, boolean, boolean, boolean]; // top, right, bottom, left
  visited: boolean;
  isSlowZone: boolean;
  row: number;
  col: number;
}

export interface Position {
  row: number;
  col: number;
}

// DFS Maze Generation
export function generateMaze(rows: number, cols: number): Cell[][] {
  const grid: Cell[][] = [];

  for (let r = 0; r < rows; r++) {
    grid[r] = [];
    for (let c = 0; c < cols; c++) {
      grid[r][c] = {
        walls: [true, true, true, true],
        visited: false,
        isSlowZone: false,
        row: r,
        col: c,
      };
    }
  }

  const stack: Position[] = [];
  const start: Position = { row: 0, col: 0 };
  grid[start.row][start.col].visited = true;
  stack.push(start);

  while (stack.length > 0) {
    const current = stack[stack.length - 1];
    const neighbors = getUnvisitedNeighbors(current, grid, rows, cols);

    if (neighbors.length === 0) {
      stack.pop();
    } else {
      const next = neighbors[Math.floor(Math.random() * neighbors.length)];
      removeWall(grid, current, next);
      grid[next.row][next.col].visited = true;
      stack.push(next);
    }
  }

  // Add slow zones randomly (~15% of cells)
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (Math.random() < 0.15 && !(r === 0 && c === 0)) {
        grid[r][c].isSlowZone = true;
      }
    }
  }

  // Reset visited
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      grid[r][c].visited = false;
    }
  }

  return grid;
}

function getUnvisitedNeighbors(pos: Position, grid: Cell[][], rows: number, cols: number): Position[] {
  const { row, col } = pos;
  const neighbors: Position[] = [];
  if (row > 0 && !grid[row - 1][col].visited) neighbors.push({ row: row - 1, col });
  if (col < cols - 1 && !grid[row][col + 1].visited) neighbors.push({ row, col: col + 1 });
  if (row < rows - 1 && !grid[row + 1][col].visited) neighbors.push({ row: row + 1, col });
  if (col > 0 && !grid[row][col - 1].visited) neighbors.push({ row, col: col - 1 });
  return neighbors;
}

function removeWall(grid: Cell[][], a: Position, b: Position) {
  const dr = b.row - a.row;
  const dc = b.col - a.col;
  if (dr === -1) { grid[a.row][a.col].walls[0] = false; grid[b.row][b.col].walls[2] = false; }
  if (dc === 1) { grid[a.row][a.col].walls[1] = false; grid[b.row][b.col].walls[3] = false; }
  if (dr === 1) { grid[a.row][a.col].walls[2] = false; grid[b.row][b.col].walls[0] = false; }
  if (dc === -1) { grid[a.row][a.col].walls[3] = false; grid[b.row][b.col].walls[1] = false; }
}

// Get passable neighbors (no wall between)
export function getPassableNeighbors(pos: Position, grid: Cell[][], rows: number, cols: number): Position[] {
  const { row, col } = pos;
  const neighbors: Position[] = [];
  const cell = grid[row][col];
  if (!cell.walls[0] && row > 0) neighbors.push({ row: row - 1, col });
  if (!cell.walls[1] && col < cols - 1) neighbors.push({ row, col: col + 1 });
  if (!cell.walls[2] && row < rows - 1) neighbors.push({ row: row + 1, col });
  if (!cell.walls[3] && col > 0) neighbors.push({ row, col: col - 1 });
  return neighbors;
}

// BFS Sonar - find shortest path to target
export function bfsSonar(grid: Cell[][], start: Position, target: Position, rows: number, cols: number): Position[] {
  const queue: Position[] = [start];
  const visited = new Set<string>();
  const parent = new Map<string, Position | null>();
  const key = (p: Position) => `${p.row},${p.col}`;

  visited.add(key(start));
  parent.set(key(start), null);

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current.row === target.row && current.col === target.col) {
      // Reconstruct path
      const path: Position[] = [];
      let c: Position | null = current;
      while (c) {
        path.unshift(c);
        c = parent.get(key(c)) || null;
      }
      return path;
    }

    for (const neighbor of getPassableNeighbors(current, grid, rows, cols)) {
      if (!visited.has(key(neighbor))) {
        visited.add(key(neighbor));
        parent.set(key(neighbor), current);
        queue.push(neighbor);
      }
    }
  }
  return [];
}

// A* pathfinding for the hunter enemy
export function aStarPath(grid: Cell[][], start: Position, target: Position, rows: number, cols: number): Position[] {
  const key = (p: Position) => `${p.row},${p.col}`;
  const heuristic = (a: Position, b: Position) => Math.abs(a.row - b.row) + Math.abs(a.col - b.col);

  const openSet: Position[] = [start];
  const cameFrom = new Map<string, Position>();
  const gScore = new Map<string, number>();
  const fScore = new Map<string, number>();

  gScore.set(key(start), 0);
  fScore.set(key(start), heuristic(start, target));

  while (openSet.length > 0) {
    openSet.sort((a, b) => (fScore.get(key(a)) || Infinity) - (fScore.get(key(b)) || Infinity));
    const current = openSet.shift()!;

    if (current.row === target.row && current.col === target.col) {
      const path: Position[] = [];
      let c: Position | undefined = current;
      while (c) {
        path.unshift(c);
        c = cameFrom.get(key(c));
      }
      return path;
    }

    for (const neighbor of getPassableNeighbors(current, grid, rows, cols)) {
      const tentativeG = (gScore.get(key(current)) || 0) + 1;
      if (tentativeG < (gScore.get(key(neighbor)) ?? Infinity)) {
        cameFrom.set(key(neighbor), current);
        gScore.set(key(neighbor), tentativeG);
        fScore.set(key(neighbor), tentativeG + heuristic(neighbor, target));
        if (!openSet.find(p => p.row === neighbor.row && p.col === neighbor.col)) {
          openSet.push(neighbor);
        }
      }
    }
  }
  return [];
}

// Dijkstra - calculate movement cost considering slow zones
export function dijkstraCost(grid: Cell[][], start: Position, target: Position, rows: number, cols: number): { path: Position[]; cost: number } {
  const key = (p: Position) => `${p.row},${p.col}`;
  const dist = new Map<string, number>();
  const prev = new Map<string, Position | null>();
  const unvisited = new Set<string>();

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const k = `${r},${c}`;
      dist.set(k, Infinity);
      unvisited.add(k);
    }
  }
  dist.set(key(start), 0);
  prev.set(key(start), null);

  while (unvisited.size > 0) {
    let minDist = Infinity;
    let current: Position | null = null;
    for (const k of unvisited) {
      const d = dist.get(k) || Infinity;
      if (d < minDist) {
        minDist = d;
        const [r, c] = k.split(',').map(Number);
        current = { row: r, col: c };
      }
    }
    if (!current || minDist === Infinity) break;

    unvisited.delete(key(current));

    if (current.row === target.row && current.col === target.col) {
      const path: Position[] = [];
      let c: Position | null = current;
      while (c) {
        path.unshift(c);
        c = prev.get(key(c)) || null;
      }
      return { path, cost: minDist };
    }

    for (const neighbor of getPassableNeighbors(current, grid, rows, cols)) {
      if (!unvisited.has(key(neighbor))) continue;
      const weight = grid[neighbor.row][neighbor.col].isSlowZone ? 3 : 1;
      const alt = minDist + weight;
      if (alt < (dist.get(key(neighbor)) || Infinity)) {
        dist.set(key(neighbor), alt);
        prev.set(key(neighbor), current);
      }
    }
  }
  return { path: [], cost: Infinity };
}
