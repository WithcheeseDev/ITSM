# Design Decisions

## Context Summary
- **Project**: ITSM Support Desk · greenfield · scope new · comprehensive · solo developer
- **Requirements**: 34 stories (High 20 / Medium 11 / Low 3) · 4 roles · rules engine (priority, SLA, state machine) · approval 2 ขั้น · AI Assistant ผ่าน interface + mock
- **ยืนยันแล้ว**: React + Vite (OD-1) · ไม่มี backend ใน scope · persist ใน browser · AI agent บน Azure ผ่าน dev proxy, key ใน `.env.local`
- **ตัดสินจาก data แล้ว (ไม่ถามซ้ำ)**: ไอคอน = Lucide (ISC license) เพราะ `serviceCategories[].icon` ใน `database.json` ใช้ชื่อไอคอน Lucide อยู่แล้ว (`ClipboardList`, `AlertTriangle`, …)
- **นโยบายที่ผูก**: design-system-policies (CSS variables เท่านั้น, ฟอนต์/ไอคอนปลอดลิขสิทธิ์, ห้ามอิโมจิ, light mode default, WCAG 2.2 AA, responsive) · UI default ของ user: sidebar แบน ทุกหน้าอยู่ระดับบน, filter เป็น chip · security (sanitize, ไม่มี secret ใน frontend) · PDPA (ข้อมูลสมมติ, ไม่ log PII)
- **Design system checklist ส่วนที่ไม่อยู่ในคำถามนี้** (spacing, radius, shadow, motion, breakpoints, ขนาดโลโก้/ไอคอน, page blueprint): จะเสนอค่าแนะนำใน `design-system.md` ให้ยืนยันตอนอนุมัติ design

---

## Decision Questions

### D3-1: ภาษา
**Question**: เขียน frontend ด้วยภาษาอะไร
- 1) TypeScript (strict) — จับ bug ของ rules engine และ data shape ตอน compile **(Recommended)**
- 2) JavaScript — เริ่มเร็วกว่า แต่ไม่มี type check
- 3) Other (please specify): _______

**Answer**: TypeScript (strict) — จับ bug ของ rules engine และ data shape ตอน compile (recommended)

---

### D3-2: Data layer และการ persist
**Question**: เก็บข้อมูล (seed จาก `database.json` + สิ่งที่ผู้ใช้บันทึก) อย่างไร
- 1) Repository layer บน localStorage (interface `findAll/findById/create/update`) — ตาม requirements, ภายหลังเปลี่ยนเป็น API จริงได้โดยไม่แก้ UI **(Recommended)**
- 2) IndexedDB (ผ่าน Dexie) — จุมากกว่า แต่ซับซ้อนกว่าที่ต้องใช้ (ไม่เก็บเนื้อไฟล์แล้ว)
- 3) Mock REST API (json-server / MSW) — ใกล้ของจริง แต่ต้องรัน server เพิ่ม
- 4) Other (please specify): _______

**Answer**: Repository layer บน localStorage (interface `findAll/findById/create/update`) — ตาม requirements, ภายหลังเปลี่ยนเป็น API จริงได้โดยไม่แก้ UI (recommended)

---

### D3-3: State management
**Question**: จัดการ state ข้าม component (session, ข้อมูล call, การเลือกคอลัมน์) อย่างไร
- 1) Zustand + persist middleware — เล็ก, ต่อ localStorage ได้ในตัว **(Recommended)**
- 2) React Context + useReducer — ไม่มี dependency เพิ่ม แต่ต้องเขียน persist และ selector เอง
- 3) Redux Toolkit — ครบแต่ boilerplate มากเกินขนาดงาน
- 4) Other (please specify): _______

**Answer**: Zustand + persist middleware — เล็ก, ต่อ localStorage ได้ในตัว (recommended)

---

### D3-4: Routing
**Question**: ใช้ router อะไร
- 1) React Router — มาตรฐาน, รองรับ route guard สำหรับ default-deny **(Recommended)**
- 2) TanStack Router — type-safe route params แต่ทีมคุ้นน้อยกว่า
- 3) Other (please specify): _______

