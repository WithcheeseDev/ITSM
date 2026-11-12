/** Shared render helpers for component tests: seed data in the app's dataStore, a session, and a router at `path`. */
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { vi } from 'vitest';
import { dataStore } from '@/data/repositories';
import { login, logout } from '@/features/auth/sessionStore';

export function silenceLogs(): void {
  for (const level of ['info', 'warn', 'error', 'debug'] as const) vi.spyOn(console, level).mockImplementation(() => {});
}

/** Browser APIs jsdom lacks that Radix / Tiptap call on mount (layout is not computed in jsdom anyway). */
export function stubBrowserApis(): void {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  Element.prototype.scrollIntoView ??= () => {};
  Range.prototype.getClientRects ??= () => ({ length: 0, item: () => null, [Symbol.iterator]: [][Symbol.iterator] }) as unknown as DOMRectList;
  Range.prototype.getBoundingClientRect ??= () => new DOMRect();
  document.elementFromPoint ??= () => null;
}

/** Fresh seed + optional signed-in user (null = signed out). */
export function resetApp(userId: string | null): void {
  dataStore.resetToSeed();
  if (userId) login(userId);
  else logout();
}

function Where() {
  const { pathname } = useLocation();
  return <output data-testid="location">{pathname}</output>;
}

/** Renders `element` at `routePath` (matched by `url`), with a probe that shows the current pathname. */
export function renderAt(url: string, routePath: string, element: ReactElement) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path={routePath} element={element} />
        <Route path="*" element={null} />
      </Routes>
      <Where />
    </MemoryRouter>,
  );
}
