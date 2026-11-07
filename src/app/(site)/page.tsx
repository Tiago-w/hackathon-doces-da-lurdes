import type { Metadata } from 'next';
import Link from 'next/link';
import { listarBairros, listarCatalogo, obterConfigPublica } from './_dados';
import type { Bairro } from '@/lib/contrato';
import { formatarReais } from '@/lib/dinheiro';
import { linkWhatsapp } from '@/lib/whatsapp';
import { CartaoVitrine } from '@/components/site/CartaoVitrine';
import { botaoPrincipal, botaoSecundario, botaoWhatsapp, cartao, titulo } from '@/components/site/estilos';
import { IconeCaixa, IconeCasa, IconeEntrega, IconeFesta, IconePix, IconeWhatsapp } from '@/components/site/icones';

export const metadata: Metadata = {
  title: { absolute: 'Doces da Lurdes · Doces de Pelotas feitos em casa' },
  description:
    'Doces tradicionais de Pelotas feitos em casa há 18 anos: quindim, camafeu, bem-casado, pastel de Santa Clara. Caixa de 50 doces com sabores à escolha, doces para festa e entrega em Pelotas.',
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
  const [produtos, bairros, config] = await Promise.all([listarCatalogo(), listarBairros(), obterConfigPublica()]);
  const zonas = zonasDe(bairros);
  const corte = config.horarioCorteMesmoDia.replace(':00', 'h');
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Bakery',
    name: 'Doces da Lurdes',
    description: 'Doces tradicionais de Pelotas feitos em casa há 18 anos.',
    url: site,
    telephone: `+55${config.whatsappLoja}`,
    priceRange: '$',
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

      {/* Abertura */}
      <section className="relative overflow-hidden border-b border-borda bg-[radial-gradient(circle_at_85%_20%,var(--color-doce-de-leite)_0,transparent_45%),radial-gradient(circle_at_10%_90%,#f6dfb5_0,transparent_40%)]">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:py-16">
          <p className="text-lg font-bold uppercase tracking-wide text-caramelo">Pelotas, Capital Nacional do Doce</p>
          <h1 className={`${titulo} mt-2 text-5xl leading-tight sm:text-6xl`}>Doces da Lurdes</h1>
          <p className="mt-4 max-w-xl text-xl sm:text-2xl">
            Há 18 anos a dona Lurdes faz doce em casa, do jeito de sempre: quindim brilhante, camafeu com noz, bem-casado no papel.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/pedido" className={`${botaoPrincipal} text-xl`}>
              Fazer pedido
            </Link>
            <a href="#doces" className={botaoSecundario}>
              Ver os doces
            </a>
          </div>
        </div>
      </section>

      {/* Caixa de 50 */}
      <section aria-labelledby="titulo-caixa" className="mx-auto max-w-5xl px-4 pt-12">
        <div className="flex flex-col gap-5 rounded-3xl border-2 border-caramelo bg-doce-de-leite/35 p-6 sm:flex-row sm:items-center sm:p-8">
          <span className="flex size-20 shrink-0 items-center justify-center rounded-3xl bg-papel text-caramelo">
            <IconeCaixa className="size-12" />
          </span>
          <div className="flex-1">
            <p className="text-lg font-bold text-caramelo">A mais pedida</p>
            <h2 id="titulo-caixa" className={`${titulo} text-3xl`}>
              Caixa de 50 doces
            </h2>
            <p className="mt-1 text-lg">Você escolhe os sabores e a quantidade de cada um. Encomende com {config.antecedenciaDiasCaixaFesta} dias.</p>
            <p className="mt-2 text-3xl font-bold">{formatarReais(config.precoCaixa50Centavos)}</p>
          </div>
          <Link href="/pedido/caixa" className={botaoPrincipal}>
            Montar minha caixa
          </Link>
        </div>
      </section>

      {/* Vitrine */}
      <section id="doces" aria-labelledby="titulo-doces" className="mx-auto max-w-5xl scroll-mt-4 px-4 pt-14">
        <h2 id="titulo-doces" className={`${titulo} text-3xl sm:text-4xl`}>
          Nossos doces
        </h2>
        <p className="mt-2 text-lg text-chocolate-suave">Preço de cada doce avulso. Na Caixa de 50, o preço é o da caixa.</p>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {produtos.map((p, i) => (
            <li key={p.id}>
              <CartaoVitrine produto={p} prioridade={i < 2} />
            </li>
          ))}
        </ul>
        <div className="mt-6 flex justify-center">
          <Link href="/pedido" className={botaoPrincipal}>
            Escolher meus doces
          </Link>
        </div>
      </section>

      {/* Como funciona */}
      <section aria-labelledby="titulo-como" className="mx-auto max-w-5xl px-4 pt-14">
        <h2 id="titulo-como" className={`${titulo} text-3xl sm:text-4xl`}>
          Como funciona
        </h2>
        <ol className="mt-6 grid gap-4 sm:grid-cols-3">
          {[
            { n: 1, icone: <IconeCaixa className="size-8" />, nome: 'Escolha', texto: 'Monte a Caixa de 50 ou escolha poucos doces.' },
            { n: 2, icone: <IconePix className="size-8" />, nome: 'Pague no Pix', texto: 'O código aparece na tela. É só copiar e colar no banco.' },
            { n: 3, icone: <IconeEntrega className="size-8" />, nome: 'Retire ou receba', texto: 'Busque no Centro ou receba em casa.' },
          ].map((p) => (
            <li key={p.n} className={cartao}>
              <span className="flex items-center gap-3 text-caramelo">
                <span className="flex size-12 items-center justify-center rounded-full bg-caramelo text-xl font-bold text-white">{p.n}</span>
                {p.icone}
              </span>
              <h3 className="mt-3 text-xl font-bold">{p.nome}</h3>
              <p className="mt-1 text-lg text-chocolate-suave">{p.texto}</p>
            </li>
          ))}
        </ol>
        <ul className="mt-5 space-y-2 text-lg">
          <li>
            <strong>Pedidos pequenos</strong> podem sair no mesmo dia (pedindo até as {corte}).
          </li>
          <li>
            <strong>Caixa de 50 e festas:</strong> com {config.antecedenciaDiasCaixaFesta} dias de antecedência.
          </li>
        </ul>
      </section>

      {/* Entrega */}
      <section aria-labelledby="titulo-entrega" className="mx-auto max-w-5xl px-4 pt-14">
        <h2 id="titulo-entrega" className={`${titulo} text-3xl sm:text-4xl`}>
          Retirada e entrega
        </h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className={cartao}>
            <h3 className="flex items-center gap-2 text-xl font-bold">
              <IconeCasa className="size-7 text-caramelo" /> Retirada grátis
            </h3>
            <p className="mt-2 text-lg">{config.enderecoRetirada}.</p>
          </div>
          <div className={cartao}>
            <h3 className="flex items-center gap-2 text-xl font-bold">
              <IconeEntrega className="size-7 text-caramelo" /> Entrega em Pelotas
            </h3>
            <p className="mt-2 text-lg">
              Taxa fixa por bairro. <strong>Frete grátis</strong> acima de {formatarReais(config.freteCortesiaAcimaCentavos)}.
            </p>
            <ul className="mt-3 space-y-3">
              {zonas.map(([zona, z]) => (
                <li key={zona} className="border-t border-borda pt-3">
                  <p className="flex justify-between text-lg font-bold">
                    <span>Zona {zona}</span>
                    <span>{formatarReais(z.frete)}</span>
                  </p>
                  <p className="text-base text-chocolate-suave">{z.nomes.join(', ')}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Festas */}
      <section aria-labelledby="titulo-festas" className="mx-auto max-w-5xl px-4 pt-14">
        <div className="flex flex-col gap-5 rounded-3xl bg-chocolate p-6 text-creme sm:flex-row sm:items-center sm:p-8">
          <IconeFesta className="size-14 shrink-0 text-doce-de-leite" />
          <div className="flex-1">
            <h2 id="titulo-festas" className="font-titulo text-3xl font-bold">
              Doces para festa
            </h2>
            <p className="mt-2 text-lg">
              Casamento, aniversário, formatura ou evento da empresa. Conte o que você precisa e a gente manda o orçamento no WhatsApp.
            </p>
          </div>
          <Link
            href="/pedido/festa"
            className="inline-flex min-h-14 items-center justify-center rounded-2xl bg-doce-de-leite px-6 text-lg font-bold text-chocolate hover:bg-[#f0c88c]"
          >
            Pedir orçamento
          </Link>
        </div>
      </section>

      {/* WhatsApp */}
      <section aria-labelledby="titulo-whats" className="mx-auto max-w-5xl px-4 pt-14 text-center">
        <h2 id="titulo-whats" className={`${titulo} text-3xl`}>
          Prefere conversar?
        </h2>
        <p className="mt-2 text-lg">Chame no WhatsApp. A dona Lurdes ou o neto respondem.</p>
        <a
          href={linkWhatsapp(config.whatsappLoja, 'Oi! Vim pelo site e queria saber dos doces.')}
          target="_blank"
          rel="noopener noreferrer"
          className={`${botaoWhatsapp} mt-5`}
        >
          <IconeWhatsapp /> Falar no WhatsApp
        </a>
      </section>
    </main>
  );
}
