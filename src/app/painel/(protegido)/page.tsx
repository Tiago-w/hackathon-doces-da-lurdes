import { PainelModoVovo } from '@/components/painel/PainelModoVovo';
import { partesEmPelotas } from '@/lib/datas';
import { exigirLogin } from '../_auth';
import {
  listarCalendario,
  listarCatalogo,
  listarOrcamentosFesta,
  listarPedidos,
} from '../_dados';

export const dynamic = 'force-dynamic';

export default async function PaginaPrincipalPainel() {
  await exigirLogin({ redirecionar: true });

  const [pedidosIniciais, catalogoInicial, orcamentosIniciais, calendarioInicial] = await Promise.all([
    listarPedidos(),
    listarCatalogo(),
    listarOrcamentosFesta(),
    listarCalendario(),
  ]);

  const { data: hojeInicial, hora: horaInicial } = partesEmPelotas(new Date());

  return (
    <PainelModoVovo
      pedidosIniciais={pedidosIniciais}
      catalogoInicial={catalogoInicial}
      orcamentosIniciais={orcamentosIniciais}
      calendarioInicial={calendarioInicial}
      hojeInicial={hojeInicial}
      horaInicial={horaInicial}
    />
  );
}
