# Personas

## Summary
<!-- Compact digest for downstream phases. -->
- **User Types**: 4 personas
- **Key Roles**: requestor (สมชาย), approver (ปรีชา / อรุณี), agent (ธนา), admin (ผู้ดูแล)
- **Design Implications**: RBAC แบบ default-deny ตาม `rolePermissions` · desktop-first รองรับ tablet/mobile · status ต้องมี icon + label · UI ไทย คงศัพท์ ITIL

> ชื่อ persona มาจาก `database.json` ซึ่งเป็นข้อมูลสมมติทั้งหมด

## Overview
ระบบรองรับผู้ใช้ 4 กลุ่ม แต่ละกลุ่มเห็นข้อมูลและทำ action ได้ต่างกันตาม permission matrix (§5.11) และ `rolePermissions` ใน `database.json`

---

## สมชาย — ผู้แจ้งเรื่อง (requestor)

**Role**: พนักงานฝ่ายการตลาด (`usr_001`) · กรณีพิเศษ: `usr_003` เป็น VVIP

**Goals**:
- แจ้งปัญหา/ขอบริการให้เสร็จเร็ว โดยไม่ต้องรู้ว่าเรื่องต้องไปคิวไหน
- รู้ว่าเรื่องอยู่สถานะอะไร และเหลือเวลาเท่าไรก่อนครบ SLA

**Pain Points**:
- ระบบเดิมมีคอลัมน์ ~40 คอลัมน์ หาเรื่องตัวเองยาก
- สถานะ 47 ค่ารวมทุก call type อ่านแล้วไม่รู้ว่าเรื่องคืบหน้าแค่ไหน

**User Journey**: My Space → Service Catalog → เลือกบริการ → กรอกฟอร์ม → ได้เลข ticket → ติดตามใน My Space / หน้า Detail

**Implications**: catalog ต้องนำทางด้วยหมวดภาษาไทยชัดเจน · ฟอร์มกรอกค่าเริ่มต้นจาก template · My Space ใช้ 8 คอลัมน์ default · AI Assistant ช่วยคนที่ไม่รู้ว่าเลือกบริการไหน

---

## ปรีชา / อรุณี — ผู้อนุมัติ (approver)

**Role**: หัวหน้าฝ่าย (`usr_004`, Department approval) และผู้อำนวยการ (`usr_005`, Head approval)

**Goals**:
- เห็นเฉพาะคำขอที่รอตัวเองอนุมัติ และตัดสินใจได้เร็ว
- ปฏิเสธพร้อมเหตุผลให้ผู้แจ้งแก้ได้

**Pain Points**:
- ต้องค้นหาเรื่องที่รออนุมัติเองจากหลายเงื่อนไข
- ไม่เห็นว่า SLA ของคำขอเริ่มนับเมื่อไร

**User Journey**: Approvals (My Approvals) → เปิดคำขอ → อนุมัติ / ปฏิเสธ + comment → ขั้นถัดไปหรือแจ้งผลผู้แจ้ง

**Implications**: หน้า Approvals ต้อง default ที่ "My Approvals" + Done = No · ปฏิเสธต้องบังคับ comment · approver ยังแจ้งเรื่องเองได้เหมือน requestor

---

## ธนา — เจ้าหน้าที่ Service Desk (agent)

**Role**: เจ้าหน้าที่ฝ่าย IT สังกัดกลุ่ม `grp_001`, `grp_002` (`usr_006`)

**Goals**:
- เห็นเรื่องในคิวกลุ่มตัวเอง เรียงตามความเร่งด่วน/เวลาที่เหลือ
- assign และเปลี่ยนสถานะตามขั้นตอนที่ถูกต้อง พร้อมบันทึกเหตุผล

**Pain Points**:
- ระบบเดิมไม่บอกว่าจากสถานะนี้ไปสถานะไหนได้
- เรื่องที่เลยกำหนดไม่เด่นพอ

**User Journey**: Search (Open + คิวกลุ่ม) → เปิดเรื่อง → assign → In Process → Resolved + closure category

**Implications**: ปุ่มเปลี่ยนสถานะแสดงตาม state machine เท่านั้น · Time Left ติดลบต้องเด่นด้วย icon + label "เลยกำหนด" · เห็นเฉพาะเรื่องในคิวกลุ่มที่สังกัด

---

## ผู้ดูแล — ผู้ดูแลระบบ (admin)

**Role**: ผู้ดูแลระบบฝ่าย IT (`usr_008`)

**Goals**:
- เห็นภาพรวมทุกเรื่องในระบบ
- ดูแล catalog / template / ผู้ใช้ (รอบนี้แก้ผ่าน `database.json` ตาม D1-11)

**Pain Points**:
- ต้องตรวจสอบย้อนหลังว่าใครเปลี่ยนอะไรเมื่อไร

**User Journey**: Search (All) → เปิดเรื่องใดก็ได้ → ดู timeline

**Implications**: รอบนี้ไม่มีหน้า admin · admin เห็นทุกเรื่องแบบอ่านอย่างเดียว (ไม่มีสิทธิ์ `call:change_status` ใน `rolePermissions`)

---

## Design Implications

- **Architecture**: RBAC default-deny ทุก route และทุก action โดยอ่านจาก `rolePermissions` · แยก visibility rule: own / on-behalf / group queue / all
- **UI/UX**: desktop-first · ทุก list มี empty state · status badge = icon + label · action ปุ่มตาม state machine · ภาษาไทย คงศัพท์ ITIL
- **Data & Privacy**: ข้อมูลสมมติเท่านั้น · requestor เห็นเฉพาะเรื่องตัวเอง/ที่แจ้งแทน · ไม่ log PII · AI Assistant ส่งเฉพาะข้อความที่ผู้ใช้พิมพ์ + ชื่อหน้าปัจจุบัน
