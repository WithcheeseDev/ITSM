import { useState } from 'react';
import { CircleAlert, CircleX } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';

/** US-031 — rejection requires a reason; the service decides whether it is valid and returns the message. */
export function RejectDialog({
  open, callNumber, onOpenChange, onConfirm,
}: {
  open: boolean;
  callNumber: string;
  onOpenChange: (open: boolean) => void;
  /** returns an error message to show, or null when saved */
  onConfirm: (reason: string) => string | null;
}) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const close = (o: boolean) => {
    if (!o) {
      setReason('');
      setError(null);
    }
    onOpenChange(o);
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>ปฏิเสธคำขอ #{callNumber}</DialogTitle>
          <DialogDescription>เหตุผลจะแสดงให้ผู้แจ้งเห็นใน timeline ของเรื่อง</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-[var(--space-2)]">
          <Label htmlFor="reject-reason">เหตุผล</Label>
          <Textarea
            id="reject-reason"
            rows={4}
            value={reason}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? 'reject-reason-error' : undefined}
            onChange={(e) => {
              setReason(e.target.value);
              if (error) setError(null);
            }}
          />
          {error && (
            <p id="reject-reason-error" className="flex items-center gap-[var(--space-1)] text-[length:var(--fs-sm)] text-destructive">
              <CircleAlert aria-hidden="true" className="size-[var(--icon-sm)] shrink-0" />
              {error}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => close(false)}>
            ยกเลิก
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              const message = onConfirm(reason);
              if (message) {
                setError(message);
                document.getElementById('reject-reason')?.focus();
              } else {
                close(false);
              }
            }}
          >
            <CircleX aria-hidden="true" />
            ปฏิเสธ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
