import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI@IM Events — Codegen Greenhouse Field Visit',
  description: 'Register for the AI@IM Club field visit to the Codegen greenhouse.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const saved = localStorage.getItem('theme');
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (saved === 'dark' || (!saved && prefersDark)) {
                  document.documentElement.classList.add('dark');
                }
              } catch {}
            `,
          }}
        />
      </head>
      <body>
        <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
          {children}
        </div>
      </body>
    </html>
  );
}
