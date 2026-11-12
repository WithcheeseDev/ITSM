import { useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { ChevronDown, Search, SearchX } from 'lucide-react';
import { dataStore } from '@/data/repositories';
import { CALL_TYPES, STATUS_BY_CALL_TYPE, ALL_STATUSES, type Status, type User } from '@/domain/types';
import { useSession } from '@/features/auth/sessionStore';
import { listVisibleCalls } from '@/features/calls/callService';
import { cn } from '@/lib/utils';
import { buildCallLookups } from '@/shared/components/callColumns';
import { CallTable } from '@/shared/components/CallTable';
import { ColumnPicker } from '@/shared/components/ColumnPicker';
import { EmptyState } from '@/shared/components/EmptyState';
import { FilterChips, type ChipOption } from '@/shared/components/FilterChips';
import { useColumnPrefs } from '@/shared/components/useColumnPrefs';
import { htmlToText } from '@/shared/sanitize';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { toHaystack, type FullTextMode } from './fullText';
import { DEFAULT_CRITERIA, filterCalls, validateCriteria, type OpenClosed, type SearchCriteria } from './searchCriteria';

const card = 'rounded-[var(--card-radius)] bg-card p-[var(--card-padding)] shadow-[var(--card-shadow)]';
const ANY = '__any'; // Radix Select cannot use '' as an item value

const CALL_TYPE_OPTIONS: ChipOption<SearchCriteria['callType']>[] = [{ value: 'all', label: 'All' }, ...CALL_TYPES.map((t) => ({ value: t, label: t }))];
const OPEN_CLOSED_OPTIONS: ChipOption<OpenClosed>[] = [
  { value: 'all', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'closed', label: 'Closed' },
];
const MODE_OPTIONS: ChipOption<FullTextMode>[] = [
  { value: 'natural', label: 'Natural Language' },
  { value: 'boolean', label: 'Boolean' },
];

function TextField({ id, label, value, onChange, type = 'text', error, hint }: {
  id: string; label: string; value: string; onChange: (v: string) => void; type?: string; error?: string; hint?: string;
}) {
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') || undefined;
  return (
    <div className="flex flex-col gap-[var(--space-2)]">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} aria-invalid={Boolean(error)} aria-describedby={describedBy} />
      {hint && <p id={`${id}-hint`} className="text-[length:var(--fs-sm)] text-muted-foreground">{hint}</p>}
      {error && <p id={`${id}-error`} className="text-[length:var(--fs-sm)] text-destructive">{error}</p>}
    </div>
  );
}

function Group({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-[var(--space-2)]">
      <span aria-hidden="true" className="text-[length:var(--fs-sm)] font-medium">{label}</span>
      {children}
    </div>
  );
}

