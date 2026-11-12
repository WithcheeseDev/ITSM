import { Navigate, useNavigate } from 'react-router';
import { ChevronRight, Info } from 'lucide-react';
import { dataStore } from '@/data/repositories';
import { Badge } from '@/shared/ui/badge';
import logoUrl from '@/assets/logo.svg';
import { ROUTES } from '@/app/routes';
import { ROLE_LABELS, useSession } from './sessionStore';

/** Login blueprint (design-system §7): centred card ≤ 480, one 44px button per sample user, no password (FR-001). */
export function LoginPage() {
  const { user, login } = useSession();
  const navigate = useNavigate();
  if (user) return <Navigate to={ROUTES.mySpace.path} replace />;

  const users = dataStore.repository('users').findAll();
  const choose = (id: string) => {
    if (login(id)) navigate(ROUTES.mySpace.path, { replace: true });
  };

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background p-[var(--gutter)]">
      <section
        aria-labelledby="login-title"
        className="w-full max-w-[30rem] rounded-[var(--card-radius)] bg-card p-[var(--space-6)] shadow-[var(--shadow-md)] sm:p-[var(--space-8)]"
      >
        <div className="flex items-center gap-[var(--space-2)] font-semibold text-primary">
          <img src={logoUrl} alt="" className="h-[var(--logo-height)] w-auto object-contain" />
          <span>ITSM Support Desk</span>
        </div>
        <h1 id="login-title" className="mt-[var(--space-6)] text-[length:var(--fs-xl)]">
          เลือกผู้ใช้ตัวอย่าง
        </h1>
        <p className="mt-[var(--space-1)] text-muted-foreground">เลือกชื่อเพื่อเข้าระบบในบทบาทนั้น ไม่ต้องใช้รหัสผ่าน</p>

        <ul className="mt-[var(--space-5)] flex flex-col gap-[var(--space-2)]">
          {users.map((u) => (
            <li key={u.id}>
              <button
                type="button"
                onClick={() => choose(u.id)}
                className="flex min-h-[var(--tap-target)] w-full items-center gap-[var(--space-3)] rounded-[var(--radius-md)] border border-border px-[var(--space-4)] py-[var(--space-2)] text-left transition-colors duration-[var(--dur-fast)] hover:border-primary hover:bg-primary-soft"
              >
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">{u.name}</span>
                  {u.department && <span className="block text-[length:var(--fs-sm)] text-muted-foreground">{u.department}</span>}
                </span>
                <Badge variant="secondary" className="text-[length:var(--fs-sm)]">
                  {ROLE_LABELS[u.role]}
                </Badge>
                <ChevronRight aria-hidden="true" className="size-[var(--icon-sm)] shrink-0 text-muted-foreground" />
              </button>
            </li>
          ))}
        </ul>

        <p className="mt-[var(--space-5)] flex items-start gap-[var(--space-2)] text-[length:var(--fs-sm)] text-muted-foreground">
          <Info aria-hidden="true" className="mt-0.5 size-[var(--icon-sm)] shrink-0" />
          รายชื่อและข้อมูลทั้งหมดเป็นข้อมูลสมมติสำหรับทดลองใช้งาน
        </p>
      </section>
    </main>
  );
}
