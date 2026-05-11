'use client';

import { useState, useRef, useEffect } from 'react';
import { radioList } from '@/data/radios';
import RadioCard from '@/components/RadioCard';
import Player from '@/components/Player';

export default function Home() {
  const [currentRadio, setCurrentRadio] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const audioRef = useRef(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentRadio) return;

    if (isPlaying) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => setIsPlaying(false));
      }
    } else {
      audio.pause();
    }
  }, [isPlaying, currentRadio]);

  const handleSelectRadio = (radio) => {
    const audio = audioRef.current;
    if (!audio) return;

    if (currentRadio?.id === radio.id) {
      setIsPlaying(!isPlaying);
    } else {
      setIsPlaying(false);
      audio.pause();
      audio.src = "";
      setCurrentRadio(radio);
      
      setTimeout(() => {
        audio.src = radio.url;
        audio.load();
        setIsPlaying(true);
      }, 200);
    }
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-8 pb-32">
      <audio ref={audioRef} />

      <header className="max-w-6xl mx-auto mb-12">
        <h1 className="text-5xl font-black tracking-tighter italic">
          RADIO<span className="text-orange-500">ARCH</span>
        </h1>
        <p className="text-zinc-500 text-sm font-medium tracking-widest uppercase">Piauí Digital Experience</p>
      </header>

      <section className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {radioList.map((radio) => (
          <div key={radio.id} onClick={() => handleSelectRadio(radio)} className="cursor-pointer">
            <RadioCard 
              radio={radio} 
              isActive={currentRadio?.id === radio.id} 
              isPlaying={currentRadio?.id === radio.id && isPlaying}
            />
          </div>
        ))}
      </section>

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