import { useEffect, useRef, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router';
import { ChevronLeft, ChevronRight, Menu } from 'lucide-react';
import { dataStore } from '@/data/repositories';
import { can } from '@/domain/access';
import { AiPanel } from '@/features/ai-assistant/AiPanel';
import { useSession } from '@/features/auth/sessionStore';
import { cn } from '@/lib/utils';
import { Button } from '@/shared/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/shared/ui/sheet';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/tooltip';
import logoUrl from '@/assets/logo.svg';
import bannerUrl from '@/assets/sidebar-banner.webp';
import robotUrl from '@/assets/sidebar-robot.webp';
import { ROUTES } from '../routes';
import { Sidebar } from './Sidebar';
import { UserMenu } from './UserMenu';

/** Brand-colour wordmark for the light header (< lg). */
function Wordmark() {
  return (
    <Link
      to={ROUTES.mySpace.path}
      className="flex min-h-[var(--tap-target)] min-w-0 items-center gap-[var(--space-2)] rounded-[var(--radius-md)] font-semibold text-primary"
    >
      <img src={logoUrl} alt="" className="shrink-0 h-[var(--logo-height-mobile)] w-auto object-contain lg:h-[var(--logo-height)]" />
      <span className="truncate">ITSM Support Desk</span>
    </Link>
  );
}

/** Full-width banner at the top of the sidebar card (compact = robot for the collapsed rail); focus ring drawn inside because the card clips overflow. */
function SidebarBanner({ onNavigate, divider = false, compact = false }: { onNavigate?: () => void; divider?: boolean; compact?: boolean }) {
  return (
    <Link
      to={ROUTES.mySpace.path}
      onClick={onNavigate}
      className={cn('block shrink-0 focus-visible:outline-offset-[-2px]', divider && 'border-b', compact && 'grid size-full place-items-center')}
    >
      {compact ? (
        <img src={robotUrl} alt="ITSM Support Desk" width={40} height={40} className="block size-10 object-contain" />
      ) : (
        <img src={bannerUrl} alt="ITSM Support Desk" width={480} height={160} className="block aspect-[3/1] w-full object-cover" />
      )}
    </Link>
  );
}

const SIDEBAR_COLLAPSED_KEY = 'itsm.ui.sidebarCollapsed';

function readCollapsed(): boolean {
  try {
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1';
  } catch {
    return false;
  }
}

/** Shell (design-system §7): ≥ lg sidebar as two floating cards (banner + menu) + right column of a header card (height = banner card) and a framed content panel that scrolls itself · < lg sticky header + drawer. */
export function AppLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(readCollapsed); // ≥ lg rail only; the drawer never collapses
  const { user } = useSession();
  const aiAllowed = can(user, 'ai:use', dataStore.getDataset().rolePermissions);
  const { pathname } = useLocation();
  const panelRef = useRef<HTMLDivElement>(null);

  // A new page starts at the top: ≥ lg the panel is the scroller, < lg the window is
  useEffect(() => {
    panelRef.current?.scrollTo({ top: 0 });
    window.scrollTo({ top: 0 });
  }, [pathname]);

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? '1' : '0');
    } catch {
      // storage blocked: the choice lasts until reload
    }
  };

  return (
    <div className="flex min-h-dvh bg-[var(--app-canvas)]">
      <aside
        id="app-sidebar"
        className={cn(
          'sticky top-[var(--sidebar-inset)] z-10 m-[var(--sidebar-inset)] hidden h-[calc(100dvh-2*var(--sidebar-inset))] shrink-0 flex-col gap-[var(--space-2)] transition-[width] duration-[var(--dur-normal)] ease-[var(--ease-standard)] lg:flex',
          collapsed ? 'w-[var(--sidebar-rail-width)]' : 'w-[var(--sidebar-width)]',
        )}
      >
        <div
          className={cn(
            'on-brand shrink-0 overflow-hidden rounded-[var(--sidebar-radius)] shadow-[var(--sidebar-shadow)]',
            collapsed && 'sidebar-surface size-[var(--sidebar-rail-width)]',
          )}
        >
          <SidebarBanner compact={collapsed} />
        </div>
        <div className="on-brand sidebar-surface min-h-0 flex-1 overflow-x-hidden overflow-y-auto rounded-[var(--sidebar-radius)] shadow-[var(--sidebar-shadow)]">
          <Sidebar collapsed={collapsed} />
        </div>
        {/* Ribbon tab attached outside the right edge (aside z-10 keeps it above the panel); no .on-brand so the focus ring stays crimson */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label={collapsed ? 'ขยายเมนู' : 'ย่อเมนู'}
              aria-expanded={!collapsed}
              aria-controls="app-sidebar"
              onClick={toggleCollapsed}
              className="absolute top-1/2 right-0 flex h-11 w-6 translate-x-full -translate-y-1/2 items-center justify-center rounded-r-[var(--radius-md)] ribbon-tab-surface text-primary-foreground shadow-[var(--shadow-sm)] transition-[filter] duration-[var(--dur-fast)] hover:brightness-110 before:absolute before:inset-y-0 before:right-0 before:w-11 before:content-['']"
            >
              {collapsed ? <ChevronRight aria-hidden="true" strokeWidth={2.5} className="size-[var(--icon-md)]" /> : <ChevronLeft aria-hidden="true" strokeWidth={2.5} className="size-[var(--icon-md)]" />}
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">{collapsed ? 'ขยายเมนู' : 'ย่อเมนู'}</TooltipContent>
        </Tooltip>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col lg:sticky lg:top-[var(--sidebar-inset)] lg:my-[var(--sidebar-inset)] lg:mr-[var(--sidebar-inset)] lg:h-[calc(100dvh-2*var(--sidebar-inset))] lg:gap-[var(--space-2)]">
        {/* ≥ lg: own card, height follows the banner card beside it */}
        <header
          className={cn(
            'sticky top-0 z-40 flex h-[var(--header-height)] shrink-0 items-center gap-[var(--space-2)] header-surface px-[max(var(--gutter),env(safe-area-inset-left))] lg:static lg:rounded-[var(--content-panel-radius)] lg:px-[var(--gutter-lg)] lg:shadow-[var(--content-panel-shadow)] lg:transition-[height] lg:duration-[var(--dur-normal)] lg:ease-[var(--ease-standard)]',
            collapsed ? 'lg:h-[var(--sidebar-rail-width)]' : 'lg:h-[calc(var(--sidebar-width)/3)]',
          )}
        >
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label="เปิดเมนู"
            aria-expanded={drawerOpen}
            onClick={() => setDrawerOpen(true)}
          >
            <Menu aria-hidden="true" className="size-[var(--icon-md)]" />
          </Button>
          <div className="min-w-0 lg:hidden">
            <Wordmark />
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-[var(--space-1)]">
            <UserMenu />
          </div>
        </header>

        <div
          ref={panelRef}
          className="flex min-h-0 min-w-0 flex-1 flex-col bg-[var(--content-panel-bg)] content-panel-surface lg:overflow-y-auto lg:rounded-[var(--content-panel-radius)] lg:shadow-[var(--content-panel-shadow)]"
        >
          {user && aiAllowed && <AiPanel me={user} open={aiOpen} onOpenChange={setAiOpen} />}

          {aiAllowed && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label="AI Assistant"
                  aria-expanded={aiOpen}
                  onClick={() => setAiOpen(true)}
                  className="ai-fab flex size-[var(--fab-size)] items-center justify-center rounded-full bg-card shadow-[0_0_0_1px_var(--border),var(--shadow-lg)] transition-colors duration-[var(--dur-fast)] hover:bg-muted"
                >
                  <span aria-hidden="true" className="ai-fab-robot size-9" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="left">AI Assistant</TooltipContent>
            </Tooltip>
          )}

          <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
            <SheetContent side="left" className="on-brand sidebar-surface w-[var(--sidebar-width)] p-0">
              <SheetHeader className="sr-only">
                <SheetTitle>เมนู</SheetTitle>
                <SheetDescription>เลือกหน้าที่ต้องการไป</SheetDescription>
              </SheetHeader>
              <SidebarBanner divider onNavigate={() => setDrawerOpen(false)} />
              <Sidebar onNavigate={() => setDrawerOpen(false)} />
            </SheetContent>
          </Sheet>

          <main className="min-w-0 flex-1">
            <div
              className={cn(
                'mx-auto w-full max-w-[var(--container-max)] px-[max(var(--gutter),env(safe-area-inset-left))] py-[var(--space-6)] lg:px-[var(--gutter-lg)] lg:py-[var(--space-8)]',
                aiAllowed && 'pb-[calc(var(--fab-size)+2*var(--fab-offset))] lg:pb-[calc(var(--fab-size)+2*var(--fab-offset))]',
              )}
            >
              <div key={pathname} className="page-enter">
                <Outlet />
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
