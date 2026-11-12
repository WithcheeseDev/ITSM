import { describe, expect, it } from 'vitest';
import { calcPriority, levelsFor, PRIORITY_ERROR } from '@/domain/priority';
import { seedDataset } from '@/data/storage';

const db = seedDataset();

describe('calcPriority', () => {
  it('standard call types use priorityMatrix["u-i"] from data', () => {
    expect(calcPriority('Incident', '3-Medium', '4-Minor/Localized', db)).toEqual({ ok: true, data: db.priorityMatrix['3-4'] });
    expect(calcPriority('Incident', '1-Critical', '1-Extensive/Widespread', db)).toEqual({ ok: true, data: 'P1' });
    expect(calcPriority('Service Requests', '4-Low', '4-Minor/Localized', db)).toEqual({ ok: true, data: 'P4' });
  });

  it('every standard cell maps to the matrix value', () => {
    for (const u of levelsFor('Incident').urgency)
      for (const i of levelsFor('Incident').impact) {
        const r = calcPriority('Problem', u, i, db);
        expect(r).toEqual({ ok: true, data: db.priorityMatrix[`${u[0]}-${i[0]}`] });
      }
  });

  it('RFC uses rfcPriorityMatrix by urgency only', () => {
    expect(calcPriority('Change (RFC)', 'RFC - Major', 'RFC - Very Low', db)).toEqual({ ok: true, data: 'P1' });
    expect(calcPriority('Change (RFC)', 'RFC - Minor', 'RFC - Very High', db)).toEqual({ ok: true, data: 'P3' });
  });

  it('BR-02: level set must match the call type', () => {
    const wrongForIncident = calcPriority('Incident', 'RFC - Major', '1-Extensive/Widespread', db);
    expect(wrongForIncident).toEqual({ ok: false, error: expect.objectContaining({ code: 'VALIDATION', fieldErrors: { priority: PRIORITY_ERROR } }) });
    expect(calcPriority('Change (RFC)', '1-Critical', 'RFC - High', db).ok).toBe(false);
  });

  it('missing matrix key → not computable', () => {
    const r = calcPriority('Incident', '2-High', '2-Significant/Large', { priorityMatrix: {}, rfcPriorityMatrix: {} });
    expect(!r.ok && r.error.fieldErrors?.priority).toBe(PRIORITY_ERROR);
  });
});