**Answer**: React Router — มาตรฐาน, รองรับ route guard สำหรับ default-deny (recommended)

---

### D3-5: UI styling และ component library
**Question**: สร้าง UI ด้วยอะไร (ต้องผูกกับ CSS variables ตามนโยบาย)
- 1) Tailwind CSS + shadcn/ui (Radix primitives) อ่านสีจาก CSS variables — accessible component (dialog, dropdown, tabs) พร้อมใช้ ตรงกับ skill `ui-styling` **(Recommended)**
- 2) CSS Modules + เขียน component เอง — คุมเต็มที่ แต่ต้องทำ a11y ของ dialog/dropdown เอง
- 3) MUI — component ครบ แต่หน้าตาออก Material และ override token ยาก
- 4) Other (please specify): _______

**Answer**: Tailwind CSS + shadcn/ui (Radix primitives) อ่านสีจาก CSS variables — accessible component (dialog, dropdown, tabs) พร้อมใช้ ตรงกับ skill `ui-styling` (recommended)

---

### D3-6: Form และ validation
**Question**: จัดการฟอร์ม Add Support Call (หลาย section, validation ตาม §4.5) อย่างไร
- 1) React Hook Form + Zod — schema เดียวใช้ทั้ง validate ฟอร์มและตรวจข้อมูลจาก localStorage **(Recommended)**
- 2) Native controlled form + validate function เอง — ไม่มี dependency แต่โค้ดซ้ำเยอะ
- 3) Formik + Yup
- 4) Other (please specify): _______

**Answer**: React Hook Form + Zod — schema เดียวใช้ทั้ง validate ฟอร์มและตรวจข้อมูลจาก localStorage (recommended)

---

### D3-7: Rich text editor (Notes)
**Question**: ใช้ editor อะไรสำหรับ Notes (bold/italic/underline/list/table) และ sanitize อย่างไร
- 1) Tiptap + DOMPurify ตอน render — headless, คุม toolbar ให้ accessible ได้ **(Recommended)**
- 2) Quill + DOMPurify — สำเร็จรูป แต่ปรับหน้าตา/a11y ยาก
- 3) textarea ธรรมดา (plain text) — ง่ายสุด แต่ไม่ตรง requirement rich text
- 4) Other (please specify): _______

**Answer**: Tiptap + DOMPurify ตอน render — headless, คุม toolbar ให้ accessible ได้ (recommended)

---

### D3-8: AI Assistant proxy
**Question**: เรียก Azure agent ผ่านอะไร เพื่อไม่ให้ key อยู่ใน frontend
- 1) Vite dev server proxy (`server.proxy`) อ่าน key จาก `.env.local` — ไม่ต้องมี server แยก ตรงกับร่าง requirements **(Recommended)**
- 2) Express BFF เล็ก ๆ แยก process — ใช้ต่อ production ได้ แต่เพิ่มงาน
- 3) Other (please specify): _______

**Answer**: Vite dev server proxy (`server.proxy`) อ่าน key จาก `.env.local` — ไม่ต้องมี server แยก ตรงกับร่าง requirements (recommended)

---

### D3-9: Code organization
**Question**: จัดโครงโค้ดแบบไหน
- 1) Feature-based (`features/catalog`, `features/calls`, `features/approvals`, …) + `domain/` สำหรับ pure functions (priority, SLA, state machine) + `data/` สำหรับ repository **(Recommended)** — แยก logic ทดสอบง่าย
- 2) Layer-based (`components/`, `pages/`, `services/`, `utils/`)
- 3) Other (please specify): _______

**Answer**: Feature-based (`features/catalog`, `features/calls`, `features/approvals`, …) + `domain/` สำหรับ pure functions (priority, SLA, state machine) + `data/` สำหรับ repository — แยก logic ทดสอบง่าย (recommended)

---

