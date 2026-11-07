'use client';
import { campoTexto, rotuloCampo } from './estilos';
import { MensagemErro } from './MensagemErro';

/** Máscara "(53) 99999-9999" enquanto digita. Guarda só os dígitos. */
export function mascararWhatsapp(texto: string): string {
  const d = texto.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : '';
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

interface Props {
  id: string;
  valor: string;
  onMudar: (digitos: string) => void;
  erro?: string;
}

export function CampoWhatsapp({ id, valor, onMudar, erro }: Props) {
  const idAjuda = `${id}-ajuda`;
  const idErro = `${id}-erro`;
  return (
    <div>
      <label htmlFor={id} className={rotuloCampo}>
        Seu WhatsApp
      </label>
      <p id={idAjuda} className="mb-2 text-base text-chocolate-suave">
        Com DDD. É por ele que a gente confirma o pedido.
      </p>
      <input
        id={id}
        name="whatsapp"
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        placeholder="(53) 99999-9999"
        className={campoTexto}
        value={mascararWhatsapp(valor)}
        onChange={(e) => onMudar(e.target.value.replace(/\D/g, '').slice(0, 11))}
        aria-invalid={erro ? true : undefined}
        aria-describedby={erro ? `${idAjuda} ${idErro}` : idAjuda}
      />
      <MensagemErro id={idErro} texto={erro} />
    </div>
  );
}
