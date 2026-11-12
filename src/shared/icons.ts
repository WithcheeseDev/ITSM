/**
 * Allow-list of Lucide icons that data may name (serviceCategories[].icon).
 * Named imports only — never `import * as icons` (keeps the bundle small, design C6).
 */
import {
  Activity, AlertTriangle, AppWindow, Building2, ClipboardList, Cloud, CloudCog, Database, Folder, GitBranch, GitPullRequest,
  Laptop, Network, Package, Printer, Rocket, Server, ShieldAlert, ShieldCheck, UserCog, Wifi, type LucideIcon,
} from 'lucide-react';

const ICONS: Readonly<Record<string, LucideIcon>> = {
  Activity, AlertTriangle, AppWindow, Building2, ClipboardList, Cloud, CloudCog, Database, Folder, GitBranch, GitPullRequest,
  Laptop, Network, Package, Printer, Rocket, Server, ShieldAlert, ShieldCheck, UserCog, Wifi,
};

export const DEFAULT_ICON: LucideIcon = Folder;

/** Icon for a data-provided name; unknown names fall back to DEFAULT_ICON with `known: false` (caller logs). */
export function resolveIcon(name: string | null | undefined): { icon: LucideIcon; known: boolean } {
  const icon = name && Object.hasOwn(ICONS, name) ? ICONS[name] : undefined;
  return icon ? { icon, known: true } : { icon: DEFAULT_ICON, known: false };
}
