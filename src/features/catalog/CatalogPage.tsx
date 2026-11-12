import { Fragment } from 'react';
import { Link, useParams } from 'react-router';
import { ChevronRight, PackageOpen, SearchX } from 'lucide-react';
import { dataStore } from '@/data/repositories';
import type { ServiceCategory } from '@/domain/types';
import { EmptyState } from '@/shared/components/EmptyState';
import { Button } from '@/shared/ui/button';
import { CategoryCard } from './CategoryCard';
import { ServiceTable } from './ServiceTable';

const GRID = 'grid grid-cols-1 gap-[var(--space-4)] sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
const card = 'rounded-[var(--card-radius)] bg-card p-[var(--card-padding)] shadow-[var(--card-shadow)]';

/** Ancestors from the root down to `category` (inclusive). */
function trail(category: ServiceCategory, all: readonly ServiceCategory[]): ServiceCategory[] {
  const out: ServiceCategory[] = [];
  let cur: ServiceCategory | undefined = category;
  while (cur && out.length < 10) {
    out.unshift(cur);
    const parentId: string | null = cur.parentId;
    cur = parentId ? all.find((c) => c.id === parentId) : undefined;
  }
  return out;
}

function Breadcrumb({ items }: { items: ServiceCategory[] }) {
  return (
    <nav aria-label="breadcrumb" className="text-[length:var(--fs-sm)]">
      <ol className="flex flex-wrap items-center gap-[var(--space-1)]">
        <li>
          <Link to="/catalog" className="inline-flex min-h-[var(--tap-target)] items-center text-primary underline-offset-4 hover:underline">
            Service Categories
          </Link>
        </li>
        {items.map((c, i) => (
          <Fragment key={c.id}>
            <li aria-hidden="true">
              <ChevronRight className="size-[var(--icon-sm)] text-muted-foreground" />
            </li>
            <li>
              {i === items.length - 1 ? (
                <span aria-current="page" className="font-medium text-foreground">
                  {c.name}
                </span>
              ) : (
                <Link to={`/catalog/${c.id}`} className="inline-flex min-h-[var(--tap-target)] items-center text-primary underline-offset-4 hover:underline">
                  {c.name}
                </Link>
              )}
            </li>
          </Fragment>
        ))}
      </ol>
    </nav>
  );
}

/** C6 — /catalog (top categories) and /catalog/:categoryId (sub-categories + services). US-012, US-013. */
export function CatalogPage() {
  const { categoryId } = useParams();
  const d = dataStore.getDataset();
  const categories = d.serviceCategories;

  if (!categoryId) {
    const top = categories.filter((c) => c.parentId === null);
    return (
      <>
        <h1 className="text-[length:var(--fs-xl)] md:text-[length:var(--fs-2xl)]">Service Catalog</h1>
        <p className="mt-[var(--space-1)] text-muted-foreground">เลือกหมวดบริการที่ต้องการ</p>
        <div className={`mt-[var(--section-gap)] ${GRID}`}>
          {top.map((c) => (
            <CategoryCard key={c.id} category={c} />
          ))}
        </div>
      </>
    );
  }

  const current = categories.find((c) => c.id === categoryId);
  if (!current) {
    return (
      <>
        <h1 className="text-[length:var(--fs-xl)] md:text-[length:var(--fs-2xl)]">Service Catalog</h1>
        <section className={`mt-[var(--section-gap)] ${card}`}>
          <EmptyState
            icon={SearchX}
            title="ไม่พบหมวดบริการนี้"
            action={
              <Button asChild variant="outline">
                <Link to="/catalog">กลับไปหน้าหมวดบริการ</Link>
              </Button>
            }
          />
        </section>
      </>
    );
  }

  const children = categories.filter((c) => c.parentId === current.id);
  const services = d.serviceDefinitions.filter((s) => s.categoryId === current.id);

  return (
    <>
      <Breadcrumb items={trail(current, categories)} />
      <h1 className="mt-[var(--space-2)] text-[length:var(--fs-xl)] md:text-[length:var(--fs-2xl)]">{current.name}</h1>
      <p className="mt-[var(--space-1)] text-muted-foreground">{current.description}</p>
      {current.slaNote && <p className="mt-[var(--space-1)] text-[length:var(--fs-sm)] text-accent-soft-foreground">{current.slaNote}</p>}

      {children.length > 0 && (
        <section aria-labelledby="sub-title" className="mt-[var(--section-gap)]">
          <h2 id="sub-title" className="text-[length:var(--fs-lg)]">
            หมวดย่อย
          </h2>
          <div className={`mt-[var(--space-3)] ${GRID}`}>
            {children.map((c) => (
              <CategoryCard key={c.id} category={c} />
            ))}
          </div>
        </section>
      )}

      {services.length > 0 && (
        <section aria-labelledby="svc-title" className={`mt-[var(--section-gap)] ${card}`}>
          <h2 id="svc-title" className="mb-[var(--space-3)] text-[length:var(--fs-lg)]">
            บริการ ({services.length})
          </h2>
          <ServiceTable services={services} caption={`บริการในหมวด ${current.name}`} />
        </section>
      )}

      {children.length === 0 && services.length === 0 && (
        <section className={`mt-[var(--section-gap)] ${card}`}>
          <EmptyState
            icon={PackageOpen}
            title="ยังไม่มีบริการในหมวดนี้"
            action={
              <Button asChild variant="outline">
                <Link to="/catalog">กลับไปหน้าหมวดบริการ</Link>
              </Button>
            }
          />
        </section>
      )}
    </>
  );
}
