import { NavLink } from 'react-router';
import { cn } from '@/lib/utils';
import { dataStore } from '@/data/repositories';
import { can } from '@/domain/access';
import { useSession } from '@/features/auth/sessionStore';
import { NAV_ITEMS } from '../routes';

interface Props {
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: Props) {
  const { user } = useSession();
  const permissions = dataStore.getDataset().rolePermissions;
  // Hide menu items the role cannot open (US-003); the route guard still enforces it
  const items = NAV_ITEMS.filter((item) => item.permission === null || can(user, item.permission, permissions));

  return (
    <nav aria-label="เมนูหลัก" className="flex flex-col gap-[var(--space-1)] p-[var(--space-3)]">
      {items.map(({ path, label, icon: Icon }) => (
        <NavLink
          key={path}
          to={path}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'flex min-h-[var(--tap-target)] items-center gap-[var(--space-3)] rounded-[var(--radius-md)] px-[var(--space-3)] font-medium text-foreground transition-colors duration-[var(--dur-fast)] hover:bg-muted',
              isActive && 'bg-[var(--sidebar-item-active-bg)] text-[var(--sidebar-item-active-fg)] hover:bg-[var(--sidebar-item-active-bg)]',
            )
          }
        >
          <Icon aria-hidden="true" strokeWidth={1.75} className="size-[var(--icon-md)] shrink-0" />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
