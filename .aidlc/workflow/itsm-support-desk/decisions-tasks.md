# Tasks Decisions

## Context Summary
- **Design**: 15 components · 13 entities · HTTP 1 endpoint (`POST /api/ai/assist`) + in-process service API · 1 integration (Azure AI, contract `[TBD]`)
- **Stack (D3)**: React + Vite + TypeScript, Zustand, React Router, Tailwind v4 + shadcn/ui, RHF + Zod, Tiptap + DOMPurify, Vitest + Testing Library + fast-check + Playwright
- **Requirements**: 34 stories (High 20 / Medium 11 / Low 3) · solo developer
- **นโยบายที่ผูก** (`hands-on-project-policies.md`): ลำดับกลุ่ม 1) Setup (`git init -b main` + `.gitignore`) → 2) Frontend + mock JSON → 3) Backend (เฉพาะถ้าต้องมี — โครงการนี้ไม่มี) → 4) อื่น ๆ ตาม dependency → 5) ส่วนเสริม + Test/Verify → 6) Deploy (optional) · ทำทีละ task · หยุดรอยืนยันทุกจบกลุ่ม · ติ๊ก `[x]` ใน tasks.md · verify build/dev ทุกจบกลุ่ม
- **Design system**: tokens.css + design-system.md มีแล้ว · implement UI ตามลำดับ skill `design-system` → `ui-ux-pro-max` (ตรวจ UX) → `ui-styling`

---

## Decision Questions

### D4-1: Task breakdown strategy
**Question**: จัดกลุ่ม task แบบไหน
- 1) ตามกลุ่มของนโยบาย (Setup → FE + mock data → ส่วนอื่น → Test → Deploy) แล้วเรียง feature ตาม dependency ในแต่ละกลุ่ม **(Recommended)** — ตรงนโยบาย และเห็นหน้าเว็บจริงเร็ว
- 2) Vertical slice ต่อ story (UI + logic + test ใน task เดียว)
- 3) ตาม layer (domain ทั้งหมด → data → UI ทั้งหมด)
- 4) Other (please specify): _______

**Answer**: ตามกลุ่มของนโยบาย (Setup → FE + mock data → ส่วนอื่น → Test → Deploy) แล้วเรียง feature ตาม dependency ในแต่ละกลุ่ม — ตรงนโยบาย และเห็นหน้าเว็บจริงเร็ว (recommended)

---

### D4-2: Implementation approach
**Question**: เขียน test เมื่อไร
- 1) Domain pure functions (priority, SLA, state machine, access) มี unit test ใน task เดียวกับโค้ด · UI/E2E/PBT อยู่กลุ่ม Test ตอนท้าย **(Recommended)** — rules engine ผิดแล้วกระทบทุกหน้า แต่ไม่ขัดนโยบายที่ให้ test อยู่ท้าย
- 2) TDD ทุก task
- 3) Test-after ทั้งหมดในกลุ่มท้าย
- 4) Other (please specify): _______

**Answer**: Domain pure functions (priority, SLA, state machine, access) มี unit test ใน task เดียวกับโค้ด · UI/E2E/PBT อยู่กลุ่ม Test ตอนท้าย — rules engine ผิดแล้วกระทบทุกหน้า แต่ไม่ขัดนโยบายที่ให้ test อยู่ท้าย (recommended)

---

### D4-3: Component priority ในกลุ่ม Frontend
**Question**: สร้างหน้าตามลำดับไหน
- 1) Shell + data + domain → flow requestor (Login → Catalog → Call Form → Detail → My Space) → flow agent (Search, assign/status) → Approvals → AI Assistant **(Recommended)** — ตาม Flow 1–3 ใน requirements, ได้ demo end-to-end เร็วสุด
- 2) ทุกหน้าแบบ static ก่อน แล้วค่อยต่อ logic
- 3) เริ่มจาก Search/Detail (ฝั่ง agent) ก่อน
- 4) Other (please specify): _______

**Answer**: Shell + data + domain → flow requestor (Login → Catalog → Call Form → Detail → My Space) → flow agent (Search, assign/status) → Approvals → AI Assistant — ตาม Flow 1–3 ใน requirements, ได้ demo end-to-end เร็วสุด (recommended)

---

### D4-4: Integration strategy (Azure AI)
**Question**: จัดการ Azure agent ระหว่างพัฒนาอย่างไร
- 1) ทำ `AiAssistant` interface + rule-based ก่อน · task Azure adapter + proxy config เป็น task แยกที่ทำได้เมื่อได้ contract (ระหว่างนี้ mark blocked) **(Recommended)** — ตาม D1-12
- 2) ทำ Azure adapter เดาตาม contract ฝั่งแอปไปก่อน
- 3) ตัด AI ออกจากรอบนี้
- 4) Other (please specify): _______

