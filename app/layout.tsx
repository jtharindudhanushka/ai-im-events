import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI@IM Events — Codegen Greenhouse Field Visit',
  description: 'Register for the AI@IM Club field visit to the Codegen greenhouse.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="relative z-10 min-h-screen">{children}</div>
      </body>
    </html>
  );
}
