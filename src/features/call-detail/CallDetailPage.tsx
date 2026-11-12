import { useReducer, type ReactNode } from 'react';
import { Link, useParams } from 'react-router';
import { Paperclip, SearchX } from 'lucide-react';
import { dataStore } from '@/data/repositories';
import { availableActions } from '@/domain/access';
import type { User } from '@/domain/types';
import { useSession } from '@/features/auth/sessionStore';
import { RICH_TEXT_CLASS } from '@/features/call-form/RichTextEditor';
import { getCall } from '@/features/calls/callService';
import { buildCallLookups } from '@/shared/components/callColumns';
import { EmptyState } from '@/shared/components/EmptyState';
import { formatDateTime } from '@/shared/components/format';
import { PriorityBadge } from '@/shared/components/PriorityBadge';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { TimeLeft } from '@/shared/components/TimeLeft';
import { sanitizeHtml } from '@/shared/sanitize';
import { Button } from '@/shared/ui/button';
import { ActionBar } from './ActionBar';
import { ActivityTable } from './ActivityTable';
import { ApprovalSteps } from './ApprovalSteps';
import { CommentBox } from './CommentBox';
import { Timeline } from './Timeline';

const card = 'rounded-[var(--card-radius)] bg-card p-[var(--card-padding)] shadow-[var(--card-shadow)]';

function Section({ id, title, children, className = '' }: { id: string; title: string; children: ReactNode; className?: string }) {
  return (
    <section aria-labelledby={id} className={`${card} ${className}`}>
      <h2 id={id} className="mb-[var(--space-4)] text-[length:var(--fs-lg)]">
        {title}
      </h2>
      {children}
    </section>
  );
}

