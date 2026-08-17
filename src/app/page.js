'use client';

import Player from '@/components/Player';
import RadioCard from '@/components/RadioCard';
import SysPanel from '@/components/SysPanel';
import TerminalCLI from '@/components/TerminalCLI';
import { radioList } from '@/data/radios';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

const TRACK_SPACING = 200; 

function RadioDeckItem({ radio, isCenter, offset, onSelect, isGlitching }) {
  return (
    <div
      onClick={onSelect}
      className={`absolute cursor-pointer transition-all duration-700 ease-out ${
        isCenter && isGlitching ? 'glitch-effect' : ''
      }`}
      style={{
        transform: `translateX(${offset * TRACK_SPACING}px) ${isCenter && isGlitching ? 'skewX(5deg) scale(1.05)' : ''}`,
        zIndex: 10 - Math.abs(offset),
        filter: isCenter && isGlitching ? 'contrast(150%) saturate(150%) hue-rotate(15deg)' : 'none',
      }}
    >
      <RadioCard radio={radio} isCenter={isCenter} />
    </div>
  );
}

export default function Home() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [isGlitching, setIsGlitching] = useState(false);
  
  const [favorites, setFavorites] = useState([]);
  const [filterMode, setFilterMode] = useState('all'); 
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  
  const audioRef = useRef(null);

  const displayRadios = filterMode === 'favs' && favorites.length > 0 
    ? radioList.filter(r => favorites.includes(r.id)) 
    : radioList;

  useEffect(() => {
    setTimeout(() => {
      const savedIndex = localStorage.getItem('radioarch_index');
      const savedVolume = localStorage.getItem('radioarch_volume');
      const savedFavs = localStorage.getItem('radioarch_favs');
      
      if (savedIndex !== null) setActiveIndex(parseInt(savedIndex, 10));
      if (savedVolume !== null) setVolume(parseFloat(savedVolume));
      if (savedFavs) setFavorites(JSON.parse(savedFavs));
    }, 0);
  }, []);

  useEffect(() => { localStorage.setItem('radioarch_index', activeIndex.toString()); }, [activeIndex]);
  useEffect(() => { 
    localStorage.setItem('radioarch_volume', volume.toString());
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);
  useEffect(() => { localStorage.setItem('radioarch_favs', JSON.stringify(favorites)); }, [favorites]);

  const radioCount = displayRadios.length;
  const safeIndex = activeIndex >= radioCount ? 0 : activeIndex;
  const currentRadio = displayRadios[safeIndex];
  
  const previousIndex = (safeIndex - 1 + radioCount) % radioCount;
  const nextIndex = (safeIndex + 1) % radioCount;

  const handleToggleFavorite = () => {
    if (!currentRadio) return;
    setFavorites(prev => 
      prev.includes(currentRadio.id) 
        ? prev.filter(id => id !== currentRadio.id) 
        : [...prev, currentRadio.id]
    );
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentRadio) return;

    if (isPlaying) {
      audio.play().catch(() => setIsPlaying(false));
    } else {
      audio.pause();
    }
  }, [isPlaying, currentRadio]);

  const resetAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
  }, []);

  const changeRadio = useCallback((index) => {
    setIsGlitching(true);
    setIsPlaying(false);
    resetAudio();
    setActiveIndex(index);
    setTimeout(() => setIsGlitching(false), 400);
  }, [resetAudio]);

  useEffect(() => {
    if (audioRef.current && currentRadio) {
      audioRef.current.src = currentRadio.url;
      audioRef.current.load();
    }
  }, [currentRadio]);

  const handleCommand = (cmdStr) => {
    const args = cmdStr.split(' ');
    const command = args[0];
    const value = args[1];

    switch (command) {
      case 'play': setIsPlaying(true); break;
      case 'pause': setIsPlaying(false); break;
      case 'next': changeRadio(nextIndex); break;
      case 'prev': changeRadio(previousIndex); break;
      case 'vol':
      case 'volume':
        if (value && !isNaN(value)) setVolume(Math.min(100, Math.max(0, parseInt(value))) / 100);
        break;
      case 'favs': 
        setFilterMode('favs'); 
        setActiveIndex(0); 
        break;
      case 'all': 
        setFilterMode('all'); 
        setActiveIndex(0); 
        break;
      default:
        const foundIndex = displayRadios.findIndex(r => 
          r.name.toLowerCase().includes(command) || r.genre.toLowerCase().includes(command)
        );
        if (foundIndex !== -1) {
          changeRadio(foundIndex);
          setIsPlaying(true);
        }
        break;
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === '/') {
        if (!isTerminalOpen) {
          e.preventDefault();
          setIsTerminalOpen(true);
        }
        return;
      }

      if (isTerminalOpen || e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      switch (e.code) {
        case 'Space': e.preventDefault(); setIsPlaying((prev) => !prev); break;
        case 'ArrowRight': e.preventDefault(); changeRadio(nextIndex); break;
        case 'ArrowLeft': e.preventDefault(); changeRadio(previousIndex); break;
        case 'ArrowUp': e.preventDefault(); setVolume((prev) => Math.min(prev + 0.1, 1)); break;
        case 'ArrowDown': e.preventDefault(); setVolume((prev) => Math.max(prev - 0.1, 0)); break;
        case 'KeyM': e.preventDefault(); setVolume((prev) => (prev > 0 ? 0 : 0.5)); break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextIndex, previousIndex, changeRadio, isTerminalOpen]);

  return (
    <main className="min-h-screen bg-[#09090b] text-white overflow-hidden flex flex-col items-center justify-center font-mono relative selection:bg-cyan-500 selection:text-black">
      
      <SysPanel />

      <div className="pointer-events-none fixed inset-0 z-40 opacity-[0.03] bg-[linear-gradient(rgba(255,255,255,0)_50%,rgba(0,0,0,0.5)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-size-[100%_4px,3px_100%]" />

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes glitch-anim { 0% { clip-path: inset(10% 0 80% 0); transform: translate(-3px, 2px); filter: drop-shadow(2px 0 0 red) drop-shadow(-2px 0 0 cyan); } 20% { clip-path: inset(80% 0 5% 0); transform: translate(3px, -2px); filter: drop-shadow(-2px 0 0 red) drop-shadow(2px 0 0 cyan); } 40% { clip-path: inset(30% 0 50% 0); transform: translate(-3px, 1px); filter: drop-shadow(3px 0 0 red) drop-shadow(-3px 0 0 cyan); } 60% { clip-path: inset(70% 0 10% 0); transform: translate(2px, -1px); filter: drop-shadow(-3px 0 0 red) drop-shadow(3px 0 0 cyan); } 80% { clip-path: inset(20% 0 60% 0); transform: translate(-1px, 3px); filter: drop-shadow(2px 0 0 red) drop-shadow(-2px 0 0 cyan); } 100% { clip-path: inset(50% 0 30% 0); transform: translate(0); filter: none; } }
        .glitch-effect { animation: glitch-anim 0.4s cubic-bezier(.25, .46, .45, .94) both; }
        .glitch-text { animation: glitch-anim 0.3s cubic-bezier(.25, .46, .45, .94) both; }
        @keyframes scan-anim { 0% { top: -10%; opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { top: 110%; opacity: 0; } }
        .animate-scan { animation: scan-anim 3s linear infinite; }
        @keyframes eq-anim { 0%, 100% { height: 4px; } 50% { height: 16px; } }
        .animate-eq1 { animation: eq-anim 0.8s ease-in-out infinite; }
        .animate-eq2 { animation: eq-anim 1.2s ease-in-out infinite 0.2s; }
        .animate-eq3 { animation: eq-anim 0.9s ease-in-out infinite 0.4s; }
      `}} />

      <audio ref={audioRef} />

      {/* HEADER RADIO ARCH */}
      <div className="absolute top-8 text-center z-10 font-sans">
        <h1 className="text-xl font-black tracking-[0.3em] opacity-40 uppercase italic">
          RADIO<span className="text-orange-500">ARCH</span>
        </h1>
        {filterMode === 'favs' && (
          <div className="mt-2 text-[10px] text-yellow-500 font-mono tracking-widest border border-yellow-900/50 bg-yellow-900/20 px-2 py-1 inline-block">
            [ FILTER: FAVORITES ]
          </div>
        )}
      </div>

      {/* NOVO: CONTROLE DE VOLUME LATERAL */}
      <div className="absolute right-8 top-1/2 -translate-y-1/2 flex flex-col items-center justify-between h-48 z-50">
        <span className="text-[10px] text-cyan-500 font-mono tracking-widest uppercase bg-cyan-900/20 px-1 border border-cyan-900/50">
          Vol
        </span>
        
        <div className="w-8 h-32 flex items-center justify-center">
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-32 h-1 appearance-none bg-zinc-800 rounded-full outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-cyan-400 [&::-webkit-slider-thumb]:rounded-full cursor-pointer -rotate-90 origin-center"
          />
        </div>

        <span className="text-[10px] text-zinc-500 font-mono w-8 text-center">
          {Math.round(volume * 100)}%
        </span>
      </div>

      {/* DECK DE RADIOS */}
      <div className="relative w-full h-100 flex items-center justify-center overflow-visible z-10">
        <button
          onClick={() => changeRadio(previousIndex)}
          className="absolute left-6 z-50 p-4 text-zinc-700 hover:text-cyan-400 transition-colors"
        >
          <ChevronLeft size={48} strokeWidth={1} />
        </button>

        <div className="relative flex items-center justify-center w-full max-w-7xl">
          {displayRadios.map((radio, index) => {
            const isCenter = index === safeIndex;
            const offset = index - safeIndex;

            return (
              <RadioDeckItem
                key={radio.id}
                radio={radio}
                isCenter={isCenter}
                offset={offset}
                onSelect={() => changeRadio(index)}
                isGlitching={isGlitching}
              />
            );
          })}
        </div>

        <button
          onClick={() => changeRadio(nextIndex)}
          className="absolute right-6 z-50 p-4 text-zinc-700 hover:text-cyan-400 transition-colors"
        >
          <ChevronRight size={48} strokeWidth={1} />
        </button>
      </div>

      {/* NOME DA RADIO E EQUALIZADOR */}
      <div className={`absolute bottom-32 text-center z-10 transition-opacity flex flex-col items-center ${isGlitching ? 'glitch-text opacity-70' : 'opacity-100'}`}>
        
        {/* NOVO: ONDAS SONORAS */}
        <div className="flex items-end justify-center gap-1.5 h-4 mb-4">
          {isPlaying ? (
            <>
              <div className="w-1.5 bg-cyan-400 animate-eq1 shadow-[0_0_8px_rgba(34,211,238,0.8)]"></div>
              <div className="w-1.5 bg-cyan-400 animate-eq2 shadow-[0_0_8px_rgba(34,211,238,0.8)]"></div>
              <div className="w-1.5 bg-cyan-400 animate-eq3 shadow-[0_0_8px_rgba(34,211,238,0.8)]"></div>
              <div className="w-1.5 bg-cyan-400 animate-eq1 shadow-[0_0_8px_rgba(34,211,238,0.8)]" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-1.5 bg-cyan-400 animate-eq2 shadow-[0_0_8px_rgba(34,211,238,0.8)]" style={{ animationDelay: '0.3s' }}></div>
            </>
          ) : (
            <>
              <div className="w-1.5 h-1 bg-zinc-800"></div>
              <div className="w-1.5 h-1 bg-zinc-800"></div>
              <div className="w-1.5 h-1 bg-zinc-800"></div>
              <div className="w-1.5 h-1 bg-zinc-800"></div>
              <div className="w-1.5 h-1 bg-zinc-800"></div>
            </>
          )}
        </div>

        <h2 className="text-2xl font-bold text-white tracking-wider">{currentRadio?.name}</h2>
        <p className="text-cyan-500 text-xs mt-2 font-medium tracking-[0.3em] uppercase">[{currentRadio?.genre}]</p>
      </div>

      <TerminalCLI 
        isOpen={isTerminalOpen} 
        onClose={() => setIsTerminalOpen(false)} 
        onCommand={handleCommand}
      />

      <Player 
        currentRadio={currentRadio} 
        isPlaying={isPlaying} 
        onPlayPause={() => setIsPlaying(!isPlaying)}
        volume={volume}
        onVolumeChange={setVolume}
        isFavorite={favorites.includes(currentRadio?.id)}
        toggleFavorite={handleToggleFavorite}
      />
    </main>
  );
}