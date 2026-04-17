export interface Position {
  row: number;
  col: number;
}

export interface Cell {
  walls: [boolean, boolean, boolean, boolean]; // top, right, bottom, left
  isSlowZone: boolean;
  isSpeedBoost?: boolean; // Negative weight zone
  visited?: boolean; // Used during generation
  row?: number;
  col?: number;
}

export interface GhostState {
  id: string;
  type: 'astar' | 'greedy';
  pos: Position;
  path: Position[];
  openSet?: Position[]; // Used for live visualization
}

export interface GameState {
  sessionId: string;
  seed: string;
  grid: Cell[][];
  rows: number;
  cols: number;
  playerPos: Position;
  ghostPositions: GhostState[];
  keys: Position[];
  collectedKeys: string[];
  exitPos: Position;
  stamina: number;
  score: number;
  sonarCharges: number;
  floorLevel: number;
  unlockedCards: string[];
  activePower: string | null;
}
