# Design Document: ITSM Support Desk

## Summary
<!-- 10-line max digest for downstream phases. Later phases can read ONLY this section. -->
- **Architecture**: SPA client-only แบบ feature-based + `domain/` pure functions + repository บน localStorage — ไม่มี backend ตาม scope, เปลี่ยนเป็น API จริงได้ที่ repository layer
- **Stack**: React 19.3 + Vite 8.3 + TypeScript 6.0 / ไม่มี backend (Vite proxy สำหรับ AI) / localStorage (`itsm.db.v1`) / local dev
- **Components**: 15 — App Shell, Session, Access Control, Rules Engine, My Space, Catalog, Call Form, Call Service, Search & Detail, Data Layer, Logger, Shared UI, Sanitizer, Approvals, AI Assistant
- **Entities**: SupportCall, CallHistory, Approval, Activity, ServiceCategory, ServiceDefinition, Template, User, Group, Queue, Product, Item, Service (+ config: matrices, SLA, rolePermissions)
- **Endpoints**: HTTP 1 (`POST /api/ai/assist` ผ่าน dev proxy) + in-process service API (C8, C14, C15)
- **Integrations**: Azure AI agent (contract `[TBD]`, ใช้ rule-based mock เป็น default)
- **Testing**: PBT Yes (12 properties, fast-check) — NFR Yes · Vitest + Testing Library + Playwright smoke 3 flow
- **Key Decisions**: Zustand + persist · Tailwind v4 + shadcn/ui บน CSS variables · React Hook Form + Zod · Tiptap + DOMPurify
- **Design system**: `.claude/rules/design-system.md` + `src/styles/tokens.css` (indigo/teal/warm neutral, IBM Plex Sans Thai, Lucide)

## Architecture

### System Context Diagram
```
┌──────────────────────────── Browser ─────────────────────────────┐
│  React SPA (Vite)                                                │
│  ┌────────────┐  ┌──────────────┐  ┌─────────────────────────┐   │
│  │ features/  │─▶│ services     │─▶│ domain/ (pure)          │   │
│  │ pages + UI │  │ C8 C14 C15   │  │ access, priority, sla,  │   │
│  └─────┬──────┘  └──────┬───────┘  │ stateMachine, numbering │   │
│        │                ▼          └─────────────────────────┘   │
│        │         ┌──────────────┐                                │
│        └────────▶│ data/ repos  │──▶ localStorage itsm.db.v1     │
│                  └──────────────┘    (seed: database.json)       │
└───────────────┬──────────────────────────────────────────────────┘
                │ POST /api/ai/assist (VITE_AI_MODE=azure)
                ▼
┌──── Vite dev server proxy ────┐        ┌──────────────────────┐
│ adds AZURE_AI_KEY (.env.local)│──HTTPS▶│ Azure AI agent [TBD] │
└───────────────────────────────┘        └──────────────────────┘
```

### Technology Stack
- **Frontend**: React 19.3.1, React Router 8.5.1, Zustand 5.1.0, Tailwind CSS 4.3.5 + shadcn/ui (Radix), React Hook Form 7.92.0 + Zod 4.6.7, Tiptap 3.33.1 + DOMPurify 3.4.17, lucide-react 1.72.0, @fontsource IBM Plex Sans Thai / Sans 5.3.0
- **Backend**: ไม่มี — Vite 8.3.8 dev proxy เฉพาะ AI
- **Database**: localStorage (dataset เดียว + Zod parse)
- **Infrastructure**: local (Node.js 22 LTS)
- **Testing**: Vitest 4.1.12, Testing Library 16.3.3, fast-check 4.10.2, Playwright 1.65.0

