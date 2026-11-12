# Requirements Decisions

## Context Summary
- **Type / Scope**: Greenfield · new · โหมด comprehensive (ไม่แบ่ง unit ตามนโยบาย hands-on-project)
- **Stack**: React + Vite (ยืนยันแล้ว OD-1) · TypeScript / Tailwind / localStorage ยังเป็นสมมติฐาน
- **Input**: `initial-requirements/project-requirements/Requirements.md` (DRAFT, ป้าย `[OBS]/[PROP]/[ASM]`) + `database.json` (ข้อมูลสมมติ)
- **ยืนยันแล้วในร่าง**: OD-2 call type (Must: Incident, Service Request · Should: RFC · Nice: Problem, ITSR) · OD-3 approval 2 ขั้น Department → Head (CAB = Nice) · OD-4 AI = agent บน Azure (contract `[TBD]`) · OD-5 4 role
- **ยังเป็นสมมติฐาน**: priority matrix, SLA, state transition, สิทธิ์ของ agent/admin, หน้า Detail ทั้งหมด, AI contract
- **นโยบายที่ผูก**: WCAG 2.2 AA, PDPA (ข้อมูลสมมติเท่านั้น), ห้ามลอก UI ระบบเดิม, ลำดับ task Setup → FE+mock JSON → backend (ถ้าจำเป็น)

---

## Decision Questions

### D1-1: ขอบเขต release แรก
**Question**: requirements รอบนี้ครอบ FR ระดับไหน
- 1) Must อย่างเดียว — เร็วสุด แต่ขาด approval และ My Space ฝั่งแจ้งแทน
- 2) Must + Should — ครบ flow แจ้ง → อนุมัติ → ติดตาม **(Recommended)**
- 3) Must + Should + Nice — รวม Activities, Knowledge, Survey, Problem; งานเพิ่มมาก
- 4) Other (please specify): _______

**Answer**: 2) Must + Should — ครบ flow แจ้ง → อนุมัติ → ติดตาม (recommended)

---

### D1-2: Personas
**Question**: สร้าง personas.md สำหรับ 4 role ไหม
- 1) ใช่ — 4 persona (requestor, approver, agent, admin) ช่วยแยกความต้องการและสิทธิ์ **(Recommended)**
- 2) ใช่ เฉพาะ requestor + agent — 2 role หลัก
- 3) ไม่ — ใช้ permission matrix อย่างเดียว
- 4) Other (please specify): _______

**Answer**: 1) ใช่ — 4 persona (requestor, approver, agent, admin) ช่วยแยกความต้องการและสิทธิ์ (recommended)

---

### D1-3: ขนาดทีม
**Question**: How many developers will work on this project?
- 1) Solo (1 developer) **(Recommended)** — workshop hands-on ปกติทำคนเดียว
- 2) Small team (2–3)
- 3) Medium team (4–8)
- 4) Large team (9+)

**Answer**: 1) Solo (1 developer) (recommended)

---

### D1-4: Priority matrix (Urgency × Impact)
**Question**: ใช้ matrix แบบไหนคำนวณ P1–P4
- 1) ตามตัวอย่างในร่าง (U1×I1=P1, U1×I2=P1, U2×I2=P2, U3×I3=P3, ที่เหลือ P4) — ตามร่างแต่ช่องว่างเยอะไป P4
- 2) matrix 4×4 มาตรฐาน ITIL: P = ceil((U+I)/2) ปัดเป็น P1–P4 — สม่ำเสมอ อธิบายง่าย **(Recommended)**
- 3) เก็บ matrix เป็นข้อมูลใน `database.json` ให้ admin แก้ได้ — ยืดหยุ่นแต่งานเพิ่ม
- 4) Other (please specify): _______

**Answer**: 2) matrix 4×4 มาตรฐาน ITIL: P = ceil((U+I)/2) ปัดเป็น P1–P4 — สม่ำเสมอ อธิบายง่าย (recommended)

---

### D1-5: SLA / Due date
**Question**: กำหนด SLA เพื่อคำนวณ dueDate อย่างไร
- 1) ตาม priority อย่างเดียว ตัวอย่าง P1=4 ชม., P2=1 วัน, P3=3 วัน, P4=5 วัน (นับ 24×7) **(Recommended)** — ง่าย ทดสอบได้
- 2) ตาม priority + นับเฉพาะเวลาทำการ (จ–ศ 08:30–17:30) — สมจริงแต่ logic ซับซ้อน
- 3) ตามหมวดบริการ (slaNote ใน catalog) + เริ่มนับหลัง Head อนุมัติตาม BR-04
- 4) Other (please specify): _______

