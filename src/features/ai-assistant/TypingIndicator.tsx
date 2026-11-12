/** Waiting for the first reply text: three bouncing dots (design-system §9 2026-11-14). */
export function TypingIndicator() {
  return (
    <span role="status" className="inline-flex h-6 items-center gap-1">
      <span className="sr-only">กำลังคิด</span>
      {['0ms', '150ms', '300ms'].map((delay) => (
        <span key={delay} aria-hidden="true" className="typing-dot size-1.5 rounded-full bg-muted-foreground" style={{ animationDelay: delay }} />
      ))}
    </span>
  );
}
