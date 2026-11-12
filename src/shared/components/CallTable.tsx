import { Link, useNavigate } from 'react-router';
import type { SupportCall } from '@/domain/types';
import { cn } from '@/lib/utils';
import { CALL_COLUMNS, type CallLookups } from './callColumns';
import { StatusBadge } from './StatusBadge';
import { TimeLeft } from './TimeLeft';

interface Props {
  calls: readonly SupportCall[];
  lookups: CallLookups;
  /** visible column ids (from useColumnPrefs) */
  columnIds: readonly string[];
  /** accessible table name, e.g. "Calls Logged For You" */
  caption: string;
  detailHref: (call: SupportCall) => string;
}

/**
 * Support Call list (C12). ≥ md: table that scrolls horizontally inside its card; < md: card list
 * (Number, Summary, Status, Time Left — design-system §8). Keyboard: the Number link opens Detail (Enter).
 */
export function CallTable({ calls, lookups, columnIds, caption, detailHref }: Props) {
  const navigate = useNavigate();
  const columns = CALL_COLUMNS.filter((c) => columnIds.includes(c.id));

  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-collapse text-[length:var(--fs-sm)]">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr className="bg-[var(--table-header-bg)] text-left">
              {columns.map((c) => (
                <th key={c.id} scope="col" className="h-[var(--table-row-height)] px-[var(--space-3)] font-semibold whitespace-nowrap text-muted-foreground">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {calls.map((call) => (
              <tr
                key={call.id}
                onClick={(e) => {
                  // the Number link handles its own click; the rest of the row is a mouse shortcut
                  if (!(e.target as HTMLElement).closest('a')) navigate(detailHref(call));
                }}
                className="h-[var(--table-row-height)] cursor-pointer border-t transition-colors duration-[var(--dur-fast)] hover:bg-[var(--table-row-hover)] focus-within:bg-[var(--table-row-hover)]"
              >
                {columns.map((c) => (
                  <td key={c.id} className={cn('px-[var(--space-3)] py-[var(--space-2)] align-middle', c.numeric && 'tabular-nums whitespace-nowrap', c.id === 'summary' && 'min-w-[14rem] max-w-[28rem]')}>
                    {c.id === 'number' ? (
                      <Link to={detailHref(call)} className="font-semibold text-primary underline-offset-4 hover:underline" aria-label={`เปิดเรื่อง ${call.number}: ${call.summary}`}>
                        {call.number}
                      </Link>
                    ) : (
                      c.render(call, lookups)
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="flex flex-col md:hidden" aria-label={caption}>
        {calls.map((call) => (
          <li key={call.id} className="border-t first:border-t-0">
            <Link to={detailHref(call)} className="flex flex-col gap-[var(--space-2)] px-[var(--space-1)] py-[var(--space-3)] hover:bg-[var(--table-row-hover)]">
              <span className="flex items-center justify-between gap-[var(--space-2)]">
                <span className="font-semibold text-primary tabular-nums">{call.number}</span>
                <StatusBadge status={call.status} />
              </span>
              <span className="text-foreground">{call.summary}</span>
              <TimeLeft
                dueDate={call.dueDate}
                now={lookups.now}
                status={call.status}
                awaitingApproval={lookups.isAwaitingApproval(call)}
                slaHours={lookups.slaHours(call.priority)}
                className="self-start"
              />
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
