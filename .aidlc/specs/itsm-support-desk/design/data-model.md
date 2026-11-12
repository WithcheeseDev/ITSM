# Data Model

## Overview
- **Database**: ไม่มี DBMS — dataset ทั้งชุดเก็บใน localStorage key `itsm.db.v1` (D3-2)
- **Seed**: `database.json` (copy ไป `src/data/database.json`) โหลดเมื่อ key ไม่มีหรือ parse ไม่ผ่าน
- **Client**: Repository layer (C10) + Zod schema ต่อ entity (D3-6) ตรวจตอนอ่าน
- **ข้อมูลส่วนตัว**: ข้อมูลสมมติเท่านั้น (PDPA §14) · ไม่เก็บ secret

Shape ของ dataset = top-level keys ของ `database.json`:
`_meta, enums, priorityMatrix, rfcPriorityMatrix, slaHoursByPriority, organizations, locations, groups, queues, users, rolePermissions, products, items, services, serviceCategories, templates, serviceDefinitions, supportCalls, callHistory, approvals, activities, answerBooks, answers, runningNumber, ai`
+ เพิ่ม `schemaVersion: 1` (ใช้ตอน migrate ภายหลัง)

---

## Entities

### SupportCall (`supportCalls`)
| Field | Type | Required | Constraints |
|---|---|---|---|
| id | string `call_###` / UUID สำหรับ record ใหม่ | ✓ | unique |
| number | string 6 หลัก | ✓ | unique, จาก `runningNumber` |
| callType | enum `enums.callTypes` | ✓ | |
| classification | enum `enums.classifications` | ✓ | |
| parentCategory / category / subCategory | string \| null | | จาก template |
| templateId | string \| null | | FK Template |
| requestorId | string | ✓ | FK User |
| openedByUserId | string | ✓ | FK User (≠ requestorId = แจ้งแทน) |
| phone | string \| null | | 9–10 หลัก |
| email | email \| null | | |
| customerReference | string \| null | | |
| urgency / impact | enum standard หรือ rfc | ✓ | ชุดต้องตรง callType (BR-02) |
| priority | `P1`–`P4` | ✓ | คำนวณ (BR-01) |
| serviceId / productId / itemId | string \| null | | FK |
| serialNumber / version | string \| null | | version เติมจาก Product |
| summary | string 1–200 | ✓ | |
| notes | HTML (sanitized) | ✓ | ไม่ว่างหลังตัด tag |
| status | enum `statusByCallType[callType]` | ✓ | ตาม state machine |
| queueId / groupId | string | ✓ | จาก template / queue |
| assignedToId | string \| null | | FK User (สมาชิก groupId) |
| organizationId / locationId | string \| null | | จาก requestor |
| openDate | ISO 8601 | ✓ | |
| dueDate | ISO 8601 \| null | | null ขณะรออนุมัติในหมวด `slaStartsAfterApproval` |
| closeDate | ISO 8601 \| null | | ตั้งเมื่อเข้า closedStatuses |
| closureCategory | enum `enums.closureCategories` \| null | | บังคับเมื่อ Resolved (US-027) |
| itsrReference | string \| null | | |
| vvip | boolean | ✓ | จาก requestor |
| surveyResult / feedbackCategory | null | | Nice — ไม่ใช้รอบนี้ |
| readByUserIds | string[] | ✓ | Nice (FR-056) — คงค่าไว้ ไม่แสดง |
| attachments | `{ name, size, type }[]` | ✓ | ≤ 5, size ≤ 10MB (D1-13) |
| resolvedAt | ISO 8601 \| null | | **เพิ่มใหม่** — ใช้คำนวณ re-open/auto-close; seed ที่ไม่มี field → derive จาก callHistory |

### CallHistory (`callHistory`) — append-only (US-024)
| Field | Type | Required | Constraints |
|---|---|---|---|
| id | string | ✓ | unique |
| callId | string | ✓ | FK SupportCall |
| at | ISO 8601 | ✓ | |
| byUserId | string | ✓ | FK User หรือ `system` |
| action | enum `created \| assigned \| status_changed \| commented \| approved \| rejected \| cancelled \| reopened \| auto_closed` | ✓ | |
| fromStatus / toStatus | Status \| null | | |
| comment | string \| null | | ความเห็น (plain/HTML sanitized) |
| attachments | `{ name, size, type }[]` | | **เพิ่มใหม่** สำหรับความเห็น (US-025) |

### Approval (`approvals`)
| Field | Type | Required | Constraints |
|---|---|---|---|
| id | string | ✓ | |
| callId | string | ✓ | FK SupportCall |
| approvalType | `Department approval \| Head approval` | ✓ | ลำดับตาม template.requiresApproval |
| approverId | string | ✓ | FK User |
| done | boolean | ✓ | |
| decision | `pending \| approved \| rejected` | ✓ | |
| comment | string \| null | | บังคับเมื่อ rejected |
| decidedAt | ISO 8601 \| null | | |

### Activity (`activities`) — อ่านอย่างเดียวรอบนี้ (US-029)
`id, callId, type (enums.activityTypes), taskType, subject, scheduledStart, scheduledEnd, priority, status (enums.activityStatuses), ownerId, actionPlan, attachments`

### Catalog
- **ServiceCategory**: `id, parentId (self FK | null), name, description, icon (ชื่อ Lucide), slaNote | null, slaStartsAfterApproval: boolean`
- **ServiceDefinition**: `id, categoryId, name, description, requestType, templateId, serviceId, featured?` (`featured` = แสดงในแถบบริการยอดนิยมของ My Space, Add-on 2026-11-13)
- **Template**: `id, name, callType, classification, parentCategory, category, subCategory, defaultQueueId, defaultUrgency, defaultImpact, requiresApproval: ApprovalType[]`