### Key Design Decisions
1. **Rules engine เป็น pure functions อ่านค่าจาก data** — priority/SLA ใช้ `priorityMatrix`, `rfcPriorityMatrix`, `slaHoursByPriority` จาก `database.json` (D1-4/5/6) ทดสอบด้วย PBT ได้ deterministic
2. **Service layer เป็นจุดเขียนข้อมูลเดียว + ตรวจสิทธิ์ซ้ำ** — UI guard ซ่อนปุ่ม แต่ C8/C14 ตรวจ `can()` + state machine ก่อน commit ทุกครั้ง (default-deny)
3. **Commit dataset ครั้งเดียวต่อ use case** — call + history + approvals + runningNumber เขียนพร้อมกัน ไม่มีข้อมูลค้างครึ่งทาง; history append-only เป็น audit trail (D1-14)
4. **AI ผ่าน interface + rule-based default** — ไม่บล็อกงานระหว่างรอ contract; key อยู่ฝั่ง proxy เท่านั้น (D1-12, D3-8)
5. **Token 3 ชั้นบน CSS variables** — component อ้าง semantic token ผ่าน Tailwind `@theme inline` (HARD RULE #1)

## Traceability

| Requirement | Component(s) | API / Function | Data Entity | Design File | Status |
|---|---|---|---|---|---|
| US-001 | C10 | `commit`, `resetToSeed` | dataset | data-model.md, components.md | ✅ Covered |
| US-002 | C2, C1 | `useSession` | User | components.md | ✅ Covered |
| US-003 | C1, C3 | `can`, route guard | rolePermissions | components.md, nfr.md | ✅ Covered |
| US-004 | C3, C8 | `filterVisibleCalls`, `getCall` | SupportCall, Approval | components.md, api-spec.md | ✅ Covered |
| US-005 | C4, C7 | `calcPriority` | priorityMatrix, rfcPriorityMatrix | components.md, correctness.md | ✅ Covered |
| US-006 | C4, C12 | `calcDueDate`, `timeLeft` | slaHoursByPriority, ServiceCategory | components.md, correctness.md | ✅ Covered |
| US-007 | C4, C8 | `initialStatus`, `nextStatuses`, `assertTransition` | statusByCallType | components.md, api-spec.md | ✅ Covered |
| US-008 | C4, C10 | `nextNumber` | runningNumber | data-model.md | ✅ Covered |
| US-009 | C5, C12 | `listVisibleCalls` | SupportCall | components.md | ✅ Covered |
| US-010 | C5 | `listVisibleCalls` | SupportCall | components.md | ✅ Covered |
| US-011 | C12 | CallTable column picker | `itsm.columns.{userId}` | components.md, data-model.md | ✅ Covered |
| US-012 | C6 | — | ServiceCategory | components.md | ✅ Covered |
| US-013 | C6, C7 | route `/calls/new?service=` | ServiceDefinition, Template | components.md | ✅ Covered |
| US-014 | C7, C8 | `createCall` (on behalf) | SupportCall | api-spec.md | ✅ Covered |
| US-015 | C7 | `callFormSchema` | User | components.md | ✅ Covered |
| US-016 | C7, C4 | TemplateLookup, `calcPriority` | Template | components.md | ✅ Covered |
| US-017 | C7 | CiInfo | Service, Product, Item | components.md | ✅ Covered |
| US-018 | C7, C8, C13, C14 | `createCall`, `createApprovals` | SupportCall, CallHistory, Approval | api-spec.md | ✅ Covered |
| US-019 | C7 | Attachments section | attachments metadata | data-model.md | ✅ Covered |
| US-020 | C9 | `searchCriteria` | SupportCall | components.md | ✅ Covered |
| US-021 | C9 | `fullText` | SupportCall | components.md, correctness.md | ✅ Covered |
| US-022 | C9, C12 | CallTable | SupportCall | components.md, nfr.md | ✅ Covered |
| US-023 | C9, C13, C12 | `getCall`, `sanitizeHtml` | SupportCall, Approval | components.md | ✅ Covered |
| US-024 | C8, C9 | history append | CallHistory | data-model.md | ✅ Covered |
| US-025 | C8, C9 | `addComment` | CallHistory | api-spec.md | ✅ Covered |
| US-026 | C8, C9 | `assignCall`, `changeStatus` | SupportCall | api-spec.md | ✅ Covered |
| US-027 | C8 | `changeStatus` + closureCategory | SupportCall | api-spec.md | ✅ Covered |
| US-028 | C8, C4 | `cancelCall`, `reopenCall`, `runAutoClose` | SupportCall (`resolvedAt`) | api-spec.md, data-model.md | ✅ Covered |
| US-029 | C9 | ActivityTable | Activity | components.md | ✅ Covered |
| US-030 | C14 | `listMyApprovals` | Approval | api-spec.md | ✅ Covered |
| US-031 | C14, C4, C8 | `decide` | Approval, SupportCall | api-spec.md | ✅ Covered |
| US-032 | C15, C7 | `AiAssistant.suggest` | — | integration.md, api-spec.md | ✅ Covered |
| US-033 | C15, C1, C3 | `suggest` → navigate | — | integration.md | ✅ Covered |
| US-034 | C15 | RuleBasedAssistant, `POST /api/ai/assist` | ai fallback rules | integration.md, operations.md | ✅ Covered |

### Coverage Summary
- **Requirements covered**: 34 / 34
- **Gaps**: ไม่มี
- **Components without requirement**: C11 Logger (NFR-021 cross-cutting), C12 Shared UI (NFR-012), C13 Sanitizer (NFR-020) — รองรับหมวด J ของ requirements

## Open Questions & Risks

| # | Question/Risk | Impact | Status |
|---|--------------|--------|--------|
| 1 | Azure agent contract (endpoint, auth header, request/response) ยัง `[TBD]` | Medium | Open — mitigated ด้วย interface + rule-based default |
| 2 | การหาผู้อนุมัติจาก `managerId` สำหรับ call ใหม่ `[ASM]` | Medium | Open — ต้องให้ BA ยืนยัน |
| 3 | RFC approval → Ready for CAB / ปฏิเสธ → Cancelled `[ASM]` (statusByCallType ของ RFC ไม่มีสถานะอนุมัติ) | Medium | Open — อิงจาก seed `call_008` |
| 4 | localStorage ~5MB และข้อมูลหายเมื่อล้าง browser | Low | Mitigated — metadata-only attachments + ปุ่มรีเซ็ต seed |
| 5 | TypeScript 6 แทน 7 (7 เพิ่งเป็น compiler เขียนใหม่) | Low | Mitigated — อัปเกรดได้ภายหลัง |
| 6 | Field เพิ่มใหม่ `resolvedAt`, `callHistory.attachments` ไม่อยู่ใน seed | Low | Mitigated — derive จาก history / default `[]` |

## Detailed Specifications

- [Components](design/components.md) — component breakdown and interfaces
- [Data Model](design/data-model.md) — entities, relationships, schemas
- [API Specification](design/api-spec.md) — service API + AI proxy endpoint
- [Integration](design/integration.md) — Azure AI agent
- [Implementation](design/implementation.md) — directory structure, setup, conventions
- [Operations](design/operations.md) — logging, error handling, config
- [Testing Strategy](design/testing-strategy.md) — frameworks, coverage, E2E flows
- [Correctness Properties](design/correctness.md) — PBT specifications
- [Non-Functional Requirements](design/nfr.md) — performance, security, a11y
- Design system: [`.claude/rules/design-system.md`](../../../.claude/rules/design-system.md) + `src/styles/tokens.css`

## External References

| Source | Type | Used in |
|--------|------|---------|
| `initial-requirements/project-requirements/database.json` | Sample data / config | data-model.md, components.md, api-spec.md |
| npm registry (2026-11-11) | Package versions | implementation.md |
| `.claude/rules/workshop-policies/design-system-policies.md` | Design policy | design-system.md, tokens.css |