**Answer**: 1) ตาม priority อย่างเดียว ตัวอย่าง P1=4 ชม., P2=1 วัน, P3=3 วัน, P4=5 วัน (นับ 24×7) (recommended)

---

### D1-6: BR-04 SLA เริ่มนับหลังอนุมัติ
**Question**: Service Request ที่ต้องอนุมัติ เริ่มนับ SLA เมื่อไหร่
- 1) นับจาก openDate เสมอ — ง่าย แต่ขัด BR-04
- 2) นับจากเวลาที่ Head อนุมัติ (ก่อนนั้น Time Left แสดง "รออนุมัติ") **(Recommended)** — ตรง BR-04
- 3) ให้เลือกต่อหมวดบริการ
- 4) Other (please specify): _______

**Answer**: 2) นับจากเวลาที่ Head อนุมัติ (ก่อนนั้น Time Left แสดง "รออนุมัติ") (recommended)

---

### D1-7: State machine
**Question**: ใช้ state transition ตามร่าง §4.4 ไหม
- 1) ใช้ตามร่างทั้งหมด (Incident, Service Request, RFC, Problem) **(Recommended)** — ระบบเดิมไม่แสดง transition ร่างนี้ครอบสถานะที่เห็นจริง
- 2) ใช้ตามร่าง แต่ RFC ตัด CAB ออก (Head Approved → Implementation) เพราะ CAB = Nice
- 3) ลดเหลือชุดเดียวทุก call type (New → In Process → Resolved → Closed)
- 4) Other (please specify): _______

**Answer**: 1) ใช้ตามร่างทั้งหมด (Incident, Service Request, RFC, Problem) (recommended)

---

### D1-8: Re-open window (BR-06)
**Question**: requestor เปิดเรื่องใหม่ได้ภายในกี่วันหลัง Resolved
- 1) 3 วัน
- 2) 7 วัน **(Recommended)** — ค่าที่ใช้บ่อยใน Service Desk
- 3) 14 วัน
- 4) Other (please specify): _______

**Answer**: 2) 7 วัน (recommended)

---

### D1-9: Resolved → Closed
**Question**: เรื่องที่ Resolved ปิด (Closed) อย่างไร
- 1) ปิดอัตโนมัติเมื่อครบ re-open window (คำนวณตอนโหลดข้อมูล) **(Recommended)** — ไม่ต้องมี scheduler
- 2) requestor กดยืนยันปิดเอง
- 3) agent กดปิด
- 4) Other (please specify): _______

**Answer**: 1) ปิดอัตโนมัติเมื่อครบ re-open window (คำนวณตอนโหลดข้อมูล) (recommended)

---

### D1-10: สิทธิ์ของ agent
**Question**: agent เห็นและจัดการเรื่องใดได้
- 1) เฉพาะเรื่องในคิวของกลุ่มที่ตัวเองสังกัด (`groupIds`) **(Recommended)** — ตาม permission matrix + least privilege
- 2) ทุกเรื่องในระบบ
- 3) เฉพาะเรื่องที่ assign ให้ตัวเอง
- 4) Other (please specify): _______

**Answer**: 1) เฉพาะเรื่องในคิวของกลุ่มที่ตัวเองสังกัด (`groupIds`) (recommended)

---

### D1-11: ขอบเขตงาน admin
**Question**: admin จัดการอะไรได้ในรอบนี้
- 1) ไม่มีหน้า admin — แก้ข้อมูลผ่าน `database.json` (admin เห็นทุกเรื่องเหมือน agent ทุกกลุ่ม) **(Recommended)** — admin เป็น `[ASM]` และไม่อยู่ในรายการ Must
- 2) หน้า CRUD catalog + template
- 3) หน้า CRUD catalog + template + ผู้ใช้/กลุ่ม
- 4) Other (please specify): _______

**Answer**: 1) ไม่มีหน้า admin — แก้ข้อมูลผ่าน `database.json` (admin เห็นทุกเรื่องเหมือน agent ทุกกลุ่ม) (recommended)

---

### D1-12: AI Assistant (agent บน Azure)
**Question**: จัดการ FR-110–114 ในรอบนี้อย่างไร เมื่อ contract ยัง `[TBD]`
- 1) เขียน story ครบ แต่ implement ผ่าน interface + mock (rule-based fallback FR-113) ก่อน ต่อ Azure จริงเมื่อได้ contract **(Recommended)** — ไม่บล็อกงานอื่น
- 2) ตัดออกจากรอบนี้ ไว้ phase ถัดไป
- 3) รอ contract ก่อนแล้วค่อยเขียน story
- 4) Other (please specify): _______

