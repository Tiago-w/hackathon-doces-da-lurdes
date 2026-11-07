'use client';

import { useState } from 'react';
import type { DataISO, DiaCalendario, EntradaEditarDiaCalendario } from '@/lib/contrato';
import { dataAmigavel } from '@/lib/datas';

export interface DesfazerDiaCalendario {
  data: DataISO;
  estadoAnterior: EntradaEditarDiaCalendario;
  descricaoAcao: string;
}

interface PropriedadesAbaCalendario {
  calendario: DiaCalendario[];
  hoje: DataISO;
  desfazerAtivo: DesfazerDiaCalendario | null;
  salvandoDatas: ReadonlySet<string>;
  mensagemConfirmacao: string | null;
  aoEditarDia: (
    diaAtual: DiaCalendario,
    novaEntrada: EntradaEditarDiaCalendario,
    descricao: string,
  ) => void;
  aoDesfazerDia: (desfazer: DesfazerDiaCalendario) => void;
}

const MOTIVOS_RAPIDOS = [
  'Folga da cozinha',
  'Feriado em Pelotas',
  'Produção exclusiva para casamento',
  'Manutenção / Compras de insumos',
];

export function AbaCalendario({
  calendario,
  hoje,
  desfazerAtivo,
  salvandoDatas,
  mensagemConfirmacao,
  aoEditarDia,
  aoDesfazerDia,
}: PropriedadesAbaCalendario) {
  const [editandoData, setEditandoData] = useState<DataISO | null>(null);
  const [limiteTemp, setLimiteTemp] = useState<number>(5);
  const [observacaoTemp, setObservacaoTemp] = useState<string>('');

  const diasAbertos = calendario.filter((d) => d.aberto).length;
  const diasFechados = calendario.length - diasAbertos;
  const totalCaixasMes = calendario.reduce((acc, d) => acc + d.caixasAgendadas, 0);

  function abrirEdicaoDetalhes(dia: DiaCalendario) {
    setEditandoData(dia.data);
    setLimiteTemp(dia.limiteCaixas);
    setObservacaoTemp(dia.observacao ?? '');
  }

  function salvarDetalhesDia(dia: DiaCalendario) {
    aoEditarDia(
      dia,
      {
        data: dia.data,
        aberto: dia.aberto,
        limiteCaixas: limiteTemp,
        observacao: observacaoTemp.trim() || null,
      },
      `atualizou a capacidade e o recado de ${dataAmigavel(dia.data, hoje)}`,
    );
    setEditandoData(null);
  }

  return (
    <section aria-label="Calendário da cozinha" className="space-y-6">
      {/* Resumo superior do Calendário */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-center justify-between rounded-2xl border-2 border-sucesso/40 bg-sucesso-fundo p-5">
          <span className="text-[21px] font-bold text-sucesso">Dias abertos (30 dias)</span>
          <span className="font-titulo text-[32px] font-extrabold text-sucesso">{diasAbertos}</span>
        </div>
        <div className="flex items-center justify-between rounded-2xl border-2 border-caramelo/40 bg-doce-de-leite/35 p-5">
          <span className="text-[21px] font-bold text-chocolate">Caixas de 50 agendadas</span>
          <span className="font-titulo text-[32px] font-extrabold text-chocolate">{totalCaixasMes}</span>
        </div>
        <div className="flex items-center justify-between rounded-2xl border-2 border-erro/40 bg-erro-fundo p-5">
          <span className="text-[21px] font-bold text-erro">Dias de folga / fechados</span>
          <span className="font-titulo text-[32px] font-extrabold text-erro">{diasFechados}</span>
        </div>
      </div>

      {/* Instrução clara para a dona Lurdes */}
      <div className="rounded-2xl border-2 border-borda bg-papel p-5">
        <p className="text-[21px] font-bold text-chocolate">
          Toque em <span className="font-extrabold text-erro">Fechar dia (Folga)</span> quando não quiser receber encomendas naquela data, ou ajuste o <strong>limite de Caixas de 50</strong> de cada dia. O site do cliente atualiza na mesma hora.
        </p>
      </div>

      {/* Faixa de confirmação + botão Desfazer (10s) */}
      {(mensagemConfirmacao || desfazerAtivo) && (
        <div
          role="status"
          aria-live="polite"
          className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border-2 border-alerta bg-alerta-fundo p-5 text-chocolate shadow-xs"
        >
          <p className="text-[21px] font-extrabold">
            {mensagemConfirmacao ?? `Pronto! Você ${desfazerAtivo?.descricaoAcao}.`}
          </p>
          {desfazerAtivo && (
            <button
              type="button"
              onClick={() => aoDesfazerDia(desfazerAtivo)}
              className="min-h-14 rounded-xl border-2 border-chocolate bg-papel px-6 py-2.5 text-[20px] font-extrabold text-chocolate cursor-pointer"
            >
              Desfazer alteração
            </button>
          )}
        </div>
      )}

      {/* Lista / Grade de dias do calendário */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {calendario.map((dia) => {
          const salvando = salvandoDatas.has(dia.data);
          const editandoEste = editandoData === dia.data;
          const tituloDia = dataAmigavel(dia.data, hoje);

          return (
            <article
              key={dia.data}
              className={`flex flex-col justify-between gap-5 rounded-3xl p-6 shadow-xs transition-all ${
                dia.aberto
                  ? 'border-2 border-borda bg-papel text-chocolate'
                  : 'border-2 border-erro/60 bg-erro-fundo/35 text-chocolate'
              }`}
            >
              <div className="space-y-4">
                {/* Cabeçalho do dia */}
                <header className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <span className="text-sm font-bold uppercase tracking-wider text-caramelo">
                      Data: {dia.data.split('-').reverse().join('/')}
                    </span>
                    <h3 className="font-titulo text-[28px] font-bold capitalize leading-tight text-chocolate">
                      {tituloDia}
                    </h3>
                  </div>

                  {dia.aberto ? (
                    <span className="inline-flex items-center rounded-full border border-sucesso/40 bg-sucesso-fundo px-4 py-1 text-[17px] font-extrabold text-sucesso">
                      Aberto no site
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-erro px-4 py-1 text-[17px] font-extrabold text-papel">
                      Fechado (Folga)
                    </span>
                  )}
                </header>

                {/* Contadores do dia */}
                <div className="grid grid-cols-2 gap-3 rounded-2xl border border-borda bg-creme/60 p-4">
                  <div>
                    <span className="block text-[16px] font-bold text-chocolate-suave">Pedidos no dia</span>
                    <span className="font-titulo text-[26px] font-extrabold text-chocolate">
                      {dia.totalPedidos} {dia.totalPedidos === 1 ? 'pedido' : 'pedidos'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[16px] font-bold text-chocolate-suave">Caixas de 50</span>
                    <span className="font-titulo text-[26px] font-extrabold text-chocolate">
                      {dia.caixasAgendadas} de {dia.limiteCaixas}
                    </span>
                    {dia.limitePersonalizado && (
                      <span className="block text-xs font-bold text-caramelo">Limite ajustado</span>
                    )}
                  </div>
                </div>

                {/* Recado/observação do dia, se houver */}
                {dia.observacao && (
                  <div className="rounded-2xl border border-caramelo/40 bg-doce-de-leite/30 p-3.5 text-[19px] font-bold text-chocolate">
                    Motivo / Nota: “{dia.observacao}”
                  </div>
                )}

                {/* Interruptor grande: DIA ABERTO vs FECHAR DIA (FOLGA) */}
                <div
                  role="group"
                  aria-label={`Situação da agenda em ${tituloDia}`}
                  className="grid grid-cols-2 gap-3 pt-1"
                >
                  <button
                    type="button"
                    disabled={salvando}
                    aria-pressed={dia.aberto}
                    onClick={() => {
                      if (!dia.aberto) {
                        aoEditarDia(
                          dia,
                          {
                            data: dia.data,
                            aberto: true,
                            limiteCaixas: dia.limitePersonalizado ? dia.limiteCaixas : null,
                            observacao: null,
                          },
                          `reabriu o dia ${tituloDia}`,
                        );
                      }
                    }}
                    className={`min-h-[64px] rounded-2xl px-4 py-3 text-[21px] font-extrabold transition-all cursor-pointer ${
                      dia.aberto
                        ? 'border-2 border-sucesso bg-sucesso text-papel shadow-xs ring-4 ring-sucesso/20'
                        : 'border-2 border-borda bg-papel text-chocolate hover:border-sucesso/50'
                    }`}
                  >
                    Dia aberto
                  </button>

                  <button
                    type="button"
                    disabled={salvando}
                    aria-pressed={!dia.aberto}
                    onClick={() => {
                      if (dia.aberto) {
                        aoEditarDia(
                          dia,
                          {
                            data: dia.data,
                            aberto: false,
                            limiteCaixas: dia.limitePersonalizado ? dia.limiteCaixas : null,
                            observacao: dia.observacao ?? 'Folga da cozinha',
                          },
                          `fechou a agenda de ${tituloDia}`,
                        );
                      }
                    }}
                    className={`min-h-[64px] rounded-2xl px-4 py-3 text-[21px] font-extrabold transition-all cursor-pointer ${
                      !dia.aberto
                        ? 'border-2 border-erro bg-erro text-papel shadow-xs ring-4 ring-erro/20'
                        : 'border-2 border-borda bg-papel text-chocolate hover:border-erro/50'
                    }`}
                  >
                    Fechar dia
                  </button>
                </div>
              </div>

              {/* Ajuste de limite de Caixas de 50 e motivo/observação do dia */}
              <div className="border-t border-borda pt-4">
                {!editandoEste ? (
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="text-[18px] font-semibold text-chocolate-suave">
                      Capacidade: <strong className="text-chocolate">{dia.limiteCaixas} Caixas de 50</strong>
                    </span>
                    <button
                      type="button"
                      disabled={salvando}
                      onClick={() => abrirEdicaoDetalhes(dia)}
                      className="min-h-13 rounded-2xl border-2 border-borda bg-creme px-5 py-2.5 text-[19px] font-extrabold text-chocolate hover:border-caramelo cursor-pointer"
                    >
                      Ajustar vagas ou recado
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4 rounded-2xl border-2 border-caramelo bg-creme p-5">
                    <div>
                      <p className="text-[20px] font-extrabold text-chocolate">
                        Quantas Caixas de 50 aceitar neste dia?
                      </p>
                      <div className="mt-2.5 flex items-center gap-4">
                        <button
                          type="button"
                          onClick={() => setLimiteTemp((v) => Math.max(0, v - 1))}
                          className="size-14 rounded-2xl border-2 border-chocolate bg-papel text-[28px] font-extrabold text-chocolate cursor-pointer"
                          aria-label="Diminuir limite de caixas"
                        >
                          −
                        </button>
                        <span className="min-w-16 text-center font-titulo text-[32px] font-extrabold text-chocolate">
                          {limiteTemp}
                        </span>
                        <button
                          type="button"
                          onClick={() => setLimiteTemp((v) => Math.min(50, v + 1))}
                          className="size-14 rounded-2xl bg-caramelo text-[28px] font-extrabold text-papel cursor-pointer"
                          aria-label="Aumentar limite de caixas"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor={`obs-dia-${dia.data}`}
                        className="block text-[19px] font-extrabold text-chocolate"
                      >
                        Recado ou motivo no calendário (opcional):
                      </label>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {MOTIVOS_RAPIDOS.map((motivo) => (
                          <button
                            key={motivo}
                            type="button"
                            onClick={() => setObservacaoTemp(motivo)}
                            className="rounded-xl border border-borda bg-papel px-3 py-1.5 text-[16px] font-bold text-chocolate hover:border-caramelo cursor-pointer"
                          >
                            {motivo}
                          </button>
                        ))}
                      </div>
                      <input
                        id={`obs-dia-${dia.data}`}
                        type="text"
                        value={observacaoTemp}
                        onChange={(e) => setObservacaoTemp(e.target.value)}
                        placeholder="Ex.: Folga da cozinha, Feriado..."
                        className="mt-2.5 min-h-14 w-full rounded-2xl border-2 border-borda bg-papel px-4 py-2.5 text-[20px] font-semibold text-chocolate focus:border-caramelo focus:outline-none"
                      />
                    </div>

                    <div className="flex flex-wrap gap-3 pt-1">
                      <button
                        type="button"
                        disabled={salvando}
                        onClick={() => salvarDetalhesDia(dia)}
                        className="flex-1 min-h-14 rounded-2xl bg-caramelo px-5 py-3 text-[20px] font-extrabold text-papel cursor-pointer"
                      >
                        Salvar dia
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditandoData(null)}
                        className="min-h-14 rounded-2xl border-2 border-borda bg-papel px-5 py-3 text-[19px] font-bold text-chocolate cursor-pointer"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
