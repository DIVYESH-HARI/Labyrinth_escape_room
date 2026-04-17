import { Badge } from "@/components/ui/badge";

interface AlgorithmPanelProps {
  onSonar: () => void;
  sonarCharges: number;
  algorithmActive: string | null;
  unlockedCards: string[];
  isAutoplay: boolean;
  toggleAutoplay: () => void;
  showDijkstra: boolean;
  toggleDijkstra: () => void;
  onResetMap: () => void;
  onGreedyPath: () => void;
  showGreedyPath: boolean;
  onGhostSpeedUp: () => void;
  onGhostSpeedDown: () => void;
  ghostInterval: number;
  dijkstraGhostEnabled: boolean;
  onToggleDijkstraGhost: () => void;
}

export function AlgorithmPanel({
  onSonar,
  sonarCharges,
  algorithmActive,
  unlockedCards,
  isAutoplay,
  toggleAutoplay,
  showDijkstra,
  toggleDijkstra,
  onResetMap,
  onGreedyPath,
  showGreedyPath,
  onGhostSpeedUp,
  onGhostSpeedDown,
  ghostInterval,
  dijkstraGhostEnabled,
  onToggleDijkstraGhost,
}: AlgorithmPanelProps) {

  const ghostSpeedLabel =
    ghostInterval <= 200 ? "BERSERK" :
    ghostInterval <= 400 ? "FAST" :
    ghostInterval <= 600 ? "NORMAL" :
    ghostInterval <= 900 ? "SLOW" : "CRAWL";

  const ghostSpeedColor =
    ghostInterval <= 200 ? "text-neon-red" :
    ghostInterval <= 400 ? "text-neon-amber" :
    ghostInterval <= 600 ? "text-neon-cyan" :
    "text-muted-foreground";

  return (
    <div className="w-80 glass-panel rounded-2xl p-5 flex flex-col gap-5 sticky top-4 h-[calc(100vh-8rem)] overflow-y-auto custom-scrollbar">

      <div className="space-y-1">
        <h3 className="text-xs font-mono text-neon-cyan glow-cyan uppercase tracking-[0.2em] font-bold">Algorithms</h3>
        <div className="w-full h-px bg-gradient-to-r from-neon-cyan/50 to-transparent" />
      </div>

      <div className="space-y-3 flex-1">

        {/* DFS */}
        <div className={`p-3 rounded-xl border transition-all duration-300 ${
          algorithmActive === 'DFS' ? 'border-neon-green/50 bg-neon-green/10 shadow-[0_0_15px_rgba(51,255,136,0.15)]' : 'border-white/5 bg-black/20'
        }`}>
          <div className="flex items-center gap-3 mb-1">
            <div className={`w-2 h-2 rounded-full ${algorithmActive === 'DFS' ? 'bg-neon-green shadow-[0_0_8px_#33ff88]' : 'bg-muted-foreground'}`} />
            <span className={`text-sm font-mono font-bold tracking-wider ${algorithmActive === 'DFS' ? 'text-neon-green' : 'text-foreground'}`}>DFS Generator</span>
          </div>
          <p className="text-[10px] text-muted-foreground leading-snug">Generates the maze using Depth-First Search.</p>
        </div>

        {/* BFS Sonar */}
        <div className={`p-3 rounded-xl border transition-all duration-300 ${
          algorithmActive === 'BFS' ? 'border-neon-cyan box-glow-cyan bg-neon-cyan/10 scale-[1.02]' : 'border-white/5 bg-black/20'
        }`}>
          <button
            onClick={onSonar}
            disabled={sonarCharges <= 0}
            className={`w-full text-left p-2 rounded transition-all ${sonarCharges > 0 ? 'hover:bg-white/5 cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
          >
            <div className="flex items-center gap-3 mb-1">
              <div className={`w-2 h-2 rounded-full ${algorithmActive === 'BFS' ? 'bg-neon-cyan animate-pulse' : 'bg-neon-cyan/50'}`} />
              <span className={`text-sm font-mono font-bold tracking-wider ${sonarCharges > 0 ? 'text-neon-cyan' : 'text-muted-foreground'}`}>BFS Sonar</span>
              <span className="ml-auto text-[10px] font-mono bg-neon-cyan/20 text-neon-cyan px-1.5 py-0.5 rounded">{sonarCharges} left</span>
            </div>
            <p className="text-[10px] text-muted-foreground leading-snug">
              Reveals shortest path to exit. Press <kbd className="bg-white/10 px-1 rounded text-white">Q</kbd> or <kbd className="bg-white/10 px-1 rounded text-white">SPC</kbd>
            </p>
          </button>
        </div>

        {/* A* Stalker */}
        <div className={`p-3 rounded-xl border transition-all duration-300 ${
          algorithmActive === 'A*' ? 'border-neon-red/60 bg-neon-red/10 shadow-[0_0_20px_rgba(255,51,102,0.2)]' : 'border-white/5 bg-black/20'
        }`}>
          <div className="flex items-center gap-3 mb-1">
            <div className={`w-2 h-2 rounded-full ${algorithmActive === 'A*' ? 'bg-neon-red shadow-[0_0_8px_#ff3366]' : 'bg-neon-red/50'}`} />
            <span className={`text-sm font-mono font-bold tracking-wider ${algorithmActive === 'A*' ? 'text-neon-red' : 'text-foreground'}`}>A* Stalker</span>
          </div>
          <p className="text-[10px] text-muted-foreground leading-snug">Hunts you with optimal A* precision.</p>
        </div>

        {/* Greedy Hunter */}
        <div className={`p-3 rounded-xl border transition-all duration-300 ${
          algorithmActive === 'Greedy' || showGreedyPath ? 'border-neon-amber/60 bg-neon-amber/10 shadow-[0_0_20px_rgba(255,184,51,0.2)]' : 'border-white/5 bg-black/20'
        }`}>
          <button onClick={onGreedyPath} className="w-full text-left p-2 rounded hover:bg-white/5 cursor-pointer transition-all">
            <div className="flex items-center gap-3 mb-1">
              <div className={`w-2 h-2 rounded-full ${algorithmActive === 'Greedy' || showGreedyPath ? 'bg-neon-amber shadow-[0_0_8px_#ffb833] animate-pulse' : 'bg-neon-amber/50'}`} />
              <span className={`text-sm font-mono font-bold tracking-wider ${showGreedyPath ? 'text-neon-amber' : 'text-foreground'}`}>Greedy Hunter</span>
              {showGreedyPath && <span className="ml-auto text-[9px] font-mono bg-neon-amber/30 text-neon-amber px-1.5 py-0.5 rounded animate-pulse">ON</span>}
            </div>
            <p className="text-[10px] text-muted-foreground leading-snug">Click to reveal fastest greedy route — ignores enemy danger.</p>
          </button>
        </div>

        {/* Dijkstra Ghost Toggle */}
        <div className={`p-3 rounded-xl border transition-all duration-300 ${
          dijkstraGhostEnabled ? 'border-neon-purple/60 bg-neon-purple/10 shadow-[0_0_20px_rgba(172,88,255,0.2)]' : 'border-white/5 bg-black/20'
        }`}>
          <button onClick={onToggleDijkstraGhost} className="w-full text-left p-2 rounded hover:bg-white/5 cursor-pointer transition-all">
            <div className="flex items-center gap-3 mb-1">
              <div className={`w-2 h-2 rounded-full ${dijkstraGhostEnabled ? 'bg-neon-purple shadow-[0_0_8px_#ac58ff] animate-pulse' : 'bg-neon-purple/50'}`} />
              <span className={`text-sm font-mono font-bold tracking-wider ${dijkstraGhostEnabled ? 'text-neon-purple' : 'text-foreground'}`}>Dijkstra Ghost</span>
              <span className={`ml-auto text-[9px] font-mono px-1.5 py-0.5 rounded ${dijkstraGhostEnabled ? 'bg-neon-purple/40 text-neon-purple' : 'bg-white/5 text-muted-foreground'}`}>
                {dijkstraGhostEnabled ? 'ON' : 'OFF'}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground leading-snug">
              {dijkstraGhostEnabled
                ? '⚠ Ghost uses weighted Dijkstra cost — avoids slow zones optimally.'
                : 'Enable to switch ghost AI to Dijkstra cost-weighted pathfinding.'}
            </p>
          </button>
        </div>

        {/* Ghost Speed Control */}
        <div className="p-3 rounded-xl border border-neon-red/20 bg-black/20 space-y-2">
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full bg-neon-red shadow-[0_0_6px_#ff3366] ${ghostInterval <= 300 ? 'animate-pulse' : ''}`} />
            <span className="text-sm font-mono font-bold tracking-wider text-foreground">Ghost Speed</span>
            <span className={`ml-auto text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-white/5 ${ghostSpeedColor}`}>
              {ghostSpeedLabel}
            </span>
          </div>

          {/* Speed bar */}
          <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${Math.max(5, 100 - ((ghostInterval - 100) / 1400) * 100)}%`,
                background: ghostInterval <= 300 ? '#ff3366' : ghostInterval <= 600 ? '#ffb833' : '#00ffff'
              }}
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={onGhostSpeedDown}
              disabled={ghostInterval >= 1500}
              className={`flex-1 text-[11px] font-mono py-1.5 rounded-lg border transition-all ${
                ghostInterval >= 1500
                  ? 'border-white/5 text-muted-foreground cursor-not-allowed opacity-50'
                  : 'border-white/20 text-white/70 hover:bg-white/5 hover:border-white/40 cursor-pointer'
              }`}
            >
              🐢 Slower
            </button>
            <button
              onClick={onGhostSpeedUp}
              disabled={ghostInterval <= 100}
              className={`flex-1 text-[11px] font-mono py-1.5 rounded-lg border transition-all ${
                ghostInterval <= 100
                  ? 'border-white/5 text-muted-foreground cursor-not-allowed opacity-50'
                  : 'border-neon-red/40 text-neon-red hover:bg-neon-red/10 hover:border-neon-red/70 cursor-pointer'
              }`}
            >
              ⚡ Faster
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground text-center">Tick: {ghostInterval}ms per step</p>
        </div>

      </div>

      {/* Controls Footer */}
      <div className="pt-4 border-t border-white/10 space-y-2">
        {unlockedCards.length > 0 && (
          <div className="mb-2">
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">CARDS</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {unlockedCards.map(c => <Badge key={c} variant="secondary" className="text-[9px] bg-white/10">{c}</Badge>)}
            </div>
          </div>
        )}
        <div className="grid grid-cols-2 gap-y-1.5 text-[10px] text-muted-foreground font-mono">
          <span>Move</span>
          <div className="flex items-center gap-1.5 justify-end"><kbd className="bg-white/10 px-1 rounded text-white py-0.5">WASD</kbd></div>
          <span>Sonar</span>
          <div className="flex items-center gap-1.5 justify-end">
            <kbd className="bg-white/10 px-1 rounded text-white py-0.5">Q</kbd>
            <span className="text-white/30">/</span>
            <kbd className="bg-white/10 px-1 rounded text-white py-0.5">SPC</kbd>
          </div>

          <button onClick={toggleAutoplay} className={`text-left flex items-center justify-between transition-colors col-span-2 py-1 ${isAutoplay ? 'text-neon-red font-bold' : 'hover:text-white'}`}>
            <span>Autoplay (AI Bot)</span>
            <kbd className={`px-1 rounded text-white py-0.5 ml-auto ${isAutoplay ? 'bg-neon-red text-black' : 'bg-white/10'}`}>L</kbd>
          </button>

          <button onClick={toggleDijkstra} className={`text-left flex items-center justify-between transition-colors col-span-2 py-1 ${showDijkstra ? 'text-neon-purple font-bold' : 'hover:text-white'}`}>
            <span>Live Dijkstra Heatmap</span>
            <kbd className={`px-1 rounded text-white py-0.5 ml-auto ${showDijkstra ? 'bg-neon-purple text-black' : 'bg-white/10'}`}>M</kbd>
          </button>

          <button onClick={onResetMap} className="text-left flex items-center justify-between hover:text-white transition-colors col-span-2 py-1">
            <span>Reset Map / Next Seed</span>
            <kbd className="bg-white/10 px-1 rounded text-white py-0.5 ml-auto">R</kbd>
          </button>
        </div>
      </div>
    </div>
  );
}
