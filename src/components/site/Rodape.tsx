import Link from 'next/link';
import { formatarWhatsapp, linkWhatsapp } from '@/lib/whatsapp';

export function Rodape({
  whatsappLoja,
  enderecoRetirada,
}: {
  whatsappLoja: string;
  enderecoRetirada: string;
}) {
  return (
    <footer className="mt-20 border-t border-borda bg-chocolate text-creme">
      <div className="mx-auto max-w-6xl px-4 py-14">
        <div className="grid gap-10 md:grid-cols-12">
          {/* Coluna 1: Marca e História */}
          <div className="md:col-span-5 space-y-3">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-doce-de-leite/20 font-titulo text-lg font-bold text-doce-de-leite border border-doce-de-leite/30">
                DL
              </span>
              <div>
                <p className="font-titulo text-2xl font-bold tracking-tight text-white">
                  Doces da Lurdes
                </p>
                <p className="text-xs font-semibold uppercase tracking-widest text-doce-de-leite">
                  Pelotas · Capital Nacional do Doce
                </p>
              </div>
            </div>
            <p className="text-base leading-relaxed text-creme/80 max-w-md pt-1">
              Há 18 anos preparando doces tradicionais pelotenses em tachos de cobre e fornadas diárias: quindim, camafeu de nozes, pastel de Santa Clara, trouxinha de ovos e bem-casado.
            </p>
          </div>

          {/* Coluna 2: Encomendas */}
          <div className="md:col-span-3 space-y-2.5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-doce-de-leite">
              Encomendas
            </h2>
            <ul className="space-y-2 text-base text-creme/85">
              <li>
                <Link href="/pedido/caixa" className="hover:text-white hover:underline underline-offset-4">
                  Caixa de 50 doces
                </Link>
              </li>
              <li>
                <Link href="/pedido/avulso" className="hover:text-white hover:underline underline-offset-4">
                  Doces avulsos para hoje
                </Link>
              </li>
              <li>
                <Link href="/pedido/festa" className="hover:text-white hover:underline underline-offset-4">
                  Casamentos, formaturas e festas
                </Link>
              </li>
              <li>
                <Link href="/privacidade" className="hover:text-white hover:underline underline-offset-4">
                  Política de privacidade (LGPD)
                </Link>
              </li>
            </ul>
          </div>

          {/* Coluna 3: Atendimento & Entrega */}
          <div className="md:col-span-4 space-y-2.5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-doce-de-leite">
              Atendimento & Retirada
            </h2>
            <p className="text-base text-creme/85">
              WhatsApp:{' '}
              <a
                href={linkWhatsapp(whatsappLoja)}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-white underline underline-offset-4 hover:text-doce-de-leite"
              >
                {formatarWhatsapp(whatsappLoja)}
              </a>
            </p>
            <p className="text-base text-creme/85">
              <strong className="text-white">Retirada grátis:</strong> {enderecoRetirada}
            </p>
            <p className="text-sm text-creme/70 pt-1">
              Entregas em Pelotas (Centro, Fragata, Simões Lopes, Porto, Areal, Três Vendas, Laranjal e região) e Capão do Leão.
            </p>
          </div>
        </div>

        {/* Barra inferior */}
        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-creme/15 pt-6 text-sm text-creme/65">
          <p>© {new Date().getFullYear()} Doces da Lurdes · Confeitaria Artesanal de Pelotas (RS).</p>
          <div className="flex items-center gap-6">
            <Link
              href="/privacidade"
              className="hover:text-creme underline underline-offset-4"
            >
              Privacidade
            </Link>
            <Link
              href="/painel"
              className="rounded-lg border border-creme/20 px-3 py-1 text-xs font-semibold text-creme/80 hover:border-doce-de-leite hover:text-white transition-colors"
            >
              Acesso da Cozinha (Modo Vovó)
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
