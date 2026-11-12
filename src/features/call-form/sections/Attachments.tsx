import { useRef, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { CircleAlert, FileText, Paperclip, Trash2 } from 'lucide-react';
import { MAX_ATTACHMENT_BYTES, MAX_ATTACHMENTS, MESSAGES } from '@/features/calls/callService';
import { Button } from '@/shared/ui/button';
import type { CallFormValues } from '../callFormSchema';
import { FormSection } from '../Field';

const formatSize = (bytes: number) =>
  bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

/** US-019 — keeps name / size / type only (D1-13). Rejects files > 10MB and more than 5 files. */
export function Attachments() {
  const { watch, setValue } = useFormContext<CallFormValues>();
  const attachments = watch('attachments');
  const inputRef = useRef<HTMLInputElement>(null);
  const [rejected, setRejected] = useState<string | null>(null);

  const add = (files: FileList | null) => {
    if (!files) return;
    const next = [...attachments];
    let error: string | null = null;
    for (const f of Array.from(files)) {
      if (f.size > MAX_ATTACHMENT_BYTES) error = MESSAGES.attachmentSize;
      else if (next.length >= MAX_ATTACHMENTS) error = MESSAGES.attachmentCount;
      else next.push({ name: f.name, size: f.size, type: f.type || 'application/octet-stream' });
    }
    setRejected(error);
    setValue('attachments', next, { shouldDirty: true });
  };

  const remove = (index: number) => {
    setRejected(null);
    setValue('attachments', attachments.filter((_, i) => i !== index), { shouldDirty: true });
  };

  return (
    <FormSection id="sec-attachments" title="Attachments">
      <div className="flex flex-wrap items-center justify-between gap-[var(--space-3)]">
        <p id="attachments-hint" className="text-[length:var(--fs-sm)] text-muted-foreground">
          สูงสุด {MAX_ATTACHMENTS} ไฟล์ ไฟล์ละไม่เกิน 10 MB · เก็บเฉพาะชื่อ ขนาด และชนิดไฟล์
        </p>
        <Button type="button" variant="outline" aria-describedby="attachments-hint" onClick={() => inputRef.current?.click()}>
          <Paperclip aria-hidden="true" />
          Add
        </Button>
        <input
          ref={inputRef}
          type="file"
          multiple
          hidden
          aria-label="เลือกไฟล์แนบ"
          onChange={(e) => {
            add(e.target.files);
            e.target.value = ''; // allow picking the same file again after removing it
          }}
        />
      </div>

      {rejected && (
        <p role="alert" className="mt-[var(--space-2)] flex items-center gap-[var(--space-1)] text-[length:var(--fs-sm)] text-destructive">
          <CircleAlert aria-hidden="true" className="size-[var(--icon-sm)] shrink-0" />
          {rejected}
        </p>
      )}

      {attachments.length > 0 && (
        <ul aria-label="ไฟล์แนบ" className="mt-[var(--space-3)] flex flex-col gap-[var(--space-2)]">
          {attachments.map((a, i) => (
            <li
              key={`${a.name}-${i}`}
              className="flex items-center gap-[var(--space-3)] rounded-[var(--radius-md)] bg-surface-sunken py-[var(--space-1)] pr-[var(--space-1)] pl-[var(--space-3)]"
            >
              <FileText aria-hidden="true" className="size-[var(--icon-sm)] shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1 truncate">{a.name}</span>
              <span className="shrink-0 text-[length:var(--fs-sm)] text-muted-foreground tabular-nums">{formatSize(a.size)}</span>
              <Button type="button" variant="ghost" size="icon" aria-label={`ลบไฟล์ ${a.name}`} onClick={() => remove(i)}>
                <Trash2 aria-hidden="true" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </FormSection>
  );
}
