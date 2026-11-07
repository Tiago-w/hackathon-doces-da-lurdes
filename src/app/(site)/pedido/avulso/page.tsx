import type { Metadata } from 'next';
import Link from 'next/link';
import { calcularPedido, listarCatalogo, obterConfigPublica } from '../../_dados';
import { MontadorAvulso } from '@/components/site/MontadorAvulso';
import { titulo } from '@/components/site/estilos';
import { IconeVoltar } from '@/components/site/icones';

export const metadata: Metadata = {
  title: 'Doces avulsos para hoje',
  description: 'Peça poucos doces de Pelotas, com entrega no mesmo dia para pedidos feitos até o meio da tarde.',
};

export default async function PaginaAvulso() {
  const [produtos, config, calculo] = await Promise.all([
    listarCatalogo(),
    obterConfigPublica(),
    calcularPedido({ tipo: 'AVULSO' }),
  ]);
  return (
    <main className="mx-auto max-w-2xl px-4 pb-64 pt-6">
      <Link href="/pedido" className="inline-flex min-h-12 items-center gap-2 font-bold text-caramelo">
        <IconeVoltar className="size-5" /> Voltar
      </Link>
      <h1 className={`${titulo} mt-2 text-3xl sm:text-4xl`}>Escolha seus doces</h1>
      <p className="mb-5 mt-2 text-lg">Até 49 doces, pelo preço de cada um.</p>
      <h2 className="sr-only">Sabores</h2>
      <MontadorAvulso
        produtos={produtos}
        podeSairHoje={calculo.datasPermitidas[0]?.mesmoDia ?? false}
        horarioCorte={config.horarioCorteMesmoDia}
      />
    </main>
  );
}
