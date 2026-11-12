import { screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { MySpacePage } from '@/features/my-space/MySpacePage';
import { renderAt, resetApp, silenceLogs } from './helpers';

const card = (title: string) => screen.getByRole('heading', { name: new RegExp(title) }).closest('section') as HTMLElement;

describe('MySpacePage', () => {
  beforeEach(silenceLogs);

  it('shows both empty states for a user with no calls', () => {
    resetApp('usr_005');
    renderAt('/my-space', '/my-space', <MySpacePage />);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain('Welcome Back');
    expect(within(card('Calls Logged For You')).getByText('ยังไม่มีเรื่องที่แจ้งให้คุณ')).toBeTruthy();
    expect(within(card('Calls You Opened On Behalf')).getByText('ยังไม่มีเรื่องที่คุณแจ้งแทนผู้อื่น')).toBeTruthy();
    expect(screen.getAllByText(/Count: 0/)).toHaveLength(2);
  });

  it('counts the requestor\'s own calls and the calls opened on behalf', () => {
    resetApp('usr_001');
    renderAt('/my-space', '/my-space', <MySpacePage />);
    // seed: usr_001 is requestor of call_001 / 005 / 007 / 009 and opened call_002 for usr_003
    expect(within(card('Calls Logged For You')).getByText(/Count: 4/)).toBeTruthy();
    expect(within(card('Calls You Opened On Behalf')).getByText(/Count: 1/)).toBeTruthy();
  });
});
