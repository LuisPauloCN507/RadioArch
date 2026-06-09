'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { radioList } from '@/data/radios';
import RadioCard from '@/components/RadioCard';
import Player from '@/components/Player';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const TRACK_SPACING = 180;

function RadioDeckItem({ radio, isCenter, offset, onSelect }) {
  return (
    <div
      onClick={onSelect}
      className="absolute cursor-pointer transition-all duration-700 ease-out"
      style={{
        transform: `translateX(${offset * TRACK_SPACING}px)`,
        zIndex: 10 - Math.abs(offset),
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
    if (!audio || !currentRadio) {
      return;
    }

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
    setIsPlaying(false);
    resetAudio();
    setActiveIndex(index);
  }, [resetAudio]);

  useEffect(() => {
    if (audioRef.current && currentRadio) {
      audioRef.current.src = currentRadio.url;
      audioRef.current.load();
    }
  }, [currentRadio]);

  return (
    <main className="min-h-screen bg-zinc-950 text-white overflow-hidden flex flex-col items-center justify-center font-sans">
      <audio ref={audioRef} />

      <div className="absolute top-8 text-center">
        <h1 className="text-xl font-black tracking-[0.3em] opacity-40 uppercase italic">
          RADIO<span className="text-orange-500">ARCH</span>
        </h1>
      </div>

      <div className="relative w-full h-100 flex items-center justify-center overflow-visible">
        <button
          onClick={() => changeRadio(previousIndex)}
          className="absolute left-6 z-50 p-4 text-zinc-700 hover:text-white transition-colors"
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
              />
            );
          })}
        </div>

        <button
          onClick={() => changeRadio(nextIndex)}
          className="absolute right-6 z-50 p-4 text-zinc-700 hover:text-white transition-colors"
          aria-label="Próxima"
        >
          <ChevronRight size={48} strokeWidth={1} />
        </button>
      </div>

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