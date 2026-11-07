import type { Metadata, Viewport } from 'next';
import './globals.css';

// Layout raiz: compartilhado. Cabeçalho e rodapé do site ficam em src/app/(site)/layout.tsx (Dev 2);
// o layout do painel fica em src/app/painel/layout.tsx (Dev 3).

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: {
    default: 'Doces da Lurdes · Doces artesanais de Pelotas',
    template: '%s · Doces da Lurdes',
  },
  description:
    'Doces tradicionais de Pelotas feitos em casa há 18 anos. Monte sua Caixa de 50, peça doces avulsos ou encomende para a sua festa.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // Não usar maximumScale/userScalable: quem enxerga mal precisa poder dar zoom.
  themeColor: '#8a4512',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
