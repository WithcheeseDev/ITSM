# Tasks — itsm-support-desk

## Summary
- **Total tasks**: 32 ใน 5 phase ที่ทำงานจริง (+ Phase 3 Backend = N/A, Phase 6 Deploy = ข้าม)
- **Waves**: 4 waves ต่อกัน (ไม่มี parallel — D4-7) · หยุดรอยืนยันทุกจบ phase
- **Strategy**: ตามกลุ่มของนโยบาย hands-on-project, ใน phase เรียง feature ตาม dependency (D4-1, D4-3)
- **Testing**: unit test ของ domain อยู่ใน task เดียวกับโค้ด · PBT / service / component / E2E / a11y อยู่ Phase 5 (D4-2, D4-5)
- **Derived from**: `design.md` + `design/*`, `requirements.md`, `.claude/rules/design-system.md`, `decisions-tasks.md`

## Overview
- **ทำไมเรียงแบบนี้**: Phase 1 วางโครงให้ `npm run dev` ขึ้นก่อน → Phase 2 ทำ flow ของ requestor ครบด้วยข้อมูลจาก `database.json` (= mock JSON ตามนโยบาย) ให้เห็นหน้าเว็บจริงเร็ว → Phase 4 ต่อ flow agent / approver / AI → Phase 5 test และ verify
- **Legend**: `[ ]` ยังไม่ทำ · `[x]` เสร็จ · ⛔ blocked
- **ทุก task**: อ่าน spec/requirements ที่ `Ref` ก่อนลงมือ (Pre-Implementation Check) · งานนอก scope → แจ้งผู้ใช้ก่อน แล้วบันทึกใต้หัวข้อ `Add-on` ของไฟล์ที่เกี่ยวข้อง
- **UI tasks**: ใช้ token จาก `src/styles/tokens.css` เท่านั้น · ลำดับ skill: `design-system` (ยืนยัน token) → `ui-ux-pro-max` (ตรวจ UX) → `ui-styling` (implement)
- **ห้าม commit/push เอง** — รอผู้ใช้สั่ง

---

- [x] 1. Setup / โครงสร้างพื้นฐาน (Wave 1)
  - [x] 1.1 git init และไฟล์ ignore / env ตัวอย่าง
    - **Deps**: — | **Ref**: design/implementation.md — Directory Structure; hands-on-project-policies — Task Execution Order ข้อ 1
    - `git init -b main` ที่ root · `.gitignore` (node_modules, dist, coverage, playwright-report, test-results, `.env.local`, `.DS_Store`) · `.env.example` ตาม Environment Variables (ค่า placeholder)
    - **Files**: `.gitignore`, `.env.example`
    - **Validate**: `git status` แสดง repo บน branch main · `.env.local` ถูก ignore
  - [x] 1.2 Scaffold Vite + React + TypeScript และ dependency
    - **Deps**: 1.1 | **Ref**: design/implementation.md — Technology Stack, Scripts
    - สร้างโปรเจกต์ React + TS (strict) · ติดตั้ง dependency ตาม version ใน implementation.md (pin exact) · scripts dev/build/preview/test/test:e2e/typecheck · `vitest.config.ts` (jsdom) ขั้นต่ำเพื่อให้ task ใน Phase 2 เขียน unit test ได้
    - **Files**: `package.json`, `package-lock.json`, `tsconfig*.json`, `vite.config.ts`, `vitest.config.ts`, `index.html`, `src/main.tsx`
    - **Validate**: `npm run build` ผ่าน · `npm run dev` เปิด http://localhost:5173 ได้ · `npm test` รันได้ (0 test ไม่ error)
  - [x] 1.3 Tailwind v4 + design tokens + ฟอนต์ + shadcn/ui
    - **Deps**: 1.2 | **Ref**: .claude/rules/design-system.md §3, §6; design/components.md — C12
    - `src/styles/globals.css`: import tailwind + `tokens.css` + `@theme inline` map semantic token ทั้งหมด · import @fontsource IBM Plex Sans Thai / Sans (400/500/600) · base styles (body bg/fg, line-height, focus-visible) · shadcn init (`components.json`) + เพิ่ม Button, Input, Select, Dialog, AlertDialog, Popover, Command, Tabs, Table, Badge, Toast/Sonner, Checkbox, RadioGroup, Tooltip, Sheet, Label, Textarea · ตรวจว่า component อ่านสีจาก token ไม่มี hex
    - **Files**: `src/styles/globals.css`, `components.json`, `src/shared/ui/*`, `src/lib/utils.ts`
    - **Validate**: หน้า test ชั่วคราวแสดงปุ่ม primary สี indigo + ฟอนต์ Plex Thai · `node .claude/skills/design-system/scripts/validate-tokens.cjs --dir src/` ไม่เจอ hardcode ใน component
  - [x] 1.4 Logger, ErrorBoundary, sanitizer
    - **Deps**: 1.2 | **Ref**: design/components.md — C11, C13; design/operations.md — Sensitive Data Rules
    - `logger` ตัด key deny-list (name, email, phone, summary, notes, text, comment, key) · ErrorBoundary แสดงหน้า "เกิดข้อผิดพลาด" + ปุ่มกลับ My Space · `sanitizeHtml` (DOMPurify allow-list tag ของ editor) + `htmlToText` · unit test ของ logger และ sanitize แบบ example
    - **Files**: `src/shared/logger.ts`, `src/shared/ErrorBoundary.tsx`, `src/shared/sanitize.ts`, `tests/unit/shared/*`
    - **Validate**: `npm test -- tests/unit/shared` ผ่าน
  - [x] 1.5 App shell, layout และ route skeleton
    - **Deps**: 1.3, 1.4 | **Ref**: design/components.md — C1; design-system.md §7 Shell, §8
    - AppLayout (header 56px, sidebar 240px แบน + drawer < lg, UserMenu placeholder) · route table ทุกหน้า (placeholder page) พร้อม field `permission` · `vite.config.ts` เพิ่ม proxy `/api/ai/assist` อ่านจาก `loadEnv` (ยังไม่ใช้งาน) · wordmark โลโก้ SVG ของ product
    - **Files**: `src/app/*`, `src/app/layout/*`, `src/assets/logo.svg`, `vite.config.ts`
    - **Validate**: `npm run build` + `npm run dev` · คลิกเมนูครบทุกหน้า · resize 375/1280 sidebar สลับ drawer ได้ · console ไม่มี error
  - [x] **จบ Phase 1**: verify build/dev → ติ๊ก `[x]` → **หยุดรอผู้ใช้ยืนยัน** (verified 2026-11-12)

