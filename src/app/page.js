'use client';

import Player from '@/components/Player';
import { radioList } from '@/data/radios';
import { ChevronDown, ChevronUp, Code2, Cpu, Disc, Headphones, Heart, Info, Layers, Lightbulb, Play, Radio, Square, Timer, Volume2, VolumeX } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

const VERTICAL_SPACING = 180; 

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
  const [currentTime, setCurrentTime] = useState('--:--'); 
  
  const [isLofiMode, setIsLofiMode] = useState(false); 
  const [sleepTimer, setSleepTimer] = useState(0); 
  const [timeLeft, setTimeLeft] = useState(0); 
  const [isMuted, setIsMuted] = useState(false);
  const [displayMode, setDisplayMode] = useState(false);
  
  const [presets, setPresets] = useState({ 1: null, 2: null, 3: null });
  const [bass, setBass] = useState(0); 
  const [treble, setTreble] = useState(0); 
  const [band, setBand] = useState('FM'); 
  const [backlight, setBacklight] = useState(true);
  
  const audioRef = useRef(null);
  const canvasRef = useRef(null);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const requestRef = useRef(null);
  const noiseNodeRef = useRef(null); 
  
  const lofiFilterRef = useRef(null); 
  const amFilterRef = useRef(null);
  const bassFilterRef = useRef(null);
  const trebleFilterRef = useRef(null);
  const pressTimerRef = useRef(null);
  
  const lcdColor = backlight ? '#22d3ee' : '#1e3a8a';
  const lcdColorRef = useRef(lcdColor);

  useEffect(() => {
    lcdColorRef.current = lcdColor;
  }, [lcdColor]);

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

  const startTuningSound = useCallback(() => {
    try {
      if (noiseNodeRef.current) return; 
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
      const ctx = audioCtxRef.current;
      const bufferSize = ctx.sampleRate * 2; 
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) { data[i] = Math.random() * 2 - 1; }
      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = buffer;
      noiseSource.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1000;
      const gain = ctx.createGain();
      gain.gain.value = band === 'AM' ? 0.3 : 0.15; 
      noiseSource.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noiseSource.start();
      noiseNodeRef.current = { source: noiseSource, gain: gain };
    } catch (e) {}
  }, [band]);

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

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let interval;
    if (sleepTimer > 0 && isPlaying) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsPlaying(false);
            setSleepTimer(0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [sleepTimer, isPlaying]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const cycleTimer = useCallback(() => {
    setSleepTimer((prev) => {
      const next = prev === 0 ? 15 : prev === 15 ? 30 : prev === 30 ? 60 : 0;
      setTimeLeft(next * 60);
      return next;
    });
    playClickSound();
  }, [playClickSound]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
    playClickSound();
  }, [playClickSound]);

  const toggleDisplay = useCallback(() => {
    setDisplayMode((prev) => !prev);
    playClickSound();
  }, [playClickSound]);

  const toggleBand = useCallback(() => {
    setBand(prev => prev === 'FM' ? 'AM' : 'FM');
    playClickSound();
  }, [playClickSound]);

  const toggleBacklight = useCallback(() => {
    setBacklight(prev => !prev);
    playClickSound();
  }, [playClickSound]);

  const handlePresetDown = (slot) => {
    pressTimerRef.current = setTimeout(() => {
      setPresets(prev => ({ ...prev, [slot]: activeIndex }));
      playSystemBeep(2000, 'sine', 0.1); 
      pressTimerRef.current = null;
    }, 1000); 
  };

  const handlePresetUp = (slot) => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
      if (presets[slot] !== null && presets[slot] !== undefined) {
        changeRadio(presets[slot]);
      } else {
        playSystemBeep(200, 'square', 0.1);
      }
    }
  };

  const displayRadios = radioList;

  useEffect(() => {
    setTimeout(() => {
      const savedIndex = localStorage.getItem('radioarch_index');
      const savedVolume = localStorage.getItem('radioarch_volume');
      const savedFavs = localStorage.getItem('radioarch_favs');
      const savedLofi = localStorage.getItem('radioarch_lofi');
      const savedPresets = localStorage.getItem('radioarch_presets');
      
      if (savedIndex !== null) setActiveIndex(parseInt(savedIndex, 10));
      if (savedVolume !== null) setVolume(parseFloat(savedVolume));
      if (savedFavs) setFavorites(JSON.parse(savedFavs));
      if (savedLofi !== null) setIsLofiMode(savedLofi === 'true');
      if (savedPresets) setPresets(JSON.parse(savedPresets));
    }, 0);
    return () => cancelAnimationFrame(requestRef.current);
  }, []);

  useEffect(() => { localStorage.setItem('radioarch_index', activeIndex.toString()); }, [activeIndex]);
  useEffect(() => { 
    localStorage.setItem('radioarch_volume', volume.toString());
    if (audioRef.current) audioRef.current.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);
  useEffect(() => { localStorage.setItem('radioarch_favs', JSON.stringify(favorites)); }, [favorites]);
  useEffect(() => { localStorage.setItem('radioarch_lofi', isLofiMode.toString()); }, [isLofiMode]);
  useEffect(() => { localStorage.setItem('radioarch_presets', JSON.stringify(presets)); }, [presets]);

  useEffect(() => {
    if (audioCtxRef.current) {
      if (lofiFilterRef.current) {
        lofiFilterRef.current.frequency.setTargetAtTime(isLofiMode ? 1200 : 24000, audioCtxRef.current.currentTime, 0.5);
      }
      if (amFilterRef.current) {
        amFilterRef.current.type = band === 'AM' ? 'bandpass' : 'allpass';
        if (band === 'AM') amFilterRef.current.frequency.setValueAtTime(1500, audioCtxRef.current.currentTime);
      }
      if (bassFilterRef.current) {
        bassFilterRef.current.gain.setTargetAtTime(bass, audioCtxRef.current.currentTime, 0.1);
      }
      if (trebleFilterRef.current) {
        trebleFilterRef.current.gain.setTargetAtTime(treble, audioCtxRef.current.currentTime, 0.1);
      }
    }
  }, [isLofiMode, band, bass, treble]);

  useEffect(() => {
    if (isPlaying && isLoading) startTuningSound();
    else stopTuningSound();
  }, [isPlaying, isLoading, startTuningSound, stopTuningSound]);

  const radioCount = displayRadios.length;
  const safeIndex = activeIndex >= radioCount ? 0 : activeIndex;
  const currentRadio = displayRadios[safeIndex];
  
  const previousIndex = (safeIndex - 1 + radioCount) % radioCount;
  const nextIndex = (safeIndex + 1) % radioCount;

  const handleToggleFavorite = useCallback(() => {
    if (!currentRadio) return;
    setFavorites(prev => 
      prev.includes(currentRadio.id) ? prev.filter(id => id !== currentRadio.id) : [...prev, currentRadio.id]
    );
    playSystemBeep(1200, 'sine', 0.1); 
  }, [currentRadio, playSystemBeep]);

  const toggleLofiMode = useCallback(() => {
    setIsLofiMode((prev) => !prev);
    playSystemBeep(1500, 'triangle', 0.1); 
  }, [playSystemBeep]);

  const startVisualizer = useCallback(() => {
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
        ctx.shadowBlur = backlight ? 10 : 0;
        ctx.shadowColor = lcdColorRef.current; 
        ctx.fillStyle = lcdColorRef.current;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        x += barWidth + 2;
      }
    };
    cancelAnimationFrame(requestRef.current);
    draw();
  }, [backlight]);

  const stopVisualizer = useCallback(() => {
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
  }, []);

  const togglePlay = useCallback(() => {
    if (!isPlaying) setIsLoading(true); 
    setIsPlaying((prev) => !prev);
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
        
        lofiFilterRef.current = audioCtxRef.current.createBiquadFilter();
        lofiFilterRef.current.type = 'lowpass';
        amFilterRef.current = audioCtxRef.current.createBiquadFilter();
        bassFilterRef.current = audioCtxRef.current.createBiquadFilter();
        bassFilterRef.current.type = 'lowshelf';
        bassFilterRef.current.frequency.value = 250;
        trebleFilterRef.current = audioCtxRef.current.createBiquadFilter();
        trebleFilterRef.current.type = 'highshelf';
        trebleFilterRef.current.frequency.value = 4000;

        sourceRef.current = audioCtxRef.current.createMediaElementSource(audio);
        sourceRef.current.connect(lofiFilterRef.current);
        lofiFilterRef.current.connect(amFilterRef.current);
        amFilterRef.current.connect(bassFilterRef.current);
        bassFilterRef.current.connect(trebleFilterRef.current);
        trebleFilterRef.current.connect(analyserRef.current);
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
      if (isPlaying) { audioRef.current.play().catch(() => {}); }
    }
  }, [currentRadio, isPlaying]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space') { e.preventDefault(); togglePlay(); }
      if (e.code === 'ArrowRight') { e.preventDefault(); changeRadio(nextIndex); }
      if (e.code === 'ArrowLeft') { e.preventDefault(); changeRadio(previousIndex); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextIndex, previousIndex, changeRadio, togglePlay]); 

  useEffect(() => {
    if (!isPlaying) stopVisualizer();
  }, [isPlaying, stopVisualizer]);

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans selection:bg-cyan-500 selection:text-black overflow-x-hidden">
      
      <audio 
        ref={audioRef} 
        crossOrigin="anonymous" 
        onWaiting={() => setIsLoading(true)}
        onLoadStart={() => setIsLoading(true)}
        onPlaying={() => setIsLoading(false)}
        onCanPlay={() => setIsLoading(false)}
        onError={() => setIsLoading(true)} 
      />

      {/* NAVBAR */}
      <nav className="fixed top-0 w-full z-50 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-900/50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="text-cyan-400" size={24} />
            <span className="font-mono font-bold tracking-widest uppercase text-lg">
              RADIO<span className="text-orange-500">ARCH</span>
            </span>
          </div>
          <div className="hidden md:flex gap-8 text-sm font-medium text-zinc-400">
            <a href="#app" className="hover:text-cyan-400 transition-colors">Player</a>
            <a href="#features" className="hover:text-cyan-400 transition-colors">Features</a>
            <a href="#tech" className="hover:text-cyan-400 transition-colors">Tech Stack</a>
          </div>
          <button onClick={() => { document.getElementById('app').scrollIntoView({ behavior: 'smooth' }); }} className="bg-cyan-500 hover:bg-cyan-400 text-black px-4 py-2 rounded-md font-bold text-sm transition-colors shadow-[0_0_15px_rgba(34,211,238,0.3)]">
            Listen Now
          </button>
        </div>
      </nav>

      {/* HERO & INTERACTIVE APP SECTION */}
      <section id="app" className="pt-32 pb-24 px-4 md:px-8 flex flex-col items-center justify-center min-h-screen relative">
        
        {/* Glow de fundo da página */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-200 h-150 bg-cyan-900/20 blur-[120px] rounded-full pointer-events-none"></div>

        <div className="text-center mb-16 relative z-10">
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-transparent bg-clip-text bg-linear-to-br from-white via-zinc-200 to-zinc-500 mb-6">
            O Som Analógico <br className="hidden md:block" /> na Era Digital.
          </h1>
          <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto font-light">
            Radio Arch é um simulador físico de rádio web construído para devs. Sintoniza a tua rádio, ajusta o equalizador e ativa o filtro de Vinil em tempo real.
          </p>
        </div>

        {/* CHASSI DO RÁDIO */}
        <div className="relative w-full max-w-6xl h-175 bg-zinc-800 rounded-[2.5rem] p-6 shadow-[0_35px_60px_-15px_rgba(0,0,0,0.8),inset_0_2px_4px_rgba(255,255,255,0.1)] border border-zinc-700 flex flex-col md:flex-row gap-8 z-10">
          
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
                  <VerticalDeckItem key={radio.id} radio={radio} isCenter={isCenter} offset={offset} onSelect={() => { changeRadio(index); if (!isPlaying) togglePlay(); }} />
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

          <div className="flex-1 h-full flex flex-col justify-between py-4">
            
            <div className="w-full h-56 bg-[#050505] rounded-xl border-[6px] border-zinc-900 shadow-[inset_0_0_20px_rgba(0,0,0,1)] relative flex flex-col p-6 overflow-hidden">
              <div className={`absolute inset-0 bg-linear-to-tr from-transparent via-white/5 to-transparent pointer-events-none transition-opacity ${backlight ? 'opacity-100' : 'opacity-20'}`}></div>
              
              <div className="flex justify-between items-start w-full relative z-10">
                <div className="flex flex-col gap-1">
                  <h1 className={`text-lg font-black tracking-[0.3em] uppercase italic font-mono flex items-center gap-4 transition-all ${backlight ? 'opacity-60 text-white' : 'opacity-30 text-zinc-600'}`}>
                    <span>RADIO<span className={backlight ? 'text-orange-500' : 'text-orange-900'}>ARCH</span></span>
                  </h1>
                  <div className="flex gap-2 font-mono text-[9px] tracking-widest font-bold">
                    <span className={`${band === 'AM' ? 'text-amber-500' : 'text-zinc-800'}`}>[AM]</span>
                    <span className={`${band === 'FM' ? 'text-cyan-400' : 'text-zinc-800'}`}>[FM]</span>
                    <span className={`${isLofiMode ? 'text-amber-500 animate-pulse' : 'text-zinc-800'}`}>[VINYL FX]</span>
                    <span className={`${isMuted ? 'text-red-500 animate-pulse' : 'text-zinc-800'}`}>[MUTED]</span>
                  </div>
                </div>
                
                <div className="flex flex-col items-end transition-colors" style={{ color: lcdColor }}>
                  <div className="flex items-center gap-3 mb-1">
                    {sleepTimer > 0 && <span className="text-zinc-500 text-[10px] font-mono tracking-widest">⏱ {formatTime(timeLeft)}</span>}
                    <span className={`text-lg font-mono font-bold tracking-widest ${backlight ? 'drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]' : ''}`}>
                      {currentTime}
                    </span>
                  </div>
                  <span className={`${isPlaying && isLoading ? (backlight ? 'text-yellow-400' : 'text-yellow-700') : ''} text-xs font-mono font-bold animate-pulse`}>
                    {isPlaying ? (isLoading ? 'TUNING...' : 'ON AIR') : 'STANDBY'}
                  </span>
                </div>
              </div>

              <div className="flex-1 flex flex-col justify-center items-center mt-2 relative z-10">
                <canvas ref={canvasRef} width={280} height={50} className={displayMode ? 'hidden' : 'mb-4'} />
                
                <div className={displayMode ? 'hidden' : 'flex flex-col items-center transition-colors'} style={{ color: lcdColor }}>
                  <h2 className={`text-2xl font-bold tracking-wider text-center line-clamp-1 ${backlight ? 'text-white' : 'text-zinc-500'}`}>
                    {currentRadio?.name}
                  </h2>
                  <p className="text-xs mt-2 font-medium tracking-[0.3em] uppercase font-mono">
                    [{currentRadio?.genre}]
                  </p>
                </div>

                <div className={`w-full flex flex-col gap-1.5 font-mono text-[10px] opacity-90 transition-colors ${displayMode ? 'block' : 'hidden'}`} style={{ color: lcdColor }}>
                  <p className={`border-b pb-1 mb-1 font-bold ${backlight ? 'border-cyan-900 text-white' : 'border-zinc-800 text-zinc-400'}`}>SYSTEM DIAGNOSTICS</p>
                  <p>FREQ: {(88.0 + safeIndex * 2.4).toFixed(1)} MHz</p>
                  <p>BAND: {band} / BASS: {bass}dB / TREB: {treble}dB</p>
                  <p>STATUS: {isLoading ? 'SYNCING...' : (isPlaying ? 'ACTIVE' : 'IDLE')}</p>
                  <p>PRESETS: [ {presets[1]!==null?'P1 ':'-- '} {presets[2]!==null?'P2 ':'-- '} {presets[3]!==null?'P3 ':'-- '} ]</p>
                </div>
              </div>
            </div>

            <div className="flex justify-center gap-4 mt-3">
              {[1, 2, 3].map(num => (
                <button 
                  key={num}
                  onPointerDown={() => handlePresetDown(num)}
                  onPointerUp={() => handlePresetUp(num)}
                  onPointerLeave={() => { if(pressTimerRef.current) { clearTimeout(pressTimerRef.current); pressTimerRef.current = null; } }}
                  className={`w-12 h-6 rounded border-b-2 bg-zinc-800 border-zinc-950 shadow-inner flex items-center justify-center font-mono text-[10px] font-bold active:translate-y-1 active:border-b-0 transition-all ${presets[num] !== null ? 'text-cyan-500' : 'text-zinc-500'}`}
                >
                  P{num}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-4 gap-3 mt-4 px-2">
              <button onClick={togglePlay} className="h-14 bg-zinc-700 rounded-lg shadow-[0_4px_0_#18181b] active:shadow-[0_0px_0_#18181b] active:translate-y-1 transition-all flex flex-col items-center justify-center gap-1 border border-zinc-600 group">
                {isPlaying ? <Square size={16} className="text-cyan-400" /> : <Play size={16} className="text-zinc-300 group-hover:text-white" />}
                <span className="text-[8px] font-bold tracking-widest uppercase text-zinc-400">Pwr</span>
              </button>

              <button onClick={() => { handleToggleFavorite(); playClickSound(); }} className="h-14 bg-zinc-700 rounded-lg shadow-[0_4px_0_#18181b] active:shadow-[0_0px_0_#18181b] active:translate-y-1 transition-all flex flex-col items-center justify-center gap-1 border border-zinc-600 group">
                <Heart size={16} className={favorites.includes(currentRadio?.id) ? 'text-red-500 fill-red-500' : 'text-zinc-300 group-hover:text-white'} />
                <span className="text-[8px] font-bold tracking-widest uppercase text-zinc-400">Fav</span>
              </button>

              <button onClick={toggleBand} className={`h-14 rounded-lg shadow-[0_4px_0_#18181b] active:shadow-[0_0px_0_#18181b] active:translate-y-1 transition-all flex flex-col items-center justify-center gap-1 border border-zinc-600 group ${band === 'AM' ? 'bg-amber-900/40' : 'bg-zinc-700'}`}>
                <Radio size={16} className={band === 'AM' ? 'text-amber-500' : 'text-cyan-400'} />
                <span className={`text-[8px] font-bold tracking-widest uppercase ${band === 'AM' ? 'text-amber-500' : 'text-cyan-400'}`}>{band}</span>
              </button>

              <button onClick={toggleBacklight} className={`h-14 rounded-lg shadow-[0_4px_0_#18181b] active:shadow-[0_0px_0_#18181b] active:translate-y-1 transition-all flex flex-col items-center justify-center gap-1 border border-zinc-600 group ${backlight ? 'bg-cyan-900/30' : 'bg-zinc-800'}`}>
                <Lightbulb size={16} className={backlight ? 'text-cyan-400' : 'text-zinc-600'} />
                <span className={`text-[8px] font-bold tracking-widest uppercase ${backlight ? 'text-cyan-400' : 'text-zinc-600'}`}>Lite</span>
              </button>

              <button onClick={cycleTimer} className={`h-14 rounded-lg shadow-[0_4px_0_#18181b] active:shadow-[0_0px_0_#18181b] active:translate-y-1 transition-all flex flex-col items-center justify-center gap-1 border border-zinc-600 group ${sleepTimer > 0 ? 'bg-cyan-900/40' : 'bg-zinc-700'}`}>
                <Timer size={16} className={sleepTimer > 0 ? 'text-cyan-400' : 'text-zinc-300 group-hover:text-white'} />
                <span className={`text-[8px] font-bold tracking-widest uppercase ${sleepTimer > 0 ? 'text-cyan-400' : 'text-zinc-400'}`}>Slp</span>
              </button>

              <button onClick={toggleLofiMode} className={`h-14 rounded-lg shadow-[0_4px_0_#18181b] active:shadow-[0_0px_0_#18181b] active:translate-y-1 transition-all flex flex-col items-center justify-center gap-1 border border-zinc-600 group ${isLofiMode ? 'bg-amber-900/50' : 'bg-zinc-700'}`}>
                <Disc size={16} className={isLofiMode ? 'text-amber-500 animate-spin-slow' : 'text-zinc-300 group-hover:text-white'} style={{ animationDuration: '4s' }} />
                <span className={`text-[8px] font-bold tracking-widest uppercase ${isLofiMode ? 'text-amber-500' : 'text-zinc-400'}`}>Vinl</span>
              </button>

              <button onClick={toggleMute} className={`h-14 rounded-lg shadow-[0_4px_0_#18181b] active:shadow-[0_0px_0_#18181b] active:translate-y-1 transition-all flex flex-col items-center justify-center gap-1 border border-zinc-600 group ${isMuted ? 'bg-red-900/30 border-red-900' : 'bg-zinc-700'}`}>
                {isMuted ? <VolumeX size={16} className="text-red-500" /> : <Volume2 size={16} className="text-zinc-300 group-hover:text-white" />}
                <span className={`text-[8px] font-bold tracking-widest uppercase ${isMuted ? 'text-red-500' : 'text-zinc-400'}`}>Mut</span>
              </button>

              <button onClick={toggleDisplay} className={`h-14 rounded-lg shadow-[0_4px_0_#18181b] active:shadow-[0_0px_0_#18181b] active:translate-y-1 transition-all flex flex-col items-center justify-center gap-1 border border-zinc-600 group ${displayMode ? 'bg-cyan-900/40' : 'bg-zinc-700'}`}>
                <Info size={16} className={displayMode ? 'text-cyan-400' : 'text-zinc-300 group-hover:text-white'} />
                <span className={`text-[8px] font-bold tracking-widest uppercase ${displayMode ? 'text-cyan-400' : 'text-zinc-400'}`}>Info</span>
              </button>
            </div>

            <div className="mt-4 bg-zinc-900 rounded-xl p-4 border-2 border-zinc-950 shadow-inner flex flex-col gap-3">
              <style dangerouslySetInnerHTML={{__html: `
                .fader-thumb::-webkit-slider-thumb { appearance: none; width: 16px; height: 24px; background: #52525b; border: 2px solid #27272a; border-radius: 4px; cursor: grab; box-shadow: 0 2px 4px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.2); }
                .fader-thumb::-webkit-slider-thumb:active { cursor: grabbing; }
              `}} />
              
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-mono font-bold text-zinc-500 w-8 text-right">VOL</span>
                <div className="relative flex-1 h-2 bg-black rounded-full shadow-inner flex items-center">
                  <input type="range" min="0" max="1" step="0.01" value={volume} onChange={(e) => { setVolume(parseFloat(e.target.value)); if (isMuted) toggleMute(); }} className="fader-thumb absolute w-full h-full appearance-none bg-transparent outline-none z-10" />
                  <div className="h-full rounded-full transition-all bg-cyan-400 opacity-60" style={{ width: `${volume * 100}%` }}></div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-[10px] font-mono font-bold text-zinc-500 w-8 text-right">BASS</span>
                <div className="relative flex-1 h-2 bg-black rounded-full shadow-inner flex items-center">
                  <input type="range" min="-15" max="15" step="1" value={bass} onChange={(e) => setBass(parseInt(e.target.value))} className="fader-thumb absolute w-full h-full appearance-none bg-transparent outline-none z-10" />
                  <div className="absolute left-1/2 w-0.5 h-3 bg-zinc-700 -translate-x-1/2"></div>
                  <div className="h-full rounded-full bg-amber-500 opacity-40 transition-all" style={{ width: `${((bass + 15) / 30) * 100}%` }}></div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-[10px] font-mono font-bold text-zinc-500 w-8 text-right">TREB</span>
                <div className="relative flex-1 h-2 bg-black rounded-full shadow-inner flex items-center">
                  <input type="range" min="-15" max="15" step="1" value={treble} onChange={(e) => setTreble(parseInt(e.target.value))} className="fader-thumb absolute w-full h-full appearance-none bg-transparent outline-none z-10" />
                  <div className="absolute left-1/2 w-0.5 h-3 bg-zinc-700 -translate-x-1/2"></div>
                  <div className="h-full rounded-full bg-orange-500 opacity-40 transition-all" style={{ width: `${((treble + 15) / 30) * 100}%` }}></div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section id="features" className="py-24 bg-zinc-900 border-t border-zinc-800 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black mb-4">Hardware Features. <span className="text-cyan-400">Software Magic.</span></h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">Tudo o que se espera de um rádio de cabeceira topo de gama, construído puramente com tecnologias web modernas.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-zinc-800 p-6 rounded-2xl border border-zinc-700/50 hover:border-cyan-500/50 transition-colors">
              <Headphones className="text-cyan-400 mb-4" size={32} />
              <h3 className="text-xl font-bold mb-2">Web Audio API</h3>
              <p className="text-zinc-400 text-sm">Processamento de sinal em tempo real. Equalizador mecânico e analisador de espectro de alta precisão (FFT 64).</p>
            </div>
            <div className="bg-zinc-800 p-6 rounded-2xl border border-zinc-700/50 hover:border-orange-500/50 transition-colors">
              <Disc className="text-orange-500 mb-4" size={32} />
              <h3 className="text-xl font-bold mb-2">Vinyl & AM FX</h3>
              <p className="text-zinc-400 text-sm">Filtros *Lowpass* e *Bandpass* algoritmos que cortam frequências para emular a imperfeição acolhedora do som analógico e cassetes.</p>
            </div>
            <div className="bg-zinc-800 p-6 rounded-2xl border border-zinc-700/50 hover:border-emerald-500/50 transition-colors">
              <Cpu className="text-emerald-500 mb-4" size={32} />
              <h3 className="text-xl font-bold mb-2">Memória EEPROM</h3>
              <p className="text-zinc-400 text-sm">Tal como num rádio real, o estado é preservado. Favoritos, volume, equalização e os *Presets* P1-P3 nunca são esquecidos.</p>
            </div>
            <div className="bg-zinc-800 p-6 rounded-2xl border border-zinc-700/50 hover:border-purple-500/50 transition-colors">
              <Layers className="text-purple-500 mb-4" size={32} />
              <h3 className="text-xl font-bold mb-2">Skeuomorphic UI</h3>
              <p className="text-zinc-400 text-sm">Design focado no aspeto tátil, com botões mecânicos, cliques reativos e um ecrã LCD com luz de fundo controlável.</p>
            </div>
          </div>
        </div>
      </section>

      {/* TECH STACK SECTION */}
      <section id="tech" className="py-24 bg-zinc-950 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <Code2 className="text-zinc-500 mx-auto mb-6" size={48} />
          <h2 className="text-3xl font-black mb-6">Desenvolvido por Luis Paulo</h2>
          <p className="text-zinc-400 text-lg leading-relaxed mb-8">
            Estudante de Análise e Desenvolvimento de Sistemas com foco em engenharia Full Stack. O projeto Radio Arch demonstra a capacidade de combinar manipulação avançada da DOM, gestão de estado complexa em React, e arquitetura baseada em eventos (Web Audio API) numa interface altamente responsiva estilizada com Tailwind CSS.
          </p>
          <a href="https://github.com/LuisPauloCN507/RadioArch" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-3 rounded-full font-bold transition-colors">
            Ver Código no GitHub
          </a>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-8 bg-black border-t border-zinc-900 text-center">
        <p className="text-zinc-600 font-mono text-xs">
          © {new Date().getFullYear()} Radio Arch | Criado com <span className="text-cyan-500">Next.js</span> & <span className="text-cyan-500">Tailwind CSS</span>
        </p>
      </footer>
      
      <div className="hidden">
        <Player currentRadio={currentRadio} isPlaying={isPlaying} onPlayPause={() => setIsPlaying(!isPlaying)} volume={volume} onVolumeChange={setVolume} isFavorite={favorites.includes(currentRadio?.id)} toggleFavorite={handleToggleFavorite} />
      </div>
    </div>
  );
}