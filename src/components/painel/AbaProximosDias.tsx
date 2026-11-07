'use client';

import type { DataISO, PedidoResumo, StatusPedido } from '@/lib/contrato';
import { CartaoPedido, type DesfazerStatusPedido } from './CartaoPedido';
import { formatarTituloDiaProximo } from './mensagens';

interface PropriedadesAbaProximosDias {
  pedidosFuturos: PedidoResumo[];
  hoje: DataISO;
  idsNaoVistos: ReadonlySet<string>;
  desfazerPorPedido: Record<string, DesfazerStatusPedido>;
  salvandoIds: ReadonlySet<string>;
  aoMarcarVisto: (pedidoId: string) => void;
  aoMudarStatus: (pedido: PedidoResumo, novoStatus: StatusPedido) => void;
  aoDesfazerStatus: (desfazer: DesfazerStatusPedido) => void;
}

interface GrupoDia {
  data: DataISO;
  titulo: string;
  pedidos: PedidoResumo[];
  totalCaixas50: number;
  totalDoces: number;
}

function agruparPorDia(pedidos: PedidoResumo[], hoje: DataISO): GrupoDia[] {
  const mapa = new Map<DataISO, PedidoResumo[]>();

  const ordenados = [...pedidos]
    .filter((p) => p.status !== 'CANCELADO')
    .sort((a, b) => {
      if (a.dataEntrega !== b.dataEntrega) {
        return a.dataEntrega.localeCompare(b.dataEntrega);
      }
      return a.criadoEm.localeCompare(b.criadoEm);
    });

  for (const pedido of ordenados) {
    const lista = mapa.get(pedido.dataEntrega) ?? [];
    lista.push(pedido);
    mapa.set(pedido.dataEntrega, lista);
  }

  return Array.from(mapa.entries()).map(([data, lista]) => {
    const totalCaixas50 = lista.filter((p) => p.tipo === 'CAIXA_50').length;
    const totalDoces = lista.reduce(
      (soma, p) => soma + p.itens.reduce((s, i) => s + i.quantidade, 0),
      0,
    );
    return {
      data,
      titulo: formatarTituloDiaProximo(data, hoje),
      pedidos: lista,
      totalCaixas50,
      totalDoces,
    };
  });
}

export function AbaProximosDias({
  pedidosFuturos,
  hoje,
  idsNaoVistos,
  desfazerPorPedido,
  salvandoIds,
  aoMarcarVisto,
  aoMudarStatus,
  aoDesfazerStatus,
}: PropriedadesAbaProximosDias) {
  const grupos = agruparPorDia(pedidosFuturos, hoje);

  if (grupos.length === 0) {
    return (
      <section
        aria-label="Pedidos dos próximos dias"
        className="p-10 rounded-3xl bg-papel border-2 border-borda text-center space-y-3"
      >
        <p className="text-[42px]" aria-hidden="true">
          📅🍬
        </p>
        <h2 className="text-[28px] font-extrabold text-chocolate">
          Nenhum pedido agendado para os próximos dias
        </h2>
        <p className="text-[22px] text-chocolate-suave">
          Quando entrarem encomendas de Caixas de 50 ou doces agendados, elas aparecem aqui separadas por dia.
        </p>
      </section>
    );
  }

  return (
    <section aria-label="Pedidos dos próximos dias" className="space-y-10">
      {grupos.map((grupo) => (
        <div key={grupo.data} className="space-y-5">
          {/* Cabeçalho do dia com total de Caixas de 50 em destaque para planejar produção */}
          <header className="p-6 rounded-3xl bg-doce-de-leite/45 border-3 border-caramelo/60 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-[30px] sm:text-[34px] font-extrabold text-chocolate capitalize leading-tight">
                📅 {grupo.titulo}
              </h2>
              <p className="text-[21px] font-bold text-chocolate-suave mt-1">
                {grupo.pedidos.length}{' '}
                {grupo.pedidos.length === 1 ? 'pedido agendado' : 'pedidos agendados'} ·{' '}
                {grupo.totalDoces} doces no total
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="px-6 py-3.5 rounded-2xl bg-papel border-3 border-caramelo text-chocolate text-[24px] font-extrabold shadow-sm flex items-center gap-3">
                <span aria-hidden="true" className="text-[28px]">
                  📦
                </span>
                <span>
                  {grupo.totalCaixas50}{' '}
                  {grupo.totalCaixas50 === 1 ? 'Caixa de 50' : 'Caixas de 50'}
                </span>
              </div>
            </div>
          </header>

          {/* Cartões de pedidos daquele dia */}
          <div className="space-y-6">
            {grupo.pedidos.map((pedido) => (
              <CartaoPedido
                key={pedido.id}
                pedido={pedido}
                naoVisto={idsNaoVistos.has(pedido.id)}
                desfazerAtivo={desfazerPorPedido[pedido.id] ?? null}
                salvando={salvandoIds.has(pedido.id)}
                aoMarcarVisto={aoMarcarVisto}
                aoMudarStatus={aoMudarStatus}
                aoDesfazerStatus={aoDesfazerStatus}
              />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
