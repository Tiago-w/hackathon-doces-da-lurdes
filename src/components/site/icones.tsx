/** Ícones simples em SVG (decorativos: o texto ao lado sempre diz o que é). */
type Props = { className?: string };

const base = {
  'aria-hidden': true,
  focusable: false,
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  viewBox: '0 0 24 24',
} as const;

export function IconeWhatsapp({ className = 'size-6' }: Props) {
  return (
    <svg aria-hidden focusable={false} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.4.1-.2 0-.3 0-.5l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.9 11.9 0 0 0 4.6 4c1.7.7 2.3.8 3.2.7a2.7 2.7 0 0 0 1.8-1.3 2.2 2.2 0 0 0 .2-1.3c-.1-.1-.3-.2-.5-.3Z" />
    </svg>
  );
}

export function IconeMais({ className = 'size-6' }: Props) {
  return (
    <svg {...base} strokeWidth={3} className={className}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function IconeMenos({ className = 'size-6' }: Props) {
  return (
    <svg {...base} strokeWidth={3} className={className}>
      <path d="M5 12h14" />
    </svg>
  );
}

export function IconeCheck({ className = 'size-6' }: Props) {
  return (
    <svg {...base} strokeWidth={3} className={className}>
      <path d="m5 12 5 5L20 7" />
    </svg>
  );
}

export function IconeAlerta({ className = 'size-6' }: Props) {
  return (
    <svg {...base} className={className}>
      <path d="M12 9v4M12 17h.01" />
      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
    </svg>
  );
}

export function IconeSeta({ className = 'size-6' }: Props) {
  return (
    <svg {...base} strokeWidth={2.5} className={className}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export function IconeVoltar({ className = 'size-6' }: Props) {
  return (
    <svg {...base} strokeWidth={2.5} className={className}>
      <path d="M19 12H5M11 6l-6 6 6 6" />
    </svg>
  );
}

export function IconeCaixa({ className = 'size-8' }: Props) {
  return (
    <svg {...base} className={className}>
      <path d="M3 8h18v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8Z" />
      <path d="M2 5h20v3H2zM12 5v16" />
      <path d="M12 5c-1.5-2.5-5-3-5-1s3 1 5 1c2 0 5 1 5-1s-3.5-1.5-5 1Z" />
    </svg>
  );
}

export function IconeDoce({ className = 'size-8' }: Props) {
  return (
    <svg {...base} className={className}>
      <path d="M4 13h16l-2 7H6l-2-7Z" />
      <path d="M6 13c0-3.5 2.7-6 6-6s6 2.5 6 6" />
      <path d="M12 7V4" />
    </svg>
  );
}

export function IconeFesta({ className = 'size-8' }: Props) {
  return (
    <svg {...base} className={className}>
      <path d="M4 21h16M5 21v-6h14v6M7 15v-3h10v3M12 12V9" />
      <path d="M12 9c-1 0-1.5-1-1.5-2S12 4 12 4s1.5 2 1.5 3-.5 2-1.5 2Z" />
    </svg>
  );
}

export function IconePix({ className = 'size-6' }: Props) {
  return (
    <svg {...base} className={className}>
      <path d="m12 2.5 4.2 4.2-4.2 4.2-4.2-4.2L12 2.5ZM12 13.1l4.2 4.2-4.2 4.2-4.2-4.2 4.2-4.2ZM2.5 12l4.2-4.2 4.2 4.2-4.2 4.2L2.5 12ZM13.1 12l4.2-4.2 4.2 4.2-4.2 4.2-4.2-4.2Z" />
    </svg>
  );
}

export function IconeEntrega({ className = 'size-8' }: Props) {
  return (
    <svg {...base} className={className}>
      <path d="M2 6h11v10H2zM13 10h4l4 4v2h-8" />
      <circle cx="6" cy="18" r="2" />
      <circle cx="17" cy="18" r="2" />
    </svg>
  );
}

export function IconeCasa({ className = 'size-8' }: Props) {
  return (
    <svg {...base} className={className}>
      <path d="M3 11 12 3l9 8M5 9.5V21h14V9.5M10 21v-6h4v6" />
    </svg>
  );
}
