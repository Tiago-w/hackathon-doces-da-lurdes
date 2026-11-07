'use client';
import { useRef, useState } from 'react';
import { botaoPrincipal } from './estilos';
import { IconeCheck } from './icones';

export function BotaoCopiarPix({ codigo }: { codigo: string }) {
  const [copiado, setCopiado] = useState(false);
  const [falhou, setFalhou] = useState(false);
  const campoRef = useRef<HTMLTextAreaElement>(null);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(codigo);
      setCopiado(true);
      setFalhou(false);
    } catch {
      // Celular antigo ou sem permissão: seleciona o texto para a pessoa copiar na mão.
      const campo = campoRef.current;
      if (campo) {
        campo.focus();
        campo.select();
        try {
          setCopiado(document.execCommand('copy'));
        } catch {
          setCopiado(false);
        }
      }
      setFalhou(true);
    }
    setTimeout(() => setCopiado(false), 4000);
  }

  return (
    <div>
      <label htmlFor="pix-copia-cola" className="mb-2 block text-lg font-bold">
        Pix Copia e Cola
      </label>
      <textarea
        id="pix-copia-cola"
        ref={campoRef}
        readOnly
        rows={3}
        value={codigo}
        onFocus={(e) => e.currentTarget.select()}
        className="block w-full resize-none break-all rounded-xl border-2 border-borda bg-creme p-3 font-mono text-sm text-chocolate"
      />
      <button type="button" onClick={copiar} className={`${botaoPrincipal} mt-3 w-full ${copiado ? 'bg-sucesso hover:bg-sucesso' : ''}`}>
        {copiado ? (
          <>
            <IconeCheck /> Copiado!
          </>
        ) : (
          'Copiar código Pix'
        )}
      </button>
      <p aria-live="polite" className="mt-2 min-h-7 text-center text-base font-bold text-sucesso">
        {copiado ? 'Código copiado. Agora cole no app do seu banco.' : ''}
      </p>
      {falhou && !copiado && (
        <p className="text-center text-base text-chocolate-suave">Não deu para copiar sozinho. O código ficou selecionado: segure em cima dele e toque em Copiar.</p>
      )}
    </div>
  );
}
