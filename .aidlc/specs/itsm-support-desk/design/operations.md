# Operations Design

## Summary
- **Observability Level**: Minimal (D3-12)
- **Error Tracking**: Log-based — React ErrorBoundary + logger ที่ตัด PII (D3-13)
- **Lifecycle Management**: ไม่มี — SPA บน Vite dev server ไม่มี server ของตัวเอง (D3-14)
- **Logging Format**: structured object ใน browser console (`{ level, event, at, context }`)
- **Logging Library**: `src/shared/logger.ts` (เขียนเอง ห่อ `console`) — ไม่เพิ่ม dependency

> Minimal ตาม template มี Logging + Health + Shutdown + Configuration แต่ D3-14 ไม่มี server → ส่วน Health / Graceful Shutdown = N/A

---

## Logging

### Strategy
- **Format**: object เดียวต่อ event ใน console · dev แสดงทุก level · build production แสดงเฉพาะ warn/error
- **Levels**: error, warn, info, debug
- **Correlation**: ไม่มี request — ใช้ `callId` / `approvalId` เป็น context
- **Sampling**: ไม่มี

### Per-Component Logging
| Component | Key Log Events | Level | Context Fields |
|---|---|---|---|
| C1 App Shell | route ถูกปฏิเสธ (default-deny), error boundary จับได้ | warn / error | route, role |
| C2 Session | login / logout, session ไม่ตรง user | info / warn | userId |
| C3 Access | — (pure, ไม่ log) | — | — |
| C4 Rules Engine | — (pure, ไม่ log) | — | — |
| C5 My Space | — | — | — |
| C6 Catalog | icon name ไม่อยู่ใน allow-list | warn | categoryId |
| C7 Call Form | submit validation fail (ชื่อ field เท่านั้น) | info | fieldNames |
| C8 Call Service | use case สำเร็จ / ล้มเหลว | info / warn | action, callId, code |
| C9 Search / Detail | full-text query parse error | warn | mode |
| C10 Data Layer | seed load, parse fail → reset, storage full | info / error | schemaVersion, code |
| C11 Logger | — | — | — |
| C12 Shared UI | — | — | — |
| C13 Sanitizer | มี tag ถูกตัดออก | debug | removedCount |
| C14 Approvals | decide สำเร็จ / ปฏิเสธเพราะลำดับ | info / warn | approvalId, decision |
| C15 AI Assistant | Azure timeout / error / fallback | warn | mode, status, durationMs |

### Sensitive Data Rules (NFR-021, PDPA §8)
- **Never log**: `name`, `email`, `phone`, `summary`, `notes`, ข้อความที่ผู้ใช้พิมพ์ใน AI, comment, `AZURE_AI_KEY`
- **Allowed IDs**: userId, callId, approvalId (เป็น id สมมติ ไม่ใช่ PII ตรง)
- logger ตัด key ใน deny-list ออกอัตโนมัติก่อนเขียน

---

## Health & Readiness
N/A — ไม่มี server (D3-14) · การตรวจ "พร้อมใช้" ฝั่ง client: C10 โหลด dataset สำเร็จ ก่อน render route

## Graceful Shutdown
N/A — ไม่มี process ของตัวเอง · ข้อมูลเขียนลง localStorage แบบ synchronous ทุก commit จึงไม่มีงานค้างตอนปิดแท็บ

---

## Error Handling & Reporting

### Error Classification
| Category | ตัวอย่าง | Log Level | แสดงผู้ใช้ |
|---|---|---|---|
| User error | VALIDATION, FORBIDDEN, INVALID_TRANSITION | info / warn | ข้อความไทยใต้ field หรือ toast |
| Operational | STORAGE_FULL, AI_UNAVAILABLE | warn / error | toast + ทางเลือก (fallback) |
| Data corruption | STORAGE_CORRUPT | error | แจ้ง + reset เป็น seed |
| Programming error | exception ที่ไม่คาด | error | ErrorBoundary: "เกิดข้อผิดพลาด" + ปุ่มกลับ My Space |

### Error Log Structure
```json
{ "level": "error", "at": "2026-11-11T09:00:00+07:00", "event": "callService.changeStatus.failed",
  "context": { "callId": "call_002", "code": "INVALID_TRANSITION" } }
```
stack trace แสดงเฉพาะ dev build

---

## Configuration Management

### Environment Variables
| Variable | Required | Default | Sensitive? | Description |
|---|---|---|---|---|
| `VITE_AI_MODE` | No | `mock` | No | เลือก implementation ของ AI |
| `AZURE_AI_ENDPOINT` | เมื่อ mode = azure | — | No | base URL ของ agent |
| `AZURE_AI_PATH` | เมื่อ mode = azure | — | No | path ของ endpoint |
| `AZURE_AI_KEY` | เมื่อ mode = azure | — | **Yes** | อยู่ใน `.env.local` ฝั่ง proxy เท่านั้น |

### Startup Validation
1. `vite.config.ts`: mode = azure แต่ขาด endpoint/key → log warning ตอน dev server start และ proxy ตอบ 500 → client ใช้ rule-based
2. client: `VITE_AI_MODE` ค่าอื่นนอกจาก mock/azure → ใช้ `mock`

---

## Traceability
| Operations Concern | Related Design Artifacts |
|---|---|
| Per-component logging | design/components.md |
| Error classification | design/api-spec.md (AppError codes) |
| Configuration variables | design/implementation.md, design/integration.md |
