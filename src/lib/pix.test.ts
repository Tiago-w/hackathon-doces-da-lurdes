import { describe, expect, it } from 'vitest';
import { crc16, gerarPixCopiaECola } from './pix';
import { mensagemPedidoParaLoja, mensagemStatusParaCliente } from './mensagens';

describe('Pix BR Code', () => {
  it('CRC16-CCITT bate com o valor de verificação padrão', () => {
    // Valor de referência do CRC-16/CCITT-FALSE para "123456789".
    expect(crc16('123456789')).toBe('29B1');
  });

  it('gera o payload do exemplo oficial do Banco Central', () => {
    const payload = gerarPixCopiaECola({
      chave: '123e4567-e12b-12d1-a456-426655440000',
      nomeRecebedor: 'Fulano de Tal',
      cidade: 'BRASILIA',
    });
    expect(payload).toBe(
      '00020126580014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-4266554400005204000053039865802BR5913Fulano de Tal6008BRASILIA62070503***63041D3D',
    );
  });

  it('inclui valor e identificador do pedido, e tira acentos', () => {
    const payload = gerarPixCopiaECola({
      chave: 'pix-teste@docesdalurdes.com.br',
      nomeRecebedor: 'Doces da Lurdes Confeitaria Artesanal',
      cidade: 'São Lourenço do Sul',
      valorCentavos: 8800,
      txid: 'PEDIDO-27',
    });
    expect(payload).toContain('540588.00');
    expect(payload).toContain('5925Doces da Lurdes Confeitar'); // corta em 25
    expect(payload).toContain('6015Sao Lourenco do'); // sem acento, corta em 15
    expect(payload).toContain('0508PEDIDO27');
    // O CRC final confere com o resto do payload.
    expect(payload.slice(-4)).toBe(crc16(payload.slice(0, -4)));
  });

  it('recusa chave vazia e valor inválido', () => {
    expect(() => gerarPixCopiaECola({ chave: ' ', nomeRecebedor: 'X', cidade: 'Y' })).toThrow();
    expect(() => gerarPixCopiaECola({ chave: 'a@b.c', nomeRecebedor: 'X', cidade: 'Y', valorCentavos: 0 })).toThrow();
  });
});

describe('mensagens de WhatsApp', () => {
  it('resumo do pedido para a loja', () => {
    const msg = mensagemPedidoParaLoja(
      {
        codigo: 27,
        tipo: 'AVULSO',
        cliente: { nome: 'Maria Souza' },
        dataEntrega: '2026-11-07',
        formaEntrega: 'ENTREGA',
        bairro: 'Centro',
        endereco: 'Rua XV, 100',
        itens: [{ nomeProduto: 'Quindim', quantidade: 12 }],
        totalCentavos: 6400,
      },
      '2026-11-07',
    );
    expect(msg).toContain('*pedido 27*');
    expect(msg).toContain('• 12 × Quindim');
    expect(msg).toContain('Hoje (07/11/2026)');
    expect(msg).toContain('Rua XV, 100 – Centro');
    expect(msg).toContain('R$ 64,00');
  });

  it('aviso de pronto muda para retirada', () => {
    const base = { codigo: 27, cliente: { nome: 'Maria Souza' } };
    expect(mensagemStatusParaCliente('PRONTO', { ...base, formaEntrega: 'RETIRADA' })).toContain('Pode vir buscar');
    expect(mensagemStatusParaCliente('PRONTO', { ...base, formaEntrega: 'ENTREGA' })).toContain('logo sai para entrega');
    expect(mensagemStatusParaCliente('SAIU', { ...base, formaEntrega: 'ENTREGA' })).toMatch(/^Oi, Maria!/);
  });
});
