import { useLayoutEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router';
import { cn } from '@/lib/utils';
import { dataStore } from '@/data/repositories';
import { can } from '@/domain/access';
import { useSession } from '@/features/auth/sessionStore';
import { NAV_ITEMS } from '../routes';

interface Props {
  onNavigate?: () => void;
}

interface IndicatorBox {
  top: number;
  left: number;
  width: number;
  height: number;
  visible: boolean;
}

const HIDDEN: IndicatorBox = { top: 0, left: 0, width: 0, height: 0, visible: false };

export function Sidebar({ onNavigate }: Props) {
  const { user } = useSession();
  const { pathname } = useLocation();
  const permissions = dataStore.getDataset().rolePermissions;
  // Hide menu items the role cannot open (US-003); the route guard still enforces it
  const items = NAV_ITEMS.filter((item) => item.permission === null || can(user, item.permission, permissions));

  // Active indicator (design-system §3 Motion / §7): one darker patch that slides to the active item
  const navRef = useRef<HTMLElement>(null);
  const [box, setBox] = useState<IndicatorBox>(HIDDEN);
  const [animate, setAnimate] = useState(false); // first placement (page load / drawer open) must not slide in

  useLayoutEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const measure = () => {
      const active = nav.querySelector<HTMLElement>('a[aria-current="page"]');
      setBox((prev) =>
        active
          ? { top: active.offsetTop, left: active.offsetLeft, width: active.offsetWidth, height: active.offsetHeight, visible: true }
          : { ...prev, visible: false },
      );
    };
    measure();
    const frame = requestAnimationFrame(() => setAnimate(true));
    const observer = new ResizeObserver(measure); // font load, drawer width, viewport changes
    observer.observe(nav);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [pathname]);

  return (
    <nav ref={navRef} aria-label="เมนูหลัก" className="relative flex flex-col gap-[var(--space-1)] p-[var(--space-3)]">
      <span
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute top-0 left-0 rounded-[var(--radius-md)] bg-[var(--sidebar-item-active-bg)]',
          animate && 'transition-[transform,opacity] duration-[var(--dur-normal)] ease-[var(--ease-standard)]',
        )}
        style={{
          width: box.width,
          height: box.height,
          transform: `translate(${box.left}px, ${box.top}px)`,
          opacity: box.visible ? 1 : 0,
        }}
      />
      {items.map(({ path, label, icon: Icon }) => (
        <NavLink
          key={path}
          to={path}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'relative flex min-h-[var(--tap-target)] items-center gap-[var(--space-3)] rounded-[var(--radius-md)] px-[var(--space-3)] font-medium text-foreground transition-colors duration-[var(--dur-fast)] hover:bg-muted',
              isActive && 'font-semibold text-[var(--sidebar-item-active-fg)] hover:bg-transparent',
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
