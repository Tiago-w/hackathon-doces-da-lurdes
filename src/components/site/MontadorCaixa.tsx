'use client';
import { useRouter } from 'next/navigation';
import { useMemo, useRef, useState } from 'react';
import type { Produto } from '@/lib/contrato';
import { QUANTIDADE_CAIXA } from '@/lib/contrato';
import { formatarReais } from '@/lib/dinheiro';
import { calcularPedido } from '@/app/(site)/_dados';
import { paraItens, totalUnidades, useCarrinho } from './carrinho';
import { ListaSabores } from './ListaSabores';
import { botaoPrincipal } from './estilos';
import { IconeAlerta, IconeCheck } from './icones';

interface Props {
  produtos: Produto[];
  precoCaixaCentavos: number;
}

export function MontadorCaixa({ produtos, precoCaixaCentavos }: Props) {
  const router = useRouter();
  const { caixa, definirQuantidade, limpar, escolherTipo, pronto } = useCarrinho();
  const [confirmandoLimpar, setConfirmandoLimpar] = useState(false);
  const [verificando, setVerificando] = useState(false);
  const [errosPorProduto, setErrosPorProduto] = useState<Record<string, string>>({});
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [esgotadosAgora, setEsgotadosAgora] = useState<Set<string>>(new Set());
  const avisoRef = useRef<HTMLDivElement>(null);

  const total = totalUnidades(caixa);
  const faltam = QUANTIDADE_CAIXA - total;
  const completa = total === QUANTIDADE_CAIXA;
  const disponiveis = useMemo(() => new Set(produtos.filter((p) => p.disponivel).map((p) => p.id)), [produtos]);
  const temEsgotadoNaCaixa = Object.keys(caixa).some((id) => !disponiveis.has(id) || esgotadosAgora.has(id));

  function mudar(produtoId: string, nova: number) {
    const atual = caixa[produtoId] ?? 0;
    // Nunca passa de 50: o "+" só soma o que ainda cabe.
    const limite = atual + Math.max(0, QUANTIDADE_CAIXA - total);
    definirQuantidade('CAIXA_50', produtoId, Math.max(0, Math.min(nova, limite)));
    if (errosPorProduto[produtoId] && nova < atual) {
      setErrosPorProduto(({ [produtoId]: _removido, ...resto }) => {
        void _removido;
        return resto;
      });
    }
    setErroGeral(null);
  }

  function preencherSugestao(modo: 'classica' | 'ovos') {
    const disp = produtos.filter((p) => p.disponivel && !esgotadosAgora.has(p.id));
    if (disp.length === 0) return;
    limpar('CAIXA_50');
    setErrosPorProduto({});
    setErroGeral(null);

    const alvos = modo === 'ovos' ? disp.slice(0, Math.min(5, disp.length)) : disp;
    const base = Math.floor(QUANTIDADE_CAIXA / alvos.length);
    let sobra = QUANTIDADE_CAIXA - base * alvos.length;

    for (const p of alvos) {
      const extra = sobra > 0 ? 1 : 0;
      sobra -= extra;
      definirQuantidade('CAIXA_50', p.id, base + extra);
    }
  }

  async function continuar() {
    if (!completa || verificando) return;
    setVerificando(true);
    setErroGeral(null);
    try {
      const r = await calcularPedido({ tipo: 'CAIXA_50', itens: paraItens(caixa) });
      const porProduto: Record<string, string> = {};
      for (const e of r.erros) if (e.produtoId) porProduto[e.produtoId] = e.mensagem;
      const errosItens = r.erros.filter((e) => !e.produtoId && e.campo === 'itens');
      if (Object.keys(porProduto).length || errosItens.length) {
        setErrosPorProduto(porProduto);
        setEsgotadosAgora((s) => new Set([...s, ...Object.keys(porProduto)]));
        setErroGeral(
          errosItens[0]?.mensagem ??
            'Um dos sabores acabou agora há pouco. Troque por outro sabor e toque em Continuar de novo.',
        );
        const primeiro = Object.keys(porProduto)[0];
        if (primeiro) document.getElementById(`item-${primeiro}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        avisoRef.current?.focus();
        return;
      }
      escolherTipo('CAIXA_50');
      router.push('/pedido/finalizar');
    } catch {
      setErroGeral('Não conseguimos conferir a caixa. Verifique a internet e tente de novo.');
    } finally {
      setVerificando(false);
    }
  }

  const motivo = !completa
    ? faltam > 0
      ? `Escolha mais ${faltam} ${faltam === 1 ? 'doce' : 'doces'} para continuar.`
      : `A caixa tem ${total} doces. Tire ${-faltam} para continuar.`
    : temEsgotadoNaCaixa
      ? 'Troque o sabor que acabou para continuar.'
      : null;

  return (
    <>
      {/* Atalhos inteligentes para preencher ou limpar a caixa */}
      <div className="mb-5 rounded-2xl border border-borda bg-papel p-4 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-caramelo">Preenchimento Rápido</p>
            <p className="text-sm text-chocolate-suave">Quer uma sugestão pronta da dona Lurdes? Preencha os 50 doces com 1 toque e ajuste como quiser.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => preencherSugestao('classica')}
              className="min-h-10 rounded-xl border border-caramelo/40 bg-doce-de-leite/35 px-3.5 py-2 text-xs font-bold text-chocolate transition-colors hover:bg-doce-de-leite/65 cursor-pointer"
            >
              Sugestão Clássica Sortida (50 un.)
            </button>
            <button
              type="button"
              onClick={() => preencherSugestao('ovos')}
              className="min-h-10 rounded-xl border border-borda bg-creme px-3.5 py-2 text-xs font-bold text-chocolate transition-colors hover:border-caramelo cursor-pointer"
            >
              Top 5 Tradicionais (10 de cada)
            </button>
            {total > 0 &&
              (confirmandoLimpar ? (
                <div role="group" aria-label="Confirmar limpar a caixa" className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    className="min-h-10 rounded-xl bg-erro px-3 py-2 text-xs font-bold text-white cursor-pointer"
                    onClick={() => {
                      limpar('CAIXA_50');
                      setConfirmandoLimpar(false);
                      setErrosPorProduto({});
                      setErroGeral(null);
                    }}
                  >
                    Confirmar limpeza
                  </button>
                  <button
                    type="button"
                    className="min-h-10 rounded-xl border border-borda bg-papel px-3 py-2 text-xs font-bold cursor-pointer"
                    onClick={() => setConfirmandoLimpar(false)}
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="min-h-10 rounded-xl border border-borda bg-papel px-3 py-2 text-xs font-semibold text-chocolate-suave hover:border-erro hover:text-erro cursor-pointer"
                  onClick={() => setConfirmandoLimpar(true)}
                >
                  Zerar caixa
                </button>
              ))}
          </div>
        </div>
      </div>

      {erroGeral && (
        <div
          ref={avisoRef}
          tabIndex={-1}
          role="alert"
          className="mb-4 flex items-start gap-2 rounded-2xl border-2 border-erro bg-erro-fundo p-4 text-base font-bold text-erro"
        >
          <IconeAlerta className="mt-0.5 size-5 shrink-0" />
          {erroGeral}
        </div>
      )}

      {pronto ? (
        <ListaSabores
          produtos={produtos}
          quantidades={caixa}
          restante={Math.max(0, faltam)}
          onMudar={mudar}
          atalhos
          errosPorProduto={errosPorProduto}
          esgotadosAgora={esgotadosAgora}
        />
      ) : (
        <p className="py-10 text-center text-base text-chocolate-suave">Carregando os sabores...</p>
      )}

      {/* Barra fixa inferior de progresso da Caixa de 50 */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-borda bg-papel/95 backdrop-blur-md shadow-[0_-8px_30px_rgba(44,24,16,0.12)]">
        <div className="mx-auto max-w-2xl px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
          <div className="flex items-baseline justify-between gap-2">
            <div className="flex items-center gap-2">
              <p className="font-titulo text-2xl font-bold tabular-nums text-chocolate" aria-live="polite" aria-atomic="true">
                {total} <span className="text-base font-normal text-chocolate-suave">de {QUANTIDADE_CAIXA} doces</span>
                <span className="sr-only">. {completa ? 'Caixa completa!' : `Faltam ${faltam} doces.`}</span>
              </p>
              {completa && (
                <span className="inline-flex items-center gap-1 rounded-full bg-sucesso-fundo px-2.5 py-0.5 text-xs font-bold text-sucesso">
                  <IconeCheck className="size-3.5" /> Completa
                </span>
              )}
            </div>
            <p className="font-titulo text-lg font-bold text-chocolate">Total da caixa: {formatarReais(precoCaixaCentavos)}</p>
          </div>

          <div
            role="progressbar"
            aria-label="Doces na caixa"
            aria-valuemin={0}
            aria-valuemax={QUANTIDADE_CAIXA}
            aria-valuenow={total}
            className="mt-2 h-2.5 overflow-hidden rounded-full bg-borda/70"
          >
            <div
              className={`h-full rounded-full transition-[width] duration-200 ${completa ? 'bg-sucesso' : 'bg-caramelo'}`}
              style={{ width: `${Math.min(100, (total / QUANTIDADE_CAIXA) * 100)}%` }}
            />
          </div>

          <div className="mt-2.5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className={`text-sm font-semibold ${completa ? 'text-sucesso' : 'text-chocolate-suave'}`} aria-hidden>
              {completa ? 'Caixa de 50 doces completa! Pronta para escolher a entrega.' : `Adicione mais ${faltam} ${faltam === 1 ? 'doce' : 'doces'} para fechar a caixa.`}
            </p>
            <button
              type="button"
              className={`${botaoPrincipal} w-full sm:w-auto sm:min-w-52`}
              disabled={!completa || temEsgotadoNaCaixa || verificando}
              aria-describedby={motivo ? 'motivo-continuar' : undefined}
              onClick={continuar}
            >
              {verificando ? 'Conferindo os sabores...' : 'Continuar para Entrega'}
            </button>
          </div>
          {motivo && (
            <p id="motivo-continuar" className="sr-only">
              {motivo}
            </p>
          )}
        </div>
      </div>
    </>
  );
}
