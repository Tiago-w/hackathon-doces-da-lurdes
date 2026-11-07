'use server';

import { redirect } from 'next/navigation';
import { autenticarComSenha, encerrarSessao } from './_auth';

export async function acaoEntrar(
  senha: string,
): Promise<{ ok: true } | { ok: false; mensagem: string }> {
  return autenticarComSenha(senha);
}

export async function acaoSair(): Promise<void> {
  await encerrarSessao();
  redirect('/painel/entrar');
}
