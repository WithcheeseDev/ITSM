# Audit Trail — itsm-support-desk

### [2026-11-11T16:35:00Z] Context: assessment
- **Phase**: context
- **Action**: assessment
- **Artifacts**: .aidlc/specs/itsm-support-desk/context.md, .aidlc/blueprints/{product,tech,structure,resources}.md, .claude/CLAUDE.md
- **Outcome**: Greenfield, scope new, mode comprehensive (decomposition skipped per hands-on-project policy). Status draft — awaiting approval.

### [2026-11-11T16:40:00Z] Context: approval
- **Phase**: context
- **Action**: approval
- **Artifacts**: context.md
- **Outcome**: User approved ("proceed"). Handoff to requirements.

### [2026-11-11T16:45:00Z] Requirements: decision-gate
- **Phase**: requirements
- **Action**: decision-gate
- **Artifacts**: .aidlc/workflow/itsm-support-desk/decisions-requirements.md
- **Outcome**: D1 generated with 15 blank questions. Awaiting user answers.

### [2026-11-11T16:50:00Z] Requirements: validation
- **Phase**: requirements
- **Action**: validation
- **Artifacts**: decisions-requirements.md
- **Outcome**: "use recommendations". Conflict found D1-4/5/6 vs database.json → user chose database.json values. PDPA note → privacy criteria added.

### [2026-11-11T17:00:00Z] Requirements: generation
- **Phase**: requirements
- **Action**: generation
- **Artifacts**: .aidlc/specs/itsm-support-desk/requirements.md, personas.md, .aidlc/blueprints/product.md
- **Outcome**: 34 stories / 10 areas (High 20, Medium 11, Low 3), 4 personas. Status draft — awaiting approval.

### [2026-11-11T17:10:00Z] Requirements: approval
- **Phase**: requirements
- **Action**: approval
- **Artifacts**: requirements.md, personas.md
- **Outcome**: User approved ("proceed"). teamSize=1 stored. Moving to routing decision.

### [2026-11-11T17:15:00Z] Requirements: routing-decision
- **Phase**: requirements
- **Action**: routing-decision
- **Artifacts**: —
- **Outcome**: Recommended design (decomposition skipped per hands-on-project policy). User accepted ("proceed").

### [2026-11-11T17:20:00Z] Design: decision-gate
- **Phase**: design
- **Action**: decision-gate
- **Artifacts**: .aidlc/workflow/itsm-support-desk/decisions-design.md
- **Outcome**: D3 generated with 16 blank questions (stack, data, UI, testing, ops, design-system color/typography). Awaiting user answers.

### [2026-11-11T17:30:00Z] Design: validation
- **Phase**: design
- **Action**: validation
- **Artifacts**: decisions-design.md
- **Outcome**: "use recommendations". No 🔴/🟡 conflicts. 🟢 Minimal observability without health endpoint (no server).

### [2026-11-11T18:00:00Z] Design: generation
- **Phase**: design
- **Action**: generation
- **Artifacts**: design.md, design/{components,data-model,api-spec,integration,implementation,operations,testing-strategy,correctness,nfr}.md, .claude/rules/design-system.md, src/styles/tokens.css, blueprints/{tech,structure}.md
- **Outcome**: 15 components, 13 entities, 1 HTTP endpoint + service API, 12 PBT properties, traceability 34/34. Versions from npm registry (TS 6, vitest 4, @hookform/resolvers 5 — newer majors < 3 months or single release). Status draft — awaiting approval.

