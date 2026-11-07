import Image from 'next/image';

/**
 * Foto do sabor. Enquanto não houver foto real (fotoUrl null), mostra um desenho de doce
 * em tons quentes. Para trocar pela foto de verdade, basta preencher fotoUrl no banco
 * (ex.: "/site/sabores/quindim.jpg", com o arquivo em public/site/sabores/).
 */
const FUNDOS = [
  ['#f6dfb5', '#e9b872'],
  ['#f3d2c1', '#d99a7a'],
  ['#efe0c2', '#c99a5b'],
  ['#f7e7c9', '#e2a85f'],
  ['#ead7c7', '#b98563'],
];
const COBERTURAS = ['#f2b705', '#6b3a1e', '#fff1d6', '#d98b3a', '#8a4512'];

function indice(texto: string, n: number): number {
  let h = 0;
  for (const c of texto) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h % n;
}

interface Props {
  nome: string;
  fotoUrl: string | null;
  /** Tamanho que a imagem ocupa na tela, para o navegador baixar só o necessário. */
  sizes: string;
  className?: string;
  prioridade?: boolean;
}

export function FotoSabor({ nome, fotoUrl, sizes, className = '', prioridade = false }: Props) {
  if (fotoUrl) {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        <Image src={fotoUrl} alt={`Foto do doce ${nome}`} fill sizes={sizes} priority={prioridade} className="object-cover" />
      </div>
    );
  }
  const [claro, escuro] = FUNDOS[indice(nome, FUNDOS.length)];
  const cobertura = COBERTURAS[indice(`${nome}x`, COBERTURAS.length)];
  return (
    <div
      aria-hidden
      className={`relative overflow-hidden ${className}`}
      style={{ background: `radial-gradient(circle at 30% 25%, ${claro}, ${escuro})` }}
    >
      <svg viewBox="0 0 100 100" className="absolute inset-0 m-auto h-3/4 w-3/4" focusable={false}>
        <ellipse cx="50" cy="78" rx="34" ry="7" fill="rgba(59,36,22,0.18)" />
        <path d="M18 56h64l-7 22H25z" fill="#fff8ee" stroke="#c9a77c" strokeWidth="1.5" />
        <path d="M25 56l4 22M36 56l2 22M50 56v22M64 56l-2 22M75 56l-4 22" stroke="#e1c9a6" strokeWidth="1.5" />
        <ellipse cx="50" cy="54" rx="30" ry="18" fill={cobertura} />
        <ellipse cx="42" cy="47" rx="9" ry="4" fill="rgba(255,255,255,0.45)" />
      </svg>
    </div>
  );
}
