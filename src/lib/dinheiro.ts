/**
 * Dinheiro sempre em centavos (inteiro). Nunca faça conta com número quebrado (4.5 * 3).
 * Pode ser usado no servidor e no navegador.
 */

const formatoReais = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

/** 450 → "R$ 4,50" */
export function formatarReais(centavos: number): string {
  // Intl usa espaço não separável entre "R$" e o valor; trocamos por espaço comum para facilitar testes e cópia.
  return formatoReais.format(centavos / 100).replace(/ /g, ' ');
}

/**
 * Lê o que a pessoa digitou e devolve centavos, ou null se não der para entender.
 * Aceita: "4,50", "4.50", "R$ 4,50", "4", "1.234,56", "1234,5".
 */
export function lerReais(texto: string): number | null {
  let t = texto.replace(/R\$|\s/gi, '');
  if (!t) return null;
  if (t.includes(',')) {
    // Formato brasileiro: ponto é milhar, vírgula é decimal.
    t = t.replace(/\./g, '').replace(',', '.');
  } else if (/^\d{1,3}(\.\d{3})+$/.test(t)) {
    // "1.234" sem vírgula: ponto como milhar.
    t = t.replace(/\./g, '');
  }
  if (!/^\d+(\.\d{1,2})?$/.test(t)) return null;
  const [inteiro, decimal = ''] = t.split('.');
  return Number(inteiro) * 100 + Number(decimal.padEnd(2, '0'));
}
