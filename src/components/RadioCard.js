import { Play } from 'lucide-react';

export default function RadioCard({ radio }) {
  return (
    <div className="group relative bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl hover:bg-zinc-800/50 transition-all duration-300">
      <div className="flex items-center gap-4">
        {/* Placeholder da Logo */}
        <div className="w-16 h-16 bg-zinc-800 rounded-lg flex items-center justify-center text-zinc-600 group-hover:text-orange-500 transition-colors">
          {/* Quando tivermos as logos, usaremos a tag <img> aqui */}
          <span className="text-xs font-bold uppercase text-center p-1">
            {radio.name.substring(0, 2)}
          </span>
        </div>

        <div className="flex-1">
          <h3 className="font-bold text-zinc-100 group-hover:text-orange-500 transition-colors">
            {radio.name}
          </h3>
          <p className="text-sm text-zinc-500">{radio.city}</p>
          <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full uppercase tracking-widest mt-2 inline-block">
            {radio.genre}
          </span>
        </div>

        <button className="bg-orange-500 p-3 rounded-full opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 shadow-lg shadow-orange-500/20">
          <Play size={20} fill="currentColor" className="text-white" />
        </button>
      </div>
    </div>
  );
}