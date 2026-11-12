import { Paperclip } from 'lucide-react';
import type { CallHistory, HistoryAction } from '@/domain/types';
import { formatDateTime } from '@/shared/components/format';
import { StatusBadge } from '@/shared/components/StatusBadge';

/** Thai label per history action (US-024). */
export const ACTION_LABELS: Record<HistoryAction, string> = {
  created: 'สร้างเรื่อง',
  assigned: 'มอบหมายงาน',
  status_changed: 'เปลี่ยนสถานะ',
  commented: 'แสดงความเห็น',
  approved: 'อนุมัติ',
  rejected: 'ปฏิเสธ',
  cancelled: 'ยกเลิกเรื่อง',
  reopened: 'เปิดเรื่องใหม่',
  auto_closed: 'ปิดอัตโนมัติ',
};

/** US-024 — read-only history, oldest first. Comments are plain text (never rendered as HTML). */
export function Timeline({ entries, userName }: { entries: readonly CallHistory[]; userName: (id: string) => string }) {
  const sorted = [...entries].sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
  if (sorted.length === 0) return <p className="text-muted-foreground">ยังไม่มีประวัติ</p>;

  return (
    <ol className="relative flex flex-col gap-[var(--space-5)] border-l border-border pl-[var(--space-5)]">
      {sorted.map((h) => (
        <li key={h.id} className="relative">
          <span aria-hidden="true" className="absolute top-[0.55rem] -left-[calc(var(--space-5)+0.3125rem)] size-2.5 rounded-full bg-primary" />
          <div className="flex flex-wrap items-center gap-x-[var(--space-2)] gap-y-[var(--space-1)]">
            <span className="font-medium">{ACTION_LABELS[h.action]}</span>
            <span className="text-muted-foreground">โดย {h.byUserId === 'system' ? 'ระบบ' : userName(h.byUserId)}</span>
            <time dateTime={h.at} className="text-[length:var(--fs-xs)] text-muted-foreground tabular-nums">
              {formatDateTime(h.at)}
            </time>
          </div>
          {h.toStatus && h.fromStatus !== h.toStatus && (
            <p className="mt-[var(--space-1)] flex flex-wrap items-center gap-[var(--space-2)] text-[length:var(--fs-sm)]">
              {h.fromStatus && (
                <>
                  <StatusBadge status={h.fromStatus} />
                  <span aria-label="เป็น">→</span>
                </>
              )}
              <StatusBadge status={h.toStatus} />
            </p>
          )}
          {h.comment && <p className="mt-[var(--space-1)] whitespace-pre-wrap">{h.comment}</p>}
          {h.attachments && h.attachments.length > 0 && (
            <ul className="mt-[var(--space-1)] flex flex-wrap gap-[var(--space-2)] text-[length:var(--fs-sm)] text-muted-foreground">
              {h.attachments.map((a, i) => (
                <li key={`${a.name}-${i}`} className="inline-flex items-center gap-[var(--space-1)]">
                  <Paperclip aria-hidden="true" className="size-[var(--icon-sm)]" />
                  {a.name}
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ol>
  );
}
