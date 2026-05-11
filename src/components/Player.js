import { Play, Pause, Volume2, VolumeX } from 'lucide-react';

export default function Player({ currentRadio, isPlaying, onPlayPause, volume, onVolumeChange }) {
  if (!currentRadio) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-zinc-900/95 backdrop-blur-xl border-t border-zinc-800 p-4 z-50">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
        
        <div className="flex items-center gap-4 w-1/3 min-w-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={currentRadio.logo} className="w-12 h-12 rounded border border-zinc-700 hidden sm:block" alt="" />
          <div className="truncate">
            <h4 className="font-bold text-sm text-white truncate">{currentRadio.name}</h4>
            <p className="text-[10px] text-orange-500 font-bold uppercase tracking-widest">Transmitindo</p>
          </div>
        </div>

        <div className="flex flex-col items-center">
          <button 
            onClick={onPlayPause}
            className="bg-white text-black p-3 rounded-full hover:scale-105 transition-transform shadow-xl"
          >
            {isPlaying ? <Pause size={24} fill="black" /> : <Play size={24} fill="black" />}
          </button>
        </div>

        <div className="flex items-center gap-3 w-1/3 justify-end group">
          {volume == 0 ? <VolumeX size={20} className="text-zinc-500" /> : <Volume2 size={20} className="text-zinc-400 group-hover:text-orange-500" />}
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.01" 
            value={volume}
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
            className="w-20 sm:w-24 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
          />
        </div>

      </div>
    </div>
  );
}