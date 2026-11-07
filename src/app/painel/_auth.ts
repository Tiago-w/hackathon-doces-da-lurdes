import { createHmac, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export const NOME_COOKIE_PAINEL = 'doces_lurdes_painel';
const TRINTA_DIAS_SEGUNDOS = 60 * 60 * 24 * 30;
const TRINTA_DIAS_MS = TRINTA_DIAS_SEGUNDOS * 1000;

function obterSenhaConfigurada(): string {
  return process.env.PAINEL_SENHA || 'lurdes123';
}

function obterSegredoHmac(): string {
  return process.env.PAINEL_SEGREDO || 'segredo-hmac-padrao-doces-da-lurdes-dev';
}

function assinarPayload(payload: string): string {
  return createHmac('sha256', obterSegredoHmac()).update(payload).digest('hex');
}

function compararSeguro(a: string, b: string): boolean {
  const hashA = createHmac('sha256', obterSegredoHmac()).update(a).digest();
  const hashB = createHmac('sha256', obterSegredoHmac()).update(b).digest();
  return timingSafeEqual(hashA, hashB);
}

/**
 * Cria o valor do cookie assinado com HMAC contendo apenas o escopo e a data de expiração.
 * Nunca guarda a senha no cookie.
 */
export function criarTokenSessao(agoraMs: number = Date.now()): string {
  const expiraEm = agoraMs + TRINTA_DIAS_MS;
  const payload = `vovo.${expiraEm}`;
  const assinatura = assinarPayload(payload);
  return `${payload}.${assinatura}`;
}

/**
 * Valida a assinatura HMAC e a data de validade do token de sessão.
 */
export function validarTokenSessao(token: string | undefined, agoraMs: number = Date.now()): boolean {
  if (!token) return false;
  const partes = token.split('.');
  if (partes.length !== 3) return false;

  const [prefixo, expiraStr, assinaturaRecebida] = partes;
  if (prefixo !== 'vovo') return false;

  const expiraEm = Number(expiraStr);
  if (!Number.isFinite(expiraEm) || agoraMs >= expiraEm) return false;

  const payload = `${prefixo}.${expiraStr}`;
  const assinaturaEsperada = assinarPayload(payload);

  if (assinaturaRecebida.length !== assinaturaEsperada.length) return false;
  try {
    return timingSafeEqual(
      Buffer.from(assinaturaRecebida, 'hex'),
      Buffer.from(assinaturaEsperada, 'hex'),
    );
  } catch {
    return false;
  }
}

/**
 * Verifica se há uma sessão válida da dona Lurdes nos cookies da requisição.
 */
export async function verificarLogin(): Promise<boolean> {
  const jar = await cookies();
  const valor = jar.get(NOME_COOKIE_PAINEL)?.value;
  return validarTokenSessao(valor);
}

/**
 * Garante que a requisição está autenticada no Modo Vovó.
 * - Quando `{ redirecionar: true }` (usado no layout de `/painel`), redireciona para `/painel/entrar`.
 * - Por padrão (usado em todas as funções de `_dados`), lança erro se não estiver logado.
 */
export async function exigirLogin(opcoes?: { redirecionar?: boolean }): Promise<void> {
  const logado = await verificarLogin();
  if (!logado) {
    if (opcoes?.redirecionar) {
      redirect('/painel/entrar');
    }
    throw new Error('Acesso não autorizado. Digite a senha novamente para entrar no painel.');
  }
}

/**
 * Valida a senha digitada e grava o cookie de sessão por 30 dias.
 */
export async function autenticarComSenha(
  senhaDigitada: string,
): Promise<{ ok: true } | { ok: false; mensagem: string }> {
  const senhaLimpa = senhaDigitada.trim();
  if (!senhaLimpa) {
    return { ok: false, mensagem: 'Digite a senha para entrar.' };
  }

  const senhaCorreta = obterSenhaConfigurada();
  if (!compararSeguro(senhaLimpa, senhaCorreta)) {
    return { ok: false, mensagem: 'Essa senha não está certa. Tente de novo.' };
  }

  const token = criarTokenSessao();
  const jar = await cookies();
  jar.set(NOME_COOKIE_PAINEL, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: TRINTA_DIAS_SEGUNDOS,
  });

  return { ok: true };
}

/**
 * Remove o cookie de sessão do Modo Vovó.
 */
export async function encerrarSessao(): Promise<void> {
  const jar = await cookies();
  jar.delete(NOME_COOKIE_PAINEL);
}
