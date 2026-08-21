'use client';

import Player from '@/components/Player';
import { radioList } from '@/data/radios';
import { ChevronDown, ChevronUp, Heart, Play, Square } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

// Espaçamento ligeiramente aumentado para acomodar as logos maiores
const VERTICAL_SPACING = 180; 
const LCD_COLOR = '#22d3ee'; 

// COMPONENTE DO COVER FLOW VERTICAL
function VerticalDeckItem({ radio, isCenter, offset, onSelect }) {
  const isVisible = Math.abs(offset) <= 2;
  
  return (
    <div
      onClick={onSelect}
      className={`absolute w-full cursor-pointer transition-all duration-500 ease-out flex justify-center ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      style={{
        transform: `translateY(${offset * VERTICAL_SPACING}px) scale(${isCenter ? 1.05 : 0.85}) perspective(800px) rotateX(${offset * -25}deg)`,
        zIndex: 10 - Math.abs(offset),
        filter: isCenter ? 'none' : 'grayscale(80%) brightness(40%)',
      }}
    >
      {/* Logos aumentadas: de w-56 h-32 para w-64 h-40 */}
      <div className={`transition-all duration-500 w-64 h-40 flex items-center justify-center ${isCenter ? 'drop-shadow-[0_0_15px_rgba(34,211,238,0.5)] scale-110' : 'drop-shadow-md'}`}>
        {radio.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img 
            src={radio.logo} 
            alt={radio.name} 
            className="w-full h-full object-contain opacity-90 hover:opacity-100 transition-opacity"
            onError={(e) => {
              e.target.style.display = 'none';
              if (e.target.nextSibling) e.target.nextSibling.style.display = 'block';
            }}
          />
        ) : null}
        <span className={`text-zinc-500 font-bold text-center px-4 ${radio.logo ? 'hidden' : 'block'}`}>
          {radio.name}
        </span>
      </div>
    </div>
  );
}

export default function Home() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [favorites, setFavorites] = useState([]);
  
  const audioRef = useRef(null);
  const canvasRef = useRef(null);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const requestRef = useRef(null);
  const noiseNodeRef = useRef(null); 

  // SOM DE CLIQUE MECÂNICO
  const playClickSound = useCallback(() => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
      const ctx = audioCtxRef.current;
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'square';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.03); 
      
      gain.gain.setValueAtTime(0.1, ctx.currentTime); 
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch (e) {}
  }, []);

  // SOM DE BIPE PARA FAVORITOS
  const playSystemBeep = useCallback((freq = 800, type = 'square', duration = 0.05) => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime); 
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {}
  }, []);

  // GERADOR DE ESTÁTICA
  const startTuningSound = useCallback(() => {
    try {
      if (noiseNodeRef.current) return; 
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
      const ctx = audioCtxRef.current;

      const bufferSize = ctx.sampleRate * 2; 
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = buffer;
      noiseSource.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1000;

      const gain = ctx.createGain();
      gain.gain.value = 0.15; 

      noiseSource.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noiseSource.start();
      noiseNodeRef.current = { source: noiseSource, gain: gain };
    } catch (e) {}
  }, []);

  const stopTuningSound = useCallback(() => {
    if (noiseNodeRef.current) {
      try {
        noiseNodeRef.current.source.stop();
        noiseNodeRef.current.source.disconnect();
        noiseNodeRef.current.gain.disconnect();
      } catch (e) {}
      noiseNodeRef.current = null;
    }
  }, []);

  const displayRadios = radioList;

  useEffect(() => {
    setTimeout(() => {
      const savedIndex = localStorage.getItem('radioarch_index');
      const savedVolume = localStorage.getItem('radioarch_volume');
      const savedFavs = localStorage.getItem('radioarch_favs');
      
      if (savedIndex !== null) setActiveIndex(parseInt(savedIndex, 10));
      if (savedVolume !== null) setVolume(parseFloat(savedVolume));
      if (savedFavs) setFavorites(JSON.parse(savedFavs));
    }, 0);

    return () => cancelAnimationFrame(requestRef.current);
  }, []);

  useEffect(() => { localStorage.setItem('radioarch_index', activeIndex.toString()); }, [activeIndex]);
  useEffect(() => { 
    localStorage.setItem('radioarch_volume', volume.toString());
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);
  useEffect(() => { localStorage.setItem('radioarch_favs', JSON.stringify(favorites)); }, [favorites]);

  useEffect(() => {
    if (isPlaying && isLoading) {
      startTuningSound();
    } else {
      stopTuningSound();
    }
  }, [isPlaying, isLoading, startTuningSound, stopTuningSound]);

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
    playSystemBeep(1200, 'sine', 0.1); 
  };

  const startVisualizer = () => {
    if (!canvasRef.current || !analyserRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      requestRef.current = requestAnimationFrame(draw);
      analyserRef.current.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const barCount = 20; 
      const barWidth = (canvas.width / barCount) - 2;
      let x = 0;

      for (let i = 0; i < barCount; i++) {
        const barHeight = (dataArray[i * 2] / 255) * canvas.height;
        ctx.shadowBlur = 10;
        ctx.shadowColor = LCD_COLOR; 
        ctx.fillStyle = LCD_COLOR;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        x += barWidth + 2;
      }
    };
    
    cancelAnimationFrame(requestRef.current);
    draw();
  };

  const stopVisualizer = () => {
    cancelAnimationFrame(requestRef.current);
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const barCount = 20;
      const barWidth = (canvas.width / barCount) - 2;
      ctx.fillStyle = '#18181b'; 
      ctx.shadowBlur = 0;
      for(let i = 0; i < barCount; i++) {
          ctx.fillRect(i * (barWidth + 2), canvas.height - 2, barWidth, 2);
      }
    }
  };

  const togglePlay = useCallback(() => {
    if (!isPlaying) setIsLoading(true); 
    setIsPlaying(!isPlaying);
    playClickSound(); 
  }, [isPlaying, playClickSound]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentRadio) return;

    if (isPlaying) {
      if (!audioCtxRef.current) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioCtxRef.current = new AudioContext();
        analyserRef.current = audioCtxRef.current.createAnalyser();
        analyserRef.current.fftSize = 64; 
        
        sourceRef.current = audioCtxRef.current.createMediaElementSource(audio);
        sourceRef.current.connect(analyserRef.current);
        analyserRef.current.connect(audioCtxRef.current.destination);
      }
      if (audioCtxRef.current.state === 'suspended') audioCtxRef.current.resume();

      audio.play().then(() => startVisualizer()).catch(() => {
        setIsPlaying(false);
        setIsLoading(false);
      });
    } else {
      audio.pause();
      stopVisualizer();
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
    setIsLoading(true); 
    resetAudio();
    setActiveIndex(index);
    playClickSound(); 
  }, [resetAudio, playClickSound]);

  useEffect(() => {
    if (audioRef.current && currentRadio) {
      audioRef.current.src = currentRadio.url;
      audioRef.current.load();
      if (isPlaying) {
        audioRef.current.play().catch(() => {});
      }
    }
  }, [currentRadio, isPlaying]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      switch (e.code) {
        case 'Space': e.preventDefault(); togglePlay(); break;
        case 'ArrowRight': e.preventDefault(); changeRadio(nextIndex); break;
        case 'ArrowLeft': e.preventDefault(); changeRadio(previousIndex); break;
        case 'ArrowUp': e.preventDefault(); setVolume((prev) => Math.min(prev + 0.1, 1)); break;
        case 'ArrowDown': e.preventDefault(); setVolume((prev) => Math.max(prev - 0.1, 0)); break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextIndex, previousIndex, changeRadio, togglePlay]); 

  useEffect(() => {
    if (!isPlaying) stopVisualizer();
  }, [isPlaying]);

  return (
    <main className="min-h-screen bg-zinc-950 text-white overflow-hidden flex items-center justify-center font-sans relative selection:bg-cyan-500 selection:text-black p-4 md:p-8">
      
      <audio 
        ref={audioRef} 
        crossOrigin="anonymous" 
        onWaiting={() => setIsLoading(true)}
        onLoadStart={() => setIsLoading(true)}
        onPlaying={() => setIsLoading(false)}
        onCanPlay={() => setIsLoading(false)}
        onError={() => setIsLoading(true)} 
      />

      {/* CHASSI DO RÁDIO FÍSICO */}
      <div className="relative w-full max-w-6xl h-162.5 bg-zinc-800 rounded-[2.5rem] p-6 shadow-[0_35px_60px_-15px_rgba(0,0,0,0.8),inset_0_2px_4px_rgba(255,255,255,0.1)] border border-zinc-700 flex flex-col md:flex-row gap-8 overflow-hidden">
        
        {/* PARTE ESQUERDA: SPEAKER GRILL + TUNER VERTICAL */}
        <div className="w-full md:w-5/12 h-full relative rounded-2xl bg-[#1e1e24] shadow-inner overflow-hidden border-4 border-zinc-900 flex flex-col items-center justify-between py-6">
          
          <div className="absolute inset-0 bg-[radial-gradient(#000_2px,transparent_2px)] bg-size-[10px_10px] opacity-40 pointer-events-none"></div>

          <button 
            onClick={() => changeRadio(previousIndex)}
            className="relative z-10 w-16 h-10 bg-zinc-700 hover:bg-zinc-600 rounded-lg shadow-[0_4px_0_#18181b] active:shadow-[0_0px_0_#18181b] active:translate-y-1 flex items-center justify-center transition-all border border-zinc-600"
          >
            <ChevronUp size={24} className="text-zinc-300" />
          </button>

          <div className="relative w-full h-95 flex items-center justify-center">
            {displayRadios.map((radio, index) => {
              const isCenter = index === safeIndex;
              const offset = index - safeIndex;
              return (
                <VerticalDeckItem
                  key={radio.id}
                  radio={radio}
                  isCenter={isCenter}
                  offset={offset}
                  onSelect={() => {
                    changeRadio(index);
                    if (!isPlaying) togglePlay(); 
                  }}
                />
              );
            })}
          </div>

          <button 
            onClick={() => changeRadio(nextIndex)}
            className="relative z-10 w-16 h-10 bg-zinc-700 hover:bg-zinc-600 rounded-lg shadow-[0_4px_0_#18181b] active:shadow-[0_0px_0_#18181b] active:translate-y-1 flex items-center justify-center transition-all border border-zinc-600"
          >
            <ChevronDown size={24} className="text-zinc-300" />
          </button>
        </div>

        {/* PARTE DIREITA: LCD SCREEN & CONTROLES FÍSICOS */}
        <div className="flex-1 h-full flex flex-col justify-between py-4">
          
          {/* ECRÃ LCD */}
          <div className="w-full h-56 bg-[#050505] rounded-xl border-[6px] border-zinc-900 shadow-[inset_0_0_20px_rgba(0,0,0,1)] relative flex flex-col p-6 overflow-hidden">
            <div className="absolute inset-0 bg-linear-to-tr from-transparent via-white/5 to-transparent pointer-events-none"></div>
            
            <div className="flex justify-between items-start w-full">
              <h1 className="text-lg font-black tracking-[0.3em] opacity-60 uppercase italic font-mono">
                RADIO<span className="text-orange-500">ARCH</span>
              </h1>
              <span className={`${isPlaying && isLoading ? 'text-yellow-400' : 'text-cyan-400'} text-xs font-mono font-bold animate-pulse`}>
                {isPlaying ? (isLoading ? 'TUNING...' : 'ON AIR') : 'STANDBY'}
              </span>
            </div>

            <div className="flex-1 flex flex-col justify-center items-center mt-4">
              <canvas ref={canvasRef} width={280} height={50} className="mb-4" />
              
              <h2 className="text-2xl font-bold text-white tracking-wider text-center line-clamp-1">
                {currentRadio?.name}
              </h2>
              <p className="text-cyan-400 text-xs mt-2 font-medium tracking-[0.3em] uppercase font-mono">
                [{currentRadio?.genre}]
              </p>
            </div>
          </div>

          {/* PAINEL DE BOTÕES FÍSICOS */}
          <div className="grid grid-cols-2 gap-8 mt-8 px-4">
            
            <button 
              onClick={togglePlay}
              className="h-20 bg-zinc-700 rounded-xl shadow-[0_6px_0_#18181b] active:shadow-[0_0px_0_#18181b] active:translate-y-1.5 transition-all flex flex-col items-center justify-center gap-2 border border-zinc-600 group"
            >
              {isPlaying ? <Square size={26} className="text-cyan-400" /> : <Play size={26} className="text-zinc-300 group-hover:text-white" />}
              <span className="text-[11px] font-bold tracking-widest uppercase text-zinc-400">Power</span>
            </button>

            <button 
              onClick={() => { handleToggleFavorite(); playClickSound(); }}
              className="h-20 bg-zinc-700 rounded-xl shadow-[0_6px_0_#18181b] active:shadow-[0_0px_0_#18181b] active:translate-y-1.5 transition-all flex flex-col items-center justify-center gap-2 border border-zinc-600 group"
            >
              <Heart size={26} className={favorites.includes(currentRadio?.id) ? 'text-red-500 fill-red-500' : 'text-zinc-300 group-hover:text-white'} />
              <span className="text-[11px] font-bold tracking-widest uppercase text-zinc-400">Favorito</span>
            </button>

          </div>

          {/* SLIDER DE VOLUME MECÂNICO */}
          <div className="mt-8 bg-zinc-900 rounded-xl p-5 border-2 border-zinc-950 shadow-inner flex items-center gap-6">
            <span className="text-xs font-mono font-bold text-zinc-500">MIN</span>
            
            <div className="relative flex-1 h-3 bg-black rounded-full shadow-inner flex items-center">
              <style dangerouslySetInnerHTML={{__html: `
                .fader-thumb::-webkit-slider-thumb {
                  appearance: none;
                  width: 28px;
                  height: 40px;
                  background: #52525b;
                  border: 2px solid #27272a;
                  border-radius: 4px;
                  cursor: grab;
                  box-shadow: 0 4px 6px rgba(0,0,0,0.5), inset 0 2px 0 rgba(255,255,255,0.2);
                }
                .fader-thumb::-webkit-slider-thumb:active { cursor: grabbing; }
              `}} />
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="fader-thumb absolute w-full h-full appearance-none bg-transparent outline-none z-10"
              />
              <div className="h-full rounded-full transition-all bg-cyan-400 opacity-60" style={{ width: `${volume * 100}%` }}></div>
            </div>

            <span className="text-xs font-mono font-bold text-zinc-500">MAX</span>
          </div>

        </div>
      </div>
      
      <div className="hidden">
        <Player currentRadio={currentRadio} isPlaying={isPlaying} onPlayPause={() => setIsPlaying(!isPlaying)} volume={volume} onVolumeChange={setVolume} isFavorite={favorites.includes(currentRadio?.id)} toggleFavorite={handleToggleFavorite} />
      </div>
    </main>
  );
}