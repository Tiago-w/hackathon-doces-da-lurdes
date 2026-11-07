// Home PROVISÓRIA do commit base. Dono: Dev 2 (pode substituir inteira).
import Link from 'next/link';

export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col justify-center gap-6 px-4 py-12">
      <h1 className="font-[family-name:var(--font-titulo)] text-4xl font-bold">Doces da Lurdes</h1>
      <p className="text-chocolate-suave">
        Doces tradicionais de Pelotas feitos em casa há 18 anos. O site está sendo preparado.
      </p>
      <Link
        href="/painel"
        className="inline-flex min-h-14 w-fit items-center rounded-xl bg-caramelo px-6 text-lg font-semibold text-white hover:bg-caramelo-escuro"
      >
        Ir para o Modo Vovó
      </Link>
    </main>
  );
}
