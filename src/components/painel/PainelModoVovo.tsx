'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { acaoSair } from '@/app/painel/_acoes-auth';
import {
  listarCatalogo,
  listarOrcamentosFesta,
  listarPedidos,
  marcarDisponivel,
  mudarPreco,
  mudarStatus,
  mudarStatusOrcamento,
} from '@/app/painel/_dados';
import type {
  DataISO,
  OrcamentoFesta,
  PedidoResumo,
  Produto,
  StatusOrcamento,
  StatusPedido,
} from '@/lib/contrato';
import { hojeEmPelotas, partesEmPelotas } from '@/lib/datas';
import { formatarReais } from '@/lib/dinheiro';
import { AbaFestas, type DesfazerStatusOrcamento } from './AbaFestas';
import { AbaHoje } from './AbaHoje';
import { AbaProximosDias } from './AbaProximosDias';
import { AbaSabores, type DesfazerDisponibilidadeSabor } from './AbaSabores';
import type { DesfazerStatusPedido } from './CartaoPedido';
import { desbloquearAudio, tocarPlimPlim } from './som';

type AbaPainel = 'HOJE' | 'PROXIMOS' | 'FESTAS' | 'SABORES';

const INTERVALO_POLLING_MS = 10_000;
const INTERVALO_REPETIR_SOM_MS = 30_000;
const TEMPO_DESFAZER_MS = 10_000;

interface PropriedadesPainelModoVovo {
  pedidosIniciais: PedidoResumo[];
  catalogoInicial: Produto[];
  orcamentosIniciais: OrcamentoFesta[];
  hojeInicial: DataISO;
  horaInicial: string;
}

