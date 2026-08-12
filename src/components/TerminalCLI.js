import { useEffect, useRef, useState } from 'react';

export default function TerminalCLI({ isOpen, onClose, onCommand }) {
  const [input, setInput] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) {
      onCommand(input.trim().toLowerCase());
    }
    setInput('');
    onClose(); 
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-[90%] max-w-2xl bg-black/95 border border-cyan-500/50 p-3 z-60 font-mono shadow-[0_0_20px_rgba(34,211,238,0.2)]">
      <form onSubmit={handleSubmit} className="flex items-center gap-3">
        <span className="text-cyan-500 font-bold">root@radioarch:~#</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Escape' && onClose()}
          className="flex-1 bg-transparent text-zinc-200 outline-none placeholder:text-zinc-700"
          placeholder="Tenta: 'play', 'pause', 'vol 80', 'favs', 'all'..."
          autoComplete="off"
        />
      </form>
    </div>
  );
}