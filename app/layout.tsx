import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/lib/auth-context';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  metadataBase: new URL('https://zerocap.app'),
  title: 'ZeroCap — Trustless Freelance Delivery',
  description:
    'ZeroCap protects creators from clients receiving final work without paying. Protected previews, UPI payments, and trustless delivery.',
  openGraph: {
    title: 'ZeroCap — Trustless Freelance Delivery',
    description: 'Protected previews. Verified payments. Trustless delivery.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
