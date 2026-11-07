import { redirect } from 'next/navigation';
import { FormularioLogin } from '@/components/painel/FormularioLogin';
import { verificarLogin } from '../_auth';

export const dynamic = 'force-dynamic';

export default async function PaginaEntrarPainel() {
  const jaLogado = await verificarLogin();
  if (jaLogado) {
    redirect('/painel');
  }

  return (
    <main className="min-h-dvh flex items-center justify-center p-6 bg-creme">
      <section className="w-full max-w-xl bg-papel border-3 border-borda rounded-3xl shadow-lg p-8 sm:p-10 space-y-6">
        <header className="text-center space-y-2">
          <p className="text-[44px] leading-none" aria-hidden="true">
            👵🍬
          </p>
          <h1 className="font-[family-name:var(--font-titulo)] text-[34px] sm:text-[38px] font-bold text-chocolate leading-tight">
            Doces da Lurdes
          </h1>
          <p className="text-[22px] text-chocolate-suave font-medium">
            Painel da cozinha (Modo Vovó)
          </p>
        </header>

        <FormularioLogin />
      </section>
    </main>
  );
}
