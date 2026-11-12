import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { AlertOctagon, AlertTriangle, ArrowRight, CircleCheck, ClipboardCheck, Hourglass, Inbox, LayoutGrid, ListTodo, Users, type LucideIcon } from 'lucide-react';
import { dataStore } from '@/data/repositories';
import { can } from '@/domain/access';
import { timeLeft, type TimeLeftKind } from '@/domain/sla';
import { isClosed } from '@/domain/stateMachine';
import type { ServiceDefinition, SupportCall, User } from '@/domain/types';
import { useSession } from '@/features/auth/sessionStore';
import { DEFAULT_APPROVAL_CRITERIA, listMyApprovals } from '@/features/approvals/approvalService';
import { listVisibleCalls } from '@/features/calls/callService';
import { buildCallLookups, type CallLookups } from '@/shared/components/callColumns';
import { CallTable } from '@/shared/components/CallTable';
import { ColumnPicker } from '@/shared/components/ColumnPicker';
import { EmptyState } from '@/shared/components/EmptyState';
import { useColumnPrefs } from '@/shared/components/useColumnPrefs';
import { cn } from '@/lib/utils';
import { resolveIcon } from '@/shared/icons';
import { Button } from '@/shared/ui/button';

const CATALOG_PATH = '/catalog';
const detailHref = (c: SupportCall) => `/calls/${c.id}`;

/** Urgency order (US-009 Add-on): overdue → near due → ok (least time first) → awaiting approval → no due date / closed. */
const RANK: Record<TimeLeftKind, number> = { overdue: 0, warning: 1, ok: 2, awaiting: 3, none: 4, closed: 5 };

interface Urgency {
  kind: TimeLeftKind;
  minutes: number | null;
}

function urgencyOf(c: SupportCall, l: CallLookups): Urgency {
  const t = timeLeft({ dueDate: c.dueDate, now: l.now, status: c.status, awaitingApproval: l.isAwaitingApproval(c), slaHours: l.slaHours(c.priority) });
  return { kind: t.kind, minutes: t.minutes };
}

/** Stable sort, so equal-rank rows keep the newest-first order of listVisibleCalls. */
function byUrgency(calls: SupportCall[], urgency: Map<string, Urgency>): SupportCall[] {
  const key = (c: SupportCall) => urgency.get(c.id) as Urgency;
  return [...calls].sort((a, b) => {
    const x = key(a);
    const y = key(b);
    const rank = RANK[x.kind] - RANK[y.kind];
    if (rank !== 0 || x.kind === 'awaiting' || x.kind === 'none' || x.kind === 'closed') return rank;
    return (x.minutes ?? 0) - (y.minutes ?? 0);
  });
}

function CallsCard({
  id, title, calls, lookups, columnIds, action, empty,
}: {
  id: string;
  title: string;
  calls: SupportCall[];
  lookups: CallLookups;
  columnIds: string[];
  action?: ReactNode;
  empty: ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="rounded-[var(--card-radius)] bg-card p-[var(--card-padding)] shadow-[var(--card-shadow)]">
      <div className="mb-[var(--space-3)] flex flex-wrap items-center justify-between gap-[var(--space-3)]">
        <h2 id={id} className="text-[length:var(--fs-lg)]">
          {title} <span className="font-normal text-muted-foreground tabular-nums">(Count: {calls.length})</span>
        </h2>
        {action}
      </div>
      {calls.length === 0 ? empty : <CallTable calls={calls} lookups={lookups} columnIds={columnIds} caption={title} detailHref={detailHref} />}
    </section>
  );
}

function Fact({ icon: Icon, tone, children }: { icon: LucideIcon; tone: string; children: ReactNode }) {
  return (
    <li className="inline-flex min-h-[var(--tap-target)] items-center gap-[var(--space-2)]">
      <Icon aria-hidden="true" className={cn('size-[var(--icon-sm)] shrink-0', tone)} />
      {children}
    </li>
  );
}

