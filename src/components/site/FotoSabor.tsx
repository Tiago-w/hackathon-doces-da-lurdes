import Image from 'next/image';

interface Props {
  nome: string;
  fotoUrl: string | null;
  sizes: string;
  className?: string;
  prioridade?: boolean;
}

type TipoIlustracao =
  | 'quindim'
  | 'ninho'
  | 'santa-clara'
  | 'trouxinha'
  | 'camafeu'
  | 'olho-de-sogra'
  | 'bem-casado'
  | 'brigadeiro'
  | 'queijadinha'
  | 'ninho-de-amor';

function identificarDoce(nome: string): TipoIlustracao {
  const n = nome.toLowerCase();
  if (n.includes('quindim')) return 'quindim';
  if (n.includes('santa clara') || n.includes('pastel')) return 'santa-clara';
  if (n.includes('trouxinha')) return 'trouxinha';
  if (n.includes('camafeu')) return 'camafeu';
  if (n.includes('olho de sogra')) return 'olho-de-sogra';
  if (n.includes('bem-casado') || n.includes('bem casado')) return 'bem-casado';
  if (n.includes('queijadinha')) return 'queijadinha';
  if (n.includes('ninho de amor')) return 'ninho-de-amor';
  if (n.includes('ninho')) return 'ninho';
  return 'brigadeiro';
}

const PALETAS_FUNDO: Record<TipoIlustracao, { fundo: string; halo: string; selo: string }> = {
  quindim: { fundo: '#FDF3DC', halo: '#F7D88B', selo: 'Gema & Coco' },
  ninho: { fundo: '#FBF7EF', halo: '#EFE3CC', selo: 'Leite Ninho' },
  'santa-clara': { fundo: '#FBF1DF', halo: '#EED2A4', selo: 'Doce de Ovos' },
  trouxinha: { fundo: '#FDF4E1', halo: '#F3D493', selo: 'Fios de Ovos' },
  camafeu: { fundo: '#F6EDE2', halo: '#DFC7AE', selo: 'Nozes & Fondant' },
  'olho-de-sogra': { fundo: '#F5EAE8', halo: '#DEC4BE', selo: 'Ameixa & Coco' },
  'bem-casado': { fundo: '#FAF1E4', halo: '#E8D0B1', selo: 'Doce de Leite' },
  brigadeiro: { fundo: '#F2E7DF', halo: '#D7BEAE', selo: 'Cacau Clássico' },
  queijadinha: { fundo: '#FCF2DE', halo: '#EED29E', selo: 'Coco & Queijo' },
  'ninho-de-amor': { fundo: '#FAF0DF', halo: '#E7CCA2', selo: 'Coco & Cravo' },
};

