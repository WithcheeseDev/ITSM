import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { FORBIDDEN_MESSAGE, RequirePermission } from '@/app/RequirePermission';
import { renderAt, resetApp, silenceLogs } from './helpers';

const guarded = (permission: string | null) => (
  <RequirePermission permission={permission}>
    <p>หน้าที่ป้องกันไว้</p>
  </RequirePermission>
);

describe('RequirePermission', () => {
  beforeEach(silenceLogs);

  it('redirects to /login without a session', () => {
    resetApp(null);
    renderAt('/approvals', '/approvals', guarded('approval:view_assigned'));
    expect(screen.getByTestId('location').textContent).toBe('/login');
    expect(screen.queryByText('หน้าที่ป้องกันไว้')).toBeNull();
  });

  it('redirects to My Space when the role lacks the permission', () => {
    resetApp('usr_001');
    renderAt('/approvals', '/approvals', guarded('approval:view_assigned'));
    expect(screen.getByTestId('location').textContent).toBe('/my-space');
    expect(screen.queryByText('หน้าที่ป้องกันไว้')).toBeNull();
  });

  it('shows the message instead of looping when My Space itself is denied', () => {
    resetApp('usr_001');
    renderAt('/my-space', '/my-space', guarded('catalog:manage'));
    expect(screen.getByRole('alert').textContent).toBe(FORBIDDEN_MESSAGE);
  });

  it('renders the page when the role has the permission', () => {
    resetApp('usr_004');
    renderAt('/approvals', '/approvals', guarded('approval:view_assigned'));
    expect(screen.getByText('หน้าที่ป้องกันไว้')).toBeTruthy();
    expect(screen.getByTestId('location').textContent).toBe('/approvals');
  });
});
