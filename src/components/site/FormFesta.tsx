'use client';
import { useEffect, useRef, useState } from 'react';
import type { DataISO, ErroCampo } from '@/lib/contrato';
import { linkWhatsapp, whatsappValido } from '@/lib/whatsapp';
import { criarOrcamentoFesta } from '@/app/(site)/_dados';
import { AceitePrivacidade } from './AceitePrivacidade';
import { CampoWhatsapp } from './CampoWhatsapp';
import { MensagemErro } from './MensagemErro';
import { botaoPrincipal, botaoWhatsapp, campoTexto, cartao, rotuloCampo, titulo } from './estilos';
import { IconeAlerta, IconeCheck, IconeWhatsapp } from './icones';

const TIPOS = ['Casamento', 'Aniversário', 'Formatura', 'Empresa', 'Outro'] as const;

const ORDEM: { campo: string; foco: string }[] = [
  { campo: 'nome', foco: 'festa-nome' },
  { campo: 'whatsapp', foco: 'festa-whatsapp' },
  { campo: 'tipoEvento', foco: 'festa-tipo-0' },
  { campo: 'dataEvento', foco: 'festa-data' },
  { campo: 'quantidadeDoces', foco: 'festa-qtd' },
  { campo: 'aceitouPrivacidade', foco: 'festa-aceite' },
  { campo: 'geral', foco: 'festa-erro-geral' },
];

interface Props {
  dataMinima: DataISO;
  antecedenciaDias: number;
  whatsappLoja: string;
}