**Answer**: 1) เขียน story ครบ แต่ implement ผ่าน interface + mock (rule-based fallback FR-113) ก่อน ต่อ Azure จริงเมื่อได้ contract (recommended)

---

### D1-13: ไฟล์แนบ
**Question**: เก็บไฟล์แนบ (FR-036, FR-062) อย่างไร เมื่อไม่มี backend
- 1) เก็บแค่ metadata (ชื่อ, ขนาด, ชนิด) ไม่เก็บเนื้อไฟล์ **(Recommended)** — localStorage จุได้ ~5MB ไม่พอเก็บไฟล์ 10MB
- 2) เก็บเนื้อไฟล์ใน IndexedDB
- 3) ตัดฟีเจอร์แนบไฟล์
- 4) Other (please specify): _______

**Answer**: 1) เก็บแค่ metadata (ชื่อ, ขนาด, ชนิด) ไม่เก็บเนื้อไฟล์ (recommended)

---

### D1-14: Audit trail (NFR-030)
**Question**: บันทึก who/when/what ของการเปลี่ยนสถานะ/อนุมัติแบบไหน
- 1) ใช้ timeline ของแต่ละ call (FR-061) เป็น audit — event เดียวกัน แสดงใน P6 **(Recommended)**
- 2) แยก audit log กลาง + หน้าดู log สำหรับ admin
- 3) Other (please specify): _______

**Answer**: 1) ใช้ timeline ของแต่ละ call (FR-061) เป็น audit — event เดียวกัน แสดงใน P6 (recommended)

---

### D1-15: ภาษา UI
**Question**: UI รองรับภาษาอะไร
- 1) ไทยอย่างเดียว คงศัพท์ ITIL (call type, status) เป็นอังกฤษ **(Recommended)** — ตาม NFR-010
- 2) ไทย + อังกฤษ สลับได้ (i18n)
- 3) Other (please specify): _______

**Answer**: 1) ไทยอย่างเดียว คงศัพท์ ITIL (call type, status) เป็นอังกฤษ (recommended)

---

## Decisions Summary
<!-- Machine-readable compact summary. Downstream phases: read ONLY this section. -->
<!-- Auto-populated after user fills answers. One line per decision. -->
- D1-1 Release scope: Must + Should (Nice ไว้ phase ถัดไป)
- D1-2 Personas: Yes — 4 personas
- D1-3 Team size: Solo (1 developer)
- D1-4 Priority matrix: Use database.json priorityMatrix (standard) + rfcPriorityMatrix (RFC by urgency) [resolved conflict]
- D1-5 SLA: Use database.json slaHoursByPriority, 24x7: P1=4h, P2=8h, P3=24h, P4=72h [resolved conflict]
- D1-6 SLA start (BR-04): Per-category flag slaStartsAfterApproval (true → start at Head approval; before that show "รออนุมัติ") [resolved conflict]
- D1-7 State machine: Use draft §4.4 as-is (Incident, SR, RFC, Problem)
- D1-8 Re-open window: 7 days
- D1-9 Resolved → Closed: Auto-close when re-open window expires (computed on load)
- D1-10 Agent visibility: Calls in queues of own groups (groupIds)
- D1-11 Admin scope: No admin UI; data via database.json; admin sees all calls like agent of every group
- D1-12 AI Assistant: Write stories; implement via interface + rule-based mock; connect Azure when contract ready
- D1-13 Attachments: Metadata only (name, size, type)
- D1-14 Audit trail: Per-call timeline (FR-061) is the audit
- D1-15 UI language: Thai only, ITIL terms in English

---

**Instructions**: Fill in your answers above and respond with "done"

---

## Validation Notes (2026-11-11)
- Path: "use recommendations"
- 🔴 none · 🟡 none
- 🟢 Compliance (PDPA ตาม data-privacy-policies) → เพิ่ม story ด้าน privacy/security ใน requirements (sanitize rich text, ไม่ log PII, AI ส่งข้อมูลเท่าที่จำเป็น)
- ℹ️ Solo + Must/Should (~35 stories): ไม่เข้า rule "Enterprise Scope Solo" — ลำดับ task ตามนโยบาย hands-on-project คุมการส่งมอบเป็นกลุ่ม
- 🟡 Conflict (resolved by user 2026-11-11): D1-4/D1-5/D1-6 recommended values differed from `database.json` → user chose to follow `database.json` (priorityMatrix, rfcPriorityMatrix, slaHoursByPriority, per-category slaStartsAfterApproval)
