import { PainelModoVovo } from '@/components/painel/PainelModoVovo';
import { partesEmPelotas } from '@/lib/datas';
import { exigirLogin } from '../_auth';
import {
  listarCatalogo,
  listarOrcamentosFesta,
  listarPedidos,
} from '../_dados';

export const dynamic = 'force-dynamic';

export default async function PaginaPrincipalPainel() {
  await exigirLogin({ redirecionar: true });

  const [pedidosIniciais, catalogoInicial, orcamentosIniciais] = await Promise.all([
    listarPedidos(),
    listarCatalogo(),
    listarOrcamentosFesta(),
  ]);

  const { data: hojeInicial, hora: horaInicial } = partesEmPelotas(new Date());

  return (
    <PainelModoVovo
      pedidosIniciais={pedidosIniciais}
      catalogoInicial={catalogoInicial}
      orcamentosIniciais={orcamentosIniciais}
      hojeInicial={hojeInicial}
      horaInicial={horaInicial}
    />
  );
}
