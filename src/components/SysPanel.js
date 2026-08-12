'use client';
import { useEffect, useState } from 'react';

export default function SysPanel() {
  const [time, setTime] = useState('00:00:00');
  const [uptime, setUptime] = useState(0); 

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setTime(now.toLocaleTimeString('pt-BR', { hour12: false }));
      setUptime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatUptime = (totalSeconds) => {
    const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  return (
    // Removido o 'flex' que conflitava com 'hidden'. Agora é 'hidden sm:flex'
    <div className="absolute top-4 right-6 z-50 hidden sm:flex flex-col items-end font-mono text-[10px] tracking-widest">
      <div className="text-cyan-500 mb-1 flex items-center gap-2">
        <span>SYS_TIME</span>
        <span className="text-white bg-cyan-900/40 px-2 py-0.5 border border-cyan-900">{time}</span>
      </div>
      <div className="text-orange-500 flex items-center gap-2">
        <span>UPTIME</span>
        <span className="text-white bg-orange-900/40 px-2 py-0.5 border border-orange-900">{formatUptime(uptime)}</span>
      </div>
    </div>
  );
}