- [x] 2. Core features — Frontend + Mock data (Wave 2)
  - [x] 2.1 Domain types, Zod schemas และ data layer
    - **Deps**: 1.2 | **Ref**: design/data-model.md (ทั้งไฟล์); design/components.md — C10; design/api-spec.md — Data Layer
    - copy `initial-requirements/project-requirements/database.json` → `src/data/database.json` · `types.ts` ของทุก entity · Zod schemas · `storage.ts` (load seed เมื่อไม่มี key / parse fail → แจ้ง + reset, `schemaVersion: 1`, จัดการ quota เต็ม) · `repositories.ts` (Repository<T>, `commit`, `resetToSeed`) · derive `resolvedAt` จาก history เมื่อไม่มี · unit test storage/commit
    - **Files**: `src/domain/types.ts`, `src/data/*`, `tests/unit/data/*`
    - **Validate**: `npm test -- tests/unit/data` ผ่าน · `npm run typecheck`
    - **Stories**: US-001
  - [x] 2.2 Rules engine: priority, SLA / Time Left, เลข ticket
    - **Deps**: 2.1 | **Ref**: design/components.md — C4; design/data-model.md — Business Rules 1, 2, 6
    - `calcPriority`, `calcDueDate`, `timeLeft` (รูป "X days hh:mm", ติดลบ, รออนุมัติ, `< 25%` = ใกล้ครบ), `nextNumber` · อ่าน matrix/SLA จาก dataset · `now` เป็น argument · unit test example (รวมกรณี RFC, BR-02, ข้ามวัน)
    - **Files**: `src/domain/priority.ts`, `src/domain/sla.ts`, `src/domain/numbering.ts`, `tests/unit/domain/priority.test.ts`, `sla.test.ts`, `numbering.test.ts`
    - **Validate**: `npm test -- tests/unit/domain` ผ่าน
    - **Stories**: US-005, US-006, US-008
  - [x] 2.3 Rules engine: state machine และ access control
    - **Deps**: 2.1 | **Ref**: design/components.md — C3, C4; requirements §4.4; design/api-spec.md — ผลของ decide
    - transition table ตาม §4.4 ทุก call type + `initialStatus` (SR ที่มี requiresApproval → Waiting For Approve) + `assertTransition` + `isClosed` + `shouldAutoClose(7 วัน)` · `can`, `canViewCall`, `filterVisibleCalls`, `availableActions` (default-deny) · unit test example
    - **Files**: `src/domain/stateMachine.ts`, `src/domain/access.ts`, `tests/unit/domain/stateMachine.test.ts`, `access.test.ts`
    - **Validate**: `npm test -- tests/unit/domain` ผ่าน
    - **Stories**: US-003, US-004, US-007
  - [x] 2.4 Session, Login และ route guard
    - **Deps**: 1.5, 2.1, 2.3 | **Ref**: design/components.md — C1, C2; design-system.md §7 Login
    - Zustand `sessionStore` (persist `itsm.session` เก็บแค่ userId) · LoginPage (รายชื่อ + role badge, ปุ่ม 44px, หมายเหตุข้อมูลสมมติ) · `RequirePermission` (ไม่มี session → /login, ไม่มีสิทธิ์ → /my-space + toast) · UserMenu ออกจากระบบ · sidebar ซ่อนเมนูที่ไม่มีสิทธิ์ · ปุ่ม "รีเซ็ตข้อมูลตัวอย่าง" ใน UserMenu
    - **Files**: `src/features/auth/*`, `src/app/RequirePermission.tsx`, `src/app/layout/UserMenu.tsx`, `src/app/layout/Sidebar.tsx`
    - **Validate**: login ด้วยแต่ละ role · requestor เปิด `/approvals` ตรง ๆ → ถูกพากลับพร้อมข้อความ · logout กลับ /login
    - **Stories**: US-002, US-003
  - [x] 2.5 Shared call components
    - **Deps**: 1.3, 2.2 | **Ref**: design/components.md — C12; design-system.md §4, §6
    - `StatusBadge` (6 กลุ่ม icon + label), `PriorityBadge`, `TimeLeft`, `EmptyState`, `FilterChips`, `CallTable` (8 คอลัมน์ default, เลือกคอลัมน์ จำต่อผู้ใช้ `itsm.columns.{userId}`, คงอย่างน้อย Number, คลิกแถว/Enter เปิด Detail, < md แสดงเป็น list การ์ด), `icons.ts` allow-list Lucide
    - **Files**: `src/shared/components/*`, `src/shared/icons.ts`
    - **Validate**: `npm run build` · หน้า test ชั่วคราวแสดงทุก badge · keyboard tab ถึงแถวตาราง
    - **Stories**: US-011 (+ ส่วนแสดงผลของ US-006, US-009, US-022)
  - [x] 2.6 Call Service: สร้างและอ่าน Support Call
    - **Deps**: 2.2, 2.3 | **Ref**: design/api-spec.md — Call Service (`createCall`, `listVisibleCalls`, `getCall`), Approval Service; design/components.md — C8, C14
    - `createCall` (ตรวจสิทธิ์ + on behalf, priority, initialStatus, dueDate / null เมื่อรออนุมัติ, nextNumber, คิว/กลุ่มจาก template, history `created`, commit ครั้งเดียว) · `createApprovals` (Department = managerId ของ requestor, Head = managerId ของ Department approver, ไม่พบ → APPROVER_NOT_FOUND) · `listVisibleCalls`, `getCall` · `runAutoClose` เรียกตอนโหลด
    - **Files**: `src/features/calls/callService.ts`, `src/features/approvals/approvalService.ts`
    - **Validate**: `npm run typecheck` · เรียกจาก console dev สร้าง call ได้และเห็นใน localStorage
    - **Stories**: US-004, US-014, US-018, US-028 (auto-close)
  - [x] 2.7 Service Catalog
    - **Deps**: 2.4, 2.5 | **Ref**: design/components.md — C6; design-system.md §7 Service Catalog
    - grid การ์ดหมวดบน (icon, ชื่อ, คำอธิบาย, slaNote) 1/2/3/4 คอลัมน์ · `/catalog/:categoryId` breadcrumb + หมวดย่อย · ตารางบริการ (mobile = list) + ปุ่ม "Request this service" → `/calls/new?service=` · empty "ยังไม่มีบริการในหมวดนี้"
    - **Files**: `src/features/catalog/*`
    - **Validate**: เดินจากหมวดบน → หมวดย่อย → บริการ → ฟอร์มได้ · breadcrumb กลับได้
    - **Stories**: US-012, US-013
  - [x] 2.8 Call Form ส่วนที่ 1: Requested for, Contact, Priority & Template
    - **Deps**: 2.5, 2.6, 2.7 | **Ref**: design/components.md — C7; requirements §4.5; design-system.md §7 Add Support Call
    - `callFormSchema` (Zod ตาม §4.5) · RequestedFor (Myself / Somebody else + เลือกชื่อ) · Contact (default ผู้ใช้ปัจจุบัน, เปลี่ยน requestor → เติม email/phone) · TemplateLookup (Command ค้นหา + ปุ่มล้าง) · Urgency/Impact ตามชุดของ call type · priority preview · prefill จาก `?service=`
    - **Files**: `src/features/call-form/CallFormPage.tsx`, `callFormSchema.ts`, `sections/RequestedFor.tsx`, `sections/Contact.tsx`, `sections/PriorityTemplate.tsx`, `TemplateLookup.tsx`
    - **Validate**: เปิดจาก catalog แล้วค่า template เติมครบ · error ใต้ field แสดงข้อความไทยตาม §4.5 · เปลี่ยน urgency แล้ว priority เปลี่ยนทันที
    - **Stories**: US-014, US-015, US-016
  - [x] 2.9 Call Form ส่วนที่ 2: CI, Details, Attachments, OK / Cancel
    - **Deps**: 2.8, 1.4 | **Ref**: design/components.md — C7, C13; design/api-spec.md — createCall
    - CiInfo (Service, Product → Version อ่านอย่างเดียว, Item lookup, Serial) · Details (Summary + RichTextEditor Tiptap: bold/italic/underline/list/table, toolbar มี aria-label) · Attachments (metadata, ≤ 5 ไฟล์, ≤ 10MB) · OK → `createCall` → toast เลข ticket + ไป `/calls/:id` · Cancel + AlertDialog เมื่อ dirty · focus field แรกที่ผิด
    - **Files**: `src/features/call-form/sections/CiInfo.tsx`, `sections/Details.tsx`, `sections/Attachments.tsx`, `RichTextEditor.tsx`, `CallFormPage.tsx`
    - **Validate**: ส่งฟอร์มครบ → ได้เลข 100010 (ต่อจาก seed) · Notes ว่างหลังตัด tag → error · ไฟล์ 11MB ถูกปฏิเสธ
    - **Stories**: US-017, US-018, US-019
  - [x] 2.10 Call Detail (มุมมองอ่าน)
    - **Deps**: 2.5, 2.6 | **Ref**: design/components.md — C9; design-system.md §7 Call Detail
    - header (เลข, summary, StatusBadge, Priority, TimeLeft) · Details อ่านอย่างเดียว · Notes ผ่าน `sanitizeHtml` · ApprovalSteps · Timeline (เรียงเวลา, ข้อความไทยของ action) · ActivityTable / "ยังไม่มีกิจกรรม" · 2 คอลัมน์ ≥ lg · NOT_FOUND → "ไม่พบรายการหรือไม่มีสิทธิ์"
    - **Files**: `src/features/call-detail/CallDetailPage.tsx`, `Timeline.tsx`, `ApprovalSteps.tsx`, `ActivityTable.tsx`
    - **Validate**: เปิด call_001–009 ครบ · สมชายเปิด call ของคนอื่นทาง URL → ไม่เห็นข้อมูล
    - **Stories**: US-023, US-024, US-029
  - [x] 2.11 My Space
    - **Deps**: 2.5, 2.6 | **Ref**: design/components.md — C5; design-system.md §7 My Space
    - "Welcome Back : {ชื่อ}" + ปุ่มแจ้งเรื่องใหม่ · การ์ด Calls Logged For You (n) · การ์ด Calls You Opened On Behalf (n) · empty state แต่ละการ์ด
    - **Files**: `src/features/my-space/*`
    - **Validate**: login สมชาย เห็นเรื่องตัวเองครบตาม seed · สร้างเรื่องแจ้งแทนแล้วโผล่ในการ์ดที่ 2 · ผู้ใช้ที่ไม่มีเรื่องเห็น empty state
    - **Stories**: US-009, US-010
  - **จบ Phase 2**: verify build/dev + Flow 1 (แจ้ง Incident จาก catalog จนเห็นใน My Space) คลิกได้จริง ไม่มี error ใน console → ติ๊ก `[x]` → **หยุดรอผู้ใช้ยืนยัน**

