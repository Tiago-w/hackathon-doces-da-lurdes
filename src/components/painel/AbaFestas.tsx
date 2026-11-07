'use client';

import type { DataISO, OrcamentoFesta, StatusOrcamento } from '@/lib/contrato';
import { dataAmigavel } from '@/lib/datas';
import { formatarWhatsapp } from '@/lib/whatsapp';
import { linkWhatsappFesta, obterInfoStatusOrcamento } from './mensagens';

export interface DesfazerStatusOrcamento {
  orcamentoId: string;
  nomeCliente: string;
  statusAnterior: StatusOrcamento;
}

interface PropriedadesAbaFestas {
  orcamentos: OrcamentoFesta[];
  hoje: DataISO;
  desfazerPorOrcamento: Record<string, DesfazerStatusOrcamento>;
  salvandoIds: ReadonlySet<string>;
  aoMudarStatusOrcamento: (orcamento: OrcamentoFesta, status: StatusOrcamento) => void;
  aoDesfazerOrcamento: (desfazer: DesfazerStatusOrcamento) => void;
}

const OPCOES_STATUS_ORCAMENTO: {
  status: StatusOrcamento;
  rotulo: string;
  icone: string;
  classesAtivo: string;
}[] = [
  {
    status: 'RESPONDIDO',
    rotulo: 'Já respondi',
    icone: '💬',
    classesAtivo: 'bg-caramelo text-papel border-3 border-caramelo-escuro shadow-md',
  },
  {
    status: 'FECHADO',
    rotulo: 'Fechou',
    icone: '🎉',
    classesAtivo: 'bg-sucesso text-papel border-3 border-sucesso shadow-md',
  },
  {
    status: 'RECUSADO',
    rotulo: 'Não fechou',
    icone: '❌',
    classesAtivo: 'bg-erro text-papel border-3 border-erro shadow-md',
  },
];

