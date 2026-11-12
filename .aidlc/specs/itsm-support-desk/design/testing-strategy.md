# Testing Strategy

## Overview
- **Philosophy**: Hybrid — domain logic เขียน test คู่กับโค้ด (pure functions ทดสอบง่าย), UI/E2E อยู่กลุ่มท้ายตามนโยบาย hands-on-project
- **Coverage target**: `src/domain/` ≥ 80% · service (C8, C14) ครอบทุก use case · UI ครอบ flow หลักผ่าน E2E smoke
- **Pyramid**: unit + property ~75% · component ~15% · E2E smoke ~10%

## Frameworks
| Type | Tool | Notes |
|---|---|---|
| Unit | Vitest 4.1.12 + jsdom | assertion ของ Vitest |
| Component | @testing-library/react 16.3.3 | query ตาม role/label (ตรวจ a11y ไปในตัว) |
| PBT | fast-check 4.10.2 | ดู `design/correctness.md` |
| E2E | @playwright/test 1.65.0 (chromium) | smoke 3 flow |
| Load / API tool | [TBD - not decided in D3] | ไม่จำเป็น — ไม่มี backend |

## Test Architecture
```
tests/
├── unit/
│   ├── domain/        # priority, sla, stateMachine, access, numbering (example tests)
│   ├── data/          # storage parse/reset, commit
│   ├── services/      # callService, approvalService
│   ├── components/    # CallForm validation, StatusBadge, CallTable
│   └── ai/            # RuleBasedAssistant, AzureAssistant fallback
├── properties/        # fast-check
├── e2e/               # *.spec.ts
└── fixtures/          # buildDataset(), buildCall(), buildUser()
```
- **Naming**: `<unit>.test.ts(x)` / `<unit>.properties.test.ts` / `<flow>.spec.ts` · ชื่อ test ภาษาอังกฤษแบบ "does X when Y"
- **Shared utilities**: `fixtures/` สร้าง dataset จาก `src/data/database.json` แล้ว override เฉพาะ field ที่ test ต้องการ
- **Test data**: ใช้ข้อมูลสมมติจาก seed เท่านั้น (PDPA §14)

## Mock Strategy
| สิ่งที่ mock | วิธี |
|---|---|
| Azure agent | `vi.stubGlobal('fetch', …)` → 200 / 502 / timeout / JSON ผิด |
| localStorage | jsdom มีให้ — `localStorage.clear()` ใน `beforeEach` |
| เวลา | ส่ง `now` เป็น argument ใน domain · component ใช้ `vi.useFakeTimers()` + `vi.setSystemTime('2026-11-11T09:00:00+07:00')` |
| File | `new File([...], name, { type })` — เก็บแค่ metadata |

## Environment
- ไม่มี test database — dataset in-memory/localStorage ของ jsdom
- E2E: Playwright `webServer` รัน `npm run dev`, `VITE_AI_MODE=mock`, ล้าง localStorage ก่อนแต่ละ test
- CI: [TBD - not decided in D3] (deploy เป็น optional)

## Coverage Mapping

### Per Component
| Component | Unit | PBT | Component test | E2E |
|---|---|---|---|---|
| C1 App Shell | guard | — | redirect ไม่มีสิทธิ์ | ✓ |
| C2 Session | ✓ | — | — | ✓ |
| C3 Access | ✓ | P7, P8 | — | — |
| C4 Rules Engine | ✓ | P1–P6, P9, P10 | — | — |
| C5 My Space | — | — | empty state, count | ✓ |
| C6 Catalog | — | — | breadcrumb | ✓ |
| C7 Call Form | schema | — | validation messages | ✓ |
| C8 Call Service | ✓ ทุก use case | — | — | ✓ |
| C9 Search / Detail | fullText | P11 | action bar ตามสิทธิ์ | ✓ |
| C10 Data Layer | ✓ | — | — | — |
| C11 Logger | ตัด PII | — | — | — |
| C12 Shared UI | — | — | StatusBadge icon+label | — |
| C13 Sanitizer | ✓ | P12 | — | — |
| C14 Approvals | ✓ | — | — | ✓ |
| C15 AI Assistant | ✓ fallback | — | — | — |

### Per Service Function (`design/api-spec.md`)
ทุก function ใน C8 / C14 มี unit test: success 1 + FORBIDDEN 1 + error เฉพาะ (INVALID_TRANSITION / VALIDATION / ลำดับอนุมัติ)

### Critical Paths (E2E smoke)
1. **Flow 1 — แจ้ง Incident**: login สมชาย → Catalog → Report Incident → Hardware → Keyboard → Request this service → กรอก → OK → เห็นเลข ticket + หน้า Detail → My Space มีเรื่องใหม่
2. **Flow 2 — Service Request + อนุมัติ 2 ขั้น**: สมชายขอ Add New User → logout → ปรีชาอนุมัติ Department → อรุณีอนุมัติ Head → สถานะ Request In-Progress + Time Left เริ่มนับ
3. **Flow 3 — agent ปิดเรื่อง**: ธนา → Search (Open) → เปิด call_001 → In Process → Resolved + closure category → timeline มีครบ

## Run Commands
| Purpose | Command |
|---|---|
| unit + PBT | `npm test` |
| PBT อย่างเดียว | `npm test -- tests/properties` |
| E2E | `npm run test:e2e` |
| ทั้งหมด | `npm test && npm run test:e2e` |
| coverage | `npx vitest run --coverage` |
