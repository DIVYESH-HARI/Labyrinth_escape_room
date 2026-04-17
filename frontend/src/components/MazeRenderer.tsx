import { useRef, useEffect } from 'react';
import type { Cell, Position, GhostState } from '@/lib/maze';

interface MazeRendererProps {
  grid: Cell[][];
  rows: number;
  cols: number;
  playerPos: Position;
  ghosts: GhostState[];
  exitPos: Position;
  keys: Position[];
  collectedKeys: Set<string>;
  sonarPath?: Position[];
  liveDijkstraMap?: number[][];
  greedyPath?: Position[];
}

const CELL_SIZE = 34; 
const WALL_WIDTH = 3;

export function MazeRenderer({
  grid, rows, cols, playerPos, ghosts = [], exitPos, keys, collectedKeys, sonarPath = [], liveDijkstraMap, greedyPath = []
}: MazeRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Animation State refs to avoid dependency hell
  const frameRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || grid.length === 0) return;
    const ctx = canvas.getContext('2d')!;
    const w = cols * CELL_SIZE;
    const h = rows * CELL_SIZE;
    
    const dpr = window.devicePixelRatio || 1;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.scale(dpr, dpr);

    let animationId: number;

    const render = () => {
      frameRef.current++;
      
      // Deep Dark Background
      ctx.fillStyle = '#06060c';
      ctx.fillRect(0, 0, w, h);

      // Parse Dijkstra Max Cost for coloring
      let maxCost = 0;
      if (liveDijkstraMap && liveDijkstraMap.length > 0) {
        for (const row of liveDijkstraMap) {
          for (const val of row) {
            if (val !== Infinity && val > maxCost) maxCost = val;
          }
        }
      }

      // Floors
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const cell = grid[r][c];
          const x = c * CELL_SIZE;
          const y = r * CELL_SIZE;

          if (liveDijkstraMap && liveDijkstraMap.length > 0) {
            const cost = liveDijkstraMap[r][c];
            if (cost !== Infinity) {
              const intensity = 1 - (cost / maxCost);
              ctx.fillStyle = `rgba(172, 88, 255, ${intensity * 0.8})`;
              ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);

              // Numerics inside floor rendering block to stay beneath walls
              ctx.fillStyle = 'rgba(255,255,255,0.7)';
              ctx.font = '10px monospace';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(cost.toString(), x + CELL_SIZE/2, y + CELL_SIZE/2);
            }
          } else if (cell.isSlowZone) {
            ctx.fillStyle = 'rgba(172, 88, 255, 0.15)'; 
            ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
          } else if (cell.isSpeedBoost) {
            // Render green chevron pattern for Bellman-Ford
            ctx.fillStyle = 'rgba(51, 255, 136, 0.15)';
            ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
            ctx.beginPath();
            ctx.moveTo(x + CELL_SIZE/2, y + CELL_SIZE/4);
            ctx.lineTo(x + CELL_SIZE*0.75, y + CELL_SIZE/2);
            ctx.lineTo(x + CELL_SIZE/2, y + CELL_SIZE*0.75);
            ctx.strokeStyle = 'rgba(51, 255, 136, 0.4)';
            ctx.lineWidth = 2;
            ctx.stroke();
          }
        }
      }

      // Draw explicit shortest path (Sonar logic requested)
      if (sonarPath.length > 1) {
        ctx.beginPath();
        const start = sonarPath[0];
        ctx.moveTo(start.col * CELL_SIZE + CELL_SIZE / 2, start.row * CELL_SIZE + CELL_SIZE / 2);
        
        for (let i = 1; i < sonarPath.length; i++) {
            const p = sonarPath[i];
            ctx.lineTo(p.col * CELL_SIZE + CELL_SIZE / 2, p.row * CELL_SIZE + CELL_SIZE / 2);
        }
        
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.8)';
        ctx.lineWidth = 4;
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#00ffff';
        
        // Animated dash effect
        ctx.setLineDash([10, 10]);
        ctx.lineDashOffset = -(frameRef.current);
        ctx.stroke();
        
        ctx.setLineDash([]);
        ctx.shadowBlur = 0;
      }

      // Draw Greedy Best-First path (amber)
      if (greedyPath.length > 1) {
        ctx.beginPath();
        const gStart = greedyPath[0];
        ctx.moveTo(gStart.col * CELL_SIZE + CELL_SIZE / 2, gStart.row * CELL_SIZE + CELL_SIZE / 2);
        for (let i = 1; i < greedyPath.length; i++) {
          const p = greedyPath[i];
          ctx.lineTo(p.col * CELL_SIZE + CELL_SIZE / 2, p.row * CELL_SIZE + CELL_SIZE / 2);
        }
        ctx.strokeStyle = 'rgba(255, 184, 51, 0.85)';
        ctx.lineWidth = 3;
        ctx.shadowBlur = 12;
        ctx.shadowColor = '#ffb833';
        ctx.setLineDash([8, 6]);
        ctx.lineDashOffset = -(frameRef.current * 0.7);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.shadowBlur = 0;
      }

      // Draw Ghost OpenSets (Live A* visualization)
      for (const ghost of ghosts) {
          if (ghost.openSet && ghost.openSet.length > 0) {
              const color = ghost.type === 'astar' ? 'rgba(255, 51, 102, 0.1)' : 'rgba(255, 184, 51, 0.1)';
              ctx.fillStyle = color;
              for (const pos of ghost.openSet) {
                  const x = pos.col * CELL_SIZE;
                  const y = pos.row * CELL_SIZE;
                  ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
              }
          }
      }

      // Grid Walls
      ctx.lineCap = 'round';
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const cell = grid[r][c];
          const x = c * CELL_SIZE;
          const y = r * CELL_SIZE;

          ctx.strokeStyle = '#1e243b'; 
          ctx.lineWidth = WALL_WIDTH;

          const isOuter = (r === 0 || c === 0 || r === rows - 1 || c === cols - 1);
          if (isOuter) {
            ctx.strokeStyle = '#293556';
            ctx.shadowBlur = 4;
            ctx.shadowColor = '#293556';
          } else {
            ctx.shadowBlur = 0;
          }

          if (cell.walls[0]) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + CELL_SIZE, y); ctx.stroke(); }
          if (cell.walls[1]) { ctx.beginPath(); ctx.moveTo(x + CELL_SIZE, y); ctx.lineTo(x + CELL_SIZE, y + CELL_SIZE); ctx.stroke(); }
          if (cell.walls[2]) { ctx.beginPath(); ctx.moveTo(x, y + CELL_SIZE); ctx.lineTo(x + CELL_SIZE, y + CELL_SIZE); ctx.stroke(); }
          if (cell.walls[3]) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + CELL_SIZE); ctx.stroke(); }
        }
      }
      ctx.shadowBlur = 0; 

      // Objects (Keys, Exit)
      ctx.font = '22px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      for (const k of keys) {
        if (collectedKeys.has(`${k.row},${k.col}`)) continue;
        const x = k.col * CELL_SIZE + CELL_SIZE / 2;
        const y = k.row * CELL_SIZE + CELL_SIZE / 2;
        
        const floatY = Math.sin((frameRef.current / 30) + k.row) * 3;
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ffb833';
        ctx.fillText('🔑', x, y + floatY);
      }
      ctx.shadowBlur = 0;

      // Exit
      const ex = exitPos.col * CELL_SIZE + CELL_SIZE / 2;
      const ey = exitPos.row * CELL_SIZE + CELL_SIZE / 2;
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#33ff88';
      
      ctx.beginPath();
      ctx.arc(ex, ey, 14, 0, Math.PI * 2);
      const gradExit = ctx.createRadialGradient(ex, ey, 0, ex, ey, 14);
      gradExit.addColorStop(0, '#33ff88');
      gradExit.addColorStop(1, 'rgba(51, 255, 136, 0.1)');
      ctx.fillStyle = gradExit;
      ctx.fill();
      ctx.fillText('🚪', ex, ey);
      ctx.shadowBlur = 0;

      // Ghosts
      for (const ghost of ghosts) {
        const gx = ghost.pos.col * CELL_SIZE + CELL_SIZE / 2;
        const gy = ghost.pos.row * CELL_SIZE + CELL_SIZE / 2;
        
        const gFloat = Math.sin((frameRef.current / 20) + ghost.pos.col) * 4;
        const color = ghost.type === 'astar' ? '#ff3366' : '#ffb833'; 

        ctx.beginPath();
        ctx.arc(gx, gy + gFloat, 16, 0, Math.PI * 2);
        ctx.fillStyle = ghost.type === 'astar' ? 'rgba(255, 51, 102, 0.4)' : 'rgba(255, 184, 51, 0.4)';
        ctx.shadowBlur = 25;
        ctx.shadowColor = color;
        ctx.fill();
        ctx.fillText(ghost.type === 'astar' ? '👻' : '😈', gx, gy + gFloat);
        ctx.shadowBlur = 0;
      }

      // Player
      {
        const px = playerPos.col * CELL_SIZE + CELL_SIZE / 2;
        const py = playerPos.row * CELL_SIZE + CELL_SIZE / 2;
        
        const grad = ctx.createRadialGradient(px, py, 0, px, py, 22);
        grad.addColorStop(0, 'rgba(0, 255, 255, 0.7)');
        grad.addColorStop(0.5, 'rgba(0, 255, 255, 0.3)');
        grad.addColorStop(1, 'rgba(0, 255, 255, 0)');
        
        ctx.beginPath();
        ctx.arc(px, py, 22, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(px, py, 7, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#ffffff';
        ctx.fill();
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationId);
  }, [grid, rows, cols, playerPos, ghosts, exitPos, keys, collectedKeys, sonarPath, liveDijkstraMap, greedyPath]);

  return (
    <div className="relative glass-panel rounded-2xl overflow-hidden p-2 flex items-center justify-center transition-all duration-300 mx-auto" 
         style={{ boxShadow: '0 0 40px rgba(0, 255, 255, 0.05), inset 0 0 20px rgba(255,255,255,0.02)' }}>
      <canvas ref={canvasRef} className="block rounded-xl border border-white/5" />
    </div>
  );
}