- [x] 3. Core features — Frontend + Backend/Service — **N/A**
  - ไม่มี backend ใน scope (D3-2, D3-14) · ข้อมูลอยู่ใน localStorage ผ่าน repository layer ตั้งแต่ Phase 2 · ถ้าภายหลังต้องมี backend จริง ให้เปลี่ยน implementation ของ `src/data/repositories.ts`

- [x] 4. Feature อื่น ๆ ตาม dependency (Wave 3) — 4.6 ข้าม (รอ Azure contract)
  - [x] 4.1 Call Service: assign, เปลี่ยนสถานะ, ความเห็น, ยกเลิก, re-open
    - **Deps**: 2.6 | **Ref**: design/api-spec.md — Call Service; design/data-model.md — Business Rules 3–5
    - `assignCall` (New → Assigned), `changeStatus` (Resolved บังคับ closureCategory, ตั้ง resolvedAt/closeDate), `addComment` (+ attachments metadata), `cancelCall` (Cancelled / Request Cancelled), `reopenCall` (≤ 7 วัน) · ทุกตัวตรวจ `can` + กลุ่ม + transition และเขียน history ใน commit เดียว
    - **Files**: `src/features/calls/callService.ts`
    - **Validate**: `npm run typecheck` · ทดลองจาก UI ใน 4.2
    - **Stories**: US-025, US-026, US-027, US-028
  - [x] 4.2 Call Detail: action bar และช่องความเห็น
    - **Deps**: 4.1, 2.10 | **Ref**: design/components.md — C9; design-system.md §6 (ปุ่มข้างส่วนที่กระทำ)
    - ActionBar ขวาของ header แสดงเฉพาะ `availableActions` · assign (เลือกสมาชิกกลุ่ม) · เปลี่ยนสถานะ (Resolved → dialog เลือก closure category) · ยกเลิก (AlertDialog) · เปิดใหม่ · CommentBox (ข้อความ + แนบไฟล์, ว่าง → error) · อัปเดต timeline ทันที
    - **Files**: `src/features/call-detail/ActionBar.tsx`, `CommentBox.tsx`, `CallDetailPage.tsx`
    - **Validate**: ธนาเปิด call_001 → In Process → Resolved + closure → timeline ครบ · สมชายไม่เห็นปุ่มเปลี่ยนสถานะ · สมชายยกเลิกเรื่องที่ยังไม่ Resolved ได้
    - **Stories**: US-025, US-026, US-027, US-028
  - [x] 4.3 Search Support Call
    - **Deps**: 2.5, 2.6 | **Ref**: design/components.md — C9; design-system.md §7 Search
    - Default Criteria (Number, Status, Open date from/to, Summary, Subject Name) · call type + Open/Closed เป็น chip (default Open + All) · Advance Criteria พับได้ (ITSR reference, Template Used, Full-Text Natural/Boolean) · `fullText.ts` (AND/OR/NOT) · Search / Clear · ผลด้วย CallTable · "ไม่พบรายการ" + Clear · from > to → error
    - **Files**: `src/features/search/*`
    - **Validate**: ธนาค้น Open เห็นเฉพาะคิวกลุ่มตัวเอง · Boolean `mouse AND NOT keyboard` ให้ผลถูก · ผู้ดูแลเห็นทุกเรื่อง
    - **Stories**: US-020, US-021, US-022
  - [x] 4.4 Approvals: ตัดสินอนุมัติและหน้ารายการ
    - **Deps**: 2.6, 2.10 | **Ref**: design/api-spec.md — Approval Service (ตาราง SR และ RFC); design-system.md §7 Approvals
    - `listMyApprovals`, `decide` (ลำดับขั้น, rejected บังคับ comment, เปลี่ยนสถานะ call ตามตาราง, เริ่ม SLA เมื่อหมวด `slaStartsAfterApproval`) · ApprovalsPage (เงื่อนไข default My Approvals + Done = No, list การ์ดพร้อมปุ่ม อนุมัติ / ปฏิเสธ ในแถว, dialog เหตุผล) · empty "ไม่มีรายการรออนุมัติ"
    - **Files**: `src/features/approvals/approvalService.ts`, `src/features/approvals/ApprovalsPage.tsx`, `src/features/approvals/RejectDialog.tsx`
    - **Validate**: Flow 2: สมชายขอ Add New User → ปรีชาอนุมัติ → อรุณีอนุมัติ → Request In-Progress + Time Left เริ่มนับ · อรุณีตัดสินก่อนปรีชาไม่ได้
    - **Stories**: US-030, US-031
  - [x] 4.5 AI Assistant: interface, rule-based, แผง UI
    - **Deps**: 2.4, 2.9 | **Ref**: design/components.md — C15; design/integration.md — Rule-based Assistant; design-system.md §7 AI Assistant
    - `AiAssistant` interface + `RuleBasedAssistant` (keyword → serviceDefinition, intent → route; route ที่ไม่มีในแอป → unknown) · AiPanel (Sheet ขวา, mobile เต็มจอ) · ผล draft → เปิด `/calls/new` พร้อม state (ไม่สร้าง ticket) · navigate ตรวจ `can()` · เลือก implementation จาก `VITE_AI_MODE` (default mock)
    - **Files**: `src/features/ai-assistant/AiPanel.tsx`, `assistant.ts`, `ruleBased.ts`, `src/app/layout/AppLayout.tsx` (ปุ่มเปิดแผง)
    - **Validate**: พิมพ์ "เมาส์เสีย" → ฟอร์มที่กรอก Mouse ไว้ · "อยากอนุมัติคำขอ" ด้วยสมชาย → แจ้งไม่มีสิทธิ์
    - **Stories**: US-032, US-033, US-034
  - [ ] 4.6 ⛔ AI Assistant: Azure adapter + proxy auth
    - **Deps**: 4.5, **Azure contract** | **Ref**: design/integration.md — Azure AI Agent; design/api-spec.md §2
    - `azure.ts` เรียก `POST /api/ai/assist` (timeout 10s, Zod parse, ไม่ส่ง PII) · แปลง response ของ Azure → AiResult · fallback ไป rule-based + ข้อความ · `vite.config.ts` ใส่ header auth ตาม contract · `.env.example` อัปเดตตัวแปร
    - **Files**: `src/features/ai-assistant/azure.ts`, `vite.config.ts`, `.env.example`
    - **Validate**: `VITE_AI_MODE=azure` ไม่มี endpoint → fallback ไม่ crash · มี endpoint จริง → ได้ draft
    - **Blocked**: รอ endpoint / auth / request-response ของ agent บน Azure (OD-4 `[TBD]`) — ถ้ายังไม่ได้ เมื่อถึงคิวให้ข้ามและแจ้งผู้ใช้
    - **Skipped 2026-11-12**: ยังไม่มี contract → ผู้ใช้สั่ง "บันทึก ข้าม 4.6" · โหมด `azure` ใช้ rule-based + แถบแจ้งเตือนไปก่อน
    - **Stories**: US-034 (Azure path)
  - **จบ Phase 4**: verify build/dev + Flow 2 และ Flow 3 คลิกได้จริง → ติ๊ก `[x]` → **หยุดรอผู้ใช้ยืนยัน**

