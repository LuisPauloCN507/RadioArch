import { Pause, Play, Volume2, VolumeX } from 'lucide-react';

const RadioInfo = ({ radio, isPlaying }) => (
  <div className="flex items-center gap-4 w-1/3 min-w-0 font-mono">
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img 
      src={radio.logo} 
      alt={radio.name}
      className="w-12 h-12 border border-cyan-900 hidden sm:block object-cover grayscale opacity-80" 
    />
    <div className="truncate flex flex-col justify-center">
      <div className="flex items-center gap-2 mb-1">
        <span className={`${isPlaying ? 'text-cyan-400' : 'text-zinc-500'} font-bold tracking-widest uppercase text-[10px]`}>
          {isPlaying ? '>>> ON_AIR' : '|| STANDBY'}
        </span>
        
        {/* NOVA ANIMAÇÃO: Equalizador (só aparece se estiver a tocar) */}
        {isPlaying && (
          <div className="flex items-end gap-0.5 h-3">
            <div className="w-0.75 bg-cyan-400 animate-eq1"></div>
            <div className="w-0.75 bg-cyan-400 animate-eq2"></div>
            <div className="w-0.75 bg-cyan-400 animate-eq3"></div>
          </div>
        )}
      </div>

      <h4 className="font-bold text-sm text-zinc-200 truncate tracking-wide">{radio.name}</h4>
    </div>
  </div>
);

const PlayButton = ({ isPlaying, onPlayPause }) => (
  <div className="flex flex-col items-center">
    <button 
      onClick={onPlayPause}
      className={`w-14 h-14 flex items-center justify-center border transition-all duration-300 ${
        isPlaying 
          ? 'bg-cyan-500 text-black border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.4)]' 
          : 'bg-black text-cyan-500 border-cyan-900 hover:border-cyan-400 hover:bg-cyan-950/30'
      }`}
      aria-label={isPlaying ? 'Pausar' : 'Reproduzir'}
    >
      {isPlaying ? (
        <Pause size={24} fill="currentColor" />
      ) : (
        <Play size={24} fill="currentColor" />
      )}
    </button>
  </div>
);

const VolumeControl = ({ volume, onVolumeChange }) => (
  <div className="flex items-center gap-3 w-1/3 justify-end group">
    {volume === 0 ? (
      <VolumeX size={20} className="text-orange-500" />
    ) : (
      <Volume2 size={20} className="text-cyan-600" />
    )}
    <input 
      type="range" 
      min="0" 
      max="1" 
      step="0.01" 
      value={volume}
      onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
      className="w-20 sm:w-24 h-1 bg-zinc-800 appearance-none cursor-pointer accent-cyan-500 rounded-none"
      aria-label="Controle de volume"
    />
  </div>
);

export default function Player({ currentRadio, isPlaying, onPlayPause, volume, onVolumeChange }) {
  if (!currentRadio) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-md border-t border-cyan-900/50 p-4 z-50">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4 relative">
        
        {/* Cantos Decorativos do Player */}
        <div className="absolute -top-4 -left-4 w-2 h-2 bg-cyan-500 hidden sm:block"></div>
        <div className="absolute -bottom-4 -right-4 w-2 h-2 bg-orange-500 hidden sm:block"></div>

        <RadioInfo radio={currentRadio} isPlaying={isPlaying} />
        <PlayButton isPlaying={isPlaying} onPlayPause={onPlayPause} />
        <VolumeControl volume={volume} onVolumeChange={onVolumeChange} />
      </div>
    </div>
  );
}