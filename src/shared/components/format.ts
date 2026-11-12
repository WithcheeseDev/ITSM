import type { IsoDate } from '@/domain/types';

const dateTime = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Bangkok',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

/** dd/mm/yyyy, HH:mm in Bangkok time (dataset offset +07:00); null → "—" */
export function formatDateTime(iso: IsoDate | null | undefined): string {
  if (!iso) return '—';
  const ms = Date.parse(iso);
  return Number.isNaN(ms) ? '—' : dateTime.format(ms);
}