- [x] 5. ส่วนเสริม + Test / Verify (Wave 4) — 4.6 ยัง blocked (รอ Azure contract)
  - [x] 5.1 Test infrastructure
    - **Deps**: Phase 2 | **Ref**: design/testing-strategy.md — Test Architecture, Environment
    - `tests/fixtures/` (buildDataset จาก seed, buildCall, buildUser) · setup file (localStorage clear, fake timers) · `playwright.config.ts` (webServer `npm run dev`, `VITE_AI_MODE=mock`, chromium) · coverage config
    - **Files**: `tests/fixtures/*`, `tests/setup.ts`, `vitest.config.ts`, `playwright.config.ts`
    - **Validate**: `npm test` และ `npx playwright test --list` รันได้
  - [x] 5.2 PBT: rules engine (P1–P6, P9, P10)
    - **Deps**: 5.1, 2.2, 2.3 | **Ref**: design/correctness.md — P1–P6, P9, P10
    - **Files**: `tests/properties/priority.properties.test.ts`, `sla.properties.test.ts`, `stateMachine.properties.test.ts`, `numbering.properties.test.ts`
    - **Validate**: `npm test -- tests/properties` ผ่าน (numRuns 200)
  - [x] 5.3 PBT: access, full-text, sanitizer (P7, P8, P11, P12)
    - **Deps**: 5.1, 4.3, 1.4 | **Ref**: design/correctness.md — P7, P8, P11, P12
    - **Files**: `tests/properties/access.properties.test.ts`, `fullText.properties.test.ts`, `sanitize.properties.test.ts`
    - **Validate**: `npm test -- tests/properties` ผ่าน
  - [x] 5.4 Unit test: services, data, AI
    - **Deps**: 5.1, 4.1, 4.4, 4.5 | **Ref**: design/testing-strategy.md — Per Service Function, Mock Strategy
    - ทุก function ใน C8 / C14: success + FORBIDDEN + error เฉพาะ · RuleBased + Azure fallback (fetch mock 200 / 502 / timeout / JSON ผิด) · logger ตัด PII
    - **Files**: `tests/unit/services/*`, `tests/unit/ai/*`
    - **Validate**: `npm test -- tests/unit` ผ่าน · coverage `src/domain` ≥ 80%
  - [x] 5.5 Component test
    - **Deps**: 5.1, 2.9, 4.2 | **Ref**: design/testing-strategy.md — Per Component
    - CallForm validation messages · StatusBadge แสดง icon + label · ActionBar ตามสิทธิ์ · RequirePermission redirect · My Space empty state
    - **Files**: `tests/unit/components/*`
    - **Validate**: `npm test -- tests/unit/components` ผ่าน
  - [x] 5.6 E2E Flow 1 — แจ้ง Incident จาก catalog
    - **Deps**: 5.1, Phase 2 | **Ref**: design/testing-strategy.md — Critical Paths 1
    - **Files**: `tests/e2e/flow1-incident.spec.ts`
    - **Validate**: `npm run test:e2e -- flow1` ผ่าน
  - [x] 5.7 E2E Flow 2 — Service Request + อนุมัติ 2 ขั้น
    - **Deps**: 5.1, 4.4 | **Ref**: design/testing-strategy.md — Critical Paths 2
    - **Files**: `tests/e2e/flow2-approval.spec.ts`
    - **Validate**: `npm run test:e2e -- flow2` ผ่าน
  - [x] 5.8 E2E Flow 3 — agent ปิดเรื่อง
    - **Deps**: 5.1, 4.2, 4.3 | **Ref**: design/testing-strategy.md — Critical Paths 3
    - **Files**: `tests/e2e/flow3-agent.spec.ts`
    - **Validate**: `npm run test:e2e -- flow3` ผ่าน
  - [x] 5.9 ตรวจ UX, a11y และ responsive
    - **Deps**: 5.6–5.8 | **Ref**: design-system-policies.md §5, §9; design/nfr.md — Accessibility; design-system.md §8
    - รัน `ui-ux-pro-max` ตรวจ UX heuristics ทุกหน้า · keyboard-only ครบ flow · contrast / focus-visible / tap target 44px · 375 / 768 / 1280 ไม่มี horizontal scroll หรือ element ทับ · `prefers-reduced-motion` · `validate-tokens.cjs` ไม่เจอ hardcode · แก้ที่เจอหรือรายงานผู้ใช้ถ้าเกิน scope
    - **Files**: ตามที่ต้องแก้ (แจ้งรายการก่อนแก้ถ้าเกิน 5 ไฟล์)
    - **Validate**: รายงานผลตรวจ + console ไม่มี error
  - [x] 5.10 Verify รวมก่อนส่งมอบ
    - **Deps**: 5.2–5.9 | **Ref**: hands-on-project-policies — Working Software / Definition of Done
    - `npm run build` · `npm test` · `npm run test:e2e` · `npm run dev` แล้วคลิกทุกหน้าตาม Page Map ด้วยทุก role · ทบทวนว่า FR Must/Should ครบตาม requirements.md · รายงานสิ่งที่เสร็จ / ไม่เสร็จพร้อมเหตุผล (รวม 4.6 ถ้ายัง blocked)
    - **Files**: —
    - **Validate**: ทุกคำสั่งผ่าน ไม่มี error ใน console/terminal
  - [x] **จบ Phase 5**: → ติ๊ก `[x]` → **หยุดรอผู้ใช้ยืนยัน** (verified 2026-11-13)

