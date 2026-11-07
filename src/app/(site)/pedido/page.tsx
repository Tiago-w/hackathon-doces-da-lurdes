import type { Metadata } from 'next';
import Link from 'next/link';
import { obterConfigPublica } from '../_dados';
import { formatarReais } from '@/lib/dinheiro';
import { IconeCaixa, IconeDoce, IconeFesta, IconeSeta } from '@/components/site/icones';
import { titulo } from '@/components/site/estilos';

export const metadata: Metadata = {
  title: 'Fazer pedido',
  description: 'Peça doces de Pelotas da Doces da Lurdes: poucos doces para hoje, Caixa de 50 com sabores à escolha ou orçamento para festa.',
};

export default async function PaginaPedido() {
  const config = await obterConfigPublica();
  const caminhos = [
    {
      href: '/pedido/avulso',
      icone: <IconeDoce className="size-10" />,
      nome: 'Poucos doces',
      texto: 'Menos de 50. Pode sair no mesmo dia.',
    },
    {
      href: '/pedido/caixa',
      icone: <IconeCaixa className="size-10" />,
      nome: 'Caixa de 50',
      texto: `Você escolhe os sabores. Encomende com ${config.antecedenciaDiasCaixaFesta} dias.`,
      extra: formatarReais(config.precoCaixa50Centavos),
      destaque: true,
    },
    {
      href: '/pedido/festa',
      icone: <IconeFesta className="size-10" />,
      nome: 'Festa ou pedido grande',
      texto: 'Peça um orçamento.',
    },
  ];

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className={`${titulo} text-3xl sm:text-4xl`}>O que você quer pedir?</h1>
      <p className="mt-2 text-chocolate-suave">Toque em uma das opções.</p>
      <ul className="mt-6 flex flex-col gap-4">
        {caminhos.map((c) => (
          <li key={c.href}>
            <Link
              href={c.href}
              className={`flex min-h-28 items-center gap-4 rounded-3xl border-2 p-5 transition-colors ${
                c.destaque ? 'border-caramelo bg-doce-de-leite/40 hover:bg-doce-de-leite/60' : 'border-borda bg-papel hover:border-caramelo'
              }`}
            >
              <span className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-creme text-caramelo">{c.icone}</span>
              <span className="flex-1">
                <span className="block text-2xl font-bold text-chocolate">{c.nome}</span>
                <span className="mt-1 block text-lg text-chocolate-suave">{c.texto}</span>
                {c.extra && <span className="mt-1 block text-lg font-bold text-chocolate">{c.extra} a caixa</span>}
              </span>
              <IconeSeta className="size-7 shrink-0 text-caramelo" />
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
