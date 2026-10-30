import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';
import { LanguageProvider } from '@/components/layout/LanguageContext';

export const metadata: Metadata = {
  title: 'PromptWars x Astra | Smart Municipal Issue Triage & Dispatch',
  description:
    'AI-powered civic issue triage and dispatch platform with transparent deterministic priority scoring, deduplication, and hotspot clustering.',
  keywords: [
    'Civic Issue Reporting',
    'Municipal Triage',
    'Smart City',
    'Deduplication',
    'Pothole Reporting',
    'Gemini AI',
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <LanguageProvider>
          {/* Accessibility: Skip Navigation Link */}
          <a href="#main-content" className="skip-link">
            Skip to main content
          </a>

          {/* Persistent Accessible Header */}
          <Navbar />

          {/* Main Application Landmark */}
          <main id="main-content" tabIndex={-1} style={{ flex: 1 }}>
            {children}
          </main>

          {/* Semantic Footer */}
          <footer
            style={{
              borderTop: '1px solid var(--border-subtle)',
              padding: '2rem 0',
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: '0.85rem',
              backgroundColor: 'rgba(11, 15, 25, 0.95)',
            }}
          >
            <div className="container">
              <p>© 2026 PromptWars x Astra. Smart Municipal Issue Triage Platform.</p>
              <p style={{ marginTop: '0.5rem', fontSize: '0.75rem', opacity: 0.7 }}>
                WCAG 2.1 AA Compliant | Built with Next.js, Prisma SQLite, & Gemini 1.5 Flash
              </p>
            </div>
          </footer>
        </LanguageProvider>
      </body>
    </html>
  );
}
