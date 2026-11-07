'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { linkWhatsapp } from '@/lib/whatsapp';
import { totalUnidades, useCarrinho } from './carrinho';
import { IconeCaixa, IconeWhatsapp } from './icones';

export function Cabecalho({ whatsappLoja }: { whatsappLoja: string }) {
  const pathname = usePathname();
  const { caixa, avulso, pronto } = useCarrinho();

  const qtdCaixa = pronto ? totalUnidades(caixa) : 0;
  const qtdAvulso = pronto ? totalUnidades(avulso) : 0;
  const totalSacola = qtdCaixa + qtdAvulso;
  const linkSacola =
    qtdCaixa > 0 ? '/pedido/caixa' : qtdAvulso > 0 ? '/pedido/avulso' : '/pedido';

  const links = [
    { href: '/#doces', rotulo: 'Cardápio' },
    { href: '/pedido/caixa', rotulo: 'Caixa de 50' },
    { href: '/pedido/avulso', rotulo: 'Avulsos (Hoje)' },
    { href: '/pedido/festa', rotulo: 'Festas & Eventos' },
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-borda/80 bg-papel/95 backdrop-blur-md">
      {/* Faixa editorial superior */}
      <div className="bg-chocolate text-creme/95 text-xs sm:text-sm">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-2">
          <p className="font-medium tracking-wide">
            <span className="font-bold text-doce-de-leite">Pelotas · RS</span> — Confeitaria artesanal feita à mão há 18 anos
          </p>
          <p className="hidden md:block text-creme/80">
            Pedidos avulsos até 14h saem no mesmo dia · Retirada grátis no Centro
          </p>
        </div>
      </div>

      {/* Barra principal */}
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-3.5">
        <Link
          href="/"
          className="group flex items-center gap-3 rounded-xl focus:outline-none"
        >
          <span
            aria-hidden="true"
            className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-caramelo/30 bg-creme font-titulo text-lg font-bold text-caramelo shadow-xs transition-colors group-hover:bg-doce-de-leite/40"
          >
            DL
          </span>
          <div>
            <span className="block font-titulo text-2xl font-bold leading-none tracking-tight text-chocolate">
              Doces da Lurdes
            </span>
            <span className="mt-0.5 block text-xs font-semibold uppercase tracking-widest text-chocolate-suave">
              Tradição de Pelotas · Desde 2008
            </span>
          </div>
        </Link>

        {/* Navegação central em telas médias/grandes */}
        <nav aria-label="Menu principal" className="hidden lg:flex items-center gap-1">
          {links.map((item) => {
            const ativo = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-xl px-3.5 py-2 text-base font-semibold transition-colors ${
                  ativo
                    ? 'bg-doce-de-leite/50 text-chocolate'
                    : 'text-chocolate-suave hover:bg-creme hover:text-chocolate'
                }`}
              >
                {item.rotulo}
              </Link>
            );
          })}
        </nav>

        {/* Ações à direita */}
        <div className="flex items-center gap-2.5">
          <a
            href={linkWhatsapp(whatsappLoja, 'Oi! Vim pelo site da Doces da Lurdes.')}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-sucesso/40 bg-sucesso-fundo/60 px-3.5 py-2 text-sm sm:text-base font-bold text-sucesso transition-colors hover:bg-sucesso-fundo"
          >
            <IconeWhatsapp className="size-5 shrink-0" />
            <span className="hidden sm:inline">WhatsApp</span>
            <span className="sr-only">(abre conversa no WhatsApp)</span>
          </a>

          <Link
            href={linkSacola}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-caramelo px-4 py-2 text-sm sm:text-base font-bold text-white shadow-xs transition-all hover:bg-caramelo-escuro"
          >
            <IconeCaixa className="size-5 shrink-0" />
            <span>{totalSacola > 0 ? 'Meu pedido' : 'Fazer pedido'}</span>
            {totalSacola > 0 && (
              <span className="ml-0.5 inline-flex min-w-6 items-center justify-center rounded-full bg-papel px-1.5 py-0.5 text-xs font-extrabold text-caramelo tabular-nums">
                {totalSacola}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
