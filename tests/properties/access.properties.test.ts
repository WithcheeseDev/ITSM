import fc from 'fast-check';
import { describe, it } from 'vitest';
import { can, filterVisibleCalls } from '@/domain/access';
import type { User } from '@/domain/types';
import { buildDataset } from '../fixtures';

const db = buildDataset();
const RUNS = { numRuns: 200 };
const userIds = db.users.map((u) => u.id);
const groupIds = db.groups.map((g) => g.id);
const usersByRole = (role: User['role']) => db.users.filter((u) => u.role === role);

const callArb = fc.record({
  id: fc.uuid(),
  requestorId: fc.constantFrom(...userIds),
  openedByUserId: fc.constantFrom(...userIds),
  groupId: fc.constantFrom(...groupIds),
});
const callsArb = fc.uniqueArray(callArb, { maxLength: 30, selector: (c) => c.id });
const approvalsFor = (calls: { id: string }[]) =>
  fc.array(fc.record({ callId: calls.length ? fc.constantFrom(...calls.map((c) => c.id)) : fc.constant('none'), approverId: fc.constantFrom(...userIds) }), { maxLength: 20 });
const scenario = callsArb.chain((calls) => fc.tuple(fc.constant(calls), approvalsFor(calls)));
const own = (u: User, c: { requestorId: string; openedByUserId: string }) => c.requestorId === u.id || c.openedByUserId === u.id;

describe('P7 visibility', () => {
  it('a requestor sees exactly the calls they requested or opened', () => {
    fc.assert(
      fc.property(fc.constantFrom(...usersByRole('requestor')), scenario, (u, [calls, approvals]) => {
        const visible = filterVisibleCalls(u, calls, approvals, db.rolePermissions);
        return visible.length === calls.filter((c) => own(u, c)).length && visible.every((c) => own(u, c));
      }),
      RUNS,
    );
  });

  it('an approver additionally sees only calls with their own approval', () => {
    fc.assert(
      fc.property(fc.constantFrom(...usersByRole('approver')), scenario, (u, [calls, approvals]) =>
        filterVisibleCalls(u, calls, approvals, db.rolePermissions).every(
          (c) => own(u, c) || approvals.some((a) => a.callId === c.id && a.approverId === u.id),
        )),
      RUNS,
    );
  });

  it('an agent never sees another group\'s calls unless they are their own', () => {
    fc.assert(
      fc.property(fc.constantFrom(...usersByRole('agent')), scenario, (u, [calls, approvals]) =>
        filterVisibleCalls(u, calls, approvals, db.rolePermissions).every((c) => own(u, c) || u.groupIds.includes(c.groupId))),
      RUNS,
    );
  });
});

describe('P8 default-deny', () => {
  const knownPerms = [...new Set(Object.values(db.rolePermissions).flat())];
  const perm = fc.oneof(fc.constantFrom(...knownPerms), fc.string(), fc.constantFrom('__proto__', 'constructor', 'toString'));

  it('can() is true only when the role lists the permission', () => {
    fc.assert(
      fc.property(fc.constantFrom(...db.users), perm, (u, p) => can(u, p, db.rolePermissions) === (db.rolePermissions[u.role] ?? []).includes(p)),
      RUNS,
    );
  });

  it('unknown roles and no user are always denied', () => {
    fc.assert(
      fc.property(fc.oneof(fc.string(), fc.constantFrom('__proto__', 'constructor', 'hasOwnProperty')), perm, (role, p) => {
        fc.pre(!Object.hasOwn(db.rolePermissions, role));
        return !can({ role } as Pick<User, 'role'>, p, db.rolePermissions) && !can(null, p, db.rolePermissions);
      }),
      RUNS,
    );
  });
});