/** Read-only label/value grid; empty values show "—". */
function Fields({ rows, columns = 2 }: { rows: [string, ReactNode][]; columns?: 1 | 2 }) {
  return (
    <dl className={`grid grid-cols-1 gap-x-[var(--space-6)] gap-y-[var(--space-3)] ${columns === 2 ? 'sm:grid-cols-2' : ''}`}>
      {rows.map(([label, value]) => (
        <div key={label} className="min-w-0">
          <dt className="text-[length:var(--fs-sm)] text-muted-foreground">{label}</dt>
          <dd className="mt-[var(--space-1)] break-words">{value === null || value === undefined || value === '' ? '—' : value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** C9 Call Detail — US-023–029: read view + ActionBar / CommentBox limited to `availableActions`. */
export function CallDetailPage() {
  const { callId = '' } = useParams();
  const { user } = useSession();
  // services write to the store synchronously; bump to re-read the call after an action
  const [, refresh] = useReducer((n: number) => n + 1, 0);
  const result = getCall(user, callId);

  if (!result.ok) {
    return (
      <section className={card}>
        <EmptyState
          icon={SearchX}
          title="ไม่พบรายการหรือไม่มีสิทธิ์"
          action={
            <Button asChild variant="outline">
              <Link to="/my-space">กลับไป My Space</Link>
            </Button>
          }
        />
      </section>
    );
  }

  const call = result.data;
  const d = dataStore.getDataset();
  const l = buildCallLookups(d, Date.now());
  const nameOf = (list: readonly { id: string; name: string }[], id: string | null) => (id ? list.find((x) => x.id === id)?.name : null);
  const approvals = d.approvals.filter((a) => a.callId === call.id);
  const activities = d.activities.filter((a) => a.callId === call.id);
  const history = d.callHistory.filter((h) => h.callId === call.id);
  const category = [call.parentCategory, call.category, call.subCategory].filter(Boolean).join(' > ');
  const actions = availableActions(user, call, {
    approvals: d.approvals,
    rolePermissions: d.rolePermissions,
    now: l.now,
    history: d.callHistory,
    closedStatuses: d.enums.closedStatuses,
  });
  // blueprint: side column ≥ lg, but right after Details on mobile — rendered in both places, one hidden per breakpoint
  const approvalSection = (id: string, className: string) =>
    approvals.length > 0 && (
      <Section id={id} title="ขั้นอนุมัติ" className={className}>
        <ApprovalSteps approvals={approvals} userName={l.userName} />
      </Section>
    );

  return (
    <>
      <header className={`${card} flex flex-col gap-[var(--space-4)] lg:flex-row lg:items-start lg:justify-between`}>
        <div className="min-w-0">
          <p className="text-[length:var(--fs-sm)] text-muted-foreground tabular-nums">Support Call #{call.number}</p>
          <h1 className="mt-[var(--space-1)] text-[length:var(--fs-xl)] break-words md:text-[length:var(--fs-2xl)]">{call.summary}</h1>
          <dl className="mt-[var(--space-3)] flex flex-wrap items-center gap-x-[var(--space-5)] gap-y-[var(--space-2)]">
            <div className="flex items-center gap-[var(--space-2)]">
              <dt className="sr-only">Status</dt>
              <dd>
                <StatusBadge status={call.status} />
              </dd>
            </div>
            <div className="flex items-center gap-[var(--space-2)]">
              <dt className="sr-only">Priority</dt>
              <dd>
                <PriorityBadge priority={call.priority} />
              </dd>
            </div>
            <div className="flex items-center gap-[var(--space-2)]">
              <dt className="text-[length:var(--fs-sm)] text-muted-foreground">Time Left</dt>
              <dd>
                <TimeLeft
                  dueDate={call.dueDate}
                  now={l.now}
                  status={call.status}
                  awaitingApproval={l.isAwaitingApproval(call)}
                  slaHours={l.slaHours(call.priority)}
                />
              </dd>
            </div>
          </dl>
        </div>
        {/* key: reset dialog state when the call changes */}
        <ActionBar key={`${call.id}-${call.status}`} me={user as User} call={call} actions={actions} dataset={d} onChanged={refresh} />
      </header>

      <div className="mt-[var(--section-gap)] grid grid-cols-1 gap-[var(--section-gap)] lg:grid-cols-3">
        <div className="flex min-w-0 flex-col gap-[var(--section-gap)] lg:col-span-2">
          <Section id="sec-details" title="Details">
            <Fields
              rows={[
                ['Call Type', call.callType],
                ['Classification', call.classification],
                ['Category', category],
                ['Template', call.templateId ? l.templateName(call.templateId) : null],
                ['Urgency', call.urgency],
                ['Impact', call.impact],
                ['Service', nameOf(d.services, call.serviceId)],
                ['Product', nameOf(d.products, call.productId)],
                ['Item', nameOf(d.items, call.itemId)],
                ['Version', call.version],
                ['Serial number', call.serialNumber],
                ['Your reference no.', call.customerReference],
                ['Open Date', formatDateTime(call.openDate)],
                ['Due Date', call.dueDate ? formatDateTime(call.dueDate) : null],
                ['Close Date', call.closeDate ? formatDateTime(call.closeDate) : null],
                ['Closure Category', call.closureCategory],
              ]}
            />
            {call.attachments.length > 0 && (
              <div className="mt-[var(--space-4)]">
                <h3 className="text-[length:var(--fs-sm)] font-normal text-muted-foreground">Attachments</h3>
                <ul className="mt-[var(--space-1)] flex flex-col gap-[var(--space-1)]">
                  {call.attachments.map((a, i) => (
                    <li key={`${a.name}-${i}`} className="flex items-center gap-[var(--space-2)]">
                      <Paperclip aria-hidden="true" className="size-[var(--icon-sm)] shrink-0 text-muted-foreground" />
                      <span className="min-w-0 truncate">{a.name}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Section>

          {approvalSection('sec-approvals-mobile', 'lg:hidden')}

          <Section id="sec-notes" title="Notes">
            {/* C13: notes are sanitized at render as well as at save */}
            <div className={`break-words ${RICH_TEXT_CLASS}`} dangerouslySetInnerHTML={{ __html: sanitizeHtml(call.notes) }} />
          </Section>

          <Section id="sec-timeline" title="Timeline">
            <Timeline entries={history} userName={l.userName} />
            {actions.includes('comment') && <CommentBox me={user as User} callId={call.id} onChanged={refresh} />}
          </Section>
        </div>

        <div className="flex min-w-0 flex-col gap-[var(--section-gap)]">
          <Section id="sec-contact" title="Contact Information">
            <Fields
              columns={1}
              rows={[
                ["Requestor's Name", l.userName(call.requestorId)],
                ...(call.openedByUserId !== call.requestorId ? [['แจ้งแทนโดย', l.userName(call.openedByUserId)] as [string, ReactNode]] : []),
                ['Phone number', call.phone],
                ['E-mail', call.email],
              ]}
            />
          </Section>

          <Section id="sec-queue" title="คิวและผู้รับผิดชอบ">
            <Fields
              columns={1}
              rows={[
                ['Queue', l.queueName(call.queueId)],
                ['Group', l.groupName(call.groupId)],
                ['Assigned To', call.assignedToId ? l.userName(call.assignedToId) : 'ยังไม่มอบหมาย'],
              ]}
            />
          </Section>

          {approvalSection('sec-approvals', 'hidden lg:block')}

          <Section id="sec-activities" title="Activities">
            <ActivityTable activities={activities} userName={l.userName} />
          </Section>
        </div>
      </div>
    </>
  );
}
