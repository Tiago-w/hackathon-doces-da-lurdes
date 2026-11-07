import type { Metadata } from 'next';
import { obterConfigPublica } from '../_dados';
import { formatarWhatsapp, linkWhatsapp } from '@/lib/whatsapp';
import { titulo } from '@/components/site/estilos';

export const metadata: Metadata = {
  title: 'Aviso de privacidade',
  description: 'Como a Doces da Lurdes usa os seus dados: só nome, WhatsApp e endereço de entrega, para fazer o seu pedido.',
};

// RASCUNHO para revisar com o cliente antes de ir ao ar.
export default async function PaginaPrivacidade() {
  const config = await obterConfigPublica();
  const secao = 'mt-8';
  const h2 = `${titulo} text-2xl`;
  return (
    <main className="mx-auto max-w-2xl px-4 py-8 text-lg">
      <h1 className={`${titulo} text-3xl sm:text-4xl`}>Aviso de privacidade</h1>
      <p className="mt-3">
        Aqui explicamos, de um jeito simples, o que fazemos com os seus dados quando você faz um pedido na Doces da Lurdes.
      </p>

      <section className={secao}>
        <h2 className={h2}>Quais dados pedimos</h2>
        <ul className="mt-2 list-disc space-y-1 pl-6">
          <li>Seu nome.</li>
          <li>Seu número de WhatsApp.</li>
          <li>O endereço de entrega, só se você escolher receber em casa.</li>
        </ul>
        <p className="mt-3">
          <strong>Não pedimos CPF</strong> e <strong>não guardamos dados de cartão</strong>. O pagamento é feito pelo Pix, no app do seu banco.
        </p>
      </section>

      <section className={secao}>
        <h2 className={h2}>Para que usamos</h2>
        <ul className="mt-2 list-disc space-y-1 pl-6">
          <li>Para fazer e entregar o seu pedido.</li>
          <li>Para falar com você no WhatsApp sobre o pedido ou o orçamento.</li>
        </ul>
      </section>

      <section className={secao}>
        <h2 className={h2}>Com quem compartilhamos</h2>
        <p className="mt-2">
          Com ninguém. <strong>Não vendemos nem compartilhamos</strong> os seus dados. Só a dona Lurdes e o neto, que cuidam dos pedidos, veem essas informações.
        </p>
      </section>

      <section className={secao}>
        <h2 className={h2}>Por quanto tempo guardamos</h2>
        <p className="mt-2">
          Guardamos os dados do pedido por até 1 ano, para organizar as entregas e as contas da confeitaria. Depois disso, apagamos.
        </p>
      </section>

      <section className={secao}>
        <h2 className={h2}>Como pedir para apagar</h2>
        <p className="mt-2">
          É só mandar uma mensagem no WhatsApp da loja,{' '}
          <a
            href={linkWhatsapp(config.whatsappLoja, 'Oi! Quero pedir para apagar os meus dados.')}
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-caramelo underline underline-offset-4"
          >
            {formatarWhatsapp(config.whatsappLoja)}
          </a>
          , pedindo para apagar os seus dados. Você também pode perguntar quais dados temos sobre você.
        </p>
      </section>

      <p className="mt-10 text-base text-chocolate-suave">Doces da Lurdes · Pelotas (RS)</p>
    </main>
  );
}
