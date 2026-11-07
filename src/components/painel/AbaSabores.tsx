'use client';

import { useState } from 'react';
import type { Produto } from '@/lib/contrato';
import { formatarReais, lerReais } from '@/lib/dinheiro';
import { FotoSabor, obterSeloDoce } from '@/components/site/FotoSabor';

export interface DesfazerDisponibilidadeSabor {
  produtoId: string;
  nomeProduto: string;
  disponivelAnterior: boolean;
}

interface PropriedadesAbaSabores {
  catalogo: Produto[];
  desfazerPorProduto: Record<string, DesfazerDisponibilidadeSabor>;
  mensagemConfirmacao: string | null;
  salvandoIds: ReadonlySet<string>;
  aoAlternarDisponivel: (produto: Produto, disponivel: boolean) => void;
  aoDesfazerDisponivel: (desfazer: DesfazerDisponibilidadeSabor) => void;
  aoMudarPreco: (produto: Produto, novoPrecoCentavos: number) => Promise<boolean>;
}

export function AbaSabores({
  catalogo,
  desfazerPorProduto,
  mensagemConfirmacao,
  salvandoIds,
  aoAlternarDisponivel,
  aoDesfazerDisponivel,
  aoMudarPreco,
}: PropriedadesAbaSabores) {
  const [editandoPrecoId, setEditandoPrecoId] = useState<string | null>(null);
  const [textoPreco, setTextoPreco] = useState('');
  const [erroPreco, setErroPreco] = useState<string | null>(null);
  const [confirmacaoPreco, setConfirmacaoPreco] = useState<{
    produto: Produto;
    novoPrecoCentavos: number;
  } | null>(null);

  function abrirEdicaoPreco(produto: Produto) {
    setEditandoPrecoId(produto.id);
    setTextoPreco((produto.precoCentavos / 100).toFixed(2).replace('.', ','));
    setErroPreco(null);
    setConfirmacaoPreco(null);
  }

  function prepararConfirmacaoPreco(produto: Produto, e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErroPreco(null);

    const centavos = lerReais(textoPreco);
    if (centavos === null || centavos <= 0) {
      setErroPreco('Digite um valor válido (exemplo: 4,50).');
      return;
    }
    if (centavos === produto.precoCentavos) {
      setEditandoPrecoId(null);
      return;
    }

    setConfirmacaoPreco({ produto, novoPrecoCentavos: centavos });
  }

  async function confirmarNovoPreco() {
    if (!confirmacaoPreco) return;
    const { produto, novoPrecoCentavos } = confirmacaoPreco;
    const sucesso = await aoMudarPreco(produto, novoPrecoCentavos);
    if (sucesso) {
      setConfirmacaoPreco(null);
      setEditandoPrecoId(null);
      setTextoPreco('');
    }
  }

  const qtdDisponiveis = catalogo.filter((p) => p.disponivel).length;
  const qtdEsgotados = catalogo.length - qtdDisponiveis;

  return (
    <section aria-label="Sabores do catálogo" className="space-y-6">
      {/* Instrução simples e resumo */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-papel border-2 border-borda">
        <p className="text-[21px] font-bold text-chocolate">
          Toque em <span className="text-erro font-extrabold">Acabou</span> quando faltar um doce na cozinha, ou em{' '}
          <span className="text-sucesso font-extrabold">Tem</span> quando voltar ao cardápio.
        </p>
        <div className="flex flex-wrap gap-3 text-[19px] font-extrabold">
          <span className="px-4 py-2 rounded-xl bg-sucesso-fundo text-sucesso border border-sucesso/40">
            {qtdDisponiveis} disponíveis no site
          </span>
          {qtdEsgotados > 0 && (
            <span className="px-4 py-2 rounded-xl bg-erro-fundo text-erro border border-erro/40">
              {qtdEsgotados} esgotado{qtdEsgotados > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Mensagem de confirmação grande depois de salvar */}
      {mensagemConfirmacao && (
        <div
          role="status"
          aria-live="polite"
          className="p-5 rounded-2xl bg-sucesso-fundo border-2 border-sucesso text-sucesso text-[22px] font-extrabold flex items-center gap-3 shadow-sm"
        >
          <span>{mensagemConfirmacao}</span>
        </div>
      )}

      {/* Grade de cartões grandes, um por sabor */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {catalogo.map((produto) => {
          const salvando = salvandoIds.has(produto.id);
          const desfazer = desfazerPorProduto[produto.id] ?? null;
          const editandoEstePreco = editandoPrecoId === produto.id;
          const confirmandoEstePreco = confirmacaoPreco?.produto.id === produto.id;

          return (
            <article
              key={produto.id}
              className={`rounded-3xl p-6 sm:p-7 transition-all flex flex-col justify-between gap-5 shadow-sm ${
                produto.disponivel
                  ? 'bg-papel border-2 border-borda text-chocolate'
                  : 'bg-creme/90 border-2 border-erro/60 text-chocolate-suave'
              }`}
            >
              <div className="space-y-4">
                {/* Ilustração autoral FotoSabor + Nome e Status */}
                <div className="flex items-start gap-5">
                  <FotoSabor
                    nome={produto.nome}
                    fotoUrl={produto.fotoUrl}
                    sizes="96px"
                    className={`w-24 h-24 rounded-2xl border border-borda shrink-0 ${
                      !produto.disponivel ? 'grayscale opacity-65' : ''
                    }`}
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-caramelo">
                        {obterSeloDoce(produto.nome)}
                      </span>
                      {produto.disponivel ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-sucesso-fundo text-sucesso border border-sucesso/40 text-[16px] font-extrabold">
                          Disponível no site
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-erro text-papel text-[16px] font-extrabold">
                          Pausado no site
                        </span>
                      )}
                    </div>

                    <h3 className="font-titulo text-[28px] sm:text-[30px] font-bold text-chocolate leading-tight">
                      {produto.nome}
                    </h3>

                    {produto.descricao && (
                      <p className="text-[19px] text-chocolate-suave mt-1 leading-snug">
                        {produto.descricao}
                      </p>
                    )}
                  </div>
                </div>

                {/* Faixa de Desfazer (~10s) quando muda Tem / Acabou */}
                {desfazer && (
                  <div
                    role="status"
                    className="p-4 rounded-2xl bg-alerta-fundo border-2 border-alerta text-chocolate flex flex-wrap items-center justify-between gap-3"
                  >
                    <span className="text-[19px] font-bold">
                      Pronto! O site já mostra que{' '}
                      {produto.disponivel
                        ? `tem ${produto.nome}.`
                        : `o ${produto.nome} acabou.`}
                    </span>
                    <button
                      type="button"
                      disabled={salvando}
                      onClick={() => aoDesfazerDisponivel(desfazer)}
                      className="min-h-14 px-5 py-2 rounded-xl bg-papel text-chocolate border-2 border-chocolate font-extrabold text-[19px] cursor-pointer"
                    >
                      Desfazer
                    </button>
                  </div>
                )}

                {/* Interruptor Enorme: TEM (verde) / ACABOU (vermelho) */}
                <div
                  role="group"
                  aria-label={`Disponibilidade de ${produto.nome}`}
                  className="grid grid-cols-2 gap-4 pt-1"
                >
                  <button
                    type="button"
                    disabled={salvando}
                    aria-pressed={produto.disponivel}
                    onClick={() => {
                      if (!produto.disponivel) {
                        aoAlternarDisponivel(produto, true);
                      }
                    }}
                    className={`min-h-[68px] px-5 py-3.5 rounded-2xl text-[23px] font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      produto.disponivel
                        ? 'bg-sucesso text-papel border-2 border-sucesso shadow-sm ring-4 ring-sucesso/20'
                        : 'bg-papel text-chocolate border-2 border-borda hover:border-sucesso/50 active:bg-sucesso-fundo'
                    }`}
                  >
                    <span>Tem hoje</span>
                  </button>

                  <button
                    type="button"
                    disabled={salvando}
                    aria-pressed={!produto.disponivel}
                    onClick={() => {
                      if (produto.disponivel) {
                        aoAlternarDisponivel(produto, false);
                      }
                    }}
                    className={`min-h-[68px] px-5 py-3.5 rounded-2xl text-[23px] font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      !produto.disponivel
                        ? 'bg-erro text-papel border-2 border-erro shadow-sm ring-4 ring-erro/20'
                        : 'bg-papel text-chocolate border-2 border-borda hover:border-erro/50 active:bg-erro-fundo'
                    }`}
                  >
                    <span>Acabou</span>
                  </button>
                </div>
              </div>

              {/* Preço unitário e botão Mudar Preço */}
              <div className="pt-4 border-t border-borda space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <span className="block text-[17px] font-bold uppercase tracking-wider text-chocolate-suave">
                      Preço avulso
                    </span>
                    <span className="font-titulo text-[28px] font-bold text-chocolate">
                      {formatarReais(produto.precoCentavos)}
                    </span>
                  </div>

                  {!editandoEstePreco && (
                    <button
                      type="button"
                      disabled={salvando}
                      onClick={() => abrirEdicaoPreco(produto)}
                      className="min-h-14 px-5 py-2.5 rounded-2xl bg-creme text-chocolate border-2 border-borda hover:border-caramelo font-extrabold text-[19px] inline-flex items-center gap-2 active:bg-doce-de-leite/40 cursor-pointer"
                    >
                      <span>Mudar preço</span>
                    </button>
                  )}
                </div>

                {/* Formulário grande para digitar o novo preço */}
                {editandoEstePreco && !confirmandoEstePreco && (
                  <form
                    onSubmit={(e) => prepararConfirmacaoPreco(produto, e)}
                    className="p-5 rounded-2xl bg-creme border-2 border-caramelo space-y-4"
                  >
                    <label
                      htmlFor={`novo-preco-${produto.id}`}
                      className="block text-[21px] font-extrabold text-chocolate"
                    >
                      Novo preço para {produto.nome} (em R$):
                    </label>
                    <input
                      id={`novo-preco-${produto.id}`}
                      type="text"
                      inputMode="decimal"
                      value={textoPreco}
                      onChange={(e) => {
                        setTextoPreco(e.target.value);
                        if (erroPreco) setErroPreco(null);
                      }}
                      placeholder="Ex.: 4,50"
                      autoFocus
                      className="w-full min-h-16 px-5 py-3 rounded-2xl bg-papel text-chocolate border-2 border-chocolate/50 text-[26px] font-extrabold focus:border-caramelo focus:outline-none"
                    />

                    {erroPreco && (
                      <p role="alert" className="text-[19px] font-bold text-erro">
                        {erroPreco}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-4">
                      <button
                        type="submit"
                        className="flex-1 min-h-14 px-6 py-3 rounded-2xl bg-caramelo text-papel font-extrabold text-[21px] cursor-pointer"
                      >
                        Continuar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditandoPrecoId(null);
                          setErroPreco(null);
                        }}
                        className="min-h-14 px-6 py-3 rounded-2xl bg-papel text-chocolate border-2 border-borda font-bold text-[20px] cursor-pointer"
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                )}

                {/* Confirmação explícita: "De R$ 4,00 para R$ 4,50?" */}
                {confirmandoEstePreco && confirmacaoPreco && (
                  <div
                    role="alertdialog"
                    aria-label={`Confirmar novo preço de ${produto.nome}`}
                    className="p-5 rounded-2xl bg-alerta-fundo border-2 border-alerta space-y-4"
                  >
                    <p className="text-[22px] font-extrabold text-chocolate">
                      Mudar o preço de {produto.nome}?
                    </p>
                    <p className="text-[26px] font-extrabold text-caramelo">
                      De {formatarReais(produto.precoCentavos)} para{' '}
                      {formatarReais(confirmacaoPreco.novoPrecoCentavos)}?
                    </p>
                    <div className="flex flex-wrap gap-4 pt-1">
                      <button
                        type="button"
                        disabled={salvando}
                        onClick={() => void confirmarNovoPreco()}
                        className="flex-1 min-h-14 px-6 py-3 rounded-2xl bg-sucesso text-papel font-extrabold text-[21px] shadow-sm cursor-pointer"
                      >
                        Sim, salvar novo preço
                      </button>
                      <button
                        type="button"
                        disabled={salvando}
                        onClick={() => setConfirmacaoPreco(null)}
                        className="min-h-14 px-6 py-3 rounded-2xl bg-papel text-chocolate border-2 border-chocolate font-bold text-[20px] cursor-pointer"
                      >
                        Voltar
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
