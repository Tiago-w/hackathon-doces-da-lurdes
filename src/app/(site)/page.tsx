import type { Metadata } from 'next';
import Link from 'next/link';
import { listarBairros, listarCalendario, listarCatalogo, obterConfigPublica } from './_dados';
import type { Bairro } from '@/lib/contrato';
import { hojeEmPelotas } from '@/lib/datas';
import { formatarReais } from '@/lib/dinheiro';
import { linkWhatsapp } from '@/lib/whatsapp';
import { CalendarioPublico } from '@/components/site/CalendarioPublico';
import { CartaoVitrine } from '@/components/site/CartaoVitrine';
import { FotoSabor } from '@/components/site/FotoSabor';
import { botaoPrincipal, botaoSecundario, botaoWhatsapp, cartao, selo, titulo } from '@/components/site/estilos';
import { IconeCaixa, IconeCasa, IconeCheck, IconeEntrega, IconeFesta, IconePix, IconeSeta, IconeWhatsapp } from '@/components/site/icones';

export const metadata: Metadata = {
  title: { absolute: 'Doces da Lurdes · Confeitaria Tradicional de Pelotas' },
  description:
    'Doces tradicionais de Pelotas feitos artesanalmente há 18 anos: quindim de gema pura, camafeu de nozes, bem-casado e pastel de Santa Clara. Monte sua Caixa de 50 doces ou peça avulsos com entrega em Pelotas.',
  keywords: ['doces de Pelotas', 'caixa de doces Pelotas', 'doces para festa Pelotas', 'doces finos Pelotas', 'quindim', 'camafeu'],
  alternates: { canonical: '/' },
};

function zonasDe(bairros: Bairro[]) {
  const zonas = new Map<number, { frete: number; nomes: string[] }>();
  for (const b of bairros) {
    const z = zonas.get(b.zona) ?? { frete: b.freteCentavos, nomes: [] };
    z.nomes.push(b.nome);
    z.frete = Math.min(z.frete, b.freteCentavos);
    zonas.set(b.zona, z);
  }
  return [...zonas.entries()].sort(([a], [b]) => a - b);
}

