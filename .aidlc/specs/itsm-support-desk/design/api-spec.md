# API Specification

## Overview
- **API style**: ไม่มี backend API ใน scope (D3-2, D3-14) — "API" ของระบบแบ่ง 2 ส่วน
  1. **In-process service API** — function interface ของ C8 / C14 / C15 ที่ UI เรียก (สัญญาหลักของระบบ)
  2. **HTTP 1 endpoint** — `POST /api/ai/assist` บน Vite dev proxy ส่งต่อไป Azure agent (D3-8)
- **Auth**: mock session (C2) · in-process ตรวจด้วย `can()` ทุก use case · HTTP proxy เป็น local dev เท่านั้น ใส่ key ฝั่ง proxy
- **Base URL (HTTP)**: `http://localhost:5173/api`

## Conventions
- In-process ทุก use case คืน `Result<T> = { ok: true, data: T } | { ok: false, error: AppError }` — ไม่ throw ใน path ปกติ
- วันที่ = ISO 8601 พร้อม offset (`+07:00`) ตาม `_meta.dateFormat`
- Pagination / sorting: ทำฝั่ง client บน array (≤ 1,000 รายการ) — sort default: Open Date ใหม่ → เก่า

## Error Format
```ts
type AppError = {
  code: 'FORBIDDEN' | 'NOT_FOUND' | 'VALIDATION' | 'INVALID_TRANSITION'
      | 'APPROVER_NOT_FOUND' | 'STORAGE_FULL' | 'STORAGE_CORRUPT' | 'AI_UNAVAILABLE';
  message: string;                       // ข้อความไทยสำหรับแสดงผู้ใช้
  fieldErrors?: Record<string, string>;  // VALIDATION เท่านั้น
};
```
| code | ข้อความไทย (ตัวอย่าง) | ที่มา |
|---|---|---|
| FORBIDDEN | คุณไม่มีสิทธิ์ทำรายการนี้ | US-003 |
| NOT_FOUND | ไม่พบรายการหรือไม่มีสิทธิ์ | US-004 |
| VALIDATION | (ตาม field §4.5) | US-018 |
| INVALID_TRANSITION | ไม่สามารถเปลี่ยนสถานะนี้ได้ | US-007 |
| APPROVER_NOT_FOUND | ไม่พบผู้อนุมัติของผู้แจ้ง | US-031 |
| STORAGE_FULL | พื้นที่จัดเก็บเต็ม | US-001 |
| AI_UNAVAILABLE | AI ไม่พร้อมใช้งาน ใช้การค้นหาแบบคำสำคัญแทน | US-034 |

---

## 1. In-process Service API

### Call Service (C8) — `src/features/calls/callService.ts`

| Function | Permission | Story | Effect |
|---|---|---|---|
| `createCall(actor, input: CallInput)` | `call:create` (+ `call:create_on_behalf` เมื่อ requestor ≠ actor) | US-014, US-018 | สร้าง call + history `created` + approvals |
| `assignCall(actor, callId, assigneeId)` | `call:assign` + call อยู่ในกลุ่มของ actor | US-026 | ตั้ง assignedToId; New → Assigned |
| `changeStatus(actor, callId, to, opts)` | `call:change_status` + กลุ่ม | US-026, US-027 | ตรวจ transition; Resolved ต้องมี closureCategory |
| `addComment(actor, callId, text, attachments)` | `call:comment_own` (เรื่องตัวเอง) / `call:comment_any` (กลุ่ม) | US-025 | history `commented` |
| `cancelCall(actor, callId)` | `call:cancel_own` + ยังไม่ Resolved | US-028 | → Cancelled / Request Cancelled |
| `reopenCall(actor, callId, now)` | `call:reopen_own` + Resolved ≤ 7 วัน | US-028 | → Re-Opened |
| `runAutoClose(now)` | system | US-028 | Resolved > 7 วัน → Closed |
| `listVisibleCalls(actor)` | ตาม C3 | US-004, US-009, US-020 | อ่าน |
| `getCall(actor, callId)` | ตาม C3 | US-023 | อ่าน หรือ NOT_FOUND |

