'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Bairro, ConfigPublica, DataISO, EntradaPedido, ErroCampo, FormaEntrega, Produto, ResultadoCalculo } from '@/lib/contrato';
import { formatarReais } from '@/lib/dinheiro';
import { whatsappValido } from '@/lib/whatsapp';
import { calcularPedido, criarPedido } from '@/app/(site)/_dados';
import { paraItens, totalUnidades, useCarrinho } from './carrinho';
import { AceitePrivacidade } from './AceitePrivacidade';
import { CampoWhatsapp } from './CampoWhatsapp';
import { MensagemErro } from './MensagemErro';
import { rotuloBotaoData } from './datas';
import { botaoPrincipal, campoTexto, cartao, rotuloCampo, titulo } from './estilos';
import { IconeAlerta, IconeCasa, IconeEntrega, IconePix } from './icones';

interface Props {
  produtos: Produto[];
  bairros: Bairro[];
  config: ConfigPublica;
  hoje: DataISO;
}

type Erros = Record<string, string>;

/** Ordem dos campos na tela: o foco vai para o primeiro que tiver erro. */
const ORDEM_CAMPOS: { campo: string; foco: string }[] = [
  { campo: 'itens', foco: 'resumo' },
  { campo: 'cliente.nome', foco: 'campo-nome' },
  { campo: 'cliente.whatsapp', foco: 'campo-whatsapp' },
  { campo: 'formaEntrega', foco: 'campo-forma-RETIRADA' },
  { campo: 'bairroId', foco: 'campo-bairro' },
  { campo: 'endereco', foco: 'campo-endereco' },
  { campo: 'dataEntrega', foco: 'campo-data-0' },
  { campo: 'aceitouPrivacidade', foco: 'campo-aceite' },
  { campo: 'geral', foco: 'erro-geral' },
];

const DATAS_INICIAIS = 6;

function agruparErros(lista: ErroCampo[]): Erros {
  const erros: Erros = {};
  const conhecidos = new Set(ORDEM_CAMPOS.map((c) => c.campo));
  for (const e of lista) {
    const campo = e.produtoId ? 'itens' : e.campo && conhecidos.has(e.campo) ? e.campo : 'geral';
    erros[campo] = erros[campo] ? `${erros[campo]} ${e.mensagem}` : e.mensagem;
  }
  return erros;
}