- [x] 6. Deploy — **ข้ามรอบนี้** (D4-8)
  - ส่งมอบเป็น local dev + `npm run build` ผ่าน · D3 ไม่มี hosting / CI/CD

---

## Task Summary

| ID | Title | Deps | Status |
|---|---|---|---|
| 1.1 | git init + ignore / env | — | ☑ |
| 1.2 | Scaffold + deps | 1.1 | ☑ |
| 1.3 | Tailwind + tokens + fonts + shadcn | 1.2 | ☑ |
| 1.4 | Logger, ErrorBoundary, sanitizer | 1.2 | ☑ |
| 1.5 | App shell + routes | 1.3, 1.4 | ☑ |
| 2.1 | Types, schemas, data layer | 1.2 | ☑ |
| 2.2 | Priority, SLA, numbering | 2.1 | ☑ |
| 2.3 | State machine, access | 2.1 | ☑ |
| 2.4 | Session, Login, guard | 1.5, 2.1, 2.3 | ☑ |
| 2.5 | Shared call components | 1.3, 2.2 | ☑ |
| 2.6 | Call Service: create/read | 2.2, 2.3 | ☑ |
| 2.7 | Service Catalog | 2.4, 2.5 | ☑ |
| 2.8 | Call Form 1 | 2.5, 2.6, 2.7 | ☑ |
| 2.9 | Call Form 2 | 2.8, 1.4 | ☑ |
| 2.10 | Call Detail (read) | 2.5, 2.6 | ☑ |
| 2.11 | My Space | 2.5, 2.6 | ☑ |
| 4.1 | Call Service: actions | 2.6 | ☑ |
| 4.2 | Detail action bar + comment | 4.1, 2.10 | ☑ |
| 4.3 | Search | 2.5, 2.6 | ☑ |
| 4.4 | Approvals | 2.6, 2.10 | ☑ |
| 4.5 | AI rule-based + panel | 2.4, 2.9 | ☑ |
| 4.6 | AI Azure adapter | 4.5, contract | ⛔ |
| 5.1 | Test infra | Phase 2 | ☑ |
| 5.2 | PBT rules engine | 5.1, 2.2, 2.3 | ☑ |
| 5.3 | PBT access/fullText/sanitize | 5.1, 4.3, 1.4 | ☑ |
| 5.4 | Unit services/data/AI | 5.1, 4.1, 4.4, 4.5 | ☑ |
| 5.5 | Component tests | 5.1, 2.9, 4.2 | ☑ |
| 5.6 | E2E Flow 1 | 5.1, Phase 2 | ☑ |
| 5.7 | E2E Flow 2 | 5.1, 4.4 | ☑ |
| 5.8 | E2E Flow 3 | 5.1, 4.2, 4.3 | ☑ |
| 5.9 | UX / a11y / responsive | 5.6–5.8 | ☑ |
| 5.10 | Verify รวม | 5.2–5.9 | ☑ |

