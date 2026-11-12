import { useEffect } from 'react';
import { Link } from 'react-router';
import { ChevronRight, Clock } from 'lucide-react';
import type { ServiceCategory } from '@/domain/types';
import { logger } from '@/shared/logger';
import { resolveIcon } from '@/shared/icons';

/** Clickable category card (design-system §6 Card: shadow-sm → shadow-md on hover, whole card is the link). */
export function CategoryCard({ category }: { category: ServiceCategory }) {
  const { icon: Icon, known } = resolveIcon(category.icon);
  useEffect(() => {
    if (!known) logger.warn('catalog.unknownIcon', { categoryId: category.id });
  }, [known, category.id]);

  return (
    <Link
      to={`/catalog/${category.id}`}
      className="group flex h-full flex-col gap-[var(--space-3)] rounded-[var(--card-radius)] bg-card p-[var(--card-padding)] shadow-[var(--card-shadow)] transition-shadow duration-[var(--dur-normal)] hover:shadow-[var(--card-shadow-hover)]"
    >
      <span className="flex items-start justify-between">
        <span className="flex size-12 items-center justify-center rounded-[var(--radius-md)] bg-primary-soft text-primary md:size-14">
          <Icon aria-hidden="true" strokeWidth={1.75} className="size-[var(--icon-lg)] md:size-[var(--icon-xl)]" />
        </span>
        <ChevronRight aria-hidden="true" className="size-[var(--icon-md)] text-muted-foreground transition-transform duration-[var(--dur-fast)] group-hover:translate-x-0.5" />
      </span>
      <span className="flex flex-col gap-[var(--space-1)]">
        <span className="font-semibold text-foreground">{category.name}</span>
        <span className="text-[length:var(--fs-sm)] text-muted-foreground">{category.description}</span>
        {category.slaNote && (
          <span className="mt-[var(--space-1)] inline-flex items-center gap-[var(--space-1)] self-start rounded-[var(--badge-radius)] bg-accent-soft px-[var(--badge-padding-x)] py-0.5 text-[length:var(--fs-sm)] text-accent-soft-foreground">
            <Clock aria-hidden="true" className="size-[var(--icon-sm)] shrink-0" />
            {category.slaNote}
          </span>
        )}
      </span>
    </Link>
  );
}
