'use client';
import type { Produto } from '@/lib/contrato';
import { formatarReais } from '@/lib/dinheiro';
import { FotoSabor } from './FotoSabor';
import { IconeAlerta, IconeMais, IconeMenos } from './icones';
import type { Quantidades } from './carrinho';

export const AVISO_ESGOTADO = 'Acabou por hoje: falta ingrediente fresco';

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
  'inline-flex size-14 shrink-0 items-center justify-center rounded-2xl border-2 text-chocolate transition-colors disabled:cursor-not-allowed disabled:border-borda disabled:bg-creme disabled:text-chocolate-suave/50';

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
        return (
          <li
            key={p.id}
            id={`item-${p.id}`}
            className={`rounded-3xl border-2 p-4 ${
              erro ? 'border-erro bg-erro-fundo' : esgotado ? 'border-borda bg-creme' : q > 0 ? 'border-caramelo bg-papel' : 'border-borda bg-papel'
            }`}
          >
            <div className="flex items-center gap-3">
              <FotoSabor
                nome={p.nome}
                fotoUrl={p.fotoUrl}
                sizes="72px"
                className={`size-18 shrink-0 rounded-2xl ${esgotado ? 'opacity-50 grayscale' : ''}`}
              />
              <div className="min-w-0 flex-1">
                <h3 id={idNome} className={`text-xl font-bold leading-tight ${esgotado ? 'text-chocolate-suave' : 'text-chocolate'}`}>
                  {p.nome}
                </h3>
                {mostrarPreco && <p className="text-lg text-chocolate-suave">{formatarReais(p.precoCentavos)} cada</p>}
                {esgotado && (
                  <p id={idAviso} className="mt-1 inline-flex items-center gap-1 rounded-lg bg-erro-fundo px-2 py-0.5 text-base font-bold text-erro">
                    <IconeAlerta className="size-4 shrink-0" />
                    {AVISO_ESGOTADO}
                  </p>
                )}
              </div>
            </div>

            {erro && (
              <p role="alert" className="mt-3 flex items-start gap-2 text-lg font-bold text-erro">
                <IconeAlerta className="mt-0.5 size-5 shrink-0" />
                {erro}
              </p>
            )}

            {(!esgotado || q > 0) && (
              <div className="mt-3 flex flex-wrap items-center gap-2" role="group" aria-labelledby={idNome}>
                <button
                  type="button"
                  className={`${botaoQtd} border-caramelo bg-papel hover:bg-creme`}
                  onClick={() => onMudar(p.id, q - 1)}
                  disabled={q === 0}
                  aria-label={`Tirar um ${p.nome}`}
                >
                  <IconeMenos />
                </button>
                <output
                  className="min-w-12 text-center text-2xl font-bold tabular-nums text-chocolate"
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
                      className={`${botaoQtd} w-auto min-w-14 border-caramelo bg-papel px-3 text-lg font-bold text-caramelo hover:bg-creme`}
                      onClick={() => onMudar(p.id, q + Math.min(n, restante))}
                      disabled={!podeMais}
                      aria-label={`Pôr mais ${n} ${p.nome}`}
                    >
                      +{n}
                    </button>
                  ))}
                {mostrarPreco && q > 0 && (
                  <span className="ml-auto text-lg font-bold text-chocolate">{formatarReais(q * p.precoCentavos)}</span>
                )}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
