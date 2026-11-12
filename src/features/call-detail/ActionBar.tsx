import { useState } from 'react';
import { ArrowRight, RotateCcw, UserPlus, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { CallAction } from '@/domain/access';
import { cancelStatus, nextStatuses } from '@/domain/stateMachine';
import type { ClosureCategory, Dataset, Result, Status, SupportCall, User } from '@/domain/types';
import { assignCall, cancelCall, changeStatus, reopenCall } from '@/features/calls/callService';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/shared/ui/alert-dialog';
import { Button } from '@/shared/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { Label } from '@/shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Textarea } from '@/shared/ui/textarea';

type Pending = { kind: 'assign' } | { kind: 'resolve' } | { kind: 'confirm'; to: Status; cancel: boolean } | null;

/** Field error text from a failed Result, else the generic Thai message. */
const errorText = (r: Extract<Result<unknown>, { ok: false }>) => Object.values(r.error.fieldErrors ?? {})[0] ?? r.error.message;

/**
 * C9 ActionBar — only the actions `availableActions` allows (US-026–028). One button per allowed transition;
 * Resolved asks for a closure category, cancelling asks for confirmation.
 */
export function ActionBar({
  me, call, actions, dataset, onChanged,
}: {
  me: User;
  call: SupportCall;
  actions: readonly CallAction[];
  dataset: Dataset;
  onChanged: () => void;
}) {
  const [pending, setPending] = useState<Pending>(null);
  const [assignee, setAssignee] = useState(call.assignedToId ?? '');
  const [closure, setClosure] = useState('');
  const [closureError, setClosureError] = useState<string | null>(null);
  const [note, setNote] = useState('');

  const members = dataset.users.filter((u) => u.groupIds.includes(call.groupId));
  const cancelTo = cancelStatus(call.callType);
  const transitions = actions.includes('changeStatus')
    ? nextStatuses(call.callType, call.status).filter((s) => !(actions.includes('cancel') && s === cancelTo))
    : [];

  const done = (r: Result<SupportCall>, success: string) => {
    if (!r.ok) {
      toast.error(errorText(r), { id: 'call-action-error' });
      return false;
    }
    toast.success(success);
    setPending(null);
    setNote('');
    onChanged();
    return true;
  };

  const startTransition = (to: Status) => {
    if (to === 'Resolved') {
      setClosure('');
      setClosureError(null);
      setPending({ kind: 'resolve' });
    } else if (to === cancelTo) {
      setPending({ kind: 'confirm', to, cancel: false });
    } else {
      done(changeStatus(me, call.id, to), `เปลี่ยนสถานะเป็น ${to} แล้ว`);
    }
  };

  if (actions.filter((a) => a !== 'comment').length === 0) return null;

  return (
    <>
      <div role="group" aria-label="การดำเนินการ" className="flex flex-wrap gap-[var(--space-2)]">
        {actions.includes('assign') && (
          <Button variant="outline" onClick={() => setPending({ kind: 'assign' })}>
            <UserPlus aria-hidden="true" />
            มอบหมาย
          </Button>
        )}
        {transitions.map((to) => (
          <Button key={to} variant={to === 'Resolved' ? 'default' : 'outline'} aria-label={`เปลี่ยนสถานะเป็น ${to}`} onClick={() => startTransition(to)}>
            <ArrowRight aria-hidden="true" />
            {to}
          </Button>
        ))}
        {actions.includes('reopen') && (
          <Button variant="outline" onClick={() => done(reopenCall(me, call.id), 'เปิดเรื่องใหม่แล้ว')}>
            <RotateCcw aria-hidden="true" />
            เปิดเรื่องใหม่
          </Button>
        )}
        {actions.includes('cancel') && cancelTo && (
          <Button variant="outline" className="text-destructive" onClick={() => setPending({ kind: 'confirm', to: cancelTo, cancel: true })}>
            <XCircle aria-hidden="true" />
            ยกเลิกเรื่อง
          </Button>
        )}
      </div>

      {/* Assign — members of the call's group only */}
      <Dialog open={pending?.kind === 'assign'} onOpenChange={(o) => !o && setPending(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>มอบหมายเรื่อง #{call.number}</DialogTitle>
            <DialogDescription>เลือกเจ้าหน้าที่ในกลุ่มที่รับผิดชอบ</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-[var(--space-2)]">
            <Label htmlFor="assignee">ผู้รับผิดชอบ</Label>
            <Select value={assignee} onValueChange={setAssignee}>
              <SelectTrigger id="assignee" className="w-full">
                <SelectValue placeholder="เลือกเจ้าหน้าที่" />
              </SelectTrigger>
              <SelectContent>
                {members.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPending(null)}>
              ยกเลิก
            </Button>
            <Button onClick={() => done(assignCall(me, call.id, assignee), 'มอบหมายแล้ว')}>บันทึก</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resolved — closure category required (US-027) */}
      <Dialog open={pending?.kind === 'resolve'} onOpenChange={(o) => !o && setPending(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>เปลี่ยนเป็น Resolved</DialogTitle>
            <DialogDescription>ระบุสาเหตุการปิดเรื่องเพื่อใช้วิเคราะห์ย้อนหลัง</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-[var(--space-2)]">
            <Label htmlFor="closure">Closure Category</Label>
            <Select value={closure} onValueChange={(v) => { setClosure(v); setClosureError(null); }}>
              <SelectTrigger id="closure" className="w-full" aria-invalid={Boolean(closureError)} aria-describedby={closureError ? 'closure-error' : undefined}>
                <SelectValue placeholder="เลือก Closure Category" />
              </SelectTrigger>
              <SelectContent>
                {dataset.enums.closureCategories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {closureError && (
              <p id="closure-error" className="text-[length:var(--fs-sm)] text-destructive">
                {closureError}
              </p>
            )}
            <Label htmlFor="resolve-note" className="mt-[var(--space-2)]">
              หมายเหตุ (ถ้ามี)
            </Label>
            <Textarea id="resolve-note" value={note} onChange={(e) => setNote(e.target.value)} rows={3} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPending(null)}>
              ยกเลิก
            </Button>
            <Button
              onClick={() => {
                const r = changeStatus(me, call.id, 'Resolved', { closureCategory: (closure || null) as ClosureCategory | null, comment: note });
                if (!r.ok && r.error.fieldErrors?.closureCategory) setClosureError(r.error.fieldErrors.closureCategory);
                else done(r, 'เปลี่ยนสถานะเป็น Resolved แล้ว');
              }}
            >
              บันทึก
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel — irreversible for the requestor, so confirm first */}
      <AlertDialog open={pending?.kind === 'confirm'} onOpenChange={(o) => !o && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยกเลิกเรื่อง #{call.number}?</AlertDialogTitle>
            <AlertDialogDescription>สถานะจะเปลี่ยนเป็น {pending?.kind === 'confirm' ? pending.to : ''} และดำเนินการต่อไม่ได้</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ไม่ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (pending?.kind !== 'confirm') return;
                const r = pending.cancel ? cancelCall(me, call.id) : changeStatus(me, call.id, pending.to);
                done(r, 'ยกเลิกเรื่องแล้ว');
              }}
            >
              ยกเลิกเรื่อง
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
