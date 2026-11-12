import { useRef, useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { AlertTriangle, ArrowRight, FilePlus2, Send, Sparkles } from 'lucide-react';
import { ROUTES } from '@/app/routes';
import { dataStore } from '@/data/repositories';
import { can } from '@/domain/access';
import type { User } from '@/domain/types';
import { FORBIDDEN_MESSAGE } from '@/app/RequirePermission';
import { Button } from '@/shared/ui/button';
import { Label } from '@/shared/ui/label';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/shared/ui/sheet';
import { Textarea } from '@/shared/ui/textarea';
import { askAssistant, buildHistory, type AiResult } from './assistant';

interface Message {
  id: number;
  text: string;
  result: AiResult | null; // null while waiting
  notice: string | null;
}

const ROUTE_LIST = Object.values(ROUTES);
const routeOf = (path: string) => ROUTE_LIST.find((r) => r.path === path);

/** Page name sent with the text (FR-114): the matched route title, never user data. */
function pageNameOf(pathname: string): string {
  const match = ROUTE_LIST.find((r) => new RegExp(`^${r.path.replace(/:[^/]+/g, '[^/]+')}$`).test(pathname));
  return match?.title ?? 'unknown';
}

/** C15 panel — side sheet on the right (full width on mobile). Results are cards the user acts on. */
export function AiPanel({ me, open, onOpenChange }: { me: User; open: boolean; onOpenChange: (open: boolean) => void }) {
  const [text, setText] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [busy, setBusy] = useState(false);
  const nextId = useRef(1);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const d = dataStore.getDataset();

  const send = async (e: FormEvent) => {
    e.preventDefault();
    const input = text.trim();
    if (!input || busy) return;
    const id = nextId.current++;
    const history = buildHistory(messages, d); // before the new message is appended
    setMessages((m) => [...m, { id, text: input, result: null, notice: null }]);
    setText('');
    setBusy(true);
    try {
      const answer = await askAssistant(input, pageNameOf(pathname), history);
      setMessages((m) => m.map((x) => (x.id === id ? { ...x, result: answer.result, notice: answer.notice } : x)));
    } finally {
      setBusy(false);
    }
  };

  const go = (to: string, state?: unknown) => {
    onOpenChange(false);
    void navigate(to, state ? { state } : undefined);
  };

  const renderResult = (r: AiResult) => {
    if (r.kind === 'draft') {
      const service = d.serviceDefinitions.find((s) => s.id === r.draft.serviceDefinitionId);
      if (!can(me, ROUTES.callNew.permission, d.rolePermissions)) return <p className="text-destructive">{FORBIDDEN_MESSAGE}</p>;
      return (
        <>
          <p>
            บริการที่น่าจะตรง: <span className="font-medium">{service?.name ?? r.draft.serviceDefinitionId}</span>
          </p>
          <p className="text-[length:var(--fs-sm)] text-muted-foreground">ระบบกรอกฟอร์มให้ ตรวจข้อมูลแล้วกด OK เอง</p>
          <Button className="mt-[var(--space-2)] self-start" onClick={() => go(ROUTES.callNew.path, { aiDraft: r.draft })}>
            <FilePlus2 aria-hidden="true" />
            เปิดฟอร์มที่กรอกไว้
          </Button>
        </>
      );
    }
    if (r.kind === 'navigate') {
      const route = routeOf(r.route);
      // US-033: never take the user to a page their role cannot open
      if (!route || !can(me, route.permission ?? '', d.rolePermissions)) return <p className="text-destructive">{FORBIDDEN_MESSAGE}</p>;
      return (
        <Button variant="outline" className="self-start" onClick={() => go(route.path)}>
          <ArrowRight aria-hidden="true" />
          ไปที่หน้า {route.title}
        </Button>
      );
    }
    if (r.kind === 'reply') return <p className="whitespace-pre-line">{r.text}</p>;
    return (
      <p>
        ยังไม่เข้าใจคำขอนี้ ลองบอกอาการ เช่น "เมาส์ใช้ไม่ได้" หรือหน้าที่ต้องการ เช่น "ดูเรื่องที่ค้างอยู่"
      </p>
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-[25rem]">
        {/* right padding clears the 44px close button (top-2 right-2) so its hover fill never covers the text */}
        <SheetHeader className="border-b py-[var(--space-3)] pl-[var(--space-4)] pr-[calc(var(--tap-target)+var(--space-4))]">
          <SheetTitle className="flex items-center gap-[var(--space-2)]">
            <Sparkles aria-hidden="true" className="size-[var(--icon-md)] text-accent" />
            AI Assistant
          </SheetTitle>
          <SheetDescription>บอกปัญหาหรือหน้าที่ต้องการ ระบบจะกรอกฟอร์มหรือพาไปให้ ไม่สร้างเรื่องเอง</SheetDescription>
        </SheetHeader>

        <ol aria-live="polite" className="flex flex-1 flex-col gap-[var(--space-4)] overflow-y-auto px-[var(--space-4)] py-[var(--space-4)]">
          {messages.length === 0 && <li className="text-muted-foreground">ตัวอย่าง: "เมาส์เสีย", "อยากค้นหาเรื่อง", "ดูเรื่องที่ค้างอยู่"</li>}
          {messages.map((m) => (
            <li key={m.id} className="flex flex-col gap-[var(--space-2)]">
              <p className="self-end rounded-[var(--radius-lg)] bg-primary-soft px-[var(--space-3)] py-[var(--space-2)] text-primary-soft-foreground">{m.text}</p>
              {m.notice && (
                <p role="status" className="flex items-start gap-[var(--space-2)] rounded-[var(--radius-md)] bg-warning-soft px-[var(--space-3)] py-[var(--space-2)] text-[length:var(--fs-sm)] text-warning-soft-foreground">
                  <AlertTriangle aria-hidden="true" className="mt-0.5 size-[var(--icon-sm)] shrink-0" />
                  {m.notice}
                </p>
              )}
              <div className="flex flex-col gap-[var(--space-1)] rounded-[var(--radius-lg)] border border-border bg-card px-[var(--space-3)] py-[var(--space-3)]">
                {m.result ? renderResult(m.result) : <p className="text-muted-foreground">กำลังคิด…</p>}
              </div>
            </li>
          ))}
        </ol>

        <form onSubmit={send} className="border-t px-[var(--space-4)] py-[var(--space-3)] pb-[max(var(--space-3),env(safe-area-inset-bottom))]">
          <Label htmlFor="ai-input" className="sr-only">ข้อความถึง AI Assistant</Label>
          <div className="flex items-end gap-[var(--space-2)]">
            <Textarea
              id="ai-input"
              rows={2}
              value={text}
              placeholder="พิมพ์ข้อความ"
              className="min-h-[var(--tap-target)] flex-1 resize-none"
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  e.currentTarget.form?.requestSubmit();
                }
              }}
            />
            <Button type="submit" size="icon" aria-label="ส่ง" disabled={busy || !text.trim()}>
              <Send aria-hidden="true" />
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
