'use client';
/**
 * Carrinho do site: guarda o que a pessoa escolheu na Caixa de 50 e nos avulsos.
 * Fica salvo no localStorage para sobreviver a um recarregamento; se o navegador
 * bloquear o armazenamento, o site continua funcionando só na memória.
 *
 * Aqui só guardamos a INTENÇÃO (sabor e quantidade). Preço, frete e datas vêm do servidor.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { EntradaItem } from '@/lib/contrato';

export type TipoCarrinho = 'AVULSO' | 'CAIXA_50';
export type Quantidades = Record<string, number>;

interface EstadoCarrinho {
  caixa: Quantidades;
  avulso: Quantidades;
  /** Qual dos dois a pessoa levou para o "Finalizar". */
  tipoAtivo: TipoCarrinho | null;
}

const CHAVE = 'doces-da-lurdes:carrinho:v1';
const VAZIO: EstadoCarrinho = { caixa: {}, avulso: {}, tipoAtivo: null };

function limparQuantidades(valor: unknown): Quantidades {
  const q: Quantidades = {};
  if (valor && typeof valor === 'object') {
    for (const [id, n] of Object.entries(valor)) {
      if (typeof n === 'number' && Number.isInteger(n) && n > 0 && n <= 1000) q[id] = n;
    }
  }
  return q;
}

function ler(): EstadoCarrinho {
  try {
    const bruto = window.localStorage.getItem(CHAVE);
    if (!bruto) return VAZIO;
    const dado = JSON.parse(bruto) as Partial<EstadoCarrinho>;
    return {
      caixa: limparQuantidades(dado.caixa),
      avulso: limparQuantidades(dado.avulso),
      tipoAtivo: dado.tipoAtivo === 'AVULSO' || dado.tipoAtivo === 'CAIXA_50' ? dado.tipoAtivo : null,
    };
  } catch {
    return VAZIO;
  }
}

function gravar(estado: EstadoCarrinho) {
  try {
    window.localStorage.setItem(CHAVE, JSON.stringify(estado));
  } catch {
    // Sem armazenamento (aba anônima, bloqueio): segue só na memória.
  }
}

export function totalUnidades(q: Quantidades): number {
  return Object.values(q).reduce((soma, n) => soma + n, 0);
}

export function paraItens(q: Quantidades): EntradaItem[] {
  return Object.entries(q)
    .filter(([, n]) => n > 0)
    .map(([produtoId, quantidade]) => ({ produtoId, quantidade }));
}

interface ValorContexto extends EstadoCarrinho {
  /** false até ler o localStorage: evita redirecionar ou piscar antes da hora. */
  pronto: boolean;
  definirQuantidade: (tipo: TipoCarrinho, produtoId: string, quantidade: number) => void;
  limpar: (tipo: TipoCarrinho) => void;
  substituir: (tipo: TipoCarrinho, q: Quantidades) => void;
  escolherTipo: (tipo: TipoCarrinho | null) => void;
  esvaziarTudo: () => void;
}

const Contexto = createContext<ValorContexto | null>(null);

export function CarrinhoProvider({ children }: { children: React.ReactNode }) {
  const [estado, setEstado] = useState<EstadoCarrinho>(VAZIO);
  const [pronto, setPronto] = useState(false);

  useEffect(() => {
    setEstado(ler());
    setPronto(true);
  }, []);

  useEffect(() => {
    if (pronto) gravar(estado);
  }, [estado, pronto]);

  const chaveDe = (tipo: TipoCarrinho) => (tipo === 'CAIXA_50' ? 'caixa' : 'avulso');

  const definirQuantidade = useCallback((tipo: TipoCarrinho, produtoId: string, quantidade: number) => {
    setEstado((e) => {
      const k = chaveDe(tipo);
      const q = { ...e[k] };
      if (quantidade > 0) q[produtoId] = quantidade;
      else delete q[produtoId];
      return { ...e, [k]: q };
    });
  }, []);

  const limpar = useCallback((tipo: TipoCarrinho) => {
    setEstado((e) => ({ ...e, [chaveDe(tipo)]: {} }));
  }, []);

  const substituir = useCallback((tipo: TipoCarrinho, q: Quantidades) => {
    setEstado((e) => ({ ...e, [chaveDe(tipo)]: limparQuantidades(q) }));
  }, []);

  const escolherTipo = useCallback((tipo: TipoCarrinho | null) => {
    setEstado((e) => ({ ...e, tipoAtivo: tipo }));
  }, []);

  const esvaziarTudo = useCallback(() => setEstado(VAZIO), []);

  const valor = useMemo<ValorContexto>(
    () => ({ ...estado, pronto, definirQuantidade, limpar, substituir, escolherTipo, esvaziarTudo }),
    [estado, pronto, definirQuantidade, limpar, substituir, escolherTipo, esvaziarTudo],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useCarrinho(): ValorContexto {
  const v = useContext(Contexto);
  if (!v) throw new Error('useCarrinho precisa estar dentro do CarrinhoProvider.');
  return v;
}

/** Usado na página de confirmação: esvazia o carrinho assim que o pedido foi recebido. */
export function EsvaziarCarrinho() {
  const { pronto, esvaziarTudo } = useCarrinho();
  useEffect(() => {
    if (pronto) esvaziarTudo();
  }, [pronto, esvaziarTudo]);
  return null;
}