function FactLink({ icon: Icon, to, children }: { icon: LucideIcon; to: string; children: ReactNode }) {
  return (
    <li>
      <Link
        to={to}
        className="group inline-flex min-h-[var(--tap-target)] items-center gap-[var(--space-2)] rounded-[var(--radius-md)] font-medium text-primary underline-offset-4 hover:underline"
      >
        <Icon aria-hidden="true" className="size-[var(--icon-sm)] shrink-0" />
        {children}
        <ArrowRight aria-hidden="true" className="size-[var(--icon-sm)] shrink-0 transition-transform duration-[var(--dur-fast)] group-hover:translate-x-0.5" />
      </Link>
    </li>
  );
}

/** One-line summary under the title (US-009 Add-on): what needs attention, plus links to the work a role owns. */
function AttentionSummary({ counts, open, approvals, queue }: {
  counts: Record<'overdue' | 'warning' | 'awaiting', number>;
  open: number;
  approvals: number | null;
  queue: { label: string; count: number } | null;
}) {
  const urgent = counts.overdue + counts.warning + counts.awaiting > 0;
  if (open === 0 && approvals === null && queue === null) return null;
  return (
    <ul aria-label="สรุปเรื่องของคุณ" className="mt-[var(--space-2)] flex flex-wrap items-center gap-x-[var(--space-6)] text-[length:var(--fs-sm)]">
      {counts.overdue > 0 && <Fact icon={AlertOctagon} tone="text-destructive"><span><strong className="font-semibold tabular-nums">{counts.overdue}</strong> เรื่องเลยกำหนด</span></Fact>}
      {counts.warning > 0 && <Fact icon={AlertTriangle} tone="text-warning"><span><strong className="font-semibold tabular-nums">{counts.warning}</strong> เรื่องใกล้ครบกำหนด</span></Fact>}
      {counts.awaiting > 0 && <Fact icon={Hourglass} tone="text-muted-foreground"><span><strong className="font-semibold tabular-nums">{counts.awaiting}</strong> เรื่องรออนุมัติ</span></Fact>}
      {open > 0 && !urgent && <Fact icon={CircleCheck} tone="text-success"><span>ทุกเรื่องที่เปิดอยู่ยังอยู่ในเวลา</span></Fact>}
      {approvals !== null && (
        <FactLink icon={ClipboardCheck} to="/approvals">
          รออนุมัติจากคุณ <span className="tabular-nums">{approvals}</span> เรื่อง
        </FactLink>
      )}
      {queue && (
        <FactLink icon={ListTodo} to="/calls/search">
          {queue.label} <span className="tabular-nums">{queue.count}</span> เรื่อง
        </FactLink>
      )}
    </ul>
  );
}