export function Checkout({ produtos, bairros, config, hoje }: Props) {
  const router = useRouter();
  const carrinho = useCarrinho();
  const tipo = carrinho.tipoAtivo;
  const quantidades = tipo === 'CAIXA_50' ? carrinho.caixa : carrinho.avulso;
  const itens = useMemo(() => paraItens(quantidades), [quantidades]);
  const chaveItens = JSON.stringify(itens);

  const [nome, setNome] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [formaEntrega, setFormaEntrega] = useState<FormaEntrega | null>(null);
  const [bairroId, setBairroId] = useState('');
  const [endereco, setEndereco] = useState('');
  const [dataEntrega, setDataEntrega] = useState<DataISO | null>(null);
  const [observacao, setObservacao] = useState('');
  const [aceite, setAceite] = useState(false);
  const [verMaisDatas, setVerMaisDatas] = useState(false);

  const [calculo, setCalculo] = useState<ResultadoCalculo | null>(null);
  const [calculando, setCalculando] = useState(false);
  const [falhaCalculo, setFalhaCalculo] = useState(false);
  const [erros, setErros] = useState<Erros>({});
  const [enviando, setEnviando] = useState(false);
  const enviandoRef = useRef(false);
  const focarErro = useRef(false);

  const porId = useMemo(() => new Map(produtos.map((p) => [p.id, p])), [produtos]);
  const bairrosPorZona = useMemo(() => {
    const zonas = new Map<number, Bairro[]>();
    for (const b of bairros) zonas.set(b.zona, [...(zonas.get(b.zona) ?? []), b]);
    return [...zonas.entries()].sort(([a], [b]) => a - b);
  }, [bairros]);

  // Sem carrinho: volta para a escolha do pedido.
  useEffect(() => {
    if (carrinho.pronto && !enviandoRef.current && (!tipo || itens.length === 0)) router.replace('/pedido');
  }, [carrinho.pronto, tipo, itens.length, router]);

  // Recalcula totais e datas no servidor (com debounce) a cada mudança que afeta o valor.
  useEffect(() => {
    if (!tipo || itens.length === 0) return;
    let cancelado = false;
    setCalculando(true);
    const t = setTimeout(async () => {
      try {
        const r = await calcularPedido({
          tipo,
          itens: JSON.parse(chaveItens) as EntradaPedido['itens'],
          formaEntrega: formaEntrega ?? undefined,
          bairroId: formaEntrega === 'ENTREGA' && bairroId ? bairroId : null,
          dataEntrega: dataEntrega ?? undefined,
        });
        if (cancelado) return;
        setCalculo(r);
        setFalhaCalculo(false);
        if (dataEntrega && !r.datasPermitidas.some((d) => d.data === dataEntrega)) setDataEntrega(null);
      } catch {
        if (!cancelado) setFalhaCalculo(true);
      } finally {
        if (!cancelado) setCalculando(false);
      }
    }, 350);
    return () => {
      cancelado = true;
      clearTimeout(t);
    };
  }, [tipo, chaveItens, itens.length, formaEntrega, bairroId, dataEntrega]);

  // Depois de mostrar os erros, leva o foco ao primeiro deles.
  useEffect(() => {
    if (!focarErro.current) return;
    focarErro.current = false;
    const primeiro = ORDEM_CAMPOS.find((c) => erros[c.campo]);
    const el = primeiro && document.getElementById(primeiro.foco);
    if (el) {
      el.focus();
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [erros]);

  function limparErro(campo: string) {
    if (erros[campo]) setErros(({ [campo]: _x, ...resto }) => (void _x, resto));
  }

  function validarNoNavegador(): Erros {
    const e: Erros = {};
    if (nome.trim().length < 2) e['cliente.nome'] = 'Escreva o seu nome.';
    if (!whatsappValido(whatsapp)) e['cliente.whatsapp'] = 'Confira o WhatsApp: DDD e mais 9 números. Ex.: (53) 99999-9999.';
    if (!formaEntrega) e.formaEntrega = 'Escolha se vai buscar ou se quer entrega.';
    if (formaEntrega === 'ENTREGA' && !bairroId) e.bairroId = 'Escolha o seu bairro.';
    if (formaEntrega === 'ENTREGA' && !endereco.trim()) e.endereco = 'Escreva a rua, o número e um ponto de referência.';
    if (!dataEntrega) e.dataEntrega = 'Escolha o dia.';
    if (!aceite) e.aceitouPrivacidade = 'Marque que você concorda com o aviso de privacidade.';
    return e;
  }

  async function enviar(ev: React.FormEvent) {
    ev.preventDefault();
    // Trava contra toque duplo: o ref muda na hora, antes de o React redesenhar.
    if (enviandoRef.current || !tipo) return;
    const locais = validarNoNavegador();
    if (Object.keys(locais).length) {
      focarErro.current = true;
      setErros(locais);
      return;
    }
    enviandoRef.current = true;
    setEnviando(true);
    setErros({});
    try {
      const r = await criarPedido({
        tipo,
        itens,
        cliente: { nome: nome.trim(), whatsapp },
        formaEntrega: formaEntrega!,
        bairroId: formaEntrega === 'ENTREGA' ? bairroId : null,
        endereco: formaEntrega === 'ENTREGA' ? endereco.trim() : null,
        dataEntrega: dataEntrega!,
        observacao: observacao.trim() || null,
        formaPagamento: 'PIX',
        aceitouPrivacidade: aceite,
      });
      if (r.ok) {
        router.push(`/pedido/confirmado/${encodeURIComponent(r.pedidoId)}`);
        return; // continua travado até sair da página
      }
      focarErro.current = true;
      setErros(agruparErros(r.erros));
    } catch {
      focarErro.current = true;
      setErros({ geral: 'Não conseguimos enviar. Verifique a internet e tente de novo.' });
    }
    enviandoRef.current = false;
    setEnviando(false);
  }

  if (!carrinho.pronto || !tipo || itens.length === 0) {
    return <p className="py-10 text-center text-lg text-chocolate-suave">Carregando seu pedido...</p>;
  }

  const datas = calculo?.datasPermitidas ?? [];
  const datasVisiveis = verMaisDatas ? datas : datas.slice(0, DATAS_INICIAIS);
  const unidades = totalUnidades(quantidades);
  const voltarPara = tipo === 'CAIXA_50' ? '/pedido/caixa' : '/pedido/avulso';
  const regraData =
    tipo === 'CAIXA_50'
      ? `A Caixa de 50 é feita com ${config.antecedenciaDiasCaixaFesta} dias de antecedência. Dias sem vaga não aparecem.`
      : `Pedidos feitos até as ${config.horarioCorteMesmoDia.replace(':00', 'h')} podem sair no mesmo dia.`;

  const resumo = (
    <section id="resumo" tabIndex={-1} aria-labelledby="titulo-resumo" className={`${cartao} ${erros.itens ? 'border-2 border-erro' : ''}`}>
      <h2 id="titulo-resumo" className={`${titulo} text-2xl`}>
        Resumo do pedido
      </h2>
      <p className="mt-1 text-lg text-chocolate-suave">
        {tipo === 'CAIXA_50' ? 'Caixa de 50 doces' : `${unidades} ${unidades === 1 ? 'doce avulso' : 'doces avulsos'}`}
      </p>
      <ul className="mt-3 divide-y divide-borda">
        {itens.map((i) => (
          <li key={i.produtoId} className="flex justify-between gap-2 py-2 text-lg">
            <span>{porId.get(i.produtoId)?.nome ?? 'Sabor'}</span>
            <span className="font-bold tabular-nums">{i.quantidade}</span>
          </li>
        ))}
      </ul>
      <Link href={voltarPara} className="mt-1 inline-flex min-h-12 items-center font-bold text-caramelo underline underline-offset-4">
        Mudar os doces
      </Link>
      <MensagemErro id="erro-itens" texto={erros.itens} />

      <dl className="mt-3 space-y-1 border-t-2 border-borda pt-3 text-lg" aria-live="polite" aria-busy={calculando}>
        <div className="flex justify-between">
          <dt>Doces</dt>
          <dd className="tabular-nums">{calculo ? formatarReais(calculo.subtotalCentavos) : '...'}</dd>
        </div>
        <div className="flex justify-between">
          <dt>{formaEntrega === 'RETIRADA' ? 'Retirada' : 'Entrega'}</dt>
          <dd className="tabular-nums">
            {!formaEntrega
              ? 'escolha abaixo'
              : formaEntrega === 'RETIRADA'
                ? 'Grátis'
                : calculo?.freteCortesia
                  ? 'Frete grátis!'
                  : bairroId && calculo
                    ? formatarReais(calculo.freteCentavos)
                    : 'escolha o bairro'}
          </dd>
        </div>
        <div className="flex items-baseline justify-between border-t border-borda pt-2">
          <dt className="text-xl font-bold">Total</dt>
          <dd className="text-3xl font-bold tabular-nums text-chocolate">{calculo ? formatarReais(calculo.totalCentavos) : '...'}</dd>
        </div>
      </dl>
      {formaEntrega === 'ENTREGA' && calculo && !calculo.freteCortesia && (
        <p className="mt-2 text-base text-chocolate-suave">Frete grátis em pedidos acima de {formatarReais(config.freteCortesiaAcimaCentavos)}.</p>
      )}
      {falhaCalculo && (
        <p className="mt-2 text-base font-bold text-erro">Não conseguimos atualizar o total. Verifique a internet.</p>
      )}
    </section>
  );

  return (
    <form onSubmit={enviar} noValidate className="grid gap-6 lg:grid-cols-[1fr_22rem] lg:items-start">
      <div className="flex flex-col gap-6">
        <fieldset className={cartao}>
          <legend className={`${titulo} float-left mb-4 w-full text-2xl`}>1. Seus dados</legend>
          <div className="clear-both flex flex-col gap-5">
            <div>
              <label htmlFor="campo-nome" className={rotuloCampo}>
                Seu nome
              </label>
              <input
                id="campo-nome"
                name="nome"
                autoComplete="name"
                className={campoTexto}
                value={nome}
                onChange={(e) => {
                  setNome(e.target.value);
                  limparErro('cliente.nome');
                }}
                aria-invalid={erros['cliente.nome'] ? true : undefined}
                aria-describedby={erros['cliente.nome'] ? 'campo-nome-erro' : undefined}
              />
              <MensagemErro id="campo-nome-erro" texto={erros['cliente.nome']} />
            </div>
            <CampoWhatsapp
              id="campo-whatsapp"
              valor={whatsapp}
              onMudar={(v) => {
                setWhatsapp(v);
                limparErro('cliente.whatsapp');
              }}
              erro={erros['cliente.whatsapp']}
            />
          </div>
        </fieldset>

        <fieldset className={cartao} aria-describedby={erros.formaEntrega ? 'campo-forma-erro' : undefined}>
          <legend className={`${titulo} float-left mb-4 w-full text-2xl`}>2. Como quer receber?</legend>
          <div className="clear-both grid gap-3 sm:grid-cols-2">
            {(
              [
                { valor: 'RETIRADA', nome: 'Vou buscar', texto: `Grátis. ${config.enderecoRetirada}.`, icone: <IconeCasa /> },
                { valor: 'ENTREGA', nome: 'Quero entrega', texto: 'Taxa conforme o bairro.', icone: <IconeEntrega /> },
              ] as const
            ).map((op) => (
              <label
                key={op.valor}
                className="flex min-h-24 cursor-pointer items-start gap-3 rounded-2xl border-2 border-borda bg-papel p-4 has-checked:border-caramelo has-checked:bg-doce-de-leite/30 has-focus-visible:outline-3 has-focus-visible:outline-caramelo"
              >
                <input
                  id={`campo-forma-${op.valor}`}
                  type="radio"
                  name="formaEntrega"
                  value={op.valor}
                  checked={formaEntrega === op.valor}
                  onChange={() => {
                    setFormaEntrega(op.valor);
                    limparErro('formaEntrega');
                  }}
                  className="mt-1 size-6 shrink-0 accent-caramelo"
                />
                <span>
                  <span className="flex items-center gap-2 text-xl font-bold text-chocolate">
                    <span className="text-caramelo">{op.icone}</span>
                    {op.nome}
                  </span>
                  <span className="mt-1 block text-base text-chocolate-suave">{op.texto}</span>
                </span>
              </label>
            ))}
          </div>
          <MensagemErro id="campo-forma-erro" texto={erros.formaEntrega} />

          {formaEntrega === 'ENTREGA' && (
            <div className="mt-5 flex flex-col gap-5">
              <div>
                <label htmlFor="campo-bairro" className={rotuloCampo}>
                  Bairro
                </label>
                <select
                  id="campo-bairro"
                  className={campoTexto}
                  value={bairroId}
                  onChange={(e) => {
                    setBairroId(e.target.value);
                    limparErro('bairroId');
                  }}
                  aria-invalid={erros.bairroId ? true : undefined}
                  aria-describedby={erros.bairroId ? 'campo-bairro-erro' : undefined}
                >
                  <option value="">Escolha o bairro</option>
                  {bairrosPorZona.map(([zona, lista]) => (
                    <optgroup key={zona} label={`Zona ${zona}`}>
                      {lista.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.nome} · {formatarReais(b.freteCentavos)}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <MensagemErro id="campo-bairro-erro" texto={erros.bairroId} />
                <p className="mt-2 text-base text-chocolate-suave">Seu bairro não está na lista? Fale com a gente no WhatsApp.</p>
              </div>
              <div>
                <label htmlFor="campo-endereco" className={rotuloCampo}>
                  Endereço
                </label>
                <p id="campo-endereco-ajuda" className="mb-2 text-base text-chocolate-suave">
                  Rua, número e um ponto de referência.
                </p>
                <textarea
                  id="campo-endereco"
                  rows={2}
                  autoComplete="street-address"
                  className={campoTexto}
                  value={endereco}
                  onChange={(e) => {
                    setEndereco(e.target.value);
                    limparErro('endereco');
                  }}
                  aria-invalid={erros.endereco ? true : undefined}
                  aria-describedby={erros.endereco ? 'campo-endereco-ajuda campo-endereco-erro' : 'campo-endereco-ajuda'}
                />
                <MensagemErro id="campo-endereco-erro" texto={erros.endereco} />
              </div>
            </div>
          )}
        </fieldset>

        <fieldset className={cartao} aria-describedby={`regra-data${erros.dataEntrega ? ' campo-data-erro' : ''}`}>
          <legend className={`${titulo} float-left mb-2 w-full text-2xl`}>3. Para quando?</legend>
          <p id="regra-data" className="clear-both mb-4 text-lg text-chocolate-suave">
            {regraData}
          </p>
          {!calculo ? (
            <p className="text-lg text-chocolate-suave">Buscando as datas...</p>
          ) : datas.length === 0 ? (
            <p className="text-lg font-bold">Não há datas livres agora. Fale com a gente no WhatsApp.</p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {datasVisiveis.map((d, i) => {
                  const r = rotuloBotaoData(d.data, hoje);
                  return (
                    <label
                      key={d.data}
                      className="flex min-h-18 cursor-pointer items-center gap-3 rounded-2xl border-2 border-borda bg-papel p-3 has-checked:border-caramelo has-checked:bg-doce-de-leite/30 has-focus-visible:outline-3 has-focus-visible:outline-caramelo"
                    >
                      <input
                        id={`campo-data-${i}`}
                        type="radio"
                        name="dataEntrega"
                        value={d.data}
                        checked={dataEntrega === d.data}
                        onChange={() => {
                          setDataEntrega(d.data);
                          limparErro('dataEntrega');
                        }}
                        className="size-6 shrink-0 accent-caramelo"
                      />
                      <span>
                        <span className="block text-xl font-bold leading-tight">{r.principal}</span>
                        <span className="block text-base text-chocolate-suave">{r.detalhe}</span>
                        {d.mesmoDia && <span className="mt-0.5 block text-base font-bold text-sucesso">Sai hoje</span>}
                      </span>
                    </label>
                  );
                })}
              </div>
              {datas.length > DATAS_INICIAIS && (
                <button
                  type="button"
                  className="mt-3 inline-flex min-h-12 items-center font-bold text-caramelo underline underline-offset-4"
                  onClick={() => setVerMaisDatas((v) => !v)}
                  aria-expanded={verMaisDatas}
                >
                  {verMaisDatas ? 'Ver menos datas' : 'Ver mais datas'}
                </button>
              )}
            </>
          )}
          <MensagemErro id="campo-data-erro" texto={erros.dataEntrega} />
        </fieldset>

        <div className={cartao}>
          <label htmlFor="campo-obs" className={`${titulo} mb-1 block text-2xl`}>
            4. Observação <span className="text-lg font-normal text-chocolate-suave">(se quiser)</span>
          </label>
          <p id="campo-obs-ajuda" className="mb-3 text-lg text-chocolate-suave">
            Alguma coisa que a dona Lurdes precisa saber?
          </p>
          <textarea
            id="campo-obs"
            rows={3}
            maxLength={500}
            className={campoTexto}
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            aria-describedby="campo-obs-ajuda"
          />
        </div>
      </div>

      <div className="flex flex-col gap-4 lg:sticky lg:top-4">
        {resumo}
        <AceitePrivacidade
          id="campo-aceite"
          marcado={aceite}
          onMudar={(v) => {
            setAceite(v);
            limparErro('aceitouPrivacidade');
          }}
          erro={erros.aceitouPrivacidade}
        />
        {erros.geral && (
          <div
            id="erro-geral"
            tabIndex={-1}
            role="alert"
            className="flex items-start gap-2 rounded-2xl border-2 border-erro bg-erro-fundo p-4 text-lg font-bold text-erro"
          >
            <IconeAlerta className="mt-0.5 size-6 shrink-0" />
            {erros.geral}
          </div>
        )}
        <button type="submit" className={`${botaoPrincipal} w-full`} disabled={enviando} aria-disabled={enviando}>
          <IconePix />
          {enviando ? 'Enviando...' : 'Fazer pedido e pagar no Pix'}
        </button>
        <p className="text-center text-base text-chocolate-suave">Você vê o código Pix na próxima tela.</p>
      </div>

      {/* No celular o resumo fica lá embaixo: esta barra deixa o total sempre à vista. */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-caramelo bg-papel px-4 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 lg:hidden">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
          <p className="text-lg">
            Total: <strong className="text-2xl tabular-nums">{calculo ? formatarReais(calculo.totalCentavos) : '...'}</strong>
          </p>
          <a href="#resumo" className="inline-flex min-h-12 items-center font-bold text-caramelo underline underline-offset-4">
            Ver resumo
          </a>
        </div>
      </div>
    </form>
  );
}
