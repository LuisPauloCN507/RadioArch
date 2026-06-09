import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const metadata = {
  title: "RadioArch | Sua Conexão Digital",
  description: "Biblioteca de Web Radios focados em música de alta qualidade.",
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export { metadata };

export default function RootLayout({ children }) {
  return (
    <html
      lang="pt-br"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body 
        className="min-h-full flex flex-col" 
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}