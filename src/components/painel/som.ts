'use client';

/**
 * Gerenciador de áudio do Modo Vovó usando exclusivamente Web Audio API (sem arquivos externos).
 * O navegador exige um toque na tela ("Começar") antes de liberar o AudioContext.
 */

let contextoAudio: AudioContext | null = null;

function obterContextoAudio(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!contextoAudio) {
    const ConstrutorAudio =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (ConstrutorAudio) {
      contextoAudio = new ConstrutorAudio();
    }
  }
  return contextoAudio;
}

/**
 * Destrava o AudioContext no toque do botão "Começar" e toca um som suave de confirmação.
 */
export function desbloquearAudio(): void {
  try {
    const ctx = obterContextoAudio();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      void ctx.resume();
    }
    tocarNota(ctx, 523.25, ctx.currentTime, 0.12, 0.12); // Dó5 suave
    tocarNota(ctx, 659.25, ctx.currentTime + 0.13, 0.18, 0.14); // Mi5 suave
  } catch {
    // Ignora caso o dispositivo não tenha saída de áudio
  }
}

function tocarNota(
  ctx: AudioContext,
  frequenciaHz: number,
  inicioSeg: number,
  duracaoSeg: number,
  volumeMax: number,
): void {
  const oscilador = ctx.createOscillator();
  const ganho = ctx.createGain();

  oscilador.type = 'triangle';
  oscilador.frequency.setValueAtTime(frequenciaHz, inicioSeg);

  ganho.gain.setValueAtTime(0.001, inicioSeg);
  ganho.gain.exponentialRampToValueAtTime(volumeMax, inicioSeg + 0.02);
  ganho.gain.exponentialRampToValueAtTime(0.001, inicioSeg + duracaoSeg);

  oscilador.connect(ganho);
  ganho.connect(ctx.destination);

  oscilador.start(inicioSeg);
  oscilador.stop(inicioSeg + duracaoSeg + 0.02);
}

/**
 * Toca o "plim-plim" agradável de 2 notas para avisar a dona Lurdes de pedido novo.
 */
export function tocarPlimPlim(): void {
  try {
    const ctx = obterContextoAudio();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      void ctx.resume();
    }
    const agora = ctx.currentTime;
    // "Plim" (Sol5 - 783.99 Hz) -> "Plim!" (Dó6 - 1046.50 Hz)
    tocarNota(ctx, 783.99, agora, 0.18, 0.28);
    tocarNota(ctx, 1046.5, agora + 0.2, 0.35, 0.32);
  } catch {
    // Falha silenciosa se o navegador bloquear áudio
  }
}
