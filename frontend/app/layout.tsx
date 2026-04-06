import type { Metadata } from 'next';
import { AudioProvider } from '@/lib/AudioContext';
import './globals.css';

export const metadata: Metadata = {
  title: 'AMARAN',
  description: 'Enhance • Analyze • Understand — AI-powered speech processing with advanced noise reduction and emotion detection',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-primary-black text-accent-beige noise-bg">
        <AudioProvider>
          <div className="relative z-10">
            {children}
          </div>
        </AudioProvider>
      </body>
    </html>
  );
}
