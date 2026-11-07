/**
 * APAGA TODO O BANCO LOCAL e recria vazio. Use `npm run db:reset` (que já roda migrate + seed depois).
 * Só para desenvolvimento: recusa rodar com NODE_ENV=production ou fora de localhost.
 */
import 'dotenv/config';
import { Client } from 'pg';

async function main() {
  const url = process.env.DATABASE_URL ?? '';
  const host = (() => {
    try {
      return new URL(url).hostname;
    } catch {
      return '';
    }
  })();
  if (process.env.NODE_ENV === 'production' || !['localhost', '127.0.0.1', 'db'].includes(host)) {
    throw new Error(`Recusei apagar o banco em "${host || 'URL inválida'}". O reset só roda em banco local.`);
  }

  const client = new Client({ connectionString: url });
  await client.connect();
  try {
    await client.query('drop schema if exists public cascade; drop schema if exists drizzle cascade; create schema public;');
    console.log('Banco local zerado.');
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exitCode = 1;
});