## Requirements Coverage

| Story | Tasks |
|---|---|
| US-001 | 2.1, 5.4 |
| US-002 | 2.4, 5.6 |
| US-003 | 2.3, 2.4, 5.3, 5.5 |
| US-004 | 2.3, 2.6, 2.10, 5.3 |
| US-005 | 2.2, 2.8, 5.2 |
| US-006 | 2.2, 2.5, 4.4, 5.2 |
| US-007 | 2.3, 2.6, 5.2 |
| US-008 | 2.2, 2.6, 5.2 |
| US-009 | 2.11, 5.5, 5.6 |
| US-010 | 2.11 |
| US-011 | 2.5 |
| US-012 | 2.7, 5.6 |
| US-013 | 2.7, 2.8, 5.6 |
| US-014 | 2.6, 2.8 |
| US-015 | 2.8, 5.5 |
| US-016 | 2.8 |
| US-017 | 2.9 |
| US-018 | 2.6, 2.9, 5.5, 5.6 |
| US-019 | 2.9 |
| US-020 | 4.3, 5.8 |
| US-021 | 4.3, 5.3 |
| US-022 | 2.5, 4.3 |
| US-023 | 2.10 |
| US-024 | 2.10, 4.1 |
| US-025 | 4.1, 4.2 |
| US-026 | 4.1, 4.2, 5.8 |
| US-027 | 4.1, 4.2, 5.8 |
| US-028 | 2.6, 4.1, 4.2, 5.2 |
| US-029 | 2.10 |
| US-030 | 4.4, 5.7 |
| US-031 | 2.6, 4.4, 5.7 |
| US-032 | 4.5 |
| US-033 | 4.5 |
| US-034 | 4.5, 4.6, 5.4 |
| หมวด J (a11y, security, privacy, perf) | 1.4, 5.3, 5.9, 5.10 |

