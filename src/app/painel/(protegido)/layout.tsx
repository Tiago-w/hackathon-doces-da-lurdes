import { exigirLogin } from '../_auth';

export const dynamic = 'force-dynamic';

export default async function LayoutProtegidoPainel({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await exigirLogin({ redirecionar: true });
  return <>{children}</>;
}
