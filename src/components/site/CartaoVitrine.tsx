'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { Produto } from '@/lib/contrato';
import { QUANTIDADE_CAIXA } from '@/lib/contrato';
import { formatarReais } from '@/lib/dinheiro';
import { totalUnidades, useCarrinho } from './carrinho';
import { FotoSabor, obterSeloDoce } from './FotoSabor';
import { IconeAlerta, IconeCheck, IconeMais } from './icones';
import { AVISO_ESGOTADO } from './textos';

export function CartaoVitrine({
  produto,
  prioridade = false,
}: {
  produto: Produto;
  prioridade?: boolean;
}) {
  const router = useRouter();
  const { avulso, caixa, definirQuantidade } = useCarrinho();
  const [adicionado, setAdicionado] = useState<'AVULSO' | 'CAIXA' | null>(null);

  const esgotado = !produto.disponivel;
  const selo = obterSeloDoce(produto.nome);
  const qtdNoAvulso = avulso[produto.id] ?? 0;
  const qtdNaCaixa = caixa[produto.id] ?? 0;

  function adicionarRapidoAvulso() {
    if (esgotado) return;
    const totalAtual = totalUnidades(avulso);
    if (totalAtual >= QUANTIDADE_CAIXA - 1) {
      router.push('/pedido/avulso');
      return;
    }
    definirQuantidade('AVULSO', produto.id, qtdNoAvulso + 1);
    setAdicionado('AVULSO');
    setTimeout(() => setAdicionado(null), 1600);
  }

  function adicionarRapidoCaixa() {
    if (esgotado) return;
    const totalAtual = totalUnidades(caixa);
    const cabe = Math.max(0, QUANTIDADE_CAIXA - totalAtual);
    if (cabe === 0) {
      router.push('/pedido/caixa');
      return;
    }
    const incremento = Math.min(5, cabe);
    definirQuantidade('CAIXA_50', produto.id, qtdNaCaixa + incremento);
    setAdicionado('CAIXA');
    setTimeout(() => setAdicionado(null), 1600);
  }

  return (
    <article
      className={`group flex h-full flex-col overflow-hidden rounded-3xl border transition-all duration-300 ${
        esgotado
          ? 'border-borda bg-creme/70'
          : 'border-borda bg-papel shadow-[0_6px_24px_rgba(44,24,16,0.05)] hover:-translate-y-0.5 hover:border-caramelo/60 hover:shadow-[0_14px_34px_rgba(44,24,16,0.09)]'
      }`}
    >
      <div className="relative overflow-hidden border-b border-borda/60">
        <FotoSabor
          nome={produto.nome}
          fotoUrl={produto.fotoUrl}
          sizes="(min-width: 1024px) 340px, (min-width: 640px) 45vw, 92vw"
          prioridade={prioridade}
          className={`aspect-[16/11] w-full ${esgotado ? 'opacity-50 grayscale' : ''}`}
        />

        {/* Selo de ingrediente/tradição */}
        <span className="absolute right-3 top-3 rounded-full border border-borda/80 bg-papel/90 px-3 py-1 text-xs font-bold tracking-wide text-chocolate backdrop-blur-xs">
          {selo}
        </span>

        {esgotado ? (
          <span className="absolute left-3 top-3 rounded-full bg-erro px-3.5 py-1 text-xs font-extrabold uppercase tracking-wider text-white shadow-xs">
            Esgotado hoje
          </span>
        ) : (
          (qtdNoAvulso > 0 || qtdNaCaixa > 0) && (
            <span className="absolute left-3 top-3 rounded-full bg-sucesso px-3 py-1 text-xs font-bold text-white shadow-xs">
              {qtdNoAvulso > 0 ? `${qtdNoAvulso} no avulso` : `${qtdNaCaixa} na caixa`}
            </span>
          )
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-baseline justify-between gap-2">
          <h3
            className={`font-titulo text-xl font-bold leading-snug ${
              esgotado ? 'text-chocolate-suave' : 'text-chocolate'
            }`}
          >
            {produto.nome}
          </h3>
          <span className="shrink-0 text-lg font-extrabold tabular-nums text-caramelo">
            {formatarReais(produto.precoCentavos)}
          </span>
        </div>

        {produto.descricao && (
          <p className="mt-1.5 flex-1 text-sm sm:text-base leading-relaxed text-chocolate-suave">
            {produto.descricao}
          </p>
        )}

        {esgotado ? (
          <p className="mt-4 flex items-center gap-1.5 rounded-xl bg-erro-fundo px-3 py-2 text-sm font-bold text-erro">
            <IconeAlerta className="size-4 shrink-0" />
            <span>{AVISO_ESGOTADO}</span>
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-2 pt-3 border-t border-borda/70">
            <button
              type="button"
              onClick={adicionarRapidoAvulso}
              className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-borda bg-creme px-3 py-2 text-xs sm:text-sm font-bold text-chocolate transition-colors hover:border-caramelo hover:bg-doce-de-leite/35 cursor-pointer"
            >
              {adicionado === 'AVULSO' ? (
                <>
                  <IconeCheck className="size-4 text-sucesso" />
                  <span className="text-sucesso">Adicionado!</span>
                </>
              ) : (
                <>
                  <IconeMais className="size-4 text-caramelo" />
                  <span>Avulso (+1)</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={adicionarRapidoCaixa}
              className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-caramelo/10 border border-caramelo/30 px-3 py-2 text-xs sm:text-sm font-bold text-caramelo transition-colors hover:bg-caramelo hover:text-white cursor-pointer"
            >
              {adicionado === 'CAIXA' ? (
                <>
                  <IconeCheck className="size-4" />
                  <span>+5 na Caixa!</span>
                </>
              ) : (
                <>
                  <IconeMais className="size-4" />
                  <span>Caixa (+5)</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
