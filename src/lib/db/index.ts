import 'server-only';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

function criarDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL não definida. Copie .env.example para .env.');
  return drizzle(new Pool({ connectionString: url, max: 10 }), { schema });
}

export type Db = ReturnType<typeof criarDb>;
/** Tipo da transação do Drizzle, para funções que rodam dentro de db.transaction(). */
export type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];

// Uma conexão só, criada no PRIMEIRO USO (não na importação). Assim, importar um módulo que usa
// o banco (num teste, por exemplo) não exige DATABASE_URL; só quem realmente consulta precisa.
// Em desenvolvimento o Next recarrega os módulos a cada mudança: guardar no globalThis evita
// abrir conexões novas a cada recarga.
const globalParaDb = globalThis as unknown as { dbDoces?: Db };

function obterDb(): Db {
  if (!globalParaDb.dbDoces) globalParaDb.dbDoces = criarDb();
  return globalParaDb.dbDoces;
}

export const db: Db = new Proxy({} as Db, {
  get(_alvo, propriedade) {
    const real = obterDb();
    const valor = Reflect.get(real, propriedade, real);
    return typeof valor === 'function' ? valor.bind(real) : valor;
  },
});

export { schema };
