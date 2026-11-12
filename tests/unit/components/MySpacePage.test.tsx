import { screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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

  it('links the featured services to the pre-filled form (US-009 Add-on, Request a Service)', () => {
    resetApp('usr_001');
    renderAt('/my-space', '/my-space', <MySpacePage />);
    const featured = screen.getByRole('heading', { name: 'บริการยอดนิยม' }).closest('section') as HTMLElement;
    const links = within(featured).getAllByRole('link');
    expect(links).toHaveLength(6);
    expect(within(featured).getByRole('link', { name: 'ขอบริการ: ขอใช้งาน WiFi' }).getAttribute('href')).toBe('/calls/new?service=sdf_039');
  });

  describe('urgency (US-009 Add-on)', () => {
    afterEach(() => vi.useRealTimers());
    // 2026-11-12 20:00: call_001 P4 has 13h15m of 72h left (< 25%), call_002 is overdue, call_009 is Resolved past due
    const at = () => vi.useFakeTimers({ now: Date.parse('2026-11-12T20:00:00+07:00'), toFake: ['Date'] });
    const numbers = (title: string) =>
      within(card(title)).getAllByRole('row').slice(1).map((r) => within(r).getAllByRole('cell')[0]?.textContent);

    it('sorts near-due first, then awaiting approval, then calls without a running SLA', () => {
      at();
      resetApp('usr_001');
      renderAt('/my-space', '/my-space', <MySpacePage />);
      expect(numbers('Calls Logged For You')).toEqual(['100001', '100005', '100007', '100009']);
    });

    it('summarises what needs attention; a Resolved call is not counted as overdue', () => {
      at();
      resetApp('usr_001');
      renderAt('/my-space', '/my-space', <MySpacePage />);
      const summary = screen.getByRole('list', { name: 'สรุปเรื่องของคุณ' });
      expect(summary.textContent).toContain('1 เรื่องเลยกำหนด'); // call_002 only
      expect(summary.textContent).toContain('1 เรื่องใกล้ครบกำหนด');
      expect(summary.textContent).toContain('1 เรื่องรออนุมัติ');
      expect(within(card('Calls Logged For You')).queryByText(/เลยกำหนด/)).toBeNull();
    });

    it('links an approver to the approvals waiting for them', () => {
      at();
      resetApp('usr_004');
      renderAt('/my-space', '/my-space', <MySpacePage />);
      expect(screen.getByRole('link', { name: /รออนุมัติจากคุณ 1 เรื่อง/ }).getAttribute('href')).toBe('/approvals');
    });

    it('links an agent to the open calls of their group queue', () => {
      at();
      resetApp('usr_006');
      renderAt('/my-space', '/my-space', <MySpacePage />);
      expect(screen.getByRole('link', { name: /เรื่องเปิดในคิวกลุ่มคุณ/ }).getAttribute('href')).toBe('/calls/search');
    });
  });
});