### D3-10: Testing
**Question**: ทดสอบด้วยอะไร (นโยบายให้ test อยู่ท้าย/optional แต่ต้อง verify ว่าใช้งานได้จริง)
- 1) Vitest + Testing Library สำหรับ domain logic และ component หลัก + Playwright smoke test flow หลัก 3 flow **(Recommended)**
- 2) Vitest อย่างเดียว + ทดสอบ UI ด้วยมือ
- 3) Jest + Cypress
- 4) Other (please specify): _______

**Answer**: Vitest + Testing Library สำหรับ domain logic และ component หลัก + Playwright smoke test flow หลัก 3 flow (recommended)

---

### D3-11: Correctness & Property-Based Testing
**Question**: ยืนยันความถูกต้องของ rules engine (priority, SLA/due date, state machine, visibility) อย่างไร
- 1) Property-based test ด้วย fast-check บน pure functions (เช่น priority อยู่ใน P1–P4 เสมอ, transition ผิดถูกปฏิเสธเสมอ, requestor ไม่เห็นเรื่องคนอื่น) + example test **(Recommended)**
- 2) Example-based unit test อย่างเดียว
- 3) ไม่ทำ formal correctness — ทดสอบมือ
- 4) Other (please specify): _______

**Answer**: Property-based test ด้วย fast-check บน pure functions (เช่น priority อยู่ใน P1–P4 เสมอ, transition ผิดถูกปฏิเสธเสมอ, requestor ไม่เห็นเรื่องคนอื่น) + example test (recommended)

---

### D3-12: Observability Strategy
**Question**: What level of observability does this service need?
- 1) Minimal — structured logging + health endpoint (sufficient for internal tools, dev projects) **(Recommended)** — solo, รัน local
- 2) Standard — logging + metrics + health + readiness
- 3) Full — logging + metrics + distributed tracing + alerting + dashboards
- 4) None — skip observability entirely (prototype only)
- 5) Other (please specify): _______

**Answer**: Minimal — structured logging + health endpoint (sufficient for internal tools, dev projects) — solo, รัน local (recommended)

---

### D3-13: Error Tracking
**Question**: How should runtime errors be captured and reported?
- 1) Log-based only — React error boundary + logger กลางที่ตัด PII ออกก่อนเขียน console **(Recommended)**
- 2) Dedicated error tracking service — Sentry / Datadog / Rollbar
- 3) Cloud-native — Azure Monitor
- 4) None — no error tracking beyond basic logging
- 5) Other (please specify): _______

**Answer**: Log-based only — React error boundary + logger กลางที่ตัด PII ออกก่อนเขียน console (recommended)

---

### D3-14: Health & Lifecycle Management
**Question**: What lifecycle management does the service need?
- 1) Basic health endpoint only — เพิ่ม `/api/health` ใน dev proxy เพื่อเช็คว่า AI proxy พร้อม
- 2) Health + readiness + graceful shutdown
- 3) Health + readiness + graceful shutdown + startup probe + drain delay
- 4) ไม่มี — SPA รันบน Vite dev server ไม่มี server ของตัวเอง **(Recommended)** — ไม่มี container/orchestrator
- 5) Other (please specify): _______

**Answer**: ไม่มี — SPA รันบน Vite dev server ไม่มี server ของตัวเอง — ไม่มี container/orchestrator (recommended)

---

### D3-15: ทิศทางสีแบรนด์ (Design system §2.1)
**Question**: โครงการไม่มีแบรนด์/palette ให้มา ใช้สีหลักแนวไหน (ห้ามลอกระบบเดิม)
- 1) Indigo-blue (primary) + teal (accent) บนพื้น neutral อุ่น — สื่อความน่าเชื่อถือแบบระบบงานภายใน คอนทราสต์ผ่าน AA ง่าย **(Recommended)**
- 2) Teal-green (primary) + amber (accent) — ดูเป็นมิตร แตกต่างจากระบบ IT ทั่วไป
- 3) Slate/graphite (primary) + violet (accent) — เรียบ ดูมืออาชีพ แต่ระวังจืด
- 4) Other (please specify — ระบุ hex ถ้ามี): _______

**Answer**: Indigo-blue (primary) + teal (accent) บนพื้น neutral อุ่น — สื่อความน่าเชื่อถือแบบระบบงานภายใน คอนทราสต์ผ่าน AA ง่าย (recommended)

