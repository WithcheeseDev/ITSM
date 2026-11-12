# Product

## Summary
- **Product**: ITSM Support Desk (IT-01) — เว็บแจ้งเรื่องและติดตาม Support Call ภายในองค์กร
- **Users**: requestor, approver, agent, admin
- **Type**: Greenfield · scope new

## Overview
ระบบให้พนักงานแจ้งปัญหา IT/อาคาร ขอใช้บริการ และขอเปลี่ยนแปลงระบบ (RFC) ผ่านหน้าเว็บเดียว เลือกบริการจาก Service Catalog แบบลำดับชั้นหรือกรอกฟอร์ม Support Call ตรง ระบบออกเลข ticket, คำนวณ priority จาก Urgency × Impact, ส่งเข้าคิวกลุ่มผู้รับผิดชอบ, ส่งขออนุมัติเมื่อจำเป็น และให้ผู้แจ้งติดตามสถานะและเวลาที่เหลือตาม SLA ได้จาก My Space

## Problem Statement
ระบบ ITSM เดิมมีตารางคอลัมน์จำนวนมาก (~40), สถานะรวมทุก call type 47 ค่า (มีซ้ำ) และไม่แสดง priority matrix หรือ transition ของสถานะ ผู้ใช้จึงติดตามเรื่องยาก ระบบใหม่ต้องแยก status ตาม call type, แสดงเฉพาะข้อมูลจำเป็น และมีผู้ช่วย AI ช่วยเปิด ticket และพาไปหน้าที่ต้องการ

## Target Users
- **requestor** — พนักงาน แจ้งเรื่องให้ตัวเอง/แจ้งแทน ติดตาม ยกเลิก ทำแบบสอบถามหลังปิด
- **approver** — หัวหน้า อนุมัติ/ปฏิเสธ Department หรือ Head approval
- **agent** — เจ้าหน้าที่ Service Desk / Resolver รับเรื่องในคิว assign เปลี่ยนสถานะ ปิดเรื่อง `[ASM]`
- **admin** — จัดการ catalog, template, กลุ่ม, ผู้ใช้ `[ASM]`

## Key Features
- **Service Catalog** — หมวดลำดับชั้น → บริการ → เปิดฟอร์มจาก template
- **Add Support Call** — ฟอร์ม Contact / Priority & Template / CI / Details / แนบไฟล์ พร้อม validation
- **My Space** — เรื่องที่แจ้งให้ตัวเอง / แจ้งแทน พร้อมจำนวน
- **Search Support Call** — เงื่อนไขพื้นฐาน + ขั้นสูง, filter call type และ Open/Closed
- **Support Call Detail** — สถานะ, Time Left, timeline, ความเห็น, action ตาม state machine
- **Approvals** — 2 ขั้น Department → Head
- **AI Assistant** — agent บน Azure ช่วยกรอกฟอร์ม (ผู้ใช้กด OK เอง) และ navigate
- **Nice** — Scheduled Activities, Knowledge Base, Survey, Problem management

### Requirements Phase Additions (2026-11-11)
- **ขอบเขตรอบนี้**: Must + Should (34 stories) — Nice ไว้ phase ถัดไป
- **Rules engine**: priority จาก `priorityMatrix` / `rfcPriorityMatrix`, SLA จาก `slaHoursByPriority` (24×7), เริ่มนับหลัง Head อนุมัติเมื่อหมวด `slaStartsAfterApproval = true`
- **Lifecycle**: re-open ภายใน 7 วัน, Resolved เกิน 7 วัน → Closed อัตโนมัติ
- **Visibility**: requestor/approver = เรื่องตัวเอง+แจ้งแทน · agent = คิวกลุ่มตัวเอง · admin = ทุกเรื่องแบบอ่านอย่างเดียว · ไม่มีหน้า admin
- **AI Assistant**: interface + rule-based mock ก่อน ต่อ Azure เมื่อได้ contract
- **ไฟล์แนบ**: เก็บแค่ metadata

## Domain Language

| Term | Definition | Example |
|------|-----------|---------|
| Support Call | ticket 1 รายการ (ทุก call type) | #100245 |
| Call Type | Incident / Problem / Change (RFC) / Request Fulfilment (ITSR) / Service Requests | Incident |
| Template | แม่แบบที่กำหนด call type/หมวด/คิว/urgency/impact ล่วงหน้า | "ขอสิทธิ์ระบบ" |
| Urgency / Impact | ระดับเร่งด่วน / ผลกระทบ (มีชุดแยกสำหรับ RFC) | 2-High / 3-Moderate |
| Priority | ผลจาก Urgency × Impact → P1–P4 | P2 |
| Queue / Group | คิว/กลุ่มเจ้าหน้าที่รับเรื่อง | Network Team |
| Time Left | เวลาเหลือก่อน Due Date (ติดลบ = เลยกำหนด) | "1 days 04:30" |
| On behalf | แจ้งแทนผู้อื่น | Somebody else |
| CI | Configuration Item: Service, Product, Item, Serial, Version | Notebook X1 |

## Success Criteria
- ทุก FR ระดับ Must ทำงานได้จริงบน browser (Definition of Done ตามนโยบาย hands-on-project)
- WCAG 2.2 AA, page load ≤ 2 วินาที (localhost), ค้นหา 1,000 รายการ ≤ 500ms
- ตัวชี้วัดอื่น: To be defined during requirements phase

## Constraints & Assumptions
- **Constraints**: รันบน local · ใช้ข้อมูลสมมติเท่านั้น (PDPA) · ห้ามลอก UI/แบรนด์ระบบเดิม · ไม่เชื่อม AD/SSO/อีเมลจริง · ไม่เก็บ secret ใน frontend
- **Assumptions**: login เป็น mock · persist ใน localStorage · priority matrix, SLA, state transition, สิทธิ์ละเอียดของ agent/admin ยังเป็นสมมติฐาน · contract ของ Azure agent `[TBD]`

## Project Type
- **Type**: Greenfield
- **Scope**: New product
