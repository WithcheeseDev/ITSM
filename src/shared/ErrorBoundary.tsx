import { Component, type ErrorInfo, type ReactNode } from 'react';
import { CircleAlert } from 'lucide-react';
import { logger } from './logger';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/** C11 — catches unexpected render errors; shows a Thai message and a way back to My Space. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    logger.error('errorBoundary.caught', { error, componentStack: info.componentStack ?? undefined });
  }

  render(): ReactNode {
    if (!this.state.hasError) return this.props.children;
    return (
      <main
        role="alert"
        className="mx-auto flex min-h-dvh max-w-[30rem] flex-col items-center justify-center gap-[var(--space-4)] p-[var(--gutter)] text-center"
      >
        <CircleAlert aria-hidden="true" className="size-[var(--icon-xl)] text-destructive" />
        <h1 className="text-[length:var(--fs-xl)]">เกิดข้อผิดพลาด</h1>
        <p className="text-muted-foreground">ระบบทำงานผิดพลาดโดยไม่คาดคิด ข้อมูลที่บันทึกแล้วยังอยู่ ลองกลับไปที่ My Space แล้วทำรายการอีกครั้ง</p>
        {/* Plain link (full reload): the boundary may sit above the router and must reset app state */}
        <a
          href="/my-space"
          className="inline-flex h-[var(--button-height)] items-center rounded-[var(--button-radius)] bg-primary px-[var(--button-padding-x)] font-medium text-primary-foreground hover:bg-primary-hover"
        >
          กลับ My Space
        </a>
      </main>
    );
  }
}
