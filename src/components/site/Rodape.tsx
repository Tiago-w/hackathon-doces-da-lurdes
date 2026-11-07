import Link from 'next/link';
import { formatarWhatsapp, linkWhatsapp } from '@/lib/whatsapp';

export function Rodape({ whatsappLoja, enderecoRetirada }: { whatsappLoja: string; enderecoRetirada: string }) {
  return (
    <footer className="mt-16 border-t border-borda bg-chocolate text-creme">
      <div className="mx-auto grid max-w-5xl gap-8 px-4 py-10 sm:grid-cols-3">
        <div>
          <p className="font-titulo text-2xl font-bold">Doces da Lurdes</p>
          <p className="mt-2 text-base text-creme/90">Doces artesanais feitos em casa há 18 anos, em Pelotas, a Capital Nacional do Doce.</p>
        </div>
        <div>
          <h2 className="text-lg font-bold">Fale com a gente</h2>
          <p className="mt-2 text-base">
            WhatsApp:{' '}
            <a
              href={linkWhatsapp(whatsappLoja)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 items-center font-bold underline underline-offset-4"
            >
              {formatarWhatsapp(whatsappLoja)}
            </a>
          </p>
          <p className="text-base">Retirada: {enderecoRetirada}</p>
        </div>
        <div>
          <h2 className="text-lg font-bold">Onde entregamos</h2>
          <p className="mt-2 text-base text-creme/90">Pelotas (RS): Centro, Fragata, Areal, Três Vendas, Laranjal e outros bairros. Capão do Leão também.</p>
          <p className="mt-2">
            <Link href="/privacidade" className="inline-flex min-h-12 items-center text-base font-bold underline underline-offset-4">
              Aviso de privacidade
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
