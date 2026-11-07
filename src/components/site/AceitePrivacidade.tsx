'use client';
import Link from 'next/link';
import { MensagemErro } from './MensagemErro';

interface Props {
  id: string;
  marcado: boolean;
  onMudar: (marcado: boolean) => void;
  erro?: string;
}

export function AceitePrivacidade({ id, marcado, onMudar, erro }: Props) {
  return (
    <div>
      <div className={`flex items-start gap-3 rounded-2xl border-2 p-4 ${erro ? 'border-erro bg-erro-fundo' : 'border-borda bg-papel'}`}>
        <input
          id={id}
          type="checkbox"
          checked={marcado}
          onChange={(e) => onMudar(e.target.checked)}
          className="mt-0.5 size-7 shrink-0 accent-caramelo"
          aria-invalid={erro ? true : undefined}
          aria-describedby={erro ? `${id}-erro` : undefined}
        />
        <label htmlFor={id} className="text-lg">
          Li e concordo com o{' '}
          <Link href="/privacidade" target="_blank" className="font-bold text-caramelo underline underline-offset-4">
            aviso de privacidade
            <span className="sr-only"> (abre em outra aba)</span>
          </Link>
          : meus dados serão usados só para este pedido e para falar comigo no WhatsApp.
        </label>
      </div>
      <MensagemErro id={`${id}-erro`} texto={erro} />
    </div>
  );
}
