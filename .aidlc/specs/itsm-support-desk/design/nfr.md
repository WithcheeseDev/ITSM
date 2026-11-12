# Non-Functional Requirements & Infrastructure

> ไม่ได้มีคำถาม NFR แยกใน D3 — ไฟล์นี้แปลง NFR-001–030 จาก requirements (context แนะนำ NFR = Yes) เป็นแนวทาง design โดยใช้เฉพาะ D3 choices · หัวข้อที่ไม่เกี่ยวกับแอป local ระบุ N/A

---

## Performance
- **Page load**: ≤ 2 วินาทีบน localhost (NFR-001) — route-level code splitting (`lazy()`) สำหรับ Call Form (Tiptap หนักสุด) และ Approvals
- **Search**: 1,000 รายการ ≤ 500ms (NFR-002) — filter linear บน array + `useMemo` · สร้าง Map ตอนโหลด (data-model Access Patterns)
- **Concurrent users**: 1 ต่อ browser (localStorage แยกต่อเครื่อง)

## Scalability
N/A — แอป local, ข้อมูลใน browser · ขีดจำกัด: localStorage ~5MB → ไม่เก็บเนื้อไฟล์ (D1-13)

## Security
- **Authentication**: mock login (FR-001) — ไม่มีรหัสผ่าน · **ห้ามใช้กับข้อมูลจริง**
- **Authorization**: RBAC default-deny จาก `rolePermissions` ตรวจทั้ง route guard (C1) และ service (C8, C14)
- **XSS**: rich text sanitize ด้วย DOMPurify ตอนบันทึกและตอน render (NFR-020) · ไม่ใช้ `dangerouslySetInnerHTML` กับค่าที่ไม่ผ่าน `sanitizeHtml`
- **Secrets**: `AZURE_AI_KEY` อยู่ใน `.env.local` ฝั่ง dev proxy เท่านั้น ห้าม prefix `VITE_` · `.env.local` อยู่ใน `.gitignore`
- **Encryption**: In transit — localhost HTTP (dev), proxy → Azure ผ่าน HTTPS · At rest — localStorage ไม่เข้ารหัส: ยอมรับได้เพราะข้อมูลสมมติเท่านั้น (justified: non-production, PDPA §14)
- **Third-party assets**: ฟอนต์ self-host ผ่าน @fontsource (OFL) · ไอคอน Lucide (ISC) · ไม่โหลด CDN ภายนอก
- **Compliance**: PDPA — ข้อมูลสมมติ, AI ส่งเฉพาะข้อความ + ชื่อหน้า (FR-114), ไม่ log PII (NFR-021)

**Roles & Permissions**: ตาม `rolePermissions` ใน `database.json` (สรุปใน `personas.md`)

## Accessibility (NFR-012)
- WCAG 2.2 AA: focus-visible ทุก interactive, label/ARIA ครบ, tap target ≥ 44px, contrast ผ่าน (token ใน `design-system.md`)
- Status / priority / Time Left เลยกำหนด = icon รูปต่างกัน + label ไม่พึ่งสีอย่างเดียว
- Radix primitives (shadcn/ui) จัดการ focus trap / keyboard ของ Dialog, Popover, Select
- เคารพ `prefers-reduced-motion`

## Availability & Reliability
- **Uptime / RPO / RTO / Backup**: N/A (local) · ข้อมูลหายได้เมื่อล้าง browser data — ปุ่ม "รีเซ็ตข้อมูลตัวอย่าง" คืนสู่ seed
- **Integrity**: commit เขียน dataset ครั้งเดียวต่อ use case (C10) · parse fail → reset (US-001)

## Infrastructure
| Component | Service | Configuration |
|---|---|---|
| Frontend | Vite dev server (local) | port 5173 |
| AI proxy | Vite `server.proxy` | `/api/ai/assist` → Azure |
| Storage | localStorage | key `itsm.db.v1` |
| Hosting/CDN | [TBD - not decided in D3] | deploy = optional |

## Caching
N/A — ข้อมูลอยู่ใน memory + localStorage อยู่แล้ว

## Data Management
- **Migration**: `schemaVersion` ใน dataset — เปลี่ยน schema → เพิ่ม migrate function หรือ reset เป็น seed
- **Retention / Deletion**: ข้อมูลอยู่ใน browser ผู้ใช้ · ไม่มี hard delete ใน UI (history append-only)

## Observability
ดู `design/operations.md` (Minimal, log-based, ไม่มี health endpoint)

## CI/CD & Deployment
[TBD - not decided in D3] — deploy เป็น optional ลำดับสุดท้ายตามนโยบาย
