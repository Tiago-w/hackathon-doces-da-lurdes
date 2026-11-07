import { IconeAlerta } from './icones';

/** Erro junto do campo: texto + ícone, nunca só cor. */
export function MensagemErro({ id, texto }: { id: string; texto?: string }) {
  if (!texto) return null;
  return (
    <p id={id} className="mt-2 flex items-start gap-2 text-lg font-bold text-erro">
      <IconeAlerta className="mt-0.5 size-5 shrink-0" />
      {texto}
    </p>
  );
}
