import type { Metadata } from 'next';
import './globals.css';
import Providers from '@/components/providers/QueryProvider';

export const metadata: Metadata = {
  title: 'ProofHire 2.0 – Evidence-Based Talent Intelligence',
  description: 'Evidence-Based Talent Intelligence and Placement Ecosystem',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-bg text-ink antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
