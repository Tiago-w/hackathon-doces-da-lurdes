'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { acaoEntrar } from '@/app/painel/_acoes-auth';

export function FormularioLogin() {
  const router = useRouter();
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, iniciarTransicao] = useTransition();

  function aoSubmeter(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro(null);

    iniciarTransicao(async () => {
      try {
        const res = await acaoEntrar(senha);
        if (!res.ok) {
          setErro(res.mensagem);
          return;
        }
        router.replace('/painel');
        router.refresh();
      } catch {
        setErro('Não consegui entrar agora. Tente de novo.');
      }
    });
  }

  return (
    <form onSubmit={aoSubmeter} className="w-full space-y-6" noValidate>
      <div>
        <label
          htmlFor="campo-senha-painel"
          className="block text-[22px] font-bold text-chocolate mb-2.5"
        >
          Senha de acesso da cozinha
        </label>
        <div className="relative flex flex-col sm:flex-row gap-3">
          <input
            id="campo-senha-painel"
            name="senha"
            type={mostrarSenha ? 'text' : 'password'}
            value={senha}
            onChange={(e) => {
              setSenha(e.target.value);
              if (erro) setErro(null);
            }}
            placeholder="Digite a senha da cozinha"
            autoComplete="current-password"
            autoFocus
            disabled={pendente}
            className="w-full min-h-16 px-5 py-4 text-[24px] font-semibold bg-papel text-chocolate border-2 border-borda rounded-2xl focus:border-caramelo focus:outline-none placeholder:text-chocolate-suave/55"
          />
          <button
            type="button"
            onClick={() => setMostrarSenha((v) => !v)}
            className="min-h-16 px-5 py-3 text-[19px] font-bold bg-creme text-chocolate border-2 border-borda rounded-2xl shrink-0 hover:border-caramelo active:bg-doce-de-leite/40 cursor-pointer"
          >
            {mostrarSenha ? 'Ocultar' : 'Mostrar'}
          </button>
        </div>
      </div>

      {erro && (
        <div
          role="alert"
          className="p-4 rounded-2xl bg-erro-fundo border-2 border-erro text-erro text-[20px] font-bold flex items-center gap-3"
        >
          <span>{erro}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={pendente}
        className="w-full min-h-[68px] px-8 py-4 rounded-2xl bg-caramelo hover:bg-caramelo-escuro active:bg-caramelo-escuro text-papel text-[24px] font-bold shadow-md disabled:opacity-60 flex items-center justify-center gap-3 cursor-pointer transition-colors"
      >
        {pendente ? 'Verificando acesso...' : 'Entrar no Painel da Cozinha'}
      </button>
    </form>
  );
}
