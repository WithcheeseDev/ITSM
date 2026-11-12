import { Link } from 'react-router';
import { ArrowRight } from 'lucide-react';
import type { ServiceDefinition } from '@/domain/types';
import { Button } from '@/shared/ui/button';

const requestHref = (s: ServiceDefinition) => `/calls/new?service=${encodeURIComponent(s.id)}`;

function RequestButton({ service }: { service: ServiceDefinition }) {
  return (
    <Button asChild>
      <Link to={requestHref(service)} aria-label={`Request this service: ${service.name}`}>
        Request this service
        <ArrowRight aria-hidden="true" className="size-[var(--icon-sm)]" />
      </Link>
    </Button>
  );
}

/** FR-022: Name / Description / Request Type / "Request this service" (≥ md table, < md list). */
export function ServiceTable({ services, caption }: { services: readonly ServiceDefinition[]; caption: string }) {
  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-collapse text-[length:var(--fs-sm)]">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr className="bg-[var(--table-header-bg)] text-left">
              <th scope="col" className="h-[var(--table-row-height)] px-[var(--space-3)] font-semibold text-muted-foreground">Name</th>
              <th scope="col" className="px-[var(--space-3)] font-semibold text-muted-foreground">Description</th>
              <th scope="col" className="px-[var(--space-3)] font-semibold whitespace-nowrap text-muted-foreground">Request Type</th>
              <th scope="col" className="px-[var(--space-3)]">
                <span className="sr-only">Action</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {services.map((s) => (
              <tr key={s.id} className="border-t">
                <td className="px-[var(--space-3)] py-[var(--space-2)] font-medium">{s.name}</td>
                <td className="px-[var(--space-3)] py-[var(--space-2)] text-muted-foreground">{s.description}</td>
                <td className="px-[var(--space-3)] py-[var(--space-2)] whitespace-nowrap">{s.requestType}</td>
                <td className="px-[var(--space-3)] py-[var(--space-2)] text-right">
                  <RequestButton service={s} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="flex flex-col md:hidden" aria-label={caption}>
        {services.map((s) => (
          <li key={s.id} className="flex flex-col gap-[var(--space-2)] border-t py-[var(--space-3)] first:border-t-0">
            <span className="font-medium">{s.name}</span>
            <span className="text-[length:var(--fs-sm)] text-muted-foreground">{s.description}</span>
            <span className="text-[length:var(--fs-sm)]">Request Type: {s.requestType}</span>
            <span className="self-start">
              <RequestButton service={s} />
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}
