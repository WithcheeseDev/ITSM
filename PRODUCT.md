# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
- **requestor** — พนักงานภายในองค์กร แจ้งปัญหา IT / อาคาร ขอใช้บริการ หรือขอเปลี่ยนแปลงระบบ (RFC) ให้ตัวเองหรือแจ้งแทนผู้อื่น แล้วติดตามสถานะและเวลาที่เหลือตาม SLA
- **approver** — หัวหน้า อนุมัติ / ปฏิเสธ 2 ขั้น (Department → Head)
- **agent** — เจ้าหน้าที่ Service Desk / Resolver รับเรื่องในคิวกลุ่มตัวเอง มอบหมาย เปลี่ยนสถานะ ปิดเรื่อง
- **admin** — ดูทุกเรื่องแบบอ่านอย่างเดียว (ไม่มีหน้า admin ในรอบนี้)

ทุกกลุ่มทำงานบน PC ทั้งวัน อ่านตารางและกรอกฟอร์มเป็นงานหลัก

## Product Purpose
เว็บแจ้งเรื่องและติดตาม Support Call ภายในองค์กร (IT-01) ผ่านหน้าเดียว: เลือกบริการจาก Service Catalog แบบลำดับชั้นหรือกรอกฟอร์ม Support Call ตรง → ระบบออกเลข ticket, คำนวณ priority, ส่งเข้าคิวกลุ่ม, ส่งขออนุมัติเมื่อจำเป็น · สำเร็จเมื่อผู้แจ้งรู้สถานะและเวลาที่เหลือของเรื่องตัวเองได้ทันที และเจ้าหน้าที่ปิดเรื่องตาม state machine ได้ครบ

## Positioning
แก้ปัญหาระบบ ITSM เดิมที่ตารางมี ~40 คอลัมน์และสถานะรวมทุก call type 47 ค่า: status แยกตาม call type, priority จาก Urgency × Impact (matrix แยกของ RFC), Time Left ตาม SLA (24×7, เริ่มนับหลัง Head อนุมัติในบางหมวด), แสดงเฉพาะข้อมูลที่จำเป็น และมีผู้ช่วย AI ช่วยกรอกฟอร์ม (ผู้ใช้กด OK เอง) และพาไปหน้าที่ต้องการ

## Operating Context
- Call types: Incident, Problem, Change (RFC), Request Fulfilment (ITSR), Service Requests
- หน้าหลัก: Login (เลือกผู้ใช้ตัวอย่าง), My Space, Service Catalog, Add Support Call, Search, Call Detail, Approvals, AI Assistant panel
- Lifecycle: re-open ได้ภายใน 7 วัน · Resolved เกิน 7 วัน → Closed อัตโนมัติ
- Visibility: requestor / approver = เรื่องตัวเอง + แจ้งแทน · agent = คิวกลุ่มตัวเอง · admin = ทุกเรื่องอ่านอย่างเดียว

## Capabilities and Constraints
- รันบน local · SPA (React + Vite + TypeScript) · persist ใน localStorage · seed `src/data/database.json`
- ข้อมูลสมมติเท่านั้น (PDPA) · mock login · ไม่เชื่อม AD / SSO / อีเมลจริง · ไฟล์แนบเก็บแค่ metadata
- ไม่เก็บ secret ใน frontend · AI agent บน Azure ผ่าน dev proxy — **ยังไม่มี contract** (task 4.6 blocked) ปัจจุบันใช้ rule-based mock
- ภาษา UI: ไทย (ศัพท์เทคนิค / ชื่อสถานะเป็นอังกฤษ)
- Requirements / spec ต้นทาง: `.aidlc/specs/itsm-support-desk/requirements.md`, `.aidlc/blueprints/product.md`

## Brand Commitments
- ชื่อ "ITSM Support Desk" + wordmark ของ product เอง (`src/assets/logo.svg`)
- โทนแดง-ขาว · ไม่ใช้โลโก้ ชื่อ หรือ hex ของ CIMB หรือองค์กรอื่น (design-system-policies HARD RULE #9)
- รูปพื้นหลัง sidebar ที่ผู้ใช้ให้มา: `src/assets/sidebar-bg.webp`
- ห้ามลอก UI / แบรนด์ระบบ ITSM เดิม · ห้ามอิโมจิ · light mode เท่านั้น
- ค่าจริงของ design อยู่ที่ `.claude/rules/design-system.md` + `src/styles/tokens.css`

## Evidence on Hand
- ข้อมูลตัวอย่างสมมติ: `src/data/database.json` (ผู้ใช้ 8 คน, 9 calls, catalog, templates)
- ไม่มีลูกค้า ผู้ใช้จริง testimonial หรือตัวเลขการใช้งานจริง — ห้ามสร้างขึ้น

## Product Principles
- สถานะและเวลาที่เหลือของเรื่องต้องอ่านออกได้ในแวบเดียว — ข้อมูลที่ไม่จำเป็นไม่ขึ้นหน้าจอ
- ทุก action ทำได้ตามสิทธิ์และ state machine เท่านั้น (default-deny)
- AI ช่วยกรอกและนำทาง แต่ผู้ใช้เป็นคนยืนยันเสมอ
- ความหมายไม่พึ่งสีอย่างเดียว — สถานะ / priority / Time Left มี icon + label

## Accessibility & Inclusion
WCAG 2.2 AA: focus-visible ทุก interactive, label / ARIA ครบ, tap target ≥ 44px, contrast ผ่าน, เคารพ `prefers-reduced-motion`
