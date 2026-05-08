'use client';
import { useState, useRef, useEffect } from 'react';
import { radioList } from '@/data/radios';
import RadioCard from '@/components/RadioCard';
import Player from '@/components/Player';

export default function Home() {
  const [currentRadio, setCurrentRadio] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  // Controla o áudio baseado no estado isPlaying
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentRadio) return;

    if (isPlaying) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error("Erro ao tocar rádio:", currentRadio.name, error.message);
          setIsPlaying(false);
        });
      }
    } else {
      audio.pause();
    }
  }, [isPlaying, currentRadio]);

  const handleSelectRadio = (radio) => {
    const audio = audioRef.current;
    if (!audio) return;

    // Se clicar na mesma rádio, apenas pausa/despausa
    if (currentRadio?.id === radio.id) {
      setIsPlaying(!isPlaying);
      return;
    }

    // Se for uma rádio nova:
    setIsPlaying(false); // Pausa o estado visual
    audio.pause();       // Pausa o som atual
    
    // Atualiza a rádio e injeta o novo link IMEDIATAMENTE
    setCurrentRadio(radio);
    audio.src = radio.url;
    audio.load(); // Força o navegador a reconhecer o novo stream
    
    // Tenta tocar após o carregamento inicial
    setIsPlaying(true);
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-8 pb-32">
      {/* O elemento de áudio agora recebe a URL diretamente para evitar o erro de 'No Source' */}
      <audio 
        ref={audioRef} 
        src={currentRadio?.url || ""} 
        preload="auto"
      />

      <header className="max-w-6xl mx-auto mb-12">
        <h1 className="text-4xl font-black tracking-tighter">
          Radio<span className="text-orange-500">Arch</span>
        </h1>
        <p className="text-zinc-500 mt-1">Sintonize as melhores do Piauí.</p>
      </header>

      <section className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
      />
    </main>
  );
}