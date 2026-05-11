export default function RadioCard({ radio, isCenter }) {
  return (
    <div 
      className={`transition-all duration-700 ease-in-out shrink-0 flex items-center justify-center
      ${isCenter ? 'scale-110 opacity-100' : 'scale-75 opacity-25'} 
      w-48 h-48 sm:w-64 sm:h-64`}
    >
      {/* Logo Pura - Sem card, sem borda, sem animação de giro */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img 
        src={radio.logo} 
        alt={radio.name} 
        className="w-full h-full object-contain" 
      />
    </div>
  );
}