/** C9 Search Support Call — US-020, US-021, US-022. Results are limited to calls the user may see (US-004). */
export function SearchPage() {
  const { user } = useSession();
  // RequirePermission guarantees a session; the cast only narrows the type
  const me = user as User;
  const d = dataStore.getDataset();
  const [criteria, setCriteria] = useState<SearchCriteria>(DEFAULT_CRITERIA);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [applied, setApplied] = useState<SearchCriteria | null>(null);
  const [advanced, setAdvanced] = useState(false);
  const [columnIds, setColumnIds] = useColumnPrefs(me.id);

  const lookups = buildCallLookups(d, Date.now());
  const visible = listVisibleCalls(me);
  // notes → text once per dataset, not per search (NFR-002: 1,000 calls ≤ 500ms)
  const haystacks = useMemo(() => new Map(d.supportCalls.map((c) => [c.id, toHaystack(c.summary, htmlToText(c.notes))])), [d.supportCalls]);
  const results = applied
    ? filterCalls(visible, applied, { closedStatuses: d.enums.closedStatuses, userName: lookups.userName, haystack: (c) => haystacks.get(c.id) ?? '' })
    : null;

  const set = <K extends keyof SearchCriteria>(key: K, value: SearchCriteria[K]) => setCriteria((c) => ({ ...c, [key]: value }));
  const statuses: readonly Status[] = criteria.callType === 'all' ? ALL_STATUSES : STATUS_BY_CALL_TYPE[criteria.callType];

  const search = (e: FormEvent) => {
    e.preventDefault();
    const found = validateCriteria(criteria);
    setErrors(found);
    if (Object.keys(found).length === 0) setApplied(criteria);
    else document.getElementById(Object.keys(found)[0] ?? '')?.focus();
  };
  const clear = () => {
    setCriteria(DEFAULT_CRITERIA);
    setErrors({});
    setApplied(null);
  };

  return (
    <>
      <h1 className="text-[length:var(--fs-xl)] md:text-[length:var(--fs-2xl)]">ค้นหาเรื่อง</h1>

      <form noValidate onSubmit={search} aria-labelledby="criteria-title" className={`mt-[var(--section-gap)] ${card}`}>
        <h2 id="criteria-title" className="text-[length:var(--fs-lg)]">Default Criteria</h2>
        <div className="mt-[var(--space-4)] grid grid-cols-1 gap-[var(--space-4)] sm:grid-cols-2 lg:grid-cols-3">
          <TextField id="number" label="Number" value={criteria.number} onChange={(v) => set('number', v)} />
          <div className="flex flex-col gap-[var(--space-2)]">
            <Label htmlFor="status">Status</Label>
            <Select value={criteria.status || ANY} onValueChange={(v) => set('status', v === ANY ? '' : (v as Status))}>
              <SelectTrigger id="status" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY}>ทุกสถานะ</SelectItem>
                {statuses.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <TextField id="summary" label="Summary" value={criteria.summary} onChange={(v) => set('summary', v)} />
          <TextField id="openFrom" label="Open date from" type="date" value={criteria.openFrom} onChange={(v) => set('openFrom', v)} />
          <TextField id="openTo" label="Open date to" type="date" value={criteria.openTo} onChange={(v) => set('openTo', v)} error={errors.openTo} />
          <TextField id="subjectName" label="Subject Name" value={criteria.subjectName} onChange={(v) => set('subjectName', v)} hint="ชื่อผู้แจ้ง" />
        </div>

        <div className="mt-[var(--space-5)] flex flex-col gap-[var(--space-4)]">
          <Group label="Call Type">
            <FilterChips
              label="Call Type"
              options={CALL_TYPE_OPTIONS}
              value={criteria.callType}
              onChange={(v) => setCriteria((c) => ({
                ...c,
                callType: v,
                // a status that does not exist for the new call type would match nothing
                status: c.status && v !== 'all' && !(STATUS_BY_CALL_TYPE[v] as readonly string[]).includes(c.status) ? '' : c.status,
              }))}
            />
          </Group>
          <Group label="Open / Closed">
            <FilterChips label="Open / Closed" options={OPEN_CLOSED_OPTIONS} value={criteria.openClosed} onChange={(v) => set('openClosed', v)} />
          </Group>
        </div>

        <div className="mt-[var(--space-5)] border-t border-border pt-[var(--space-3)]">
          <Button type="button" variant="ghost" aria-expanded={advanced} aria-controls="advanced-criteria" onClick={() => setAdvanced((a) => !a)} className="-ml-[var(--space-3)]">
            <ChevronDown aria-hidden="true" className={cn('transition-transform duration-[var(--dur-fast)]', advanced && 'rotate-180')} />
            Advance Criteria
          </Button>
          <div id="advanced-criteria" hidden={!advanced} className="mt-[var(--space-3)]">
            <div className="grid grid-cols-1 gap-[var(--space-4)] sm:grid-cols-2 lg:grid-cols-3">
              <TextField id="itsrReference" label="ITSR reference" value={criteria.itsrReference} onChange={(v) => set('itsrReference', v)} />
              <div className="flex flex-col gap-[var(--space-2)]">
                <Label htmlFor="templateId">Template Used</Label>
                <Select value={criteria.templateId || ANY} onValueChange={(v) => set('templateId', v === ANY ? '' : v)}>
                  <SelectTrigger id="templateId" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ANY}>ทุก Template</SelectItem>
                    {d.templates.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <TextField
                id="fullText"
                label="Full-Text"
                value={criteria.fullText}
                onChange={(v) => set('fullText', v)}
                hint={criteria.fullTextMode === 'boolean' ? 'ใช้ AND, OR, NOT และ "วลี" เช่น mouse AND NOT keyboard' : 'ค้นทุกคำใน Summary และ Notes'}
              />
            </div>
            <div className="mt-[var(--space-4)]">
              <Group label="ประเภท Full-Text">
                <FilterChips label="ประเภท Full-Text" options={MODE_OPTIONS} value={criteria.fullTextMode} onChange={(v) => set('fullTextMode', v)} />
              </Group>
            </div>
          </div>
        </div>

        <div className="mt-[var(--space-5)] flex justify-end gap-[var(--space-3)]">
          <Button type="button" variant="outline" onClick={clear}>Clear</Button>
          <Button type="submit">
            <Search aria-hidden="true" />
            Search
          </Button>
        </div>
      </form>

      {results && (
        <section aria-labelledby="results-title" aria-live="polite" className={`mt-[var(--section-gap)] ${card}`}>
          <div className="mb-[var(--space-3)] flex flex-wrap items-center justify-between gap-[var(--space-3)]">
            <h2 id="results-title" className="text-[length:var(--fs-lg)]">
              ผลการค้นหา <span className="font-normal text-muted-foreground tabular-nums">(Count: {results.length})</span>
            </h2>
            <ColumnPicker value={columnIds} onChange={setColumnIds} />
          </div>
          {results.length === 0 ? (
            <EmptyState icon={SearchX} title="ไม่พบรายการ" action={<Button variant="outline" onClick={clear}>Clear</Button>} />
          ) : (
            <CallTable calls={results} lookups={lookups} columnIds={columnIds} caption="ผลการค้นหา" detailHref={(c) => `/calls/${c.id}`} />
          )}
        </section>
      )}
    </>
  );
}
