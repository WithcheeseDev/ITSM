import { useEffect, type ReactNode } from 'react';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router';
import { toast } from 'sonner';
import { dataStore } from '@/data/repositories';
import { ApprovalsPage } from '@/features/approvals/ApprovalsPage';
import { LoginPage } from '@/features/auth/LoginPage';
import { CallDetailPage } from '@/features/call-detail/CallDetailPage';
import { CallFormPage } from '@/features/call-form/CallFormPage';
import { CatalogPage } from '@/features/catalog/CatalogPage';
import { MySpacePage } from '@/features/my-space/MySpacePage';
import { SearchPage } from '@/features/search/SearchPage';
import { ErrorBoundary } from '@/shared/ErrorBoundary';
import { Toaster } from '@/shared/ui/sonner';
import { TooltipProvider } from '@/shared/ui/tooltip';
import { AppLayout } from './layout/AppLayout';
import { PlaceholderPage } from './PlaceholderPage';
import { RequirePermission } from './RequirePermission';
import { ROUTES, type AppRoute } from './routes';

/** Every in-app route is wrapped by the guard here — the route table is the single permission source (C1). */
const guarded = (r: AppRoute, page: ReactNode = <PlaceholderPage title={r.title} />) => ({
  path: r.path,
  element: <RequirePermission permission={r.permission}>{page}</RequirePermission>,
});

const router = createBrowserRouter([
  { path: ROUTES.login.path, element: <LoginPage /> },
  {
    element: (
      <RequirePermission permission={null}>
        <AppLayout />
      </RequirePermission>
    ),
    children: [
      guarded(ROUTES.mySpace, <MySpacePage />),
      guarded(ROUTES.catalog, <CatalogPage />),
      guarded(ROUTES.catalogCategory, <CatalogPage />),
      guarded(ROUTES.callNew, <CallFormPage />),
      guarded(ROUTES.callSearch, <SearchPage />),
      guarded(ROUTES.callDetail, <CallDetailPage />),
      guarded(ROUTES.approvals, <ApprovalsPage />),
    ],
  },
  { path: '/', element: <Navigate to={ROUTES.mySpace.path} replace /> },
  { path: '*', element: <Navigate to={ROUTES.mySpace.path} replace /> },
]);

export function App() {
  useEffect(() => {
    // US-001: tell the user once when stored data was unreadable and the seed was reloaded
    const warning = dataStore.takeLoadWarning();
    if (warning) toast.warning(warning.message, { id: 'storage-warning', duration: 10_000 });
  }, []);

  return (
    <ErrorBoundary>
      <TooltipProvider>
        <RouterProvider router={router} />
        <Toaster position="top-center" richColors={false} />
      </TooltipProvider>
    </ErrorBoundary>
  );
}
