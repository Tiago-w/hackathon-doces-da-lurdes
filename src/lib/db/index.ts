import 'server-only';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

// Um pool só. Em desenvolvimento o Next recarrega os módulos a cada mudança;
// guardar no globalThis evita abrir conexões novas a cada recarga.
const globalParaDb = globalThis as unknown as { poolDoces?: Pool };

function criarPool(): Pool {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL não definida. Copie .env.example para .env.');
  return new Pool({ connectionString: url, max: 10 });
}

const pool = globalParaDb.poolDoces ?? criarPool();
if (process.env.NODE_ENV !== 'production') globalParaDb.poolDoces = pool;

export const db = drizzle(pool, { schema });
export type Db = typeof db;
/** Tipo da transação do Drizzle, para funções que rodam dentro de db.transaction(). */
export type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];
export { schema };
