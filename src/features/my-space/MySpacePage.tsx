import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { FilePlus2, Inbox, Users } from 'lucide-react';
import { dataStore } from '@/data/repositories';
import type { SupportCall, User } from '@/domain/types';
import { useSession } from '@/features/auth/sessionStore';
import { listVisibleCalls } from '@/features/calls/callService';
import { buildCallLookups, type CallLookups } from '@/shared/components/callColumns';
import { CallTable } from '@/shared/components/CallTable';
import { ColumnPicker } from '@/shared/components/ColumnPicker';
import { EmptyState } from '@/shared/components/EmptyState';
import { useColumnPrefs } from '@/shared/components/useColumnPrefs';
import { Button } from '@/shared/ui/button';

const NEW_CALL_PATH = '/calls/new';
const detailHref = (c: SupportCall) => `/calls/${c.id}`;

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

/** C5 My Space — US-009 (calls logged for me), US-010 (calls I opened on behalf of others). */
export function MySpacePage() {
  const { user } = useSession();
  // RequirePermission guarantees a session; the cast only narrows the type
  const me = user as User;
  const [columnIds, setColumnIds] = useColumnPrefs(me.id);
  const calls = listVisibleCalls(me);
  const lookups = buildCallLookups(dataStore.getDataset(), Date.now());
  const forMe = calls.filter((c) => c.requestorId === me.id);
  const onBehalf = calls.filter((c) => c.openedByUserId === me.id && c.requestorId !== me.id);

  const newCallButton = (
    <Button asChild>
      <Link to={NEW_CALL_PATH}>
        <FilePlus2 aria-hidden="true" />
        แจ้งเรื่องใหม่
      </Link>
    </Button>
  );

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-[var(--space-3)]">
        <h1 className="text-[length:var(--fs-xl)] md:text-[length:var(--fs-2xl)]">Welcome Back : {me.name}</h1>
        {newCallButton}
      </div>

      <div className="mt-[var(--section-gap)] flex flex-col gap-[var(--section-gap)]">
        <CallsCard
          id="calls-for-you"
          title="Calls Logged For You"
          calls={forMe}
          lookups={lookups}
          columnIds={columnIds}
          action={<ColumnPicker value={columnIds} onChange={setColumnIds} />}
          empty={<EmptyState icon={Inbox} title="ยังไม่มีเรื่องที่แจ้งให้คุณ" action={newCallButton} />}
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
