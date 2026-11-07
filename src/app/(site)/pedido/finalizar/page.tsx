import type { Metadata } from 'next';
import { listarBairros, listarCatalogo, obterConfigPublica } from '../../_dados';
import { hojeEmPelotas } from '@/lib/datas';
import { Checkout } from '@/components/site/Checkout';
import { titulo } from '@/components/site/estilos';

export const metadata: Metadata = {
  title: 'Finalizar pedido',
  robots: { index: false },
};

export default async function PaginaFinalizar() {
  const [produtos, bairros, config] = await Promise.all([listarCatalogo(), listarBairros(), obterConfigPublica()]);
  return (
    <main className="mx-auto max-w-5xl px-4 pb-24 pt-6 lg:pb-6">
      <h1 className={`${titulo} text-3xl sm:text-4xl`}>Falta pouco!</h1>
      <p className="mb-6 mt-2 text-lg text-chocolate-suave">Preencha os seus dados e escolha como e quando receber.</p>
      <Checkout produtos={produtos} bairros={bairros} config={config} hoje={hojeEmPelotas()} />
    </main>
  );
}
