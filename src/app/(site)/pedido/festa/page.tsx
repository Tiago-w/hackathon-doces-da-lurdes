import type { Metadata } from 'next';
import Link from 'next/link';
import { obterConfigPublica } from '../../_dados';
import { hojeEmPelotas, somarDias } from '@/lib/datas';
import { FormFesta } from '@/components/site/FormFesta';
import { titulo } from '@/components/site/estilos';
import { IconeVoltar } from '@/components/site/icones';

export const metadata: Metadata = {
  title: 'Orçamento de doces para festa',
  description: 'Doces para festa em Pelotas: casamento, aniversário, formatura e eventos de empresa. Peça um orçamento sem compromisso.',
};

export default async function PaginaFesta() {
  const config = await obterConfigPublica();
  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      <Link href="/pedido" className="inline-flex min-h-12 items-center gap-2 font-bold text-caramelo">
        <IconeVoltar className="size-5" /> Voltar
      </Link>
      <h1 className={`${titulo} mt-2 text-3xl sm:text-4xl`}>Doces para a sua festa</h1>
      <p className="mb-6 mt-2 text-lg">
        Conte como vai ser a festa. A gente responde no WhatsApp com o orçamento, sem compromisso.
      </p>
      <FormFesta
        dataMinima={somarDias(hojeEmPelotas(), config.antecedenciaDiasCaixaFesta)}
        antecedenciaDias={config.antecedenciaDiasCaixaFesta}
        whatsappLoja={config.whatsappLoja}
      />
    </main>
  );
}
