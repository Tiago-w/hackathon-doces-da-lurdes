'use client';
import type { Produto } from '@/lib/contrato';
import { formatarReais } from '@/lib/dinheiro';
import { FotoSabor, obterSeloDoce } from './FotoSabor';
import { IconeAlerta, IconeMais, IconeMenos } from './icones';
import type { Quantidades } from './carrinho';
import { AVISO_ESGOTADO } from './textos';

interface Props {
  produtos: Produto[];
  quantidades: Quantidades;
  /** Quantas unidades ainda cabem (Caixa: 50 - total). Quando chega a 0, todo "+" trava. */
  restante: number;
  onMudar: (produtoId: string, novaQuantidade: number) => void;
  /** Mostra os atalhos "+5" e "+10" (Caixa de 50). */
  atalhos?: boolean;
  /** Mostra o preço unitário e o subtotal do sabor (avulsos). */
  mostrarPreco?: boolean;
  /** Erros do servidor por sabor (ex.: "O Quindim acabou agora há pouco"). */
  errosPorProduto?: Record<string, string>;
  /** Sabores que o servidor disse que acabaram depois que a página abriu. */
  esgotadosAgora?: Set<string>;
}

const botaoQtd =
  'inline-flex size-11 shrink-0 items-center justify-center rounded-xl border text-chocolate transition-colors cursor-pointer disabled:cursor-not-allowed disabled:border-borda disabled:bg-creme disabled:text-chocolate-suave/40';

export function ListaSabores({
  produtos,
  quantidades,
  restante,
  onMudar,
  atalhos = false,
  mostrarPreco = false,
  errosPorProduto = {},
  esgotadosAgora,
}: Props) {
  return (
    <ul className="flex flex-col gap-3">
      {produtos.map((p) => {
        const q = quantidades[p.id] ?? 0;
        const esgotado = !p.disponivel || (esgotadosAgora?.has(p.id) ?? false);
        const erro = errosPorProduto[p.id];
        const podeMais = !esgotado && restante > 0;
        const idNome = `sabor-${p.id}`;
        const idAviso = `aviso-${p.id}`;
        const seloCategoria = obterSeloDoce(p.nome);

        return (
          <li
            key={p.id}
            id={`item-${p.id}`}
            className={`rounded-2xl border p-4 transition-all ${
              erro
                ? 'border-2 border-erro bg-erro-fundo'
                : esgotado
                  ? 'border-borda bg-creme/70'
                  : q > 0
                    ? 'border-2 border-caramelo bg-papel shadow-xs'
                    : 'border-borda bg-papel hover:border-caramelo/40'
            }`}
          >
            <div className="flex items-start gap-4">
              <FotoSabor
                nome={p.nome}
                fotoUrl={p.fotoUrl}
                sizes="80px"
                className={`size-20 shrink-0 rounded-xl border border-borda/60 ${esgotado ? 'opacity-50 grayscale' : ''}`}
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-caramelo">{seloCategoria}</span>
                  {mostrarPreco && (
                    <span className="font-titulo text-base font-bold text-chocolate">{formatarReais(p.precoCentavos)} / un.</span>
                  )}
                </div>
                <h3 id={idNome} className={`font-titulo text-xl font-bold leading-snug ${esgotado ? 'text-chocolate-suave' : 'text-chocolate'}`}>
                  {p.nome}
                </h3>
                {p.descricao && <p className="mt-0.5 text-sm text-chocolate-suave line-clamp-2">{p.descricao}</p>}
                {esgotado && (
                  <p id={idAviso} className="mt-1.5 inline-flex items-center gap-1 rounded-lg bg-erro-fundo px-2.5 py-0.5 text-xs font-bold text-erro">
                    <IconeAlerta className="size-3.5 shrink-0" />
                    {AVISO_ESGOTADO}
                  </p>
                )}
              </div>
            </div>

            {erro && (
              <p role="alert" className="mt-3 flex items-start gap-2 text-sm font-bold text-erro">
                <IconeAlerta className="mt-0.5 size-4 shrink-0" />
                {erro}
              </p>
            )}

            {(!esgotado || q > 0) && (
              <div className="mt-3.5 flex flex-wrap items-center gap-2 border-t border-borda/60 pt-3" role="group" aria-labelledby={idNome}>
                <button
                  type="button"
                  className={`${botaoQtd} border-borda bg-papel hover:border-caramelo hover:bg-creme`}
                  onClick={() => onMudar(p.id, q - 1)}
                  disabled={q === 0}
                  aria-label={`Tirar um ${p.nome}`}
                >
                  <IconeMenos />
                </button>
                <output
                  className="min-w-10 text-center font-titulo text-xl font-bold tabular-nums text-chocolate"
                  aria-live="polite"
                  aria-label={`${q} ${p.nome}`}
                >
                  {q}
                </output>
                <button
                  type="button"
                  className={`${botaoQtd} border-caramelo bg-caramelo text-white hover:bg-caramelo-escuro`}
                  onClick={() => onMudar(p.id, q + 1)}
                  disabled={!podeMais}
                  aria-label={`Pôr mais um ${p.nome}`}
                  aria-describedby={esgotado ? idAviso : undefined}
                >
                  <IconeMais />
                </button>
                {atalhos &&
                  [5, 10].map((n) => (
                    <button
                      key={n}
                      type="button"
                      className={`${botaoQtd} w-auto min-w-12 border-caramelo/40 bg-doce-de-leite/25 px-3 text-sm font-bold text-chocolate hover:bg-doce-de-leite/55`}
                      onClick={() => onMudar(p.id, q + Math.min(n, restante))}
                      disabled={!podeMais}
                      aria-label={`Pôr mais ${n} ${p.nome}`}
                    >
                      +{n}
                    </button>
                  ))}
                {mostrarPreco && q > 0 && (
                  <span className="ml-auto font-titulo text-base font-bold text-chocolate">
                    Subtotal: {formatarReais(q * p.precoCentavos)}
                  </span>
                )}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
