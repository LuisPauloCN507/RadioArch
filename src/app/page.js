'use client';

import Player from '@/components/Player';
import { radioList } from '@/data/radios';
import { ChevronDown, ChevronUp, Code2, Command, Copy, Disc, Heart, Info, Lightbulb, MapPin, Palette, Play, PlusCircle, Radio, RadioReceiver, Search, Square, Timer, Trash2, Upload, Download, Volume2, VolumeX, X } from 'lucide-react';
import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';

const VERTICAL_SPACING = 180; 

const lcdThemes = [
  { name: 'CYAN', hex: '#22d3ee', bg: 'bg-cyan-900/30', text: 'text-cyan-400', shadow: 'rgba(34,211,238,0.5)' },
  { name: 'PAPAYA', hex: '#f97316', bg: 'bg-orange-900/30', text: 'text-orange-500', shadow: 'rgba(249,115,22,0.5)' },
  { name: 'ARCH', hex: '#1793d1', bg: 'bg-sky-900/30', text: 'text-sky-400', shadow: 'rgba(23,147,209,0.5)' },
  { name: 'TERMINAL', hex: '#22c55e', bg: 'bg-green-900/30', text: 'text-green-500', shadow: 'rgba(34,197,94,0.5)' }
];

function FadeInSection({ children, delay = 0 }) {
  const domRef = useRef();
  const [isVisible, setVisible] = useState(false);
  
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => { if (entry.isIntersecting) setVisible(true); });
    }, { threshold: 0.1 });
    
    const currentRef = domRef.current;
    if (currentRef) observer.observe(currentRef);
    return () => { if (currentRef) observer.unobserve(currentRef); };
  }, []);
  
  return (
    <div ref={domRef} className={`transition-all duration-1000 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

function VerticalDeckItem({ radio, isCenter, offset, onSelect, activeTheme }) {
  const isVisible = Math.abs(offset) <= 2;
  return (
    <div onClick={onSelect} className={`absolute w-full cursor-pointer transition-all duration-500 ease-out flex justify-center ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      style={{ transform: `translateY(${offset * VERTICAL_SPACING}px) scale(${isCenter ? 1.05 : 0.85}) perspective(800px) rotateX(${offset * -25}deg)`, zIndex: 10 - Math.abs(offset), filter: isCenter ? 'none' : 'grayscale(80%) brightness(40%)' }}>
      <div className={`transition-all duration-500 w-64 h-40 flex items-center justify-center ${isCenter ? 'scale-110' : 'drop-shadow-md'}`} style={{ dropShadow: isCenter ? `0 0 15px ${activeTheme.shadow}` : 'none' }}>
        {radio.logo ? (
          <Image 
            src={radio.logo} 
            alt={radio.name} 
            width={256}
            height={160}
            unoptimized
            className="w-full h-full object-contain opacity-90 hover:opacity-100 transition-opacity" 
            onError={(e) => { e.target.style.display = 'none'; if (e.target.nextSibling) e.target.nextSibling.style.display = 'block'; }} 
          />
        ) : null}
        <span className={`text-zinc-500 font-bold text-center px-4 ${radio.logo ? 'hidden' : 'block'}`}>{radio.name}</span>
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
  
  const [sleepTimer, setSleepTimer] = useState(0); 
  const [timeLeft, setTimeLeft] = useState(0); 
  const [isMuted, setIsMuted] = useState(false);
  const [displayMode, setDisplayMode] = useState(false);
  const [band, setBand] = useState('FM'); 
  const [backlight, setBacklight] = useState(true);
  const [themeIndex, setThemeIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [showCommandCenter, setShowCommandCenter] = useState(false);

  const [customRadios, setCustomRadios] = useState([]);
  const [newRadioName, setNewRadioName] = useState('');
  const [newRadioGenre, setNewRadioGenre] = useState(''); 
  const [newRadioUrl, setNewRadioUrl] = useState('');
  
  const [apiSearchQuery, setApiSearchQuery] = useState('');
  const [apiResults, setApiResults] = useState([]);
  const [isSearchingApi, setIsSearchingApi] = useState(false);
  
  const audioRef = useRef(null);
  const canvasRef = useRef(null);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const requestRef = useRef(null);
  const noiseNodeRef = useRef(null); 
  const fileInputRef = useRef(null);
  
  const amFilterRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamDestRef = useRef(null);

  const activeTheme = lcdThemes[themeIndex];
  const lcdColor = backlight ? activeTheme.hex : '#1e3a8a';
  const lcdColorRef = useRef(lcdColor);

  useEffect(() => { lcdColorRef.current = lcdColor; }, [lcdColor]);

  const playClickSound = useCallback(() => {
    try {
      const ctx = audioCtxRef.current || new (window.AudioContext || window.webkitAudioContext)();
      if (!audioCtxRef.current) audioCtxRef.current = ctx;
      const osc = ctx.createOscillator(); const gain = ctx.createGain();
      osc.type = 'square'; osc.frequency.setValueAtTime(800, ctx.currentTime); osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.03); 
      gain.gain.setValueAtTime(0.1, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + 0.05);
    } catch (e) {}
  }, []);

  const playSystemBeep = useCallback((freq = 800, type = 'square', duration = 0.05) => {
    try {
      const ctx = audioCtxRef.current || new (window.AudioContext || window.webkitAudioContext)();
      if (!audioCtxRef.current) audioCtxRef.current = ctx;
      const osc = ctx.createOscillator(); const gain = ctx.createGain();
      osc.type = type; osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + duration);
    } catch (e) {}
  }, []);

  const startTuningSound = useCallback(() => {
    try {
      if (noiseNodeRef.current) return; 
      const ctx = audioCtxRef.current || new (window.AudioContext || window.webkitAudioContext)();
      if (!audioCtxRef.current) audioCtxRef.current = ctx;
      const bufferSize = ctx.sampleRate * 2; const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) { data[i] = Math.random() * 2 - 1; }
      const noiseSource = ctx.createBufferSource(); noiseSource.buffer = buffer; noiseSource.loop = true;
      const filter = ctx.createBiquadFilter(); filter.type = 'bandpass'; filter.frequency.value = 1000;
      const gain = ctx.createGain(); gain.gain.value = band === 'AM' ? 0.3 : 0.15; 
      noiseSource.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
      noiseSource.start(); noiseNodeRef.current = { source: noiseSource, gain: gain };
    } catch (e) {}
  }, [band]);

  const stopTuningSound = useCallback(() => {
    if (noiseNodeRef.current) {
      try { noiseNodeRef.current.source.stop(); noiseNodeRef.current.source.disconnect(); noiseNodeRef.current.gain.disconnect(); } catch (e) {}
      noiseNodeRef.current = null;
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') { mediaRecorderRef.current.stop(); }
    setIsRecording(false);
  }, []);

  useEffect(() => {
    const updateTime = () => { setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })); };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let interval;
    if (sleepTimer > 0 && isPlaying) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) { setIsPlaying(false); setSleepTimer(0); setTimeout(() => stopRecording(), 0); return 0; }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [sleepTimer, isPlaying, stopRecording]);

  const cycleTimer = useCallback(() => { setSleepTimer((prev) => { const next = prev === 0 ? 15 : prev === 15 ? 30 : prev === 30 ? 60 : 0; setTimeLeft(next * 60); return next; }); playClickSound(); }, [playClickSound]);
  const toggleMute = useCallback(() => { setIsMuted((prev) => !prev); playClickSound(); }, [playClickSound]);
  const toggleDisplay = useCallback(() => { setDisplayMode((prev) => !prev); playClickSound(); }, [playClickSound]);
  const toggleBand = useCallback(() => { setBand(prev => prev === 'FM' ? 'AM' : 'FM'); playClickSound(); }, [playClickSound]);
  const toggleBacklight = useCallback(() => { setBacklight(prev => !prev); playClickSound(); }, [playClickSound]);
  const cycleTheme = useCallback(() => { setThemeIndex((prev) => (prev + 1) % lcdThemes.length); playSystemBeep(1000 + (themeIndex * 200), 'sine', 0.05); }, [themeIndex, playSystemBeep]);

  const displayRadios = [...radioList, ...customRadios];
  const radioCount = displayRadios.length;
  const safeIndex = activeIndex >= radioCount ? 0 : activeIndex;
  const currentRadio = displayRadios[safeIndex];
  const previousIndex = (safeIndex - 1 + radioCount) % radioCount;
  const nextIndex = (safeIndex + 1) % radioCount;

  useEffect(() => {
    if (isPlaying && currentRadio) {
      document.title = `▶ ${currentRadio.name} | RadioArch`;
    } else {
      document.title = 'RadioArch - Standby';
    }
  }, [isPlaying, currentRadio]);

  const handleExportBackup = () => {
    const data = { customRadios, favorites, themeIndex, volume };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'radioarch_sys_dump.json'; a.click();
    playSystemBeep(2000, 'sine', 0.1);
  };

  const handleImportBackup = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (data.customRadios) { setCustomRadios(data.customRadios); localStorage.setItem('radioarch_custom', JSON.stringify(data.customRadios)); }
        if (data.favorites) { setFavorites(data.favorites); localStorage.setItem('radioarch_favs', JSON.stringify(data.favorites)); }
        if (data.themeIndex !== undefined) { setThemeIndex(data.themeIndex); localStorage.setItem('radioarch_theme', data.themeIndex); }
        playSystemBeep(1000, 'square', 0.3);
        alert('System Dump restaurado com sucesso!');
      } catch(err) { alert('Ficheiro corrompido ou inválido.'); }
    };
    reader.readAsText(file);
  };

  const handleAddCustomRadio = (e) => {
    e.preventDefault();
    if (!newRadioName.trim() || !newRadioUrl.trim()) return;
    const newRadio = { id: Date.now(), name: newRadioName.trim(), genre: newRadioGenre.trim() || 'Custom Stream', city: 'Local Injection', url: newRadioUrl.trim(), logo: null };
    const updatedCustoms = [...customRadios, newRadio];
    setCustomRadios(updatedCustoms); localStorage.setItem('radioarch_custom', JSON.stringify(updatedCustoms));
    setNewRadioName(''); setNewRadioGenre(''); setNewRadioUrl(''); playSystemBeep(1400, 'sine', 0.1);
  };

  const handleClearCustomRadios = () => {
    if (confirm('Tem a certeza que deseja limpar todas as rádios customizadas?')) {
      setCustomRadios([]);
      localStorage.removeItem('radioarch_custom');
      playSystemBeep(400, 'square', 0.2);
    }
  };

  const handleCopyUrl = () => {
    if (currentRadio?.url) {
      navigator.clipboard.writeText(currentRadio.url);
      playSystemBeep(1600, 'sine', 0.1);
      alert('URL copiada para a tua área de transferência!');
    }
  };

  const searchGlobalApi = async (e) => {
    e.preventDefault();
    if (!apiSearchQuery.trim()) return;
    setIsSearchingApi(true); playClickSound();
    try {
      const res = await fetch(`https://de1.api.radio-browser.info/json/stations/search?name=${encodeURIComponent(apiSearchQuery)}&limit=6&hidebroken=true`);
      const data = await res.json();
      setApiResults(data);
    } catch(err) { console.error('Erro na API:', err); }
    setIsSearchingApi(false);
  };

  const addApiRadio = (station) => {
    const newRadio = { id: station.stationuuid, name: station.name.trim(), genre: station.tags?.split(',')[0] || 'Global API', city: station.country || 'Unknown', url: station.url_resolved, logo: station.favicon || null };
    const updatedCustoms = [...customRadios, newRadio];
    setCustomRadios(updatedCustoms); localStorage.setItem('radioarch_custom', JSON.stringify(updatedCustoms));
    playSystemBeep(1800, 'sine', 0.15); setApiResults(prev => prev.filter(r => r.stationuuid !== station.stationuuid));
  };

  const toggleRecord = useCallback(() => {
    if (!isPlaying || !audioCtxRef.current) return;
    if (isRecording) { stopRecording(); playClickSound(); } else {
      try {
        audioChunksRef.current = [];
        if (!streamDestRef.current) { streamDestRef.current = audioCtxRef.current.createMediaStreamDestination(); analyserRef.current.connect(streamDestRef.current); }
        mediaRecorderRef.current = new MediaRecorder(streamDestRef.current.stream);
        mediaRecorderRef.current.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
        mediaRecorderRef.current.onstop = () => {
          const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' }); const url = URL.createObjectURL(blob);
          const a = document.createElement('a'); a.href = url; a.download = `RadioArch_${currentRadio?.name.replace(/\s+/g, '_') || 'Recording'}.webm`; a.click(); URL.revokeObjectURL(url);
        };
        mediaRecorderRef.current.start(); setIsRecording(true); playSystemBeep(1500, 'square', 0.1);
      } catch (err) {}
    }
  }, [isPlaying, isRecording, playClickSound, playSystemBeep, currentRadio, stopRecording]);

  useEffect(() => {
    setTimeout(() => {
      const savedIndex = localStorage.getItem('radioarch_index'); const savedVolume = localStorage.getItem('radioarch_volume');
      const savedFavs = localStorage.getItem('radioarch_favs'); const savedTheme = localStorage.getItem('radioarch_theme');
      const savedCustom = localStorage.getItem('radioarch_custom');
      if (savedIndex !== null) setActiveIndex(parseInt(savedIndex, 10));
      if (savedVolume !== null) setVolume(parseFloat(savedVolume));
      if (savedFavs) setFavorites(JSON.parse(savedFavs));
      if (savedTheme !== null) setThemeIndex(parseInt(savedTheme, 10));
      if (savedCustom) setCustomRadios(JSON.parse(savedCustom));
    }, 0);
    return () => cancelAnimationFrame(requestRef.current);
  }, []);

  useEffect(() => { localStorage.setItem('radioarch_index', activeIndex.toString()); }, [activeIndex]);
  useEffect(() => { localStorage.setItem('radioarch_theme', themeIndex.toString()); }, [themeIndex]);
  useEffect(() => { localStorage.setItem('radioarch_volume', volume.toString()); if (audioRef.current) audioRef.current.volume = isMuted ? 0 : volume; }, [volume, isMuted]);
  useEffect(() => { localStorage.setItem('radioarch_favs', JSON.stringify(favorites)); }, [favorites]);

  useEffect(() => {
    if (audioCtxRef.current && amFilterRef.current) {
      amFilterRef.current.type = band === 'AM' ? 'bandpass' : 'allpass';
      if (band === 'AM') amFilterRef.current.frequency.setValueAtTime(1500, audioCtxRef.current.currentTime);
    }
  }, [band]);

  useEffect(() => {
    if (isPlaying && isLoading) startTuningSound(); else stopTuningSound();
  }, [isPlaying, isLoading, startTuningSound, stopTuningSound]);

  const handleToggleFavorite = useCallback(() => {
    if (!currentRadio) return;
    setFavorites(prev => prev.includes(currentRadio.id) ? prev.filter(id => id !== currentRadio.id) : [...prev, currentRadio.id]);
    playSystemBeep(1200, 'sine', 0.1); 
  }, [currentRadio, playSystemBeep]);

  const startVisualizer = useCallback(() => {
    if (!canvasRef.current || !analyserRef.current) return;
    const canvas = canvasRef.current; const ctx = canvas.getContext('2d');
    const bufferLength = analyserRef.current.frequencyBinCount; const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      requestRef.current = requestAnimationFrame(draw);
      analyserRef.current.getByteFrequencyData(dataArray);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const barCount = 20; const barWidth = (canvas.width / barCount) - 2; let x = 0;

      for (let i = 0; i < barCount; i++) {
        const barHeight = (dataArray[i * 2] / 255) * canvas.height;
        ctx.shadowBlur = backlight ? 10 : 0; ctx.shadowColor = lcdColorRef.current; ctx.fillStyle = lcdColorRef.current;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight); x += barWidth + 2;
      }
      
      const eq1 = document.getElementById('eq-1'); const eq2 = document.getElementById('eq-2'); const eq3 = document.getElementById('eq-3');
      if(eq1 && eq2 && eq3) {
        eq1.style.height = `${Math.max(2, (dataArray[2] / 255) * 12)}px`;
        eq2.style.height = `${Math.max(2, (dataArray[6] / 255) * 12)}px`;
        eq3.style.height = `${Math.max(2, (dataArray[10] / 255) * 12)}px`;
      }

      const ambilight = document.getElementById('ambilight-glow');
      if (ambilight && backlight) {
        const bass = (dataArray[0] + dataArray[1] + dataArray[2] + dataArray[3]) / 4;
        const scale = 1 + (bass / 255) * 0.3; 
        const opacity = 0.15 + (bass / 255) * 0.25; 
        ambilight.style.transform = `translate(-50%, -50%) scale(${scale})`;
        ambilight.style.opacity = opacity;
      }
    };
    cancelAnimationFrame(requestRef.current); draw();
  }, [backlight]);

  const stopVisualizer = useCallback(() => {
    cancelAnimationFrame(requestRef.current);
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d'); ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      const barCount = 20; const barWidth = (canvasRef.current.width / barCount) - 2;
      ctx.fillStyle = '#18181b'; ctx.shadowBlur = 0;
      for(let i = 0; i < barCount; i++) { ctx.fillRect(i * (barWidth + 2), canvasRef.current.height - 2, barWidth, 2); }
    }
    const ambilight = document.getElementById('ambilight-glow');
    if (ambilight) {
      ambilight.style.transform = `translate(-50%, -50%) scale(1)`;
      ambilight.style.opacity = 0.2;
    }
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlaying && isRecording) stopRecording(); 
    if (!isPlaying) setIsLoading(true); 
    setIsPlaying((prev) => !prev); playClickSound(); 
  }, [isPlaying, isRecording, stopRecording, playClickSound]);

  const resetAudio = useCallback(() => { if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ''; } }, []);
  const changeRadio = useCallback((index) => { if (isRecording) stopRecording(); setIsPlaying(false); setIsLoading(true); resetAudio(); setActiveIndex(index); playClickSound(); }, [resetAudio, playClickSound, isRecording, stopRecording]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentRadio) return;

    if (isPlaying) {
      if (!audioCtxRef.current) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioCtxRef.current = new AudioContext(); analyserRef.current = audioCtxRef.current.createAnalyser(); analyserRef.current.fftSize = 64; 
        amFilterRef.current = audioCtxRef.current.createBiquadFilter();
        sourceRef.current = audioCtxRef.current.createMediaElementSource(audio);
        sourceRef.current.connect(amFilterRef.current); amFilterRef.current.connect(analyserRef.current); analyserRef.current.connect(audioCtxRef.current.destination);
      }
      if (audioCtxRef.current.state === 'suspended') audioCtxRef.current.resume();
      audio.play().then(() => startVisualizer()).catch(() => { setIsPlaying(false); setIsLoading(false); setTimeout(() => stopRecording(), 0); });
    } else {
      audio.pause(); stopVisualizer();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, currentRadio]); 

  useEffect(() => {
    if (audioRef.current && currentRadio) { audioRef.current.src = currentRadio.url; audioRef.current.load(); if (isPlaying) { audioRef.current.play().catch(() => {}); } }
  }, [currentRadio, isPlaying]);

  useEffect(() => {
    if ('mediaSession' in navigator && currentRadio) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentRadio.name, artist: currentRadio.genre, album: 'Radio Arch Deck',
        artwork: [{ src: currentRadio.logo || 'https://via.placeholder.com/512/000000/22d3ee?text=RADIOARCH', sizes: '512x512', type: 'image/png' }]
      });
      navigator.mediaSession.setActionHandler('play', () => { if (!isPlaying) togglePlay(); });
      navigator.mediaSession.setActionHandler('pause', () => { if (isPlaying) togglePlay(); });
      navigator.mediaSession.setActionHandler('previoustrack', () => changeRadio(previousIndex));
      navigator.mediaSession.setActionHandler('nexttrack', () => changeRadio(nextIndex));
    }
  }, [currentRadio, isPlaying, togglePlay, changeRadio, previousIndex, nextIndex]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if(e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      const key = e.key.toLowerCase();
      
      if (e.code === 'Space') { e.preventDefault(); togglePlay(); }
      if (e.code === 'ArrowRight') { e.preventDefault(); changeRadio(nextIndex); }
      if (e.code === 'ArrowLeft') { e.preventDefault(); changeRadio(previousIndex); }
      
      if (key === 'm') { e.preventDefault(); toggleMute(); }
      if (key === 'l') { e.preventDefault(); toggleBacklight(); }
      if (key === 'b') { e.preventDefault(); toggleBand(); }
      if (key === 'c') { e.preventDefault(); cycleTheme(); }
      if (key === 'r') { e.preventDefault(); toggleRecord(); }
      if (key === 'k') { e.preventDefault(); setShowCommandCenter(prev => !prev); playSystemBeep(1200, 'sine', 0.1); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextIndex, previousIndex, changeRadio, togglePlay, toggleMute, toggleBacklight, toggleBand, cycleTheme, toggleRecord, playSystemBeep]); 

  useEffect(() => { if (!isPlaying) stopVisualizer(); }, [isPlaying, stopVisualizer]);

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans selection:bg-cyan-500 selection:text-black overflow-x-hidden relative">
      
      {/* COMMIT 2: SCROLLBAR DINÂMICO BASEADO NO TEMA */}
      <style dangerouslySetInnerHTML={{__html: `
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: #09090b; }
        ::-webkit-scrollbar-thumb { background-color: ${activeTheme.hex}; border-radius: 10px; opacity: 0.8; }
        ::-webkit-scrollbar-corner { background: #09090b; }
      `}} />

      {/* COMMIT 1: EFEITO CRT SCANLINES E TEXTURA GLOBAL */}
      <div className="pointer-events-none fixed inset-0 z-100 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.15)_50%)] bg-size-[100%_4px] opacity-40 mix-blend-overlay"></div>

      <audio ref={audioRef} crossOrigin="anonymous" onWaiting={() => setIsLoading(true)} onLoadStart={() => setIsLoading(true)} onPlaying={() => setIsLoading(false)} onCanPlay={() => setIsLoading(false)} onError={() => setIsLoading(true)} />
      
      <nav className="fixed top-0 w-full z-50 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-900/50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2"><RadioReceiver className={activeTheme.text} size={24} /><span className="font-mono font-bold tracking-widest uppercase text-lg">RADIO<span className="text-zinc-500">ARCH</span></span></div>
          <div className="hidden md:flex gap-8 text-sm font-medium text-zinc-400">
            <a href="#app" className={`hover:${activeTheme.text} transition-colors`}>Player</a>
            <a href="#stations" className={`hover:${activeTheme.text} transition-colors`}>Estações</a>
            <a href="#inject" className={`hover:${activeTheme.text} transition-colors`}>Scanner & Injeção</a>
          </div>
          <div className="flex items-center gap-4">
             <button onClick={() => setShowCommandCenter(true)} className="hidden sm:flex items-center gap-2 text-xs font-mono text-zinc-500 hover:text-white transition-colors border border-zinc-800 px-3 py-1.5 rounded bg-zinc-900">
               <Command size={14}/> <span>Acessibilidade [ K ]</span>
             </button>
             <button onClick={() => { document.getElementById('app').scrollIntoView({ behavior: 'smooth' }); }} className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-md font-bold text-sm border border-zinc-700">Sintonizar</button>
          </div>
        </div>
      </nav>

      <section id="app" className="pt-32 pb-24 px-4 md:px-8 flex flex-col items-center justify-center min-h-screen relative">
        <div id="ambilight-glow" className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-200 h-150 rounded-full pointer-events-none blur-[150px] transition-colors duration-1000 ${activeTheme.bg} opacity-20`} style={{ transition: 'background-color 1s ease, transform 0.1s ease-out, opacity 0.1s ease-out' }}></div>
        <FadeInSection>
          <div className="text-center mb-12 relative z-10">
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-transparent bg-clip-text bg-linear-to-br from-white via-zinc-200 to-zinc-500 mb-6">A Frequência Perfeita <br className="hidden md:block" /> para o Teu Flow.</h1>
          </div>
        </FadeInSection>
        <FadeInSection delay={200}>
          <div className="relative w-full max-w-5xl h-150 bg-zinc-800 rounded-[2.5rem] p-6 shadow-[0_35px_60px_-15px_rgba(0,0,0,0.8),inset_0_2px_4px_rgba(255,255,255,0.1)] border border-zinc-700 flex flex-col md:flex-row gap-8 z-10 mx-auto">
            <div className="w-full md:w-5/12 h-full relative rounded-2xl bg-[#1e1e24] shadow-inner overflow-hidden border-4 border-zinc-900 flex flex-col items-center justify-between py-6">
              <div className="absolute inset-0 bg-[radial-gradient(#000_2px,transparent_2px)] bg-size-[10px_10px] opacity-40 pointer-events-none"></div>
              <button onClick={() => changeRadio(previousIndex)} className="relative z-10 w-16 h-10 bg-zinc-700 hover:bg-zinc-600 rounded-lg shadow-[0_4px_0_#18181b] active:translate-y-1 flex items-center justify-center transition-all border border-zinc-600"><ChevronUp size={24} className="text-zinc-300" /></button>
              <div className="relative w-full h-95 flex items-center justify-center">
                {displayRadios.map((radio, index) => {
                  const isCenter = index === safeIndex; const offset = index - safeIndex;
                  return <VerticalDeckItem key={radio.id} radio={radio} isCenter={isCenter} offset={offset} onSelect={() => { changeRadio(index); if (!isPlaying) togglePlay(); }} activeTheme={activeTheme} />;
                })}
              </div>
              <button onClick={() => changeRadio(nextIndex)} className="relative z-10 w-16 h-10 bg-zinc-700 hover:bg-zinc-600 rounded-lg shadow-[0_4px_0_#18181b] active:translate-y-1 flex items-center justify-center transition-all border border-zinc-600"><ChevronDown size={24} className="text-zinc-300" /></button>
            </div>
            <div className="flex-1 h-full flex flex-col justify-between py-2">
              <div className="w-full h-56 bg-[#050505] rounded-xl border-[6px] border-zinc-900 shadow-[inset_0_0_20px_rgba(0,0,0,1)] relative flex flex-col p-6 overflow-hidden">
                <div className={`absolute inset-0 bg-linear-to-tr from-transparent via-white/5 to-transparent pointer-events-none transition-opacity ${backlight ? 'opacity-100' : 'opacity-20'}`}></div>
                <div className="flex justify-between items-start w-full relative z-10">
                  <div className="flex flex-col gap-1">
                    <h1 className={`text-lg font-black tracking-[0.3em] uppercase italic font-mono flex items-center gap-4 transition-all ${backlight ? 'opacity-80 text-white' : 'opacity-30 text-zinc-600'}`}><span>RADIO<span className={activeTheme.text}>ARCH</span></span></h1>
                    <div className="flex gap-2 font-mono text-[9px] tracking-widest font-bold"><span className={`${band === 'AM' ? 'text-amber-500' : 'text-zinc-800'}`}>[AM]</span><span className={`${band === 'FM' ? activeTheme.text : 'text-zinc-800'}`}>[FM]</span><span className={`${isMuted ? 'text-red-500 animate-pulse' : 'text-zinc-800'}`}>[MUTED]</span></div>
                  </div>
                  <div className="flex flex-col items-end transition-colors" style={{ color: lcdColor }}>
                    <div className="flex items-center gap-3 mb-1">{sleepTimer > 0 && <span className="text-zinc-500 text-[10px] font-mono tracking-widest">⏱ {formatTime(timeLeft)}</span>}<span className={`text-lg font-mono font-bold tracking-widest`} style={{ textShadow: backlight ? `0 0 8px ${activeTheme.shadow}` : 'none' }}>{currentTime}</span></div>
                    <span className={`${isRecording ? 'text-red-500' : isPlaying && isLoading ? (backlight ? 'text-yellow-400' : 'text-yellow-700') : ''} text-xs font-mono font-bold animate-pulse`}>{isRecording ? 'RECORDING' : isPlaying ? (isLoading ? 'TUNING...' : 'ON AIR') : 'STANDBY'}</span>
                  </div>
                </div>
                <div className="flex-1 flex flex-col justify-center items-center mt-2 relative z-10">
                  <canvas ref={canvasRef} width={280} height={50} className={displayMode ? 'hidden' : 'mb-4'} />
                  <div className={displayMode ? 'hidden' : 'flex flex-col items-center transition-colors'} style={{ color: lcdColor }}><h2 className={`text-2xl font-bold tracking-wider text-center line-clamp-1 ${backlight ? 'text-white' : 'text-zinc-500'}`}>{currentRadio?.name}</h2><p className="text-xs mt-2 font-medium tracking-[0.3em] uppercase font-mono">[{currentRadio?.genre}]</p></div>
                  <div className={`w-full flex flex-col gap-1.5 font-mono text-[10px] opacity-90 transition-colors ${displayMode ? 'block' : 'hidden'}`} style={{ color: lcdColor }}>
                    <p className={`border-b pb-1 mb-1 font-bold ${backlight ? 'border-current text-white' : 'border-zinc-800 text-zinc-400'}`}>SYSTEM DIAGNOSTICS</p>
                    <p>FREQ: {(88.0 + safeIndex * 2.4).toFixed(1)} MHz</p>
                    <p>COLOR: {activeTheme.name} / BACKLIGHT: {backlight ? 'ON' : 'OFF'}</p>
                    <p className="flex items-center justify-between">
                      <span>STATUS: {isRecording ? 'REC ACTIVE' : isLoading ? 'SYNCING...' : (isPlaying ? 'ACTIVE' : 'IDLE')}</span>
                      <button onClick={handleCopyUrl} className="ml-2 bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded hover:text-white flex items-center gap-1 border border-zinc-700 transition-colors"><Copy size={10}/> URL</button>
                    </p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 md:flex md:flex-wrap justify-center gap-3 mt-8 px-2">
                <button onClick={togglePlay} className="h-14 md:w-14 bg-zinc-700 rounded-lg shadow-[0_4px_0_#18181b] active:translate-y-1 transition-all flex flex-col items-center justify-center gap-1 border border-zinc-600 group">{isPlaying ? <Square size={16} className={activeTheme.text} /> : <Play size={16} className="text-zinc-300 group-hover:text-white" />}<span className="text-[8px] font-bold tracking-widest uppercase text-zinc-400">Pwr</span></button>
                <button onClick={handleToggleFavorite} className="h-14 md:w-14 bg-zinc-700 rounded-lg shadow-[0_4px_0_#18181b] active:translate-y-1 transition-all flex flex-col items-center justify-center gap-1 border border-zinc-600 group"><Heart size={16} className={favorites.includes(currentRadio?.id) ? 'text-red-500 fill-red-500' : 'text-zinc-300 group-hover:text-white'} /><span className="text-[8px] font-bold tracking-widest uppercase text-zinc-400">Fav</span></button>
                <button onClick={toggleBand} className={`h-14 md:w-14 rounded-lg shadow-[0_4px_0_#18181b] active:translate-y-1 transition-all flex flex-col items-center justify-center gap-1 border border-zinc-600 group ${band === 'AM' ? 'bg-amber-900/40' : 'bg-zinc-700'}`}><Radio size={16} className={band === 'AM' ? 'text-amber-500' : activeTheme.text} /><span className={`text-[8px] font-bold tracking-widest uppercase ${band === 'AM' ? 'text-amber-500' : activeTheme.text}`}>{band}</span></button>
                <button onClick={toggleBacklight} className={`h-14 md:w-14 rounded-lg shadow-[0_4px_0_#18181b] active:translate-y-1 transition-all flex flex-col items-center justify-center gap-1 border border-zinc-600 group ${backlight ? activeTheme.bg : 'bg-zinc-800'}`}><Lightbulb size={16} className={backlight ? activeTheme.text : 'text-zinc-600'} /><span className={`text-[8px] font-bold tracking-widest uppercase ${backlight ? activeTheme.text : 'text-zinc-600'}`}>Lite</span></button>
                <button onClick={cycleTimer} className={`h-14 md:w-14 rounded-lg shadow-[0_4px_0_#18181b] active:translate-y-1 transition-all flex flex-col items-center justify-center gap-1 border border-zinc-600 group ${sleepTimer > 0 ? activeTheme.bg : 'bg-zinc-700'}`}><Timer size={16} className={sleepTimer > 0 ? activeTheme.text : 'text-zinc-300 group-hover:text-white'} /><span className={`text-[8px] font-bold tracking-widest uppercase ${sleepTimer > 0 ? activeTheme.text : 'text-zinc-400'}`}>Slp</span></button>
                <button onClick={toggleMute} className={`h-14 md:w-14 rounded-lg shadow-[0_4px_0_#18181b] active:translate-y-1 transition-all flex flex-col items-center justify-center gap-1 border border-zinc-600 group ${isMuted ? 'bg-red-900/30 border-red-900' : 'bg-zinc-700'}`}>{isMuted ? <VolumeX size={16} className="text-red-500" /> : <Volume2 size={16} className="text-zinc-300 group-hover:text-white" />}<span className={`text-[8px] font-bold tracking-widest uppercase ${isMuted ? 'text-red-500' : 'text-zinc-400'}`}>Mut</span></button>
                <button onClick={toggleDisplay} className={`h-14 md:w-14 rounded-lg shadow-[0_4px_0_#18181b] active:translate-y-1 transition-all flex flex-col items-center justify-center gap-1 border border-zinc-600 group ${displayMode ? activeTheme.bg : 'bg-zinc-700'}`}><Info size={16} className={displayMode ? activeTheme.text : 'text-zinc-300 group-hover:text-white'} /><span className={`text-[8px] font-bold tracking-widest uppercase ${displayMode ? activeTheme.text : 'text-zinc-400'}`}>Info</span></button>
                <button onClick={cycleTheme} className={`h-14 md:w-14 rounded-lg shadow-[0_4px_0_#18181b] active:translate-y-1 transition-all flex flex-col items-center justify-center gap-1 border border-zinc-600 group bg-zinc-800 hover:bg-zinc-700`}><Palette size={16} className={activeTheme.text} /><span className={`text-[8px] font-bold tracking-widest uppercase ${activeTheme.text}`}>Cor</span></button>
                <button onClick={toggleRecord} className={`h-14 md:w-14 rounded-lg shadow-[0_4px_0_#18181b] active:translate-y-1 transition-all flex flex-col items-center justify-center gap-1 border group ${isRecording ? 'bg-red-900/30 border-red-900' : 'bg-zinc-700 border-zinc-600'}`}><Disc size={16} className={isRecording ? 'text-red-500 animate-pulse' : 'text-zinc-300 group-hover:text-white'} /><span className={`text-[8px] font-bold tracking-widest uppercase ${isRecording ? 'text-red-500' : 'text-zinc-400'}`}>Rec</span></button>
              </div>
              <div className="mt-8 bg-zinc-900 rounded-xl p-5 border-2 border-zinc-950 shadow-inner flex items-center gap-6">
                <style dangerouslySetInnerHTML={{__html: `.fader-thumb::-webkit-slider-thumb { appearance: none; width: 28px; height: 40px; background: #52525b; border: 2px solid #27272a; border-radius: 4px; cursor: grab; box-shadow: 0 4px 6px rgba(0,0,0,0.5), inset 0 2px 0 rgba(255,255,255,0.2); } .fader-thumb::-webkit-slider-thumb:active { cursor: grabbing; }`}} />
                <span className="text-xs font-mono font-bold text-zinc-500">MIN</span>
                <div className="relative flex-1 h-3 bg-black rounded-full shadow-inner flex items-center"><input type="range" min="0" max="1" step="0.01" value={volume} onChange={(e) => { setVolume(parseFloat(e.target.value)); if (isMuted) toggleMute(); }} className="fader-thumb absolute w-full h-full appearance-none bg-transparent outline-none z-10" /><div className={`h-full rounded-full transition-all opacity-80`} style={{ width: `${volume * 100}%`, backgroundColor: activeTheme.hex }}></div></div>
                <span className="text-xs font-mono font-bold text-zinc-500">MAX</span>
              </div>
            </div>
          </div>
        </FadeInSection>
      </section>

      <section id="inject" className="py-24 bg-zinc-900/50 border-t border-zinc-800 px-6">
        <div className="max-w-6xl mx-auto">
          <FadeInSection>
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-black mb-4">Adiciona Novas <span className={activeTheme.text}>Frequências.</span></h2>
              <p className="text-zinc-400">Injeta a tua própria URL ou pesquisa no banco de dados global da Radio Browser API.</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <form onSubmit={handleAddCustomRadio} className="bg-zinc-950 border border-zinc-800 p-8 rounded-2xl shadow-xl flex flex-col gap-6 h-full justify-between">
                <div>
                  <h3 className="font-bold text-xl mb-4 flex justify-between items-center border-b border-zinc-800 pb-2">
                    <span className="flex items-center gap-2"><PlusCircle className={activeTheme.text}/> Injeção Manual</span>
                    {customRadios.length > 0 && (
                      <button type="button" onClick={handleClearCustomRadios} className="text-xs text-red-500 hover:text-red-400 flex items-center gap-1 transition-colors bg-zinc-900 px-2 py-1 rounded border border-red-900"><Trash2 size={12}/> Limpar Deck</button>
                    )}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div className="flex flex-col gap-2"><label className="text-[10px] font-mono text-zinc-500">NOME</label><input type="text" placeholder="Ex: Rádio Local" value={newRadioName} onChange={(e) => setNewRadioName(e.target.value)} required className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white outline-none focus:border-cyan-500 font-mono text-sm" /></div>
                    <div className="flex flex-col gap-2"><label className="text-[10px] font-mono text-zinc-500">GÉNERO</label><input type="text" placeholder="Ex: Rock" value={newRadioGenre} onChange={(e) => setNewRadioGenre(e.target.value)} className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white outline-none focus:border-cyan-500 font-mono text-sm" /></div>
                  </div>
                  <div className="flex flex-col gap-2"><label className="text-[10px] font-mono text-zinc-500">URL DA STREAM</label><input type="url" placeholder="https://..." value={newRadioUrl} onChange={(e) => setNewRadioUrl(e.target.value)} required className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white outline-none focus:border-cyan-500 font-mono text-sm" /></div>
                </div>
                <button type="submit" className="w-full font-bold px-4 py-3 rounded-lg border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 transition-colors">Injetar no Deck</button>
              </form>

              <div className="bg-zinc-950 border border-zinc-800 p-8 rounded-2xl shadow-xl flex flex-col gap-6">
                <h3 className="font-bold text-xl flex items-center gap-2 border-b border-zinc-800 pb-2"><Search className={activeTheme.text}/> Global Scanner API</h3>
                <form onSubmit={searchGlobalApi} className="flex gap-2">
                  <input type="text" placeholder="Pesquisar estilo, país ou nome..." value={apiSearchQuery} onChange={(e) => setApiSearchQuery(e.target.value)} className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white outline-none focus:border-cyan-500 font-mono text-sm" />
                  <button type="submit" disabled={isSearchingApi} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg font-bold border border-zinc-700">{isSearchingApi ? '...' : 'Scan'}</button>
                </form>
                
                <div className="flex-1 overflow-y-auto max-h-48 pr-2 flex flex-col gap-2">
                  {apiResults.length === 0 && !isSearchingApi && <p className="text-zinc-600 text-sm font-mono text-center mt-4">Nenhum resultado de scanner.</p>}
                  {apiResults.map(station => (
                    <div key={station.stationuuid} className="bg-zinc-900 p-3 rounded-lg border border-zinc-800 flex justify-between items-center group hover:border-zinc-600 transition-colors">
                      <div className="min-w-0 flex-1 mr-4">
                        <p className="font-bold text-sm truncate">{station.name}</p>
                        <p className="text-[10px] text-zinc-500 font-mono truncate">{station.country} • {station.tags}</p>
                      </div>
                      <button onClick={() => addApiRadio(station)} className="bg-black border border-zinc-700 p-2 rounded hover:bg-zinc-800 text-white shrink-0"><PlusCircle size={16}/></button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </FadeInSection>
        </div>
      </section>

      <section id="stations" className="py-24 bg-zinc-900 border-t border-zinc-800 px-6">
        <div className="max-w-7xl mx-auto">
          <FadeInSection>
            <div className="text-center mb-16"><h2 className="text-3xl md:text-5xl font-black mb-4">Sintoniza a <span className={activeTheme.text}>Tua Vibe.</span></h2></div>
          </FadeInSection>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {displayRadios.slice(0, 8).map((r, i) => (
              <FadeInSection key={r.id} delay={i * 100}>
                <div className="bg-zinc-950/50 p-6 rounded-2xl border border-zinc-800 flex flex-col items-center text-center hover:border-zinc-500/50 transition-colors cursor-pointer h-full" onClick={() => changeRadio(i)}>
                  <div className="w-16 h-16 md:w-24 md:h-24 mb-4 drop-shadow-md flex items-center justify-center bg-zinc-900 rounded-xl overflow-hidden">
                    {r.logo ? (
                      <Image 
                        src={r.logo} 
                        alt={r.name} 
                        width={96} 
                        height={96} 
                        unoptimized
                        className="w-full h-full object-contain" 
                      />
                    ) : (
                      <RadioReceiver size={32} className={activeTheme.text} />
                    )}
                  </div>
                  <h3 className="font-bold text-white text-sm md:text-base mb-1 line-clamp-2">{r.name}</h3>
                  <p className={`text-[10px] font-mono ${activeTheme.text}`}>[{r.genre}]</p>
                </div>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      <section id="developer" className="py-24 bg-zinc-950 border-t border-zinc-800 px-6">
        <FadeInSection>
          <div className="max-w-3xl mx-auto text-center">
            <div className={`w-24 h-24 mx-auto bg-zinc-800 rounded-full border-2 ${activeTheme.border} mb-6 flex items-center justify-center text-3xl font-bold ${activeTheme.text} transition-colors duration-500`} style={{ boxShadow: `0 0 20px ${activeTheme.shadow}` }}>L3</div>
            <h2 className="text-3xl font-black mb-2">Luis Paulo <span className="text-zinc-500">(@Lupd3v)</span></h2>
            <div className={`flex items-center justify-center gap-2 ${activeTheme.text} font-mono text-sm mb-6`}><MapPin size={16} /> Piauí, Brasil</div>
            
            <div className="flex flex-wrap justify-center gap-4 mt-8 pt-8 border-t border-zinc-800">
               <button onClick={handleExportBackup} className="inline-flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white px-5 py-2.5 rounded-lg font-mono text-xs border border-zinc-700 transition-colors"><Download size={14} className={activeTheme.text} /> Exportar Setup (.json)</button>
               <input type="file" ref={fileInputRef} onChange={handleImportBackup} accept=".json" className="hidden" />
               <button onClick={() => fileInputRef.current?.click()} className="inline-flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white px-5 py-2.5 rounded-lg font-mono text-xs border border-zinc-700 transition-colors"><Upload size={14} className={activeTheme.text} /> Restaurar Backup</button>
            </div>
          </div>
        </FadeInSection>
      </section>

      {showCommandCenter && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-100 flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-lg shadow-[0_0_50px_rgba(0,0,0,1)] flex flex-col overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-zinc-900">
              <h3 className="font-bold text-xl flex items-center gap-2"><Command className={activeTheme.text} /> Command Center</h3>
              <button onClick={() => setShowCommandCenter(false)} className="text-zinc-500 hover:text-white transition-colors"><X size={24} /></button>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 font-mono text-sm">
              <div className="flex justify-between border-b border-zinc-900 pb-2"><span className="text-zinc-400">Play / Pause</span><kbd className="bg-zinc-800 px-2 rounded text-cyan-400">Space</kbd></div>
              <div className="flex justify-between border-b border-zinc-900 pb-2"><span className="text-zinc-400">Próxima Rádio</span><kbd className="bg-zinc-800 px-2 rounded text-cyan-400">→</kbd></div>
              <div className="flex justify-between border-b border-zinc-900 pb-2"><span className="text-zinc-400">Rádio Anterior</span><kbd className="bg-zinc-800 px-2 rounded text-cyan-400">←</kbd></div>
              <div className="flex justify-between border-b border-zinc-900 pb-2"><span className="text-zinc-400">Mute Audio</span><kbd className="bg-zinc-800 px-2 rounded text-cyan-400">M</kbd></div>
              <div className="flex justify-between border-b border-zinc-900 pb-2"><span className="text-zinc-400">Trocar Cor (Tema)</span><kbd className="bg-zinc-800 px-2 rounded text-cyan-400">C</kbd></div>
              <div className="flex justify-between border-b border-zinc-900 pb-2"><span className="text-zinc-400">Banda (AM/FM)</span><kbd className="bg-zinc-800 px-2 rounded text-cyan-400">B</kbd></div>
              <div className="flex justify-between border-b border-zinc-900 pb-2"><span className="text-zinc-400">Backlight On/Off</span><kbd className="bg-zinc-800 px-2 rounded text-cyan-400">L</kbd></div>
              <div className="flex justify-between border-b border-zinc-900 pb-2"><span className="text-zinc-400">Gravar (REC)</span><kbd className="bg-zinc-800 px-2 rounded text-red-400">R</kbd></div>
              <div className="flex justify-between border-b border-zinc-900 pb-2"><span className="text-zinc-400">Abrir Atalhos</span><kbd className="bg-zinc-800 px-2 rounded text-cyan-400">K</kbd></div>
            </div>
            <div className="p-4 bg-zinc-900/50 text-center text-xs text-zinc-500 font-mono">
              Nota: Os atalhos são desativados enquanto digitas nos formulários.
            </div>
          </div>
        </div>
      )}

      <div className="hidden">
        <Player currentRadio={currentRadio} isPlaying={isPlaying} onPlayPause={() => setIsPlaying(!isPlaying)} volume={volume} onVolumeChange={setVolume} isFavorite={favorites.includes(currentRadio?.id)} toggleFavorite={handleToggleFavorite} />
      </div>
    </div>
  );
}