**Example — `createCall` input**
```json
{
  "requestedFor": "somebody_else",
  "requestorId": "usr_002",
  "phone": "0822222222",
  "email": "malee.s@example.com",
  "customerReference": null,
  "templateId": "tpl_004",
  "urgency": "4-Low",
  "impact": "4-Minor/Localized",
  "serviceId": null, "productId": null, "itemId": null, "serialNumber": null,
  "summary": "ขอยืม Notebook สำหรับอบรม 3 วัน",
  "notes": "<p>ใช้ระหว่าง 20–22 พ.ย.</p>",
  "attachments": [{ "name": "agenda.pdf", "size": 120400, "type": "application/pdf" }]
}
```
**Example — success**
```json
{ "ok": true, "data": { "id": "call_7f3a…", "number": "100010", "status": "Waiting For Approve", "priority": "P4", "dueDate": null } }
```
**Example — validation error**
```json
{ "ok": false, "error": { "code": "VALIDATION", "message": "ข้อมูลไม่ครบ", "fieldErrors": { "summary": "กรุณากรอกหัวข้อเรื่อง" } } }
```

### Approval Service (C14) — `src/features/approvals/approvalService.ts`
| Function | Permission | Story |
|---|---|---|
| `listMyApprovals(actor, criteria)` | `approval:view_assigned` | US-030 |
| `decide(actor, approvalId, 'approved' \| 'rejected', comment?, now)` | `approval:decide_assigned` + `approverId = actor` + ขั้นก่อนหน้า approved | US-031 |

ผลของ `decide` — **Service Requests**:
| ขั้น | ผล | สถานะ call |
|---|---|---|
| Department | approved, ยังมี Head | Department Accepted |
| Department | approved, ขั้นสุดท้าย | Request In-Progress |
| Department | rejected | Department Declined |
| Head | approved | Head Approved → Request In-Progress (2 history) + เริ่ม SLA ถ้า `slaStartsAfterApproval` |
| Head | rejected | Head Rejected |

ผลของ `decide` — **Change (RFC)** (`statusByCallType` ของ RFC ไม่มีสถานะ approval แยก) `[ASM]`:
| ขั้น | ผล | สถานะ call |
|---|---|---|
| ขั้นใดที่ไม่ใช่ขั้นสุดท้าย | approved | ไม่เปลี่ยน (Request For Change / Under Review) — บันทึก history `approved` |
| ขั้นสุดท้าย | approved | Ready for CAB (ตรงกับ seed `call_008`) |
| ขั้นใด | rejected | Cancelled + history `rejected` พร้อมเหตุผล |
> หลัง Ready for CAB: agent เปลี่ยนต่อ Scheduled for Review → Implementation → Completed/Failed ตาม state machine (หน้าประชุม CAB = Nice ไม่ทำ)

### Data Layer (C10) — `src/data/repositories.ts`
```ts
interface Repository<T extends { id: string }> {
  findAll(): T[];
  findById(id: string): T | undefined;
  create(item: T): void;
  update(id: string, patch: Partial<T>): void;
}
commit(changes: Partial<Dataset>): Result<void>;   // เขียน itsm.db.v1 ครั้งเดียว
resetToSeed(): void;
```

---

## 2. HTTP — AI Assist (dev proxy)

### `POST /api/ai/assist`
- **Description**: ส่งข้อความผู้ใช้ไป Azure agent ผ่าน Vite proxy (US-032–034)
- **Auth**: proxy แนบ key จาก `AZURE_AI_KEY` (`.env.local`) ไปยัง `AZURE_AI_ENDPOINT` — browser ไม่เห็น key
- **Timeout**: client ยกเลิกที่ 10 วินาที → fallback rule-based
- **Status**: contract ของ Azure agent `[TBD]` — shape ด้านล่างเป็น **contract ฝั่งแอป** ที่ adapter (`azure.ts`) ต้องแปลงให้ได้