### People & Org
- **User**: `id, name, email, phone, role (enums.roles), groupIds[], organizationId, locationId, department, managerId | null, vvip, approvalTypes?[]`
- **Group**: `id, name, queueId` · **Queue**: `id, name, groupId` · **Organization**/**Location**: `id, name`

### CI
- **Service**: `id, name` · **Product**: `id, name, category, serialNumber, version, assignedToId` · **Item**: `id, productId, name`

### Config (อ่านอย่างเดียว)
`enums`, `priorityMatrix`, `rfcPriorityMatrix`, `slaHoursByPriority`, `rolePermissions`, `runningNumber.supportCall`, `ai.fallbackKeywordToServiceDefinition`, `ai.fallbackIntentToRoute`

### Out of scope รอบนี้ (คงไว้ใน dataset)
`answerBooks`, `answers` (Knowledge — Nice)

### Client-only (นอก dataset)
| Key | Content |
|---|---|
| `itsm.session` | `{ currentUserId }` |
| `itsm.columns.{userId}` | รายการคอลัมน์ที่เลือก (US-011) |

---

## ER Diagram

```
ServiceCategory 1──* ServiceCategory (parentId)
ServiceCategory 1──* ServiceDefinition *──1 Template
                                      *──1 Service
Template 1──* SupportCall
User 1──* SupportCall (requestorId)      User 1──* SupportCall (openedByUserId)
User 1──* SupportCall (assignedToId)     User 0..1──* User (managerId)
Group 1──1 Queue    Queue 1──* SupportCall
SupportCall 1──* CallHistory
SupportCall 1──* Approval *──1 User (approverId)
SupportCall 1──* Activity *──1 User (ownerId)
Product 1──* Item ; Product/Item/Service 1──* SupportCall
```

## Access Patterns

| Query | Where | Frequency | Index (in-memory Map) |
|---|---|---|---|
| call ตาม id | Detail | ทุกครั้งเปิดหน้า | `callsById` |
| calls ตาม requestorId / openedByUserId | My Space | บ่อย | filter ตรง (≤ 1,000 รายการ) |
| calls ตาม groupId ∈ user.groupIds | Search (agent) | บ่อย | filter ตรง |
| history ตาม callId | Detail | ทุกครั้ง | `historyByCallId` |
| approvals ตาม approverId + done | Approvals | บ่อย | filter ตรง |
| categories ตาม parentId | Catalog | บ่อย | `categoriesByParent` |

> ไม่มี index จริงเพราะไม่มี DB — สร้าง Map ใน memory ตอนโหลด (NFR-002: 1,000 รายการ ≤ 500ms ผ่านด้วย filter linear)

## Business Rules (นอก schema)
1. `priority` = `priorityMatrix["{u}-{i}"]` (standard) หรือ `rfcPriorityMatrix[urgency]` (RFC)
2. `dueDate` = เวลาเริ่ม + `slaHoursByPriority[priority]` ชม. · เวลาเริ่ม = openDate หรือเวลา Head approval ขั้นสุดท้ายเมื่อหมวด `slaStartsAfterApproval = true`
3. status เปลี่ยนได้เฉพาะ transition ใน state machine; เข้า `closedStatuses` → ตั้ง `closeDate`
4. Resolved + `resolvedAt` เกิน 7 วัน → Closed (`auto_closed`, `byUserId = system`)
5. ทุกการเปลี่ยนแปลง SupportCall/Approval ต้องมี CallHistory 1 รายการในการ commit เดียวกัน
6. `number` = `runningNumber.supportCall + 1` แล้วอัปเดต runningNumber ใน commit เดียวกัน

---

## Add-on

### 2026-11-12 — Task 2.1: รูปร่างข้อมูลใน seed ไม่ตรง model
- **Attachment** (ผู้ใช้เลือก "แปลงตอนโหลด") — `database.json` ใช้ `{ id, fileName, sizeKb }` (call_002, call_008) · model คง `{ name, size, type }` · `normalizeAttachments()` ใน `src/data/seed.ts` แปลงตอนโหลด: `fileName → name`, `sizeKb × 1024 → size` (bytes), `type` เดาจากนามสกุล (ไม่รู้จัก → `application/octet-stream`) · ไม่แก้ `database.json`
- **Activity** — `callId` และ `priority` เป็น `null` ได้ (seed `act_003` Change Freeze Window ไม่ผูกกับ call)
- **SupportCall** — คง field วันที่ของ RFC (`scheduledDate`, `implementationStart/EndDate`, `systemDownStart/EndDate`, `cabMeetingStart/EndDate`) เป็น optional เพื่อไม่ให้ Zod ตัดทิ้ง

## Add-on

- **2026-11-13 (บริการของ Request a Service)** — `schemaVersion` 1 → 2 · migrate ตอนโหลด: dataset ที่ `schemaVersion` < 2 แทนที่ข้อมูลอ้างอิงที่แอปแก้ไม่ได้ (`serviceCategories`, `serviceDefinitions`, `templates`, `services`, `queues`, `groups`, `users`) ด้วยค่าจาก seed · ข้อมูลที่ผู้ใช้สร้าง (calls, history, approvals, activities, runningNumber) คงเดิม · เพิ่ม queue/group สมมติ Cloud & Infrastructure, IT Security, Office Administration และผูกกับ agent ตัวอย่าง
