'use client';
import { useRouter } from 'next/navigation';
import { useMemo, useRef, useState } from 'react';
import type { Produto } from '@/lib/contrato';
import { QUANTIDADE_CAIXA } from '@/lib/contrato';
import { formatarReais } from '@/lib/dinheiro';
import { calcularPedido } from '@/app/(site)/_dados';
import { paraItens, totalUnidades, useCarrinho, type Quantidades } from './carrinho';
import { ListaSabores } from './ListaSabores';
import { botaoPrincipal, botaoSecundario } from './estilos';
import { IconeAlerta, IconeCaixa, IconeCheck } from './icones';

interface Props {
  produtos: Produto[];
  /** Vem do servidor (datasPermitidas[0].mesmoDia): ainda dá tempo de sair hoje. */
  podeSairHoje: boolean;
  horarioCorte: string;
}

export function MontadorAvulso({ produtos, podeSairHoje, horarioCorte }: Props) {
  const router = useRouter();
  const { avulso, definirQuantidade, substituir, escolherTipo, pronto } = useCarrinho();
  const [verificando, setVerificando] = useState(false);
  const [errosPorProduto, setErrosPorProduto] = useState<Record<string, string>>({});
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [esgotadosAgora, setEsgotadosAgora] = useState<Set<string>>(new Set());
  const [hojeAgora, setHojeAgora] = useState(podeSairHoje);
  const avisoRef = useRef<HTMLDivElement>(null);

  const porId = useMemo(() => new Map(produtos.map((p) => [p.id, p])), [produtos]);
  const total = totalUnidades(avulso);
  // Só para mostrar enquanto escolhe. O valor que vale é o que o servidor calcula no "Finalizar".
  const subtotal = Object.entries(avulso).reduce((s, [id, q]) => s + q * (porId.get(id)?.precoCentavos ?? 0), 0);
  const chegouNaCaixa = total >= QUANTIDADE_CAIXA;
  const temEsgotado = Object.keys(avulso).some((id) => !porId.get(id)?.disponivel || esgotadosAgora.has(id));

  function mudar(produtoId: string, nova: number) {
    const atual = avulso[produtoId] ?? 0;
    const limite = atual + Math.max(0, QUANTIDADE_CAIXA - total);
    definirQuantidade('AVULSO', produtoId, Math.max(0, Math.min(nova, limite)));
    if (errosPorProduto[produtoId] && nova < atual) {
      setErrosPorProduto(({ [produtoId]: _x, ...resto }) => (void _x, resto));
    }
    setErroGeral(null);
  }

  function levarParaCaixa() {
    const q: Quantidades = {};
    for (const [id, n] of Object.entries(avulso)) if (porId.get(id)?.disponivel) q[id] = n;
    substituir('CAIXA_50', q);
    router.push('/pedido/caixa');
  }

  async function continuar() {
    if (total === 0 || chegouNaCaixa || verificando) return;
    setVerificando(true);
    setErroGeral(null);
    try {
      const r = await calcularPedido({ tipo: 'AVULSO', itens: paraItens(avulso) });
      const porProduto: Record<string, string> = {};
      for (const e of r.erros) if (e.produtoId) porProduto[e.produtoId] = e.mensagem;
      const errosItens = r.erros.filter((e) => !e.produtoId && e.campo === 'itens');
      setHojeAgora(r.datasPermitidas[0]?.mesmoDia ?? false);
      if (Object.keys(porProduto).length || errosItens.length) {
        setErrosPorProduto(porProduto);
        setEsgotadosAgora((s) => new Set([...s, ...Object.keys(porProduto)]));
        setErroGeral(errosItens[0]?.mensagem ?? 'Um dos sabores acabou agora há pouco. Troque por outro sabor.');
        avisoRef.current?.focus();
        return;
      }
      escolherTipo('AVULSO');
      router.push('/pedido/finalizar');
    } catch {
      setErroGeral('Não conseguimos conferir os doces. Verifique a internet e tente de novo.');
    } finally {
      setVerificando(false);
    }
  }

  const motivo =
    total === 0
      ? 'Escolha pelo menos um doce para continuar.'
      : chegouNaCaixa
        ? 'Pedido avulso é de até 49 doces. Com 50, monte a Caixa de 50.'
        : temEsgotado
          ? 'Tire o sabor que acabou para continuar.'
          : null;

  return (
    <>
      {hojeAgora ? (
        <p className="mb-4 flex items-center gap-2 rounded-2xl bg-sucesso-fundo p-4 text-lg font-bold text-sucesso">
          <IconeCheck className="size-6 shrink-0" /> Pode sair hoje! Peça até as {horarioCorte.replace(':00', 'h')}.
        </p>
      ) : (
        <p className="mb-4 rounded-2xl border border-borda bg-papel p-4 text-lg">
          Hoje já passou do horário para sair no mesmo dia. Você escolhe a data a partir de amanhã.
        </p>
      )}

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
          quantidades={avulso}
          restante={Math.max(0, QUANTIDADE_CAIXA - total)}
          onMudar={mudar}
          mostrarPreco
          errosPorProduto={errosPorProduto}
          esgotadosAgora={esgotadosAgora}
        />
      ) : (
        <p className="py-10 text-center text-lg text-chocolate-suave">Carregando os sabores...</p>
      )}

      <div className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-caramelo bg-papel shadow-[0_-4px_16px_rgba(59,36,22,0.12)]">
        <div className="mx-auto max-w-2xl px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
          {chegouNaCaixa && (
            <div className="mb-3 rounded-2xl bg-doce-de-leite/40 p-3">
              <p className="text-lg font-bold">Com 50 doces vale mais a pena a Caixa de 50!</p>
              <button type="button" className={`${botaoSecundario} mt-2 w-full`} onClick={levarParaCaixa}>
                <IconeCaixa className="size-6" /> Levar meus sabores para a Caixa
              </button>
            </div>
          )}
          <p className="text-2xl font-bold tabular-nums" aria-live="polite" aria-atomic="true">
            {total} {total === 1 ? 'doce' : 'doces'} · {formatarReais(subtotal)}
          </p>
          <button
            type="button"
            className={`${botaoPrincipal} mt-2 w-full`}
            disabled={total === 0 || chegouNaCaixa || temEsgotado || verificando}
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
