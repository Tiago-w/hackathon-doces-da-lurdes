import Link from 'next/link';
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
    <main className="min-h-dvh flex flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_top,rgba(239,212,168,0.45)_0,transparent_55%)] bg-creme">
      <section className="w-full max-w-xl bg-papel border-2 border-borda rounded-3xl shadow-[0_24px_60px_-15px_rgba(44,24,16,0.12)] p-8 sm:p-10 space-y-7">
        <header className="text-center space-y-2">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-chocolate text-doce-de-leite font-titulo text-3xl font-bold shadow-xs">
            L
          </div>
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-caramelo pt-1">
            Gestão de Cozinha · Pelotas
          </span>
          <h1 className="font-[family-name:var(--font-titulo)] text-[32px] sm:text-[36px] font-bold text-chocolate leading-tight">
            Painel da Dona Lurdes
          </h1>
          <p className="text-[20px] text-chocolate-suave font-medium">
            Acesso exclusivo para acompanhamento de encomendas, agenda e estoque de sabores.
          </p>
        </header>

        <FormularioLogin />

        <footer className="pt-2 border-t border-borda/70 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-base font-semibold text-chocolate-suave hover:text-caramelo"
          >
            ← Voltar para a loja pública
          </Link>
        </footer>
      </section>
    </main>
  );
}