**34 / 34 stories covered**

## Design Coverage

| Design element | Tasks |
|---|---|
| C1 App Shell | 1.5, 2.4 |
| C2 Session | 2.4 |
| C3 Access | 2.3 |
| C4 Rules Engine | 2.2, 2.3 |
| C5 My Space | 2.11 |
| C6 Catalog | 2.7 |
| C7 Call Form | 2.8, 2.9 |
| C8 Call Service | 2.6, 4.1 |
| C9 Search & Detail | 2.10, 4.2, 4.3 |
| C10 Data Layer | 2.1 |
| C11 Logger | 1.4 |
| C12 Shared UI | 1.3, 2.5 |
| C13 Sanitizer | 1.4 |
| C14 Approvals | 2.6, 4.4 |
| C15 AI Assistant | 4.5, 4.6 |
| Entities (13) + config | 2.1 |
| `POST /api/ai/assist` | 1.5 (proxy stub), 4.6 |
| Design tokens / design-system.md | 1.3, 5.9 |
| Operations (logging, config validation) | 1.4, 1.5, 4.6 |

## Testing Coverage
- **Unit (ใน task)**: 1.4 (logger, sanitize), 2.1 (data), 2.2, 2.3 (domain)
- **Unit / service**: 5.4 · **Component**: 5.5
- **Integration (AI endpoint)**: 5.4 (fetch mock ของ `POST /api/ai/assist`)
- **E2E**: 5.6, 5.7, 5.8
- **PBT**: 5.2 (P1–P6, P9, P10), 5.3 (P7, P8, P11, P12)
- **Load**: ไม่มี (ไม่อยู่ใน D3)
- **Coverage summary**: components ที่มี test 15/15 (ตาม testing-strategy Per Component) · endpoint 1/1

