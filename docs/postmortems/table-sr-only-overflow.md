# Post-mortem — ตารางทำให้หน้าเลื่อนแนวนอนเมื่อมีเรื่องใกล้ครบกำหนด

## Summary
หน้า My Space เลื่อนแนวนอนได้ทั้งหน้าบนจอ ≥ md (768px: เกิน 288px, 1280px: เกิน 32px) เมื่อตารางมีเรื่องที่ Time Left เข้าช่วงใกล้ครบกำหนด (< 25% ของ SLA) · สาเหตุคือข้อความ `sr-only` ที่เป็น `position: absolute` หลุดออกนอก wrapper ที่เลื่อนตาราง · แก้ด้วยการเพิ่ม `relative` ให้ wrapper ของตาราง 2 จุด · JIRA: n/a · PR: n/a (ยังไม่ commit, working tree บน `main`) · owner: n/a

## Symptom
- UI audit (Playwright, scratchpad `audit.cjs`) รายงาน `document.documentElement.scrollWidth - clientWidth` ของ `/my-space` ผู้ใช้ usr_001 (สมชาย) = 288 ที่ 768px และ 32 ที่ 1280px · 375px = 0 (ตารางเป็น list การ์ด)
- `scrollWidth` = 1056 ขณะ viewport 768
- ทุก container จาก `<main>` ถึง `<section>` กว้าง ≤ 768 · `<div class="hidden overflow-x-auto md:block">` กว้าง 696 และเลื่อนตารางภายในตามปกติ (ตารางกว้าง 1215)
- ตอนตรวจ task 5.9 (ก่อนหน้า) audit เดียวกันได้ overflow = 0

## Root cause
`src/shared/components/TimeLeft.tsx` กรณี `kind === 'warning'` แสดง `<span className="sr-only">ใกล้ครบกำหนด </span>` · Tailwind `sr-only` = `position: absolute` + `width/height: 1px` + `clip` · element absolute หา containing block จาก ancestor ที่ positioned ตัวแรก

wrapper ของตารางใน `src/shared/components/CallTable.tsx` (`hidden overflow-x-auto md:block`) ไม่ positioned · `overflow` จะ clip descendant ที่เป็น absolute ได้ก็ต่อเมื่อ element นั้นเป็น containing block ของมัน (หรืออยู่ระหว่างมันกับ containing block) · ancestor ทั้งสายไม่มีตัวไหน positioned จึงใช้ initial containing block · span วางที่ static position ในเซลล์ Time Left ซึ่งอยู่ขวาสุดของตารางกว้าง 1215px → `right = 1056` และขยาย scroll area ของทั้งหน้า

`src/features/catalog/ServiceTable.tsx` ใช้ wrapper แบบเดียวกัน (bug แฝง ยังไม่มี sr-only absolute ในเซลล์)

## Why it produced the symptom
span มองไม่เห็น (clip 1px) แต่ยังนับใน scrollable overflow ของ viewport · ผู้ใช้จึงเห็นหน้าเลื่อนแนวนอนได้โดยไม่มีอะไรให้ดู · เกิดเฉพาะเมื่อมีแถวที่ Time Left เป็น `warning` · call_001 (due 2026-11-13 09:15, P4 72h) เข้าช่วง < 25% ของ SLA ตามเวลาจริงระหว่าง session นี้ · ตอนตรวจ 5.9 ยังไม่เข้า จึงไม่มี span นี้ใน DOM · ช่วงเวลาตรงกับการเปลี่ยน layout ของ sidebar พอดี ทำให้ดูเหมือนเป็นผลจาก layout ใหม่

## Fix
เพิ่ม `relative` ให้ wrapper ที่เลื่อนตารางทั้ง 2 จุด:
- `src/shared/components/CallTable.tsx` — `relative hidden overflow-x-auto md:block`
- `src/features/catalog/ServiceTable.tsx` — แบบเดียวกัน (กัน bug แบบเดียวกันในอนาคต)

wrapper กลายเป็น containing block ของ absolute descendant · `overflow-x: auto` จึง clip span ไว้ในกล่องของตาราง · แก้ที่ต้นเหตุ (containing block) ไม่ใช่ซ่อนอาการด้วย `overflow-x: hidden` ระดับหน้า ซึ่งจะซ่อน overflow จริงจากที่อื่นด้วย · ไม่แตะ `TimeLeft` เพราะการใช้ `sr-only` ถูกต้อง

## How it was found
1. UI audit หลังเปลี่ยน shell เจอ overflow เฉพาะ `/my-space` ของสมชาย ที่ 768 / 1280
2. สมมติฐานแรก: layout flex ใหม่ทำให้ container ไม่หด → ตัดทิ้ง: ไล่ chain จาก `<table>` ขึ้นไป ทุก container ≤ 768 และ wrapper เลื่อนตารางภายในปกติ
3. ค้น element ที่ `right > clientWidth` นอกตาราง → ไม่มี · จึงค้น descendant ของตารางที่ `position` เป็น `absolute`/`fixed` → เจอ `span.sr-only "ใกล้ครบกำหนด "` `right = 1056` ตรงกับ `scrollWidth`
4. ยืนยัน: เพิ่ม `relative` ให้ wrapper → audit 45 รอบได้ overflow 0 ขณะที่ call_001 ยังอยู่ในช่วง warning

## Why it slipped through
Workload gap ตามเวลา: overflow เกิดเมื่อมีแถวที่ Time Left เป็น warning · seed data ไม่มีแถวแบบนั้นตอนตรวจ 5.9 · E2E และ component test ไม่วัด `scrollWidth` · audit 5.9 เช็ค overflow จริง แต่รันในช่วงเวลาที่ไม่มีแถว warning

## Validation
- ก่อนแก้: `/my-space` usr_001 overflow 288px (768) / 32px (1280)
- หลังแก้ (call_001 ยังอยู่ในช่วง warning): UI audit 15 หน้า × 3 ขนาดจอ = 45 รอบ overflow 0 ทุกรอบ, console error 0
- `npx tsc -b` ✓ · `npm test` 206 ✓ · `npm run test:e2e` 3 ✓ · `npm run build` ✓
- ยังไม่ได้ตรวจหน้า Search ที่มีผลลัพธ์แถว warning ด้วยตา (ใช้ `CallTable` ตัวเดียวกัน จึงได้การแก้เดียวกัน)

## Action items
- เพิ่ม test ที่ render `CallTable` พร้อมแถว warning (ล็อก `now`) แล้วเช็คว่า sr-only อยู่ใน containing block ของ wrapper — owner n/a, ticket n/a
- ให้ audit script ล็อกเวลา (หรือใช้ fixture ที่มีแถว warning / overdue) เพื่อไม่ให้ผลขึ้นกับเวลาที่รัน — owner n/a, ticket n/a
