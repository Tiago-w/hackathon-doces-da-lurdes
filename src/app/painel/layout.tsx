import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Modo Vovó · Painel da Dona Lurdes',
  description: 'Painel interno de pedidos e sabores da Doces da Lurdes.',
  robots: { index: false, follow: false },
};

/**
 * Layout base de `/painel` (aplica tipografia mínima de 20px e cores de alto contraste).
 * A verificação de login (`exigirLogin({ redirecionar: true })`) fica em
 * `src/app/painel/(protegido)/layout.tsx` para proteger `/painel` sem gerar loop de
 * redirecionamento na rota filha `/painel/entrar`.
 */
export default function LayoutRaizPainel({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-dvh bg-creme text-chocolate text-[20px] leading-relaxed selection:bg-doce-de-leite selection:text-chocolate">
      {children}
    </div>
  );
}
