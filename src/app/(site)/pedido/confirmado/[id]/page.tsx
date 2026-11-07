import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { obterConfigPublica, obterPedidoConfirmacao } from '../../../_dados';
import { formatarReais } from '@/lib/dinheiro';
import { hojeEmPelotas } from '@/lib/datas';
import { linkWhatsapp } from '@/lib/whatsapp';
import { EsvaziarCarrinho } from '@/components/site/carrinho';
import { BotaoCopiarPix } from '@/components/site/BotaoCopiarPix';
import { dataPorExtenso } from '@/components/site/datas';
import { botaoWhatsapp, cartao, titulo } from '@/components/site/estilos';
import { IconeAlerta, IconeCheck, IconeWhatsapp } from '@/components/site/icones';

export const metadata: Metadata = {
  title: 'Pedido recebido',
  robots: { index: false, follow: false },
};

export default async function PaginaConfirmado({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [pedido, config] = await Promise.all([obterPedidoConfirmacao(decodeURIComponent(id)), obterConfigPublica()]);
  if (!pedido) notFound();

  const primeiroNome = pedido.cliente.nome.split(' ')[0];
  const pago = pedido.statusPagamento === 'PAGO';
  const mensagemComprovante = `Oi! Fiz o pedido ${pedido.codigo} no site e paguei no Pix. Segue o comprovante.`;

  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      <EsvaziarCarrinho />

      {config.ambienteTeste && (
        <p role="note" className="mb-5 flex items-start gap-2 rounded-2xl border-2 border-alerta bg-alerta-fundo p-4 text-lg font-bold text-alerta">
          <IconeAlerta className="mt-0.5 size-6 shrink-0" />
          Ambiente de teste: não pague este Pix.
        </p>
      )}

      <h1 className={`${titulo} text-3xl sm:text-4xl`}>
        Pedido {pedido.codigo} recebido, {primeiroNome}! <span aria-hidden>🎉</span>
      </h1>
      <p className="mt-2 text-lg">
        {pago ? 'O pagamento já foi confirmado. Obrigada!' : 'Agora é só pagar no Pix para a dona Lurdes começar a fazer.'}
      </p>

      {!pago && (
        <section aria-labelledby="titulo-pix" className={`${cartao} mt-6 border-2 border-caramelo`}>
          <h2 id="titulo-pix" className={`${titulo} text-2xl`}>
            Pague no Pix
          </h2>
          <p className="mt-2 text-lg">Valor:</p>
          <p className="text-4xl font-bold tabular-nums text-chocolate">{formatarReais(pedido.totalCentavos)}</p>

          <ol className="mt-4 space-y-1 text-lg">
            <li>1. Abra o app do seu banco.</li>
            <li>2. Toque em Pix e depois em Pix Copia e Cola.</li>
            <li>3. Cole o código abaixo e confirme.</li>
          </ol>

          <div className="mt-5">
            <BotaoCopiarPix codigo={pedido.pix.copiaECola} />
          </div>

          <div className="mt-4 flex flex-col items-center gap-2 border-t border-borda pt-5">
            <p className="text-lg font-bold">Ou leia o QR Code</p>
            <p className="text-base text-chocolate-suave">Útil se estiver vendo isso no computador.</p>
            <Image
              src={pedido.pix.qrCodeDataUrl}
              alt={`QR Code do Pix de ${formatarReais(pedido.totalCentavos)} do pedido ${pedido.codigo}`}
              width={240}
              height={240}
              unoptimized
              className="rounded-xl border border-borda bg-white p-2"
            />
          </div>
        </section>
      )}

      {pago && (
        <p className="mt-6 flex items-center gap-2 rounded-2xl bg-sucesso-fundo p-4 text-lg font-bold text-sucesso">
          <IconeCheck /> Pagamento confirmado
        </p>
      )}

      <section aria-labelledby="titulo-comprovante" className={`${cartao} mt-6`}>
        <h2 id="titulo-comprovante" className={`${titulo} text-2xl`}>
          Depois de pagar
        </h2>
        <p className="mt-2 text-lg">Mande o comprovante para a gente no WhatsApp. Assim confirmamos mais rápido.</p>
        <a
          href={linkWhatsapp(config.whatsappLoja, mensagemComprovante)}
          target="_blank"
          rel="noopener noreferrer"
          className={`${botaoWhatsapp} mt-4 w-full`}
        >
          <IconeWhatsapp /> Mandar o comprovante no WhatsApp
        </a>
      </section>

      <section aria-labelledby="titulo-resumo" className={`${cartao} mt-6`}>
        <h2 id="titulo-resumo" className={`${titulo} text-2xl`}>
          Seu pedido
        </h2>
        <dl className="mt-3 space-y-2 text-lg">
          <div>
            <dt className="inline font-bold">Tipo: </dt>
            <dd className="inline">{pedido.tipo === 'CAIXA_50' ? 'Caixa de 50 doces' : 'Doces avulsos'}</dd>
          </div>
          <div>
            <dt className="inline font-bold">{pedido.formaEntrega === 'RETIRADA' ? 'Retirada: ' : 'Entrega: '}</dt>
            <dd className="inline">
              {dataPorExtenso(pedido.dataEntrega, hojeEmPelotas())}
              {pedido.formaEntrega === 'RETIRADA' ? ` · ${config.enderecoRetirada}` : pedido.bairro ? ` · bairro ${pedido.bairro}` : ''}
            </dd>
          </div>
        </dl>
        <ul className="mt-3 divide-y divide-borda border-t border-borda">
          {pedido.itens.map((i) => (
            <li key={i.nomeProduto} className="flex justify-between py-2 text-lg">
              <span>{i.nomeProduto}</span>
              <span className="font-bold tabular-nums">{i.quantidade}</span>
            </li>
          ))}
        </ul>
        <p className="mt-2 flex justify-between border-t-2 border-borda pt-2 text-xl font-bold">
          <span>Total</span>
          <span className="tabular-nums">{formatarReais(pedido.totalCentavos)}</span>
        </p>
      </section>

      <p className="mt-8 text-center">
        <Link href="/" className="inline-flex min-h-12 items-center font-bold text-caramelo underline underline-offset-4">
          Voltar para o início
        </Link>
      </p>
    </main>
  );
}