### [2026-11-12T09:00:00Z] Design: approval
- **Phase**: design
- **Action**: approval
- **Artifacts**: design.md, design/*, design-system.md, tokens.css
- **Outcome**: User approved ("proceed"). Handoff to tasks.

### [2026-11-12T09:05:00Z] Tasks: decision-gate
- **Phase**: tasks
- **Action**: decision-gate
- **Artifacts**: .aidlc/workflow/itsm-support-desk/decisions-tasks.md
- **Outcome**: D4 generated with 8 blank questions. Awaiting user answers.

### [2026-11-12T09:20:00Z] Tasks: validation
- **Phase**: tasks
- **Action**: validation
- **Artifacts**: decisions-tasks.md
- **Outcome**: "use recommendations". 🟡 Task count vs capacity accepted (policy: sequential, stop per group).

### [2026-11-12T09:30:00Z] Tasks: generation
- **Phase**: tasks
- **Action**: generation
- **Artifacts**: .aidlc/specs/itsm-support-desk/tasks.md
- **Outcome**: 32 tasks in phases 1,2,4,5 (3=N/A, 6=skipped), 4 sequential waves, 34/34 stories, 15/15 components. 4.6 blocked on Azure contract. Status draft — awaiting approval.

### [2026-11-12T09:40:00Z] Tasks: approval
- **Phase**: tasks
- **Action**: approval
- **Artifacts**: tasks.md
- **Outcome**: User approved ("approve"). Handoff to implement.

### [2026-11-12T10:00:00Z] Implement: mode-selection
- **Phase**: implement
- **Action**: mode-selection
- **Artifacts**: aidlc-manifest.yaml
- **Outcome**: User chose "standard". currentTask=1.1.

### [2026-11-12T10:05:00Z] Task Complete: 1.1 — git init และไฟล์ ignore / env ตัวอย่าง

**Phase**: implementation
**Action**: task 1.1 implemented (standard mode)
**Artifacts**: .git/ (branch main, no commits), .gitignore, .env.example
**Outcome**: pass — `git status` on main, `.env.local` ignored (git check-ignore). 0 tests (setup task). 1/32 (3%)

### [2026-11-12T10:30:00Z] Task Complete: 1.2 — Scaffold Vite + React + TypeScript และ dependency

**Phase**: implementation
**Action**: task 1.2 implemented (standard mode)
**Artifacts**: package.json, package-lock.json, tsconfig.json, tsconfig.app.json, tsconfig.node.json, vite.config.ts, vitest.config.ts, index.html, src/main.tsx; outside task Files (pending user OK for Add-on): .nvmrc, .claude/launch.json
**Outcome**: pass — build ✓, typecheck ✓, vitest runs (0 tests), dev server Vite 8.3.8 on :5173 renders, no console errors. Notes: session PATH defaulted to Node 20 → ran with Node 22.23.2; npm 10.9.8 (Node 22) crashes in arborist peer resolution → lockfile installed with npm 10.8.2; removed baseUrl (deprecated in TS 6). 2/32 (6%)

### [2026-11-12T10:40:00Z] Add-on: Task 1.2 extras approved

**Phase**: implementation
**Action**: add-on approval
**Artifacts**: .nvmrc, .claude/launch.json, design/implementation.md §Add-on
**Outcome**: User approved keeping files ("เก็บ แล้ว next"). Recorded Node/npm workaround under Add-on.

### [2026-11-12T11:10:00Z] Task Complete: 1.3 — Tailwind v4 + design tokens + ฟอนต์ + shadcn/ui

**Phase**: implementation
**Action**: task 1.3 implemented (standard mode)
**Artifacts**: src/styles/globals.css, components.json, src/lib/utils.ts, src/shared/ui/* (17 components: button, input, select, dialog, alert-dialog, popover, command, tabs, table, badge, sonner, checkbox, radio-group, tooltip, sheet, label, textarea); outside task Files (pending user OK for Add-on): vite.config.ts (+@tailwindcss/vite), package.json/lock (+radix-ui 1.8.1, cmdk 1.1.1, sonner 2.0.8, dev tw-animate-css 1.4.0), src/main.tsx (temporary token test page)
**Outcome**: pass — typecheck ✓, build ✓, validate-tokens: 0 violations, button primary rgb(59,76,202) h 44px, IBM Plex Sans Thai 400/500/600 loaded, 0 console errors. shadcn 4.23.0 add run with npm 10.8.2; files written to literal `@/` (root tsconfig has no paths) → moved to src/shared/ui, `from "cn"` → `@/lib/utils`, removed stray deps cn + next-themes. Token fixes: accent(teal) hover → muted, ring 2px+offset, bg-black/50 → foreground/40, text-white → destructive-foreground, button/input/select height → --button-height/--input-height (44px), placeholder → --placeholder, `dark:` scoped to .dark class (light only). Deviation from design-system.md §3 sample: --font-sans/--radius not mapped in @theme (self-reference; tokens.css already overrides). 3/32 (9%)

### [2026-11-12T11:15:00Z] Add-on: Task 1.3 deps/config approved

**Phase**: implementation
**Action**: add-on approval
**Artifacts**: design/implementation.md §Add-on, .claude/rules/design-system.md §9
**Outcome**: User approved ("บันทึก แล้ว next"). Recorded tailwind plugin, radix-ui/cmdk/sonner/tw-animate-css, @theme mapping deviation.

### [2026-11-12T11:40:00Z] Task Complete: 1.4 — Logger, ErrorBoundary, sanitizer

**Phase**: implementation
**Action**: task 1.4 implemented (standard mode)
**Artifacts**: src/shared/logger.ts, src/shared/ErrorBoundary.tsx, src/shared/sanitize.ts, tests/unit/shared/{logger,sanitize,ErrorBoundary}.test.ts(x)
**Outcome**: pass — 16 tests pass (`npm test -- tests/unit/shared`), typecheck ✓, build ✓, validate-tokens 0 violations. Logger masks keys ending with deny-list words (case-insensitive, nested), prod = warn/error only, stack dev-only. Sanitizer: Tiptap tag allow-list, links forced target=_blank rel=noopener noreferrer nofollow, URI allow-list http(s)/mailto/#//; fixed colspan being dropped (custom ALLOWED_URI_REGEXP also applies to non-URL attrs → ADD_URI_SAFE_ATTR). ErrorBoundary not mounted yet (task 1.5). No files outside task scope. 4/32 (13%)

### [2026-11-12T12:20:00Z] Task Complete: 1.5 — App shell, layout และ route skeleton

**Phase**: implementation
**Action**: task 1.5 implemented (standard mode)
**Artifacts**: src/app/{App,routes,PlaceholderPage}.tsx, src/app/layout/{AppLayout,Sidebar,UserMenu}.tsx, src/assets/logo.svg, vite.config.ts (loadEnv + /api/ai/assist proxy, registered only when AZURE_AI_ENDPOINT set); outside task Files (pending user OK for Add-on): vitest.config.ts (vite config became a function → defineConfig(env => mergeConfig(viteConfig(env), …))), src/main.tsx (renders App), src/shared/ui/{sheet,dialog}.tsx close button 16px → 44px + sr-only "ปิด" (fix of task 1.3 defect, HARD RULE #6)
**Outcome**: pass — typecheck ✓, build ✓, 16 tests ✓, validate-tokens 0. Browser: 1280 header 56px / sidebar 240px, 5 menu items navigate with aria-current, /calls/:id placeholder, no h-scroll; 375 drawer opens, link navigates + closes drawer, sidebar hidden, close button 44×44; 0 console errors. Route permissions [ASM]: my-space/search/detail = call:view_own, catalog = catalog:view, new = call:create, approvals = approval:view_assigned (enforced in 2.4). Not done: AI Assistant header button (phase 4), focus moves to body after drawer navigation (review in 5.9). 5/32 (16%)

### [2026-11-12T12:20:00Z] Phase 1 complete — Setup

**Phase**: implementation
**Action**: group verification
**Outcome**: Tasks 1.1–1.5 done. build/dev/test pass, no console errors. Stopped for user confirmation before Phase 2 (policy).

### [2026-11-12T12:30:00Z] Add-on: Task 1.5 extras approved + Phase 2 start

**Phase**: implementation
**Action**: add-on approval, phase confirmation
**Artifacts**: design/implementation.md §Add-on
**Outcome**: User approved ("บันทึก แล้ว next") — recorded vitest.config, main.tsx, sheet/dialog close button, route permissions [ASM]. Phase 1 confirmed; starting Phase 2 (task 2.1).

### [2026-11-12T13:10:00Z] Task Complete: 2.1 — Domain types, Zod schemas และ data layer

**Phase**: implementation
**Action**: task 2.1 implemented (standard mode)
**Artifacts**: src/domain/types.ts (entity types, enum consts, Dataset, AppError/Result + Thai messages), src/data/{database.json,schemas.ts,seed.ts,storage.ts,repositories.ts}, tests/unit/data/{storage,repositories}.test.ts
**Outcome**: pass — 35 tests (19 new) ✓, typecheck ✓, build ✓. Decision asked: seed attachment shape {id,fileName,sizeKb} ≠ model {name,size,type} → user chose "แปลงตอนโหลด" (normalizeAttachments) — recorded in data-model.md §Add-on. Also: Activity.callId/priority nullable (seed act_003), RFC date fields kept optional. Repository.create/update return Result<void> (spec says void) so STORAGE_FULL/VALIDATION are not silent. commit() validates with Zod before the single setItem. Default store reads window.localStorage lazily. 6/32 (19%)

### [2026-11-12T13:40:00Z] Task Complete: 2.2 — Rules engine: priority, SLA / Time Left, เลข ticket

**Phase**: implementation
**Action**: task 2.2 implemented (standard mode)
**Artifacts**: src/domain/{priority,sla,numbering}.ts, tests/unit/domain/{priority,sla,numbering}.test.ts
**Outcome**: pass — 55 tests (20 new) ✓, typecheck ✓, build ✓. Matrices/SLA read from dataset; BR-02 level-set check; due dates formatted +07:00 (formatIso); timeLeft returns kind ok/warning(<25% SLA)/overdue/closed/awaiting/none + "X days hh:mm" label. Signature notes vs C4: timeLeft takes an input object (needs slaHours for the 25% rule); nextNumber returns { number, runningNumber } and skips numbers already used (US-008). No files outside task scope. 7/32 (22%)

### [2026-11-12T14:20:00Z] Task Complete: 2.3 — Rules engine: state machine และ access control

**Phase**: implementation
**Action**: task 2.3 implemented (standard mode)
**Artifacts**: src/domain/{stateMachine,access}.ts, tests/unit/domain/{stateMachine,access}.test.ts; minor: isClosed moved from sla.ts to stateMachine.ts (single source) + sla.test import updated
**Outcome**: pass — 78 tests (23 new) ✓, typecheck ✓, build ✓. Transition table = §4.4 (D1-7) as constant. [ASM] gaps filled: SR Request Submitted → Request In-Progress (no-approval template), Department Accepted → Request In-Progress (Department last step), RFC Request For Change → Ready for CAB (final approval, matches seed call_008), RFC cancel allowed until Implementation, Incident Pending → Resolved (literal §4.4 arrow), ITSR linear per statusByCallType (no template creates ITSR). Seed history has New→Pending/New→In Process; history is not re-validated. Access is permission-based (not role names); approver visibility via assigned approvals; admin read-only (no actions). canReopenAt ≤ 7 days, shouldAutoClose > 7 days. Note: Vite warns `vitest.config.ts` imports "./vite.config" without extension (warning only; file owned by phase 5). 8/32 (25%)

### [2026-11-12T15:00:00Z] Task Complete: 2.4 — Session, Login และ route guard

**Phase**: implementation
**Action**: task 2.4 implemented (standard mode)
**Artifacts**: src/features/auth/{sessionStore.ts,LoginPage.tsx}, src/app/RequirePermission.tsx, src/app/layout/{UserMenu,Sidebar}.tsx; outside task Files (pending user OK for Add-on): src/app/App.tsx (login route, every route wrapped by RequirePermission from the route table, Toaster + TooltipProvider, STORAGE_CORRUPT toast on load — US-001)
**Outcome**: pass — 78 tests ✓, typecheck ✓, build ✓. Browser: no session → /login; login list 8 users with role badge (buttons ≥ 44px); สมชาย opens /approvals → My Space + toast "คุณไม่มีสิทธิ์เข้าหน้านี้", menu without อนุมัติ; ปรีชา sees and opens อนุมัติ; ธนา/admin no อนุมัติ; logout → /login, session cleared; stale userId → auto logout; corrupt itsm.db.v1 → seed + warning toast; reset (AlertDialog confirm) restores seed. Console: "Invalid hook call" seen once = Vite re-optimizing deps mid-session (mixed ?v= hashes on the old page); fresh load has no errors. Shortcut: reset reloads the page so pages re-read the dataset (revisit when data hooks exist, 2.6+). 9/32 (28%)

### [2026-11-12T15:05:00Z] Add-on: Task 2.4 App.tsx approved

**Phase**: implementation
**Action**: add-on approval
**Artifacts**: design/implementation.md §Add-on
**Outcome**: User approved ("บันทึก แล้ว next").

### [2026-11-12T15:40:00Z] Task Complete: 2.5 — Shared call components

**Phase**: implementation
**Action**: task 2.5 implemented (standard mode)
**Artifacts**: src/shared/icons.ts, src/shared/components/{StatusBadge,PriorityBadge,TimeLeft,EmptyState,FilterChips,CallTable,ColumnPicker}.tsx, {callColumns.tsx,useColumnPrefs.ts,format.ts}
**Outcome**: pass — typecheck ✓, build ✓, 78 tests ✓, validate-tokens 0. Temporary preview page (all 31 statuses, P1–P4, 4 Time Left states, chips, table of 9 seed calls, empty state) checked at 1280 and 375, then removed and App.tsx restored. Column picker updates table and persists `itsm.columns.{userId}`; Number always shown (disabled checkbox + "แสดงเสมอ"); Tab reaches each row's Number link (Enter opens Detail); < md = card list. [ASM] FR-055 "Subject Name" = requestor name, "Requestor" column = opened by; Read / Survey Result / Feedback Category omitted (Nice FR-056/067). Dates shown dd/mm/yyyy, HH:mm Asia/Bangkok. Resolved calls past due show "เลยกำหนด" (Resolved is not in closedStatuses — per US-006 literal). No component tests yet (task 5.5). No files outside task scope (App.tsx change was temporary and reverted). 10/32 (31%)

### [2026-11-12T16:20:00Z] Task Complete: 2.6 — Call Service: สร้างและอ่าน Support Call

**Phase**: implementation
**Action**: task 2.6 implemented (standard mode)
**Artifacts**: src/features/calls/callService.ts (createCall, validateCallInput, listVisibleCalls, getCall, runAutoClose), src/features/approvals/approvalService.ts (createApprovals); outside task Files (pending user OK for Add-on): src/main.tsx calls runAutoClose() before render ("เรียกตอนโหลด")
**Outcome**: pass — typecheck ✓, build ✓, 78 tests ✓ (no new unit tests — service tests are task 5.4). Validated from dev console: Incident tpl_001 → 100010 New P4 due +72h, queue/group from template, version from product, notes sanitized (script removed), summary trimmed; SR tpl_005 on behalf (usr_001 for usr_002) → 100011 Waiting For Approve, dueDate null (cat_004 slaStartsAfterApproval), approvals Department→usr_004, Head→usr_005, history created; validation errors in Thai (§4.5); usr_003 (no manager) → APPROVER_NOT_FOUND; RFC level on Incident → VALIDATION; runningNumber updated in same commit; getCall of other's call → NOT_FOUND; runAutoClose closes call_009 at 2026-11-16. Test data reset to seed afterwards. Decisions: category from serviceDefinitionId (fallback: first definition using the template); approver must have approval:decide_assigned else APPROVER_NOT_FOUND. 11/32 (34%)

### [2026-11-12T16:25:00Z] Add-on: Task 2.6 main.tsx approved

**Phase**: implementation
**Action**: add-on approval
**Artifacts**: design/implementation.md §Add-on
**Outcome**: User approved ("บันทึก แล้ว next").

### [2026-11-12T16:50:00Z] Task Complete: 2.7 — Service Catalog

**Phase**: implementation
**Action**: task 2.7 implemented (standard mode)
**Artifacts**: src/features/catalog/{CatalogPage,CategoryCard,ServiceTable}.tsx; outside task Files (pending user OK for Add-on): src/app/App.tsx — `guarded(route, page)` takes the page element; /catalog and /catalog/:categoryId → CatalogPage
**Outcome**: pass — typecheck ✓, build ✓, 78 tests ✓, validate-tokens 0. Browser: 4 top cards (icon allow-list, description, slaNote chip on User Access); Report Incident → 4 sub-categories, breadcrumb "Service Categories > …" back links work; Hardware → 5 services table (Name/Description/Request Type/Request this service); button → /calls/new?service=sdf_002; cat_003 → "ยังไม่มีบริการในหมวดนี้"; unknown id → "ไม่พบหมวดบริการนี้"; 375 = card list, breadcrumb links 44px, no h-scroll. Card layout changed to icon-on-top after seeing cramped 4-column cards at 1280. 12/32 (38%)

### [2026-11-12T17:00:00Z] Add-on: Task 2.7 App.tsx approved + standing permission

**Phase**: implementation
**Action**: add-on approval
**Artifacts**: design/implementation.md §Add-on
**Outcome**: User approved ("อนุญาต แล้ว next"). Standing permission: later page tasks may edit App.tsx to wire their own route without asking again (noted in each task's audit).

### [2026-11-12T17:30:00Z] Task Complete: 2.8 — Call Form ส่วนที่ 1

**Phase**: implementation
**Action**: task 2.8 implemented (standard mode)
**Artifacts**: src/features/call-form/{CallFormPage,callFormSchema,TemplateLookup}.tsx/ts, sections/{RequestedFor,Contact,PriorityTemplate}.tsx; App.tsx /calls/new → CallFormPage (standing permission from 2.7); outside task Files (pending user OK for Add-on): src/features/call-form/Field.tsx (shared label/error/aria-describedby + section card), token `--form-max: 55rem` (880, design-system §7) in tokens.css + design-system.md §3
**Outcome**: pass — typecheck ✓, build ✓, 78 tests ✓, validate-tokens 0. Browser: ?service=sdf_002 prefills Hardware - Incident (call type, classification, category, queue, 3-Medium / 4-Minor → P4); urgency 1-Critical → P2 immediately; phone "12ab" → "เบอร์โทรไม่ถูกต้อง", email "bad-email" → "รูปแบบอีเมลไม่ถูกต้อง" on blur (aria-describedby linked); Somebody else blank → "กรุณาเลือกผู้แจ้ง"; pick มาลี → name/phone/email filled, errors cleared; lookup search "RFC" → Application Change - RFC, levels switch to RFC set (P2); clear → urgency/impact disabled, priority —; 375 no h-scroll. Schema = validateCallInput (same as createCall) + level-set check ("ระดับนี้ใช้กับ RFC เท่านั้น"). Form validates on blur (onTouched); template-required error appears on submit (OK button is task 2.9). Console errors seen were stale entries from the known Vite dep re-optimize (old ?v hashes); fresh load renders without error. 13/32 (41%)

### [2026-11-12T17:35:00Z] Add-on: Task 2.8 Field.tsx + --form-max approved

**Phase**: implementation
**Action**: add-on approval
**Artifacts**: design/implementation.md §Add-on, .claude/rules/design-system.md §9
**Outcome**: User approved ("บันทึก แล้ว next").

### [2026-11-12T18:10:00Z] Task Complete: 2.9 — Call Form ส่วนที่ 2

**Phase**: implementation
**Action**: task 2.9 implemented (standard mode)
**Artifacts**: src/features/call-form/sections/{CiInfo,Details,Attachments}.tsx, RichTextEditor.tsx, CallFormPage.tsx (OK / Cancel, sticky bar < md); outside task Files (pending user OK for Add-on): src/features/calls/callService.ts `MESSAGES.attachmentCount` "แนบไฟล์ได้ไม่เกิน 5 ไฟล์" → "แนบได้สูงสุด 5 ไฟล์" (match US-019 wording)
**Outcome**: pass — typecheck ✓, build ✓, 78 tests ✓, validate-tokens 0. Browser: OK on empty form → "กรุณาเลือก Template" / "กรุณากรอกหัวข้อเรื่อง" / "กรุณาระบุรายละเอียด" + focus on Template (first invalid in DOM order); Product CRM → Version 5.2 read-only, Item enabled; clear Product → Version and Item cleared; 11MB file → "ไฟล์ใหญ่เกินกำหนด"; 6th file → "แนบได้สูงสุด 5 ไฟล์"; delete removes from list; Notes toolbar (aria-label, aria-pressed) inserts a table; OK → toast "สร้าง Support Call #100010 แล้ว", navigate /calls/:id, saved status New P4, productId/version, notes HTML, attachment metadata only, runningNumber 100010, history created; Cancel when dirty → AlertDialog (กลับไปกรอกต่อ keeps data, ทิ้งข้อมูล leaves), not dirty → back or /my-space when opened directly; 375 sticky OK/Cancel, no h-scroll. Tiptap v3 StarterKit already bundles Underline → separate @tiptap/extension-underline not registered (still in package.json). Bug found and fixed: Cancel ignored dirty state because formState.isDirty was only read in the click handler (RHF proxy not subscribed). Test data reset to seed. 14/32 (44%)

### [2026-11-12T18:15:00Z] Add-on: Task 2.9 callService message approved

**Phase**: implementation
**Action**: add-on approval
**Artifacts**: design/implementation.md §Add-on
**Outcome**: User approved ("บันทึก แล้ว next").

### [2026-11-12T18:45:00Z] Task Complete: 2.10 — Call Detail (มุมมองอ่าน)

**Phase**: implementation
**Action**: task 2.10 implemented (standard mode)
**Artifacts**: src/features/call-detail/{CallDetailPage,Timeline,ApprovalSteps,ActivityTable}.tsx; App.tsx /calls/:callId → CallDetailPage (standing permission); outside task Files (pending user OK for Add-on): src/features/call-form/RichTextEditor.tsx exports `RICH_TEXT_CLASS` (list/table styles) so Detail notes render like the editor
**Outcome**: pass — typecheck ✓, build ✓, 78 tests ✓, validate-tokens 0. Browser (admin): call_001–009 all render header (number, summary, StatusBadge, Priority, Time Left), Details read-only, sanitized Notes, Timeline oldest-first with Thai action labels + from→to status badges, ApprovalSteps on 005–008 (Department → Head, decision icon + label, approver, date, comment), Activities on 001/008, "ยังไม่มีกิจกรรม" elsewhere. สมชาย (usr_001): call_003 (มาลี's) and unknown id → "ไม่พบรายการหรือไม่มีสิทธิ์"; call_002 visible (opened on behalf). ≥ lg 2 columns (2/3 + 1/3); 375 single column in blueprint order Details → ขั้นอนุมัติ → Notes → Timeline (approval section rendered twice, one hidden per breakpoint), no h-scroll. [ASM] Activities shown as one labelled block per activity (6 fields) instead of a table — the blueprint puts them in the 1/3 column. Session restored to admin. 15/32 (47%)

### [2026-11-12T18:50:00Z] Add-on: Task 2.10 RICH_TEXT_CLASS approved

**Phase**: implementation
**Action**: add-on approval
**Artifacts**: design/implementation.md §Add-on
**Outcome**: User approved ("บันทึก แล้ว next").

### [2026-11-12T19:10:00Z] Task Complete: 2.11 — My Space

**Phase**: implementation
**Action**: task 2.11 implemented (standard mode)
**Artifacts**: src/features/my-space/MySpacePage.tsx; App.tsx /my-space → MySpacePage (standing permission)
**Outcome**: pass — typecheck ✓, build ✓, 78 tests ✓, validate-tokens 0. Browser: สมชาย → "Welcome Back : สมชาย ใจดี", Calls Logged For You (Count: 4) = 100005/100001/100009/100007, Calls You Opened On Behalf (Count: 1) = 100002 (matches seed); column picker in first card header, shared by both tables; created call on behalf of มาลี (#100011) → appears in card 2; อรุณี (no calls) → empty state in both cards (first has "แจ้งเรื่องใหม่" button); 375 card list, no h-scroll. Count shown as "(Count: n)" per US-009. 16/32 (50%)

### [2026-11-12T19:15:00Z] Phase 2 Complete — Core features (Frontend + Mock data)

**Phase**: implementation
**Action**: phase verify
**Outcome**: build ✓, 78 tests ✓, validate-tokens 0. Flow 1 clicked in browser as สมชาย: Service Catalog → Report Incident → Hardware → Mouse "Request this service" → form prefilled → Summary/Notes → OK → toast #100010 → Detail → My Space shows 100010 in Calls Logged For You. Console: fresh tab loading /calls/new, /calls/call_008, /my-space has no errors; earlier "Invalid hook call" entries came from Vite re-optimizing deps mid-session when Tiptap first loaded (mixed ?v hashes), not from app code. Test data reset to seed, session back to admin. Waiting for user confirmation before Phase 4.

### [2026-11-12T19:45:00Z] Phase 2 confirmed by user ("next") — Phase 4 started

### [2026-11-12T19:45:00Z] Task Complete: 4.1 — Call Service: assign, เปลี่ยนสถานะ, ความเห็น, ยกเลิก, re-open

**Phase**: implementation
**Action**: task 4.1 implemented (standard mode)
**Artifacts**: src/features/calls/callService.ts — assignCall, changeStatus, addComment, cancelCall, reopenCall (+ private _authorize, _commitChange, _statusPatch); MESSAGES.comment / closureCategory / assignee
**Outcome**: pass — typecheck ✓, build ✓, 78 tests ✓ (service unit tests = task 5.4). Exercised from dev console on seed: สมชาย / admin changeStatus → FORBIDDEN; ธนา Assigned → Resolved → INVALID_TRANSITION; → In Process (comment saved); Resolved without closure → "กรุณาเลือก Closure Category"; Resolved + Replaced Hardware sets resolvedAt + closureCategory; สมชาย empty comment → "กรุณาพิมพ์ความเห็น", comment + attachment metadata saved; cancel while Resolved → FORBIDDEN; reopen → Re-Opened (resolvedAt / closureCategory cleared); cancel → Cancelled + closeDate; มาลี on สมชาย's call → NOT_FOUND; assign New call to non-member → "กรุณาเลือกผู้รับผิดชอบในกลุ่ม", to group member → Assigned + history. Every action = one commit with one history entry (BR-5). Permission check = availableActions (same as ActionBar); invisible call → NOT_FOUND, visible but not allowed → FORBIDDEN. [ASM] assign history comment "มอบหมายให้ {name}" (history has no assignee field); assignee message text proposed (not in §4.5); re-open clears closureCategory. Test data reset to seed. No files outside task scope. 17/32 (53%)

### [2026-11-12T20:15:00Z] Task Complete: 4.2 — Call Detail: action bar และช่องความเห็น

**Phase**: implementation
**Action**: task 4.2 implemented (standard mode)
**Artifacts**: src/features/call-detail/{ActionBar,CommentBox}.tsx, CallDetailPage.tsx (availableActions, ActionBar right of header ≥ lg, CommentBox under Timeline, re-read after each action)
**Outcome**: pass — typecheck ✓, build ✓, 78 tests ✓, validate-tokens 0. Browser: ธนา on call_001 sees มอบหมาย / In Process / Cancelled → In Process → Resolved dialog: save without category → "กรุณาเลือก Closure Category", pick Replaced Hardware → Resolved, Closure Category shown, timeline adds 2 status entries immediately. สมชาย: no status buttons (only เปิดเรื่องใหม่ on Resolved call_001); empty comment → "กรุณาพิมพ์ความเห็น" + focus; comment appears in timeline; เปิดเรื่องใหม่ → Re-Opened (bar shows ยกเลิกเรื่อง); call_005 ยกเลิกเรื่อง → AlertDialog → Request Cancelled, bar and comment box gone. Admin: no action bar, no comment box. กมล on call_002 at 375: buttons wrap under header, no h-scroll. One button per allowed transition (US-026); Resolved → closure dialog; cancel (requestor or agent's Cancelled button) → confirm. Test data reset to seed, session back to admin. No files outside task scope. Seen, not changed (task 2.5 TimeLeft): overdue under 1 day shows "-0 days 22:56". 18/32 (56%)

### [2026-11-12T20:45:00Z] Task Complete: 4.3 — Search Support Call

**Phase**: implementation
**Action**: task 4.3 implemented (standard mode)
**Artifacts**: src/features/search/{SearchPage.tsx,searchCriteria.ts,fullText.ts}; App.tsx /calls/search → SearchPage (standing permission)
**Outcome**: pass — typecheck ✓, build ✓, 78 tests ✓ (fullText PBT = task 5.3), validate-tokens 0. Browser: ธนา (grp_001/002) Search with default Open + All → 100005/100001/100006/100009 only (own group queues); All → +100007/100004; from 2026-11-11 > to 2026-11-01 → "ช่วงวันที่ไม่ถูกต้อง", focus on "Open date to", no new search; Clear → defaults restored, results removed; Advance Criteria toggles (aria-expanded); Boolean "mouse AND NOT keyboard" → 100001; no match → "ไม่พบรายการ" + Clear; admin → all 7 open calls. Console: Boolean AND / OR / NOT / implicit AND / "phrase" / parentheses / dangling operators, Natural Language case-insensitive all-words; 1,000 calls: haystack build 47ms once, filter 1.4ms (NFR-002 ≤ 500ms). 375: single column, chips wrap, no h-scroll. Results appear after pressing Search (not on page load); a failed date check keeps the previous results. No files outside task scope. 19/32 (59%)

### [2026-11-12T21:20:00Z] Task Complete: 4.4 — Approvals: ตัดสินอนุมัติและหน้ารายการ

**Phase**: implementation
**Action**: task 4.4 implemented (standard mode)
**Artifacts**: src/features/approvals/approvalService.ts (listMyApprovals, decide, DEFAULT_APPROVAL_CRITERIA, APPROVAL_MESSAGES), ApprovalsPage.tsx, RejectDialog.tsx; App.tsx /approvals → ApprovalsPage (standing permission)
**Outcome**: pass — typecheck ✓, build ✓, 78 tests ✓, validate-tokens 0. Flow 2: สมชาย Add New User (tpl_005 / sdf_010) → #100010 Waiting For Approve, dueDate null; อรุณี sees it with "รอผลขั้นก่อนหน้า" and no buttons, decide() before ปรีชา → FORBIDDEN; ปรีชา อนุมัติ → Department Accepted; อรุณี อนุมัติ → history approved (→ Head Approved) + status_changed (→ Request In-Progress), dueDate = approval time + 72h (P4). Reject call_005 without reason → "กรุณาระบุเหตุผล" + focus, with reason → Department Declined + closeDate + history rejected with comment; list → "ไม่มีรายการรออนุมัติ". RFC (console): Department approved → stays Request For Change, Head approved → Ready for CAB, rejected → Cancelled. Done = All / RFC closed = Yes filters work. สมชาย opening /approvals → redirected to My Space with "คุณไม่มีสิทธิ์เข้าหน้านี้". 375: buttons under summary, no h-scroll. [ASM] "My Approvals" unchecked = also approvals of calls the user can see (read-only rows); default (checked) = assigned only per US-030. [ASM] Department approved as the last step of a Service Request writes 2 history entries (→ Department Accepted → Request In-Progress) to follow the state machine. SLA starts when the final approval lands on a call whose dueDate is null (set only for slaStartsAfterApproval categories). Test data reset to seed, session back to admin. No files outside task scope. 20/32 (63%)

### [2026-11-12T21:55:00Z] Task Complete: 4.5 — AI Assistant: interface, rule-based, แผง UI

**Phase**: implementation
**Action**: task 4.5 implemented (standard mode)
**Artifacts**: src/features/ai-assistant/{assistant.ts,ruleBased.ts,AiPanel.tsx}, src/app/layout/AppLayout.tsx (AI Assistant button, `ai:use`; wordmark truncates on small screens); outside task Files (pending user OK for Add-on): src/features/call-form/CallFormPage.tsx — reads `location.state.aiDraft` (C7 "Exposes state aiDraft") to pre-fill template / urgency / impact / summary / notes, and remounts per navigation (key = location.key) so a new ?service= or draft re-fills an already open form
**Outcome**: pass — typecheck ✓, build ✓, 78 tests ✓, validate-tokens 0. Browser (สมชาย): header button opens right sheet (≥ sm 400px, 375 = full width); "เมาส์เสีย คลิกไม่ติด" → card "Mouse - Incident" → เปิดฟอร์มที่กรอกไว้ → /calls/new with Hardware - Incident, P4, Summary and Notes filled, note "กรอกจาก AI Assistant ตรวจข้อมูลก่อนกด OK", no call created (still 9); "อยากอนุมัติคำขอ" → "คุณไม่มีสิทธิ์เข้าหน้านี้" (no button); "ดูคู่มือ" (/answers not a page) → unknown message; "อยากค้นหาเรื่อง" → ไปที่หน้า ค้นหาเรื่อง → /calls/search. Only text + route title sent to the assistant (FR-114). VITE_AI_MODE=azure → rule-based + "AI ไม่พร้อมใช้งาน ใช้การค้นหาแบบคำสำคัญแทน" banner until task 4.6 (not exercised: needs dev server restart with env). Rule data has no filters, so navigate results carry none. Test data reset, session back to admin. 21/32 (66%)

### [2026-11-12T22:05:00Z] Add-on Approved + Task Skipped: 4.5 / 4.6

**Phase**: implementation
**Action**: user approved "บันทึก ข้าม 4.6" — Add-on for CallFormPage.tsx (aiDraft pre-fill, key = location.key) recorded in design/implementation.md § Add-on; task 4.6 (Azure adapter) skipped, still blocked on Azure contract (OD-4 [TBD]); stays [ ] in tasks.md and is reported again in 5.10
**Outcome**: moving to Phase 4 end verification (Flow 2 + Flow 3)

### [2026-11-12T22:20:00Z] Phase Complete: 4 — Feature อื่น ๆ (Wave 3)

**Phase**: implementation
**Action**: Phase 4 end verification; Phase 4 marker ticked (4.6 skipped, blocked on Azure contract)
**Outcome**: pass — typecheck ✓, build ✓, 78 tests ✓, validate-tokens 0. Flow 2 (clicked): สมชาย Add New User form → #100010 Waiting For Approve, Due Date —; ปรีชา อนุมัติ in /approvals → Department Accepted; อรุณี อนุมัติ → Request In-Progress, Due Date +72h (Time Left 2 days 23:59), timeline 4 entries, both steps approved. Flow 3 (clicked): ธนา finds #100001 via Search → มอบหมาย to self → In Process → Resolved with Closure Category Replaced Hardware. Auto-close (console, cannot wait 7 days): runAutoClose(resolvedAt + 6d) closes only #100009 (resolved 10 days earlier), runAutoClose(resolvedAt + 8d) closes #100001 → Closed, byUserId system, action auto_closed; Detail shows Closed and no action buttons. Fresh tab: Detail / Approvals (agent redirected) / Search — no console errors, no 404. Test data reset to seed, session back to admin. completedTasks stays 21/32 (4.6 not done); next 5.1. Waiting for user confirmation before Phase 5.

### [2026-11-12T22:40:00Z] Task Complete: 5.1 — Test infrastructure

**Phase**: implementation
**Action**: task 5.1 implemented (standard mode)
**Artifacts**: tests/fixtures/index.ts (buildDataset, buildCall, buildUser, buildStore, FIXED_NOW), tests/setup.ts (localStorage.clear before each test; RTL cleanup + vi.useRealTimers after each — fake timers are opt-in per test via vi.useFakeTimers + vi.setSystemTime(FIXED_NOW)), vitest.config.ts (setupFiles, v8 coverage over src excluding shared/ui + main.tsx), playwright.config.ts (tests/e2e, chromium, webServer npm run dev with VITE_AI_MODE=mock, reuseExistingServer outside CI)
**Outcome**: pass — typecheck ✓, 78 tests ✓ with setup file, `npx playwright test --list` runs (0 tests until 5.6), `vitest run --coverage` works (baseline 21% lines). Throwaway smoke test of the builders passed and was deleted. Not done: Vite "configLoader native" warning (import without extension in vitest.config.ts) — fixing needs `allowImportingTsExtensions` in tsconfig.node.json, outside task Files; left as is, reported to user. Suite wall time rose from ~2s to ~5s (setup imports @testing-library/react in every file). 22/32 (69%)

### [2026-11-12T22:45:00Z] Add-on Approved: 5.1 — tsconfig.node.json

**Phase**: implementation
**Action**: user approved "แก้ แล้ว next" — tsconfig.node.json allowImportingTsExtensions: true; vitest.config.ts imports ./vite.config.ts; recorded in design/implementation.md § Add-on
**Outcome**: pass — tsc ✓, 78 tests ✓, build ✓, configLoader warning gone

### [2026-11-12T23:00:00Z] Task Complete: 5.2 — PBT: rules engine (P1–P6, P9, P10)

**Phase**: implementation
**Action**: task 5.2 implemented (standard mode)
**Artifacts**: tests/properties/{priority,sla,stateMachine,numbering}.properties.test.ts (numRuns 200) — P1 standard + RFC matrix + wrong level set fails; P2 urgency and impact monotonic; P3 due = start + SLA over 2000–2099 (whole seconds); P4 overdue ⟺ open and now > due, now === due not overdue, awaiting → "รออนุมัติ"; P5 nextStatuses ⊆ type, assertTransition ⟺ nextStatuses; P6 random walk from initialStatus (with / without approval); P9 consecutive, unique with taken numbers, 6 digits, fails past 999999; P10 auto-close ⟺ Resolved and > 7 days (incl. history fallback), elapsed biased to the 7-day edge
**Outcome**: pass — 20 property tests ✓, full suite 98 ✓, tsc ✓. Negative control: due date +1s and auto-close boundary shifted by 1s were each caught (P10 needed the edge-biased generator; first version missed it), source restored. Spec conflict found (pending user decision): correctness.md P5 edge case says closed statuses have no way out, but Requirements §4.4 state machine has Completed / Failed / Request Completed → Closed while data puts those 3 in closedStatuses; code follows §4.4, test asserts "closed statuses can only move on to Closed" + Closed / Cancelled / Request Cancelled are terminal. No source files changed. 23/32 (72%)

### [2026-11-12T23:05:00Z] Spec Refined: correctness.md P5 edge case

**Phase**: implementation
**Action**: user approved "แก้ spec แล้ว next" — P5 edge case now: closedStatuses can only move on to Closed; Closed / Cancelled / Request Cancelled are terminal (matches Requirements §4.4 and the 5.2 test); recorded under correctness.md § Add-on
**Outcome**: no code change

### [2026-11-12T23:30:00Z] Task Complete: 5.3 — PBT: access, full-text, sanitizer (P7, P8, P11, P12)

**Phase**: implementation
**Action**: task 5.3 implemented (standard mode); Add-on approved by user ("แก้ sanitize.ts")
**Artifacts**: tests/properties/{access,fullText,sanitize}.properties.test.ts (numRuns 200) — P7 requestor sees exactly own calls, approver extra only with own approval, agent never another group's calls unless own; P8 can() ⟺ role lists perm (known perms, random strings, __proto__ / constructor), unknown role / null user denied; P11 AND / adjacent / OR / NOT laws over random nested expressions + reference evaluator, Natural Language case-insensitive; P12 idempotent + parsed output has no script / iframe / svg / style / img, no on* attribute, no javascript: URL. Outside task Files (Add-on): src/shared/sanitize.ts — re-sanitize until stable (max 3 passes)
**Outcome**: pass — properties 33 ✓ (sanitizer file re-run 3× with new seeds ✓), full suite 111 ✓, tsc ✓. P12 found a real bug: sanitizeHtml("<p><table><p>") → "<p><p></p><table></table></p>", second pass different (malformed input only; safety held) → fixed with the loop. Negative control: agent group check removed and OR evaluated as AND were each caught; source restored. Not caught: can() returning true for the literal permission 'x' (random strings rarely hit one exact value). Browser: call_001 Notes render, table colspan and link target/rel kept. 24/32 (75%)

### [2026-11-13T00:00:00Z] Task Complete: 5.4 — Unit test: services, data, AI

**Phase**: implementation
**Action**: task 5.4 implemented (standard mode)
**Artifacts**: tests/unit/services/callService.test.ts (26: validateCallInput messages; createCall success one commit / approvals + SLA wait / on behalf / FORBIDDEN / VALIDATION saves nothing / BR-02 / APPROVER_NOT_FOUND; listVisibleCalls; getCall NOT_FOUND; assign / changeStatus / addComment / cancel / reopen each success + FORBIDDEN (+ NOT_FOUND, INVALID_TRANSITION, VALIDATION); runAutoClose boundary), tests/unit/services/approvalService.test.ts (15: createApprovals chain / none / APPROVER_NOT_FOUND; listMyApprovals default / Done All / filters / waiting / no permission; decide SR last step → In-Progress + SLA in one commit, single step, reject needs reason → Declined, earlier step pending → FORBIDDEN, RFC rejected → Cancelled, RFC approved → Ready for CAB, NOT_FOUND / FORBIDDEN), tests/unit/ai/assistant.test.ts (7: RuleBased draft / escaping / 200 cap / rule order / navigate / unknown; askAssistant mock no notice no fetch; azure → fallback + AI_UNAVAILABLE, log has no user text)
**Outcome**: pass — tests/unit 126 ✓, full suite 159 ✓, tsc ✓, coverage src/domain 100% lines / 97.7% branches (≥ 80%). Negative control: SLA start removed and closure-category check removed were each caught; source restored. Not done: Azure fetch cases (200 / 502 / timeout / bad JSON) — no azure.ts until task 4.6; marked with a shortcut comment in the test. Logger PII stripping already covered by tests/unit/shared/logger.test.ts (task 1.4). Data layer already covered by tests/unit/data (task 2.1). No source files changed. 25/32 (78%)

### [2026-11-13T00:30:00Z] Task Complete: 5.5 — Component test

**Phase**: implementation
**Action**: task 5.5 implemented (standard mode)
**Artifacts**: tests/unit/components/helpers.tsx (silenceLogs, stubBrowserApis — ResizeObserver / Range rects / scrollIntoView / elementFromPoint that jsdom lacks for Radix + Tiptap, resetApp, renderAt with a location probe), StatusBadge.test.tsx (36: every status shows icon + label; 6 groups → 6 distinct icon shapes), RequirePermission.test.tsx (4: no session → /login, missing permission → /my-space, denied My Space → alert not loop, allowed → page), MySpacePage.test.tsx (2: both empty states + Count 0 for usr_005; usr_001 Count 4 / 1), ActionBar.test.tsx (5 via Call Detail: agent in group assign + one button per transition, requestor cancel only, Resolved → re-open, admin read-only, other group not found), CallForm.test.tsx (4: OK on empty form → summary / notes messages, aria-invalid + aria-describedby, nothing saved; bad e-mail / phone; direct form needs template; summary > 200)
**Outcome**: pass — `npm test -- tests/unit/components` 47 ✓, full suite 206 ✓, tsc ✓. Negative control: RequirePermission check removed and rejected group icon swapped were each caught; source restored. First CallForm run was stopped by the user mid-run; cause then found as "ResizeObserver is not defined" (jsdom) and stubbed in helpers. No source files changed. 26/32 (81%)

### [2026-11-13T01:00:00Z] Task Complete: 5.6 — E2E Flow 1

**Phase**: implementation
**Action**: task 5.6 implemented (standard mode)
**Artifacts**: tests/e2e/flow1-incident.spec.ts (Critical Path 1: clear localStorage → login สมชาย → Service Catalog → Report Incident → Hardware / Notebook / PC → Request this service: Keyboard - Incident → Summary + Notes → OK → toast "สร้าง Support Call #100010 แล้ว" + Detail page with number and summary → My Space "Calls Logged For You" Count 5 with the new call)
**Outcome**: pass — `npm run test:e2e -- flow1` 1 ✓, tsc ✓. Playwright chromium v1254 was missing; downloaded with `npx playwright install chromium` after user approval (no config change). Negative control: post-submit navigation changed to /my-space was caught; source restored. No source files changed. 27/32 (84%)

### [2026-11-13T01:30:00Z] Task Complete: 5.7 — E2E Flow 2

**Phase**: implementation
**Action**: task 5.7 implemented (standard mode)
**Artifacts**: tests/e2e/flow2-approval.spec.ts (Critical Path 2: clear localStorage → สมชาย requests Catalog → User Access → Add New User → #100010 Waiting For Approve, Time Left "รออนุมัติ" → logout → ปรีชา approves Department approval on Approvals → logout → อรุณี approves Head approval → สมชาย opens Detail: Request In-Progress, Time Left "2–3 days hh:mm" (P4 72h from Head approval; spec comment corrected from "P3" in task 5.10))
**Outcome**: pass — `npm run test:e2e -- flow2` 1 ✓, tsc ✓. First run failed on the test's own selector (logout is a button in a Popover, not a menuitem); fixed in the spec. Negative control: SLA start at final approval disabled was caught (Time Left "—"); source restored. No source files changed. 28/32 (88%)

### [2026-11-13T02:00:00Z] Task Complete: 5.8 — E2E Flow 3

**Phase**: implementation
**Action**: task 5.8 implemented (standard mode)
**Artifacts**: tests/e2e/flow3-agent.spec.ts (Critical Path 3: clear localStorage → ธนา → Search with Open chip → open #100001 → In Process → Resolved dialog: save without Closure Category shows the error and keeps the dialog → pick "Replaced Hardware" + note → saved; timeline gains exactly two entries (In Process, Resolved) by ธนา in order, the second with the note; no further agent transition button)
**Outcome**: pass — `npm run test:e2e -- flow3` 1 ✓, full `npm run test:e2e` 3 ✓ (flows run in parallel workers, each in its own browser context), tsc ✓. Negative control: closure-category check in changeStatus removed was caught; source restored. No source files changed. 29/32 (91%)

### [2026-11-13T02:45:00Z] Task Complete: 5.9 — UX / a11y / responsive

**Phase**: implementation
**Action**: task 5.9 implemented (standard mode)
**Method**: ui-ux-pro-max UX guidelines (focus states, keyboard navigation, form labels, skip links, submit feedback, inline validation) used as the checklist — no style / palette / font selection. Scripted audit (scratchpad, not in repo) over 15 page × role combinations (login; สมชาย My Space / Catalog / category / form from catalog / direct form / Search / Detail ×2; ปรีชา Approvals / Detail; ธนา Detail / Search; admin My Space / Search) at 375 / 768 / 1280 = 45 runs: page horizontal overflow, interactive targets < 44px, unlabeled form controls, img alt, 60× Tab at 1280 checking focus ring, console errors / warnings, prefers-reduced-motion computed transitions. Screenshots at 375 of Detail / form / Search for overlap. `validate-tokens.cjs` clean.
**Findings**: 0 overflow, 0 unlabeled controls, 0 console errors, every page keyboard-reachable (54–59 tab stops) with a visible focus ring (Notes editor rings its wrapper via focus-within). Fixed: (1) Approvals call-number link was 26px tall → min-h tap target (src/features/approvals/ApprovalsPage.tsx); (2) reduced motion still animated shadcn / Tailwind utilities at Tailwind's 150ms default (they do not use --dur-*) → global reduced-motion rule (src/styles/globals.css). False positives: 16px radio / checkbox sit inside 44px labels. Reported, not done (outside spec): no skip-to-content link (ui-ux-pro-max Medium).
**Outcome**: pass — re-audit clean (reduced-motion transitions 0.01ms), `npm test` 206 ✓, `npm run test:e2e` 3 ✓, `npm run build` ✓, tsc ✓. 30/32 (94%)

### [2026-11-13T03:30:00Z] Task Complete: 5.10 — Verify รวมก่อนส่งมอบ

**Phase**: implementation
**Action**: task 5.10 verification (standard mode)
**Checks**: `npx tsc -b` ✓ · `npm run build` ✓ (warning only: one JS chunk 1,312 kB / 406 kB gzip > 500 kB) · `npm test` 25 files / 206 ✓ · `npm run test:e2e` 3 ✓ · `validate-tokens.cjs` clean · dev server log no errors. Scripted walk (scratchpad) as all 8 sample users at 1280: every sidebar item opens its page, Search → first visible call opens Detail, AI panel opens, /approvals allowed for approvers (ปรีชา, อรุณี) and redirected to /my-space for the other 6; console 0 errors (only the intended `route.denied` warn logs from the redirect check). Task 5.9 audit covered the same pages at 375 / 768 / 1280.
**Requirements review**: 34 / 34 stories mapped to tasks; every mapped task ticked except 4.6. Must (20) + Should (11) complete. Low (AI, 3): US-032 / US-033 work on the rule-based mock; US-034 partial — fallback notice + keyword fallback when the AI call fails is implemented and unit-tested, but the real Azure call (10 s timeout, payload without PII) waits for task 4.6 / Azure contract (OD-4).
**Notes**: admin can open แจ้งเรื่องใหม่ because seed `rolePermissions.admin` includes `call:create`; "read-only" in the requirements applies to other people's calls (Detail shows no actions) — consistent with data. Tracking fixes: Phase 1 header was never ticked although 1.1–1.5 and its end marker were done → ticked; flow2 spec comment said P3, actual P4 (72 h) → corrected (comment only).
**Outcome**: pass — Phase 5 complete. 31/32 (97%); 4.6 blocked.

### [2026-11-13T03:45:00Z] Build: Detection

**Phase**: build
**Action**: build-detect
**Artifacts**: (none — detection only)
**Outcome**: Detected Node.js (npm, Vite + tsc) with 6 quality gates configured: build, type-check, unit + PBT (vitest), E2E (playwright), coverage src/domain ≥ 80% (vitest v8), design tokens (validate-tokens.cjs) + npm audit (security, advisory). No linter, no CI config.

### [2026-11-13T04:15:00Z] Build: Verification

**Phase**: build
**Action**: build-run, test-run, quality-check, ops-check
**Artifacts**: build-report.md (draft)
**Outcome**: Build passed (chunk-size warning: one JS chunk 1,312 kB). Tests: 209 passed, 0 failed (vitest 206 incl. 33 PBT, Playwright 3). Gates: 4 passed (type-check, security npm audit 0 vulns, coverage src/domain 100% ≥ 80%, design tokens), 0 failed, 1 skipped (lint — not configured). Ops: 2 passed (structured logging, client startup validation), 0 failed, 3 N/A or open (health / shutdown N/A — no server; proxy startup warning waits for task 4.6). Traceability: 33/34 stories covered, US-034 partial (task 4.6 blocked).

### [2026-11-13T04:30:00Z] Build: Report Approved

**Phase**: build
**Action**: build-approved
**Artifacts**: build-report.md
**Outcome**: Build verified (approved-with-warnings: chunk size, no linter, task 4.6 blocked). 209 tests passing, 4 quality gates met, lint skipped. Deploy phase not dispatched — skipped this round per D4-8 (tasks.md Phase 6); delivery = local dev + `npm run build`. Workflow stays active only for task 4.6 (Azure contract OD-4).

### [2026-11-13T05:30:00Z] Change Request: โทนแดง-ขาว (D3-15 rev)

**Phase**: design → implementation (refine-spec-first)
**Action**: change request — user asked for a red-white design "like CIMB"; clarified to red-white tone only, no CIMB logo / hex / name (HARD RULE #9, Requirements §1.2). Workflow: AI-DLC change request. Decisions: "use recommendations".
**Artifacts**: decisions-design.md § Add-on (D3-15 rev) · .claude/rules/design-system.md §1, §2 (+ contrast table), §6 (Button destructive), §9 Add-on · src/styles/tokens.css (new primitives crimson / charcoal, neutral values → cool, primary / accent / ring repointed, status new → accent-soft, progress → info-soft; indigo / teal names kept, unused) · src/assets/logo.svg (fill → #b0142a; loaded via <img>, cannot read CSS vars) · src/shared/ui/button.tsx (destructive variant → outlined) · CircleX icon on the 4 destructive actions: UserMenu reset, RejectDialog ปฏิเสธ, ActionBar ยกเลิกเรื่อง, CallFormPage ทิ้งข้อมูล
**Outcome**: pass — all text / UI pairs ≥ AA (primary 7.05, soft 8.25, accent 12.49, destructive 5.52, placeholder 5.04, input border 3.55, status progress 6.35, new 13.66). Found during browser check: progress badges on primary-soft turned pink-red next to rejected → moved to info-soft (recorded in design-system §9). validate-tokens clean, tsc ✓, build ✓, `npm test` 206 ✓, `npm run test:e2e` 3 ✓, UI audit 45 runs (375 / 768 / 1280): 0 overflow, 0 unlabeled, 0 console errors.

### [2026-11-13T06:15:00Z] Change Request: Sidebar background — ลาย chevron ออกแบบเอง

**Phase**: design → implementation (refine-spec-first)
**Action**: change request — user asked for a sidebar background modelled on the CIMB Chevron. Declined to imitate it (third-party logo, HARD RULE #9; policy §7 forbids third-party logos as backgrounds even with rights; no official file). User chose a self-designed › chevron pattern.
**Artifacts**: decisions-design.md § Add-on · .claude/rules/design-system.md §3 (token map), §7 (Sidebar background), §9 · src/styles/tokens.css (`--sidebar-pattern-color` = `--primary`, `--sidebar-pattern-opacity` 0.12, `--sidebar-pattern-size` 1.75rem) · src/styles/globals.css (`.sidebar-chevron::before` — colour from token, SVG used only as mask-image, fades out towards the top, pointer-events none, no animation) · src/app/layout/AppLayout.tsx (class on the ≥ lg aside and the < lg drawer)
**Outcome**: pass — opacity raised 0.07 → 0.12 after browser check (0.07 near invisible); worst-case menu text on pattern 14.34:1. Browser: desktop sidebar + mobile drawer show the pattern. validate-tokens clean, tsc ✓, build ✓, `npm test` 206 ✓, `npm run test:e2e` 3 ✓, UI audit 45 runs: 0 overflow, 0 unlabeled, 0 console errors.

### [2026-11-13T06:45:00Z] Change Request (update): Sidebar background → supplied image

**Phase**: design → implementation (refine-spec-first)
**Action**: user interrupted and supplied a red geometric image (abstract shapes, no logo) to use instead of the chevron pattern. The chevron pattern (never committed) was replaced.
**Artifacts**: src/assets/sidebar-bg.webp (992×1586, 23 kB, user-supplied) · src/styles/tokens.css (`--sidebar-bg` → crimson-800 fallback; new `--sidebar-overlay`, `--sidebar-fg`, `--sidebar-border`, `--sidebar-ring`, `--sidebar-item-hover-bg`; `--sidebar-item-active-bg/fg` → white / crimson-700; `--sidebar-pattern-*` removed — added and removed in the same uncommitted change) · src/styles/globals.css (`.sidebar-surface`: image `cover` left top + overlay, semantic tokens re-pointed inside so nav links, drawer title, close button and focus ring turn light) · src/app/layout/AppLayout.tsx · design-system.md §3, §7, §9 · decisions-design.md Add-on update
**Outcome**: pass — measured on the real image at sidebar heights 560 / 788 / 1100 px: white text on the bare image min 2.72:1 (fail) → with 35% overlay ≥ 5:1; active item 9.34:1; hover darkens (black 20%) so contrast only rises. Focus ring inside sidebar = white. Browser: desktop sidebar + mobile drawer. validate-tokens clean, tsc ✓, build ✓ (image emitted as hashed asset), `npm test` 206 ✓, `npm run test:e2e` 3 ✓, UI audit 45 runs: 0 overflow, 0 unlabeled, 0 console errors.

### [2026-11-13T07:15:00Z] Change Request: Sidebar เต็ม pane ซ้าย

**Phase**: design → implementation (refine-spec-first)
**Action**: change request — sidebar full height on the left (≥ lg). Plan approved ("เริ่มทำ").
**Artifacts**: design-system.md §7 (Shell diagram), §9 · decisions-design.md Add-on · src/app/layout/AppLayout.tsx (≥ lg: aside `sticky top-0 h-dvh` with the wordmark row on top (56px, `tone="light"`), header + main in the right column; < lg unchanged — header wordmark `lg:hidden`; logo gets a 1px `--sidebar-border` ring on the dark surface because the crimson square blended into the red image)
**Outcome**: layout pass — 1280 / 768 / 375 checked in the browser; validate-tokens clean, tsc ✓, build ✓, `npm test` 206 ✓, `npm run test:e2e` 3 ✓, walk as 8 users 0 errors (12 intended `route.denied` warns). UI audit found page overflow on สมชาย's My Space (768: 288 px, 1280: 32 px) — not caused by this change: the TimeLeft sr-only "ใกล้ครบกำหนด" span (position absolute) escapes CallTable's `overflow-x-auto` wrapper, which is not a containing block; it appears only now because call_001 entered the < 25 % SLA window in real time. Reported to the user, not fixed (outside this change).

### [2026-11-13T07:40:00Z] Bug fix: table page overflow from sr-only text

**Phase**: implementation (bug fix, user approved "แก้เลย")
**Action**: TimeLeft warning `sr-only` span (position absolute) escaped CallTable's `overflow-x-auto` wrapper (not a containing block) and widened the page on My Space ≥ md.
**Artifacts**: src/shared/components/CallTable.tsx, src/features/catalog/ServiceTable.tsx (wrapper → `relative`) · docs/postmortems/table-sr-only-overflow.md
**Outcome**: pass — before: overflow 288 px (768) / 32 px (1280); after: UI audit 45 runs overflow 0, console 0 · tsc ✓, `npm test` 206 ✓, `npm run test:e2e` 3 ✓, build ✓.

### [2026-11-13T08:10:00Z] Change Request: Header เข้ากับ sidebar (L-frame)

**Phase**: design → implementation (refine-spec-first)
**Action**: change request — user chose a dark header continuing the sidebar (option 1 of 3). Plan approved ("เริ่มทำ").
**Artifacts**: design-system.md §2 (Header row), §3, §7, §9 · decisions-design.md Add-on · src/styles/tokens.css (`--palette-crimson-900: #4a0a11` sampled from the sidebar image's right edge after the overlay; `--header-bg`) · src/styles/globals.css (token re-pointing split out of `.sidebar-surface` into shared `.on-brand`; new `.header-surface` with `--accent` → white for the AI Assistant button) · src/app/layout/AppLayout.tsx (header `on-brand header-surface`; Wordmark always light — unused `tone` prop removed)
**Outcome**: pass — white on header 15.7:1; header bottom border lines up with the sidebar logo-row border; user-menu popover and AI panel (portals) stay light. Browser 1280 / 375 checked. validate-tokens clean, tsc ✓, build ✓, `npm test` 206 ✓, `npm run test:e2e` 3 ✓, UI audit 45 runs: 0 overflow, 0 unlabeled, 0 console errors.

### [2026-11-13T08:45:00Z] Change Request: Sidebar แยกจากส่วนอื่น — การ์ดลอย

**Phase**: design → implementation (refine-spec-first)
**Action**: change request — user wanted the sidebar to read as a sidebar at a glance; chose the floating card (option 2 of 3). Plan approved ("เริ่มทำ"). Replaces the uncommitted L-frame header from the previous entry.
**Artifacts**: design-system.md §2, §3, §7 (Shell diagram), §9 · decisions-design.md Add-on · src/styles/tokens.css (`--sidebar-inset` 12px, `--sidebar-radius`, `--sidebar-shadow`; `--palette-crimson-900` and `--header-bg` removed — added and removed within the same uncommitted change) · src/styles/globals.css (`.header-surface` removed; `.on-brand` kept for sidebar + drawer) · src/app/layout/AppLayout.tsx (≥ lg aside `sticky top/m = --sidebar-inset`, height 100dvh − 2 × inset, radius, shadow, no border; header `bg-background` without border; Wordmark `tone` restored — light in the sidebar, brand colour in the < lg header)
**Outcome**: pass — browser 1280 × 800, 1280 × 420 (aside 12–408 px, fits), 375 (light header, brand logo); rounded corners clip the image. validate-tokens clean, tsc ✓, build ✓, `npm test` 206 ✓, `npm run test:e2e` 3 ✓, UI audit 45 runs: 0 overflow, 0 unlabeled, 0 console errors.

### [2026-11-13T09:20:00Z] Change Request: Menu item เข้ากับรูปพื้นหลัง (impeccable shape → build)

**Phase**: design → implementation (refine-spec-first)
**Action**: `/impeccable shape` — user: the solid white active pill looks like a sticker on the image; active must stay instantly visible but not solid white. Impeccable init created PRODUCT.md (product truth confirmed by the user). Brief "lit facet" confirmed, then "ลงมือทำ".
**Artifacts**: PRODUCT.md (new) · design-system.md §7, §9 · decisions-design.md Add-on · src/styles/tokens.css (`--sidebar-item-active-bg` → black 28%, `-fg` → white, new `-edge`, `-ring`, `-shadow`; hover 0.2 → 0.14) · src/app/layout/Sidebar.tsx (active: semibold + inset-shadow lit left edge + 1px translucent ring; no `border-left`, per craft floor)
**Outcome**: pass — white text at the brightest point under the menu: active ≥ 7.86:1, hover ≥ 6:1 (white 16% fill rejected at 3.85:1). Browser: desktop sidebar + mobile drawer. Impeccable detector: 0 findings. validate-tokens clean, tsc ✓, build ✓, `npm test` 206 ✓, `npm run test:e2e` 3 ✓, UI audit 45 runs: 0 overflow, 0 unlabeled, 0 console errors.

### [2026-11-13T09:50:00Z] Change Request: Animation เปลี่ยน menu item (sliding indicator)

**Phase**: design → implementation (refine-spec-first, `impeccable animate`)
**Action**: user chose the sliding indicator over cross-fade. Motion thesis: the lit facet travels from the old item to the new one, showing where navigation came from and went.
**Artifacts**: design-system.md §3 (Motion), §7, §9 · decisions-design.md Add-on · src/app/layout/Sidebar.tsx (one `aria-hidden` indicator measured from the `aria-current="page"` link in `useLayoutEffect` on pathname + ResizeObserver; `translate` + `opacity` with `--dur-normal` / `--ease-standard`; transition enabled only after the first frame; items keep semibold + text colour, `relative` to paint above the indicator)
**Outcome**: pass — browser: transform transition running mid-way (y 12 → 82.6 → 108); slide starts after the new route commits (~160 ms in dev). Playwright: no animation on first load, opacity 0 on a non-menu route (/calls/call_001), drawer places the indicator on the active item, reduced-motion → 0.01 ms, 0 console errors. Impeccable detector 0 findings. tsc ✓, build ✓, `npm test` 206 ✓, `npm run test:e2e` 3 ✓, UI audit 45 runs clean.

### [2026-11-13T10:10:00Z] Refinement: ลบ accent AI slop ของ menu item

**Phase**: implementation (`/impeccable` refinement, refine-spec-first)
**Action**: user flagged the active item's 2px white left edge + 1px translucent outline as AI slop (accent bar on a rounded card; craft floor refuses it). Removed both; active distinguished by a darker recessed fill + semibold.
**Artifacts**: design-system.md §3, §7, §9 · decisions-design.md Add-on update · src/styles/tokens.css (`--sidebar-item-active-bg` 0.28 → 0.32; `-edge`, `-ring`, `-shadow` removed — added and removed within the same uncommitted change) · src/app/layout/Sidebar.tsx (indicator without the shadow class)
**Outcome**: pass — white text at the brightest point on active 8.87:1. Browser 1280 checked. Motion check: no slide on first load, hidden on non-menu route, drawer placement, reduced-motion, 0 errors. Impeccable detector 0 findings. tsc ✓, build ✓, `npm test` 206 ✓, `npm run test:e2e` 3 ✓.

### [2026-11-13T11:00:00Z] Refinement: My Space ตาม impeccable critique

**Phase**: implementation (`/impeccable critique` → harden, distill, bolder/layout, clarify/onboard, polish · refine-spec-first)
**Action**: critique 27/40 (dual-agent). User chose Time Left + urgency, Resolved stops the SLA, scope P1 + P2, then "ทำทั้งหมดเลย". Resolved no longer shows "เลยกำหนด" (`SLA_STOPPED_STATUSES` in `timeLeft`, `closedStatuses` untouched so Resolved can still be closed / re-opened). Default columns 8 → 5. My Space rows sorted by urgency; one-line attention summary under the title; approver link "รออนุมัติจากคุณ n" → /approvals; agent "เรื่องเปิดในคิวกลุ่มคุณ n" / admin "เรื่องเปิดทั้งระบบ n" → /calls/search. Column picker hidden < md (it only affects the table). Not done (P3, US-009 AC): title "Welcome Back", "(Count: n)", duplicate CTA in the empty state.
**Artifacts**: requirements.md US-006 / US-009 + Add-on · design/correctness.md P4 · design-system.md §7, §9 · decisions-design.md Add-on · src/domain/sla.ts · src/shared/components/callColumns.tsx · src/features/my-space/MySpacePage.tsx · tests/unit/domain/sla.test.ts · tests/properties/sla.properties.test.ts · tests/unit/components/MySpacePage.test.tsx (+4)
**Outcome**: pass — browser 1280: table fits the card (wrapper overflow 0), Time Left visible, Resolved shown grey; 375 cards ok; page overflow 0. tsc ✓, build ✓, `npm test` 211 ✓, `npm run test:e2e` 3 ✓, UI audit 45 runs clean, tokens ✓, impeccable detector 0 findings.

### [2026-11-13T12:00:00Z] Change request: บริการของ Request a Service

**Phase**: implementation (change request, refine-spec-first)
**Action**: user asked to bring each Request a Service sub-menu from the old system into the app (Catalog + My Space shortcuts; 3–5 services per sub-category; data-flagged popular services). Read the old catalog read-only via Claude in Chrome (14 sub-categories). Added 12 sub-categories + services to the 2 existing ones (60 new service definitions, generic names — internal system names dropped), 12 Service Requests templates, 3 fictional queues/groups (Cloud & Infrastructure, IT Security, Office Administration) linked to sample agents, `featured?` on ServiceDefinition (6 services), My Space "บริการยอดนิยม" strip, 9 Lucide icons in the allow-list. `SCHEMA_VERSION` 1 → 2 with `upgradeReferenceData`: stored data older than the seed takes the seed's reference collections and keeps calls / history / approvals / activities / running number. slaNote is display text; due date still follows priority (BR-04).
**Artifacts**: requirements.md Add-on · design/data-model.md (+ Add-on) · design-system.md §7, §9 · decisions-design.md Add-on · src/data/database.json · src/data/schemas.ts · src/domain/types.ts · src/data/seed.ts · src/data/storage.ts · src/shared/icons.ts · src/features/my-space/MySpacePage.tsx · tests/unit/data/storage.test.ts (+2) · tests/unit/components/MySpacePage.test.tsx (+1)
**Outcome**: pass — browser 1280: Request a Service shows 14 cards with SLA notes; existing localStorage data upgraded in place (featured strip appeared without a reset); /calls/new?service=sdf_057 pre-fills "Software Install - Service Request". tsc ✓, build ✓, `npm test` 214 ✓, `npm run test:e2e` 3 ✓, UI audit 45 runs clean, tokens ✓, impeccable detector 0 findings.

### [2026-11-13T12:40:00Z] Change request: container ด้านขวาของ sidebar

**Phase**: implementation (change request, refine-spec-first)
**Action**: user said the content looked like it floated alone (page #FAFAFA vs white cards 1.04:1) and chose "panel เทาคู่ sidebar". ≥ lg the content column is a framed panel (inset, radius and height of the sidebar; `--surface-sunken` + 1px `--border`), header inside it, the panel scrolls itself and a route change scrolls it (and the window) back to the top. < lg the content area uses the panel colour full-bleed.
**Artifacts**: design-system.md §3, §7, §9 · decisions-design.md Add-on · src/styles/tokens.css (`--content-panel-bg`, `--content-panel-border`, `--content-panel-radius`) · src/app/layout/AppLayout.tsx
**Outcome**: pass — browser 1280: header pinned at the panel top while scrolling, window not scrollable, route change resets scroll to 0; card vs panel 1.13:1 (was 1.04), muted text on panel 6.54:1, foreground 15.71:1. 768 / 375 checked (mobile sticky form bar ok). tsc ✓, build ✓, `npm test` 214 ✓, `npm run test:e2e` 3 ✓, UI audit 45 runs clean, motion check 0 errors, tokens ✓, impeccable detector 0 findings.

### [2026-11-13T13:00:00Z] Refinement: panel กลืนกับพื้นนอก

**Phase**: implementation (follow-up of the content-panel change request)
**Action**: user said the light grey panel blended into the parent background (#F1F1F3 vs #FAFAFA 1.05:1). Tried 3 pairs live on the page; chose shell canvas `--app-canvas` = neutral-300 (#CFCFD6) and a panel shadow (`--content-panel-shadow` = shadow-md) instead of the 1px border. `--content-panel-border` removed (added and removed in the same uncommitted change); `--background` unchanged (login page).
**Artifacts**: design-system.md §3, §7, §9 · decisions-design.md Add-on update · src/styles/tokens.css · src/app/layout/AppLayout.tsx
**Outcome**: pass — panel vs canvas 1.37:1 measured in the browser at 1280 (was 1.05). build ✓, `npm test` 214 ✓, `npm run test:e2e` 3 ✓, UI audit 45 runs clean, tokens ✓, impeccable detector 0 findings.

### [2026-11-13T13:20:00Z] Change request: main content สีขาว

**Phase**: implementation (change request, refine-spec-first)
**Action**: user asked for a bright white main-content container instead of light grey. Chose "การ์ดขาวมีเส้นขอบบาง" so white cards stay distinct on the white panel. `--content-panel-bg` → `--card`; new `--card-border` (= `--border`); `--card-shadow` / `--card-shadow-hover` = 1px ring + the previous shadow (box-shadow ring, no layout shift, every card picks it up). Mobile sticky form bar `bg-background/95` → `bg-card/95` to match the white panel.
**Artifacts**: design-system.md §3, §6, §7, §9 · decisions-design.md Add-on · src/styles/tokens.css · src/features/call-form/CallFormPage.tsx
**Outcome**: pass — browser: panel vs canvas 1.55:1, muted text on panel 7.38:1; 1280 My Space + Catalog, 375 My Space checked. build ✓, `npm test` 214 ✓, `npm run test:e2e` 3 ✓, UI audit 45 runs clean, tokens ✓, impeccable detector 0 findings.

### [2026-11-13T13:40:00Z] Change request: page transition

**Phase**: implementation (change request, refine-spec-first)
**Action**: user asked for an animation between pages. Only the routed content in `<main>` animates: `<Outlet />` wrapped in `<div key={pathname} className="page-enter">` (pathname only, so query-string changes such as Search filters do not replay it); `@keyframes page-enter` opacity 0.6 → 1 + translateY 8px, `--dur-normal` / `--ease-standard`, default fill-mode (starts visible so a pending animation never shows a blank page). Secondary to the sidebar indicator and plays alongside it. Reduced motion covered by the existing `--dur-*: 0ms` tokens and the global `animation-duration: 0.01ms` rule. No token added, no library / View Transitions API. Content has no `position: fixed` descendants (dialogs and sheets are portaled), so the brief transform does not move them.
**Artifacts**: design-system.md §3, §9 · decisions-design.md Add-on · src/styles/globals.css · src/app/layout/AppLayout.tsx
**Outcome**: pass — tsc ✓, build ✓, `npm test` 214 ✓, `npm run test:e2e` 3 ✓, tokens ✓ (no violations), impeccable detector 0 findings (`[]`). Browser check pending (orchestrator).
**Review (orchestrator)**: headless Chromium sampled per frame on /my-space → /catalog: opacity 0.6 → 1 in ~185 ms with ease-out, never blank, ends at `transform: none`; a query-string change keeps the same wrapper (no replay). Under reduced motion the global 0.01ms rule still painted one frame at 0.6 → added `.page-enter { animation: none !important; }` inside the reduced-motion block; re-sampled min opacity 1. build ✓, e2e 3 ✓.

## 2026-11-13 14:00 — Change request: favicon (Add-on)
**Request**: ใช้รูป robot ที่ผู้ใช้ให้มาเป็น icon ของ browser tab
**Artifacts**: design-system.md §5, §9 · public/favicon.ico (16/32/48) · public/apple-touch-icon.png (180, พื้นขาว) · index.html (`<link rel="icon">`, `<link rel="apple-touch-icon">`)
**Outcome**: pass — ICO 3 frame square, PNG 180x180, build ✓ (dist มีทั้งสองไฟล์), dev server เสิร์ฟ 200 · orchestrator ดูภาพ 32px และ 180px แล้ว ไม่ยืด อยู่กลาง
- 14:20 favicon follow-up: เพิ่ม PNG `favicon-32.png` / `icon-192.png` + `<link type="image/png">` ก่อน `.ico` (ชื่อใหม่ เลี่ยง favicon cache) · design-system §5 อัปเดต

## 2026-11-13 14:40 — Change request: sidebar banner (Add-on)
**Request**: ใช้ภาพ banner ที่ผู้ใช้ให้มาเป็น top section ของ sidebar
**Artifacts**: design-system.md §7, §9 · decisions-design.md Add-on · src/assets/sidebar-banner.webp (480×160) · src/app/layout/AppLayout.tsx (`SidebarBanner` แทน wordmark ใน sidebar ≥ lg + บนสุดของ drawer < lg, SheetHeader → sr-only, `Wordmark` ตัด tone light)
**Outcome**: pass — tsc ✓, build ✓, `npm test` 214 ✓, e2e 3 ✓, tokens ✓ · Playwright: banner 240×80 ที่ 1280, ลิงก์ชื่อ "ITSM Support Desk" 1 ตัวต่อ sidebar/drawer · orchestrator ดู screenshot 1280 / 375 แล้ว
- 15:00 sidebar banner update: แยก banner กับเมนูเป็นการ์ดคนละใบ (≥ lg, gap 12px, drawer คงแผ่นเดียว) · AppLayout.tsx (`SidebarBanner divider`) · design-system §7, §9 · tsc ✓, test 214 ✓, e2e 3 ✓, tokens ✓ · Playwright: banner 240×80 @y12, เมนู 240×684 @y104, focus ring ขาว 2px · orchestrator ดู screenshot แล้ว
- 15:10 ลด gap banner/เมนู 12px → 8px (`--space-2`) · AppLayout.tsx · design-system §7, §9
- 15:30 พื้นนอกสว่างขึ้น: `--app-canvas` neutral-300 → neutral-100, `--content-panel-shadow` = ขอบ 1px `--border` + shadow-md · tokens.css · design-system §3, §7, §9 · tokens ✓, build ✓, ดูใน browser 1440 แล้ว

## 2026-11-13 16:00 — Change request: navigation rail (Add-on)
**Request**: ทำ navigation rail ให้ sidebar · ผู้ใช้เลือก icon อย่างเดียว + tooltip, ปุ่มซ้ายสุดของ header
**Artifacts**: design-system.md §3 token map, §9 · decisions-design.md Add-on · tokens.css (`--sidebar-rail-width`) · AppLayout.tsx (state + localStorage `itsm.ui.sidebarCollapsed`, `<aside id="app-sidebar">` width transition, `SidebarBanner compact`, ปุ่ม PanelLeftClose/Open) · Sidebar.tsx (`collapsed`, label sr-only + Tooltip, className แบบ `aria-[current=page]:` เพราะ Slot ของ TooltipTrigger รับ function ไม่ได้) · src/assets/sidebar-robot.webp · tests/unit/components/AppLayoutRail.test.tsx
**Outcome**: pass — tsc ✓, `npm test` 216 ✓, e2e 3 ✓, tokens ✓ · Playwright: aside 240 / 72, banner หุบ 72×72, indicator ตรง active link ทุกกรณี, tooltip ✓, reload ยังหุบ, reduced-motion เปลี่ยนทันที · orchestrator ดู screenshot หุบ + tooltip แล้ว
**Known**: ตอนขยาย banner สลับเป็นภาพเต็มทันทีแล้วโตตามความกว้าง (ดันเมนูลงช่วง 200ms) · ใน rail เห็นขอบลายเรขาคณิตของ sidebar-bg.webp เป็นเส้นแนวนอนระหว่างเมนู (เป็นส่วนของภาพ)
- 16:30 rail toggle → ribbon: ปุ่มย้ายจาก header เป็นแท็บแคปซูล 20×48 คร่อมขอบขวาของ `<aside>` กึ่งกลางแนวตั้ง (hit area 44×48, tooltip ขวา, aria เดิม) · AppLayout.tsx · design-system §9 · tsc ✓, test 216 ✓, e2e 3 ✓, tokens ✓ · Playwright: แท็บ center = ขอบขวา aside / mid-Y ทั้งสองสถานะ, ห่าง panel 2px, focus ring crimson · orchestrator ดู screenshot ขยาย + focus แล้ว · known: ring ครึ่งที่ทับ sidebar contrast ต่ำ (ครึ่งบนพื้นสว่างชัด)
- 16:50 app background image: `.app-canvas-surface` (globals.css) ใช้ src/assets/app-bg.webp (1920×983) ที่ root ของ AppLayout และ <main> ของ LoginPage · design-system §9 · tsc ✓, build ✓, test 216 ✓, e2e 3 ✓, tokens ✓ · orchestrator ดู screenshot shell + login แล้ว
- 17:10 ย้ายภาพพื้นจาก parent ไป main content (ผู้ใช้แก้ความต้องการ): `.content-panel-surface` (≥ lg, @media 64rem) บน content panel · shell root กลับ `--app-canvas`, Login กลับ `bg-background` · header ≥ lg ขาว 75% + backdrop-blur · globals.css, AppLayout.tsx, LoginPage.tsx · design-system §9 · tsc ✓, build ✓, test 216 ✓, e2e 3 ✓, tokens ✓ · Playwright: panel bg = ภาพที่ 1280 / none ที่ 375 · ไม่มีข้อความบนส่วนโค้งแดง (My Space, Catalog, Search, New call) · orchestrator ดู screenshot แล้ว
- 17:20 ภาพพื้น main content จางลง: ชั้นขาว `--content-panel-image-wash` (60%) ทับภาพ · tokens.css, globals.css · design-system §3, §9
- 17:40 ribbon tab ตาม reference ผู้ใช้: แท็บติดนอกขอบขวา 24×44 ซ้ายแบน มุมขวามน พื้น --primary chevron ขาว stroke 2.5 · aside z-10 · AppLayout.tsx · design-system §9
- 17:55 rail compact: --sidebar-rail-width 72 → 56, เมนูหุบ px --space-1 (ปุ่ม 48 กว้าง), robot 40px · tokens.css, AppLayout.tsx, Sidebar.tsx · design-system §9
- 18:05 ribbon tab ใช้ภาพผู้ใช้เป็นพื้น: src/assets/ribbon-tab.webp 48×88, .ribbon-tab-surface (globals.css), hover brightness 1.1 · AppLayout.tsx · design-system §9
- 18:20 ภาพพื้น main content ยืดเต็มกรอบ panel: `.content-panel-surface` cover → `center / 100% 100%` (ผู้ใช้เลือก แทน cover ที่ตัดขอบ) · globals.css · design-system §9
- 21:30 AI Assistant ย้ายจาก header เป็น FAB ขวาล่าง (spec): token ใหม่ --fab-size, --fab-offset, --accent-hover · design-system §9
- 21:45 FAB ใช้รูป robot ผู้ใช้: src/assets/ai-fab-robot.webp 96×96, พื้น --card + ขอบ --border, ลบ --accent-hover · AppLayout.tsx, tokens.css · design-system §9
- 21:55 header แยกเป็น card ≥ lg (spec): สูงเท่า banner (80 ขยาย / 56 หุบ), gap 8px กับ content panel · design-system §9
- 22:05 FAB compact: --fab-size 56 → 44, robot 36px · tokens.css, AppLayout.tsx · design-system §9
- 22:20 FAB robot animation: codex-image sprite sheet 8 frame (ref = robot เดิม) → src/assets/ai-fab-robot-frames.webp 768×96, .ai-fab-robot step-end loop 3s, reduced-motion ค้าง frame 1 · ลบ ai-fab-robot.webp · AppLayout.tsx, globals.css · design-system §9
- 22:35 FAB robot ลื่นขึ้น: เพิ่ม frame คั่น dissolve (magick -morph) → strip 11 frame, 40ms grid, ยิ้มขึ้น/ลงแบบไล่ · globals.css, ai-fab-robot-frames.webp · design-system §9
- 22:45 ลบเมนู "แจ้งเรื่องใหม่" จาก sidebar (เปิดเรื่องผ่าน Catalog) · routes.tsx · design-system §9
- 22:50 ลบปุ่ม "แจ้งเรื่องใหม่" บน My Space, empty state ชี้ไป Service Catalog · MySpacePage.tsx · design-system §9
- 23:05 background ของ top nav: ภาพแถบชมพู→แดงเข้ม → src/assets/header-bg.webp, .header-surface · ปุ่มผู้ใช้พื้นขาว + card-shadow · AppLayout.tsx, UserMenu.tsx, globals.css · design-system §9
- 23:20 Task 4.6 ปลดล็อก: contract Azure AI Foundry (Responses API) จาก template ผู้ใช้ · Vite middleware server/aiAssist.ts + azure.ts · integration.md, api-spec.md §2, tasks.md (Add-on)
- 23:45 Task 4.6 verify กับ Azure จริง (gpt-5-4-mini): draft / navigate / unknown ผ่าน, AI panel เปิดฟอร์มกรอกให้ · tasks.md ติ๊ก 4.6
- 23:55 เปลี่ยนภาพ top nav เป็นแถบแดงเข้ม + chevron: header-bg.webp ใหม่, ☰ และ wordmark ใส่ .on-brand (ตัวขาว) · AppLayout.tsx · design-system §9
- 00:10 AI SDK ToolLoopAgent + model adapter (azure / bedrock) แทน fetch ใน middleware · contract browser เดิม · integration.md, api-spec.md §2, design.md (Add-on)
- 00:40 verify ToolLoopAgent กับ Azure จริง: draft (tool loop 2 step ~1.7–2.8s) / navigate / unknown ผ่าน · 1 ครั้งเกิน 9s → 504 แล้ว browser fallback · searchServices ค้น keyword ไทยจาก fallback rules · test 238, e2e 3, bundle ไม่มี server deps
