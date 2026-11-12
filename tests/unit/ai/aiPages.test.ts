import { describe, expect, it } from 'vitest';
import guide from '../../../server/ai/pages.json';
import { NAVIGABLE_ROUTES, searchPages } from '../../../server/ai/pages';
import { APP_STATIC_ROUTES } from '../../../server/ai/tools';

const first = (q: string) => searchPages(q)[0]?.route;

describe('searchPages (page guide)', () => {
  it('every pages.json route is a real static route', () => {
    for (const p of guide.pages) expect(APP_STATIC_ROUTES).toContain(p.route);
  });

  it('finds the right page for Thai queries without spaces and for English', () => {
    expect(first('อยากค้นหาเรื่องที่เคยแจ้ง')).toBe('/calls/search');
    expect(first('มีเรื่องรออนุมัติไหม')).toBe('/approvals');
    expect(first('เรื่องที่ฉันแจ้งไปถึงไหนแล้ว')).toBe('/my-space');
    expect(first('มีบริการอะไรบ้าง')).toBe('/catalog');
    expect(first('search ticket')).toBe('/calls/search');
  });

  it('returns at most 3 hits with route/title/purpose/params, never non-navigable pages, [] for nonsense', () => {
    const hits = searchPages('อยากค้นหาเรื่องที่เคยแจ้ง');
    expect(hits.length).toBeLessThanOrEqual(3);
    expect(Object.keys(hits[0]!).sort()).toEqual(['params', 'purpose', 'route', 'title']);
    for (const q of ['แจ้งเรื่องใหม่', 'ฟอร์ม กรอกฟอร์ม', 'add support call', 'login เข้าสู่ระบบ ล็อกอิน']) {
      const routes = searchPages(q).map((h) => h.route);
      expect(routes).not.toContain('/calls/new');
      expect(routes).not.toContain('/login');
    }
    expect(searchPages('asdfqwer zzqx')).toEqual([]);
    expect(NAVIGABLE_ROUTES.has('/calls/new')).toBe(false);
    expect(NAVIGABLE_ROUTES.has('/login')).toBe(false);
  });
});
