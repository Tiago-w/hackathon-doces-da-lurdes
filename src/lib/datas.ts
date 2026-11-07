/**
 * Datas e horas sempre no fuso de Pelotas (America/Sao_Paulo), não no fuso do servidor.
 * Em produção o servidor costuma rodar em UTC: usar `new Date().getDate()` direto daria o dia errado
 * depois das 21h. Use sempre estas funções.
 *
 * Pode ser usado no servidor e no navegador.
 */
import type { DataISO } from './contrato';

export const FUSO = 'America/Sao_Paulo';

const formatoPartes = new Intl.DateTimeFormat('en-CA', {
  timeZone: FUSO,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

/** Data (YYYY-MM-DD) e hora (HH:mm) de um instante, no fuso de Pelotas. */
export function partesEmPelotas(instante: Date = new Date()): { data: DataISO; hora: string } {
  const p = Object.fromEntries(formatoPartes.formatToParts(instante).map((x) => [x.type, x.value]));
  return { data: `${p.year}-${p.month}-${p.day}`, hora: `${p.hour}:${p.minute}` };
}

export function hojeEmPelotas(agora: Date = new Date()): DataISO {
  return partesEmPelotas(agora).data;
}

export function ehDataISO(valor: unknown): valor is DataISO {
  if (typeof valor !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
  const d = new Date(`${valor}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === valor;
}

/** Soma dias a uma data de calendário (sem fuso envolvido). */
export function somarDias(data: DataISO, dias: number): DataISO {
  const d = new Date(`${data}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

/** Diferença em dias entre duas datas de calendário (b - a). */
export function diasEntre(a: DataISO, b: DataISO): number {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);
}

/** Converte DataISO para o Date que o Prisma usa em colunas @db.Date. */
export function dataParaBanco(data: DataISO): Date {
  return new Date(`${data}T00:00:00Z`);
}

/** Converte o Date de uma coluna @db.Date de volta para DataISO. */
export function dataDoBanco(data: Date): DataISO {
  return data.toISOString().slice(0, 10);
}

/** "HH:mm" < "HH:mm" funciona por comparação de texto, desde que os dois tenham 2 dígitos. */
export function antesDoHorario(hora: string, limite: string): boolean {
  return hora < limite;
}

const DIAS_SEMANA = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

/**
 * Data amigável para telas: "Hoje", "Amanhã", "sábado, 14 nov".
 * `hoje` pode ser passado para testes ou para evitar diferença entre servidor e navegador.
 */
export function dataAmigavel(data: DataISO, hoje: DataISO = hojeEmPelotas()): string {
  const diff = diasEntre(hoje, data);
  if (diff === 0) return 'Hoje';
  if (diff === 1) return 'Amanhã';
  const d = new Date(`${data}T00:00:00Z`);
  return `${DIAS_SEMANA[d.getUTCDay()]}, ${d.getUTCDate()} ${MESES[d.getUTCMonth()]}`;
}
