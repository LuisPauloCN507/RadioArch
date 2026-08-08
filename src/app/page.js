'use client';

import Player from '@/components/Player';
import RadioCard from '@/components/RadioCard';
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
  const audioRef = useRef(null);

  const radioCount = radioList.length;
  const currentRadio = radioList[activeIndex];
  const previousIndex = (activeIndex - 1 + radioCount) % radioCount;
  const nextIndex = (activeIndex + 1) % radioCount;

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

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
    
    setTimeout(() => {
      setIsGlitching(false);
    }, 400);
  }, [resetAudio]);

  useEffect(() => {
    if (audioRef.current && currentRadio) {
      audioRef.current.src = currentRadio.url;
      audioRef.current.load();
    }
  }, [currentRadio]);

  return (
    <main className="min-h-screen bg-[#09090b] text-white overflow-hidden flex flex-col items-center justify-center font-mono relative selection:bg-cyan-500 selection:text-black">
      
      {/* Efeito CRT Scanlines */}
      <div className="pointer-events-none fixed inset-0 z-40 opacity-[0.03] bg-[linear-gradient(rgba(255,255,255,0)_50%,rgba(0,0,0,0.5)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-size-[100%_4px,3px_100%]" />

      {/* Estilos das Novas Animações + Glitch */}
      <style dangerouslySetInnerHTML={{__html: `
        /* Animação do Glitch */
        @keyframes glitch-anim {
          0% { clip-path: inset(10% 0 80% 0); transform: translate(-3px, 2px); filter: drop-shadow(2px 0 0 red) drop-shadow(-2px 0 0 cyan); }
          20% { clip-path: inset(80% 0 5% 0); transform: translate(3px, -2px); filter: drop-shadow(-2px 0 0 red) drop-shadow(2px 0 0 cyan); }
          40% { clip-path: inset(30% 0 50% 0); transform: translate(-3px, 1px); filter: drop-shadow(3px 0 0 red) drop-shadow(-3px 0 0 cyan); }
          60% { clip-path: inset(70% 0 10% 0); transform: translate(2px, -1px); filter: drop-shadow(-3px 0 0 red) drop-shadow(3px 0 0 cyan); }
          80% { clip-path: inset(20% 0 60% 0); transform: translate(-1px, 3px); filter: drop-shadow(2px 0 0 red) drop-shadow(-2px 0 0 cyan); }
          100% { clip-path: inset(50% 0 30% 0); transform: translate(0); filter: none; }
        }
        .glitch-effect { animation: glitch-anim 0.4s cubic-bezier(.25, .46, .45, .94) both; }
        .glitch-text { animation: glitch-anim 0.3s cubic-bezier(.25, .46, .45, .94) both; }

        /* Animação Scanner Line */
        @keyframes scan-anim {
          0% { top: -10%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 110%; opacity: 0; }
        }
        .animate-scan { animation: scan-anim 3s linear infinite; }

        /* Animação Equalizador */
        @keyframes eq-anim {
          0%, 100% { height: 3px; }
          50% { height: 12px; }
        }
        .animate-eq1 { animation: eq-anim 0.8s ease-in-out infinite; }
        .animate-eq2 { animation: eq-anim 1.2s ease-in-out infinite 0.2s; }
        .animate-eq3 { animation: eq-anim 0.9s ease-in-out infinite 0.4s; }
      `}} />

      <audio ref={audioRef} />

      {/* TÍTULO / LOGO ORIGINAL RESTAURADO */}
      <div className="absolute top-8 text-center z-10 font-sans">
        <h1 className="text-xl font-black tracking-[0.3em] opacity-40 uppercase italic">
          RADIO<span className="text-orange-500">ARCH</span>
        </h1>
      </div>

      <div className="relative w-full h-100 flex items-center justify-center overflow-visible z-10">
        <button
          onClick={() => changeRadio(previousIndex)}
          className="absolute left-6 z-50 p-4 text-zinc-700 hover:text-cyan-400 transition-colors"
          aria-label="Anterior"
        >
          <ChevronLeft size={48} strokeWidth={1} />
        </button>

        <div className="relative flex items-center justify-center w-full max-w-7xl">
          {radioList.map((radio, index) => {
            const isCenter = index === activeIndex;
            const offset = index - activeIndex;

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
          aria-label="Próxima"
        >
          <ChevronRight size={48} strokeWidth={1} />
        </button>
      </div>

      <div className={`absolute bottom-32 text-center z-10 transition-opacity ${isGlitching ? 'glitch-text opacity-70' : 'opacity-100'}`}>
        <h2 className="text-2xl font-bold text-white tracking-wider">{currentRadio.name}</h2>
        <p className="text-cyan-500 text-xs mt-2 font-medium tracking-[0.3em] uppercase">[{currentRadio.genre}]</p>
      </div>

      <Player 
        currentRadio={currentRadio} 
        isPlaying={isPlaying} 
        onPlayPause={() => setIsPlaying(!isPlaying)}
        volume={volume}
        onVolumeChange={setVolume}
      />
    </main>
  );
}