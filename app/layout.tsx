import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ATELIER CALM — Galeria Arquitetónica & Mapeamento IA',
  description: 'Galeria editorial e curadoria arquitetónica com reconhecimento multimodal Gemini de edifícios, coordenadas geográficas e cartografia interativa em tempo real.',
  openGraph: {
    title: 'ATELIER CALM — Galeria Arquitetónica & Mapeamento IA',
    description: 'Reconhecimento inteligente de fotografias arquitetónicas, localização e marcação cartográfica com curadoria mineral.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ATELIER CALM — Galeria Arquitetónica & Mapeamento IA',
    description: 'Reconhecimento inteligente de fotografias arquitetónicas e mapeamento cartográfico.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt" className="scroll-smooth" suppressHydrationWarning>
      <body suppressHydrationWarning className="bg-[#fbf9f5] text-[#1c1917] antialiased selection:bg-[#8c6239]/20 selection:text-[#1c1917]">
        {children}
      </body>
    </html>
  );
}
