'use client';

import Player from '@/components/Player';
import RadioCard from '@/components/RadioCard';
import SysPanel from '@/components/SysPanel';
import TerminalCLI from '@/components/TerminalCLI';
import { radioList } from '@/data/radios';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

const TRACK_SPACING = 200; 

// Dicionário de Temas Disponíveis
const THEMES = {
  cyan: { color: '#22d3ee', textClass: 'text-cyan-400', selection: 'selection:bg-cyan-500' },
  matrix: { color: '#22c55e', textClass: 'text-green-500', selection: 'selection:bg-green-500' },
  amber: { color: '#f59e0b', textClass: 'text-amber-500', selection: 'selection:bg-amber-500' },
  purple: { color: '#c084fc', textClass: 'text-purple-400', selection: 'selection:bg-purple-500' }
};

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
  
  // NOVO: Estado do Tema
  const [theme, setTheme] = useState('cyan');
  const activeTheme = THEMES[theme] || THEMES.cyan;
  const themeColorRef = useRef(activeTheme.color); // Ref para o canvas aceder à cor mais recente
  
  const audioRef = useRef(null);
  const canvasRef = useRef(null);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const requestRef = useRef(null);

  // NOVO: Função para gerar Bips Sonoros do Sistema
  const playSystemBeep = useCallback((freq = 800, type = 'square', duration = 0.05) => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.05, ctx.currentTime); // Volume baixo para não incomodar
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      console.log("AudioContext não permitido até interação.");
    }
  }, []);

  const displayRadios = filterMode === 'favs' && favorites.length > 0 
    ? radioList.filter(r => favorites.includes(r.id)) 
    : radioList;

  useEffect(() => {
    setTimeout(() => {
      const savedIndex = localStorage.getItem('radioarch_index');
      const savedVolume = localStorage.getItem('radioarch_volume');
      const savedFavs = localStorage.getItem('radioarch_favs');
      const savedTheme = localStorage.getItem('radioarch_theme');
      
      if (savedIndex !== null) setActiveIndex(parseInt(savedIndex, 10));
      if (savedVolume !== null) setVolume(parseFloat(savedVolume));
      if (savedFavs) setFavorites(JSON.parse(savedFavs));
      if (savedTheme && THEMES[savedTheme]) setTheme(savedTheme);
    }, 0);

    return () => cancelAnimationFrame(requestRef.current);
  }, []);

  useEffect(() => { localStorage.setItem('radioarch_index', activeIndex.toString()); }, [activeIndex]);
  useEffect(() => { 
    localStorage.setItem('radioarch_volume', volume.toString());
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);
  useEffect(() => { localStorage.setItem('radioarch_favs', JSON.stringify(favorites)); }, [favorites]);
  
  // Atualiza a Ref e o LocalStorage quando o tema muda
  useEffect(() => { 
    localStorage.setItem('radioarch_theme', theme); 
    themeColorRef.current = activeTheme.color;
  }, [theme, activeTheme]);

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
    playSystemBeep(1200, 'sine', 0.1); // Bip agudo para favorito
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

      const barCount = 16; 
      const barWidth = (canvas.width / barCount) - 2;
      let x = 0;

      for (let i = 0; i < barCount; i++) {
        const barHeight = (dataArray[i * 2] / 255) * canvas.height;

        ctx.shadowBlur = 8;
        ctx.shadowColor = themeColorRef.current; // Usa a cor do tema dinamicamente
        ctx.fillStyle = themeColorRef.current;

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
      
      const barCount = 16;
      const barWidth = (canvas.width / barCount) - 2;
      ctx.fillStyle = '#27272a'; 
      ctx.shadowBlur = 0;
      
      for(let i = 0; i < barCount; i++) {
          ctx.fillRect(i * (barWidth + 2), canvas.height - 2, barWidth, 2);
      }
    }
  };

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
      
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }

      audio.play().then(() => {
        startVisualizer();
      }).catch(() => setIsPlaying(false));
      
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
    setIsGlitching(true);
    setIsPlaying(false);
    resetAudio();
    setActiveIndex(index);
    playSystemBeep(300, 'square', 0.08); // Bip grave de transição
    setTimeout(() => setIsGlitching(false), 400);
  }, [resetAudio, playSystemBeep]);

  useEffect(() => {
    if (audioRef.current && currentRadio) {
      audioRef.current.src = currentRadio.url;
      audioRef.current.load();
    }
  }, [currentRadio]);

  const handleCommand = (cmdStr) => {
    const args = cmdStr.toLowerCase().split(' ');
    const command = args[0];
    const value = args[1];

    let executed = true;

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
      case 'theme': // NOVO COMANDO NO TERMINAL
      case 'color':
        if (THEMES[value]) {
          setTheme(value);
          playSystemBeep(600, 'sine', 0.2); // Bip especial de tema
        } else {
           console.log("Temas disponíveis: cyan, matrix, amber, purple");
        }
        break;
      default:
        const foundIndex = displayRadios.findIndex(r => 
          r.name.toLowerCase().includes(command) || r.genre.toLowerCase().includes(command)
        );
        if (foundIndex !== -1) {
          changeRadio(foundIndex);
          setIsPlaying(true);
        } else {
          executed = false;
        }
        break;
    }
    
    // Toca bip sempre que um comando é reconhecido
    if (executed) playSystemBeep(900, 'square', 0.05);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === '/') {
        if (!isTerminalOpen) {
          e.preventDefault();
          setIsTerminalOpen(true);
          playSystemBeep(1500, 'triangle', 0.05); // Bip ao abrir terminal
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
  }, [nextIndex, previousIndex, changeRadio, isTerminalOpen, playSystemBeep]);

  useEffect(() => {
    if (!isPlaying) stopVisualizer();
  }, [isPlaying]);

  return (
    <main className={`min-h-screen bg-[#09090b] text-white overflow-hidden flex flex-col items-center justify-center font-mono relative ${activeTheme.selection} selection:text-black`}>
      
      <SysPanel />

      <div className="pointer-events-none fixed inset-0 z-40 opacity-[0.03] bg-[linear-gradient(rgba(255,255,255,0)_50%,rgba(0,0,0,0.5)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-size-[100%_4px,3px_100%]" />

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes glitch-anim { 0% { clip-path: inset(10% 0 80% 0); transform: translate(-3px, 2px); filter: drop-shadow(2px 0 0 red) drop-shadow(-2px 0 0 ${activeTheme.color}); } 20% { clip-path: inset(80% 0 5% 0); transform: translate(3px, -2px); filter: drop-shadow(-2px 0 0 red) drop-shadow(2px 0 0 ${activeTheme.color}); } 40% { clip-path: inset(30% 0 50% 0); transform: translate(-3px, 1px); filter: drop-shadow(3px 0 0 red) drop-shadow(-3px 0 0 ${activeTheme.color}); } 60% { clip-path: inset(70% 0 10% 0); transform: translate(2px, -1px); filter: drop-shadow(-3px 0 0 red) drop-shadow(3px 0 0 ${activeTheme.color}); } 80% { clip-path: inset(20% 0 60% 0); transform: translate(-1px, 3px); filter: drop-shadow(2px 0 0 red) drop-shadow(-2px 0 0 ${activeTheme.color}); } 100% { clip-path: inset(50% 0 30% 0); transform: translate(0); filter: none; } }
        .glitch-effect { animation: glitch-anim 0.4s cubic-bezier(.25, .46, .45, .94) both; }
        .glitch-text { animation: glitch-anim 0.3s cubic-bezier(.25, .46, .45, .94) both; }
        
        /* Tema dinâmico injetado para o controlo de volume não sofrer com o purge do tailwind */
        .theme-slider::-webkit-slider-thumb {
          background-color: ${activeTheme.color} !important;
          box-shadow: 0 0 8px ${activeTheme.color};
        }
      `}} />

      <audio ref={audioRef} crossOrigin="anonymous" />

      {/* HEADER RADIO ARCH */}
      <div className="absolute top-8 text-center z-10 font-sans">
        <h1 className="text-xl font-black tracking-[0.3em] opacity-40 uppercase italic">
          RADIO<span className="text-orange-500">ARCH</span>
        </h1>
        {filterMode === 'favs' && (
          <div className={`mt-2 text-[10px] ${activeTheme.textClass} font-mono tracking-widest border border-current px-2 py-1 inline-block opacity-70`}>
            [ FILTER: FAVORITES ]
          </div>
        )}
      </div>

      {/* CONTROLE DE VOLUME LATERAL COM TEMA DINÂMICO */}
      <div className="absolute right-8 top-1/2 -translate-y-1/2 flex flex-col items-center justify-between h-48 z-50">
        <span className={`text-[10px] ${activeTheme.textClass} font-mono tracking-widest uppercase px-1 opacity-70`}>
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
            className="theme-slider w-32 h-1 appearance-none bg-zinc-800 rounded-full outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full cursor-pointer -rotate-90 origin-center"
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
          className={`absolute left-6 z-50 p-4 text-zinc-700 hover:${activeTheme.textClass} transition-colors`}
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
          className={`absolute right-6 z-50 p-4 text-zinc-700 hover:${activeTheme.textClass} transition-colors`}
        >
          <ChevronRight size={48} strokeWidth={1} />
        </button>
      </div>

      {/* NOME DA RADIO E EQUALIZADOR */}
      <div className={`absolute bottom-32 text-center z-10 transition-opacity flex flex-col items-center ${isGlitching ? 'glitch-text opacity-70' : 'opacity-100'}`}>
        
        <canvas 
          ref={canvasRef} 
          width={180} 
          height={40} 
          className="mb-4"
        />

        <h2 className="text-2xl font-bold text-white tracking-wider">{currentRadio?.name}</h2>
        <p className={`${activeTheme.textClass} text-xs mt-2 font-medium tracking-[0.3em] uppercase transition-colors`}>[{currentRadio?.genre}]</p>
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