export default async function Home() {
  const [produtos, bairros, config, calendario] = await Promise.all([
    listarCatalogo(),
    listarBairros(),
    obterConfigPublica(),
    listarCalendario(),
  ]);
  const hoje = hojeEmPelotas();
  const zonas = zonasDe(bairros);
  const corte = config.horarioCorteMesmoDia.replace(':00', 'h');
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const destaquesHero = produtos.slice(0, 6);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Bakery',
    name: 'Doces da Lurdes',
    description: 'Doces tradicionais de Pelotas feitos em casa há 18 anos.',
    url: site,
    telephone: `+55${config.whatsappLoja}`,
    priceRange: '$$',
    servesCuisine: 'Doces tradicionais de Pelotas',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Centro',
      addressLocality: 'Pelotas',
      addressRegion: 'RS',
      addressCountry: 'BR',
    },
    areaServed: { '@type': 'City', name: 'Pelotas' },
    paymentAccepted: 'Pix',
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />

      {/* Hero Editorial */}
      <section className="relative overflow-hidden border-b border-borda/80 bg-[radial-gradient(circle_at_88%_15%,rgba(239,212,168,0.55)_0,transparent_48%),radial-gradient(circle_at_8%_88%,rgba(246,223,181,0.45)_0,transparent_42%)]">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-12 lg:gap-12 lg:py-20">
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-caramelo/25 bg-papel/90 px-3.5 py-1.5 text-xs font-bold uppercase tracking-widest text-caramelo shadow-2xs">
              <span className="size-2 rounded-full bg-caramelo" aria-hidden="true" />
              Patrimônio Doceiro de Pelotas · Desde 2008
            </div>

            <h1 className={`${titulo} mt-5 text-4xl leading-[1.08] sm:text-5xl lg:text-6xl`}>
              A doçaria clássica de Pelotas, feita à mão no tacho de cobre.
            </h1>

            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-chocolate-suave sm:text-xl">
              Há 18 anos a dona Lurdes prepara os doces tradicionais da nossa terra com gemas frescas, nozes selecionadas e ponto de calda exato — do quindim espelhado ao camafeu glaceado.
            </p>

            <div className="mt-8 flex flex-col gap-3.5 sm:flex-row sm:items-center">
              <Link href="/pedido/caixa" className={`${botaoPrincipal} text-base sm:text-lg`}>
                <IconeCaixa className="size-5" />
                Montar Caixa de 50 ({formatarReais(config.precoCaixa50Centavos)})
              </Link>
              <Link href="/pedido/avulso" className={`${botaoSecundario} text-base sm:text-lg`}>
                Pedir doces avulsos para hoje
              </Link>
            </div>

            <dl className="mt-10 grid grid-cols-3 gap-4 border-t border-borda/80 pt-6">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-chocolate-suave">Produção</dt>
                <dd className="mt-1 font-titulo text-xl font-bold text-chocolate sm:text-2xl">100% Artesanal</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-chocolate-suave">Pronta Entrega</dt>
                <dd className="mt-1 font-titulo text-xl font-bold text-chocolate sm:text-2xl">Mesmo dia até {corte}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-chocolate-suave">Pagamento</dt>
                <dd className="mt-1 font-titulo text-xl font-bold text-chocolate sm:text-2xl">Pix Copia e Cola</dd>
              </div>
            </dl>
          </div>

          {/* Vitrine Visual da Caixa Tradicional */}
          <div className="lg:col-span-5">
            <div className="relative rounded-3xl border border-borda bg-papel p-6 shadow-[0_24px_60px_-15px_rgba(44,24,16,0.12)] sm:p-7">
              <div className="flex items-center justify-between gap-4 border-b border-borda/70 pb-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-caramelo">Especialidade da Casa</span>
                  <h2 className="font-titulo text-2xl font-bold text-chocolate">Caixa Tradicional · 50 Doces</h2>
                </div>
                <span className="rounded-2xl bg-doce-de-leite/60 px-3.5 py-2 font-titulo text-xl font-bold text-chocolate">
                  {formatarReais(config.precoCaixa50Centavos)}
                </span>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-3">
                {destaquesHero.map((doce) => (
                  <div
                    key={doce.id}
                    className="group flex flex-col items-center rounded-2xl border border-borda/60 bg-creme/50 p-2.5 text-center transition-colors hover:border-caramelo/40 hover:bg-creme"
                  >
                    <FotoSabor
                      nome={doce.nome}
                      fotoUrl={doce.fotoUrl}
                      sizes="110px"
                      className="aspect-square w-full rounded-xl"
                    />
                    <span className="mt-2 line-clamp-1 text-xs font-bold text-chocolate">{doce.nome}</span>
                  </div>
                ))}
              </div>

              <ul className="mt-5 space-y-2 text-sm text-chocolate-suave">
                <li className="flex items-center gap-2">
                  <span className="flex size-5 items-center justify-center rounded-full bg-sucesso-fundo text-sucesso">
                    <IconeCheck className="size-3.5" />
                  </span>
                  Combine livremente entre os {produtos.length} sabores do cardápio
                </li>
                <li className="flex items-center gap-2">
                  <span className="flex size-5 items-center justify-center rounded-full bg-sucesso-fundo text-sucesso">
                    <IconeCheck className="size-3.5" />
                  </span>
                  Embalagem em forminhas plissadas pronta para servir ou presentear
                </li>
              </ul>

              <div className="mt-6 flex items-center justify-between gap-3 border-t border-borda/70 pt-4">
                <span className="text-xs font-medium text-chocolate-suave">
                  Encomendas com {config.antecedenciaDiasCaixaFesta} dias de antecedência
                </span>
                <Link
                  href="/pedido/caixa"
                  className="inline-flex items-center gap-1.5 text-sm font-bold text-caramelo hover:text-caramelo-escuro"
                >
                  Personalizar caixa
                  <IconeSeta className="size-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Banner das 3 Modalidades de Pedido */}
      <section aria-label="Modalidades de encomenda" className="mx-auto max-w-6xl px-4 pt-12 sm:px-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Link
            href="/pedido/avulso"
            className="group flex flex-col justify-between rounded-2xl border border-borda bg-papel p-6 transition-all hover:-translate-y-0.5 hover:border-caramelo hover:shadow-md"
          >
            <div>
              <span className={selo}>Pronta Entrega</span>
              <h2 className="mt-3 font-titulo text-2xl font-bold text-chocolate">Doces Avulsos (1 a 49 un.)</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-chocolate-suave">
                Perfeito para matar a vontade hoje. Pedidos confirmados até as {corte} podem ser retirados ou entregues no mesmo dia.
              </p>
            </div>
            <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-caramelo group-hover:translate-x-0.5 transition-transform">
              Escolher unidades <IconeSeta className="size-4" />
            </span>
          </Link>

          <Link
            href="/pedido/caixa"
            className="group relative flex flex-col justify-between rounded-2xl border-2 border-caramelo bg-gradient-to-br from-doce-de-leite/35 via-papel to-papel p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center rounded-full bg-caramelo px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
                  Mais Pedida
                </span>
                <span className="font-titulo text-xl font-bold text-caramelo">{formatarReais(config.precoCaixa50Centavos)}</span>
              </div>
              <h2 className="mt-3 font-titulo text-2xl font-bold text-chocolate">Caixa de 50 Doces</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-chocolate-suave">
                Monte sua seleção personalizada com 50 doces finos pelo valor fechado da caixa. Produção sob encomenda ({config.antecedenciaDiasCaixaFesta} dias).
              </p>
            </div>
            <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-caramelo group-hover:translate-x-0.5 transition-transform">
              Abrir montador de 50 doces <IconeSeta className="size-4" />
            </span>
          </Link>

          <Link
            href="/pedido/festa"
            className="group flex flex-col justify-between rounded-2xl border border-borda bg-papel p-6 transition-all hover:-translate-y-0.5 hover:border-caramelo hover:shadow-md"
          >
            <div>
              <span className={selo}>Eventos & Celebrações</span>
              <h2 className="mt-3 font-titulo text-2xl font-bold text-chocolate">Casamentos & Festas</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-chocolate-suave">
                Mesa de doces completa para casamentos, formaturas e aniversários. Solicite um orçamento personalizado direto com a dona Lurdes.
              </p>
            </div>
            <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-caramelo group-hover:translate-x-0.5 transition-transform">
              Solicitar orçamento <IconeSeta className="size-4" />
            </span>
          </Link>
        </div>
      </section>

      {/* Vitrine de Sabores */}
      <section id="doces" aria-labelledby="titulo-doces" className="mx-auto max-w-6xl scroll-mt-20 px-4 pt-16 sm:px-6">
        <div className="flex flex-col justify-between gap-4 border-b border-borda/80 pb-6 sm:flex-row sm:items-end">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-caramelo">Cardápio Artesanal</span>
            <h2 id="titulo-doces" className={`${titulo} mt-1 text-3xl sm:text-4xl`}>
              Nossos doces tradicionais
            </h2>
            <p className="mt-2 max-w-2xl text-base text-chocolate-suave">
              Adicione unidades avulsas para hoje ou inclua direto na sua Caixa de 50 doces ({formatarReais(config.precoCaixa50Centavos)} a caixa completa).
            </p>
          </div>
          <Link href="/pedido/caixa" className={botaoSecundario}>
            <IconeCaixa className="size-5 text-caramelo" />
            Ir para o Montador da Caixa
          </Link>
        </div>

        <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {produtos.map((p, i) => (
            <li key={p.id}>
              <CartaoVitrine produto={p} prioridade={i < 3} />
            </li>
          ))}
        </ul>
      </section>

      {/* Calendário Público de Encomendas & Vagas (30 dias) */}
      <section id="calendario" aria-labelledby="titulo-calendario" className="mx-auto max-w-6xl scroll-mt-20 px-4 pt-16 sm:px-6">
        <CalendarioPublico
          calendario={calendario}
          hoje={hoje}
          antecedenciaDiasCaixa={config.antecedenciaDiasCaixaFesta}
        />
      </section>

      {/* Como funciona */}
      <section id="como-funciona" aria-labelledby="titulo-como" className="mx-auto max-w-6xl scroll-mt-20 px-4 pt-20 sm:px-6">
        <div className="rounded-3xl border border-borda bg-papel p-6 sm:p-10">
          <div className="max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-widest text-caramelo">Processo Simples & Transparente</span>
            <h2 id="titulo-como" className={`${titulo} mt-1 text-3xl sm:text-4xl`}>
              Do nosso tacho para a sua mesa em 3 passos
            </h2>
          </div>

          <ol className="mt-8 grid gap-6 md:grid-cols-3">
            {[
              {
                n: '01',
                icone: <IconeCaixa className="size-6" />,
                nome: 'Escolha seus sabores',
                texto: 'Monte sua Caixa de 50 doces com contador em tempo real ou selecione unidades avulsas para entrega rápida.',
              },
              {
                n: '02',
                icone: <IconePix className="size-6" />,
                nome: 'Agende e pague via Pix',
                texto: 'Escolha a data disponível na agenda da cozinha e pague com o código Pix Copia e Cola gerado na hora.',
              },
              {
                n: '03',
                icone: <IconeEntrega className="size-6" />,
                nome: 'Retire ou receba em casa',
                texto: 'Busque sem taxa no Centro de Pelotas ou receba no seu endereço com frete fixo por zona.',
              },
            ].map((p) => (
              <li key={p.n} className="relative rounded-2xl border border-borda/80 bg-creme/45 p-6">
                <div className="flex items-center justify-between text-caramelo">
                  <span className="flex size-11 items-center justify-center rounded-xl bg-papel border border-borda shadow-2xs">
                    {p.icone}
                  </span>
                  <span className="font-titulo text-2xl font-bold text-caramelo/45">{p.n}</span>
                </div>
                <h3 className="mt-4 font-titulo text-xl font-bold text-chocolate">{p.nome}</h3>
                <p className="mt-2 text-sm leading-relaxed text-chocolate-suave">{p.texto}</p>
              </li>
            ))}
          </ol>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-doce-de-leite/30 px-5 py-4 text-sm text-chocolate">
            <p>
              <strong>Regras da cozinha:</strong> Pedidos avulsos até 49 unidades saem no mesmo dia se pedidos até as <strong>{corte}</strong>. Caixas de 50 e festas requerem <strong>{config.antecedenciaDiasCaixaFesta} dias</strong> de antecedência.
            </p>
            <Link href="/pedido" className="font-bold text-caramelo underline underline-offset-4 hover:text-caramelo-escuro">
              Começar meu pedido →
            </Link>
          </div>
        </div>
      </section>

      {/* Entrega e Retirada */}
      <section id="entrega" aria-labelledby="titulo-entrega" className="mx-auto max-w-6xl scroll-mt-20 px-4 pt-16 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-12">
          <div className={`${cartao} flex flex-col justify-between lg:col-span-5`}>
            <div>
              <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-doce-de-leite/45 text-caramelo">
                <IconeCasa className="size-6" />
              </span>
              <h2 id="titulo-entrega" className={`${titulo} mt-4 text-2xl sm:text-3xl`}>
                Retirada gratuita no Centro
              </h2>
              <p className="mt-3 text-base leading-relaxed text-chocolate-suave">
                Prefere buscar pessoalmente e sentir o cheirinho de calda na cozinha? Você pode retirar seu pedido sem custo adicional.
              </p>
              <div className="mt-5 rounded-xl border border-borda bg-creme/60 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-caramelo">Endereço de referência</p>
                <p className="mt-1 text-base font-bold text-chocolate">{config.enderecoRetirada}</p>
                <p className="mt-1 text-xs text-chocolate-suave">O número exato e o contato direto são enviados na confirmação do pedido.</p>
              </div>
            </div>

            <div className="mt-6 border-t border-borda/70 pt-4 text-sm text-chocolate-suave">
              Frete cortesia em qualquer bairro para pedidos acima de <strong className="text-chocolate">{formatarReais(config.freteCortesiaAcimaCentavos)}</strong>.
            </div>
          </div>

          <div className={`${cartao} lg:col-span-7`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-doce-de-leite/45 text-caramelo">
                  <IconeEntrega className="size-6" />
                </span>
                <div>
                  <h3 className="font-titulo text-2xl font-bold text-chocolate">Taxas de entrega em Pelotas</h3>
                  <p className="text-sm text-chocolate-suave">Valor fixo calculado automaticamente pelo bairro selecionado</p>
                </div>
              </div>
              <span className="rounded-full bg-sucesso-fundo px-3 py-1 text-xs font-bold text-sucesso">
                Grátis acima de {formatarReais(config.freteCortesiaAcimaCentavos)}
              </span>
            </div>

            <ul className="mt-6 divide-y divide-borda/80">
              {zonas.map(([zona, z]) => (
                <li key={zona} className="flex flex-col justify-between gap-2 py-3.5 sm:flex-row sm:items-center">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-caramelo">Zona {zona}</span>
                    <p className="mt-0.5 text-sm font-medium text-chocolate">{z.nomes.join(' · ')}</p>
                  </div>
                  <span className="shrink-0 rounded-xl bg-creme px-3.5 py-1.5 font-titulo text-base font-bold text-chocolate border border-borda/70">
                    {formatarReais(z.frete)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Festas e Eventos */}
      <section aria-labelledby="titulo-festas" className="mx-auto max-w-6xl px-4 pt-16 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-chocolate px-6 py-10 text-creme shadow-lg sm:px-10 sm:py-12">
          <div className="relative z-10 flex flex-col justify-between gap-8 lg:flex-row lg:items-center">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full bg-doce-de-leite/20 px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-doce-de-leite">
                <IconeFesta className="size-4" />
                Encomendas Especiais
              </span>
              <h2 id="titulo-festas" className="mt-3 font-titulo text-3xl font-bold text-papel sm:text-4xl">
                Mesa de doces para casamentos, formaturas e aniversários
              </h2>
              <p className="mt-3 text-base leading-relaxed text-creme/85 sm:text-lg">
                Preparamos encomendas sob medida com degustação prévia, forminhas especiais e entrega programada para o seu evento em Pelotas e região.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:shrink-0">
              <Link
                href="/pedido/festa"
                className="inline-flex min-h-13 items-center justify-center gap-2 rounded-xl bg-doce-de-leite px-6 py-3.5 text-base font-bold text-chocolate transition-colors hover:bg-[#f2cfa0]"
              >
                Solicitar orçamento de festa
                <IconeSeta className="size-5" />
              </Link>
              <a
                href={linkWhatsapp(config.whatsappLoja, 'Olá! Gostaria de conversar sobre doces para um evento.')}
                target="_blank"
                rel="noopener noreferrer"
                className={botaoWhatsapp}
              >
                <IconeWhatsapp className="size-5" />
                Falar no WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
