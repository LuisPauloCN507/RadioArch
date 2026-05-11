import { Play, Pause } from 'lucide-react';

export default function RadioCard({ radio, isActive, isPlaying }) {
  return (
    <div className={`group relative bg-zinc-900/50 border transition-all duration-300 p-4 rounded-xl hover:bg-zinc-800/50 ${isActive ? 'border-orange-500 shadow-lg shadow-orange-500/10' : 'border-zinc-800'}`}>
      <div className="flex items-center gap-4">
        
        <div className="relative w-16 h-16 bg-zinc-800 rounded-lg overflow-hidden flex items-center justify-center border border-zinc-700">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={radio.logo} alt={radio.name} className="w-full h-full object-cover" />

          {/* Animação de Ondas de Som */}
          {isActive && isPlaying && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center gap-1">
              <div className="w-1 bg-orange-500 h-3 animate-bounce"></div>
              <div className="w-1 bg-orange-500 h-5 animate-bounce [animation-delay:0.2s]"></div>
              <div className="w-1 bg-orange-500 h-2 animate-bounce [animation-delay:0.4s]"></div>
            </div>
          )}
        </div>

        <div className="flex-1">
          <h3 className={`font-bold transition-colors ${isActive ? 'text-orange-500' : 'text-zinc-100'}`}>
            {radio.name}
          </h3>
          <p className="text-sm text-zinc-500">{radio.city}</p>
        </div>

        <div className={`transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
          <button className="bg-orange-500 p-3 rounded-full shadow-lg text-white">
            {isActive && isPlaying ? <Pause size={18} fill="white" /> : <Play size={18} fill="white" />}
          </button>
        </div>
      </div>
    </div>
  );
}