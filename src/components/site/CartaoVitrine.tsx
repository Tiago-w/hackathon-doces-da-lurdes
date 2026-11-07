import type { Produto } from '@/lib/contrato';
import { formatarReais } from '@/lib/dinheiro';
import { FotoSabor } from './FotoSabor';
import { IconeAlerta } from './icones';
import { AVISO_ESGOTADO } from './textos';

export function CartaoVitrine({ produto, prioridade = false }: { produto: Produto; prioridade?: boolean }) {
  const esgotado = !produto.disponivel;
  return (
    <article className={`flex h-full flex-col overflow-hidden rounded-3xl border border-borda ${esgotado ? 'bg-creme' : 'bg-papel'}`}>
      <div className="relative">
        <FotoSabor
          nome={produto.nome}
          fotoUrl={produto.fotoUrl}
          sizes="(min-width: 1024px) 300px, (min-width: 640px) 45vw, 92vw"
          prioridade={prioridade}
          className={`aspect-[4/3] w-full ${esgotado ? 'opacity-50 grayscale' : ''}`}
        />
        {esgotado && (
          <span className="absolute left-3 top-3 rounded-full bg-erro px-3 py-1 text-base font-bold text-white">Acabou por hoje</span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className={`text-xl font-bold ${esgotado ? 'text-chocolate-suave' : 'text-chocolate'}`}>{produto.nome}</h3>
        {produto.descricao && <p className="mt-1 flex-1 text-base text-chocolate-suave">{produto.descricao}</p>}
        <p className="mt-3 text-xl font-bold text-chocolate">
          {formatarReais(produto.precoCentavos)} <span className="text-base font-normal text-chocolate-suave">cada</span>
        </p>
        {esgotado && (
          <p className="mt-2 flex items-start gap-1 text-base font-bold text-erro">
            <IconeAlerta className="mt-0.5 size-4 shrink-0" />
            {AVISO_ESGOTADO}
          </p>
        )}
      </div>
    </article>
  );
}