/** US-009 Add-on 2026-11-13: data-flagged popular services, one click to the pre-filled form (same target as "Request this service"). */
function FeaturedServices({ services, iconOf }: { services: ServiceDefinition[]; iconOf: (s: ServiceDefinition) => LucideIcon }) {
  if (services.length === 0) return null;
  return (
    <section aria-labelledby="featured-services" className="mt-[var(--space-4)]">
      <h2 id="featured-services" className="text-[length:var(--fs-sm)] font-semibold text-muted-foreground">บริการยอดนิยม</h2>
      <ul className="mt-[var(--space-2)] flex flex-wrap gap-[var(--space-2)]">
        {services.map((s) => {
          const Icon = iconOf(s);
          return (
            <li key={s.id}>
              <Button asChild variant="outline" className="bg-card">
                <Link to={`/calls/new?service=${encodeURIComponent(s.id)}`} aria-label={`ขอบริการ: ${s.name}`}>
                  <Icon aria-hidden="true" className="text-primary" />
                  {s.name}
                </Link>
              </Button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** C5 My Space — US-009 (calls logged for me), US-010 (calls I opened on behalf of others). */
export function MySpacePage() {
  const { user } = useSession();
  // RequirePermission guarantees a session; the cast only narrows the type
  const me = user as User;
  const [columnIds, setColumnIds] = useColumnPrefs(me.id);
  const dataset = dataStore.getDataset();
  const calls = listVisibleCalls(me);
  const lookups = buildCallLookups(dataset, Date.now());
  const urgency = new Map(calls.map((c) => [c.id, urgencyOf(c, lookups)]));
  const mine = (c: SupportCall) => c.requestorId === me.id || c.openedByUserId === me.id;
  const forMe = byUrgency(calls.filter((c) => c.requestorId === me.id), urgency);
  const onBehalf = byUrgency(calls.filter((c) => c.openedByUserId === me.id && c.requestorId !== me.id), urgency);

  const own = [...forMe, ...onBehalf];
  const count = (kind: TimeLeftKind) => own.filter((c) => urgency.get(c.id)?.kind === kind).length;
  const counts = { overdue: count('overdue'), warning: count('warning'), awaiting: count('awaiting') };
  const open = own.filter((c) => !isClosed(c.status, dataset.enums.closedStatuses)).length;

  const perms = dataset.rolePermissions;
  const approvals = can(me, 'approval:decide_assigned', perms)
    ? listMyApprovals(me, DEFAULT_APPROVAL_CRITERIA).filter((r) => r.canDecide).length
    : null;
  const others = calls.filter((c) => !mine(c) && !isClosed(c.status, dataset.enums.closedStatuses)).length;
  const queue = can(me, 'call:view_all', perms)
    ? { label: 'เรื่องเปิดทั้งระบบ', count: others }
    : can(me, 'call:view_group', perms)
      ? { label: 'เรื่องเปิดในคิวกลุ่มคุณ', count: others }
      : null;
  const featured = can(me, 'call:create', perms) ? dataset.serviceDefinitions.filter((s) => s.featured) : [];
  const categoryIcon = new Map(dataset.serviceCategories.map((c) => [c.id, resolveIcon(c.icon).icon]));
  const iconOf = (s: ServiceDefinition) => categoryIcon.get(s.categoryId) ?? resolveIcon(null).icon;

  // New calls start from a service only (design-system §9): the empty state points to the catalog, not a blank form
  const catalogButton = can(me, 'catalog:view', perms) ? (
    <Button asChild>
      <Link to={CATALOG_PATH}>
        <LayoutGrid aria-hidden="true" />
        ไปที่ Service Catalog
      </Link>
    </Button>
  ) : undefined;

  return (
    <>
      <h1 className="text-[length:var(--fs-xl)] md:text-[length:var(--fs-2xl)]">Welcome Back : {me.name}</h1>
      <AttentionSummary counts={counts} open={open} approvals={approvals} queue={queue} />
      <FeaturedServices services={featured} iconOf={iconOf} />

      <div className="mt-[var(--section-gap)] flex flex-col gap-[var(--section-gap)]">
        <CallsCard
          id="calls-for-you"
          title="Calls Logged For You"
          calls={forMe}
          lookups={lookups}
          columnIds={columnIds}
          // the picker only changes the ≥ md table; the < md card list has fixed fields
          action={<div className="hidden md:block"><ColumnPicker value={columnIds} onChange={setColumnIds} /></div>}
          empty={<EmptyState icon={Inbox} title="ยังไม่มีเรื่องที่แจ้งให้คุณ" action={catalogButton} />}
        />
        <CallsCard
          id="calls-on-behalf"
          title="Calls You Opened On Behalf"
          calls={onBehalf}
          lookups={lookups}
          columnIds={columnIds}
          empty={<EmptyState icon={Users} title="ยังไม่มีเรื่องที่คุณแจ้งแทนผู้อื่น" />}
        />
      </div>
    </>
  );
}
