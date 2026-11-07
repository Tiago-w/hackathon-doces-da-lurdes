import type { DataISO } from '@/lib/contrato';
import { diasEntre } from '@/lib/datas';

const SEMANA_CURTA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const SEMANA = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const MESES_LONGOS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

function partes(data: DataISO) {
  const d = new Date(`${data}T00:00:00Z`);
  return { semana: d.getUTCDay(), dia: d.getUTCDate(), mes: d.getUTCMonth() };
}

/** Para os botões de data: { principal: "Amanhã", detalhe: "sex, 8 nov" }. */
export function rotuloBotaoData(data: DataISO, hoje: DataISO): { principal: string; detalhe: string } {
  const { semana, dia, mes } = partes(data);
  const detalhe = `${SEMANA_CURTA[semana]}, ${dia} ${MESES[mes]}`;
  const diff = diasEntre(hoje, data);
  if (diff === 0) return { principal: 'Hoje', detalhe };
  if (diff === 1) return { principal: 'Amanhã', detalhe };
  const s = SEMANA_CURTA[semana];
  return { principal: `${s.charAt(0).toUpperCase()}${s.slice(1)} ${dia}`, detalhe: MESES_LONGOS[mes] };
}

/** "sábado, 14 de novembro" (com "hoje"/"amanhã" quando for o caso). */
export function dataPorExtenso(data: DataISO, hoje?: DataISO): string {
  const { semana, dia, mes } = partes(data);
  const texto = `${SEMANA[semana]}, ${dia} de ${MESES_LONGOS[mes]}`;
  if (hoje) {
    const diff = diasEntre(hoje, data);
    if (diff === 0) return `hoje, ${texto}`;
    if (diff === 1) return `amanhã, ${texto}`;
  }
  return texto;
}
