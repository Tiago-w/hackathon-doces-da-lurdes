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
import { IconeAlerta } from './icones';

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
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-lg text-chocolate-suave">Toque em + para pôr doces na caixa.</p>
        {total > 0 &&
          (confirmandoLimpar ? (
            <div role="group" aria-label="Confirmar limpar a caixa" className="flex flex-wrap items-center gap-2">
              <span className="text-lg font-bold">Tirar todos os doces?</span>
              <button
                type="button"
                className="min-h-12 rounded-xl bg-erro px-4 font-bold text-white"
                onClick={() => {
                  limpar('CAIXA_50');
                  setConfirmandoLimpar(false);
                  setErrosPorProduto({});
                  setErroGeral(null);
                }}
              >
                Sim, limpar
              </button>
              <button type="button" className="min-h-12 rounded-xl border-2 border-borda bg-papel px-4 font-bold" onClick={() => setConfirmandoLimpar(false)}>
                Não
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="min-h-12 rounded-xl border-2 border-borda bg-papel px-4 font-bold text-chocolate hover:border-caramelo"
              onClick={() => setConfirmandoLimpar(true)}
            >
              Limpar caixa
            </button>
          ))}
      </div>

      {erroGeral && (
        <div
          ref={avisoRef}
          tabIndex={-1}
          role="alert"
          className="mb-4 flex items-start gap-2 rounded-2xl border-2 border-erro bg-erro-fundo p-4 text-lg font-bold text-erro"
        >
          <IconeAlerta className="mt-0.5 size-6 shrink-0" />
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
        <p className="py-10 text-center text-lg text-chocolate-suave">Carregando os sabores...</p>
      )}

      {/* Contador fixo no rodapé: sempre visível enquanto monta a caixa. */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-caramelo bg-papel shadow-[0_-4px_16px_rgba(59,36,22,0.12)]">
        <div className="mx-auto max-w-2xl px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-2xl font-bold tabular-nums text-chocolate" aria-live="polite" aria-atomic="true">
              {total} de {QUANTIDADE_CAIXA}
              <span className="sr-only">. {completa ? 'Caixa completa!' : `Faltam ${faltam} doces.`}</span>
            </p>
            <p className="text-lg font-bold text-chocolate">Caixa: {formatarReais(precoCaixaCentavos)}</p>
          </div>
          <div
            role="progressbar"
            aria-label="Doces na caixa"
            aria-valuemin={0}
            aria-valuemax={QUANTIDADE_CAIXA}
            aria-valuenow={total}
            className="mt-2 h-3 overflow-hidden rounded-full bg-borda"
          >
            <div
              className={`h-full rounded-full transition-[width] ${completa ? 'bg-sucesso' : 'bg-caramelo'}`}
              style={{ width: `${Math.min(100, (total / QUANTIDADE_CAIXA) * 100)}%` }}
            />
          </div>
          <p className={`mt-1 text-lg font-bold ${completa ? 'text-sucesso' : 'text-chocolate-suave'}`} aria-hidden>
            {completa ? 'Caixa completa! 🎉' : `Faltam ${faltam} doces`}
          </p>
          <button
            type="button"
            className={`${botaoPrincipal} mt-2 w-full`}
            disabled={!completa || temEsgotadoNaCaixa || verificando}
            aria-describedby={motivo ? 'motivo-continuar' : undefined}
            onClick={continuar}
          >
            {verificando ? 'Conferindo os sabores...' : 'Continuar'}
          </button>
          {motivo && (
            <p id="motivo-continuar" className="mt-1 text-center text-base text-chocolate-suave">
              {motivo}
            </p>
          )}
        </div>
      </div>
    </>
  );
}
