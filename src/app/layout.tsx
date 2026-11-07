import type { Metadata, Viewport } from 'next';
import { Fraunces, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const fonteTitulo = Fraunces({
  subsets: ['latin'],
  variable: '--font-editorial',
  display: 'swap',
  weight: ['600', '700'],
});

const fonteTexto = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: {
    default: 'Doces da Lurdes · Confeitaria Tradicional de Pelotas',
    template: '%s · Doces da Lurdes',
  },
  description:
    'Doces tradicionais de Pelotas feitos à mão há 18 anos pela Dona Lurdes. Monte sua Caixa de 50 doces, peça doces avulsos para o mesmo dia ou solicite orçamento para festas e casamentos.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#3b2416',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${fonteTitulo.variable} ${fonteTexto.variable}`}>
      <body className="min-h-dvh antialiased selection:bg-doce-de-leite/60 selection:text-chocolate">
        {children}
      </body>
    </html>
  );
}
