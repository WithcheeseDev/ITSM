import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { ErrorBoundary } from '@/shared/ErrorBoundary';

function Boom(): never {
  throw new Error('boom');
}

describe('ErrorBoundary', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('renders children when there is no error', () => {
    render(<ErrorBoundary><p>ok</p></ErrorBoundary>);
    expect(screen.getByText('ok')).toBeTruthy();
  });

  it('shows the Thai fallback with a link back to My Space and logs once', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<ErrorBoundary><Boom /></ErrorBoundary>);
    expect(screen.getByRole('heading', { name: 'เกิดข้อผิดพลาด' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'กลับ My Space' }).getAttribute('href')).toBe('/my-space');
    expect(spy.mock.calls.some((c) => (c[0] as { event?: string })?.event === 'errorBoundary.caught')).toBe(true);
  });
});