**Request**
```json
{ "text": "เมาส์ใช้ไม่ได้ เปลี่ยนถ่านแล้ว", "page": "my-space" }
```
**Response 200**
```json
{ "kind": "draft",
  "draft": { "serviceDefinitionId": "sdf_002", "urgency": "3-Medium", "impact": "4-Minor/Localized",
             "summary": "Mouse ใช้งานไม่ได้", "notes": "<p>เปลี่ยนถ่านแล้วยังใช้ไม่ได้</p>" } }
```
```json
{ "kind": "navigate", "route": "/my-space", "filters": { "openClosed": "open" } }
```
```json
{ "kind": "unknown" }
```
**Errors**: `502` (Azure error) · `504` (timeout) · `500` (proxy config ขาด) → client แสดง AI_UNAVAILABLE และใช้ rule-based

**Validation ฝั่ง client**: response parse ด้วย Zod; route ต้องอยู่ใน route table และผ่าน `can()`; field ใน draft ต้องอยู่ใน enum/ID ที่มีจริง ไม่งั้นทิ้ง field นั้น

---

## Add-on

### 2026-11-13 — §2 AI Assist ผูกกับ Azure AI Foundry
- Request คงเดิม `{ "text": string (1–1000 ตัวอักษรหลัง trim), "page": string (≤ 60) }` · body อื่น/เกินขนาด 8KB → `400`
- Response 200 จาก middleware (shape ที่ model ตอบ, browser แปลงเป็น `AiResult` เอง):
```json
{ "kind": "draft", "serviceDefinitionId": "sdf_002", "route": null, "summary": "Mouse ใช้งานไม่ได้" }
{ "kind": "navigate", "serviceDefinitionId": null, "route": "/calls/search", "summary": null }
{ "kind": "unknown", "serviceDefinitionId": null, "route": null, "summary": null }
```
- Errors: `400` request ผิด · `405` ไม่ใช่ POST · `500` env ขาด (`AZURE_AI_ENDPOINT` / `AZURE_AI_DEPLOYMENT` / `AZURE_AI_KEY`) · `502` Azure ตอบ non-2xx หรือ output ไม่ใช่ JSON ตาม schema · `504` เกิน 9 วินาที · body error = `{ "error": "<code>" }` ไม่มีรายละเอียดภายใน
- Azure upstream: `POST {AZURE_AI_ENDPOINT}/responses`, header `api-key`, body `{ model, instructions, input: text, text: { format: { type: "json_schema", name: "ai_assist", strict: true, schema } } }`

### 2026-11-13 — §2 upstream ผ่าน AI SDK
- shape request / response / error ของ `/api/ai/assist` คงเดิม · upstream ไม่ได้ POST `/responses` เองแล้ว — AI SDK provider เป็นผู้เรียก (Azure: Responses API ผ่าน `@ai-sdk/azure`) · ดู integration.md Add-on "AI SDK ToolLoopAgent"

### 2026-11-13 — §2 response เพิ่ม `reply`
- ทุก response 200 มี key `reply` เพิ่ม (`string | null`) · kind ใหม่ `reply` สำหรับคำทักทาย / คำถามทั่วไป:
```json
{ "kind": "reply", "serviceDefinitionId": null, "route": null, "summary": null, "reply": "สวัสดี ช่วยแจ้งปัญหา IT หรือพาไปหน้าที่ต้องการได้" }
{ "kind": "draft", "serviceDefinitionId": "sdf_002", "route": null, "summary": "Mouse ใช้งานไม่ได้", "reply": null }
```
- kind `reply` ที่ `reply` ว่าง → `502` · request / error code อื่นคงเดิม · ดู integration.md Add-on "คุยคำถามทั่วไป"