export function PainelModoVovo({
  pedidosIniciais,
  catalogoInicial,
  orcamentosIniciais,
  hojeInicial,
  horaInicial,
}: PropriedadesPainelModoVovo) {
  const [diaIniciado, setDiaIniciado] = useState(false);
  const [somLigado, setSomLigado] = useState(true);
  const [abaAtiva, setAbaAtiva] = useState<AbaPainel>('HOJE');

  const [hoje, setHoje] = useState<DataISO>(hojeInicial);
  const [atualizadoAs, setAtualizadoAs] = useState<string>(horaInicial);
  const [semInternet, setSemInternet] = useState(false);
  const [erroAcao, setErroAcao] = useState<string | null>(null);

  const [pedidos, setPedidos] = useState<PedidoResumo[]>(pedidosIniciais);
  const [catalogo, setCatalogo] = useState<Produto[]>(catalogoInicial);
  const [orcamentos, setOrcamentos] = useState<OrcamentoFesta[]>(orcamentosIniciais);

  // Pedidos em RECEBIDO que ainda não foram tocados/vistos pela dona Lurdes
  const [idsNaoVistos, setIdsNaoVistos] = useState<Set<string>>(() => {
    const iniciaisRecebidos = pedidosIniciais
      .filter((p) => p.status === 'RECEBIDO' && p.dataEntrega === hojeInicial)
      .map((p) => p.id);
    return new Set(iniciaisRecebidos);
  });

  const idsConhecidosRef = useRef<Set<string>>(new Set(pedidosIniciais.map((p) => p.id)));
  const somLigadoRef = useRef(somLigado);
  somLigadoRef.current = somLigado;
  const diaIniciadoRef = useRef(diaIniciado);
  diaIniciadoRef.current = diaIniciado;

  // Estados de "Desfazer" (~10s) e itens em salvamento
  const [salvandoIds, setSalvandoIds] = useState<Set<string>>(new Set());
  const [desfazerPorPedido, setDesfazerPorPedido] = useState<
    Record<string, DesfazerStatusPedido>
  >({});
  const [desfazerPorProduto, setDesfazerPorProduto] = useState<
    Record<string, DesfazerDisponibilidadeSabor>
  >({});
  const [desfazerPorOrcamento, setDesfazerPorOrcamento] = useState<
    Record<string, DesfazerStatusOrcamento>
  >({});
  const [mensagemSabores, setMensagemSabores] = useState<string | null>(null);

  const timersDesfazerRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  function agendarLimpezaDesfazer(chave: string, limpar: () => void) {
    if (timersDesfazerRef.current[chave]) {
      clearTimeout(timersDesfazerRef.current[chave]);
    }
    timersDesfazerRef.current[chave] = setTimeout(() => {
      limpar();
      delete timersDesfazerRef.current[chave];
    }, TEMPO_DESFAZER_MS);
  }

  function marcarSalvando(id: string, ativo: boolean) {
    setSalvandoIds((atual) => {
      const novo = new Set(atual);
      if (ativo) novo.add(id);
      else novo.delete(id);
      return novo;
    });
  }

  // Atualização periódica (polling a cada 10s e ao voltar para a aba)
  const sincronizarDados = useCallback(async () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setSemInternet(true);
      return;
    }

    try {
      const [novosPedidos, novoCatalogo, novosOrcamentos] = await Promise.all([
        listarPedidos(),
        listarCatalogo(),
        listarOrcamentosFesta(),
      ]);

      const agoraPelotas = partesEmPelotas(new Date());
      setHoje(agoraPelotas.data);
      setAtualizadoAs(agoraPelotas.hora);
      setSemInternet(false);

      // Detecta se entrou algum pedido novo que não existia antes
      const idsRecemChegados: string[] = [];
      for (const p of novosPedidos) {
        if (!idsConhecidosRef.current.has(p.id)) {
          idsConhecidosRef.current.add(p.id);
          if (p.status === 'RECEBIDO') {
            idsRecemChegados.push(p.id);
          }
        }
      }

      if (idsRecemChegados.length > 0) {
        setIdsNaoVistos((atual) => {
          const proximo = new Set(atual);
          for (const id of idsRecemChegados) {
            proximo.add(id);
          }
          return proximo;
        });

        if (diaIniciadoRef.current && somLigadoRef.current) {
          tocarPlimPlim();
        }
      }

      // Remove de idsNaoVistos qualquer pedido que não esteja mais em RECEBIDO
      setIdsNaoVistos((atual) => {
        let mudou = false;
        const proximo = new Set(atual);
        for (const id of atual) {
          const ped = novosPedidos.find((p) => p.id === id);
          if (!ped || ped.status !== 'RECEBIDO') {
            proximo.delete(id);
            mudou = true;
          }
        }
        return mudou ? proximo : atual;
      });

      setPedidos(novosPedidos);
      setCatalogo(novoCatalogo);
      setOrcamentos(novosOrcamentos);
    } catch {
      setSemInternet(true);
    }
  }, []);

  useEffect(() => {
    const idIntervalo = setInterval(() => {
      void sincronizarDados();
    }, INTERVALO_POLLING_MS);

    function aoMudarVisibilidade() {
      if (document.visibilityState === 'visible') {
        void sincronizarDados();
      }
    }

    function aoFocarJanela() {
      void sincronizarDados();
    }

    function aoFicarOnline() {
      setSemInternet(false);
      void sincronizarDados();
    }

    function aoFicarOffline() {
      setSemInternet(true);
    }

    document.addEventListener('visibilitychange', aoMudarVisibilidade);
    window.addEventListener('focus', aoFocarJanela);
    window.addEventListener('online', aoFicarOnline);
    window.addEventListener('offline', aoFicarOffline);

    return () => {
      clearInterval(idIntervalo);
      document.removeEventListener('visibilitychange', aoMudarVisibilidade);
      window.removeEventListener('focus', aoFocarJanela);
      window.removeEventListener('online', aoFicarOnline);
      window.removeEventListener('offline', aoFicarOffline);
    };
  }, [sincronizarDados]);

  // Repete o som a cada 30s enquanto houver pedido em "RECEBIDO" ainda não visto
  useEffect(() => {
    if (!diaIniciado || !somLigado || idsNaoVistos.size === 0) return;

    const idRepeticao = setInterval(() => {
      if (idsNaoVistos.size > 0 && somLigadoRef.current && diaIniciadoRef.current) {
        tocarPlimPlim();
      }
    }, INTERVALO_REPETIR_SOM_MS);

    return () => clearInterval(idRepeticao);
  }, [diaIniciado, somLigado, idsNaoVistos]);

  function iniciarDia() {
    desbloquearAudio();
    setDiaIniciado(true);
    if (idsNaoVistos.size > 0 && somLigado) {
      setTimeout(() => {
        tocarPlimPlim();
      }, 350);
    }
    void sincronizarDados();
  }

  function marcarPedidoVisto(pedidoId: string) {
    setIdsNaoVistos((atual) => {
      if (!atual.has(pedidoId)) return atual;
      const proximo = new Set(atual);
      proximo.delete(pedidoId);
      return proximo;
    });
  }

  async function lidarMudarStatusPedido(pedido: PedidoResumo, novoStatus: StatusPedido) {
    const statusAnterior = pedido.status;
    setErroAcao(null);
    marcarPedidoVisto(pedido.id);

    // Feedback otimista imediato na tela
    setPedidos((lista) =>
      lista.map((p) => (p.id === pedido.id ? { ...p, status: novoStatus } : p)),
    );

    const registroDesfazer: DesfazerStatusPedido = {
      pedidoId: pedido.id,
      codigoPedido: pedido.codigo,
      nomeCliente: pedido.cliente.nome,
      statusAnterior,
      statusNovo: novoStatus,
    };

    setDesfazerPorPedido((atual) => ({ ...atual, [pedido.id]: registroDesfazer }));
    agendarLimpezaDesfazer(`ped-${pedido.id}`, () => {
      setDesfazerPorPedido((atual) => {
        const copia = { ...atual };
        delete copia[pedido.id];
        return copia;
      });
    });

    marcarSalvando(pedido.id, true);
    try {
      await mudarStatus(pedido.id, novoStatus);
      setAtualizadoAs(partesEmPelotas(new Date()).hora);
    } catch {
      // Reverte em caso de falha e avisa em linguagem simples
      setPedidos((lista) =>
        lista.map((p) => (p.id === pedido.id ? { ...p, status: statusAnterior } : p)),
      );
      setDesfazerPorPedido((atual) => {
        const copia = { ...atual };
        delete copia[pedido.id];
        return copia;
      });
      setErroAcao('Não consegui salvar. Tente de novo.');
    } finally {
      marcarSalvando(pedido.id, false);
    }
  }

  async function lidarDesfazerStatusPedido(desfazer: DesfazerStatusPedido) {
    setErroAcao(null);
    const { pedidoId, statusAnterior, statusNovo } = desfazer;

    setDesfazerPorPedido((atual) => {
      const copia = { ...atual };
      delete copia[pedidoId];
      return copia;
    });

    setPedidos((lista) =>
      lista.map((p) => (p.id === pedidoId ? { ...p, status: statusAnterior } : p)),
    );

    marcarSalvando(pedidoId, true);
    try {
      await mudarStatus(pedidoId, statusAnterior);
      setAtualizadoAs(partesEmPelotas(new Date()).hora);
    } catch {
      setPedidos((lista) =>
        lista.map((p) => (p.id === pedidoId ? { ...p, status: statusNovo } : p)),
      );
      setErroAcao('Não consegui desfazer agora. Tente de novo.');
    } finally {
      marcarSalvando(pedidoId, false);
    }
  }

  async function lidarAlternarDisponivel(produto: Produto, disponivel: boolean) {
    const disponivelAnterior = produto.disponivel;
    setErroAcao(null);

    // Feedback imediato
    setCatalogo((lista) =>
      lista.map((p) => (p.id === produto.id ? { ...p, disponivel } : p)),
    );

    const textoConfirmacao = disponivel
      ? `Pronto! O site já mostra que tem ${produto.nome}.`
      : `Pronto! O site já mostra que o ${produto.nome} acabou.`;
    setMensagemSabores(textoConfirmacao);

    const registroDesfazer: DesfazerDisponibilidadeSabor = {
      produtoId: produto.id,
      nomeProduto: produto.nome,
      disponivelAnterior,
    };

    setDesfazerPorProduto((atual) => ({ ...atual, [produto.id]: registroDesfazer }));
    agendarLimpezaDesfazer(`prod-${produto.id}`, () => {
      setDesfazerPorProduto((atual) => {
        const copia = { ...atual };
        delete copia[produto.id];
        return copia;
      });
    });

    marcarSalvando(produto.id, true);
    try {
      await marcarDisponivel(produto.id, disponivel);
      setAtualizadoAs(partesEmPelotas(new Date()).hora);
    } catch {
      setCatalogo((lista) =>
        lista.map((p) =>
          p.id === produto.id ? { ...p, disponivel: disponivelAnterior } : p,
        ),
      );
      setMensagemSabores(null);
      setErroAcao('Não consegui salvar. Tente de novo.');
    } finally {
      marcarSalvando(produto.id, false);
    }
  }

  async function lidarDesfazerDisponivel(desfazer: DesfazerDisponibilidadeSabor) {
    setErroAcao(null);
    const { produtoId, nomeProduto, disponivelAnterior } = desfazer;

    setDesfazerPorProduto((atual) => {
      const copia = { ...atual };
      delete copia[produtoId];
      return copia;
    });

    setCatalogo((lista) =>
      lista.map((p) => (p.id === produtoId ? { ...p, disponivel: disponivelAnterior } : p)),
    );

    setMensagemSabores(
      disponivelAnterior
        ? `Desfeito! O ${nomeProduto} voltou a ficar disponível no site.`
        : `Desfeito! O site voltou a mostrar que o ${nomeProduto} acabou.`,
    );

    marcarSalvando(produtoId, true);
    try {
      await marcarDisponivel(produtoId, disponivelAnterior);
      setAtualizadoAs(partesEmPelotas(new Date()).hora);
    } catch {
      setCatalogo((lista) =>
        lista.map((p) =>
          p.id === produtoId ? { ...p, disponivel: !disponivelAnterior } : p,
        ),
      );
      setErroAcao('Não consegui desfazer agora. Tente de novo.');
    } finally {
      marcarSalvando(produtoId, false);
    }
  }

  async function lidarMudarPreco(
    produto: Produto,
    novoPrecoCentavos: number,
  ): Promise<boolean> {
    const precoAnterior = produto.precoCentavos;
    setErroAcao(null);

    setCatalogo((lista) =>
      lista.map((p) =>
        p.id === produto.id ? { ...p, precoCentavos: novoPrecoCentavos } : p,
      ),
    );

    marcarSalvando(produto.id, true);
    try {
      await mudarPreco(produto.id, novoPrecoCentavos);
      setMensagemSabores(
        `Pronto! O preço de ${produto.nome} mudou para ${formatarReais(novoPrecoCentavos)}.`,
      );
      setAtualizadoAs(partesEmPelotas(new Date()).hora);
      return true;
    } catch {
      setCatalogo((lista) =>
        lista.map((p) =>
          p.id === produto.id ? { ...p, precoCentavos: precoAnterior } : p,
        ),
      );
      setErroAcao('Não consegui salvar. Tente de novo.');
      return false;
    } finally {
      marcarSalvando(produto.id, false);
    }
  }

  async function lidarMudarStatusOrcamento(
    orcamento: OrcamentoFesta,
    novoStatus: StatusOrcamento,
  ) {
    const statusAnterior = orcamento.status;
    setErroAcao(null);

    setOrcamentos((lista) =>
      lista.map((o) => (o.id === orcamento.id ? { ...o, status: novoStatus } : o)),
    );

    const registroDesfazer: DesfazerStatusOrcamento = {
      orcamentoId: orcamento.id,
      nomeCliente: orcamento.nome,
      statusAnterior,
    };

    setDesfazerPorOrcamento((atual) => ({ ...atual, [orcamento.id]: registroDesfazer }));
    agendarLimpezaDesfazer(`orc-${orcamento.id}`, () => {
      setDesfazerPorOrcamento((atual) => {
        const copia = { ...atual };
        delete copia[orcamento.id];
        return copia;
      });
    });

    marcarSalvando(orcamento.id, true);
    try {
      await mudarStatusOrcamento(orcamento.id, novoStatus);
      setAtualizadoAs(partesEmPelotas(new Date()).hora);
    } catch {
      setOrcamentos((lista) =>
        lista.map((o) => (o.id === orcamento.id ? { ...o, status: statusAnterior } : o)),
      );
      setErroAcao('Não consegui salvar. Tente de novo.');
    } finally {
      marcarSalvando(orcamento.id, false);
    }
  }

  async function lidarDesfazerOrcamento(desfazer: DesfazerStatusOrcamento) {
    setErroAcao(null);
    const { orcamentoId, statusAnterior } = desfazer;
    const orcAtual = orcamentos.find((o) => o.id === orcamentoId);
    const statusAtual = orcAtual?.status ?? 'RESPONDIDO';

    setDesfazerPorOrcamento((atual) => {
      const copia = { ...atual };
      delete copia[orcamentoId];
      return copia;
    });

    setOrcamentos((lista) =>
      lista.map((o) => (o.id === orcamentoId ? { ...o, status: statusAnterior } : o)),
    );

    marcarSalvando(orcamentoId, true);
    try {
      await mudarStatusOrcamento(orcamentoId, statusAnterior);
      setAtualizadoAs(partesEmPelotas(new Date()).hora);
    } catch {
      setOrcamentos((lista) =>
        lista.map((o) => (o.id === orcamentoId ? { ...o, status: statusAtual } : o)),
      );
      setErroAcao('Não consegui desfazer agora. Tente de novo.');
    } finally {
      marcarSalvando(orcamentoId, false);
    }
  }

  // Separação de pedidos de Hoje e Próximos dias
  const dataBase = hoje || hojeEmPelotas();
  const pedidosHoje = pedidos.filter((p) => p.dataEntrega === dataBase);
  const pedidosFuturos = pedidos.filter(
    (p) => p.dataEntrega > dataBase && p.status !== 'CANCELADO',
  );

  const qtdAtivosHoje = pedidosHoje.filter(
    (p) => p.status !== 'ENTREGUE' && p.status !== 'CANCELADO',
  ).length;
  const qtdFestasNovas = orcamentos.filter((o) => o.status === 'NOVO').length;
  const qtdSaboresAcabaram = catalogo.filter((p) => !p.disponivel).length;

  // 4.2 Tela "Abrir o dia" para destravar o som no navegador
  if (!diaIniciado) {
    return (
      <main className="min-h-dvh flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top,rgba(239,212,168,0.45)_0,transparent_55%)] bg-creme">
        <section className="w-full max-w-2xl bg-papel border-2 border-borda rounded-3xl shadow-[0_24px_60px_-15px_rgba(44,24,16,0.12)] p-8 sm:p-12 text-center space-y-8">
          <div className="space-y-3">
            <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-chocolate text-doce-de-leite font-titulo text-4xl font-bold shadow-xs">
              L
            </div>
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-caramelo pt-1">
              Painel da Cozinha · Modo Vovó
            </span>
            <h1 className="font-[family-name:var(--font-titulo)] text-[36px] sm:text-[42px] font-bold text-chocolate leading-tight">
              Bom dia, dona Lurdes!
            </h1>
            <p className="text-[22px] text-chocolate-suave font-medium">
              Toque no botão abaixo para iniciar o expediente e ativar o aviso sonoro de novos pedidos.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-creme border-2 border-borda text-[22px] font-bold text-chocolate">
            {qtdAtivosHoje > 0 ? (
              <span>
                Você tem <strong>{qtdAtivosHoje}</strong>{' '}
                {qtdAtivosHoje === 1 ? 'pedido para hoje' : 'pedidos para hoje'} aguardando na fila da cozinha.
              </span>
            ) : (
              <span>Tudo em dia para receber os pedidos de hoje.</span>
            )}
          </div>

          <button
            type="button"
            onClick={iniciarDia}
            className="w-full min-h-[84px] px-10 py-6 rounded-2xl bg-caramelo hover:bg-caramelo-escuro active:bg-caramelo-escuro text-papel text-[30px] sm:text-[34px] font-extrabold shadow-lg flex items-center justify-center gap-4 cursor-pointer transition-colors"
          >
            <span>Começar o dia na cozinha</span>
          </button>
        </section>
      </main>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col bg-creme">
      {/* Cabeçalho do Modo Vovó */}
      <header className="bg-papel border-b-2 border-borda px-4 sm:px-8 py-4 shadow-xs">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-chocolate text-doce-de-leite font-titulo text-2xl font-bold">
              L
            </span>
            <div>
              <h1 className="font-[family-name:var(--font-titulo)] text-[26px] sm:text-[30px] font-bold text-chocolate leading-none">
                Doces da Lurdes · Cozinha
              </h1>
              <p className="text-[17px] text-chocolate-suave font-semibold mt-1">
                Sincronizado às {atualizadoAs}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Botão para ligar/desligar o som, com indicador visual e texto */}
            <button
              type="button"
              aria-pressed={somLigado}
              onClick={() => {
                const novo = !somLigado;
                setSomLigado(novo);
                if (novo) {
                  desbloquearAudio();
                }
              }}
              className={`min-h-14 px-5 py-2.5 rounded-2xl text-[19px] font-extrabold border-2 flex items-center gap-2.5 cursor-pointer transition-colors ${
                somLigado
                  ? 'bg-sucesso-fundo text-sucesso border-sucesso/60'
                  : 'bg-creme text-chocolate-suave border-borda'
              }`}
            >
              <span
                aria-hidden="true"
                className={`size-3 rounded-full ${somLigado ? 'bg-sucesso' : 'bg-chocolate-suave/50'}`}
              />
              <span>{somLigado ? 'Som ligado' : 'Som desligado'}</span>
            </button>

            {/* Botão Sair discreto no canto */}
            <form action={acaoSair}>
              <button
                type="submit"
                className="min-h-14 px-4 py-2.5 rounded-2xl bg-creme text-chocolate-suave border-2 border-borda hover:border-caramelo text-[18px] font-bold active:bg-borda/50 cursor-pointer"
              >
                Sair
              </button>
            </form>
          </div>
        </div>

        {/* Abas Grandes de Navegação: Hoje · Próximos dias · Festas · Sabores */}
        <nav
          aria-label="Seções do painel"
          className="max-w-6xl mx-auto mt-4 grid grid-cols-2 lg:grid-cols-4 gap-3"
        >
          <button
            type="button"
            onClick={() => setAbaAtiva('HOJE')}
            aria-current={abaAtiva === 'HOJE' ? 'page' : undefined}
            className={`min-h-[64px] px-4 py-3 rounded-2xl text-[21px] sm:text-[23px] font-extrabold flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
              abaAtiva === 'HOJE'
                ? 'bg-caramelo text-papel shadow-sm border-2 border-caramelo-escuro'
                : 'bg-creme text-chocolate border-2 border-borda hover:border-caramelo/50'
            }`}
          >
            <span>Hoje</span>
            <span
              className={`px-3 py-0.5 rounded-full text-[19px] font-extrabold ${
                abaAtiva === 'HOJE'
                  ? 'bg-papel text-caramelo'
                  : 'bg-doce-de-leite text-chocolate'
              }`}
            >
              {qtdAtivosHoje}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setAbaAtiva('PROXIMOS')}
            aria-current={abaAtiva === 'PROXIMOS' ? 'page' : undefined}
            className={`min-h-[64px] px-4 py-3 rounded-2xl text-[21px] sm:text-[23px] font-extrabold flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
              abaAtiva === 'PROXIMOS'
                ? 'bg-caramelo text-papel shadow-sm border-2 border-caramelo-escuro'
                : 'bg-creme text-chocolate border-2 border-borda hover:border-caramelo/50'
            }`}
          >
            <span>Próximos dias</span>
            <span
              className={`px-3 py-0.5 rounded-full text-[19px] font-extrabold ${
                abaAtiva === 'PROXIMOS'
                  ? 'bg-papel text-caramelo'
                  : 'bg-doce-de-leite/60 text-chocolate'
              }`}
            >
              {pedidosFuturos.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setAbaAtiva('FESTAS')}
            aria-current={abaAtiva === 'FESTAS' ? 'page' : undefined}
            className={`min-h-[64px] px-4 py-3 rounded-2xl text-[21px] sm:text-[23px] font-extrabold flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
              abaAtiva === 'FESTAS'
                ? 'bg-caramelo text-papel shadow-sm border-2 border-caramelo-escuro'
                : 'bg-creme text-chocolate border-2 border-borda hover:border-caramelo/50'
            }`}
          >
            <span>Festas</span>
            {qtdFestasNovas > 0 && (
              <span
                className={`px-3 py-0.5 rounded-full text-[19px] font-extrabold ${
                  abaAtiva === 'FESTAS'
                    ? 'bg-papel text-caramelo'
                    : 'bg-alerta-fundo text-alerta border border-alerta'
                }`}
              >
                {qtdFestasNovas}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setAbaAtiva('SABORES')}
            aria-current={abaAtiva === 'SABORES' ? 'page' : undefined}
            className={`min-h-[64px] px-4 py-3 rounded-2xl text-[21px] sm:text-[23px] font-extrabold flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
              abaAtiva === 'SABORES'
                ? 'bg-caramelo text-papel shadow-sm border-2 border-caramelo-escuro'
                : 'bg-creme text-chocolate border-2 border-borda hover:border-caramelo/50'
            }`}
          >
            <span>Sabores</span>
            {qtdSaboresAcabaram > 0 && (
              <span
                className={`px-3 py-0.5 rounded-full text-[18px] font-extrabold ${
                  abaAtiva === 'SABORES'
                    ? 'bg-papel text-erro'
                    : 'bg-erro text-papel'
                }`}
              >
                {qtdSaboresAcabaram} acabou
              </span>
            )}
          </button>
        </nav>
      </header>

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-8 py-6 space-y-6">
        {/* Aviso de queda de internet sem quebrar a tela */}
        {semInternet && (
          <div
            role="alert"
            className="p-5 rounded-2xl bg-alerta-fundo border-3 border-alerta text-alerta text-[24px] font-extrabold flex flex-wrap items-center justify-between gap-4 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <span aria-hidden="true" className="text-[30px]">
                📡
              </span>
              <span>Sem internet. Os pedidos podem estar desatualizados.</span>
            </div>
            <button
              type="button"
              onClick={() => void sincronizarDados()}
              className="min-h-16 px-6 py-3 rounded-2xl bg-papel text-chocolate border-2 border-chocolate font-bold text-[20px] cursor-pointer"
            >
              🔄 Tentar atualizar
            </button>
          </div>
        )}

        {/* Alerta amigável caso uma ação falhe */}
        {erroAcao && (
          <div
            role="alert"
            className="p-5 rounded-2xl bg-erro-fundo border-3 border-erro text-erro text-[24px] font-extrabold flex flex-wrap items-center justify-between gap-4 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <span aria-hidden="true" className="text-[30px]">
                ⚠️
              </span>
              <span>{erroAcao}</span>
            </div>
            <button
              type="button"
              onClick={() => setErroAcao(null)}
              className="min-h-16 px-6 py-3 rounded-2xl bg-papel text-chocolate border-2 border-chocolate font-bold text-[20px] cursor-pointer"
            >
              Entendi
            </button>
          </div>
        )}

        {/* Abas */}
        {abaAtiva === 'HOJE' && (
          <AbaHoje
            pedidosHoje={pedidosHoje}
            idsNaoVistos={idsNaoVistos}
            desfazerPorPedido={desfazerPorPedido}
            salvandoIds={salvandoIds}
            aoMarcarVisto={marcarPedidoVisto}
            aoMudarStatus={(p, s) => void lidarMudarStatusPedido(p, s)}
            aoDesfazerStatus={(d) => void lidarDesfazerStatusPedido(d)}
          />
        )}

        {abaAtiva === 'PROXIMOS' && (
          <AbaProximosDias
            pedidosFuturos={pedidosFuturos}
            hoje={dataBase}
            idsNaoVistos={idsNaoVistos}
            desfazerPorPedido={desfazerPorPedido}
            salvandoIds={salvandoIds}
            aoMarcarVisto={marcarPedidoVisto}
            aoMudarStatus={(p, s) => void lidarMudarStatusPedido(p, s)}
            aoDesfazerStatus={(d) => void lidarDesfazerStatusPedido(d)}
          />
        )}

        {abaAtiva === 'FESTAS' && (
          <AbaFestas
            orcamentos={orcamentos}
            hoje={dataBase}
            desfazerPorOrcamento={desfazerPorOrcamento}
            salvandoIds={salvandoIds}
            aoMudarStatusOrcamento={(o, s) => void lidarMudarStatusOrcamento(o, s)}
            aoDesfazerOrcamento={(d) => void lidarDesfazerOrcamento(d)}
          />
        )}

        {abaAtiva === 'SABORES' && (
          <AbaSabores
            catalogo={catalogo}
            desfazerPorProduto={desfazerPorProduto}
            mensagemConfirmacao={mensagemSabores}
            salvandoIds={salvandoIds}
            aoAlternarDisponivel={(prod, disp) => void lidarAlternarDisponivel(prod, disp)}
            aoDesfazerDisponivel={(d) => void lidarDesfazerDisponivel(d)}
            aoMudarPreco={lidarMudarPreco}
          />
        )}
      </main>
    </div>
  );
}
