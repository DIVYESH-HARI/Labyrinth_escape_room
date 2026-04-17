import { Badge } from "@/components/ui/badge";

interface GameHUDProps {
  level: number;
  seed: string;
  stamina: number;
  maxStamina: number;
  sonarCharges: number;
  keysCollected: number;
  totalKeys: number;
  score: number;
  algorithmActive: string | null;
}

export function GameHUD({ level, seed, stamina, maxStamina, sonarCharges, keysCollected, totalKeys, score, algorithmActive }: GameHUDProps) {
  const MathStamina = Math.max(0, Math.round(stamina));
  const staminaPercent = (MathStamina / maxStamina) * 100;
  
  const staminaColor = 
    staminaPercent > 60 ? 'bg-neon-green shadow-[0_0_10px_var(--neon-green)]' 
    : staminaPercent > 30 ? 'bg-neon-amber shadow-[0_0_10px_var(--neon-amber)]' 
    : 'bg-neon-red shadow-[0_0_10px_var(--neon-red)] animate-pulse';

  return (
    <div className="glass-panel rounded-2xl w-full max-w-[1200px] mx-auto p-4 flex flex-col md:flex-row items-center justify-between gap-4 z-10 transition-all duration-300">
      
      <div className="flex items-center gap-6">
        <div className="flex flex-col items-center">
          <span className="text-[10px] text-muted-foreground tracking-widest font-bold">FLOOR (SEED)</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold glow-cyan text-neon-cyan leading-none">{level}</span>
            <span className="text-xs font-mono text-muted-foreground uppercase">{seed}</span>
          </div>
        </div>

        <div className="w-px h-8 bg-white/10" />

        <div className="flex items-center gap-3 w-[200px]">
          <span className="text-xs font-mono font-bold text-muted-foreground tracking-wider">STA</span>
          <div className="flex-1 h-3 bg-black/50 rounded-full overflow-hidden border border-white/5 relative shadow-inner">
            <div
              className={`h-full ${staminaColor} transition-all duration-300 rounded-full ease-out`}
              style={{ width: `${staminaPercent}%` }}
            />
          </div>
          <span className="text-xs font-mono font-bold text-white w-7 text-right">{MathStamina}</span>
        </div>
      </div>

      <div className="flex-1 flex justify-center">
        {algorithmActive ? (
          <Badge variant="outline" className="border-neon-cyan/50 text-neon-cyan animate-pulse px-4 py-1 box-glow-cyan text-xs tracking-widest uppercase">
            {algorithmActive} Active
          </Badge>
        ) : (
          <span className="text-xs text-muted-foreground/50 tracking-widest uppercase font-mono">Systems Normal</span>
        )}
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="text-xl drop-shadow-[0_0_8px_rgba(0,255,255,0.8)]">📡</span>
          <span className="text-lg font-bold text-neon-cyan glow-cyan leading-none">{sonarCharges}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xl drop-shadow-[0_0_8px_rgba(255,184,33,0.8)]">🔑</span>
          <span className="text-lg font-bold text-neon-amber min-w-[3ch] leading-none">{keysCollected}/{totalKeys}</span>
        </div>

        <div className="w-px h-8 bg-white/10" />

        <div className="flex flex-col items-end">
          <span className="text-[10px] text-muted-foreground tracking-widest font-bold">SCORE</span>
          <span className="text-xl font-mono font-bold text-white leading-none tracking-tight drop-shadow-md">
            {score.toString().padStart(5, '0')}
          </span>
        </div>
      </div>
    </div>
  );
}
