# Context Assessment

## Summary
<!-- 10-line max. Downstream phases read ONLY this section. -->
- **Type**: Greenfield
- **Scope**: new
- **Stack**: TypeScript / React + Vite (ยืนยันแล้ว) · Tailwind, Lucide, `database.json` + localStorage เป็น `[ASM]` รอ D3
- **Architecture**: SPA ฝั่ง client ล้วน (ไม่มี backend) + dev proxy ฝั่ง Node สำหรับ AI agent บน Azure — รอยืนยันใน D3
- **Feature**: ระบบ ITSM Support Desk ให้พนักงานแจ้ง Incident / Service Request / RFC ผ่าน Service Catalog หรือฟอร์มตรง ติดตามสถานะตาม SLA และอนุมัติ 2 ขั้น
- **Impact**: New standalone
- **Complexity**: High — ~25–30 stories, 6 domains, 4 user types
- **Recommendations**: Personas Yes, Units No (ตามนโยบาย hands-on-project), NFR Yes

## Project Overview
- **Type**: Greenfield — workspace มีแค่ `.claude/` (rules, skills) และ `initial-requirements/` ไม่มี source code หรือ build config
- **Assessment Date**: 2026-11-11T16:30:34Z

## Technology Stack
- **Languages**: N/A — greenfield project (ร่าง requirements เสนอ TypeScript `[ASM]`)
- **Frameworks**: N/A — greenfield project (React + Vite ยืนยันแล้วใน OD-1)
- **Build System**: N/A — greenfield project (Vite ตาม OD-1)
- **Testing**: N/A — greenfield project
- **Infrastructure**: รันบน local · AI agent บน Azure (contract `[TBD]`)

## Feature Impact

**Affected Areas**: New standalone

| Area | Impact | Reason |
|------|--------|--------|
| โครงโปรเจกต์ React + Vite | New | ยังไม่มีโค้ด |
| Data layer (`database.json` + localStorage) | New | ข้อมูลตัวอย่าง users/groups/services/templates/calls/activities/approvals |
| Business logic (priority, SLA, state machine) | New | pure functions ตาม §4.3–4.4 |
| Design system (`design-system.md` + `.css` tokens) | New | นโยบาย design-system-policies บังคับให้สร้างก่อน implement UI |
| AI Assistant (Azure agent ผ่าน dev proxy) | New | OD-4 ยืนยันช่องทาง แต่ contract `[TBD]` |

## Recommendations

- Story Count: High (11+) — Must/Should ราว 45 FR จัดกลุ่มเป็น story ได้ ~25–30
- Domain Boundaries: Auth/Roles · Service Catalog & Templates · Support Call lifecycle (ฟอร์ม, รายละเอียด, state machine, SLA) · Search & My Space · Approvals · Knowledge/Activities (Nice) · AI Assistant
- User Types: requestor, approver, agent, admin
- Integration Points: AI agent บน Azure (ผ่าน dev proxy, key ใน `.env.local`)
- **Personas**: Yes — 4 role สิทธิ์ต่างกันชัด (permission matrix §5.11)
- **Units**: No — นโยบาย `hands-on-project-policies.md` สั่งข้าม decomposition และใช้โหมด comprehensive
- **NFR**: Yes — มี NFR ชัด (WCAG 2.2 AA, sanitize rich text, ไม่ log PII, audit trail, performance)

## Scope

- **Detected scope**: new
- **Rationale**: workspace ไม่มี source code (greenfield) และ requirements ระบุว่าสร้างระบบใหม่ ห้ามลอก UI ระบบเดิม
- **Phases skipped**: decomposition (ตามนโยบาย hands-on-project — ไม่ใช่ตาม scope)

## Recommended Workflow

```
┌──────────────┐
│   Context    │  ← ตอนนี้
└──────┬───────┘
       ▼
┌──────────────┐
│ Requirements │  D1 · personas · EARS
└──────┬───────┘
       ▼
┌──────────────┐
│    Design    │  D3 tech · design-system.md + tokens .css
└──────┬───────┘
       ▼
┌──────────────┐
│    Tasks     │  wave: Setup → FE+mock JSON → (backend ถ้าจำเป็น) → ส่วนเสริม → Test
└──────┬───────┘
       ▼
┌──────────────┐
│  Implement   │  ทีละ task · หยุดรอยืนยันทุกกลุ่ม
└──────┬───────┘
       ▼
┌──────────────┐
│ Build & Test │
└──────┬───────┘
       ▼
┌──────────────┐
│ Deploy (opt) │
└──────────────┘
```

## External References

| Source | Type | What was used |
|--------|------|---------------|
| `initial-requirements/project-requirements/Requirements.md` | Requirements draft | scope, roles, FR/NFR, entities, state machine, open decisions OD-1–OD-5 |
| `initial-requirements/project-requirements/database.json` | Sample data | ชุดข้อมูลตัวอย่าง (ไม่ใช่ข้อมูลจริง) |
| `.claude/rules/workshop-policies/*.md` | Project policies | design system, security, PDPA, ลำดับ task, Definition of Done |