**Answer**: ทำ `AiAssistant` interface + rule-based ก่อน · task Azure adapter + proxy config เป็น task แยกที่ทำได้เมื่อได้ contract (ระหว่างนี้ mark blocked) — ตาม D1-12 (recommended)

---

### D4-5: Testing tasks
**Question**: กลุ่ม Test มี task อะไรบ้าง
- 1) PBT 12 properties + unit test service (C8, C14) + component test หลัก + Playwright smoke 3 flow + ตรวจ a11y/responsive ที่ 375/768/1280 **(Recommended)** — ตาม testing-strategy.md และ Definition of Done
- 2) Unit + PBT เท่านั้น ตรวจ UI ด้วยมือ
- 3) ไม่มี test task (prototype)
- 4) Other (please specify): _______

**Answer**: PBT 12 properties + unit test service (C8, C14) + component test หลัก + Playwright smoke 3 flow + ตรวจ a11y/responsive ที่ 375/768/1280 — ตาม testing-strategy.md และ Definition of Done (recommended)

---

### D4-6: Task granularity
**Question**: ขนาดต่อ task
- 1) Single-concern ~0.5–1 วัน (เช่น "Call Form: Contact + Priority sections") พร้อม Files / Depends on / Validate ต่อ task **(Recommended)** — ติ๊ก `[x]` ได้บ่อย, รีวิวง่าย
- 2) Atomic (ไฟล์เดียวต่อ task) — task เยอะเกิน
- 3) Multi-concern (1 หน้า = 1 task)
- 4) Other (please specify): _______

**Answer**: Single-concern ~0.5–1 วัน (เช่น "Call Form: Contact + Priority sections") พร้อม Files / Depends on / Validate ต่อ task — ติ๊ก `[x]` ได้บ่อย, รีวิวง่าย (recommended)

---

### D4-7: Parallel work
**Question**: รัน task แบบไหน
- 1) ทีละ task ตามลำดับ หยุดรอยืนยันทุกจบกลุ่ม **(Recommended)** — นโยบายสั่ง "ทำทีละ task"
- 2) Parallel waves (subagent ทำ task ที่ไฟล์ไม่ทับกันพร้อมกัน) ภายในกลุ่ม แล้วหยุดรอยืนยันทุกจบกลุ่ม
- 3) Other (please specify): _______

**Answer**: ทีละ task ตามลำดับ หยุดรอยืนยันทุกจบกลุ่ม — นโยบายสั่ง "ทำทีละ task" (recommended)

---

### D4-8: Deploy
**Question**: กลุ่ม Deploy (optional ตามนโยบาย) ทำอะไร
- 1) ไม่ทำรอบนี้ — ส่งมอบเป็น local dev + `npm run build` ผ่าน **(Recommended)** — D3 ไม่มี hosting/CI
- 2) Static build + `vite preview` + README วิธีรัน
- 3) Deploy ไป static hosting (ต้องตัดสิน hosting เพิ่ม)
- 4) Other (please specify): _______

**Answer**: ไม่ทำรอบนี้ — ส่งมอบเป็น local dev + `npm run build` ผ่าน — D3 ไม่มี hosting/CI (recommended)

---

## Decisions Summary
<!-- Machine-readable compact summary. Downstream phases: read ONLY this section. -->
<!-- Auto-populated after user fills answers. One line per decision. -->
- D4-1 Breakdown: Policy groups (Setup → FE+mock → other → Test → Deploy), features by dependency inside group
- D4-2 Approach: Domain pure functions get unit tests in same task; UI/E2E/PBT in Test group
- D4-3 Priority: Shell+data+domain → requestor flow (Login, Catalog, Form, Detail, My Space) → agent flow (Search, assign/status) → Approvals → AI
- D4-4 AI integration: AiAssistant interface + rule-based first; Azure adapter separate task, blocked until contract
- D4-5 Testing tasks: PBT 12 + service unit + key component tests + Playwright smoke 3 flows + a11y/responsive check 375/768/1280
- D4-6 Granularity: Single-concern ~0.5–1 day with Files / Depends on / Validate
- D4-7 Parallel: Sequential, one task at a time, stop for confirmation at end of each group
- D4-8 Deploy: Skip this round; deliver local dev + npm run build passing

---

**Instructions**: Fill in your answers above and respond with "done"

---

## Validation Notes (2026-11-12)
- Path: "use recommendations"
- 🔴 none — test tasks + E2E tasks will be generated (rules "Testing Framework Without Test Tasks", "E2E Framework Without E2E Tasks" satisfied)
- 🟡 Task Count vs Capacity: expected ~30 tasks, solo, sequential → accepted: นโยบายสั่งทำทีละ task และหยุดทุกจบกลุ่ม (resolution option 4 Keep, justified by policy)
- ℹ️ No DB/ORM, no cloud IaC, no CI/CD in D3 → no migration/infra/pipeline tasks needed