export function AbaFestas({
  orcamentos,
  hoje,
  desfazerPorOrcamento,
  salvandoIds,
  aoMudarStatusOrcamento,
  aoDesfazerOrcamento,
}: PropriedadesAbaFestas) {
  const ordenados = [...orcamentos].sort((a, b) => {
    if (a.status === 'NOVO' && b.status !== 'NOVO') return -1;
    if (a.status !== 'NOVO' && b.status === 'NOVO') return 1;
    return b.criadoEm.localeCompare(a.criadoEm);
  });

  if (ordenados.length === 0) {
    return (
      <section
        aria-label="Orçamentos de festa"
        className="p-10 rounded-3xl bg-papel border-2 border-borda text-center space-y-3"
      >
        <p className="text-[42px]" aria-hidden="true">
          🎂🍬
        </p>
        <h2 className="text-[28px] font-extrabold text-chocolate">
          Nenhum pedido de orçamento de festa por enquanto
        </h2>
        <p className="text-[22px] text-chocolate-suave">
          Quando alguém pedir orçamento para casamento, formatura ou aniversário, aparece aqui.
        </p>
      </section>
    );
  }

  return (
    <section aria-label="Orçamentos de festa" className="space-y-6">
      {ordenados.map((orc) => {
        const infoStatus = obterInfoStatusOrcamento(orc.status);
        const urlWhatsapp = linkWhatsappFesta(orc);
        const salvando = salvandoIds.has(orc.id);
        const desfazer = desfazerPorOrcamento[orc.id] ?? null;

        return (
          <article
            key={orc.id}
            className={`rounded-3xl bg-papel p-6 sm:p-8 shadow-md space-y-6 ${
              orc.status === 'NOVO'
                ? 'border-4 border-caramelo ring-2 ring-doce-de-leite'
                : 'border-2 border-borda'
            }`}
          >
            {/* Faixa de Desfazer (~10s) */}
            {desfazer && (
              <div
                role="status"
                className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-alerta-fundo border-2 border-alerta text-chocolate"
              >
                <span className="text-[22px] font-bold">
                  ✅ Marcado como <span className="underline">{infoStatus.rotulo}</span>.
                </span>
                <button
                  type="button"
                  disabled={salvando}
                  onClick={() => aoDesfazerOrcamento(desfazer)}
                  className="min-h-16 px-6 py-3 rounded-2xl bg-papel text-chocolate border-2 border-chocolate font-extrabold text-[21px] cursor-pointer"
                >
                  ↩️ Desfazer
                </button>
              </div>
            )}

            {/* Cabeçalho do orçamento */}
            <header className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h3 className="text-[30px] sm:text-[34px] font-extrabold text-chocolate leading-tight">
                  {orc.nome}
                </h3>
                <p className="text-[21px] text-chocolate-suave font-semibold mt-1">
                  WhatsApp: {formatarWhatsapp(orc.whatsapp)}
                </p>
              </div>

              <span
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-[22px] font-extrabold ${infoStatus.classesSelo}`}
              >
                <span aria-hidden="true">{infoStatus.icone}</span>
                <span>{infoStatus.rotulo}</span>
              </span>
            </header>

            {/* Detalhes da festa: Tipo de evento, Data e Quantidade */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-creme border-2 border-borda">
                <span className="block text-[19px] font-bold text-chocolate-suave">
                  🎉 Tipo de festa
                </span>
                <span className="text-[25px] font-extrabold text-chocolate">
                  {orc.tipoEvento}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-creme border-2 border-borda">
                <span className="block text-[19px] font-bold text-chocolate-suave">
                  📅 Data do evento
                </span>
                <span className="text-[25px] font-extrabold text-chocolate capitalize">
                  {dataAmigavel(orc.dataEvento, hoje)}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-creme border-2 border-borda">
                <span className="block text-[19px] font-bold text-chocolate-suave">
                  🍬 Quantidade estimada
                </span>
                <span className="text-[25px] font-extrabold text-chocolate">
                  {orc.quantidadeDoces ? `${orc.quantidadeDoces} doces` : 'A combinar'}
                </span>
              </div>
            </div>

            {/* Observação do cliente */}
            {orc.observacao && (
              <div className="p-5 rounded-2xl bg-alerta-fundo/70 border-2 border-alerta/60 space-y-1">
                <p className="text-[20px] font-extrabold text-alerta">
                  💬 O que o cliente escreveu:
                </p>
                <p className="text-[24px] font-bold text-chocolate leading-snug">
                  “{orc.observacao}”
                </p>
              </div>
            )}

            {/* Botão grande para responder no WhatsApp */}
            <div>
              <a
                href={urlWhatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full min-h-[72px] px-8 py-4 rounded-2xl bg-sucesso active:opacity-90 text-papel text-[26px] font-extrabold shadow-md flex items-center justify-center gap-3 text-center"
              >
                <span aria-hidden="true" className="text-[30px]">
                  💬
                </span>
                <span>Responder no WhatsApp</span>
              </a>
            </div>

            {/* Botões grandes de status: "Já respondi", "Fechou", "Não fechou" */}
            <div className="pt-3 border-t-2 border-borda space-y-3">
              <p className="text-[20px] font-bold text-chocolate-suave">
                Situação deste orçamento (toque para marcar):
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {OPCOES_STATUS_ORCAMENTO.map((opcao) => {
                  const ativo = orc.status === opcao.status;
                  return (
                    <button
                      key={opcao.status}
                      type="button"
                      disabled={salvando}
                      aria-pressed={ativo}
                      onClick={() => {
                        if (!ativo) {
                          aoMudarStatusOrcamento(orc, opcao.status);
                        }
                      }}
                      className={`min-h-16 px-5 py-3.5 rounded-2xl text-[22px] font-extrabold flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
                        ativo
                          ? opcao.classesAtivo
                          : 'bg-creme text-chocolate border-2 border-borda active:bg-doce-de-leite/35'
                      }`}
                    >
                      <span aria-hidden="true">{opcao.icone}</span>
                      <span>{opcao.rotulo}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </article>
        );
      })}
    </section>
  );
}
