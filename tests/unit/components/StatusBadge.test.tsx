import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CALL_TYPES, STATUS_BY_CALL_TYPE, type Status } from '@/domain/types';
import { StatusBadge, statusGroup } from '@/shared/components/StatusBadge';

const ALL: Status[] = [...new Set(CALL_TYPES.flatMap((ct) => [...STATUS_BY_CALL_TYPE[ct]] as Status[]))];

describe('StatusBadge', () => {
  it.each(ALL)('shows an icon and the label for %s', (status) => {
    const { container } = render(<StatusBadge status={status} />);
    expect(screen.getByText(status)).toBeTruthy();
    const icon = container.querySelector('svg');
    expect(icon?.getAttribute('aria-hidden')).toBe('true');
  });

  it('uses a different icon shape for every status group (not colour alone)', () => {
    const iconByGroup = new Map<string, string>();
    for (const status of ALL) {
      const { container, unmount } = render(<StatusBadge status={status} />);
      const cls = container.querySelector('svg')?.getAttribute('class') ?? '';
      const shape = cls.split(' ').find((c) => c.startsWith('lucide-') && c !== 'lucide-icon') ?? '';
      const group = statusGroup(status);
      if (iconByGroup.has(group)) expect(iconByGroup.get(group)).toBe(shape);
      else iconByGroup.set(group, shape);
      unmount();
    }
    expect(iconByGroup.size).toBe(6);
    expect(new Set(iconByGroup.values()).size).toBe(6);
  });
});
