'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { DataISO, DiaCalendario } from '@/lib/contrato';
import { rotuloBotaoData } from './datas';

interface Props {
  calendario: DiaCalendario[];
  hoje: DataISO;
  antecedenciaDiasCaixa: number;
}

type FiltroCalendario = 'TODOS' | 'CAIXA' | 'AVULSO';

export function CalendarioPublico({ calendario, hoje, antecedenciaDiasCaixa }: Props) {
  const [filtro, setFiltro] = useState<FiltroCalendario>('TODOS');
  const [expandido, setExpandido] = useState(false);

  const filtrados = calendario.filter((d) => {
    if (filtro === 'CAIXA') return d.disponivelCaixa;
    if (filtro === 'AVULSO') return d.disponivelAvulso;
    return true;
  });

  const visiveis = expandido ? filtrados : filtrados.slice(0, 12);
  const totalDiasAbertos = calendario.filter((d) => d.aberto).length;
  const totalDiasComCaixa = calendario.filter((d) => d.disponivelCaixa).length;
  const totalDiasFechados = calendario.filter((d) => !d.aberto).length;

  return (
    <div className="rounded-3xl border border-borda bg-papel p-6 shadow-[0_8px_30px_rgba(44,24,16,0.04)] sm:p-8">
      {/* Cabeçalho e filtros */}
      <div className="flex flex-col justify-between gap-4 border-b border-borda/80 pb-6 lg:flex-row lg:items-end">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-caramelo">
            Agenda Oficial da Cozinha · Próximos 30 Dias
          </span>
          <h2 id="titulo-calendario" className="mt-1 font-titulo text-3xl font-bold tracking-tight text-chocolate sm:text-4xl">
            Calendário de disponibilidade e vagas
          </h2>
          <p className="mt-2 max-w-2xl text-base text-chocolate-suave">
            Consulte em tempo real os dias abertos pela dona Lurdes e quantas vagas de <strong>Caixa de 50 doces</strong> ainda restam em cada data.
          </p>
        </div>

        {/* Pílulas de filtro */}
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar datas do calendário">
          {(
            [
              { id: 'TODOS', rotulo: `Todos (${calendario.length})` },
              { id: 'CAIXA', rotulo: `Vagas Caixa de 50 (${totalDiasComCaixa})` },
              { id: 'AVULSO', rotulo: `Doces Avulsos (${totalDiasAbertos})` },
            ] as const
          ).map((op) => (
            <button
              key={op.id}
              type="button"
              onClick={() => setFiltro(op.id)}
              aria-pressed={filtro === op.id}
              className={`min-h-10 rounded-xl px-4 py-2 text-xs font-bold transition-colors cursor-pointer ${
                filtro === op.id
                  ? 'bg-caramelo text-white shadow-2xs'
                  : 'border border-borda bg-creme/70 text-chocolate hover:border-caramelo'
              }`}
            >
              {op.rotulo}
            </button>
          ))}
        </div>
      </div>

      {/* Legenda rápida */}
      <div className="mt-5 flex flex-wrap items-center gap-4 text-xs font-semibold text-chocolate-suave">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-sucesso" />
          Vagas abertas para Caixa de 50 e Avulsos
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-caramelo" />
          Somente Doces Avulsos (prazo &lt; {antecedenciaDiasCaixa} dias ou caixas completas)
        </span>
        {totalDiasFechados > 0 && (
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-erro" />
            Folga / Cozinha fechada ({totalDiasFechados})
          </span>
        )}
      </div>

      {/* Grade de dias do calendário */}
      <div className="mt-6 grid grid-cols-1 gap-3.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {visiveis.map((dia) => {
          const rotulo = rotuloBotaoData(dia.data, hoje);
          const ehHoje = dia.data === hoje;

          if (!dia.aberto) {
            return (
              <div
                key={dia.data}
                className="flex flex-col justify-between rounded-2xl border border-erro/35 bg-erro-fundo/45 p-4 opacity-85"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-chocolate-suave">
                      {rotulo.detalhe}
                    </span>
                    <span className="rounded-full bg-erro px-2.5 py-0.5 text-[11px] font-bold text-white">
                      Fechado
                    </span>
                  </div>
                  <p className="mt-1 font-titulo text-xl font-bold text-chocolate capitalize">
                    {rotulo.principal}
                  </p>
                  <p className="mt-2 text-xs font-semibold text-erro">
                    {dia.observacao ?? 'Folga da cozinha — sem entregas nesta data'}
                  </p>
                </div>
              </div>
            );
          }

          return (
            <div
              key={dia.data}
              className={`flex flex-col justify-between rounded-2xl border p-4 transition-all ${
                dia.disponivelCaixa
                  ? 'border-borda bg-creme/35 hover:border-caramelo hover:bg-papel hover:shadow-xs'
                  : 'border-borda/80 bg-creme/65'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-chocolate-suave">
                    {rotulo.detalhe}
                  </span>
                  {dia.disponivelCaixa ? (
                    <span className="rounded-full bg-sucesso-fundo px-2.5 py-0.5 text-[11px] font-bold text-sucesso border border-sucesso/30">
                      {dia.vagasCaixaRestantes} {dia.vagasCaixaRestantes === 1 ? 'vaga de Caixa' : 'vagas de Caixa'}
                    </span>
                  ) : dia.disponivelAvulso ? (
                    <span className="rounded-full bg-doce-de-leite/60 px-2.5 py-0.5 text-[11px] font-bold text-chocolate">
                      {ehHoje ? 'Sai hoje (Avulso)' : 'Só Avulsos'}
                    </span>
                  ) : (
                    <span className="rounded-full bg-borda px-2.5 py-0.5 text-[11px] font-bold text-chocolate-suave">
                      Encerrado
                    </span>
                  )}
                </div>

                <p className="mt-1 font-titulo text-xl font-bold text-chocolate capitalize">
                  {rotulo.principal}
                </p>

                {dia.observacao && (
                  <p className="mt-1.5 rounded-lg bg-doce-de-leite/35 px-2.5 py-1 text-xs font-semibold text-chocolate">
                    Nota: {dia.observacao}
                  </p>
                )}

                {/* Barra de ocupação das Caixas de 50 quando o dia está dentro da janela de caixas */}
                {dia.disponivelCaixa && (
                  <div className="mt-3">
                    <div className="flex justify-between text-[11px] font-semibold text-chocolate-suave">
                      <span>Agenda de Caixas</span>
                      <span>
                        {dia.caixasAgendadas}/{dia.limiteCaixas} reservadas
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-borda/80">
                      <div
                        className="h-full rounded-full bg-caramelo transition-all"
                        style={{
                          width: `${Math.min(100, (dia.caixasAgendadas / Math.max(1, dia.limiteCaixas)) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                )}

                {!dia.disponivelCaixa && dia.disponivelAvulso && (
                  <p className="mt-2 text-xs text-chocolate-suave">
                    {dia.caixasAgendadas >= dia.limiteCaixas
                      ? 'Caixas de 50 esgotadas neste dia. Disponível para doces avulsos.'
                      : `Disponível para doces avulsos (Caixas pedem ${antecedenciaDiasCaixa} dias).`}
                  </p>
                )}
              </div>

              <div className="mt-4 flex items-center gap-2 border-t border-borda/60 pt-3">
                {dia.disponivelCaixa ? (
                  <Link
                    href="/pedido/caixa"
                    className="inline-flex w-full items-center justify-center rounded-xl bg-caramelo px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-caramelo-escuro"
                  >
                    Montar Caixa de 50
                  </Link>
                ) : dia.disponivelAvulso ? (
                  <Link
                    href="/pedido/avulso"
                    className="inline-flex w-full items-center justify-center rounded-xl border border-caramelo/60 bg-papel px-3 py-2 text-xs font-bold text-caramelo transition-colors hover:bg-creme"
                  >
                    Pedir Doces Avulsos
                  </Link>
                ) : (
                  <span className="text-xs font-semibold text-chocolate-suave">Horário encerrado para hoje</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filtrados.length > 12 && (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={() => setExpandido((v) => !v)}
            className="min-h-11 rounded-xl border border-caramelo/50 bg-creme px-5 py-2.5 text-sm font-bold text-chocolate hover:border-caramelo cursor-pointer"
          >
            {expandido ? 'Mostrar apenas os próximos 12 dias' : `Ver todos os ${filtrados.length} dias do calendário`}
          </button>
        </div>
      )}
    </div>
  );
}
