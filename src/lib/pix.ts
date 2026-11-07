/**
 * Pix "copia e cola" estático no padrão BR Code do Banco Central (EMV QR Code).
 * Funciona igual com a chave de teste e com a chave real: só muda o que está na tabela config.
 *
 * Referência: Manual de Padrões para Iniciação do Pix (BCB), anexo "BR Code".
 */

export interface DadosPix {
  chave: string;
  nomeRecebedor: string;
  cidade: string;
  /** Valor em centavos. Sem valor, o cliente digita no app do banco. */
  valorCentavos?: number;
  /** Identificador da cobrança (até 25 letras/números). Ex.: "PEDIDO27". */
  txid?: string;
}

/** Campo EMV: id (2 dígitos) + tamanho (2 dígitos) + valor. */
function campo(id: string, valor: string): string {
  if (valor.length > 99) throw new Error(`Campo Pix ${id} longo demais.`);
  return `${id}${String(valor.length).padStart(2, '0')}${valor}`;
}

/** Tira acentos e caracteres fora do padrão (o BR Code só aceita ASCII básico nesses campos). */
function limparTexto(texto: string, max: number): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9 .\-]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

/** CRC16-CCITT (polinômio 0x1021, valor inicial 0xFFFF), como pede o BR Code. */
export function crc16(texto: string): string {
  let crc = 0xffff;
  for (const byte of new TextEncoder().encode(texto)) {
    crc ^= byte << 8;
    for (let i = 0; i < 8; i++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

export function gerarPixCopiaECola(dados: DadosPix): string {
  const chave = dados.chave.trim();
  if (!chave) throw new Error('Chave Pix não configurada.');

  const contaRecebedor = campo('00', 'br.gov.bcb.pix') + campo('01', chave);
  const txid = dados.txid ? dados.txid.replace(/[^A-Za-z0-9]/g, '').slice(0, 25) || '***' : '***';

  let payload =
    campo('00', '01') + // versão do payload
    campo('26', contaRecebedor) +
    campo('52', '0000') + // categoria do comércio (não informada)
    campo('53', '986'); // moeda: real

  if (dados.valorCentavos !== undefined) {
    if (!Number.isInteger(dados.valorCentavos) || dados.valorCentavos <= 0) throw new Error('Valor do Pix inválido.');
    payload += campo('54', (dados.valorCentavos / 100).toFixed(2));
  }

  payload +=
    campo('58', 'BR') +
    campo('59', limparTexto(dados.nomeRecebedor, 25) || 'RECEBEDOR') +
    campo('60', limparTexto(dados.cidade, 15) || 'BRASIL') +
    campo('62', campo('05', txid));

  payload += '6304';
  return payload + crc16(payload);
}
