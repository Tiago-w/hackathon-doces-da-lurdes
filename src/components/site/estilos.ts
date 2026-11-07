/**
 * Classes Tailwind repetidas no site. Ficam aqui para todos os botões terem o mesmo tamanho
 * (mínimo 56px nos principais, 48px de área de toque em tudo) e o mesmo foco visível.
 */
export const botaoPrincipal =
  'inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-caramelo px-6 py-3 text-center text-lg font-bold text-white shadow-sm transition-colors hover:bg-caramelo-escuro active:bg-caramelo-escuro disabled:cursor-not-allowed disabled:bg-chocolate-suave/60 disabled:shadow-none';

export const botaoSecundario =
  'inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl border-2 border-caramelo bg-papel px-6 py-3 text-center text-lg font-bold text-caramelo transition-colors hover:bg-creme active:bg-creme';

export const botaoWhatsapp =
  'inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-[#1f6b3a] px-6 py-3 text-center text-lg font-bold text-white transition-colors hover:bg-[#17532c]';

export const cartao = 'rounded-3xl border border-borda bg-papel p-5 shadow-[0_1px_0_rgba(59,36,22,0.06)]';

export const titulo = 'font-titulo font-bold text-chocolate';

export const campoTexto =
  'block min-h-14 w-full rounded-xl border-2 border-borda bg-papel px-4 py-3 text-lg text-chocolate placeholder:text-chocolate-suave/70 focus:border-caramelo aria-[invalid=true]:border-erro';

export const rotuloCampo = 'mb-2 block text-lg font-bold text-chocolate';
