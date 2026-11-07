import { describe, expect, it, vi } from 'vitest';
import {
  formatarTituloDiaProximo,
  linkWhatsappPedido,
  obterProximoPasso,
} from '@/components/painel/mensagens';
import { criarTokenSessao, validarTokenSessao } from './_auth';
import * as dados from './_dados';
import * as mock from './_dados/mock';

let cookieAtual: string | undefined;

vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: () => (cookieAtual ? { value: cookieAtual } : undefined),
    set: (_nome: string, valor: string) => {
      cookieAtual = valor;
    },
    delete: () => {
      cookieAtual = undefined;
    },
  }),
}));

describe('autenticação do Modo Vovó (_auth)', () => {
  it('gera token assinado com HMAC e valida dentro do prazo de 30 dias', () => {
    const agora = 1_700_000_000_000;
    const token = criarTokenSessao(agora);
    expect(validarTokenSessao(token, agora + 1_000)).toBe(true);
    // Expirado após 31 dias
    expect(validarTokenSessao(token, agora + 31 * 24 * 60 * 60 * 1000)).toBe(false);
  });

  it('recusa token adulterado ou vazio', () => {
    const token = criarTokenSessao();
    expect(validarTokenSessao(undefined)).toBe(false);
    expect(validarTokenSessao('')).toBe(false);
    expect(validarTokenSessao(`${token}a`)).toBe(false);
    expect(validarTokenSessao('vovo.9999999999999.assinatura-invalida')).toBe(false);
  });
});

describe('proteção de _dados com exigirLogin()', () => {
  it('bloqueia chamadas a _dados quando não há cookie de login válido', async () => {
    cookieAtual = undefined;
    await expect(dados.listarPedidos()).rejects.toThrow(/Acesso não autorizado/);
    await expect(dados.listarCatalogo()).rejects.toThrow(/Acesso não autorizado/);
    await expect(dados.listarOrcamentosFesta()).rejects.toThrow(/Acesso não autorizado/);
    await expect(dados.mudarStatus('ped-27', 'FAZENDO')).rejects.toThrow(
      /Acesso não autorizado/,
    );
    await expect(dados.marcarDisponivel('prod-quindim', false)).rejects.toThrow(
      /Acesso não autorizado/,
    );
    await expect(dados.mudarPreco('prod-quindim', 500)).rejects.toThrow(
      /Acesso não autorizado/,
    );
  });

  it('permite chamadas a _dados quando o cookie de sessão é válido', async () => {
    cookieAtual = criarTokenSessao();
    const catalogo = await dados.listarCatalogo();
    expect(catalogo.length).toBeGreaterThanOrEqual(6);

    const pedidos = await dados.listarPedidos();
    expect(pedidos.length).toBeGreaterThanOrEqual(8);
  });
});

describe('fluxo de pedidos, sabores e festas no mock', () => {
  it('leva um pedido de RECEBIDO até ENTREGUE passo a passo e permite desfazer', async () => {
    const pedidos = await mock.listarPedidos();
    const pedidoEntrega = pedidos.find(
      (p) => p.status === 'RECEBIDO' && p.formaEntrega === 'ENTREGA',
    );
    expect(pedidoEntrega).toBeDefined();
    if (!pedidoEntrega) return;

    // RECEBIDO -> FAZENDO
    const p1 = obterProximoPasso(pedidoEntrega);
    expect(p1?.rotuloBotao).toBe('Começar a fazer');
    expect(p1?.proximoStatus).toBe('FAZENDO');
    await mock.mudarStatus(pedidoEntrega.id, 'FAZENDO');

    // FAZENDO -> PRONTO
    const atualizado1 = (await mock.listarPedidos()).find((p) => p.id === pedidoEntrega.id);
    expect(atualizado1).toBeDefined();
    if (!atualizado1) return;
    const p2 = obterProximoPasso(atualizado1);
    expect(p2?.rotuloBotao).toBe('Está pronto');
    expect(p2?.proximoStatus).toBe('PRONTO');
    await mock.mudarStatus(pedidoEntrega.id, 'PRONTO');

    // PRONTO (ENTREGA) -> SAIU
    const atualizado2 = (await mock.listarPedidos()).find((p) => p.id === pedidoEntrega.id);
    expect(atualizado2).toBeDefined();
    if (!atualizado2) return;
    const p3 = obterProximoPasso(atualizado2);
    expect(p3?.rotuloBotao).toBe('Saiu para entrega');
    expect(p3?.proximoStatus).toBe('SAIU');
    await mock.mudarStatus(pedidoEntrega.id, 'SAIU');

    // SAIU -> ENTREGUE
    const atualizado3 = (await mock.listarPedidos()).find((p) => p.id === pedidoEntrega.id);
    expect(atualizado3).toBeDefined();
    if (!atualizado3) return;
    const p4 = obterProximoPasso(atualizado3);
    expect(p4?.rotuloBotao).toBe('Entregue');
    expect(p4?.proximoStatus).toBe('ENTREGUE');
    await mock.mudarStatus(pedidoEntrega.id, 'ENTREGUE');

    // Desfazer volta para RECEBIDO
    await mock.mudarStatus(pedidoEntrega.id, 'RECEBIDO');
  });

  it('pula o status SAIU quando o pedido é RETIRADA (PRONTO -> Cliente retirou -> ENTREGUE)', async () => {
    const pedidos = await mock.listarPedidos();
    const pedidoRetirada = pedidos.find(
      (p) => p.formaEntrega === 'RETIRADA' && p.status === 'PRONTO',
    );
    expect(pedidoRetirada).toBeDefined();
    if (!pedidoRetirada) return;

    const proximo = obterProximoPasso(pedidoRetirada);
    expect(proximo?.rotuloBotao).toBe('Cliente retirou');
    expect(proximo?.proximoStatus).toBe('ENTREGUE');
  });

  it('marca sabor como Acabou/Tem e altera preço em centavos', async () => {
    await mock.marcarDisponivel('prod-quindim', false);
    let catalogo = await mock.listarCatalogo();
    expect(catalogo.find((p) => p.id === 'prod-quindim')?.disponivel).toBe(false);

    await mock.marcarDisponivel('prod-quindim', true);
    await mock.mudarPreco('prod-quindim', 475);
    catalogo = await mock.listarCatalogo();
    const quindim = catalogo.find((p) => p.id === 'prod-quindim');
    expect(quindim?.disponivel).toBe(true);
    expect(quindim?.precoCentavos).toBe(475);

    await mock.mudarPreco('prod-quindim', 450);
  });

  it('gera link de WhatsApp com mensagem pronta e formata cabeçalho dos próximos dias', async () => {
    const pedidos = await mock.listarPedidos();
    const link = linkWhatsappPedido(pedidos[0]);
    expect(link).toContain('https://wa.me/5553');
    expect(link).toContain('Doces%20da%20Lurdes');

    expect(formatarTituloDiaProximo('2026-11-08', '2026-11-07')).toBe('Amanhã, domingo 8');
  });
});
