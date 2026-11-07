/**
 * WhatsApp: guardamos só dígitos, com DDD, sem o 55. Ex.: "53999998888".
 * Pode ser usado no servidor e no navegador.
 */

/** Tira tudo que não é dígito e o 55 do começo. "+55 (53) 99999-8888" → "53999998888". */
export function normalizarWhatsapp(texto: string): string {
  let d = texto.replace(/\D/g, '');
  if (d.length >= 12 && d.startsWith('55')) d = d.slice(2);
  return d;
}

/** Celular brasileiro: DDD (11–99) + 9 + 8 dígitos. */
export function whatsappValido(texto: string): boolean {
  return /^[1-9][1-9]9\d{8}$/.test(normalizarWhatsapp(texto));
}

/** "53999998888" → "(53) 99999-8888" */
export function formatarWhatsapp(digitos: string): string {
  const d = normalizarWhatsapp(digitos);
  if (d.length !== 11) return digitos;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

/** Link que abre a conversa no WhatsApp com uma mensagem pronta. */
export function linkWhatsapp(digitos: string, mensagem?: string): string {
  const base = `https://wa.me/55${normalizarWhatsapp(digitos)}`;
  return mensagem ? `${base}?text=${encodeURIComponent(mensagem)}` : base;
}
