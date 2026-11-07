import type { Metadata } from 'next';
import Link from 'next/link';
import { listarCatalogo, obterConfigPublica } from '../../_dados';
import { formatarReais } from '@/lib/dinheiro';
import { MontadorCaixa } from '@/components/site/MontadorCaixa';
import { titulo } from '@/components/site/estilos';
import { IconeVoltar } from '@/components/site/icones';

export const metadata: Metadata = {
  title: 'Monte sua Caixa de 50 doces',
  description: 'Caixa de doces de Pelotas com 50 unidades e sabores à escolha: quindim, camafeu, bem-casado, pastel de Santa Clara e mais.',
};

export default async function PaginaCaixa() {
  const [produtos, config] = await Promise.all([listarCatalogo(), obterConfigPublica()]);
  return (
    <main className="mx-auto max-w-2xl px-4 pb-72 pt-6">
      <Link href="/pedido" className="inline-flex min-h-12 items-center gap-2 font-bold text-caramelo">
        <IconeVoltar className="size-5" /> Voltar
      </Link>
      <h1 className={`${titulo} mt-2 text-3xl sm:text-4xl`}>Monte sua Caixa de 50</h1>
      <p className="mt-2 text-lg">
        Escolha os sabores até completar <strong>50 doces</strong>. A caixa custa{' '}
        <strong>{formatarReais(config.precoCaixa50Centavos)}</strong>, com qualquer combinação.
      </p>
      <p className="mt-1 text-lg text-chocolate-suave">Encomende com {config.antecedenciaDiasCaixaFesta} dias de antecedência.</p>
      <h2 className="sr-only">Sabores</h2>
      <div className="mt-6">
        <MontadorCaixa produtos={produtos} precoCaixaCentavos={config.precoCaixa50Centavos} />
      </div>
    </main>
  );
}