---

### D3-16: Typography (Design system §2.3)
**Question**: ใช้ฟอนต์อะไร (ต้อง OFL และรองรับไทย + อังกฤษ)
- 1) IBM Plex Sans Thai + IBM Plex Sans — ครอบไทย/อังกฤษชุดเดียวกัน อ่านง่ายในตาราง ตัวเลขชัด **(Recommended)**
- 2) Noto Sans Thai + Inter — กลาง ๆ, Inter เด่นเรื่องตัวเลขในตาราง
- 3) Sarabun — คุ้นตาในเอกสารราชการ/องค์กรไทย แต่ดูทางการ
- 4) Other (please specify): _______

**Answer**: IBM Plex Sans Thai + IBM Plex Sans — ครอบไทย/อังกฤษชุดเดียวกัน อ่านง่ายในตาราง ตัวเลขชัด (recommended)

---

## Decisions Summary
<!-- Machine-readable compact summary. Downstream phases: read ONLY this section. -->
<!-- Auto-populated after user fills answers. One line per decision. -->
- D3-1 Language: TypeScript strict
- D3-2 Data layer: Repository layer on localStorage (findAll/findById/create/update)
- D3-3 State: Zustand + persist middleware
- D3-4 Routing: React Router (route guards for default-deny)
- D3-5 UI styling: Tailwind CSS + shadcn/ui (Radix), colors from CSS variables
- D3-6 Forms: React Hook Form + Zod
- D3-7 Rich text: Tiptap + DOMPurify on render
- D3-8 AI proxy: Vite dev server proxy, key in .env.local
- D3-9 Code organization: Feature-based + domain/ (pure functions) + data/ (repositories)
- D3-10 Testing: Vitest + Testing Library + Playwright smoke (3 core flows)
- D3-11 Correctness/PBT: fast-check property-based tests on domain pure functions + example tests
- D3-12 Observability: Minimal
- D3-13 Error tracking: Log-based: React error boundary + PII-stripping logger
- D3-14 Health/lifecycle: None — SPA on Vite dev server, no own server
- D3-15 Brand color: Indigo-blue primary + teal accent on warm neutral
- D3-16 Typography: IBM Plex Sans Thai + IBM Plex Sans

---

**Instructions**: Fill in your answers above and respond with "done"

---

## Validation Notes (2026-11-11)
- Path: "use recommendations" (user: เอา recommendation ทั้งหมด)
- Checked: Technology Compatibility, Security, Workflow & Cost, Operations
- 🔴 none · 🟡 none
- 🟢 D3-12 Minimal ปกติรวม health endpoint แต่ D3-14 = ไม่มี server → Minimal = structured logging (PII-stripped) อย่างเดียว; AI proxy อยู่ใน Vite dev server
- ✅ API key ไม่อยู่ใน client (D3-8 proxy) — ผ่าน rule "API Keys in Client-Side Code"

## Add-on

### 2026-11-13 — D3-15 rev: โทนแดง-ขาว (change request)
- **คำขอ**: ผู้ใช้ขอปรับ design เป็นสีแดง-ขาว "เหมือน CIMB" → ยืนยันแล้วว่าเอาแค่โทนแดง-ขาว ไม่ใช้แบรนด์ CIMB (HARD RULE #9, Requirements §1.2)
- **Decision** ("use recommendations"):
  1. Primary crimson `#B0142A` / hover `#8E1022` / active `#6F0C1A` / soft `#FDEDEF` (ขาวบน primary 7.05:1)
  2. แดงเต็มพื้นเฉพาะปุ่มหลัก · ปุ่ม destructive = ขอบแดง + icon `CircleX` (primary กับ destructive ต่างกันแค่ 1.28:1)
  3. Accent charcoal `#2E3440` (12.49:1) · neutral เย็น page `#FAFAFA`
- **แทนที่**: D3-15 เดิม (indigo + teal บน neutral อุ่น)
- **Sync**: `.claude/rules/design-system.md` §1, §2, §6, §9 · `src/styles/tokens.css`
