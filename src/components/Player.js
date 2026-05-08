import { Play, Pause, Volume2 } from 'lucide-react';

export default function Player({ currentRadio, isPlaying, onPlayPause }) {
  if (!currentRadio) return null; // Só aparece se tiver uma rádio selecionada

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-zinc-900/90 backdrop-blur-lg border-t border-zinc-800 p-4 animate-in slide-in-from-bottom duration-500">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        
        {/* Info da Rádio */}
        <div className="flex items-center gap-4 w-1/3">
          <div className="w-12 h-12 bg-orange-500 rounded flex items-center justify-center font-bold">
            {currentRadio.name.substring(0, 1)}
          </div>
          <div>
            <h4 className="font-bold text-sm truncate">{currentRadio.name}</h4>
            <p className="text-xs text-zinc-400">{currentRadio.city}</p>
          </div>
        </div>

        {/* Controles */}
        <div className="flex flex-col items-center gap-2">
          <button 
            onClick={onPlayPause}
            className="bg-white text-black p-3 rounded-full hover:scale-105 transition-transform"
          >
            {isPlaying ? <Pause size={24} fill="black" /> : <Play size={24} fill="black" />}
          </button>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Ao Vivo</p>
        </div>

        {/* Volume (Visual apenas por enquanto) */}
        <div className="flex items-center gap-2 w-1/3 justify-end text-zinc-400">
          <Volume2 size={20} />
          <div className="w-24 h-1 bg-zinc-700 rounded-full overflow-hidden">
            <div className="w-3/4 h-full bg-orange-500"></div>
          </div>
        </div>

      </div>
    </div>
  );
}