function ArteDoce({ tipo }: { tipo: TipoIlustracao }) {
  switch (tipo) {
    case 'quindim':
      return (
        <svg viewBox="0 0 160 120" className="h-full w-full" aria-hidden="true">
          <defs>
            <linearGradient id="q-cupula" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FFB800" />
              <stop offset="65%" stopColor="#E58E00" />
              <stop offset="100%" stopColor="#B86200" />
            </linearGradient>
          </defs>
          <ellipse cx="80" cy="96" rx="48" ry="9" fill="rgba(44,24,16,0.14)" />
          {/* Forminha rendada */}
          <path d="M36 84 L124 84 L116 95 L44 95 Z" fill="#FFFDF9" stroke="#DCC6A6" strokeWidth="1.5" />
          {/* Base de coco dourado */}
          <path d="M43 76 Q80 82 117 76 L114 85 L46 85 Z" fill="#C9781A" />
          {/* Cúpula brilhante do quindim */}
          <path d="M43 76 C45 38, 115 38, 117 76 Z" fill="url(#q-cupula)" />
          {/* Reflexo vítreo */}
          <path d="M56 54 C64 43, 84 42, 92 48 C82 47, 65 49, 58 60 Z" fill="rgba(255,255,255,0.65)" />
          <ellipse cx="80" cy="44" rx="10" ry="3" fill="rgba(255,255,255,0.35)" />
        </svg>
      );

    case 'camafeu':
      return (
        <svg viewBox="0 0 160 120" className="h-full w-full" aria-hidden="true">
          <ellipse cx="80" cy="95" rx="50" ry="9" fill="rgba(44,24,16,0.14)" />
          {/* Forminha */}
          <path d="M34 80 L126 80 L116 94 L44 94 Z" fill="#F7EFE4" stroke="#CBB292" strokeWidth="1.5" />
          {/* Corpo de fondant branco-marfim */}
          <rect x="40" y="52" width="80" height="32" rx="16" fill="#FFFDF8" stroke="#E6D8C5" strokeWidth="1.5" />
          <path d="M48 62 Q80 56 112 62" stroke="#FFFFFF" strokeWidth="3" fill="none" strokeLinecap="round" />
          {/* Meia noz esculpida no topo */}
          <ellipse cx="80" cy="51" rx="22" ry="10" fill="#7C4722" />
          <ellipse cx="80" cy="50" rx="19" ry="7.5" fill="#9C5D30" />
          <path d="M64 50 Q80 46 96 50 M68 47 Q80 53 92 47" stroke="#5A3012" strokeWidth="1.6" fill="none" />
        </svg>
      );

    case 'santa-clara':
      return (
        <svg viewBox="0 0 160 120" className="h-full w-full" aria-hidden="true">
          <ellipse cx="80" cy="95" rx="52" ry="9" fill="rgba(44,24,16,0.14)" />
          {/* Massa fininha folhada em meia-lua */}
          <path
            d="M34 82 C36 42, 124 42, 126 82 Q80 92 34 82 Z"
            fill="#F3C978"
            stroke="#C9923B"
            strokeWidth="2"
          />
          {/* Recheio dourado de doce de ovos */}
          <path d="M46 78 C54 54, 106 54, 114 78 Q80 86 46 78 Z" fill="#E8991D" />
          {/* Polvilhado de açúcar de confeiteiro */}
          <g fill="#FFFDF9" opacity="0.88">
            <circle cx="66" cy="56" r="2.2" />
            <circle cx="78" cy="52" r="2.8" />
            <circle cx="91" cy="57" r="2" />
            <circle cx="72" cy="64" r="2.4" />
            <circle cx="85" cy="63" r="2.1" />
            <circle cx="60" cy="66" r="1.8" />
            <circle cx="98" cy="66" r="1.9" />
          </g>
        </svg>
      );

    case 'trouxinha':
      return (
        <svg viewBox="0 0 160 120" className="h-full w-full" aria-hidden="true">
          <ellipse cx="80" cy="96" rx="44" ry="8" fill="rgba(44,24,16,0.14)" />
          {/* Base da trouxinha de fios de ovos */}
          <path
            d="M48 78 C42 58, 58 46, 80 46 C102 46, 118 58, 112 78 C108 90, 52 90, 48 78 Z"
            fill="#F4A81D"
            stroke="#C97B0C"
            strokeWidth="1.8"
          />
          {/* Topete da trouxinha amarrada */}
          <path d="M68 47 L60 30 L76 36 L80 26 L86 36 L100 30 L92 47 Z" fill="#F8BC3B" stroke="#C97B0C" strokeWidth="1.5" />
          {/* Laço/amarração de calda */}
          <rect x="66" y="44" width="28" height="5" rx="2.5" fill="#9E5208" />
          {/* Textura de fios */}
          <path d="M58 64 Q80 56 102 64 M56 72 Q80 65 104 72 M62 80 Q80 74 98 80" stroke="#FFD670" strokeWidth="2" fill="none" strokeLinecap="round" />
        </svg>
      );

    case 'olho-de-sogra':
      return (
        <svg viewBox="0 0 160 120" className="h-full w-full" aria-hidden="true">
          <ellipse cx="80" cy="95" rx="48" ry="8" fill="rgba(44,24,16,0.14)" />
          {/* Ameixa escura */}
          <ellipse cx="80" cy="70" rx="42" ry="22" fill="#2D1822" />
          <ellipse cx="80" cy="68" rx="38" ry="18" fill="#3F2230" />
          {/* Recheio central de coco e gemas */}
          <ellipse cx="80" cy="64" rx="26" ry="11" fill="#F7E4B5" stroke="#DFC07C" strokeWidth="1.5" />
          <ellipse cx="74" cy="61" rx="12" ry="4" fill="#FFFDF7" opacity="0.7" />
        </svg>
      );

    case 'bem-casado':
      return (
        <svg viewBox="0 0 160 120" className="h-full w-full" aria-hidden="true">
          <ellipse cx="80" cy="96" rx="48" ry="8" fill="rgba(44,24,16,0.14)" />
          {/* Camada inferior de pão de ló */}
          <rect x="42" y="70" width="76" height="18" rx="9" fill="#E5B56B" stroke="#C48F45" strokeWidth="1.5" />
          {/* Recheio de doce de leite */}
          <rect x="44" y="63" width="72" height="9" rx="4.5" fill="#7D4116" />
          {/* Camada superior de pão de ló polvilhada */}
          <rect x="42" y="46" width="76" height="19" rx="9.5" fill="#F0C884" stroke="#C48F45" strokeWidth="1.5" />
          {/* Fita de cetim e laço */}
          <rect x="76" y="45" width="8" height="44" fill="#9E4710" />
          <path d="M80 46 C64 34, 58 48, 76 48 C62 52, 68 58, 80 48 Z" fill="#B55619" />
          <path d="M80 46 C96 34, 102 48, 84 48 C98 52, 92 58, 80 48 Z" fill="#B55619" />
          <circle cx="80" cy="47" r="3.5" fill="#7D3308" />
        </svg>
      );

    case 'ninho':
      return (
        <svg viewBox="0 0 160 120" className="h-full w-full" aria-hidden="true">
          <ellipse cx="80" cy="96" rx="44" ry="8" fill="rgba(44,24,16,0.14)" />
          <path d="M42 74 L118 74 L110 93 L50 93 Z" fill="#EBD7B9" stroke="#C8AD86" strokeWidth="1.5" />
          <circle cx="80" cy="64" r="28" fill="#F8EED8" stroke="#E2CFA8" strokeWidth="1.5" />
          <circle cx="72" cy="54" r="9" fill="#FFFFFF" opacity="0.65" />
          {/* Roseta no topo */}
          <circle cx="80" cy="38" r="6" fill="#E7C88B" />
        </svg>
      );

    case 'queijadinha':
      return (
        <svg viewBox="0 0 160 120" className="h-full w-full" aria-hidden="true">
          <ellipse cx="80" cy="96" rx="46" ry="8" fill="rgba(44,24,16,0.14)" />
          {/* Forminha alta */}
          <path d="M40 66 L120 66 L110 93 L50 93 Z" fill="#FFFDF8" stroke="#D5BC96" strokeWidth="1.5" />
          {/* Topo gratinado dourado */}
          <ellipse cx="80" cy="64" rx="40" ry="15" fill="#E59A28" stroke="#B36B0B" strokeWidth="1.5" />
          <ellipse cx="76" cy="61" rx="22" ry="7" fill="#AE5908" opacity="0.65" />
          <ellipse cx="90" cy="66" rx="10" ry="4" fill="#FFF2CE" opacity="0.6" />
        </svg>
      );

    case 'ninho-de-amor':
      return (
        <svg viewBox="0 0 160 120" className="h-full w-full" aria-hidden="true">
          <ellipse cx="80" cy="96" rx="44" ry="8" fill="rgba(44,24,16,0.14)" />
          <path d="M42 76 L118 76 L110 93 L50 93 Z" fill="#FFFDF9" stroke="#D6BE99" strokeWidth="1.5" />
          <ellipse cx="80" cy="68" rx="34" ry="18" fill="#F3D192" stroke="#CA9642" strokeWidth="1.5" />
          <path d="M56 66 Q80 54 104 66 M60 73 Q80 62 100 73" stroke="#FFF8E8" strokeWidth="2.2" fill="none" strokeLinecap="round" />
          {/* Cravo-da-índia no centro */}
          <circle cx="80" cy="56" r="4" fill="#4A2511" />
          <path d="M80 56 L80 63" stroke="#4A2511" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );

    case 'brigadeiro':
    default:
      return (
        <svg viewBox="0 0 160 120" className="h-full w-full" aria-hidden="true">
          <ellipse cx="80" cy="96" rx="44" ry="8" fill="rgba(44,24,16,0.14)" />
          <path d="M42 74 L118 74 L110 93 L50 93 Z" fill="#F5E8D5" stroke="#C8AD88" strokeWidth="1.5" />
          <circle cx="80" cy="64" r="28" fill="#3B1E10" />
          {/* Flocos de granulado belga */}
          <g stroke="#6B3C24" strokeWidth="2.6" strokeLinecap="round">
            <line x1="65" y1="50" x2="71" y2="48" />
            <line x1="82" y1="45" x2="89" y2="47" />
            <line x1="92" y1="56" x2="97" y2="61" />
            <line x1="60" y1="62" x2="66" y2="66" />
            <line x1="74" y1="58" x2="81" y2="56" />
            <line x1="84" y1="67" x2="91" y2="65" />
            <line x1="69" y1="70" x2="76" y2="72" />
          </g>
          <ellipse cx="70" cy="49" rx="8" ry="3.5" fill="rgba(255,255,255,0.18)" />
        </svg>
      );
  }
}

export function obterSeloDoce(nome: string): string {
  return PALETAS_FUNDO[identificarDoce(nome)].selo;
}

export function FotoSabor({ nome, fotoUrl, sizes, className = '', prioridade = false }: Props) {
  if (fotoUrl) {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        <Image
          src={fotoUrl}
          alt={`Foto do doce ${nome}`}
          fill
          sizes={sizes}
          priority={prioridade}
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
    );
  }

  const tipo = identificarDoce(nome);
  const paleta = PALETAS_FUNDO[tipo];

  return (
    <div
      aria-hidden="true"
      className={`relative overflow-hidden select-none ${className}`}
      style={{
        background: `radial-gradient(circle at 50% 38%, ${paleta.fundo} 0%, ${paleta.halo} 100%)`,
      }}
    >
      <div className="absolute inset-0 opacity-35 bg-[radial-gradient(#8f4310_0.75px,transparent_0.75px)] [background-size:14px_14px]" />
      <div className="relative flex h-full w-full items-center justify-center p-2">
        <ArteDoce tipo={tipo} />
      </div>
    </div>
  );
}
