import { ImageResponse } from 'next/og';

// Imagem de quando o link é compartilhado no WhatsApp/Facebook. Gerada pelo Next, sem arquivo pesado.
export const alt = 'Doces da Lurdes: doces artesanais de Pelotas feitos em casa há 18 anos';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function ImagemCompartilhamento() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px',
          background: 'radial-gradient(circle at 85% 20%, #e9b872 0, #fff8ee 55%)',
          color: '#3b2416',
          fontFamily: 'serif',
        }}
      >
        <div style={{ fontSize: 34, color: '#8a4512', fontWeight: 700, letterSpacing: 2 }}>PELOTAS · CAPITAL NACIONAL DO DOCE</div>
        <div style={{ fontSize: 120, fontWeight: 700, marginTop: 16 }}>Doces da Lurdes</div>
        <div style={{ fontSize: 44, marginTop: 20, maxWidth: 900 }}>Doce feito em casa há 18 anos. Caixa de 50, avulsos e festas.</div>
      </div>
    ),
    size,
  );
}
