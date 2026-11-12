import type { LucideIcon } from 'lucide-react';
import { ClipboardCheck, Home, LayoutGrid, Search } from 'lucide-react';

/**
 * Route table — single place where every route declares its required permission (C1, default-deny).
 * `permission: null` = public. Enforcement (RequirePermission) arrives in task 2.4.
 * Permission per route is derived from rolePermissions in database.json [ASM]:
 * search/detail use call:view_own; what each role may see inside is filtered by the services (C3).
 */
export interface AppRoute {
  path: string;
  title: string;
  permission: string | null;
}

export const ROUTES = {
  login: { path: '/login', title: 'เข้าสู่ระบบ', permission: null },
  mySpace: { path: '/my-space', title: 'My Space', permission: 'call:view_own' },
  catalog: { path: '/catalog', title: 'Service Catalog', permission: 'catalog:view' },
  catalogCategory: { path: '/catalog/:categoryId', title: 'Service Catalog', permission: 'catalog:view' },
  callNew: { path: '/calls/new', title: 'แจ้งเรื่องใหม่', permission: 'call:create' },
  callSearch: { path: '/calls/search', title: 'ค้นหาเรื่อง', permission: 'call:view_own' },
  callDetail: { path: '/calls/:callId', title: 'รายละเอียดเรื่อง', permission: 'call:view_own' },
  approvals: { path: '/approvals', title: 'อนุมัติ', permission: 'approval:view_assigned' },
} as const satisfies Record<string, AppRoute>;

export interface NavItem extends AppRoute {
  icon: LucideIcon;
  label: string;
}

/** Flat sidebar (design-system §7): every page is a top-level item with its own icon. */
export const NAV_ITEMS: readonly NavItem[] = [
  { ...ROUTES.mySpace, label: 'My Space', icon: Home },
  { ...ROUTES.catalog, label: 'Service Catalog', icon: LayoutGrid },
  { ...ROUTES.callSearch, label: 'ค้นหาเรื่อง', icon: Search },
  { ...ROUTES.approvals, label: 'อนุมัติ', icon: ClipboardCheck },
];
