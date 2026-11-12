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

/** Shell (design-system §7): header 56px · sidebar 240px ≥ lg · drawer < lg. */
export function AppLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const { user } = useSession();
  const aiAllowed = can(user, 'ai:use', dataStore.getDataset().rolePermissions);

  return (
    <div className="min-h-dvh bg-background">
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
        <Wordmark />
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
        <SheetContent side="left" className="w-[var(--sidebar-width)] bg-[var(--sidebar-bg)] p-0">
          <SheetHeader className="border-b px-[var(--space-4)] py-[var(--space-3)]">
            <SheetTitle>เมนู</SheetTitle>
            <SheetDescription className="sr-only">เลือกหน้าที่ต้องการไป</SheetDescription>
          </SheetHeader>
          <Sidebar onNavigate={() => setDrawerOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex">
        <aside className="sticky top-[var(--header-height)] hidden h-[calc(100dvh-var(--header-height))] w-[var(--sidebar-width)] shrink-0 overflow-y-auto border-r bg-[var(--sidebar-bg)] lg:block">
          <Sidebar />
        </aside>
        <main className="min-w-0 flex-1">
          <div className="mx-auto w-full max-w-[var(--container-max)] px-[max(var(--gutter),env(safe-area-inset-left))] py-[var(--space-6)] lg:px-[var(--gutter-lg)] lg:py-[var(--space-8)]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
