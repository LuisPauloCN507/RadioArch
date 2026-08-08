export default function RadioCard({ radio, isCenter }) {
  const stateClasses = isCenter 
    ? 'scale-110 opacity-100 border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.3)] grayscale-0' 
    : 'scale-75 opacity-40 border-zinc-800 grayscale blur-[1px]';

  return (
    <div
      className={`relative flex h-48 w-48 sm:h-64 sm:w-64 shrink-0 items-center justify-center transition-all duration-700 ease-in-out border-2 bg-black overflow-hidden font-mono ${stateClasses}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={radio.logo}
        alt={radio.name}
        className="h-full w-full object-cover opacity-70 mix-blend-luminosity"
      />
      
      {/* Overlay Escuro para contraste */}
      <div className="absolute inset-0 bg-linear-to-t from-black via-transparent to-transparent opacity-90" />

      {/* Detalhes Tech - Só no cartão central */}
      {isCenter && (
        <>
          <div className="absolute top-2 left-2 text-[9px] text-cyan-400 bg-black/80 px-1 border border-cyan-900 tracking-widest z-10">
            [SYS.ID:{radio.id.toString().padStart(3, '0')}]
          </div>
          
          <div className="absolute bottom-2 right-2 text-[10px] text-orange-500 flex items-center gap-1 font-bold z-10">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-sm h-2 w-2 bg-orange-500"></span>
            </span>
            LIVE
          </div>

          <div className="absolute top-0 left-0 w-full h-px bg-cyan-400/50 z-10"></div>
          <div className="absolute top-0 left-0 w-px h-full bg-cyan-400/50 z-10"></div>

          {/* NOVA ANIMAÇÃO: Laser Scanner */}
          <div className="absolute left-0 w-full h-px bg-cyan-300 shadow-[0_0_10px_2px_rgba(34,211,238,0.8)] animate-scan z-20"></div>
        </>
      )}
    </div>
  );
}