'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { radioList } from '@/data/radios';
import RadioCard from '@/components/RadioCard';
import Player from '@/components/Player';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Home() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const audioRef = useRef(null);

  const currentRadio = radioList[activeIndex];

  // Sincroniza o volume do elemento de áudio
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  // Controla Play/Pause
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentRadio) return;
    if (isPlaying) {
      audio.play().catch(() => setIsPlaying(false));
    } else {
      audio.pause();
    }
  }, [isPlaying, currentRadio]);

  // Função para resetar áudio de forma estável
  const resetAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
  }, []);

  // Muda de rádio e prepara o áudio
  const changeRadio = (index) => {
    setIsPlaying(false);
    resetAudio();
    setActiveIndex(index);
  };

  // Carrega a rádio quando o índice muda
  useEffect(() => {
    if (audioRef.current && currentRadio) {
      audioRef.current.src = currentRadio.url;
      audioRef.current.load();
    }
  }, [currentRadio]);

  return (
    <main className="min-h-screen bg-zinc-950 text-white overflow-hidden flex flex-col items-center justify-center font-sans">
      <audio ref={audioRef} />

      {/* Título discreto */}
      <div className="absolute top-8 text-center">
        <h1 className="text-xl font-black tracking-[0.3em] opacity-40 uppercase italic">
          RADIO<span className="text-orange-500">ARCH</span>
        </h1>
      </div>

      {/* Palco do Cover Flow Plano */}
      <div className="relative w-full h-100 flex items-center justify-center overflow-visible">
        
        {/* Navegação Esquerda (Discreta) */}
        <button 
          onClick={() => changeRadio((activeIndex - 1 + radioList.length) % radioList.length)}
          className="absolute left-6 z-50 p-4 text-zinc-700 hover:text-white transition-colors"
          aria-label="Anterior"
        >
          <ChevronLeft size={48} strokeWidth={1} />
        </button>

        {/* Container das Logos Lineares */}
        <div className="relative flex items-center justify-center w-full max-w-7xl">
          {radioList.map((radio, index) => {
            const isCenter = index === activeIndex;
            const offset = index - activeIndex;
            
            // Cálculos apenas para posição horizontal (sem 3D)
            const spacing = 180; // Espaçamento entre logos (ajuste conforme necessário)
            const translateX = offset * spacing;

            return (
              <div 
                key={radio.id} 
                onClick={() => changeRadio(index)}
                className="absolute transition-all duration-700 ease-out cursor-pointer"
                style={{
                  transform: `translateX(${translateX}px)`,
                  // Z-index para manter a rádio central sempre na frente, se houver sobreposição sutil
                  zIndex: 10 - Math.abs(offset), 
                }}
              >
                <RadioCard 
                  radio={radio} 
                  isCenter={isCenter} 
                />
              </div>
            );
          })}
        </div>

        {/* Navegação Direita (Discreta) */}
        <button 
          onClick={() => changeRadio((activeIndex + 1) % radioList.length)}
          className="absolute right-6 z-50 p-4 text-zinc-700 hover:text-white transition-colors"
          aria-label="Próxima"
        >
          <ChevronRight size={48} strokeWidth={1} />
        </button>
      </div>

      {/* Info da Rádio ativa (Sutil acima do player) */}
      <div className="absolute bottom-32 text-center">
        <h2 className="text-2xl font-bold text-white tracking-tighter">{currentRadio.name}</h2>
        <p className="text-orange-500 text-sm font-medium tracking-widest uppercase">{currentRadio.genre}</p>
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