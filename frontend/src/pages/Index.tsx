import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { GameAPI } from '@/lib/api';
import { Position, Cell, GhostState } from '@/lib/maze';
import { MazeRenderer } from '@/components/MazeRenderer';
import { GameHUD } from '@/components/GameHUD';
import { AlgorithmPanel } from '@/components/AlgorithmPanel';
import { AlgorithmInspector } from '@/components/AlgorithmInspector';
import { Button } from '@/components/ui/button';

type GameState = 'menu' | 'playing' | 'roguelite_shop' | 'won' | 'lost';

const CARDS = ['Stamina_Surge', 'Extra_Sonar', 'Heal'];

export default function Index() {
  const [gameState, setGameState] = useState<GameState>('menu');
  const [level, setLevel] = useState(1);
  const [seed, setSeed] = useState('ALPHA');
  const [grid, setGrid] = useState<Cell[][]>([]);
  const [rows, setRows] = useState(12);
  const [cols, setCols] = useState(16);
  const [playerPos, setPlayerPos] = useState<Position>({ row: 0, col: 0 });
  const [ghosts, setGhosts] = useState<GhostState[]>([]);
  const [exitPos, setExitPos] = useState<Position>({ row: 0, col: 0 });
  const [keys, setKeys] = useState<Position[]>([]);
  const [collectedKeys, setCollectedKeys] = useState<Set<string>>(new Set());
  
  const [stamina, setStamina] = useState(100);
  const [sonarCharges, setSonarCharges] = useState(3);
  const [sonarPath, setSonarPath] = useState<Position[]>([]);
  const [score, setScore] = useState(0);
  
  const [algorithmActive, setAlgorithmActive] = useState<string | null>(null);

  // Roguelite
  const [unlockedCards, setUnlockedCards] = useState<string[]>([]);
  const [activePower, setActivePower] = useState<string | null>(null);
  
  const [isAutoplay, setIsAutoplay] = useState(false);
  const [showDijkstra, setShowDijkstra] = useState(false);
  const [liveDijkstraMap, setLiveDijkstraMap] = useState<number[][] | undefined>(undefined);
  const [showGreedyPath, setShowGreedyPath] = useState(false);
  const [greedyPath, setGreedyPath] = useState<Position[]>([]);
  const [ghostInterval, setGhostInterval] = useState(800);
  const [dijkstraGhostEnabled, setDijkstraGhostEnabled] = useState(false);

  // Inspector State
  const [showInspector, setShowInspector] = useState(false);
  const [inspBfsWaves, setInspBfsWaves] = useState<Position[][]>([]);
  const [inspDijkstra, setInspDijkstra] = useState<number[][]>([]);
  const [inspAstar, setInspAstar] = useState<Position[]>([]);

  const socketRef = useRef<Socket | null>(null);
  const pk = (p: Position) => `${p.row},${p.col}`;
  const sonarWavesRef = useRef<Position[][]>([]);

  // Refs so socket handlers always see the latest values (avoids stale closures)
  const playerPosRef = useRef<Position>(playerPos);
  const gameStateRef = useRef<GameState>(gameState);
  const handleDeathRef = useRef<() => void>(() => {});

  useEffect(() => { playerPosRef.current = playerPos; }, [playerPos]);
  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);

  useEffect(() => {
    const s = io('http://localhost:3001', { withCredentials: true });
    socketRef.current = s;
    
    s.on('ghost:move', (data) => {
        if (data.ghostPositions) {
            setGhosts(data.ghostPositions);
            // Collision check: if any ghost has moved onto the player's cell → death
            if (gameStateRef.current === 'playing') {
                const pp = playerPosRef.current;
                const caught = data.ghostPositions.find(
                    (g: any) => g.pos.row === pp.row && g.pos.col === pp.col
                );
                if (caught) {
                    handleDeathRef.current();
                }
            }
        }
    });

    s.on('ghost:alert', () => {
        setAlgorithmActive('A*');
        setTimeout(() => setAlgorithmActive(null), 400);
    });

    return () => { s.disconnect(); };
  }, []);

  const loadGameState = (state: any) => {
    setGrid(state.grid);
    setRows(state.rows);
    setCols(state.cols);
    setPlayerPos(state.playerPos);
    setExitPos(state.exitPos);
    setKeys(state.keys);
    setCollectedKeys(new Set(state.collectedKeys));
    setStamina(state.stamina);
    setSonarCharges(state.sonarCharges);
    setScore(state.score);
    setLevel(state.floorLevel);
    setSeed(state.seed);
    if (state.ghostPositions) setGhosts(state.ghostPositions);
  };

  const initLevel = useCallback(async (lvl: number, preserveScore: number = 0, customSeed?: string) => {
    setAlgorithmActive('DFS');
    try {
      const state = await GameAPI.start(lvl, preserveScore, customSeed, activePower, unlockedCards);
      loadGameState(state);
    } catch(err) {
      console.error(err);
    }
    setSonarPath([]);
    setTimeout(() => setAlgorithmActive(null), 1500);
  }, [activePower, unlockedCards]);

  const startGame = useCallback(() => {
    setGameState('playing');
    initLevel(1, 0);
  }, [initLevel]);

  const resetMap = useCallback(() => {
    initLevel(level, score); // reroll seed but keep score
  }, [initLevel, level, score]);

  const triggerPostRunInspector = async () => {
      try {
          const ghostAstar = ghosts.find(g => g.type === 'astar');
          if (ghostAstar) setInspAstar(ghostAstar.openSet || []);
          
          const dijkstraRes = await GameAPI.dijkstra(grid, playerPos);
          setInspDijkstra(dijkstraRes.costMap || []);
          
          // Use the sonar waves captured during gameplay
          setInspBfsWaves(sonarWavesRef.current);

          setShowInspector(true);
      } catch (err) {
          console.error("Inspector error", err);
      }
  };

  const handleDeath = () => {
      setGameState('lost');
      triggerPostRunInspector();
  };
  handleDeathRef.current = handleDeath;

  const movePlayer = useCallback(async (dr: number, dc: number) => {
    if (gameState !== 'playing') return;

    let dir: 'up' | 'down' | 'left' | 'right' | null = null;
    if (dr === -1) dir = 'up';
    if (dr === 1) dir = 'down';
    if (dc === -1) dir = 'left';
    if (dc === 1) dir = 'right';
    if (!dir) return;

    try {
      const res = await GameAPI.move(dir);
      if (res.moved && res.state) {
          const nCell = res.state.grid[res.state.playerPos.row][res.state.playerPos.col];
          if (nCell.isSpeedBoost) {
              setAlgorithmActive('Bellman');
              setTimeout(() => setAlgorithmActive(null), 600);
          } else if (res.staminaDrain > 1) {
              setAlgorithmActive('Dijkstra');
              setTimeout(() => setAlgorithmActive(null), 600);
          }
          
          loadGameState(res.state);

          if (res.state.stamina <= 0) {
              handleDeath();
          } else {
              const deathGhost = res.state.ghostPositions.find((g: any) => g.pos.row === res.state.playerPos.row && g.pos.col === res.state.playerPos.col);
              if (deathGhost) {
                  handleDeath();
              } else if (res.state.playerPos.row === res.state.exitPos.row && res.state.playerPos.col === res.state.exitPos.col) {
                  setGameState('roguelite_shop');
                  triggerPostRunInspector(); 
              }
          }
      }
    } catch(err) {}
  }, [gameState, initLevel]);

  const triggerSonar = useCallback(async () => {
    if (sonarCharges <= 0 || gameState !== 'playing') return;
    
    const cost = 10;
    if (stamina <= cost) return;

    setAlgorithmActive('BFS');
    
    setStamina(s => s - cost); 
    setSonarCharges(c => c - 1);

    const targetList = [exitPos];

    try {
        const res = await GameAPI.sonar(grid, playerPos, targetList, 2);
        if (res.path) {
            setSonarPath(res.path);
            if (res.sonarWaves) {
                sonarWavesRef.current = res.sonarWaves; // persist for inspector replay
                setInspBfsWaves(res.sonarWaves);
            }
        }
    } catch(err) {}
    
    setTimeout(() => {
      setAlgorithmActive(null);
      setSonarPath([]);
    }, 4000);
  }, [sonarCharges, gameState, grid, playerPos, exitPos, stamina]);

  const triggerPower = useCallback(async () => {
      if (!activePower) return;
      try {
          const res = await GameAPI.power(activePower);
          if (res.state) loadGameState(res.state);
      } catch (err) {}
  }, [activePower]);

  const triggerGreedyPath = useCallback(async () => {
    if (showGreedyPath) {
      setShowGreedyPath(false);
      setGreedyPath([]);
      return;
    }
    setAlgorithmActive('Greedy');
    try {
      const res = await GameAPI.greedy(grid, playerPos, exitPos);
      if (res.fullPath && res.fullPath.length > 0) {
        setGreedyPath(res.fullPath);
        setShowGreedyPath(true);
      }
    } catch (err) {}
    setTimeout(() => setAlgorithmActive(null), 600);
  }, [showGreedyPath, grid, playerPos, exitPos]);

  const handleGhostSpeedUp = useCallback(async () => {
    try {
      const res = await GameAPI.ghostSpeed();
      if (res.speed !== undefined) setGhostInterval(res.speed);
    } catch (err) {}
  }, []);

  const handleGhostSpeedDown = useCallback(async () => {
    try {
      const res = await GameAPI.ghostSpeedDown();
      if (res.speed !== undefined) setGhostInterval(res.speed);
    } catch (err) {}
  }, []);

  const handleToggleDijkstraGhost = useCallback(async () => {
    try {
      const res = await GameAPI.toggleDijkstraGhost();
      if (res.enabled !== undefined) setDijkstraGhostEnabled(res.enabled);
    } catch (err) {}
  }, []);

  // Autoplay Logic Loop
  useEffect(() => {
      if (!isAutoplay || gameState !== 'playing') return;
      
      const interval = setInterval(async () => {
          try {
              const res = await GameAPI.astar(grid, playerPos, exitPos, 'manhattan');
              const nextStep = res.nextStep;
              if (nextStep) {
                  const dr = nextStep.row - playerPos.row;
                  const dc = nextStep.col - playerPos.col;
                  movePlayer(dr, dc);
              } else {
                  // If no path is found (which shouldn't happen unless boxed in), just turn it off safely
                  setIsAutoplay(false);
              }
          } catch(err) {
              setIsAutoplay(false);
          }
      }, 250); // move 4 times a second

      return () => clearInterval(interval);
  }, [isAutoplay, gameState, grid, playerPos, exitPos, movePlayer]);

  // Live Dijkstra Updating Hook
  useEffect(() => {
      if (showDijkstra && gameState === 'playing' && grid.length > 0) {
          GameAPI.dijkstra(grid, playerPos).then(res => {
              if (res.costMap) setLiveDijkstraMap(res.costMap);
          }).catch(() => {});
      } else {
          setLiveDijkstraMap(undefined);
      }
  }, [showDijkstra, gameState, grid, playerPos]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (showInspector) return; // ignore background inputs
      if (gameState === 'menu' || gameState === 'won' || gameState === 'lost') {
        if (e.key === 'Enter') startGame();
        return;
      }

      switch (e.key) {
        case 'ArrowUp': case 'w': case 'W': e.preventDefault(); movePlayer(-1, 0); break;
        case 'ArrowDown': case 's': case 'S': e.preventDefault(); movePlayer(1, 0); break;
        case 'ArrowLeft': case 'a': case 'A': e.preventDefault(); movePlayer(0, -1); break;
        case 'ArrowRight': case 'd': case 'D': e.preventDefault(); movePlayer(0, 1); break;
        case ' ': e.preventDefault(); triggerSonar(); break;
        case 'q': case 'Q': e.preventDefault(); triggerSonar(); break;
        case 'r': case 'R': resetMap(); break;
        case 'l': case 'L': e.preventDefault(); setIsAutoplay(prev => !prev); break;
        case 'm': case 'M': e.preventDefault(); setShowDijkstra(prev => !prev); break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [gameState, movePlayer, triggerSonar, startGame, resetMap, triggerPower, showInspector, setIsAutoplay, setShowDijkstra]);


  if (gameState === 'menu') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-cyan/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neon-purple/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="glass-panel rounded-3xl p-12 max-w-2xl w-full text-center relative z-10 box-glow-cyan animate-float">
          <div className="space-y-6 mb-12">
            <h2 className="text-neon-cyan tracking-[0.3em] text-sm font-bold uppercase drop-shadow-md">Welcome To</h2>
            <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white via-neon-cyan to-neon-purple drop-shadow-lg tracking-tighter">
              LABYRINTH
            </h1>
            <p className="text-xl text-muted-foreground font-mono tracking-wide">The Algorithmic Escape</p>
          </div>
          <Button
            onClick={startGame}
            className="w-full h-16 text-xl font-bold tracking-[0.2em] bg-neon-cyan text-black hover:bg-white hover:text-black hover:shadow-[0_0_30px_var(--neon-cyan)] transition-all duration-300"
          >
            INITIALIZE RUN
          </Button>
          <p className="text-xs text-muted-foreground mt-6 font-mono tracking-widest uppercase">Press [ENTER] to begin</p>
        </div>
      </div>
    );
  }

  if (gameState === 'roguelite_shop') {
      return (
          <div className="min-h-screen flex items-center justify-center p-4 relative">
             <div className="glass-panel border-neon-cyan/50 shadow-[0_0_50px_rgba(var(--neon-cyan),0.15)] rounded-3xl p-12 max-w-2xl w-full text-center">
                 <h1 className="text-4xl font-black text-neon-cyan mb-2 tracking-tighter drop-shadow-lg">FLOOR CLEARED</h1>
                 <p className="text-muted-foreground mb-8 text-sm">Select an algorithm enhancement for the next floor</p>
                 
                 <div className="grid grid-cols-3 gap-4 mb-8">
                     {CARDS.map(c => (
                         <button 
                            key={c}
                            onClick={() => {
                                setUnlockedCards(prev => [...prev, c]);
                                setActivePower(c);
                                setShowInspector(false);
                                initLevel(level + 1, score + Math.round(stamina) * 10);
                                setGameState('playing');
                            }}
                            className="bg-black/30 border border-white/10 hover:border-neon-cyan/50 hover:bg-neon-cyan/10 p-4 flex flex-col items-center justify-center rounded-xl transition-all"
                         >
                            <span className="text-lg font-bold text-white mb-2">{c.replace('_', ' ')}</span>
                         </button>
                     ))}
                 </div>
                 <Button onClick={() => setShowInspector(true)} variant="outline" className="text-xs">VIEW PERFORMANCE INSPECTOR</Button>
             </div>
             {showInspector && (
                <AlgorithmInspector 
                     grid={grid} rows={rows} cols={cols} 
                     bfsWaves={inspBfsWaves} dijkstraCostMap={inspDijkstra} astarOpenSet={inspAstar}
                     onClose={() => setShowInspector(false)}
                />
            )}
          </div>
      );
  }

  if (gameState === 'won' || gameState === 'lost') {
    const isWon = gameState === 'won';
    const accentColor = isWon ? 'neon-green' : 'neon-red';
    
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative">
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-${accentColor}/20 rounded-full blur-[120px] pointer-events-none`} />

        <div className={`glass-panel border-${accentColor}/50 shadow-[0_0_50px_rgba(var(--${accentColor}),0.15)] rounded-3xl p-12 max-w-lg w-full text-center relative z-10`}>
          <h1 className={`text-6xl font-black text-${accentColor} mb-6 tracking-tighter drop-shadow-lg`}>
            {isWon ? 'ESCAPED' : 'TERMINATED'}
          </h1>
          
          <div className="bg-black/30 rounded-xl p-6 mb-8 border border-white/5">
            <p className="text-sm text-muted-foreground font-mono uppercase tracking-widest mb-2">Final Score</p>
            <p className="text-5xl font-mono text-white tracking-tight">{score}</p>
          </div>

          <div className="flex flex-col gap-3">
              <Button 
                onClick={startGame} 
                className={`w-full h-14 font-bold tracking-[0.15em] bg-${accentColor} text-black hover:bg-white hover:text-black transition-all duration-300`}
              >
                {isWon ? 'NEXT DEPLOYMENT' : 'RETRY RUN'}
              </Button>
              <Button onClick={() => setShowInspector(true)} variant="outline" className="border-white/10 text-white/50 hover:text-white">
                  OPEN ALGORITHM INSPECTOR
              </Button>
          </div>
        </div>
        
        {showInspector && (
            <AlgorithmInspector 
                 grid={grid} rows={rows} cols={cols} 
                 bfsWaves={inspBfsWaves} dijkstraCostMap={inspDijkstra} astarOpenSet={inspAstar}
                 onClose={() => setShowInspector(false)}
            />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col p-4 md:p-6 lg:p-8 gap-6 max-w-[1600px] mx-auto">
      
      {/* Top HUD */}
      <GameHUD
        level={level}
        seed={seed}
        stamina={stamina}
        maxStamina={activePower === 'Stamina_Surge' ? 150 : 100}
        sonarCharges={sonarCharges}
        keysCollected={collectedKeys.size}
        totalKeys={keys.length}
        score={score}
        algorithmActive={algorithmActive}
      />
      
      {/* Main Game Area */}
      <div className="flex-1 flex flex-col lg:flex-row gap-6 items-start justify-center min-h-0 relative">
        
        {/* Left Side: Algorithm Panel */}
        <div className="shrink-0 hidden lg:block w-80">
          <AlgorithmPanel
            onSonar={triggerSonar}
            sonarCharges={sonarCharges}
            algorithmActive={algorithmActive}
            unlockedCards={unlockedCards}
            isAutoplay={isAutoplay}
            toggleAutoplay={() => setIsAutoplay(p => !p)}
            showDijkstra={showDijkstra}
            toggleDijkstra={() => setShowDijkstra(p => !p)}
            onResetMap={resetMap}
            onGreedyPath={triggerGreedyPath}
            showGreedyPath={showGreedyPath}
            onGhostSpeedUp={handleGhostSpeedUp}
            onGhostSpeedDown={handleGhostSpeedDown}
            ghostInterval={ghostInterval}
            dijkstraGhostEnabled={dijkstraGhostEnabled}
            onToggleDijkstraGhost={handleToggleDijkstraGhost}
          />
        </div>
        
        {/* Center: Maze Grid Canvas */}
        <div className="flex-1 w-full flex items-center justify-center">
          <MazeRenderer
            grid={grid}
            rows={rows}
            cols={cols}
            playerPos={playerPos}
            ghosts={ghosts}
            exitPos={exitPos}
            keys={keys}
            collectedKeys={collectedKeys}
            sonarPath={sonarPath}
            liveDijkstraMap={liveDijkstraMap}
            greedyPath={greedyPath}
          />
        </div>

      </div>
    </div>
  );
}
