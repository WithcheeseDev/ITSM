# Correctness Properties

## Overview
**PBT Framework**: fast-check 4.10.2 บน Vitest 4.1.12 (D3-11) · ทดสอบเฉพาะ pure functions ใน `src/domain/` และ `src/features/search/fullText.ts`

ข้อมูลอ้างอิงใน generator อ่านจาก `src/data/database.json` (matrix, SLA, statusByCallType, rolePermissions) — ไม่ copy ค่ามาใส่ใน test

---

## Properties

### P1. Priority อยู่ในชุดที่กำหนดเสมอ
**Validates**: US-005
**Property**: ทุกคู่ urgency × impact ที่ถูกชุด → ผลเป็น P1–P4 และตรงกับ matrix ใน data
```ts
fc.assert(fc.property(fc.constantFrom(...STD_U), fc.constantFrom(...STD_I), (u, i) => {
  const r = calcPriority('Incident', u, i, db);
  return r.ok && r.data === db.priorityMatrix[`${num(u)}-${num(i)}`];
}));
```
**Generators**: `constantFrom(enums.urgency.standard)`, `constantFrom(enums.impact.standard)`; RFC ใช้ชุด rfc
**Edge Cases**: urgency ชุด RFC กับ call type Incident → `ok:false` (BR-02)

### P2. Priority monotonic
**Validates**: US-005
**Property**: เพิ่มความรุนแรงของ urgency หรือ impact (เลขน้อยลง) แล้ว priority ไม่ลดลง
```ts
fc.assert(fc.property(urgencyNum, impactNum, (u, i) =>
  fc.pre(u > 1) || rank(prio(u - 1, i)) <= rank(prio(u, i))));
```
**Edge Cases**: ช่องที่ `1-4` และ `4-1` ใน matrix

### P3. Due date = start + SLA
**Validates**: US-006
**Property**: `calcDueDate(start, p) - start === slaHoursByPriority[p] ชม.` ทุก start และ p
```ts
fc.assert(fc.property(fc.date({ min, max }), fc.constantFrom('P1','P2','P3','P4'), (d, p) =>
  Date.parse(calcDueDate(d.toISOString(), p, db.slaHoursByPriority)) - d.getTime()
    === db.slaHoursByPriority[p] * 3_600_000));
```
**Edge Cases**: ข้ามวัน / ข้ามเดือน / ข้ามปี

### P4. Time Left สอดคล้องกับเวลา
**Validates**: US-006
**Property**: `now ≤ due` → ไม่ overdue · `now > due` และไม่ปิด → overdue · สถานะปิด → ไม่ overdue เสมอ
**Generators**: due, now = date; status จาก statusByCallType
**Edge Cases**: now === due (ไม่ overdue), awaitingApproval → label "รออนุมัติ"

### P5. State machine ไม่หลุดชุดสถานะ
**Validates**: US-007, US-026
**Property**: สำหรับทุก callType และทุก status → `nextStatuses()` ⊆ `statusByCallType[callType]` และ `assertTransition(from, to)` สำเร็จ ⟺ `to ∈ nextStatuses(from)`
```ts
fc.assert(fc.property(callTypeArb, (ct) => fc.property(fc.constantFrom(...S[ct]), fc.constantFrom(...S[ct]), (a, b) =>
  assertTransition(ct, a, b).ok === nextStatuses(ct, a).includes(b))));
```
**Edge Cases**: สถานะใน closedStatuses ไปต่อได้แค่ `Closed` (Completed / Failed / Request Completed → Closed ตาม Requirements §4.4) · Closed / Cancelled / Request Cancelled ไม่มีทางออก · Resolved→Re-Opened ได้ (Resolved ไม่อยู่ใน closedStatuses) — แก้ 2026-11-12 ดู Add-on

### P6. ลำดับ transition แบบสุ่มไม่พาเข้าสถานะที่ไม่ถูกต้อง
**Validates**: US-007
**Property**: เดินสุ่ม n ก้าวจากสถานะแรก (`initialStatus`) โดยเลือกเฉพาะ `nextStatuses` → ทุกสถานะที่ผ่านอยู่ในชุดของ call type
**Generators**: `fc.array(fc.nat(), { maxLength: 20 })` เป็นตัวเลือก index ทีละก้าว

### P7. Visibility — requestor ไม่เห็นเรื่องคนอื่น
**Validates**: US-004
**Property**: ทุก call ใน `filterVisibleCalls(requestor, calls)` มี `requestorId` หรือ `openedByUserId` = requestor.id
**Generators**: สุ่ม calls จาก user ids ใน data
**Edge Cases**: approver เห็นเพิ่มเฉพาะ call ที่มี approval ของตัวเอง · agent ไม่เห็นกลุ่มที่ไม่ได้สังกัด

### P8. Default-deny
**Validates**: US-003
**Property**: `can(user, perm) === rolePermissions[user.role].includes(perm)` ทุก role × perm (รวม perm สุ่มที่ไม่มีอยู่จริง → false)

### P9. เลข ticket ไม่ซ้ำและเพิ่มทีละ 1
**Validates**: US-008
**Property**: สร้างต่อกัน n ครั้ง → เลขทั้งหมดไม่ซ้ำ, ยาว 6 หลัก, เรียงต่อกัน

### P10. Auto-close ตาม window
**Validates**: US-028
**Property**: Resolved และ `now - resolvedAt > 7 วัน` ⟺ `shouldAutoClose === true`

### P11. Full-text Boolean
**Validates**: US-021
**Property**: `match(q1 AND q2, t) === match(q1,t) && match(q2,t)` · `match(NOT q, t) === !match(q, t)` · Natural Language ไม่สนตัวพิมพ์เล็ก/ใหญ่

### P12. Sanitizer idempotent
**Validates**: US-018, US-023
**Property**: `sanitizeHtml(sanitizeHtml(x)) === sanitizeHtml(x)` และผลไม่มี `<script`, `on*=` attribute, `javascript:` URL
**Generators**: `fc.string()` ผสม payload XSS ที่รู้จัก

---

## Test Configuration
- **Tests per property**: 200 (default fast-check 100 → ตั้ง `numRuns: 200`)
- **Timeout**: 5 วินาทีต่อ property
- **Shrinking**: เปิด — log counterexample และ `seed` เมื่อ fail

**Run**: `npm test -- tests/properties`

**Organization**:
```
tests/properties/
├── priority.properties.test.ts     # P1, P2
├── sla.properties.test.ts          # P3, P4, P10
├── stateMachine.properties.test.ts # P5, P6
├── access.properties.test.ts       # P7, P8
├── numbering.properties.test.ts    # P9
├── fullText.properties.test.ts     # P11
└── sanitize.properties.test.ts     # P12
```

## Add-on

### 2026-11-12 — Task 5.2: P5 edge case (ผู้ใช้อนุมัติ "แก้ spec แล้ว next")
- เดิม "สถานะใน closedStatuses ไม่มีทางออก" ขัดกับ state machine ใน Requirements §4.4 ที่ให้ Completed / Failed (RFC) และ Request Completed (Service Requests, ITSR) → Closed ทั้งที่ data ใส่ 3 สถานะนี้ใน `closedStatuses`
- ใหม่: สถานะใน closedStatuses ไปต่อได้แค่ `Closed` · Closed / Cancelled / Request Cancelled เป็นสถานะสุดท้าย · โค้ดไม่เปลี่ยน
