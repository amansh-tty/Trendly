import type { Metadata } from 'next';
import { Fraunces, Jost } from 'next/font/google';
import './globals.css';

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  style: ['normal', 'italic'],
  axes: ['SOFT', 'WONK'],
});

const jost = Jost({
  subsets: ['latin'],
  variable: '--font-jost',
  weight: ['300', '400', '500', '600'],
});

export const metadata: Metadata = {
  title: 'Trendly — Your AI Style Read',
  description: 'Upload any outfit. Get an instant AI style read.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${fraunces.variable} ${jost.variable}`}>
      <body className="font-jost bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