export function FormFesta({ dataMinima, antecedenciaDias, whatsappLoja }: Props) {
  const [nome, setNome] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [tipoEvento, setTipoEvento] = useState('');
  const [dataEvento, setDataEvento] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [observacao, setObservacao] = useState('');
  const [aceite, setAceite] = useState(false);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const enviandoRef = useRef(false);
  const focar = useRef(false);
  const sucessoRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (!focar.current) return;
    focar.current = false;
    const primeiro = ORDEM.find((c) => erros[c.campo]);
    const el = primeiro && document.getElementById(primeiro.foco);
    el?.focus();
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [erros]);

  useEffect(() => {
    if (enviado) sucessoRef.current?.focus();
  }, [enviado]);

  function limpar(campo: string) {
    if (erros[campo]) setErros(({ [campo]: _x, ...resto }) => (void _x, resto));
  }

  async function enviar(ev: React.FormEvent) {
    ev.preventDefault();
    if (enviandoRef.current) return;
    const e: Record<string, string> = {};
    if (nome.trim().length < 2) e.nome = 'Escreva o seu nome.';
    if (!whatsappValido(whatsapp)) e.whatsapp = 'Confira o WhatsApp: DDD e mais 9 números. Ex.: (53) 99999-9999.';
    if (!tipoEvento) e.tipoEvento = 'Escolha o tipo de festa.';
    if (!dataEvento) e.dataEvento = 'Escolha a data da festa.';
    else if (dataEvento < dataMinima) e.dataEvento = `A festa precisa ser daqui a pelo menos ${antecedenciaDias} dias.`;
    const qtd = quantidade.trim() ? Number(quantidade.replace(/\D/g, '')) : null;
    if (qtd !== null && (!Number.isInteger(qtd) || qtd < 1)) e.quantidadeDoces = 'Escreva só o número de doces. Ex.: 300.';
    if (!aceite) e.aceitouPrivacidade = 'Marque que você concorda com o aviso de privacidade.';
    if (Object.keys(e).length) {
      focar.current = true;
      setErros(e);
      return;
    }

    enviandoRef.current = true;
    setEnviando(true);
    setErros({});
    try {
      const r = await criarOrcamentoFesta({
        nome: nome.trim(),
        whatsapp,
        dataEvento,
        tipoEvento,
        quantidadeDoces: qtd,
        observacao: observacao.trim() || null,
        aceitouPrivacidade: aceite,
      });
      if (r.ok) {
        setEnviado(true);
        return;
      }
      const porCampo: Record<string, string> = {};
      const conhecidos = new Set(ORDEM.map((o) => o.campo));
      r.erros.forEach((er: ErroCampo) => {
        const c = er.campo && conhecidos.has(er.campo) ? er.campo : 'geral';
        porCampo[c] = porCampo[c] ? `${porCampo[c]} ${er.mensagem}` : er.mensagem;
      });
      focar.current = true;
      setErros(porCampo);
    } catch {
      focar.current = true;
      setErros({ geral: 'Não conseguimos enviar. Verifique a internet e tente de novo.' });
    }
    enviandoRef.current = false;
    setEnviando(false);
  }

  if (enviado) {
    return (
      <section className={`${cartao} border-2 border-sucesso`} aria-labelledby="festa-ok">
        <h2 id="festa-ok" ref={sucessoRef} tabIndex={-1} className={`${titulo} flex items-start gap-2 text-2xl`}>
          <IconeCheck className="mt-1 size-7 shrink-0 text-sucesso" />
          Recebemos seu pedido de orçamento!
        </h2>
        <p className="mt-3 text-lg">A dona Lurdes ou o neto vão falar com você no WhatsApp.</p>
        <p className="mt-4 text-lg">Se preferir, já pode chamar a gente agora:</p>
        <a
          href={linkWhatsapp(whatsappLoja, `Oi! Acabei de pedir um orçamento de festa (${tipoEvento}) pelo site.`)}
          target="_blank"
          rel="noopener noreferrer"
          className={`${botaoWhatsapp} mt-3 w-full`}
        >
          <IconeWhatsapp /> Chamar no WhatsApp
        </a>
      </section>
    );
  }

  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-6">
      <div className={`${cartao} flex flex-col gap-5`}>
        <div>
          <label htmlFor="festa-nome" className={rotuloCampo}>
            Seu nome
          </label>
          <input
            id="festa-nome"
            autoComplete="name"
            className={campoTexto}
            value={nome}
            onChange={(e) => {
              setNome(e.target.value);
              limpar('nome');
            }}
            aria-invalid={erros.nome ? true : undefined}
            aria-describedby={erros.nome ? 'festa-nome-erro' : undefined}
          />
          <MensagemErro id="festa-nome-erro" texto={erros.nome} />
        </div>
        <CampoWhatsapp
          id="festa-whatsapp"
          valor={whatsapp}
          onMudar={(v) => {
            setWhatsapp(v);
            limpar('whatsapp');
          }}
          erro={erros.whatsapp}
        />
      </div>

      <fieldset className={cartao} aria-describedby={erros.tipoEvento ? 'festa-tipo-erro' : undefined}>
        <legend className={`${rotuloCampo} float-left w-full text-xl`}>Que tipo de festa?</legend>
        <div className="clear-both grid grid-cols-2 gap-3 sm:grid-cols-3">
          {TIPOS.map((t, i) => (
            <label
              key={t}
              className="flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl border-2 border-borda bg-papel px-4 py-3 text-lg font-bold has-checked:border-caramelo has-checked:bg-doce-de-leite/30 has-focus-visible:outline-3 has-focus-visible:outline-caramelo"
            >
              <input
                id={`festa-tipo-${i}`}
                type="radio"
                name="tipoEvento"
                value={t}
                checked={tipoEvento === t}
                onChange={() => {
                  setTipoEvento(t);
                  limpar('tipoEvento');
                }}
                className="size-6 shrink-0 accent-caramelo"
              />
              {t}
            </label>
          ))}
        </div>
        <MensagemErro id="festa-tipo-erro" texto={erros.tipoEvento} />
      </fieldset>

      <div className={`${cartao} flex flex-col gap-5`}>
        <div>
          <label htmlFor="festa-data" className={rotuloCampo}>
            Data da festa
          </label>
          <p id="festa-data-ajuda" className="mb-2 text-base text-chocolate-suave">
            Precisamos de pelo menos {antecedenciaDias} dias para preparar tudo.
          </p>
          <input
            id="festa-data"
            type="date"
            min={dataMinima}
            className={campoTexto}
            value={dataEvento}
            onChange={(e) => {
              setDataEvento(e.target.value);
              limpar('dataEvento');
            }}
            aria-invalid={erros.dataEvento ? true : undefined}
            aria-describedby={erros.dataEvento ? 'festa-data-ajuda festa-data-erro' : 'festa-data-ajuda'}
          />
          <MensagemErro id="festa-data-erro" texto={erros.dataEvento} />
        </div>
        <div>
          <label htmlFor="festa-qtd" className={rotuloCampo}>
            Quantos doces, mais ou menos? <span className="font-normal text-chocolate-suave">(se souber)</span>
          </label>
          <input
            id="festa-qtd"
            inputMode="numeric"
            placeholder="Ex.: 300"
            className={campoTexto}
            value={quantidade}
            onChange={(e) => {
              setQuantidade(e.target.value.replace(/\D/g, '').slice(0, 6));
              limpar('quantidadeDoces');
            }}
            aria-invalid={erros.quantidadeDoces ? true : undefined}
            aria-describedby={erros.quantidadeDoces ? 'festa-qtd-erro' : undefined}
          />
          <MensagemErro id="festa-qtd-erro" texto={erros.quantidadeDoces} />
        </div>
        <div>
          <label htmlFor="festa-obs" className={rotuloCampo}>
            Conte mais <span className="font-normal text-chocolate-suave">(se quiser)</span>
          </label>
          <p id="festa-obs-ajuda" className="mb-2 text-base text-chocolate-suave">
            Sabores preferidos, tema da festa, número de convidados...
          </p>
          <textarea
            id="festa-obs"
            rows={4}
            maxLength={1000}
            className={campoTexto}
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            aria-describedby="festa-obs-ajuda"
          />
        </div>
      </div>

      <AceitePrivacidade
        id="festa-aceite"
        marcado={aceite}
        onMudar={(v) => {
          setAceite(v);
          limpar('aceitouPrivacidade');
        }}
        erro={erros.aceitouPrivacidade}
      />

      {erros.geral && (
        <div
          id="festa-erro-geral"
          tabIndex={-1}
          role="alert"
          className="flex items-start gap-2 rounded-2xl border-2 border-erro bg-erro-fundo p-4 text-lg font-bold text-erro"
        >
          <IconeAlerta className="mt-0.5 size-6 shrink-0" />
          {erros.geral}
        </div>
      )}

      <button type="submit" className={`${botaoPrincipal} w-full`} disabled={enviando}>
        {enviando ? 'Enviando...' : 'Pedir orçamento'}
      </button>
      <p className="-mt-3 text-center text-base text-chocolate-suave">Não precisa pagar nada agora.</p>
    </form>
  );
}
