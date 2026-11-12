import { useRef, useState } from 'react';
import { CircleAlert, Paperclip, Send, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Attachment, User } from '@/domain/types';
import { addComment, MAX_ATTACHMENT_BYTES, MAX_ATTACHMENTS, MESSAGES } from '@/features/calls/callService';
import { Button } from '@/shared/ui/button';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';

/** US-025 — comment + attachment metadata; rendered only when the actor may comment. */
export function CommentBox({ me, callId, onChanged }: { me: User; callId: string; onChanged: () => void }) {
  const [text, setText] = useState('');
  const [files, setFiles] = useState<Attachment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);

  const add = (list: FileList | null) => {
    if (!list) return;
    const next = [...files];
    let rejected: string | null = null;
    for (const f of Array.from(list)) {
      if (f.size > MAX_ATTACHMENT_BYTES) rejected = MESSAGES.attachmentSize;
      else if (next.length >= MAX_ATTACHMENTS) rejected = MESSAGES.attachmentCount;
      else next.push({ name: f.name, size: f.size, type: f.type || 'application/octet-stream' });
    }
    setFiles(next);
    setError(rejected);
  };

  const submit = () => {
    const r = addComment(me, callId, text, files);
    if (!r.ok) {
      setError(Object.values(r.error.fieldErrors ?? {})[0] ?? r.error.message);
      textRef.current?.focus();
      return;
    }
    setText('');
    setFiles([]);
    setError(null);
    toast.success('ส่งความเห็นแล้ว');
    onChanged();
  };

  return (
    <div className="mt-[var(--space-5)] border-t border-border pt-[var(--space-4)]">
      <Label htmlFor="comment">เพิ่มความเห็น</Label>
      <Textarea
        ref={textRef}
        id="comment"
        value={text}
        rows={3}
        className="mt-[var(--space-2)]"
        aria-invalid={Boolean(error)}
        aria-describedby={error ? 'comment-error' : undefined}
        onChange={(e) => {
          setText(e.target.value);
          if (error) setError(null);
        }}
      />
      {error && (
        <p id="comment-error" className="mt-[var(--space-1)] flex items-center gap-[var(--space-1)] text-[length:var(--fs-sm)] text-destructive">
          <CircleAlert aria-hidden="true" className="size-[var(--icon-sm)] shrink-0" />
          {error}
        </p>
      )}

      {files.length > 0 && (
        <ul aria-label="ไฟล์แนบของความเห็น" className="mt-[var(--space-2)] flex flex-col gap-[var(--space-1)]">
          {files.map((f, i) => (
            <li key={`${f.name}-${i}`} className="flex items-center gap-[var(--space-2)] rounded-[var(--radius-md)] bg-surface-sunken pl-[var(--space-3)]">
              <Paperclip aria-hidden="true" className="size-[var(--icon-sm)] shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1 truncate text-[length:var(--fs-sm)]">{f.name}</span>
              <Button type="button" variant="ghost" size="icon" aria-label={`ลบไฟล์ ${f.name}`} onClick={() => setFiles(files.filter((_, j) => j !== i))}>
                <Trash2 aria-hidden="true" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-[var(--space-3)] flex flex-wrap justify-end gap-[var(--space-2)]">
        <Button type="button" variant="outline" onClick={() => inputRef.current?.click()}>
          <Paperclip aria-hidden="true" />
          แนบไฟล์
        </Button>
        <input
          ref={inputRef}
          type="file"
          multiple
          hidden
          aria-label="เลือกไฟล์แนบของความเห็น"
          onChange={(e) => {
            add(e.target.files);
            e.target.value = '';
          }}
        />
        <Button type="button" onClick={submit}>
          <Send aria-hidden="true" />
          ส่งความเห็น
        </Button>
      </div>
    </div>
  );
}
