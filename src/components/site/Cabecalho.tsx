import Link from 'next/link';
import { linkWhatsapp } from '@/lib/whatsapp';
import { IconeWhatsapp } from './icones';

export function Cabecalho({ whatsappLoja }: { whatsappLoja: string }) {
  return (
    <header className="border-b border-borda bg-papel">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 py-3">
        <Link href="/" className="flex min-h-12 items-center rounded-lg font-titulo text-2xl font-bold text-chocolate">
          Doces da Lurdes
        </Link>
        <nav aria-label="Principal" className="flex items-center gap-2">
          <Link
            href="/pedido"
            className="inline-flex min-h-12 items-center rounded-xl bg-caramelo px-4 text-base font-bold text-white hover:bg-caramelo-escuro"
          >
            Fazer pedido
          </Link>
          <a
            href={linkWhatsapp(whatsappLoja, 'Oi! Vim pelo site da Doces da Lurdes.')}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-12 items-center gap-1.5 rounded-xl border-2 border-sucesso px-3 text-base font-bold text-sucesso hover:bg-sucesso-fundo"
          >
            <IconeWhatsapp className="size-5" />
            WhatsApp
            <span className="sr-only">(abre o WhatsApp)</span>
          </a>
        </nav>
      </div>
    </header>
  );
}