## Definition of Done
- [ ] โค้ดตรง `Ref` และ requirement ที่อ้าง ไม่เกิน scope (เกิน → แจ้งผู้ใช้ + บันทึก Add-on)
- [ ] `Validate` ของ task ผ่าน · `npm run typecheck` ผ่าน
- [ ] UI ใช้ token เท่านั้น ไม่มี hex / emoji · มี focus-visible, label/ARIA, tap target 44px
- [ ] ไม่มี error ใน console / terminal
- [ ] ติ๊ก `[x]` ใน tasks.md
- [ ] จบ phase: `npm run build` + `npm run dev` ใช้งานได้จริง → หยุดรอผู้ใช้ยืนยัน

## Execution Waves

| Wave | Phase | ต้องเสร็จก่อน |
|---|---|---|
| 1 | 1. Setup | — |
| 2 | 2. Frontend + Mock data | Phase 1 + ผู้ใช้ยืนยัน |
| 3 | 4. Feature อื่น ๆ | Phase 2 + ผู้ใช้ยืนยัน |
| 4 | 5. Test / Verify | Phase 4 + ผู้ใช้ยืนยัน |

ทุก task ทำทีละตัวตามลำดับ ID (D4-7) — ไม่มี parallel จึงไม่มีการแย่งไฟล์ระหว่าง phase

**File ownership ต่อ phase**
| Phase | Owned |
|---|---|
| 1 | root config, `src/main.tsx`, `src/styles/globals.css`, `src/shared/ui`, `src/shared/{logger,sanitize,ErrorBoundary}`, `src/app` |
| 2 | `src/domain`, `src/data`, `src/features/{auth,calls,catalog,call-form,call-detail,my-space,approvals/approvalService}`, `src/shared/components`, `src/app/RequirePermission.tsx`, `src/app/layout/{Sidebar,UserMenu}` |
| 4 | `src/features/{calls,call-detail,search,approvals,ai-assistant}`, `src/app/layout/AppLayout.tsx`, `vite.config.ts`, `.env.example` |
| 5 | `tests/**`, `vitest.config.ts`, `playwright.config.ts`, ไฟล์ที่ต้องแก้จาก 5.9 |

## Notes
- **Technical debt**: localStorage ไม่เข้ารหัส (ยอมรับได้เพราะข้อมูลสมมติ) · login mock ห้ามใช้กับข้อมูลจริง · approver จาก managerId และ RFC approval flow เป็น `[ASM]`
- **Future**: Nice FR (Knowledge, Scheduled Activities, Survey, CAB, บันทึกร่าง, Read flag) · หน้า admin · backend จริงแทน repository · deploy + CI
