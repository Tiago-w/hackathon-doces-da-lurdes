'use client';

import { useState } from 'react';
import type { PedidoResumo, StatusPedido } from '@/lib/contrato';
import { CartaoPedido, type DesfazerStatusPedido } from './CartaoPedido';

interface PropriedadesAbaHoje {
  pedidosHoje: PedidoResumo[];
  idsNaoVistos: ReadonlySet<string>;
  desfazerPorPedido: Record<string, DesfazerStatusPedido>;
  salvandoIds: ReadonlySet<string>;
  aoMarcarVisto: (pedidoId: string) => void;
  aoMudarStatus: (pedido: PedidoResumo, novoStatus: StatusPedido) => void;
  aoDesfazerStatus: (desfazer: DesfazerStatusPedido) => void;
}

function ordenarPedidosAtivosHoje(pedidos: PedidoResumo[]): PedidoResumo[] {
  return [...pedidos].sort((a, b) => {
    // 1. Pedidos novos (RECEBIDO) sempre primeiro
    const aRecebido = a.status === 'RECEBIDO' ? 0 : 1;
    const bRecebido = b.status === 'RECEBIDO' ? 0 : 1;
    if (aRecebido !== bRecebido) return aRecebido - bRecebido;

    // 2. Pedidos de entrega no mesmo dia em destaque
    if (a.mesmoDia !== b.mesmoDia) return a.mesmoDia ? -1 : 1;

    // 3. Ordem de horário (do mais antigo para o mais recente, ou novos no topo)
    return a.criadoEm.localeCompare(b.criadoEm);
  });
}

export function AbaHoje({
  pedidosHoje,
  idsNaoVistos,
  desfazerPorPedido,
  salvandoIds,
  aoMarcarVisto,
  aoMudarStatus,
  aoDesfazerStatus,
}: PropriedadesAbaHoje) {
  const [mostrarFinalizados, setMostrarFinalizados] = useState(false);

  // Se um pedido acabou de ir para ENTREGUE/CANCELADO mas ainda está com o botão "Desfazer"
  // ativo (10 segundos), mantemos ele visível na lista principal para a dona Lurdes poder desfazer!
  const ativos = ordenarPedidosAtivosHoje(
    pedidosHoje.filter(
      (p) =>
        (p.status !== 'ENTREGUE' && p.status !== 'CANCELADO') ||
        Boolean(desfazerPorPedido[p.id]),
    ),
  );

  const finalizados = pedidosHoje.filter(
    (p) =>
      (p.status === 'ENTREGUE' || p.status === 'CANCELADO') &&
      !desfazerPorPedido[p.id],
  );

  const qtdRecebidos = ativos.filter((p) => p.status === 'RECEBIDO').length;
  const qtdFazendo = ativos.filter((p) => p.status === 'FAZENDO').length;
  const qtdProntosOuSaiu = ativos.filter(
    (p) => p.status === 'PRONTO' || p.status === 'SAIU',
  ).length;

  return (
    <section aria-label="Pedidos de hoje" className="space-y-8">
      {/* Resumo rápido do dia */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-alerta-fundo border-2 border-alerta/50 flex items-center justify-between">
          <span className="text-[22px] font-bold text-alerta">📥 Novos (Recebidos)</span>
          <span className="text-[32px] font-extrabold text-alerta">{qtdRecebidos}</span>
        </div>
        <div className="p-5 rounded-2xl bg-doce-de-leite/35 border-2 border-caramelo/40 flex items-center justify-between">
          <span className="text-[22px] font-bold text-chocolate">👩‍🍳 Fazendo agora</span>
          <span className="text-[32px] font-extrabold text-chocolate">{qtdFazendo}</span>
        </div>
        <div className="p-5 rounded-2xl bg-sucesso-fundo border-2 border-sucesso/50 flex items-center justify-between">
          <span className="text-[22px] font-bold text-sucesso">✅ Prontos / Em entrega</span>
          <span className="text-[32px] font-extrabold text-sucesso">{qtdProntosOuSaiu}</span>
        </div>
      </div>

      {/* Lista de pedidos em andamento hoje */}
      {ativos.length === 0 ? (
        <div className="p-10 rounded-3xl bg-papel border-2 border-borda text-center space-y-3">
          <p className="text-[42px]" aria-hidden="true">
            ☕🍬
          </p>
          <h2 className="text-[28px] font-extrabold text-chocolate">
            Tudo em dia por aqui, dona Lurdes!
          </h2>
          <p className="text-[22px] text-chocolate-suave">
            Não há pedidos pendentes para hoje neste momento. Se chegar pedido novo, o painel avisa com som.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {ativos.map((pedido) => (
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
      )}

      {/* Seção recolhida: "Já entregues hoje" */}
      {finalizados.length > 0 && (
        <div className="pt-4 border-t-2 border-borda">
          <button
            type="button"
            onClick={() => setMostrarFinalizados((v) => !v)}
            aria-expanded={mostrarFinalizados}
            className="w-full min-h-16 px-6 py-4 rounded-2xl bg-papel border-2 border-borda text-chocolate text-[24px] font-extrabold flex items-center justify-between gap-4 shadow-sm cursor-pointer"
          >
            <span className="flex items-center gap-3">
              <span aria-hidden="true">🎉</span>
              <span>Já entregues hoje ({finalizados.length})</span>
            </span>
            <span className="text-[22px] text-caramelo font-bold">
              {mostrarFinalizados ? '▲ Recolher' : '▼ Toque para ver'}
            </span>
          </button>

          {mostrarFinalizados && (
            <div className="mt-6 space-y-6">
              {finalizados.map((pedido) => (
                <CartaoPedido
                  key={pedido.id}
                  pedido={pedido}
                  naoVisto={false}
                  desfazerAtivo={desfazerPorPedido[pedido.id] ?? null}
                  salvando={salvandoIds.has(pedido.id)}
                  aoMarcarVisto={aoMarcarVisto}
                  aoMudarStatus={aoMudarStatus}
                  aoDesfazerStatus={aoDesfazerStatus}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
