import { useEffect, useRef, useState } from 'react';
import type { Cell, Position, GhostState } from '@/lib/maze';

interface AlgorithmInspectorProps {
  grid: Cell[][];
  rows: number;
  cols: number;
  bfsWaves: Position[][];
  dijkstraCostMap: number[][];
  astarOpenSet: Position[];
  onClose: () => void;
}

const CELL_SIZE = 20;

export function AlgorithmInspector({
  grid, rows, cols, bfsWaves, dijkstraCostMap, astarOpenSet, onClose
}: AlgorithmInspectorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeLayer, setActiveLayer] = useState<'astar' | 'bfs' | 'dijkstra'>('astar');
  
  const keyMap = (p: Position) => `${p.row},${p.col}`;

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

    ctx.fillStyle = '#06060c';
    ctx.fillRect(0, 0, w, h);

    const astarSet = new Set(astarOpenSet.map(keyMap));

    // Map max cost for dijkstra heatmapping
    let maxCost = 0;
    if (activeLayer === 'dijkstra') {
      for (const row of dijkstraCostMap) {
        for (const val of row) {
          if (val !== Infinity && val > maxCost) maxCost = val;
        }
      }
    }

    // Floors
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = c * CELL_SIZE;
        const y = r * CELL_SIZE;
        const ck = `${r},${c}`;

        if (activeLayer === 'dijkstra') {
          const cost = dijkstraCostMap[r][c];
          if (cost !== Infinity) {
            const intensity = 1 - (cost / maxCost);
            ctx.fillStyle = `rgba(172, 88, 255, ${intensity * 0.8})`;
            ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
            ctx.fillStyle = 'rgba(255,255,255,0.8)';
            ctx.font = '8px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(cost.toString(), x + CELL_SIZE/2, y + CELL_SIZE/2);
          }
        } 
        
        else if (activeLayer === 'astar' && astarSet.has(ck)) {
          ctx.fillStyle = 'rgba(255, 51, 102, 0.4)';
          ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
        }
      }
    }

    // Walls
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1e243b'; 
    ctx.lineWidth = 2;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cell = grid[r][c];
        const x = c * CELL_SIZE;
        const y = r * CELL_SIZE;
        if (cell.walls[0]) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + CELL_SIZE, y); ctx.stroke(); }
        if (cell.walls[1]) { ctx.beginPath(); ctx.moveTo(x + CELL_SIZE, y); ctx.lineTo(x + CELL_SIZE, y + CELL_SIZE); ctx.stroke(); }
        if (cell.walls[2]) { ctx.beginPath(); ctx.moveTo(x, y + CELL_SIZE); ctx.lineTo(x + CELL_SIZE, y + CELL_SIZE); ctx.stroke(); }
        if (cell.walls[3]) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + CELL_SIZE); ctx.stroke(); }
      }
    }

  }, [grid, rows, cols, bfsWaves, dijkstraCostMap, astarOpenSet, activeLayer]);

  // BFS Animation overlaid logically
  const [bfsFrame, setBfsFrame] = useState(0);
  useEffect(() => {
    if (activeLayer !== 'bfs') return;
    const interval = setInterval(() => {
      setBfsFrame(f => (f + 1) % ((bfsWaves.length || 1) + 5)); // loop with a pause
    }, 150);
    return () => clearInterval(interval);
  }, [activeLayer, bfsWaves]);

  useEffect(() => {
    if (activeLayer === 'bfs') {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d')!;
      
      // We only redraw the BFS dots on top of the base. For simplicity here, we clear and redraw paths.
      // But keeping it simple: we just draw dots when their wave index <= bfsFrame.
      // Since it's an overlay effect, we actually should redraw the whole base map inside the frame loop or just draw over. 
      // To avoid clearing everything, let's just draw the active wave in bright cyan.
      if (bfsFrame < bfsWaves.length) {
        const wave = bfsWaves[bfsFrame];
        if (wave) {
          for (const pos of wave) {
            const x = pos.col * CELL_SIZE + CELL_SIZE / 2;
            const y = pos.row * CELL_SIZE + CELL_SIZE / 2;
            ctx.beginPath();
            ctx.arc(x, y, 6, 0, Math.PI * 2);
            ctx.fillStyle = '#00ffff';
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#00ffff';
            ctx.fill();
            ctx.shadowBlur = 0;
          }
        }
      } else if (bfsFrame === bfsWaves.length + 4) { // Clear event
         // trigger standard re-render by setting state but we can just let it loop
      }
    }
  }, [activeLayer, bfsFrame, bfsWaves]);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-4xl glass-panel rounded-2xl p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-white text-xl">&times;</button>
        
        <h2 className="text-2xl font-black text-white uppercase tracking-widest mb-6">Algorithm Inspector</h2>
        
        <div className="flex gap-4 mb-6">
          <button 
            onClick={() => setActiveLayer('astar')}
            className={`px-4 py-2 rounded-lg font-mono text-sm uppercase transition-all ${activeLayer === 'astar' ? 'bg-neon-red/20 border-neon-red/50 text-neon-red box-glow-red border' : 'bg-white/5 text-muted-foreground'}`}
          >
            A* Search Tree
          </button>
          <button 
            onClick={() => setActiveLayer('bfs')}
            className={`px-4 py-2 rounded-lg font-mono text-sm uppercase transition-all ${activeLayer === 'bfs' ? 'bg-neon-cyan/20 border-neon-cyan/50 text-neon-cyan box-glow-cyan border' : 'bg-white/5 text-muted-foreground'}`}
          >
            BFS Animated Wave
          </button>
          <button 
            onClick={() => setActiveLayer('dijkstra')}
            className={`px-4 py-2 rounded-lg font-mono text-sm uppercase transition-all ${activeLayer === 'dijkstra' ? 'bg-neon-purple/20 border-neon-purple/50 text-neon-purple box-glow-purple border' : 'bg-white/5 text-muted-foreground'}`}
          >
            Dijkstra Cost Map
          </button>
        </div>

        <div className="flex justify-center bg-black/50 rounded-xl p-4 overflow-auto border border-white/5 max-h-[60vh]">
          <canvas ref={canvasRef} className="block rounded" />
        </div>
        
        <div className="mt-4 text-sm font-mono text-muted-foreground text-center">
          {activeLayer === 'astar' && "Visualizing the exact open set evaluated by the A* Hunter to find you."}
          {activeLayer === 'bfs' && "Animating the radial frontier expansion of the Sonar search."}
          {activeLayer === 'dijkstra' && "Displaying total stamina cost overlay evaluated globally starting from spawn."}
        </div>
      </div>
    </div>
  );
}
