import type { Metadata } from 'next';
import Link from 'next/link';
import { obterConfigPublica } from '../_dados';
import { formatarReais } from '@/lib/dinheiro';
import { IconeCaixa, IconeDoce, IconeFesta, IconeSeta } from '@/components/site/icones';
import { selo, titulo } from '@/components/site/estilos';

export const metadata: Metadata = {
  title: 'Fazer pedido',
  description: 'Peça doces de Pelotas da Doces da Lurdes: poucos doces para hoje, Caixa de 50 com sabores à escolha ou orçamento para festa.',
};

export default async function PaginaPedido() {
  const config = await obterConfigPublica();
  const corte = config.horarioCorteMesmoDia.replace(':00', 'h');

  const caminhos = [
    {
      href: '/pedido/caixa',
      icone: <IconeCaixa className="size-8" />,
      etiqueta: 'Mais pedida · Preço fechado',
      nome: 'Caixa de 50 doces',
      texto: `Escolha exatamente 50 doces combinando os sabores tradicionais como preferir. Encomenda com ${config.antecedenciaDiasCaixaFesta} dias de antecedência.`,
      extra: `${formatarReais(config.precoCaixa50Centavos)} a caixa completa`,
      destaque: true,
    },
    {
      href: '/pedido/avulso',
      icone: <IconeDoce className="size-8" />,
      etiqueta: `Pronta entrega · Mesmo dia até ${corte}`,
      nome: 'Doces avulsos (1 a 49 unidades)',
      texto: 'Ideal para saborear hoje ou montar uma lembrança menor. Preço calculado por unidade de cada sabor.',
      extra: 'A partir de R$ 4,00 a unidade',
      destaque: false,
    },
    {
      href: '/pedido/festa',
      icone: <IconeFesta className="size-8" />,
      etiqueta: 'Eventos & Comemorações',
      nome: 'Orçamento para festa ou casamento',
      texto: 'Para pedidos acima de 100 doces, casamentos, formaturas ou eventos corporativos. Atendimento direto com a dona Lurdes.',
      extra: 'Orçamento personalizado via WhatsApp',
      destaque: false,
    },
  ];

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="mb-8">
        <span className={selo}>Encomendas Online</span>
        <h1 className={`${titulo} mt-3 text-3xl sm:text-4xl`}>Como você prefere pedir hoje?</h1>
        <p className="mt-2 text-base text-chocolate-suave sm:text-lg">
          Selecione a modalidade ideal para a sua ocasião. O pagamento via Pix e a escolha de entrega são feitos na próxima etapa.
        </p>
      </div>

      <ul className="flex flex-col gap-4">
        {caminhos.map((c) => (
          <li key={c.href}>
            <Link
              href={c.href}
              className={`group flex flex-col justify-between gap-4 rounded-2xl border p-6 transition-all sm:flex-row sm:items-center ${
                c.destaque
                  ? 'border-2 border-caramelo bg-gradient-to-r from-doce-de-leite/35 via-papel to-papel shadow-sm hover:shadow-md'
                  : 'border-borda bg-papel hover:border-caramelo hover:shadow-sm'
              }`}
            >
              <div className="flex items-start gap-4">
                <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl border border-borda/70 bg-creme text-caramelo">
                  {c.icone}
                </span>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-caramelo">{c.etiqueta}</span>
                  <span className="mt-0.5 block font-titulo text-2xl font-bold text-chocolate">{c.nome}</span>
                  <span className="mt-1.5 block text-sm leading-relaxed text-chocolate-suave sm:text-base">{c.texto}</span>
                  {c.extra && <span className="mt-2 inline-block text-sm font-bold text-chocolate">{c.extra}</span>}
                </div>
              </div>
              <span className="inline-flex size-10 shrink-0 items-center justify-center self-end rounded-xl bg-creme text-caramelo transition-transform group-hover:translate-x-1 sm:self-center">
                <IconeSeta className="size-5" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
