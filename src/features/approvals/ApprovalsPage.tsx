import { useReducer, useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { Check, ClipboardCheck, Hourglass, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import { dataStore } from '@/data/repositories';
import { APPROVAL_TYPES, type ApprovalType, type User } from '@/domain/types';
import { useSession } from '@/features/auth/sessionStore';
import { ApprovalSteps } from '@/features/call-detail/ApprovalSteps';
import { buildCallLookups } from '@/shared/components/callColumns';
import { EmptyState } from '@/shared/components/EmptyState';
import { FilterChips, type ChipOption } from '@/shared/components/FilterChips';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { Button } from '@/shared/ui/button';
import { Checkbox } from '@/shared/ui/checkbox';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import {
  DEFAULT_APPROVAL_CRITERIA, decide, listMyApprovals, type ApprovalCriteria, type ApprovalRow, type TriState,
} from './approvalService';
import { RejectDialog } from './RejectDialog';

const card = 'rounded-[var(--card-radius)] bg-card p-[var(--card-padding)] shadow-[var(--card-shadow)]';
const ANY = '__any';
const TRI: ChipOption<TriState>[] = [
  { value: 'all', label: 'All' },
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
];

/** C14 Approvals — US-030 list (default My Approvals + Done = No), US-031 approve / reject in the row. */
export function ApprovalsPage() {
  const { user } = useSession();
  // RequirePermission guarantees a session; the cast only narrows the type
  const me = user as User;
  const [criteria, setCriteria] = useState<ApprovalCriteria>(DEFAULT_APPROVAL_CRITERIA);
  const [applied, setApplied] = useState<ApprovalCriteria>(DEFAULT_APPROVAL_CRITERIA);
  const [rejecting, setRejecting] = useState<ApprovalRow | null>(null);
  const [, refresh] = useReducer((n: number) => n + 1, 0);

  const d = dataStore.getDataset();
  const lookups = buildCallLookups(d, Date.now());
  const rows = listMyApprovals(me, applied);
  const set = <K extends keyof ApprovalCriteria>(key: K, value: ApprovalCriteria[K]) => setCriteria((c) => ({ ...c, [key]: value }));

  const search = (e: FormEvent) => {
    e.preventDefault();
    setApplied(criteria);
  };
  const clear = () => {
    setCriteria(DEFAULT_APPROVAL_CRITERIA);
    setApplied(DEFAULT_APPROVAL_CRITERIA);
  };

  const approve = (row: ApprovalRow) => {
    const r = decide(me, row.approval.id, 'approved');
    if (!r.ok) {
      toast.error(Object.values(r.error.fieldErrors ?? {})[0] ?? r.error.message, { id: 'approval-error' });
      return;
    }
    toast.success(`อนุมัติ #${row.call.number} (${row.approval.approvalType}) แล้ว`);
    refresh();
  };

  return (
    <>
      <h1 className="text-[length:var(--fs-xl)] md:text-[length:var(--fs-2xl)]">อนุมัติ</h1>

      <form noValidate onSubmit={search} aria-labelledby="approval-criteria" className={`mt-[var(--section-gap)] ${card}`}>
        <h2 id="approval-criteria" className="text-[length:var(--fs-lg)]">เงื่อนไข</h2>
        <div className="mt-[var(--space-4)] grid grid-cols-1 gap-[var(--space-4)] sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex flex-col gap-[var(--space-2)]">
            <Label htmlFor="callNumber">Call number</Label>
            <Input id="callNumber" value={criteria.callNumber} onChange={(e) => set('callNumber', e.target.value)} />
          </div>
          <div className="flex flex-col gap-[var(--space-2)]">
            <Label htmlFor="approvalSummary">Summary</Label>
            <Input id="approvalSummary" value={criteria.summary} onChange={(e) => set('summary', e.target.value)} />
          </div>
          <div className="flex flex-col gap-[var(--space-2)]">
            <Label htmlFor="approvalType">Approval type</Label>
            <Select value={criteria.approvalType || ANY} onValueChange={(v) => set('approvalType', v === ANY ? '' : (v as ApprovalType))}>
              <SelectTrigger id="approvalType" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY}>ทุกขั้น</SelectItem>
                {APPROVAL_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="mt-[var(--space-4)] flex flex-wrap gap-x-[var(--space-8)] gap-y-[var(--space-4)]">
          <div className="flex flex-col gap-[var(--space-2)]">
            <span aria-hidden="true" className="text-[length:var(--fs-sm)] font-medium">Done</span>
            <FilterChips label="Done" options={TRI} value={criteria.done} onChange={(v) => set('done', v)} />
          </div>
          <div className="flex flex-col gap-[var(--space-2)]">
            <span aria-hidden="true" className="text-[length:var(--fs-sm)] font-medium">RFC closed</span>
            <FilterChips label="RFC closed" options={TRI} value={criteria.rfcClosed} onChange={(v) => set('rfcClosed', v)} />
          </div>
          <Label className="flex min-h-[var(--tap-target)] cursor-pointer items-center gap-[var(--space-2)] self-end font-normal">
            <Checkbox checked={criteria.myApprovals} onCheckedChange={(v) => set('myApprovals', v === true)} />
            My Approvals
          </Label>
        </div>
        <div className="mt-[var(--space-5)] flex justify-end gap-[var(--space-3)]">
          <Button type="button" variant="outline" onClick={clear}>Clear</Button>
          <Button type="submit">
            <Search aria-hidden="true" />
            Search
          </Button>
        </div>
      </form>

      <section aria-labelledby="approval-results" aria-live="polite" className={`mt-[var(--section-gap)] ${card}`}>
        <h2 id="approval-results" className="mb-[var(--space-3)] text-[length:var(--fs-lg)]">
          รายการ <span className="font-normal text-muted-foreground tabular-nums">(Count: {rows.length})</span>
        </h2>
        {rows.length === 0 ? (
          <EmptyState icon={ClipboardCheck} title="ไม่มีรายการรออนุมัติ" />
        ) : (
          <ul className="flex flex-col gap-[var(--space-3)]">
            {rows.map((row) => (
              <li key={row.approval.id} className="rounded-[var(--radius-md)] border border-border p-[var(--space-4)]">
                <div className="flex flex-col gap-[var(--space-3)] md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-[var(--space-2)]">
                      <Link to={`/calls/${row.call.id}`} className="inline-flex min-h-[var(--tap-target)] items-center font-medium text-primary underline-offset-4 hover:underline tabular-nums">
                        #{row.call.number}
                      </Link>
                      <StatusBadge status={row.call.status} />
                    </p>
                    <p className="mt-[var(--space-1)] break-words">{row.call.summary}</p>
                    <p className="mt-[var(--space-1)] text-[length:var(--fs-sm)] text-muted-foreground">
                      ผู้แจ้ง {lookups.userName(row.call.requestorId)} · ขั้น {row.approval.approvalType}
                    </p>
                  </div>
                  {row.canDecide && (
                    <div className="flex shrink-0 gap-[var(--space-2)]">
                      <Button variant="outline" className="text-destructive" onClick={() => setRejecting(row)}>
                        <X aria-hidden="true" />
                        ปฏิเสธ
                      </Button>
                      <Button onClick={() => approve(row)}>
                        <Check aria-hidden="true" />
                        อนุมัติ
                      </Button>
                    </div>
                  )}
                  {row.waitingForPrevious && (
                    <p className="flex shrink-0 items-center gap-[var(--space-1)] text-[length:var(--fs-sm)] text-muted-foreground">
                      <Hourglass aria-hidden="true" className="size-[var(--icon-sm)]" />
                      รอผลขั้นก่อนหน้า
                    </p>
                  )}
                </div>
                <div className="mt-[var(--space-3)] border-t border-border pt-[var(--space-3)]">
                  <ApprovalSteps approvals={d.approvals.filter((a) => a.callId === row.call.id)} userName={lookups.userName} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <RejectDialog
        open={rejecting !== null}
        callNumber={rejecting?.call.number ?? ''}
        onOpenChange={(o) => !o && setRejecting(null)}
        onConfirm={(reason) => {
          if (!rejecting) return null;
          const r = decide(me, rejecting.approval.id, 'rejected', reason);
          if (!r.ok) return Object.values(r.error.fieldErrors ?? {})[0] ?? r.error.message;
          toast.success(`ปฏิเสธ #${rejecting.call.number} แล้ว`);
          setRejecting(null);
          refresh();
          return null;
        }}
      />
    </>
  );
}
