/**
 * Erro "esperado", com mensagem pronta para mostrar à dona Lurdes ou ao cliente
 * (ex.: "Esse pedido já foi entregue e não pode ser cancelado.").
 *
 * As funções do painel (src/server/painel.ts) lançam ErroNegocio. Atenção, Dev 3:
 * em produção o Next ESCONDE a mensagem de qualquer erro lançado por uma server action.
 * Por isso o _dados/index.ts do painel deve capturar e devolver um resultado, por exemplo:
 *
 *   try { await mudarStatus(id, status); return { ok: true }; }
 *   catch (e) { return { ok: false, mensagem: mensagemParaUsuario(e) }; }
 */
export class ErroNegocio extends Error {
  constructor(mensagem: string) {
    super(mensagem);
    this.name = 'ErroNegocio';
  }
}

/** Mensagem segura para mostrar: a do ErroNegocio, ou uma genérica para erros inesperados. */
export function mensagemParaUsuario(erro: unknown): string {
  if (erro instanceof ErroNegocio) return erro.message;
  console.error(erro);
  return 'Não consegui salvar. Confira a internet e tente de novo.';
}

/** UUID v4 (formato dos ids do banco). Evita mandar lixo para o Postgres. */
export function ehUuid(valor: unknown): valor is string {
  return typeof valor === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(valor);
}
