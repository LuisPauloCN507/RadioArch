export default function RadioCard({ radio, isCenter }) {
  const stateClasses = isCenter ? 'scale-110 opacity-100' : 'scale-75 opacity-25';

  return (
    <div
      className={`flex h-48 w-48 shrink-0 items-center justify-center transition-all duration-700 ease-in-out sm:h-64 sm:w-64 ${stateClasses}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={radio.logo}
        alt={radio.name}
        className="h-full w-full object-contain"
      />
    </div>
  );
}