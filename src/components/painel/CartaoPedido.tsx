'use client';

import { useState } from 'react';
import type { PedidoResumo, StatusPedido } from '@/lib/contrato';
import { partesEmPelotas } from '@/lib/datas';
import { formatarReais } from '@/lib/dinheiro';
import { formatarWhatsapp } from '@/lib/whatsapp';
import {
  linkWhatsappPedido,
  obterInfoStatusPedido,
  obterProximoPasso,
} from './mensagens';

export interface DesfazerStatusPedido {
  pedidoId: string;
  codigoPedido: number;
  nomeCliente: string;
  statusAnterior: StatusPedido;
  statusNovo: StatusPedido;
}

interface PropriedadesCartaoPedido {
  pedido: PedidoResumo;
  naoVisto: boolean;
  desfazerAtivo: DesfazerStatusPedido | null;
  salvando: boolean;
  aoMarcarVisto: (pedidoId: string) => void;
  aoMudarStatus: (pedido: PedidoResumo, novoStatus: StatusPedido) => void;
  aoDesfazerStatus: (desfazer: DesfazerStatusPedido) => void;
}

export function CartaoPedido({
  pedido,
  naoVisto,
  desfazerAtivo,
  salvando,
  aoMarcarVisto,
  aoMudarStatus,
  aoDesfazerStatus,
}: PropriedadesCartaoPedido) {
  const [maisOpcoesAberto, setMaisOpcoesAberto] = useState(false);
  const [confirmandoCancelamento, setConfirmandoCancelamento] = useState(false);

  const infoStatus = obterInfoStatusPedido(pedido.status);
  const proximoPasso = obterProximoPasso(pedido);
  const urlWhatsapp = linkWhatsappPedido(pedido);
  const horaPedido = partesEmPelotas(new Date(pedido.criadoEm)).hora;
  const totalUnidades = pedido.itens.reduce((soma, item) => soma + item.quantidade, 0);
  const infoStatusAnterior = desfazerAtivo
    ? obterInfoStatusPedido(desfazerAtivo.statusAnterior)
    : null;

  function registrarToqueNoCartao() {
    if (naoVisto) {
      aoMarcarVisto(pedido.id);
    }
  }

  return (
    <article
      onClick={registrarToqueNoCartao}
      className={`rounded-3xl bg-papel p-6 sm:p-8 shadow-md transition-all space-y-6 ${
        naoVisto
          ? 'border-4 border-caramelo ring-4 ring-doce-de-leite/70'
          : pedido.mesmoDia && pedido.status !== 'ENTREGUE' && pedido.status !== 'CANCELADO'
            ? 'border-3 border-caramelo/80'
            : 'border-2 border-borda'
      }`}
    >
      {/* Faixa de pedido novo ainda não visto */}
      {naoVisto && (
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-doce-de-leite text-chocolate border-2 border-caramelo animate-pulse">
          <div className="flex items-center gap-3 text-[24px] font-extrabold">
            <span aria-hidden="true" className="text-[30px]">
              🔔
            </span>
            <span>NOVO PEDIDO CHEGOU! Toque aqui para confirmar que viu.</span>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              aoMarcarVisto(pedido.id);
            }}
            className="min-h-16 px-6 py-3 rounded-2xl bg-papel text-chocolate font-bold text-[20px] border-2 border-chocolate shadow-sm cursor-pointer"
          >
            👀 Já vi
          </button>
        </div>
      )}

      {/* Faixa de Desfazer mudança recente de status (~10s) */}
      {desfazerAtivo && infoStatusAnterior && (
        <div
          role="status"
          className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-alerta-fundo border-2 border-alerta text-chocolate"
        >
          <p className="text-[22px] font-bold">
            ✅ Mudou para <span className="underline">{infoStatus.rotulo}</span>. Tocou errado?
          </p>
          <button
            type="button"
            disabled={salvando}
            onClick={(e) => {
              e.stopPropagation();
              aoDesfazerStatus(desfazerAtivo);
            }}
            className="min-h-16 px-6 py-3 rounded-2xl bg-papel text-chocolate font-extrabold text-[22px] border-3 border-chocolate shadow-sm active:bg-creme cursor-pointer"
          >
            ↩️ Desfazer (voltar para {infoStatusAnterior.rotulo})
          </button>
        </div>
      )}

      {/* Cabeçalho do cartão: Número, Nome do Cliente e Selos */}
      <header className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-[30px] sm:text-[34px] font-extrabold text-chocolate leading-tight">
              Pedido {pedido.codigo} · {pedido.cliente.nome}
            </h3>
            <p className="text-[20px] text-chocolate-suave font-medium mt-1">
              Feito às {horaPedido} · Tel: {formatarWhatsapp(pedido.cliente.whatsapp)}
            </p>
          </div>

          {/* Selo de Status Atual */}
          <span
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-[22px] font-extrabold ${infoStatus.classesSelo}`}
          >
            <span aria-hidden="true">{infoStatus.icone}</span>
            <span>{infoStatus.rotulo}</span>
          </span>
        </div>

        {/* Selos Grandes de Urgência, Tipo e Entrega */}
        <div className="flex flex-wrap gap-3 pt-1">
          {pedido.mesmoDia && (
            <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-erro text-papel text-[22px] font-extrabold shadow-sm">
              <span aria-hidden="true">⚡</span>
              <span>HOJE! (Mesmo dia)</span>
            </span>
          )}

          {pedido.tipo === 'CAIXA_50' ? (
            <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-doce-de-leite text-chocolate border-2 border-caramelo text-[22px] font-extrabold">
              <span aria-hidden="true">📦</span>
              <span>CAIXA DE 50</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-creme text-chocolate border-2 border-borda text-[21px] font-bold">
              <span aria-hidden="true">🍬</span>
              <span>Avulso ({totalUnidades} doces)</span>
            </span>
          )}

          {pedido.formaEntrega === 'RETIRADA' ? (
            <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-creme text-chocolate border-2 border-chocolate/30 text-[22px] font-bold">
              <span aria-hidden="true">🏠</span>
              <span>Retirada na casa</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-doce-de-leite/55 text-chocolate border-2 border-caramelo/60 text-[22px] font-extrabold">
              <span aria-hidden="true">🛵</span>
              <span>Entrega · {pedido.bairro ?? 'Pelotas'}</span>
            </span>
          )}
        </div>

        {pedido.formaEntrega === 'ENTREGA' && pedido.endereco && (
          <div className="p-4 rounded-2xl bg-creme border-2 border-borda text-[22px] text-chocolate">
            <strong className="font-extrabold">📍 Endereço: </strong>
            <span>
              {pedido.endereco}
              {pedido.bairro ? ` — Bairro ${pedido.bairro}` : ''}
            </span>
          </div>
        )}
      </header>

      {/* Lista de Doces do Pedido */}
      <div className="p-5 rounded-2xl bg-creme border-2 border-borda space-y-3">
        <p className="text-[22px] font-extrabold text-chocolate-suave uppercase tracking-wide">
          {pedido.tipo === 'CAIXA_50'
            ? `Sabores da Caixa (${totalUnidades} doces):`
            : `Doces do pedido (${totalUnidades} unidades):`}
        </p>
        <ul className="space-y-2.5">
          {pedido.itens.map((item) => (
            <li
              key={`${pedido.id}-${item.produtoId}`}
              className="flex items-center justify-between gap-4 text-[25px] sm:text-[26px] font-extrabold text-chocolate border-b border-borda/80 pb-2 last:border-b-0 last:pb-0"
            >
              <span>
                {item.quantidade} × {item.nomeProduto}
              </span>
              {pedido.tipo !== 'CAIXA_50' && item.precoUnitCentavos > 0 && (
                <span className="text-[20px] font-semibold text-chocolate-suave">
                  {formatarReais(item.quantidade * item.precoUnitCentavos)}
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Observação do cliente, se houver */}
      {pedido.observacao && (
        <div className="p-5 rounded-2xl bg-alerta-fundo/70 border-2 border-alerta/60 text-chocolate space-y-1">
          <p className="text-[20px] font-extrabold text-alerta flex items-center gap-2">
            <span aria-hidden="true">💬</span>
            <span>Recado do cliente:</span>
          </p>
          <p className="text-[24px] font-bold leading-snug">“{pedido.observacao}”</p>
        </div>
      )}

      {/* Total e Situação do Pix */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-creme/70 border-2 border-borda">
        <div>
          <p className="text-[20px] text-chocolate-suave font-bold">Valor total</p>
          <p className="text-[32px] font-extrabold text-chocolate leading-none mt-1">
            {formatarReais(pedido.totalCentavos)}
          </p>
          {pedido.freteCentavos > 0 && (
            <p className="text-[19px] text-chocolate-suave mt-1">
              (Doces: {formatarReais(pedido.subtotalCentavos)} + Entrega:{' '}
              {formatarReais(pedido.freteCentavos)})
            </p>
          )}
        </div>

        {pedido.statusPagamento === 'PAGO' ? (
          <div className="inline-flex items-center gap-3 px-6 py-3.5 rounded-2xl bg-sucesso-fundo text-sucesso border-3 border-sucesso text-[24px] font-extrabold">
            <span aria-hidden="true">✅</span>
            <span>Pix Pago</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-3 px-6 py-3.5 rounded-2xl bg-alerta-fundo text-alerta border-3 border-alerta text-[24px] font-extrabold">
            <span aria-hidden="true">⏳</span>
            <span>Pix pendente</span>
          </div>
        )}
      </div>

      {/* Ações Principais: Próximo Passo (um único botão grande) + WhatsApp */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 pt-2">
        {proximoPasso && (
          <button
            type="button"
            disabled={salvando}
            onClick={(e) => {
              e.stopPropagation();
              aoMarcarVisto(pedido.id);
              aoMudarStatus(pedido, proximoPasso.proximoStatus);
            }}
            className="lg:col-span-7 min-h-[72px] px-8 py-4 rounded-2xl bg-caramelo active:bg-caramelo-escuro text-papel text-[26px] sm:text-[28px] font-extrabold shadow-md flex items-center justify-center gap-3 disabled:opacity-60 cursor-pointer"
          >
            <span aria-hidden="true" className="text-[32px]">
              {proximoPasso.icone}
            </span>
            <span>{proximoPasso.rotuloBotao}</span>
          </button>
        )}

        <a
          href={urlWhatsapp}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => {
            e.stopPropagation();
            aoMarcarVisto(pedido.id);
          }}
          className={`${
            proximoPasso ? 'lg:col-span-5' : 'lg:col-span-12'
          } min-h-[72px] px-6 py-4 rounded-2xl bg-sucesso active:opacity-90 text-papel text-[24px] font-extrabold shadow-sm flex items-center justify-center gap-3 text-center`}
        >
          <span aria-hidden="true" className="text-[28px]">
            💬
          </span>
          <span>Falar no WhatsApp</span>
        </a>
      </div>

      {/* Menu "Mais opções" para esconder o "Cancelar pedido" com segurança */}
      {pedido.status !== 'CANCELADO' && pedido.status !== 'ENTREGUE' && (
        <div className="pt-2 border-t border-borda">
          {!maisOpcoesAberto ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setMaisOpcoesAberto(true);
              }}
              className="min-h-16 px-5 py-3 rounded-2xl text-[20px] font-bold text-chocolate-suave bg-creme border-2 border-borda active:bg-borda/40 inline-flex items-center gap-2 cursor-pointer"
            >
              <span aria-hidden="true">⚙️</span>
              <span>Mais opções</span>
            </button>
          ) : (
            <div
              onClick={(e) => e.stopPropagation()}
              className="p-5 rounded-2xl bg-creme border-2 border-borda space-y-4"
            >
              {!confirmandoCancelamento ? (
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <button
                    type="button"
                    onClick={() => setConfirmandoCancelamento(true)}
                    className="min-h-16 px-6 py-3 rounded-2xl bg-erro-fundo text-erro border-2 border-erro font-extrabold text-[21px] inline-flex items-center gap-2 cursor-pointer"
                  >
                    <span aria-hidden="true">❌</span>
                    <span>Cancelar este pedido...</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMaisOpcoesAberto(false)}
                    className="min-h-16 px-6 py-3 rounded-2xl bg-papel text-chocolate border-2 border-borda font-bold text-[20px] cursor-pointer"
                  >
                    Fechar opções
                  </button>
                </div>
              ) : (
                <div
                  role="alertdialog"
                  aria-label="Confirmar cancelamento do pedido"
                  className="p-5 rounded-2xl bg-erro-fundo border-3 border-erro space-y-4"
                >
                  <p className="text-[24px] font-extrabold text-erro">
                    ⚠️ Tem certeza que quer cancelar o Pedido {pedido.codigo} de{' '}
                    {pedido.cliente.nome}?
                  </p>
                  <p className="text-[20px] text-chocolate">
                    Use apenas se o cliente desistiu do pedido.
                  </p>
                  <div className="flex flex-wrap gap-4 pt-2">
                    <button
                      type="button"
                      disabled={salvando}
                      onClick={() => {
                        setConfirmandoCancelamento(false);
                        setMaisOpcoesAberto(false);
                        aoMudarStatus(pedido, 'CANCELADO');
                      }}
                      className="min-h-16 px-7 py-3 rounded-2xl bg-erro text-papel font-extrabold text-[22px] shadow-sm cursor-pointer"
                    >
                      ❌ Sim, cancelar pedido
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmandoCancelamento(false);
                        setMaisOpcoesAberto(false);
                      }}
                      className="min-h-16 px-7 py-3 rounded-2xl bg-papel text-chocolate border-2 border-chocolate font-extrabold text-[22px] cursor-pointer"
                    >
                      Voltar (não cancelar)
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </article>
  );
}
