import { Construction } from 'lucide-react';

interface Props {
  title: string;
}

// shortcut: placeholder page until each feature task (phase 2) replaces it
export function PlaceholderPage({ title }: Props) {
  return (
    <>
      <h1 className="text-[length:var(--fs-xl)] md:text-[length:var(--fs-2xl)]">{title}</h1>
      <section className="mt-[var(--section-gap)] flex flex-col items-center gap-[var(--space-3)] rounded-[var(--card-radius)] bg-card p-[var(--space-10)] text-center shadow-[var(--card-shadow)]">
        <Construction aria-hidden="true" className="size-[var(--icon-xl)] text-muted-foreground" />
        <p className="text-muted-foreground">หน้านี้อยู่ระหว่างพัฒนา</p>
      </section>
    </>
  );
}
