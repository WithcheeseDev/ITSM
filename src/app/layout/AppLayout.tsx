import { useState } from 'react';
import { Link, Outlet } from 'react-router';
import { Menu, Sparkles } from 'lucide-react';
import { dataStore } from '@/data/repositories';
import { can } from '@/domain/access';
import { AiPanel } from '@/features/ai-assistant/AiPanel';
import { useSession } from '@/features/auth/sessionStore';
import { Button } from '@/shared/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/shared/ui/sheet';
import logoUrl from '@/assets/logo.svg';
import { ROUTES } from '../routes';
import { Sidebar } from './Sidebar';
import { UserMenu } from './UserMenu';

/** `tone="light"` = white text for the dark sidebar surface. */
function Wordmark({ tone = 'brand' }: { tone?: 'brand' | 'light' }) {
  return (
    <Link
      to={ROUTES.mySpace.path}
      className={`flex min-h-[var(--tap-target)] min-w-0 items-center gap-[var(--space-2)] rounded-[var(--radius-md)] font-semibold ${tone === 'light' ? 'text-[var(--sidebar-fg)]' : 'text-primary'}`}
    >
      <img
        src={logoUrl}
        alt=""
        className={`shrink-0 h-[var(--logo-height-mobile)] w-auto object-contain lg:h-[var(--logo-height)] ${tone === 'light' ? 'rounded-[var(--radius-sm)] ring-1 ring-[var(--sidebar-border)]' : ''}`}
      />
      <span className="truncate">ITSM Support Desk</span>
    </Link>
  );
}

/** Shell (design-system §7): ≥ lg sidebar 240px full height (logo on top) + header over the content column · < lg header + drawer. */
export function AppLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const { user } = useSession();
  const aiAllowed = can(user, 'ai:use', dataStore.getDataset().rolePermissions);

  return (
    <div className="flex min-h-dvh bg-background">
      <aside className="sticky top-0 hidden h-dvh w-[var(--sidebar-width)] shrink-0 flex-col overflow-y-auto border-r sidebar-surface lg:flex">
        <div className="flex h-[var(--header-height)] shrink-0 items-center border-b px-[var(--space-4)]">
          <Wordmark tone="light" />
        </div>
        <Sidebar />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-[var(--header-height)] items-center gap-[var(--space-2)] border-b bg-card px-[max(var(--gutter),env(safe-area-inset-left))] lg:px-[var(--gutter-lg)]">
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
            {aiAllowed && (
              <Button variant="ghost" aria-label="AI Assistant" aria-expanded={aiOpen} onClick={() => setAiOpen(true)} className="text-accent">
                <Sparkles aria-hidden="true" className="size-[var(--icon-md)]" />
                <span className="hidden sm:inline">AI Assistant</span>
              </Button>
            )}
            <UserMenu />
          </div>
        </header>

        {user && aiAllowed && <AiPanel me={user} open={aiOpen} onOpenChange={setAiOpen} />}

        <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
          <SheetContent side="left" className="sidebar-surface w-[var(--sidebar-width)] p-0">
            <SheetHeader className="border-b px-[var(--space-4)] py-[var(--space-3)]">
              <SheetTitle>เมนู</SheetTitle>
              <SheetDescription className="sr-only">เลือกหน้าที่ต้องการไป</SheetDescription>
            </SheetHeader>
            <Sidebar onNavigate={() => setDrawerOpen(false)} />
          </SheetContent>
        </Sheet>

        <main className="min-w-0 flex-1">
          <div className="mx-auto w-full max-w-[var(--container-max)] px-[max(var(--gutter),env(safe-area-inset-left))] py-[var(--space-6)] lg:px-[var(--gutter-lg)] lg:py-[var(--space-8)]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
