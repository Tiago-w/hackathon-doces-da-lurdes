'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { FotoSabor } from '@/components/site/FotoSabor';

interface Slide {
  numero: string;
  etiqueta: string;
  titulo: string;
  subtitulo: string;
  notaApresentador: string;
  conteudo: React.ReactNode;
}

export default function PaginaSlides() {
  const [indice, setIndice] = useState(0);
  const [mostrarNotas, setMostrarNotas] = useState(false);
  const [telaCheia, setTelaCheia] = useState(false);

  const slides: Slide[] = [
    {
      numero: '01',
      etiqueta: 'Hackathon · Pitch Deck',
      titulo: 'Doces da Lurdes',
      subtitulo:
        'Tradição doceira de Pelotas há 18 anos, agora com vitrine digital de alta conversão e painel de cozinha ergonômico ("Modo Vovó").',
      notaApresentador:
        'Comece contando a história: a dona Lurdes faz doces tradicionais de Pelotas há 18 anos em casa. Nosso desafio foi digitalizar as encomendas sem perder o calor humano e sem criar um sistema impossível para ela operar.',
      conteudo: (
        <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
          <div className="space-y-6 lg:col-span-7">
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              <div className="rounded-2xl border border-borda bg-creme/70 p-4">
                <span className="text-xs font-bold uppercase tracking-wider text-caramelo">História</span>
                <p className="mt-1 font-titulo text-2xl font-bold text-chocolate sm:text-3xl">18 Anos</p>
                <p className="mt-0.5 text-xs text-chocolate-suave">Tradição artesanal em Pelotas/RS</p>
              </div>
              <div className="rounded-2xl border border-borda bg-creme/70 p-4">
                <span className="text-xs font-bold uppercase tracking-wider text-caramelo">Carro-Chefe</span>
                <p className="mt-1 font-titulo text-2xl font-bold text-chocolate sm:text-3xl">Caixa de 50</p>
                <p className="mt-0.5 text-xs text-chocolate-suave">Personalizável com preço fixo</p>
              </div>
              <div className="rounded-2xl border border-borda bg-creme/70 p-4">
                <span className="text-xs font-bold uppercase tracking-wider text-caramelo">Operação</span>
                <p className="mt-1 font-titulo text-2xl font-bold text-chocolate sm:text-3xl">Modo Vovó</p>
                <p className="mt-0.5 text-xs text-chocolate-suave">KDS de 1 toque + alerta sonoro</p>
              </div>
            </div>

            <div className="rounded-2xl border border-caramelo/35 bg-doce-de-leite/25 p-5">
              <p className="text-sm font-bold uppercase tracking-wider text-caramelo">Proposta de Valor</p>
              <p className="mt-1.5 text-base leading-relaxed text-chocolate sm:text-lg">
                Unimos uma <strong>experiência de compra editorial</strong> para o cliente final a um <strong>painel de cozinha projetado para a terceira idade</strong>, com regras de negócio blindadas no servidor.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 rounded-3xl border border-borda bg-creme/60 p-5 lg:col-span-5">
            {[
              'Quindim Tradicional',
              'Camafeu de Nozes',
              'Pastel de Santa Clara',
              'Bem-casado',
              'Ninho',
              'Olho de Sogra',
            ].map((nome) => (
              <div key={nome} className="flex flex-col items-center rounded-2xl bg-papel p-2.5 shadow-2xs border border-borda/60">
                <FotoSabor nome={nome} fotoUrl={null} sizes="96px" className="aspect-square w-full rounded-xl" />
                <span className="mt-1.5 line-clamp-1 text-center text-xs font-bold text-chocolate">{nome}</span>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      numero: '02',
      etiqueta: 'Contexto & Problema',
      titulo: 'O gargalo do atendimento manual no WhatsApp',
      subtitulo:
        'Quando cada pedido exige dezenas de mensagens, a cozinha para de produzir doces para responder perguntas repetitivas.',
      notaApresentador:
        'Explique os 4 problemas reais: 1) Cliente não sabe o que tem disponível hoje; 2) Contar 50 doces sortidos no WhatsApp gera erro de soma; 3) Risco de aceitar mais caixas do que a cozinha dá conta no dia; 4) Sistemas tradicionais têm letras miúdas e dezenas de botões que atrapalham a dona Lurdes.',
      conteudo: (
        <div className="grid gap-5 md:grid-cols-2">
          {[
            {
              tag: 'Problema 01 · Atendimento',
              titulo: 'Horas perdidas somando sabores no chat',
              texto:
                'Na Caixa de 50 doces, o cliente escolhe dezenas de combinações ("12 quindins, 8 camafeus, 15 ninhos..."). Conferir se a soma fecha em 50 e calcular o frete manualmente toma tempo da produção.',
            },
            {
              tag: 'Problema 02 · Estoque na Cozinha',
              titulo: 'Conflito entre o que acabou e o que o cliente pede',
              texto:
                'Quando um ingrediente acaba à tarde, o cliente não sabe e tenta pedir. Até a dona Lurdes avisar no WhatsApp, a venda já esfriou ou gerou frustração.',
            },
            {
              tag: 'Problema 03 · Capacidade Diária',
              titulo: 'Overbooking de Caixas de 50 e prazos',
              texto:
                'A cozinha artesanal tem limite físico de caixas por dia e exige 5 dias de antecedência para grandes encomendas, enquanto pedidos avulsos só saem no mesmo dia até as 14h.',
            },
            {
              tag: 'Problema 04 · Acessibilidade',
              titulo: 'ERPs convencionais são hostis na cozinha',
              texto:
                'Telas cheias de tabelas, fontes pequenas e menus escondidos não funcionam para uma doceira idosa com as mãos ocupadas durante o expediente.',
            },
          ].map((item) => (
            <div key={item.tag} className="rounded-2xl border border-borda bg-creme/50 p-6">
              <span className="text-xs font-bold uppercase tracking-wider text-caramelo">{item.tag}</span>
              <h3 className="mt-2 font-titulo text-xl font-bold text-chocolate">{item.titulo}</h3>
              <p className="mt-2 text-sm leading-relaxed text-chocolate-suave sm:text-base">{item.texto}</p>
            </div>
          ))}
        </div>
      ),
    },
    {
      numero: '03',
      etiqueta: 'Experiência do Cliente',
      titulo: 'Três fluxos de compra desenhados para conversão',
      subtitulo:
        'Do doce avulso para hoje à Caixa de 50 personalizada e orçamentos de casamento — tudo claro desde o primeiro clique.',
      notaApresentador:
        'Destaque os 3 caminhos do site (/pedido): Avulso (1 a 49 doces, sai no mesmo dia até 14h), Caixa de 50 (R$ 190 fixo, montador com atalhos de 1 clique) e Festa/Casamento (orçamento estruturado).',
      conteudo: (
        <div className="grid gap-5 md:grid-cols-3">
          <div className="flex flex-col justify-between rounded-2xl border border-borda bg-creme/45 p-6">
            <div>
              <span className="inline-block rounded-full bg-doce-de-leite/50 px-3 py-1 text-xs font-bold uppercase text-chocolate">
                1 a 49 unidades
              </span>
              <h3 className="mt-4 font-titulo text-2xl font-bold text-chocolate">1. Doces Avulsos</h3>
              <p className="mt-2 text-sm leading-relaxed text-chocolate-suave">
                Compra rápida por unidade. Se o pedido for feito antes do horário de corte (<strong>14h</strong> no fuso de Pelotas), libera entrega ou retirada <strong>no mesmo dia</strong>.
              </p>
            </div>
            <div className="mt-6 border-t border-borda/70 pt-3 text-xs font-bold text-caramelo">
              Rota: /pedido/avulso
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-2xl border-2 border-caramelo bg-doce-de-leite/25 p-6 shadow-xs">
            <div>
              <span className="inline-block rounded-full bg-caramelo px-3 py-1 text-xs font-bold uppercase text-white">
                Carro-Chefe · R$ 190,00
              </span>
              <h3 className="mt-4 font-titulo text-2xl font-bold text-chocolate">2. Caixa de 50 Doces</h3>
              <p className="mt-2 text-sm leading-relaxed text-chocolate-suave">
                Montador interativo com barra de progresso fixa, botões <code>+1</code>, <code>+5</code>, <code>+10</code> e <strong>Sugestão Clássica em 1 toque</strong>. Trava exatamente em 50 unidades.
              </p>
            </div>
            <div className="mt-6 border-t border-caramelo/30 pt-3 text-xs font-bold text-caramelo">
              Rota: /pedido/caixa
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-2xl border border-borda bg-creme/45 p-6">
            <div>
              <span className="inline-block rounded-full bg-doce-de-leite/50 px-3 py-1 text-xs font-bold uppercase text-chocolate">
                Grandes Eventos
              </span>
              <h3 className="mt-4 font-titulo text-2xl font-bold text-chocolate">3. Festas & Casamentos</h3>
              <p className="mt-2 text-sm leading-relaxed text-chocolate-suave">
                Formulário consultivo para casamentos, formaturas e aniversários. Registra o pedido no banco para a aba <em>Festas</em> do painel e gera link direto para o WhatsApp.
              </p>
            </div>
            <div className="mt-6 border-t border-borda/70 pt-3 text-xs font-bold text-caramelo">
              Rota: /pedido/festa
            </div>
          </div>
        </div>
      ),
    },
    {
      numero: '04',
      etiqueta: 'Checkout & Pagamento',
      titulo: 'Logística por Zonas de Pelotas e Pix BR Code Nativo',
      subtitulo:
        'Cálculo automático de frete por bairro, agenda inteligente de 30 dias e código Pix Copia e Cola gerado no padrão do Banco Central.',
      notaApresentador:
        'Mostre que o sistema não usa um texto fake de Pix: implementamos o gerador EMV BR Code com cálculo de checksum CRC16-CCITT real (src/lib/pix.ts). E o frete calcula automaticamente pelas 3 zonas de Pelotas com isenção acima de R$ 250.',
      conteudo: (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-borda bg-creme/50 p-6 space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-caramelo">Logística Local · Pelotas/RS</span>
            <h3 className="font-titulo text-2xl font-bold text-chocolate">Frete por Zona & Retirada Grátis</h3>
            <ul className="space-y-2.5 text-sm text-chocolate-suave">
              <li className="flex justify-between border-b border-borda/70 pb-2">
                <span><strong>Retirada no Centro</strong> ( endereço da dona Lurdes )</span>
                <span className="font-bold text-sucesso">Grátis</span>
              </li>
              <li className="flex justify-between border-b border-borda/70 pb-2">
                <span><strong>Zona 1</strong> (Centro, Porto, Simões Lopes, Navegantes)</span>
                <span className="font-bold text-chocolate">R$ 8,00</span>
              </li>
              <li className="flex justify-between border-b border-borda/70 pb-2">
                <span><strong>Zona 2</strong> (Três Vendas, Fragata, Areal, Dom Joaquim)</span>
                <span className="font-bold text-chocolate">R$ 12,00</span>
              </li>
              <li className="flex justify-between border-b border-borda/70 pb-2">
                <span><strong>Zona 3</strong> (Laranjal, Barro Duro, Colônia Z3)</span>
                <span className="font-bold text-chocolate">R$ 18,00</span>
              </li>
              <li className="flex justify-between pt-1">
                <span><strong>Cortesia automática</strong> em compras acima de R$ 250,00</span>
                <span className="font-bold text-sucesso">Frete R$ 0</span>
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-borda bg-creme/50 p-6 space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-caramelo">Pagamentos & Comprovante</span>
            <h3 className="font-titulo text-2xl font-bold text-chocolate">Pix EMV® BR Code (CRC16-CCITT)</h3>
            <p className="text-sm leading-relaxed text-chocolate-suave">
              Assim que o pedido é gravado, o servidor gera o payload oficial <strong>Pix Copia e Cola</strong> com chave, recebedor, cidade (<code>PELOTAS</code>), identificador da transação (<code>DOCESLURDES&#123;codigo&#125;</code>), valor exato e assinatura hexadecimal <code>CRC16</code>.
            </p>
            <div className="rounded-xl border border-borda bg-papel p-3.5 font-mono text-xs break-all text-chocolate-suave">
              00020126360014br.gov.bcb.pix011453999000000...53039865406190.005802BR5915Doces da Lurdes6007Pelotas6304A1F9
            </div>
            <p className="text-xs text-chocolate-suave">
              Página permanente do pedido (<code>/pedido/confirmado/[id]</code>) com botão de copiar Pix e envio direto do resumo para o WhatsApp da loja.
            </p>
          </div>
        </div>
      ),
    },
    {
      numero: '05',
      etiqueta: 'Inovação em Acessibilidade',
      titulo: 'Painel "Modo Vovó": Ergonomia Cognitiva na Cozinha',
      subtitulo:
        'Um Kitchen Display System (KDS) desenhado especificamente para que a dona Lurdes opere toda a produção sem depender do neto.',
      notaApresentador:
        'Este é o coração da apresentação. Mostre por que o Modo Vovó é diferente de um dashboard comum: fontes grandes (20px-34px), um único botão de próximo passo por pedido, alerta sonoro Web Audio API e botão Desfazer de 10 segundos.',
      conteudo: (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {[
            {
              titulo: '1 Único Botão de Próximo Passo',
              texto:
                'Sem dropdowns confusos. O cartão mostra apenas a próxima etapa lógica: "Começar a fazer" → "Marcar como pronto" → "Saiu para entrega" (ou pula para "Entregue" se for retirada).',
            },
            {
              titulo: 'Rede de Segurança: Desfazer em 10s',
              texto:
                'Tocou sem querer em "Entregue" ou "Acabou"? Uma faixa amarela grande aparece na hora com o botão "Desfazer" por 10 segundos para reverter com 1 toque.',
            },
            {
              titulo: 'Alerta Sonoro (Web Audio API)',
              texto:
                'Tela inicial "Começar o dia" destrava o áudio do navegador e toca um sinal sonoro suave (plim-plim sintetizado) a cada novo pedido, repetindo a cada 30s até ela ver.',
            },
            {
              titulo: 'Calendário de 30 Dias Editável',
              texto:
                'A dona Lurdes fecha dias de folga/feriado com 1 toque ou aumenta o limite de Caixas de 50 de um dia específico, sincronizando na hora com o calendário do site e do checkout.',
            },
            {
              titulo: 'Estoque Instantâneo ("Tem" / "Acabou")',
              texto:
                'Na aba Sabores, tocar em "Acabou" bloqueia o doce imediatamente na vitrine pública e no montador da Caixa de 50, sem precisar editar cadastros complexos.',
            },
          ].map((card) => (
            <div key={card.titulo} className="rounded-2xl border border-borda bg-creme/55 p-5 flex flex-col justify-between">
              <div>
                <span className="inline-block size-2.5 rounded-full bg-caramelo mb-3" />
                <h3 className="font-titulo text-xl font-bold text-chocolate">{card.titulo}</h3>
                <p className="mt-2 text-sm leading-relaxed text-chocolate-suave">{card.texto}</p>
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      numero: '06',
      etiqueta: 'Arquitetura & Engenharia',
      titulo: 'Segurança, Concorrência e Testes Automatizados',
      subtitulo:
        'Arquitetura em camadas com validação estrita no servidor, lock transacional no PostgreSQL e 59 testes automatizados.',
      notaApresentador:
        'Para os jurados técnicos: destaque o pg_advisory_xact_lock que impede race condition na última vaga de Caixa de 50 do dia, a separação estrita de server-only vs Server Actions com HMAC-SHA256, e os 59 testes no Vitest.',
      conteudo: (
        <div className="grid gap-5 md:grid-cols-3">
          <div className="rounded-2xl border border-borda bg-creme/50 p-5">
            <span className="text-xs font-bold uppercase tracking-wider text-caramelo">Integridade Financeira</span>
            <h3 className="mt-2 font-titulo text-xl font-bold text-chocolate">Zero Confiança no Front-end</h3>
            <p className="mt-2 text-sm leading-relaxed text-chocolate-suave">
              O navegador envia apenas IDs e quantidades. Preços, fretes por bairro, datas elegíveis e disponibilidade são recalculados no servidor em <code>src/lib/regras.ts</code>. Pedidos gravam snapshot histórico de preço.
            </p>
          </div>

          <div className="rounded-2xl border border-borda bg-creme/50 p-5">
            <span className="text-xs font-bold uppercase tracking-wider text-caramelo">Concorrência no Banco</span>
            <h3 className="mt-2 font-titulo text-xl font-bold text-chocolate">Lock Transacional PostgreSQL</h3>
            <p className="mt-2 text-sm leading-relaxed text-chocolate-suave">
              Uso de <code>pg_advisory_xact_lock</code> por data de entrega na criação do pedido: se dois clientes tentarem fechar a última Caixa de 50 disponível do dia ao mesmo tempo, apenas um conclui e o outro recebe aviso amigável.
            </p>
          </div>

          <div className="rounded-2xl border border-borda bg-creme/50 p-5">
            <span className="text-xs font-bold uppercase tracking-wider text-caramelo">Segurança & Qualidade</span>
            <h3 className="mt-2 font-titulo text-xl font-bold text-chocolate">HMAC-SHA256 + 59 Testes</h3>
            <p className="mt-2 text-sm leading-relaxed text-chocolate-suave">
              Fronteira <code>&apos;use server&apos;</code> isolada em <code>_dados/index.ts</code>. Sessão do painel assinada via HMAC-SHA256 com <code>timingSafeEqual</code>. <strong>59 testes unitários e de integração</strong> rodando com Vitest.
            </p>
          </div>
        </div>
      ),
    },
    {
      numero: '07',
      etiqueta: 'Demonstração ao Vivo',
      titulo: 'Vamos testar na prática?',
      subtitulo:
        'Acesse agora a vitrine pública para montar uma Caixa de 50 doces e acompanhe o pedido chegando ao vivo no Painel da Dona Lurdes.',
      notaApresentador:
        'Convide a banca para ver a demo ao vivo: clique em "Abrir Montador da Caixa de 50", use o botão de preenchimento rápido de 50 doces, finalize o pedido e mostre ele tocando o som ao vivo no /painel!',
      conteudo: (
        <div className="grid gap-6 md:grid-cols-2">
          <div className="flex flex-col justify-between rounded-3xl border-2 border-caramelo bg-doce-de-leite/30 p-7">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-caramelo">Passo 1 da Demo</span>
              <h3 className="mt-2 font-titulo text-3xl font-bold text-chocolate">Visão do Cliente</h3>
              <p className="mt-2 text-base text-chocolate-suave">
                Explore a vitrine editorial, use o preenchimento de 1 toque na Caixa de 50 doces e gere o Pix Copia e Cola.
              </p>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/"
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-caramelo px-5 py-2.5 text-sm font-bold text-white hover:bg-caramelo-escuro"
              >
                Abrir Vitrine Inicial (/)
              </Link>
              <Link
                href="/pedido/caixa"
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-caramelo bg-papel px-5 py-2.5 text-sm font-bold text-caramelo hover:bg-creme"
              >
                Montador da Caixa (/pedido/caixa)
              </Link>
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-3xl border-2 border-chocolate bg-chocolate p-7 text-creme">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-doce-de-leite">Passo 2 da Demo</span>
              <h3 className="mt-2 font-titulo text-3xl font-bold text-papel">Visão da Dona Lurdes</h3>
              <p className="mt-2 text-base text-creme/85">
                Entre com a senha <code className="rounded bg-papel/15 px-2 py-0.5 font-mono text-doce-de-leite">lurdes123</code>, ative o som da cozinha, avance o status com 1 toque e teste o botão <strong>Acabou</strong>.
              </p>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/painel"
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-doce-de-leite px-5 py-2.5 text-sm font-bold text-chocolate hover:bg-[#f2cfa0]"
              >
                Abrir Painel Modo Vovó (/painel)
              </Link>
            </div>
          </div>
        </div>
      ),
    },
  ];

  const total = slides.length;
  const slideAtual = slides[indice];

  const proximo = useCallback(() => {
    setIndice((i) => Math.min(total - 1, i + 1));
  }, [total]);

  const anterior = useCallback(() => {
    setIndice((i) => Math.max(0, i - 1));
  }, []);

  const alternarTelaCheia = useCallback(() => {
    if (typeof document === 'undefined') return;
    if (!document.fullscreenElement) {
      void document.documentElement.requestFullscreen?.();
      setTelaCheia(true);
    } else {
      void document.exitFullscreen?.();
      setTelaCheia(false);
    }
  }, []);

  useEffect(() => {
    function aoTeclar(e: KeyboardEvent) {
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        proximo();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        anterior();
      } else if (e.key === 'n' || e.key === 'N') {
        setMostrarNotas((v) => !v);
      } else if (e.key === 'f' || e.key === 'F') {
        alternarTelaCheia();
      }
    }
    window.addEventListener('keydown', aoTeclar);
    return () => window.removeEventListener('keydown', aoTeclar);
  }, [proximo, anterior, alternarTelaCheia]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      {/* Barra de controle da apresentação */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-borda bg-papel px-4 py-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <span className="rounded-lg bg-chocolate px-2.5 py-1 font-titulo text-sm font-bold text-doce-de-leite">
            Slide {indice + 1} / {total}
          </span>
          <span className="text-xs font-medium text-chocolate-suave hidden sm:inline">
            Use as setas <strong>←</strong> <strong>→</strong> do teclado para navegar
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setMostrarNotas((v) => !v)}
            className={`rounded-xl border px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
              mostrarNotas
                ? 'border-caramelo bg-doce-de-leite/40 text-chocolate'
                : 'border-borda bg-creme text-chocolate-suave hover:text-chocolate'
            }`}
          >
            {mostrarNotas ? 'Ocultar Dica de Fala (N)' : 'Ver Dica de Fala (N)'}
          </button>
          <button
            type="button"
            onClick={alternarTelaCheia}
            className="rounded-xl border border-borda bg-creme px-3 py-1.5 text-xs font-bold text-chocolate hover:border-caramelo cursor-pointer"
          >
            {telaCheia ? 'Sair da Tela Cheia (F)' : 'Tela Cheia (F)'}
          </button>
        </div>
      </div>

      {/* Palco do Slide */}
      <article className="relative min-h-[500px] flex flex-col justify-between rounded-3xl border border-borda bg-papel p-6 shadow-[0_24px_60px_-15px_rgba(44,24,16,0.10)] sm:p-10 lg:p-12">
        <div>
          <header className="border-b border-borda/80 pb-6">
            <div className="flex items-center justify-between gap-4">
              <span className="inline-flex items-center gap-2 rounded-full border border-caramelo/25 bg-doce-de-leite/30 px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-caramelo">
                {slideAtual.etiqueta}
              </span>
              <span className="font-titulo text-3xl font-bold text-caramelo/35">{slideAtual.numero}</span>
            </div>
            <h1 className="mt-4 font-titulo text-3xl font-bold tracking-tight text-chocolate sm:text-4xl lg:text-5xl">
              {slideAtual.titulo}
            </h1>
            <p className="mt-3 max-w-3xl text-base leading-relaxed text-chocolate-suave sm:text-lg">
              {slideAtual.subtitulo}
            </p>
          </header>

          <div className="mt-8">{slideAtual.conteudo}</div>
        </div>

        {/* Rodapé interno do slide com progresso e controles */}
        <footer className="mt-10 pt-6 border-t border-borda/70 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            {slides.map((s, i) => (
              <button
                key={s.numero}
                type="button"
                onClick={() => setIndice(i)}
                aria-label={`Ir para slide ${i + 1}`}
                className={`h-2.5 rounded-full transition-all cursor-pointer ${
                  i === indice ? 'w-8 bg-caramelo' : 'w-2.5 bg-borda hover:bg-caramelo/50'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={anterior}
              disabled={indice === 0}
              className="min-h-11 rounded-xl border border-borda bg-creme px-4 py-2 text-sm font-bold text-chocolate transition-colors hover:border-caramelo disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
            >
              ← Anterior
            </button>
            <button
              type="button"
              onClick={proximo}
              disabled={indice === total - 1}
              className="min-h-11 rounded-xl bg-caramelo px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-caramelo-escuro disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
            >
              Próximo →
            </button>
          </div>
        </footer>
      </article>

      {/* Nota do apresentador (expansível) */}
      {mostrarNotas && (
        <aside className="mt-4 rounded-2xl border border-caramelo/40 bg-doce-de-leite/25 p-5 text-chocolate">
          <p className="text-xs font-bold uppercase tracking-wider text-caramelo">Roteiro sugerido para o apresentador neste slide:</p>
          <p className="mt-1 text-base leading-relaxed">{slideAtual.notaApresentador}</p>
        </aside>
      )}
    </main>
  );
}
