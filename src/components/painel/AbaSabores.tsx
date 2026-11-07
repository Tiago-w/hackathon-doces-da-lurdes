'use client';

import { useState } from 'react';
import type { Produto } from '@/lib/contrato';
import { formatarReais, lerReais } from '@/lib/dinheiro';

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

function iconeDoSabor(nome: string): string {
  const n = nome.toLowerCase();
  if (n.includes('quindim')) return '🍮';
  if (n.includes('camafeu')) return '🌰';
  if (n.includes('bem-casado') || n.includes('bem casado')) return '🎀';
  if (n.includes('brigadeiro')) return '🍫';
  if (n.includes('olho de sogra')) return '🍑';
  if (n.includes('santa clara') || n.includes('pastel')) return '🥟';
  if (n.includes('trouxinha')) return '🍯';
  if (n.includes('queijadinha')) return '🧀';
  return '🍬';
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
        <p className="text-[22px] font-bold text-chocolate">
          🍬 Toque em <span className="text-erro font-extrabold">Acabou</span> quando faltar um doce, ou em{' '}
          <span className="text-sucesso font-extrabold">Tem</span> quando voltar.
        </p>
        <div className="flex flex-wrap gap-3 text-[20px] font-extrabold">
          <span className="px-4 py-2 rounded-xl bg-sucesso-fundo text-sucesso border border-sucesso/40">
            ✅ {qtdDisponiveis} com estoque
          </span>
          {qtdEsgotados > 0 && (
            <span className="px-4 py-2 rounded-xl bg-erro-fundo text-erro border border-erro/40">
              🚫 {qtdEsgotados} acabou
            </span>
          )}
        </div>
      </div>

      {/* Mensagem de confirmação grande depois de salvar */}
      {mensagemConfirmacao && (
        <div
          role="status"
          aria-live="polite"
          className="p-5 rounded-2xl bg-sucesso-fundo border-3 border-sucesso text-sucesso text-[24px] font-extrabold flex items-center gap-3 shadow-sm"
        >
          <span aria-hidden="true" className="text-[30px]">
            ✅
          </span>
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
              className={`rounded-3xl p-6 sm:p-7 transition-all flex flex-col justify-between gap-5 shadow-md ${
                produto.disponivel
                  ? 'bg-papel border-3 border-borda text-chocolate'
                  : 'bg-creme/90 border-3 border-erro/60 text-chocolate-suave opacity-90'
              }`}
            >
              <div className="space-y-4">
                {/* Foto ou Placeholder bonito + Nome e Preço */}
                <div className="flex items-start gap-5">
                  {produto.fotoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={produto.fotoUrl}
                      alt={produto.nome}
                      className={`w-24 h-24 rounded-2xl object-cover border-2 border-borda shrink-0 ${
                        !produto.disponivel ? 'grayscale' : ''
                      }`}
                    />
                  ) : (
                    <div
                      aria-hidden="true"
                      className={`w-24 h-24 rounded-2xl flex items-center justify-center text-[48px] shrink-0 border-2 ${
                        produto.disponivel
                          ? 'bg-doce-de-leite/35 border-caramelo/40'
                          : 'bg-borda/60 border-borda grayscale'
                      }`}
                    >
                      {iconeDoSabor(produto.nome)}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      {produto.disponivel ? (
                        <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-xl bg-sucesso-fundo text-sucesso border border-sucesso/50 text-[19px] font-extrabold">
                          <span aria-hidden="true">✅</span>
                          <span>Tem no site</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-xl bg-erro text-papel text-[19px] font-extrabold">
                          <span aria-hidden="true">🚫</span>
                          <span>Acabou (bloqueado no site)</span>
                        </span>
                      )}
                    </div>

                    <h3 className="text-[28px] sm:text-[30px] font-extrabold text-chocolate leading-tight">
                      {produto.nome}
                    </h3>

                    {produto.descricao && (
                      <p className="text-[20px] text-chocolate-suave mt-1 leading-snug">
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
                    <span className="text-[20px] font-bold">
                      Pronto! O site já mostra que{' '}
                      {produto.disponivel
                        ? `tem ${produto.nome}.`
                        : `o ${produto.nome} acabou.`}
                    </span>
                    <button
                      type="button"
                      disabled={salvando}
                      onClick={() => aoDesfazerDisponivel(desfazer)}
                      className="min-h-16 px-5 py-2.5 rounded-2xl bg-papel text-chocolate border-2 border-chocolate font-extrabold text-[20px] cursor-pointer"
                    >
                      ↩️ Desfazer
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
                    className={`min-h-[72px] px-5 py-4 rounded-2xl text-[24px] font-extrabold flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
                      produto.disponivel
                        ? 'bg-sucesso text-papel border-3 border-sucesso shadow-md ring-4 ring-sucesso/25'
                        : 'bg-papel text-chocolate border-2 border-borda active:bg-sucesso-fundo'
                    }`}
                  >
                    <span aria-hidden="true" className="text-[28px]">
                      ✅
                    </span>
                    <span>Tem</span>
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
                    className={`min-h-[72px] px-5 py-4 rounded-2xl text-[24px] font-extrabold flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
                      !produto.disponivel
                        ? 'bg-erro text-papel border-3 border-erro shadow-md ring-4 ring-erro/25'
                        : 'bg-papel text-chocolate border-2 border-borda active:bg-erro-fundo'
                    }`}
                  >
                    <span aria-hidden="true" className="text-[28px]">
                      🚫
                    </span>
                    <span>Acabou</span>
                  </button>
                </div>
              </div>

              {/* Preço unitário e botão Mudar Preço */}
              <div className="pt-4 border-t-2 border-borda space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <span className="block text-[19px] font-bold text-chocolate-suave">
                      Preço da unidade
                    </span>
                    <span className="text-[30px] font-extrabold text-chocolate">
                      {formatarReais(produto.precoCentavos)}
                    </span>
                  </div>

                  {!editandoEstePreco && (
                    <button
                      type="button"
                      disabled={salvando}
                      onClick={() => abrirEdicaoPreco(produto)}
                      className="min-h-16 px-6 py-3 rounded-2xl bg-creme text-chocolate border-2 border-chocolate/40 font-extrabold text-[21px] inline-flex items-center gap-2 active:bg-doce-de-leite/40 cursor-pointer"
                    >
                      <span aria-hidden="true">✏️</span>
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
                      className="block text-[22px] font-extrabold text-chocolate"
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
                      className="w-full min-h-16 px-5 py-3 rounded-2xl bg-papel text-chocolate border-3 border-chocolate/50 text-[28px] font-extrabold focus:border-caramelo focus:outline-none"
                    />

                    {erroPreco && (
                      <p role="alert" className="text-[20px] font-bold text-erro">
                        ⚠️ {erroPreco}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-4">
                      <button
                        type="submit"
                        className="flex-1 min-h-16 px-6 py-3 rounded-2xl bg-caramelo text-papel font-extrabold text-[22px] cursor-pointer"
                      >
                        Continuar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditandoPrecoId(null);
                          setErroPreco(null);
                        }}
                        className="min-h-16 px-6 py-3 rounded-2xl bg-papel text-chocolate border-2 border-borda font-bold text-[21px] cursor-pointer"
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
                    className="p-5 rounded-2xl bg-alerta-fundo border-3 border-alerta space-y-4"
                  >
                    <p className="text-[24px] font-extrabold text-chocolate">
                      Mudar o preço de {produto.nome}?
                    </p>
                    <p className="text-[28px] font-extrabold text-caramelo">
                      De {formatarReais(produto.precoCentavos)} para{' '}
                      {formatarReais(confirmacaoPreco.novoPrecoCentavos)}?
                    </p>
                    <div className="flex flex-wrap gap-4 pt-1">
                      <button
                        type="button"
                        disabled={salvando}
                        onClick={() => void confirmarNovoPreco()}
                        className="flex-1 min-h-16 px-6 py-3 rounded-2xl bg-sucesso text-papel font-extrabold text-[22px] shadow-sm cursor-pointer"
                      >
                        ✅ Sim, salvar novo preço
                      </button>
                      <button
                        type="button"
                        disabled={salvando}
                        onClick={() => setConfirmacaoPreco(null)}
                        className="min-h-16 px-6 py-3 rounded-2xl bg-papel text-chocolate border-2 border-chocolate font-bold text-[21px] cursor-pointer"
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
