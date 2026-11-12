import { useEffect, type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { toast } from 'sonner';
import { dataStore } from '@/data/repositories';
import { can } from '@/domain/access';
import { useSession } from '@/features/auth/sessionStore';
import { logger } from '@/shared/logger';
import { ROUTES } from './routes';

export const FORBIDDEN_MESSAGE = 'คุณไม่มีสิทธิ์เข้าหน้านี้';

function ForbiddenRedirect({ route }: { route: string }) {
  useEffect(() => {
    logger.warn('route.denied', { route });
    // fixed id: StrictMode runs effects twice in dev — one toast only
    toast.error(FORBIDDEN_MESSAGE, { id: 'route-forbidden' });
  }, [route]);
  return <Navigate to={ROUTES.mySpace.path} replace />;
}

interface Props {
  /** null = any signed-in user */
  permission: string | null;
  children: ReactNode;
}

/** C1 guard (US-002, US-003): no session → /login · missing permission → My Space + toast (default-deny). */
export function RequirePermission({ permission, children }: Props) {
  const { user } = useSession();
  const location = useLocation();

  if (!user) return <Navigate to={ROUTES.login.path} replace />;
  if (permission && !can(user, permission, dataStore.getDataset().rolePermissions)) {
    // Never redirect to the page that was just denied (would loop)
    if (location.pathname === ROUTES.mySpace.path) return <p role="alert">{FORBIDDEN_MESSAGE}</p>;
    return <ForbiddenRedirect route={location.pathname} />;
  }
  return <>{children}</>;
}
