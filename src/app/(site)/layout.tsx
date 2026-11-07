import { obterConfigPublica } from './_dados';
import { Cabecalho } from '@/components/site/Cabecalho';
import { Rodape } from '@/components/site/Rodape';
import { CarrinhoProvider } from '@/components/site/carrinho';

// Disponibilidade dos sabores muda ao longo do dia (painel da dona Lurdes): sempre renderiza na hora.
export const dynamic = 'force-dynamic';

export default async function LayoutSite({ children }: { children: React.ReactNode }) {
  const config = await obterConfigPublica();
  return (
    <CarrinhoProvider>
      <div className="flex min-h-dvh flex-col">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-lg focus:bg-papel focus:px-4 focus:py-3 focus:font-bold"
      >
        Pular para o conteúdo
      </a>
      <Cabecalho whatsappLoja={config.whatsappLoja} />
      <div id="conteudo" className="flex-1">
        {children}
      </div>
      <Rodape whatsappLoja={config.whatsappLoja} enderecoRetirada={config.enderecoRetirada} />
      </div>
    </CarrinhoProvider>
  );
}
