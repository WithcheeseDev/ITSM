# Components

## Overview
SPA ฝั่ง client ล้วน (React + Vite, TypeScript strict) จัดแบบ feature-based (D3-9):
- **domain/** — pure functions ไม่มี side effect (priority, SLA, state machine, visibility, permission) ทดสอบด้วย fast-check
- **data/** — repository บน localStorage (D3-2) + seed จาก `database.json`
- **store/** — Zustand + persist (D3-3) ถือ session และ cache ข้อมูลที่อ่านจาก repository
- **features/** — หน้าจอแต่ละ feature เรียก service ของ feature → domain + repository
- **shared/** — UI primitives (shadcn/ui บน Radix, D3-5), layout, guard, logger
- **dev proxy** — Vite `server.proxy` สำหรับ AI (D3-8) ไม่มี server อื่น

ทิศทาง dependency: `features → (services) → domain + data` · `domain` ไม่ import อะไรนอก `domain/` · `data` import `domain` ได้เฉพาะ type

---

## C1. App Shell & Routing
- **Purpose**: โครงหน้า (sidebar แบน + header เมนูผู้ใช้), route ทั้งหมด, route guard
- **Technology**: React Router 8 (D3-4), shadcn/ui
- **Responsibilities**: render layout · guard ทุก route ด้วย permission (default-deny) · redirect ไป Login เมื่อไม่มี session · redirect ไป My Space + toast เมื่อไม่มีสิทธิ์ · error boundary ระดับ app
- **Exposes**: routes `/login`, `/my-space`, `/catalog`, `/catalog/:categoryId`, `/calls/new`, `/calls/search`, `/calls/:callId`, `/approvals`
- **Consumes**: C2 (session), C3 (`can()`)
- **Internal structure**:
  ```
  src/app/
  ├── App.tsx            # RouterProvider + ErrorBoundary
  ├── routes.tsx         # route table + required permission ต่อ route
  ├── RequirePermission.tsx
  └── layout/ (AppLayout.tsx, Sidebar.tsx, UserMenu.tsx)
  ```
- **Key decisions**: 1) permission ผูกกับ route table จุดเดียว — ไม่มี route ไหนลืม guard 2) sidebar แบน ทุกหน้าระดับบนมี icon (UI default ของ user)
- **Error handling**: ErrorBoundary แสดงหน้า "เกิดข้อผิดพลาด" + ปุ่มกลับ My Space, log ผ่าน C11
- **Stories**: US-003, US-033 (route target)

## C2. Session (Mock Auth)
- **Purpose**: ล็อกอิน mock / ออกจากระบบ / ผู้ใช้ปัจจุบัน
- **Technology**: Zustand store + persist key `itsm.session`
- **Responsibilities**: เลือก user จาก `users` · เก็บ `currentUserId` · ล้าง session
- **Exposes**: `useSession() → { user, login(userId), logout() }`
- **Consumes**: C10 (UserRepository)
- **Internal structure**: `src/features/auth/` (LoginPage.tsx, sessionStore.ts)
- **Key decisions**: ไม่มีรหัสผ่าน (FR-001) — เก็บแค่ userId ไม่เก็บข้อมูลส่วนตัวซ้ำใน session
- **Error handling**: userId ใน session ไม่พบใน users → logout อัตโนมัติ
- **Stories**: US-002

## C3. Access Control (domain)
- **Purpose**: ตัดสินสิทธิ์และขอบเขตการมองเห็น
- **Technology**: pure TypeScript
- **Responsibilities**: `can(user, permission)` จาก `rolePermissions` · `canViewCall(user, call, approvals)` · `filterVisibleCalls(user, calls, approvals)` · `availableActions(user, call)`
- **Exposes**: `domain/access.ts`
- **Consumes**: types จาก `domain/types.ts` เท่านั้น
- **Key decisions**: 1) default-deny: permission ไม่อยู่ใน list = false 2) ใช้ทั้งใน guard ของ UI และใน service ก่อนเขียนข้อมูล (US-003 ข้อ 4)
- **Error handling**: role ไม่รู้จัก → ไม่มีสิทธิ์ใด ๆ
- **Stories**: US-003, US-004, US-025, US-026, US-030

## C4. Rules Engine (domain)
- **Purpose**: priority, due date / Time Left, state machine, running number
- **Technology**: pure TypeScript
- **Exposes**:
  - `calcPriority(callType, urgency, impact, matrices) → Priority | Error`
  - `calcDueDate(openOrApprovedAt, priority, slaHours) → ISO string`
  - `timeLeft(dueDate, now, status, closedStatuses, awaitingApproval) → { label, minutes, overdue }`
  - `initialStatus(callType, template) → Status`
  - `nextStatuses(callType, status) → Status[]` · `assertTransition(callType, from, to)`
  - `isClosed(status)` · `shouldAutoClose(call, history, now, windowDays=7)`
  - `nextNumber(runningNumber) → string(6)`
- **Key decisions**: 1) matrix และ SLA อ่านจากข้อมูล (`priorityMatrix`, `rfcPriorityMatrix`, `slaHoursByPriority`) ไม่ hardcode (D1-4/5) 2) transition table เป็น constant ตาม Requirements §4.4 (D1-7) 3) `now` ส่งเป็น argument เสมอ — ทดสอบได้ deterministic
- **Error handling**: คืน error object (`{ ok:false, code }`) ไม่ throw ใน path ปกติ — UI แปลงเป็นข้อความไทย
- **Stories**: US-005, US-006, US-007, US-008, US-028

## C5. My Space
- **Purpose**: หน้าเรื่องของฉัน 2 ตาราง
- **Technology**: React + CallTable (C12)
- **Responsibilities**: Welcome · Calls Logged For You · Calls You Opened On Behalf · count · empty state
- **Consumes**: C3 `filterVisibleCalls`, C4 `timeLeft`, C10 CallRepository, C12 CallTable
- **Internal structure**: `src/features/my-space/MySpacePage.tsx`
- **Stories**: US-009, US-010

## C6. Service Catalog
- **Purpose**: เลือกหมวด → หมวดย่อย → บริการ → เปิดฟอร์ม
- **Responsibilities**: การ์ดหมวดบน · breadcrumb · slaNote · ตารางบริการ · ปุ่ม Request this service (ส่ง `serviceDefinitionId` ไป `/calls/new?service=`)
- **Consumes**: C10 (CategoryRepository, ServiceDefinitionRepository)
- **Internal structure**: `src/features/catalog/` (CatalogPage.tsx, CategoryCard.tsx, ServiceTable.tsx)
- **Key decisions**: ไอคอนหมวด map จากชื่อใน `icon` ไปยัง Lucide component ผ่าน allow-list (ชื่อไม่รู้จัก → ไอคอน default) — ไม่ import แบบ dynamic ทั้งชุด
- **Stories**: US-012, US-013

## C7. Call Form (Add Support Call)
- **Purpose**: ฟอร์มสร้าง Support Call
- **Technology**: React Hook Form + Zod (D3-6), Tiptap (D3-7)
- **Responsibilities**: section Requested for (Myself/Somebody else) · Contact · Priority & Template · CI · Details · Attachments · OK / Cancel · prefill จาก service/template/AI draft
- **Exposes**: route `/calls/new` รับ query `service` หรือ state `aiDraft`
- **Consumes**: C4 (priority preview), C8 `createCall`, C10 repositories (users, templates, products, items, services)
- **Internal structure**:
  ```
  src/features/call-form/
  ├── CallFormPage.tsx
  ├── callFormSchema.ts      # Zod schema = validation §4.5
  ├── sections/ (RequestedFor, Contact, PriorityTemplate, CiInfo, Details, Attachments).tsx
  ├── TemplateLookup.tsx
  └── RichTextEditor.tsx     # Tiptap: bold/italic/underline/list/table
  ```
- **Key decisions**: 1) schema เดียวกับที่ service ใช้ validate ซ้ำก่อนบันทึก 2) ไฟล์แนบเก็บ metadata (D1-13) 3) dirty check ก่อน Cancel (EX-05)
- **Error handling**: error ใต้ field พร้อม `aria-describedby`; focus ไป field แรกที่ผิด
- **Stories**: US-013, US-014, US-015, US-016, US-017, US-018, US-019, US-032

## C8. Call Service (application layer)
- **Purpose**: use case ทั้งหมดที่เปลี่ยนข้อมูล Support Call — จุดเดียวที่เขียน CallRepository / HistoryRepository / ApprovalRepository
- **Exposes**:
  - `createCall(actor, input) → Result<SupportCall>`
  - `assignCall(actor, callId, assigneeId)` · `changeStatus(actor, callId, to, { closureCategory?, comment? })`
  - `addComment(actor, callId, text, attachments)` · `cancelCall(actor, callId)` · `reopenCall(actor, callId)`
  - `runAutoClose(now)` (เรียกตอนโหลดข้อมูล)
- **Consumes**: C3, C4, C10, C11
- **Internal structure**: `src/features/calls/callService.ts`
- **Key decisions**: 1) ทุก use case: ตรวจสิทธิ์ (C3) → ตรวจ transition (C4) → เขียนข้อมูล → append history ในการเรียก repository ครั้งเดียว (`commit`) 2) history append-only (US-024)
- **Error handling**: คืน `Result` พร้อม code (`FORBIDDEN`, `INVALID_TRANSITION`, `VALIDATION`, `NOT_FOUND`) → UI แสดงข้อความไทย
- **Stories**: US-018, US-024–US-028, US-031 (status ผลอนุมัติ)

## C9. Search & Call Detail
- **Purpose**: หน้า Search และหน้า Detail
- **Responsibilities**:
  - Search: เงื่อนไขพื้นฐาน + ขั้นสูง (Natural Language / Boolean) · filter call type / Open-Closed เป็น radio · ผลตาราง
  - Detail: ข้อมูลอ่านอย่างเดียว · status badge · Time Left · approval steps · timeline · comment · action bar ตามสิทธิ์และ state machine · activities
- **Consumes**: C3, C4, C8, C10, C12, C13 (sanitize)
- **Internal structure**:
  ```
  src/features/search/ (SearchPage.tsx, searchCriteria.ts, fullText.ts)
  src/features/call-detail/ (CallDetailPage.tsx, Timeline.tsx, ActionBar.tsx, CommentBox.tsx, ApprovalSteps.tsx, ActivityTable.tsx)
  ```
- **Key decisions**: `fullText.ts` เป็น pure function (parse Boolean AND/OR/NOT) ทดสอบด้วย PBT
- **Stories**: US-020–US-029

## C10. Data Layer (repositories)
- **Purpose**: อ่าน/เขียนข้อมูลผ่าน interface เดียว เปลี่ยนเป็น API จริงได้ภายหลัง
- **Technology**: localStorage + Zod parse ตอนอ่าน
- **Exposes**: `Repository<T> { findAll(), findById(id), create(item), update(id, patch) }` สำหรับทุก entity · `commit(changes)` เขียนหลาย collection ครั้งเดียว · `resetToSeed()`
- **Internal structure**:
  ```
  src/data/
  ├── seed.ts              # import database.json (copy ไว้ที่ src/data/database.json)
  ├── storage.ts           # load/save + schema version + parse guard
  ├── schemas.ts           # Zod schemas ของทุก entity
  └── repositories.ts
  ```
- **Key decisions**: 1) เก็บทั้ง dataset ใน key เดียว `itsm.db.v1` — เขียนครั้งเดียวต่อ commit ลดโอกาสข้อมูลครึ่ง ๆ กลาง ๆ 2) parse ไม่ผ่าน → แจ้งผู้ใช้แล้ว reset เป็น seed (US-001)
- **Error handling**: quota เต็ม → แจ้ง "พื้นที่จัดเก็บเต็ม" ไม่ทำข้อมูลเดิมเสีย (เขียน key ใหม่ล้มเหลว = ไม่เปลี่ยน key เดิม)
- **Stories**: US-001, US-008

## C11. Logger & Error Boundary
- **Purpose**: log แบบไม่มี PII (D3-13)
- **Exposes**: `logger.error/warn/info(event, context)` — ตัด field `name/email/phone/notes/summary` และ mask อัตโนมัติ
- **Internal structure**: `src/shared/logger.ts`, `src/shared/ErrorBoundary.tsx`
- **Stories**: cross-cutting (NFR-021)

## C12. Shared UI
- **Purpose**: component กลางที่ใช้ token จาก `tokens.css`
- **Contents**: shadcn/ui (Button, Input, Select, Dialog, AlertDialog, Popover, Command, Tabs, Table, Badge, Toast, Checkbox, RadioGroup, Tooltip) + `StatusBadge` (icon + label), `PriorityBadge`, `TimeLeft`, `CallTable` (เลือกคอลัมน์, คลิกแถว), `EmptyState`, `FilterChips`
- **Internal structure**: `src/shared/ui/`, `src/shared/components/`
- **Key decisions**: StatusBadge map status → กลุ่มความหมาย (new / in-progress / waiting / resolved / closed / rejected) → icon + สี semantic + label (NFR-012)
- **Stories**: US-009, US-011, US-022, US-023

## C13. Rich Text Sanitizer
- **Purpose**: กัน XSS ใน Notes / ความเห็น
- **Technology**: DOMPurify (D3-7)
- **Exposes**: `sanitizeHtml(html) → string` (allow-list tag ที่ editor สร้างได้เท่านั้น) · `htmlToText(html)` สำหรับเช็คว่าง/ full-text
- **Key decisions**: sanitize ตอน render ทุกจุด และตอนบันทึกด้วย (defense in depth)
- **Stories**: US-018, US-023, US-025

## C14. Approvals
- **Purpose**: หน้า Approvals + use case อนุมัติ
- **Exposes**: `createApprovals(call, template, users)` · `decide(actor, approvalId, decision, comment)`
- **Consumes**: C3, C4 (`calcDueDate` เมื่ออนุมัติขั้นสุดท้าย), C8 (เปลี่ยนสถานะ + history), C10
- **Internal structure**: `src/features/approvals/` (ApprovalsPage.tsx, approvalService.ts)
- **Key decisions**: 1) approver ถูกกำหนดตอนสร้าง approval เก็บใน `approverId` (seed มีอยู่แล้ว) — call ใหม่: Department = `managerId` ของ requestor, Head = `managerId` ของ Department approver `[ASM]` 2) ขั้นถัดไปตัดสินได้เมื่อขั้นก่อน `approved`
- **Error handling**: ไม่พบ manager → สร้าง approval ไม่ได้ → ไม่บันทึก call และแจ้ง "ไม่พบผู้อนุมัติของผู้แจ้ง"
- **Stories**: US-030, US-031

## C15. AI Assistant
- **Purpose**: แผงแชทช่วยเปิด ticket / navigate
- **Exposes**: `AiAssistant` interface `{ suggest(text, pageContext) → Promise<AiResult> }` · `AiResult = { kind:'draft', draft } | { kind:'navigate', route, filters } | { kind:'unknown' }`
- **Implementations**: `RuleBasedAssistant` (ใช้ `ai.fallbackKeywordToServiceDefinition`, `ai.fallbackIntentToRoute`) · `AzureAssistant` (เรียก `POST /api/ai/assist` ผ่าน dev proxy — `[TBD]` contract)
- **Selection**: env `VITE_AI_MODE=mock|azure` (default `mock`) · Azure error/timeout 10s → ใช้ rule-based + แจ้งผู้ใช้
- **Internal structure**: `src/features/ai-assistant/` (AiPanel.tsx, assistant.ts, ruleBased.ts, azure.ts)
- **Key decisions**: 1) ส่งเฉพาะ `text` + `pageName` (FR-114) 2) navigate ตรวจ `can()` ก่อนพาไป 3) draft เปิดฟอร์มเท่านั้น ไม่เรียก `createCall`
- **Stories**: US-032, US-033, US-034

---

## Interactions

```
                ┌──────────────┐
                │ C1 App Shell │──guard──▶ C3 Access ◀──┐
                └──────┬───────┘                       │
        ┌──────────┬───┴──────┬──────────┬────────┐    │
        ▼          ▼          ▼          ▼        ▼    │
     C5 MySpace C6 Catalog C7 Form  C9 Search/  C14    │
        │          │          │      Detail   Approvals│
        │          └─service──┘          │        │    │
        │                     │          │        │    │
        └─────────┬───────────┴──────────┴────────┘    │
                  ▼                                     │
            C8 Call Service ──▶ C4 Rules Engine         │
                  │      └────▶ C3 Access ──────────────┘
                  ▼
            C10 Data Layer ──▶ localStorage (itsm.db.v1)
                  ▲
   C2 Session ────┘        C15 AI ──▶ RuleBased | Azure ──▶ Vite proxy ──▶ Azure agent
   C11 Logger · C12 Shared UI · C13 Sanitizer  (ใช้ร่วมทุก feature)
```

Dependency graph ไม่มี cycle: domain (C3, C4) ไม่พึ่ง feature ใด

### Data flow — สร้าง Support Call
1. C6 ส่ง `serviceDefinitionId` → C7 อ่าน template → prefill
2. ผู้ใช้กรอก → Zod validate → C4 แสดง priority preview
3. OK → C8 `createCall`: C3 `can(call:create)` → C4 priority, initialStatus, dueDate (หรือรออนุมัติ), nextNumber → C14 `createApprovals` (ถ้ามี) → C10 `commit({calls, history, approvals, runningNumber})`
4. นำทางไป `/calls/:id` + toast เลข ticket
