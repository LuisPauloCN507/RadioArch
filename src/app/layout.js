import './globals.css';

export const metadata = {
  title: 'RadioArch | A Frequência Perfeita',
  description: 'Sintoniza as melhores frequências globais com uma interface retro-futurista de alta performance.',
  openGraph: {
    title: 'RadioArch | A Frequência Perfeita',
    description: 'Sintoniza as melhores frequências globais com uma interface retro-futurista.',
    url: 'https://radioarch.vercel.app',
    siteName: 'RadioArch',
    images: [
      {
        url: '/logo.png', 
        width: 800,
        height: 600,
      },
    ],
    locale: 'pt_BR',
    type: 'website',
  },
  icons: {
    icon: '/logo.png',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className="scroll-smooth">
      <body className="antialiased bg-zinc-950 text-white">
        {children}
      </body>
    </html>
  );
}