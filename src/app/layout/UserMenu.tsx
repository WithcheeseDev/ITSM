import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ChevronDown, CircleUserRound, LogOut, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { dataStore } from '@/data/repositories';
import { ROLE_LABELS, useSession } from '@/features/auth/sessionStore';
import { Button } from '@/shared/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/shared/ui/alert-dialog';
import { ROUTES } from '../routes';

const itemClass =
  'flex min-h-[var(--tap-target)] w-full items-center gap-[var(--space-2)] rounded-[var(--radius-md)] px-[var(--space-3)] text-left hover:bg-muted';

export function UserMenu() {
  const { user, logout } = useSession();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  if (!user) return null;

  const signOut = () => {
    setOpen(false);
    logout();
    navigate(ROUTES.login.path, { replace: true });
  };

  const reset = () => {
    const r = dataStore.resetToSeed();
    if (!r.ok) {
      toast.error(r.error.message);
      return;
    }
    // shortcut: full reload so every page re-reads the dataset — replace with a data-store subscription when pages cache data (2.6+)
    window.location.assign(ROUTES.mySpace.path);
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" className="gap-[var(--space-2)] px-[var(--space-2)]" aria-label={`เมนูผู้ใช้: ${user.name}`}>
            <CircleUserRound aria-hidden="true" strokeWidth={1.75} className="size-[var(--icon-md)]" />
            <span className="hidden max-w-[12rem] truncate sm:inline">{user.name}</span>
            <ChevronDown aria-hidden="true" className="size-[var(--icon-sm)] text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-64 p-[var(--space-2)]">
          <div className="border-b px-[var(--space-3)] pb-[var(--space-2)] pt-[var(--space-1)]">
            <p className="font-medium">{user.name}</p>
            <p className="text-[length:var(--fs-sm)] text-muted-foreground">{ROLE_LABELS[user.role]}</p>
          </div>
          <div className="flex flex-col pt-[var(--space-2)]">
            <button
              type="button"
              className={itemClass}
              onClick={() => {
                setOpen(false);
                setConfirmReset(true);
              }}
            >
              <RotateCcw aria-hidden="true" className="size-[var(--icon-sm)]" />
              รีเซ็ตข้อมูลตัวอย่าง
            </button>
            <button type="button" className={itemClass} onClick={signOut}>
              <LogOut aria-hidden="true" className="size-[var(--icon-sm)]" />
              ออกจากระบบ
            </button>
          </div>
        </PopoverContent>
      </Popover>

      <AlertDialog open={confirmReset} onOpenChange={setConfirmReset}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>รีเซ็ตข้อมูลตัวอย่าง?</AlertDialogTitle>
            <AlertDialogDescription>
              เรื่องที่แจ้ง ความเห็น และการอนุมัติที่ทำในเครื่องนี้จะถูกลบ และกลับไปเป็นข้อมูลตั้งต้น ย้อนกลับไม่ได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={reset}>
              รีเซ็ตข้อมูล
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
