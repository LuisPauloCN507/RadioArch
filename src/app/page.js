'use client';

import { useState, useRef, useEffect } from 'react';
import { radioList } from '@/data/radios'; // Verifique se o caminho da sua pasta data está correto (data/radios ou data/data/radios)
import RadioCard from '@/components/RadioCard';
import Player from '@/components/Player';

export default function Home() {
  const [currentRadio, setCurrentRadio] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  // Efeito que observa o estado 'isPlaying' e controla o elemento de áudio real
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentRadio) return;

    if (isPlaying) {
      // O play() retorna uma promessa. Se o link falhar, o .catch evita que o app trave.
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.error("Erro ao reproduzir áudio:", error.message);
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

    // Se clicar na rádio que já está selecionada, apenas alterna entre Play e Pause
    if (currentRadio?.id === radio.id) {
      setIsPlaying(!isPlaying);
    } else {
      // TROCA DE RÁDIO:
      setIsPlaying(false); // Pausa visualmente
      audio.pause();       // Para o som imediatamente
      audio.src = "";      // Limpa o link anterior para não dar erro de 'Supported Source'
      
      setCurrentRadio(radio);

      // O 'pulo do gato': damos 200ms para o React e o Navegador processarem a limpeza
      setTimeout(() => {
        audio.src = radio.url; // Injeta a nova URL (Hunter.fm, Virgin, etc)
        audio.load();          // Carrega o novo stream
        setIsPlaying(true);    // Manda tocar
      }, 200);
    }
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-8 pb-32">
      {/* Elemento de áudio escondido que processa o som */}
      <audio ref={audioRef} preload="none" />

      {/* Cabeçalho do App */}
      <header className="max-w-6xl mx-auto mb-12">
        <h1 className="text-4xl font-black tracking-tighter text-white">
          Radio<span className="text-orange-500">Arch</span>
        </h1>
        <p className="text-zinc-500 mt-1">Sua conexão com o som, sem interrupções.</p>
      </header>

      {/* Grade de Rádios */}
      <section className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {radioList.map((radio) => (
          <div 
            key={radio.id} 
            onClick={() => handleSelectRadio(radio)} 
            className="cursor-pointer"
          >
            <RadioCard 
              radio={radio} 
              isActive={currentRadio?.id === radio.id} 
              isPlaying={currentRadio?.id === radio.id && isPlaying}
            />
          </div>
        ))}
      </section>

      {/* Barra de Player Fixa no Rodapé */}
      <Player 
        currentRadio={currentRadio} 
        isPlaying={isPlaying} 
        onPlayPause={() => setIsPlaying(!isPlaying)}
      />
    </main>
  );
}