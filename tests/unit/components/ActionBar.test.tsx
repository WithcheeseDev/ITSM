import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { CallDetailPage } from '@/features/call-detail/CallDetailPage';
import { renderAt, resetApp, silenceLogs } from './helpers';

const openDetail = (userId: string, callId: string) => {
  resetApp(userId);
  renderAt(`/calls/${callId}`, '/calls/:callId', <CallDetailPage />);
};
const buttonNames = () => screen.queryAllByRole('button').map((b) => b.getAttribute('aria-label') ?? b.textContent?.trim() ?? '');
const statusButtons = () => buttonNames().filter((n) => n.startsWith('เปลี่ยนสถานะเป็น'));

describe('ActionBar on Call Detail follows permissions', () => {
  beforeEach(silenceLogs);

  it('agent in the call\'s group: assign + one button per allowed transition', () => {
    openDetail('usr_006', 'call_001'); // Incident, Assigned, grp_002
    expect(screen.getByRole('button', { name: 'มอบหมาย' })).toBeTruthy();
    expect(statusButtons()).toEqual(['เปลี่ยนสถานะเป็น In Process', 'เปลี่ยนสถานะเป็น Cancelled']);
  });

  it('requestor: no assign / status buttons, can cancel their open call', () => {
    openDetail('usr_001', 'call_001');
    expect(screen.queryByRole('button', { name: 'มอบหมาย' })).toBeNull();
    expect(statusButtons()).toEqual([]);
    expect(screen.getByRole('button', { name: /ยกเลิกเรื่อง/ })).toBeTruthy();
  });

  it('requestor on a Resolved call within 7 days: re-open only', () => {
    openDetail('usr_001', 'call_009');
    expect(screen.getByRole('button', { name: /เปิดเรื่องใหม่/ })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /ยกเลิกเรื่อง/ })).toBeNull();
  });

  it('admin: read-only, no action bar and no comment box', () => {
    openDetail('usr_008', 'call_001');
    expect(screen.queryByRole('button', { name: 'มอบหมาย' })).toBeNull();
    expect(statusButtons()).toEqual([]);
    expect(screen.queryByRole('button', { name: 'ส่งความเห็น' })).toBeNull();
  });

  it('agent of another group: not found, no actions', () => {
    openDetail('usr_007', 'call_001');
    expect(screen.getByText('ไม่พบรายการหรือไม่มีสิทธิ์')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'มอบหมาย' })).toBeNull();
  });
});
