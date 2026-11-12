import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { AppLayout } from '@/app/layout/AppLayout';
import { TooltipProvider } from '@/shared/ui/tooltip';
import { renderAt, resetApp, silenceLogs, stubBrowserApis } from './helpers';

const KEY = 'itsm.ui.sidebarCollapsed';
const renderLayout = () =>
  renderAt(
    '/my-space',
    '/my-space',
    <TooltipProvider>
      <AppLayout />
    </TooltipProvider>,
  );
const aside = () => document.getElementById('app-sidebar') as HTMLElement;

describe('AppLayout navigation rail (design-system §9 Add-on)', () => {
  beforeEach(() => {
    silenceLogs();
    stubBrowserApis();
    Element.prototype.scrollTo ??= () => {}; // AppLayout scrolls the panel to top on mount; jsdom lacks it
    window.scrollTo = () => {};
    localStorage.clear();
    resetApp('usr_001');
  });

  it('collapses on click, remembers it, and keeps the link names', async () => {
    renderLayout();
    const toggle = screen.getByRole('button', { name: 'ย่อเมนู' });
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(toggle.getAttribute('aria-controls')).toBe('app-sidebar');

    await userEvent.click(toggle);

    const expand = screen.getByRole('button', { name: 'ขยายเมนู' });
    expect(expand.getAttribute('aria-expanded')).toBe('false');
    expect(localStorage.getItem(KEY)).toBe('1');
    expect(within(aside()).getByRole('link', { name: 'My Space' })).toBeTruthy();
    expect(within(aside()).getByRole('link', { name: 'Service Catalog' })).toBeTruthy();
    expect(within(aside()).getByRole('link', { name: 'ITSM Support Desk' })).toBeTruthy();

    await userEvent.click(expand);
    expect(screen.getByRole('button', { name: 'ย่อเมนู' }).getAttribute('aria-expanded')).toBe('true');
    expect(localStorage.getItem(KEY)).toBe('0');
  });

  it('starts collapsed when the stored value is "1"', () => {
    localStorage.setItem(KEY, '1');
    renderLayout();
    expect(screen.getByRole('button', { name: 'ขยายเมนู' }).getAttribute('aria-expanded')).toBe('false');
    expect(within(aside()).getByRole('link', { name: 'My Space' })).toBeTruthy();
  });
});
