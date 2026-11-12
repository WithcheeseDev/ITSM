# Requirements — itsm-support-desk

## Summary
<!-- 10-line max. Downstream phases read ONLY this section. -->
- **Stories**: 34 ใน 10 functional areas · ขอบเขต Must + Should (D1-1)
- **Priority**: 20 High (Must) · 11 Medium (Should) · 3 Low (AI Assistant — contract `[TBD]`)
- **User types**: requestor, approver, agent, admin (ดู `personas.md`)
- **Key entities**: SupportCall, CallHistory, Approval, Activity, ServiceCategory, ServiceDefinition, Template, User, Group, Queue
- **Integrations**: AI agent บน Azure ผ่าน dev proxy — รอบนี้ใช้ interface + rule-based mock (D1-12)
- **Data**: `database.json` (seed) + localStorage · priority/SLA ใช้ค่าใน `database.json` (D1-4/5/6)
- **Flow 1**: Login → My Space → Service Catalog → Add Support Call → Detail
- **Flow 2**: Service Request ที่ต้องอนุมัติ → Department → Head → Request In-Progress
- **Flow 3**: agent เปิดเรื่องในคิว → assign → In Process → Resolved → auto-Closed หลัง 7 วัน

> ชื่อ Req ID (FR/NFR/BR/EX) อ้างจาก `initial-requirements/project-requirements/Requirements.md` · D1-x อ้างจาก `.aidlc/workflow/itsm-support-desk/decisions-requirements.md`

---

## A. Data & Session

### US-001: โหลดข้อมูลตัวอย่างและเก็บการเปลี่ยนแปลง
- **As a** ผู้ใช้ทุก role **I want** ข้อมูลตั้งต้นและสิ่งที่ฉันบันทึกยังอยู่หลัง refresh **so that** ทดลองใช้งานต่อเนื่องได้
- **Priority**: High
- **Acceptance Criteria**:
  - WHEN แอปเปิดครั้งแรกและ localStorage ไม่มีข้อมูล, THEN ระบบ shall โหลด `database.json` เป็นข้อมูลตั้งต้น
  - WHEN ผู้ใช้สร้างหรือแก้ข้อมูล, THEN ระบบ shall บันทึกลง localStorage ก่อนแสดงผลสำเร็จ
  - IF ข้อมูลใน localStorage parse ไม่ได้, THEN ระบบ shall แจ้งผู้ใช้และโหลด `database.json` ใหม่, ELSE ใช้ข้อมูลเดิม
  - The system shall ใช้ `_meta.currentDate` เป็นเวลาอ้างอิงของ seed data และใช้เวลาจริงของเครื่องสำหรับ record ใหม่
- **Dependencies**: —
- **Source**: Requirements §2.1, §3 · D1-13

### US-002: ล็อกอิน mock และออกจากระบบ
- **As a** ผู้ใช้ **I want** เลือกผู้ใช้ตัวอย่างเพื่อเข้าระบบ และออกจากระบบได้ **so that** ทดสอบแต่ละ role ได้
- **Priority**: High
- **Acceptance Criteria**:
  - WHEN ผู้ใช้เปิดหน้า Login, THEN ระบบ shall แสดงรายชื่อผู้ใช้จาก `users` พร้อม role โดยไม่มีช่องรหัสผ่าน
  - WHEN ผู้ใช้เลือกชื่อ, THEN ระบบ shall เก็บ session ผู้ใช้ปัจจุบันและพาไป My Space
  - WHEN ผู้ใช้กด "ออกจากระบบ" ในเมนูชื่อผู้ใช้มุมขวาบน, THEN ระบบ shall ล้าง session และกลับหน้า Login
  - IF ไม่มี session, THEN ระบบ shall พาทุก route ไปหน้า Login
- **Dependencies**: US-001
- **Source**: FR-001 (Must), FR-002 (Should)

### US-003: เมนูหลักและการตรวจสิทธิ์ default-deny
- **As a** ผู้ใช้ **I want** เห็นเมนูเฉพาะที่ role ของฉันใช้ได้ **so that** ไม่เข้าหน้าที่ไม่มีสิทธิ์
- **Priority**: High
- **Acceptance Criteria**:
  - The system shall แสดงเมนู My Space, Service Catalog, แจ้งเรื่องใหม่, ค้นหาเรื่อง, อนุมัติ (approver) ตามสิทธิ์ใน `rolePermissions`
  - The system shall ปฏิเสธทุก route และทุก action ที่ role ไม่มี permission ตรงตัว (default-deny)
  - IF ผู้ใช้เปิด URL ที่ไม่มีสิทธิ์, THEN ระบบ shall พาไป My Space พร้อมข้อความ "คุณไม่มีสิทธิ์เข้าหน้านี้"
  - The system shall ตรวจสิทธิ์ใน logic layer ด้วย ไม่ใช่แค่ซ่อนปุ่ม
- **Dependencies**: US-002
- **Source**: FR-100–102 (Must), EX-07

### US-004: ขอบเขตการมองเห็น Support Call
- **As a** ผู้ใช้ **I want** เห็นเฉพาะเรื่องที่เกี่ยวกับฉัน **so that** ข้อมูลคนอื่นไม่รั่ว
- **Priority**: High
- **Acceptance Criteria**:
  - WHILE role = requestor หรือ approver, THEN ระบบ shall แสดงเฉพาะเรื่องที่ผู้ใช้เป็น `requestorId` หรือ `openedByUserId`
  - WHILE role = approver, THEN ระบบ shall แสดงเรื่องที่มี approval มอบให้ผู้ใช้เพิ่มเติม
  - WHILE role = agent, THEN ระบบ shall แสดงเรื่องของตัวเอง + เรื่องที่ `groupId` อยู่ใน `groupIds` ของผู้ใช้
  - WHILE role = admin, THEN ระบบ shall แสดงทุกเรื่องแบบอ่านอย่างเดียว
  - IF ผู้ใช้เปิดหน้า Detail ของเรื่องนอกขอบเขต, THEN ระบบ shall แสดง "ไม่พบรายการหรือไม่มีสิทธิ์" โดยไม่แสดงข้อมูลใด ๆ ของเรื่อง
- **Dependencies**: US-003
- **Source**: FR-103 (Must), permission matrix §5.11, D1-10, D1-11

---

## B. Business Rules Engine

### US-005: คำนวณ priority
- **As a** agent **I want** priority คำนวณอัตโนมัติจาก Urgency × Impact **so that** จัดลำดับงานได้สม่ำเสมอ
- **Priority**: High
- **Acceptance Criteria**:
  - WHEN call type ไม่ใช่ RFC, THEN ระบบ shall หา priority จาก `priorityMatrix` ด้วย key `{เลข urgency}-{เลข impact}`
  - WHEN call type = Change (RFC), THEN ระบบ shall หา priority จาก `rfcPriorityMatrix` ด้วยค่า urgency
  - WHEN ผู้ใช้เปลี่ยน urgency หรือ impact ในฟอร์ม, THEN ระบบ shall แสดง priority ใหม่ทันที
  - IF ไม่พบ key ใน matrix, THEN ระบบ shall ไม่บันทึกและแสดง "ไม่สามารถคำนวณ priority ได้"
- **Dependencies**: US-001
- **Source**: BR-01, FR-040, D1-4

### US-006: คำนวณ due date และ Time Left
- **As a** requestor **I want** รู้เวลาที่เหลือก่อนครบ SLA **so that** รู้ว่าเรื่องจะเสร็จเมื่อไร
- **Priority**: High
- **Acceptance Criteria**:
  - WHEN สร้าง call, THEN ระบบ shall ตั้ง `dueDate = openDate + slaHoursByPriority[priority]` ชั่วโมง (นับ 24×7)
  - WHERE หมวดของ call มี `slaStartsAfterApproval = true`, WHEN Head approval ผ่าน, THEN ระบบ shall ตั้ง `dueDate = เวลาอนุมัติ + SLA`
  - WHILE เรื่องยังรออนุมัติในหมวดที่ `slaStartsAfterApproval = true`, THEN ระบบ shall แสดง Time Left เป็น "รออนุมัติ"
  - The system shall แสดง Time Left รูปแบบ "X days hh:mm" และค่าติดลบเมื่อเลย due date
  - IF Time Left ติดลบและเรื่องยังไม่อยู่ใน `closedStatuses`, THEN ระบบ shall แสดง icon เตือน + label "เลยกำหนด"
  - WHILE เรื่องอยู่สถานะ `Resolved` (รอปิด 7 วัน), THEN ระบบ shall หยุดนับ SLA — แสดง Time Left แบบเรื่องที่ปิดแล้ว (ไม่มี "เลยกำหนด") · *Add-on 2026-11-13*
- **Dependencies**: US-005
- **Source**: §4.3.2, BR-04, EX-03, D1-5, D1-6

### US-007: State machine แยกตาม call type
- **As a** agent **I want** เปลี่ยนสถานะได้เฉพาะขั้นที่ถูกต้อง **so that** สถานะไม่ผิดขั้นตอน
- **Priority**: High
- **Acceptance Criteria**:
  - The system shall ใช้ชุดสถานะตาม `statusByCallType` และ transition ตาม Requirements §4.4
  - WHEN สร้าง call, THEN ระบบ shall ตั้งสถานะแรก: Incident = New, Service Requests = Request Submitted (หรือ Waiting For Approve ถ้า template มี `requiresApproval`), Change (RFC) = Request For Change
  - IF action ขอ transition ที่ไม่อยู่ใน state machine, THEN ระบบ shall ปฏิเสธที่ logic layer และไม่เปลี่ยนข้อมูล
  - The system shall ถือว่าสถานะใน `closedStatuses` เป็นเรื่องที่ปิดแล้ว
- **Dependencies**: US-001
- **Source**: §4.4, EX-06, D1-7

### US-008: เลข ticket ไม่ซ้ำ
- **As a** requestor **I want** ได้เลข ticket ทันทีหลังบันทึก **so that** ใช้อ้างอิงได้
- **Priority**: High
- **Acceptance Criteria**:
  - WHEN บันทึก call ใหม่สำเร็จ, THEN ระบบ shall ใช้ `runningNumber.supportCall + 1` เป็น `number` 6 หลัก และเก็บค่าใหม่
  - The system shall ไม่ออกเลขซ้ำกับ call ที่มีอยู่
- **Dependencies**: US-001
- **Source**: §4.3.3

---

## C. My Space

### US-009: Calls Logged For You
- **As a** requestor **I want** เห็นเรื่องที่แจ้งให้ฉันพร้อมจำนวน **so that** ติดตามได้ในหน้าเดียว
- **Priority**: High
- **Acceptance Criteria**:
  - WHEN ผู้ใช้เปิด My Space, THEN ระบบ shall แสดง "Welcome Back : {ชื่อ}" และตารางเรื่องที่ `requestorId` = ผู้ใช้ พร้อม "(Count: n)"
  - The system shall แสดงคอลัมน์ default 5 คอลัมน์: Number, Summary, Status, Priority, Time Left (Call Type, Open Date, Due Date เพิ่มได้จากปุ่มเลือกคอลัมน์) · *Add-on 2026-11-13 แทน 8 คอลัมน์ของ FR-014*
  - The system shall เรียงเรื่องตามความเร่งด่วน: เลยกำหนด → ใกล้ครบ → ปกติ (เวลาเหลือน้อยก่อน) → รออนุมัติ → ไม่มี due date / ปิดแล้ว · *Add-on 2026-11-13*
  - WHEN มีเรื่องที่ยังเปิดอยู่, THEN ระบบ shall แสดงแถบสรุปใต้หัวข้อ: จำนวนเลยกำหนด / ใกล้ครบ / รออนุมัติ (icon + label) หรือ "ทุกเรื่องยังอยู่ในเวลา" · *Add-on 2026-11-13*
  - WHERE ผู้ใช้มีสิทธิ์อนุมัติหรือดูคิวกลุ่ม, THEN แถบสรุป shall แสดงลิงก์ "รออนุมัติจากคุณ n เรื่อง" → Approvals และ "เรื่องเปิดในคิวกลุ่มคุณ n เรื่อง" (admin: "เรื่องเปิดทั้งระบบ") → ค้นหาเรื่อง · *Add-on 2026-11-13*
  - WHEN ผู้ใช้กดแถว, THEN ระบบ shall เปิดหน้า Detail ของเรื่องนั้น
  - IF ไม่มีเรื่อง, THEN ระบบ shall แสดง empty state + ปุ่ม "แจ้งเรื่องใหม่"
- **Dependencies**: US-004, US-006
- **Source**: FR-010 (Should), FR-011 (Must), EX-01

### US-010: Calls You Opened On Behalf
- **As a** requestor **I want** เห็นเรื่องที่ฉันแจ้งแทนคนอื่น **so that** ติดตามแทนเพื่อนร่วมงานได้
- **Priority**: Medium
- **Acceptance Criteria**:
  - WHEN ผู้ใช้เปิด My Space, THEN ระบบ shall แสดงตารางเรื่องที่ `openedByUserId` = ผู้ใช้ และ `requestorId` ≠ ผู้ใช้ พร้อมจำนวน
  - IF ไม่มีเรื่อง, THEN ระบบ shall แสดง empty state ของตารางนี้
- **Dependencies**: US-009
- **Source**: FR-012 (Should)

### US-011: เลือกคอลัมน์ตาราง
- **As a** agent **I want** เพิ่ม/ลดคอลัมน์ที่แสดง **so that** เห็นข้อมูลที่ฉันใช้จริง
- **Priority**: Medium
- **Acceptance Criteria**:
  - WHEN ผู้ใช้กดปุ่มเลือกคอลัมน์, THEN ระบบ shall แสดงรายการคอลัมน์ทั้งหมดของ Support Call ให้ติ๊กเลือก
  - WHEN ผู้ใช้เปลี่ยนการเลือก, THEN ระบบ shall อัปเดตตารางทันทีและจำค่าต่อผู้ใช้ใน localStorage
  - IF ผู้ใช้เอาคอลัมน์ออกหมด, THEN ระบบ shall คง Number ไว้อย่างน้อย 1 คอลัมน์
- **Dependencies**: US-009
- **Source**: FR-014 (Should)

---

## D. Service Catalog

### US-012: เลือกหมวดบริการแบบลำดับชั้น
- **As a** requestor **I want** เลือกหมวดจากการ์ดและเข้าไปหมวดย่อย **so that** หาบริการที่ต้องการได้โดยไม่ต้องรู้ชื่อคิว
- **Priority**: High
- **Acceptance Criteria**:
  - WHEN ผู้ใช้เปิด Service Catalog, THEN ระบบ shall แสดงการ์ดหมวดที่ `parentId = null` พร้อมชื่อ คำอธิบาย และไอคอน
  - WHEN ผู้ใช้กดการ์ด, THEN ระบบ shall แสดงหมวดย่อยและ breadcrumb "Service Categories > {หมวด}"
  - WHERE หมวดมี `slaNote`, THEN ระบบ shall แสดงหมายเหตุ SLA ใต้ชื่อหมวด
  - WHEN ผู้ใช้กด breadcrumb, THEN ระบบ shall กลับไประดับนั้น
- **Dependencies**: US-003
- **Source**: FR-020, FR-021 (Must), FR-024 (Should)

### US-013: เลือกบริการและเปิดฟอร์มจาก template
- **As a** requestor **I want** กด "Request this service" แล้วได้ฟอร์มที่กรอกค่าเริ่มต้นไว้ **so that** กรอกน้อยลง
- **Priority**: High
- **Acceptance Criteria**:
  - WHEN หมวดมี service definition, THEN ระบบ shall แสดงตาราง Name / Description / Request Type / ปุ่ม "Request this service"
  - WHEN ผู้ใช้กด "Request this service", THEN ระบบ shall เปิดฟอร์ม Add Support Call พร้อม template, call type, หมวด, urgency, impact และ service ตาม `templateId` ของบริการ
  - IF หมวดไม่มีบริการ, THEN ระบบ shall แสดง "ยังไม่มีบริการในหมวดนี้"
- **Dependencies**: US-012, US-015
- **Source**: FR-022, FR-025 (Must)

### US-014: แจ้งให้ตัวเองหรือแจ้งแทนผู้อื่น
- **As a** requestor **I want** เลือก Myself หรือ Somebody else **so that** แจ้งแทนเพื่อนร่วมงานได้
- **Priority**: Medium
- **Acceptance Criteria**:
  - WHEN ผู้ใช้เลือก Somebody else, THEN ระบบ shall บังคับเลือกชื่อผู้ถูกแจ้งแทนจาก `users`
  - WHEN บันทึก call แบบแจ้งแทน, THEN ระบบ shall ตั้ง `requestorId` = ผู้ถูกแจ้งแทน และ `openedByUserId` = ผู้ใช้ปัจจุบัน
  - IF เลือก Somebody else แต่ไม่ระบุชื่อ, THEN ระบบ shall แสดง "กรุณาเลือกผู้แจ้ง"
- **Dependencies**: US-013
- **Source**: FR-023 (Should)

---

## E. Add Support Call

### US-015: ฟอร์ม Contact Information
- **As a** requestor **I want** ข้อมูลติดต่อกรอกให้อัตโนมัติ **so that** ไม่ต้องพิมพ์ซ้ำ
- **Priority**: High
- **Acceptance Criteria**:
  - WHEN เปิดฟอร์ม, THEN ระบบ shall ตั้ง Requestor's Name = ผู้ใช้ปัจจุบัน และแสดงช่อง Phone number, E-mail, Your reference no.
  - WHEN ผู้ใช้เปลี่ยน requestor, THEN ระบบ shall เติม email และ phone จากข้อมูลผู้ใช้นั้น
  - IF E-mail ผิดรูปแบบ, THEN ระบบ shall แสดง "รูปแบบอีเมลไม่ถูกต้อง" ใต้ช่อง
  - IF Phone ที่กรอกไม่ใช่ตัวเลข 9–10 หลัก, THEN ระบบ shall แสดง "เบอร์โทรไม่ถูกต้อง" ใต้ช่อง
- **Dependencies**: US-003
- **Source**: FR-030 (Must), FR-031 (Should), §4.5

### US-016: Priority and Template
- **As a** requestor **I want** เลือก template และระดับ urgency/impact **so that** เรื่องเข้าคิวที่ถูกต้อง
- **Priority**: High
- **Acceptance Criteria**:
  - The system shall แสดงช่อง Template (lookup + ปุ่มล้าง), Urgency, Impact และ priority ที่คำนวณได้
  - WHEN ผู้ใช้เปิด lookup template, THEN ระบบ shall แสดงรายการ template ที่ค้นหาด้วยชื่อได้
  - WHEN ผู้ใช้เลือก template, THEN ระบบ shall เติม call type, classification, หมวด, urgency, impact และคิว default
  - WHILE call type ไม่ใช่ RFC, THEN ระบบ shall แสดงเฉพาะ urgency/impact ชุด standard; WHILE call type = RFC, THEN แสดงเฉพาะชุด RFC
  - IF ค่า urgency/impact ไม่ตรงชุดของ call type, THEN ระบบ shall แสดง "ระดับนี้ใช้กับ RFC เท่านั้น"
- **Dependencies**: US-005, US-015
- **Source**: FR-032 (Must), FR-033 (Should), BR-02

### US-017: CI Information
- **As a** requestor **I want** ระบุอุปกรณ์/บริการที่มีปัญหา **so that** agent วิเคราะห์ได้เร็ว
- **Priority**: Medium
- **Acceptance Criteria**:
  - The system shall แสดงช่อง Service, Product, Item (lookup), Serial number และ Version
  - WHEN ผู้ใช้เลือก Product, THEN ระบบ shall เติม Version จาก Product แบบอ่านอย่างเดียว
  - WHEN ผู้ใช้ล้าง Product, THEN ระบบ shall ล้าง Version
- **Dependencies**: US-015
- **Source**: FR-034 (Should)

### US-018: Details, validation และบันทึก
- **As a** requestor **I want** กรอกหัวข้อ/รายละเอียดแล้วกด OK **so that** ได้เลข ticket
- **Priority**: High
- **Acceptance Criteria**:
  - The system shall แสดง Summary (บังคับ 1–200 ตัวอักษร) และ Notes (rich text, บังคับ)
  - WHEN ผู้ใช้กด OK, IF ผ่าน validation ทุกข้อใน §4.5, THEN ระบบ shall สร้าง call, คำนวณ priority/due date, ตั้งคิว/กลุ่มจาก template, บันทึก history "created" และไปหน้า Detail พร้อมแสดงเลข ticket, ELSE แสดง error ใต้ field ที่ผิดและไม่บันทึก
  - IF Notes ว่างหลังตัด HTML tag, THEN ระบบ shall แสดง "กรุณาระบุรายละเอียด"
  - WHEN ผู้ใช้กด Cancel, IF ฟอร์มถูกแก้แล้ว, THEN ระบบ shall ถามยืนยันก่อนทิ้งข้อมูล, ELSE กลับหน้าก่อนหน้า
  - WHERE template มี `requiresApproval`, WHEN บันทึกสำเร็จ, THEN ระบบ shall สร้าง approval ตามลำดับใน `requiresApproval`
- **Dependencies**: US-006, US-007, US-008, US-016
- **Source**: FR-035, FR-037–040 (Must), EX-04, EX-05

### US-019: แนบไฟล์ (metadata)
- **As a** requestor **I want** แนบไฟล์ประกอบ **so that** agent เห็นหลักฐาน
- **Priority**: Medium
- **Acceptance Criteria**:
  - WHEN ผู้ใช้กด "Add" แล้วเลือกไฟล์, THEN ระบบ shall เก็บชื่อ ขนาด และชนิดไฟล์ (ไม่เก็บเนื้อไฟล์)
  - IF ไฟล์ใหญ่เกิน 10MB หรือแนบเกิน 5 ไฟล์, THEN ระบบ shall ปฏิเสธพร้อมข้อความ "ไฟล์ใหญ่เกินกำหนด" หรือ "แนบได้สูงสุด 5 ไฟล์"
  - WHEN ผู้ใช้กดลบไฟล์ในรายการ, THEN ระบบ shall เอาไฟล์ออกจากรายการก่อนบันทึก
- **Dependencies**: US-018
- **Source**: FR-036 (Should), EX-08, D1-13

---

## F. Search Support Call

### US-020: ค้นหาด้วยเงื่อนไขพื้นฐาน
- **As a** agent **I want** ค้นหาเรื่องด้วยเลข สถานะ ช่วงวันที่ และประเภท **so that** หาเรื่องที่ต้องทำได้เร็ว
- **Priority**: High
- **Acceptance Criteria**:
  - The system shall แสดงเงื่อนไข Number, Status, Open date from/to, Summary, Subject Name, radio call type (All + 5 ประเภท) และ radio All / Open / Closed
  - WHEN เปิดหน้า, THEN ระบบ shall ตั้งค่า default = Open + All call types
  - WHEN ผู้ใช้กด Search, THEN ระบบ shall แสดงเฉพาะเรื่องที่ตรงเงื่อนไขและอยู่ในขอบเขตการมองเห็น (US-004)
  - WHEN ผู้ใช้กด Clear, THEN ระบบ shall คืนค่า default และล้างผล
  - IF Open date from > to, THEN ระบบ shall แสดง "ช่วงวันที่ไม่ถูกต้อง" และไม่ค้นหา
- **Dependencies**: US-004
- **Source**: FR-050, FR-052–054 (Must), BR-05

### US-021: ค้นหาขั้นสูง
- **As a** agent **I want** ค้นหาด้วย ITSR reference, template และ full-text **so that** หาเรื่องเฉพาะเจาะจงได้
- **Priority**: Medium
- **Acceptance Criteria**:
  - WHEN ผู้ใช้กดเปิด Advance Criteria, THEN ระบบ shall แสดง ITSR reference, Template Used, Full-Text + ประเภท (Natural Language / Boolean)
  - WHEN ค้นหาแบบ Natural Language, THEN ระบบ shall จับคู่ทุกคำใน Summary และ Notes (ไม่สนตัวพิมพ์)
  - WHEN ค้นหาแบบ Boolean, THEN ระบบ shall รองรับ AND, OR, NOT
  - The system shall ไม่แสดง checkbox "Include attachments" เพราะไม่เก็บเนื้อไฟล์ (D1-13)
- **Dependencies**: US-020
- **Source**: FR-051 (Should)

### US-022: ตารางผลการค้นหา
- **As a** agent **I want** เห็นผลเป็นตารางและเปิดเรื่องได้ **so that** ทำงานต่อได้ทันที
- **Priority**: High
- **Acceptance Criteria**:
  - The system shall แสดงผลด้วยคอลัมน์ตาม FR-055 โดยใช้ตัวเลือกคอลัมน์ของ US-011
  - WHEN ผู้ใช้กดแถว, THEN ระบบ shall เปิดหน้า Detail
  - IF ไม่พบรายการ, THEN ระบบ shall แสดง "ไม่พบรายการ" + ปุ่ม Clear
  - The system shall แสดงผลค้นหา 1,000 รายการภายใน 500ms
- **Dependencies**: US-020, US-011
- **Source**: FR-055 (Must), EX-02, NFR-002

---

## G. Support Call Detail

### US-023: ดูรายละเอียดเรื่อง
- **As a** requestor **I want** เห็นข้อมูล สถานะ และเวลาที่เหลือของเรื่อง **so that** รู้ความคืบหน้า
- **Priority**: High
- **Acceptance Criteria**:
  - WHEN ผู้ใช้เปิดเรื่องที่มีสิทธิ์, THEN ระบบ shall แสดงทุก field จากฟอร์มแบบอ่านอย่างเดียว + status badge (icon + label) + Priority + Time Left
  - The system shall แสดง Notes หลัง sanitize HTML แล้วเท่านั้น
  - WHERE เรื่องมี approval, THEN ระบบ shall แสดงขั้นอนุมัติและผลของแต่ละขั้น
- **Dependencies**: US-004, US-006, US-018
- **Source**: FR-060 (Must), NFR-012, NFR-020

### US-024: Timeline / audit
- **As a** admin **I want** เห็นประวัติทุกการเปลี่ยนแปลงของเรื่อง **so that** ตรวจสอบย้อนหลังได้
- **Priority**: High
- **Acceptance Criteria**:
  - The system shall บันทึก `callHistory` ทุกครั้งที่สร้าง เปลี่ยนสถานะ assign ความเห็น อนุมัติ/ปฏิเสธ พร้อม who (`byUserId`), when (`at`), what (`action`, `fromStatus`, `toStatus`, `comment`)
  - WHEN ผู้ใช้เปิด Detail, THEN ระบบ shall แสดง timeline เรียงตามเวลา
  - The system shall ไม่ให้แก้หรือลบรายการใน `callHistory`
- **Dependencies**: US-023
- **Source**: FR-061 (Must), NFR-030, D1-14

### US-025: เพิ่มความเห็น
- **As a** requestor **I want** เพิ่มความเห็นและไฟล์ในเรื่อง **so that** สื่อสารกับ agent ได้
- **Priority**: High
- **Acceptance Criteria**:
  - WHEN requestor (เรื่องของตัวเอง) หรือ agent (เรื่องในคิวกลุ่ม) ส่งความเห็น, THEN ระบบ shall บันทึกลง timeline พร้อมไฟล์แนบ (metadata)
  - IF ความเห็นว่าง, THEN ระบบ shall ไม่บันทึกและแสดง "กรุณาพิมพ์ความเห็น"
  - IF ผู้ใช้ไม่มี `call:comment_own` หรือ `call:comment_any` ตามกรณี, THEN ระบบ shall ซ่อนช่องความเห็น
- **Dependencies**: US-024, US-019
- **Source**: FR-062 (Must)

### US-026: agent assign และเปลี่ยนสถานะ
- **As a** agent **I want** assign เรื่องและเปลี่ยนสถานะตามขั้นตอน **so that** งานเดินต่อถูกต้อง
- **Priority**: High
- **Acceptance Criteria**:
  - WHILE ผู้ใช้เป็น agent ของกลุ่มเจ้าของคิว, THEN ระบบ shall แสดงปุ่ม assign (เลือกสมาชิกกลุ่ม) และปุ่มเฉพาะ transition ที่ state machine อนุญาตจากสถานะปัจจุบัน
  - WHEN agent assign, THEN ระบบ shall ตั้ง `assignedToId` และถ้าสถานะเป็น New ให้เปลี่ยนเป็น Assigned
  - WHEN agent เปลี่ยนสถานะ, THEN ระบบ shall บันทึก history และอัปเดตหน้าทันที
  - IF ผู้ใช้ไม่มี `call:change_status`, THEN ระบบ shall ไม่แสดงปุ่มเปลี่ยนสถานะ
- **Dependencies**: US-007, US-024
- **Source**: FR-064 (Must), EX-06

### US-027: Resolve พร้อม closure category
- **As a** agent **I want** ระบุสาเหตุการปิดเมื่อ Resolved **so that** วิเคราะห์ปัญหาย้อนหลังได้
- **Priority**: Medium
- **Acceptance Criteria**:
  - WHEN agent เลือกเปลี่ยนเป็น Resolved, THEN ระบบ shall บังคับเลือก closure category จาก `closureCategories`
  - IF ไม่เลือก closure category, THEN ระบบ shall ไม่เปลี่ยนสถานะและแสดง "กรุณาเลือก Closure Category"
- **Dependencies**: US-026
- **Source**: FR-065 (Should)

### US-028: ยกเลิก, re-open และปิดอัตโนมัติ
- **As a** requestor **I want** ยกเลิกเรื่องที่ไม่ต้องการ และเปิดใหม่ถ้ายังไม่หาย **so that** ควบคุมเรื่องของตัวเองได้
- **Priority**: Medium
- **Acceptance Criteria**:
  - WHILE เรื่องของผู้ใช้ยังไม่ถึง Resolved และไม่อยู่ใน `closedStatuses`, WHEN ผู้ใช้กด "ยกเลิกเรื่อง" และยืนยัน, THEN ระบบ shall เปลี่ยนเป็น Cancelled (หรือ Request Cancelled สำหรับ Service Requests)
  - WHILE เรื่องอยู่ใน Resolved ไม่เกิน 7 วัน, WHEN requestor กด "เปิดใหม่", THEN ระบบ shall เปลี่ยนเป็น Re-Opened และบันทึก history
  - WHEN โหลดข้อมูล, IF เรื่องอยู่ใน Resolved เกิน 7 วัน, THEN ระบบ shall เปลี่ยนเป็น Closed พร้อม history `byUserId = system`
- **Dependencies**: US-026
- **Source**: FR-063, FR-066 (Should), BR-06, D1-8, D1-9

### US-029: Activities ของเรื่อง
- **As a** agent **I want** เห็นรายการ task ใต้เรื่อง **so that** รู้งานย่อยที่ต้องทำ
- **Priority**: Medium
- **Acceptance Criteria**:
  - WHERE เรื่องมี activity, THEN ระบบ shall แสดงตาราง Task Type, Subject, Scheduled Start/End, Status, Owner, Action Plan
  - IF ไม่มี activity, THEN ระบบ shall แสดง "ยังไม่มีกิจกรรม"
- **Dependencies**: US-023
- **Source**: FR-068 (Should)

---

## H. Approvals

### US-030: รายการรออนุมัติ
- **As a** approver **I want** เห็นคำขอที่รอฉันอนุมัติ **so that** ตัดสินใจได้ทันเวลา
- **Priority**: Medium
- **Acceptance Criteria**:
  - WHEN approver เปิด Approvals, THEN ระบบ shall แสดงเงื่อนไข Call number, Summary, Approval type, Done (All/Yes/No), RFC closed (All/Yes/No), checkbox "My Approvals" โดย default = My Approvals + Done = No
  - WHEN กด Search, THEN ระบบ shall แสดง approval ที่ตรงเงื่อนไขและมอบให้ผู้ใช้เท่านั้น
  - IF ไม่มีรายการ, THEN ระบบ shall แสดง "ไม่มีรายการรออนุมัติ"
- **Dependencies**: US-004
- **Source**: FR-070 (Should)

### US-031: อนุมัติ/ปฏิเสธ 2 ขั้น
- **As a** approver **I want** อนุมัติหรือปฏิเสธพร้อมเหตุผล **so that** คำขอเดินต่อหรือหยุดชัดเจน
- **Priority**: Medium
- **Acceptance Criteria**:
  - The system shall ส่ง approval ตามลำดับใน `requiresApproval` ของ template: Department approval → `managerId` ของ requestor, Head approval → `managerId` ของผู้อนุมัติขั้น Department `[ASM]`
  - WHEN approver อนุมัติ, THEN ระบบ shall ตั้ง `done = true`, `decision = approved`, `decidedAt` และเปลี่ยนสถานะเป็น Department Accepted หรือ Head Approved; ถ้าเป็นขั้นสุดท้ายให้เปลี่ยนเป็น Request In-Progress
  - WHEN approver ปฏิเสธ, IF ไม่มี comment, THEN ระบบ shall แสดง "กรุณาระบุเหตุผล", ELSE ตั้ง `decision = rejected` และเปลี่ยนสถานะเป็น Department Declined หรือ Head Rejected
  - IF ขั้นก่อนหน้ายังไม่อนุมัติ, THEN ระบบ shall ไม่ให้ขั้นถัดไปตัดสิน
  - WHEN อนุมัติขั้นสุดท้ายในหมวด `slaStartsAfterApproval = true`, THEN ระบบ shall เริ่มนับ SLA ตาม US-006
- **Dependencies**: US-030, US-006, US-024
- **Source**: FR-071, FR-072 (Should), BR-03, D1-6

---

## I. AI Assistant

### US-032: แผง AI Assistant ช่วยเปิด ticket
- **As a** requestor **I want** พิมพ์ปัญหาเป็นภาษาไทยแล้วได้ฟอร์มที่กรอกให้ **so that** ไม่ต้องรู้ว่าต้องเลือกบริการไหน
- **Priority**: Low
- **Acceptance Criteria**:
  - The system shall มีปุ่มเปิดแผง AI Assistant ทุกหน้าที่ล็อกอินแล้ว
  - WHEN ผู้ใช้ส่งคำบรรยายปัญหา, THEN ระบบ shall เรียก AI ผ่าน interface กลาง แล้วเปิดฟอร์ม Add Support Call พร้อมค่าที่เสนอ (call type, template, urgency, impact, summary, notes)
  - The system shall ไม่สร้าง ticket จาก AI โดยตรง — ผู้ใช้ต้องตรวจและกด OK เอง
- **Dependencies**: US-018
- **Source**: FR-110, FR-111 (TBD), D1-12

### US-033: AI navigate
- **As a** ผู้ใช้ **I want** บอกสิ่งที่ต้องการแล้ว AI พาไปหน้านั้น **so that** ไม่ต้องหาเมนูเอง
- **Priority**: Low
- **Acceptance Criteria**:
  - WHEN ผู้ใช้พิมพ์เจตนา (เช่น "ดูเรื่องที่ค้างอยู่"), THEN ระบบ shall พาไปหน้าที่ตรงพร้อม filter ที่เกี่ยวข้อง
  - IF หน้าปลายทางเกินสิทธิ์ของ role, THEN ระบบ shall ไม่พาไปและแจ้ง "คุณไม่มีสิทธิ์เข้าหน้านี้"
- **Dependencies**: US-032, US-003
- **Source**: FR-112 (TBD)

### US-034: AI fallback และการป้องกันข้อมูล
- **As a** ผู้ใช้ **I want** ใช้งานต่อได้แม้ AI ล่ม **so that** งานไม่สะดุด
- **Priority**: Low
- **Acceptance Criteria**:
  - IF AI ไม่ตอบภายใน 10 วินาทีหรือ error, THEN ระบบ shall แจ้ง "AI ไม่พร้อมใช้งาน ใช้การค้นหาแบบคำสำคัญแทน" และใช้ `ai.fallbackKeywordToServiceDefinition` / `ai.fallbackIntentToRoute`
  - WHILE ยังไม่มี Azure contract, THEN ระบบ shall ใช้ rule-based mock เป็น implementation ของ interface
  - The system shall ส่งไป AI เฉพาะข้อความที่ผู้ใช้พิมพ์ + ชื่อหน้าปัจจุบัน ไม่ส่งชื่อ อีเมล เบอร์โทร
  - The system shall เก็บ key/endpoint ของ Azure ใน `.env.local` ฝั่ง dev proxy เท่านั้น
- **Dependencies**: US-032
- **Source**: FR-113, FR-114 (TBD), NFR-020, D1-12

---

## J. Cross-cutting (Accessibility, Security, Privacy)

> ไม่แยกเป็น story — ทุก story ต้องผ่านเงื่อนไขนี้ และใช้เป็น Definition of Done
- The system shall ผ่าน WCAG 2.2 AA: focus-visible, label/ARIA, tap target ≥ 44px, contrast ผ่าน, status = icon + label (NFR-012)
- The system shall sanitize rich text ก่อน render ทุกจุด (NFR-020)
- The system shall ไม่เขียน PII ลง console/log (NFR-021)
- The system shall โหลดหน้าแรกภายใน 2 วินาทีบน localhost (NFR-001)
- The system shall แสดง UI ภาษาไทย คงชื่อ call type / status เป็นอังกฤษ (NFR-010, D1-15)
- The system shall responsive แบบ desktop-first รองรับ tablet/mobile (NFR-011)

---

## Story Summary

| ID | Title | Area | Priority | Dependencies |
|---|---|---|---|---|
| US-001 | โหลดข้อมูลและ persist | Data & Session | High | — |
| US-002 | ล็อกอิน mock / ออกจากระบบ | Data & Session | High | US-001 |
| US-003 | เมนู + default-deny | Data & Session | High | US-002 |
| US-004 | ขอบเขตการมองเห็น | Data & Session | High | US-003 |
| US-005 | คำนวณ priority | Rules Engine | High | US-001 |
| US-006 | due date / Time Left | Rules Engine | High | US-005 |
| US-007 | State machine | Rules Engine | High | US-001 |
| US-008 | เลข ticket | Rules Engine | High | US-001 |
| US-009 | Calls Logged For You | My Space | High | US-004, US-006 |
| US-010 | Opened On Behalf | My Space | Medium | US-009 |
| US-011 | เลือกคอลัมน์ | My Space | Medium | US-009 |
| US-012 | หมวดบริการลำดับชั้น | Catalog | High | US-003 |
| US-013 | บริการ → ฟอร์มจาก template | Catalog | High | US-012, US-015 |
| US-014 | Myself / Somebody else | Catalog | Medium | US-013 |
| US-015 | Contact Information | Add Call | High | US-003 |
| US-016 | Priority and Template | Add Call | High | US-005, US-015 |
| US-017 | CI Information | Add Call | Medium | US-015 |
| US-018 | Details + validation + บันทึก | Add Call | High | US-006, US-007, US-008, US-016 |
| US-019 | แนบไฟล์ (metadata) | Add Call | Medium | US-018 |
| US-020 | ค้นหาพื้นฐาน | Search | High | US-004 |
| US-021 | ค้นหาขั้นสูง | Search | Medium | US-020 |
| US-022 | ตารางผล | Search | High | US-020, US-011 |
| US-023 | ดูรายละเอียด | Detail | High | US-004, US-006, US-018 |
| US-024 | Timeline / audit | Detail | High | US-023 |
| US-025 | เพิ่มความเห็น | Detail | High | US-024, US-019 |
| US-026 | assign / เปลี่ยนสถานะ | Detail | High | US-007, US-024 |
| US-027 | Resolve + closure category | Detail | Medium | US-026 |
| US-028 | ยกเลิก / re-open / auto-close | Detail | Medium | US-026 |
| US-029 | Activities ของเรื่อง | Detail | Medium | US-023 |
| US-030 | รายการรออนุมัติ | Approvals | Medium | US-004 |
| US-031 | อนุมัติ/ปฏิเสธ 2 ขั้น | Approvals | Medium | US-030, US-006, US-024 |
| US-032 | AI ช่วยเปิด ticket | AI Assistant | Low | US-018 |
| US-033 | AI navigate | AI Assistant | Low | US-032, US-003 |
| US-034 | AI fallback + privacy | AI Assistant | Low | US-032 |

> นับ priority: High 20 = US-001–009, 012, 013, 015, 016, 018, 020, 022–026 · Medium 11 = US-010, 011, 014, 017, 019, 021, 027–031 · Low 3 = US-032–034 · รวม 34

## Story × Persona Matrix

| Story | requestor | approver | agent | admin |
|---|---|---|---|---|
| US-001–003 | Primary | Primary | Primary | Primary |
| US-004 | Primary | Primary | Primary | Primary |
| US-005–008 | Secondary | — | Primary | — |
| US-009–010 | Primary | Secondary | Secondary | — |
| US-011 | Secondary | — | Primary | Secondary |
| US-012–019 | Primary | Secondary | Secondary | — |
| US-020–022 | Secondary | — | Primary | Primary |
| US-023 | Primary | Secondary | Primary | Primary |
| US-024 | Secondary | — | Secondary | Primary |
| US-025 | Primary | — | Primary | — |
| US-026–027 | — | — | Primary | — |
| US-028 | Primary | — | — | — |
| US-029 | — | — | Primary | — |
| US-030–031 | — | Primary | — | — |
| US-032–034 | Primary | Secondary | Secondary | Secondary |

## Non-Functional Notes
- **Accessibility / Security / Privacy / Performance / ภาษา / Responsive**: ดูหมวด J (ใช้เป็น Definition of Done ทุก story)
- **Design system**: ต้องสร้าง `.claude/rules/design-system.md` + token `.css` ช่วง design ตาม `design-system-policies.md` ก่อน implement UI
- **สมมติฐานที่ยังต้องยืนยัน**: การหาผู้อนุมัติจาก `managerId` (US-031), สิทธิ์ละเอียดของ agent/admin, AI contract

## Out of Scope (รอบนี้)
- Nice: FR-013 auto refresh, FR-041 บันทึกร่าง, FR-056 Read flag, FR-067 Survey, FR-073 ส่งอนุมัติใหม่, FR-074 CAB, FR-080–082 Scheduled Activities (หน้า P8), FR-090–091 Knowledge Base (หน้า P9), Problem management workflow
- หน้า admin สำหรับ catalog / template / ผู้ใช้ (D1-11)
- AD/SSO จริง, อีเมลจริง, Asset/CMDB, เก็บเนื้อไฟล์แนบ

## External References

| Source | Stories Derived | What Was Used |
|---|---|---|
| `initial-requirements/project-requirements/Requirements.md` | US-001–034 | FR/NFR/BR/EX, entities, state machine, validation |
| `initial-requirements/project-requirements/database.json` | US-004–008, US-028, US-031, US-034 | `priorityMatrix`, `rfcPriorityMatrix`, `slaHoursByPriority`, `slaStartsAfterApproval`, `statusByCallType`, `closedStatuses`, `rolePermissions`, `runningNumber`, `ai` fallback rules |
| `.aidlc/workflow/itsm-support-desk/decisions-requirements.md` | ทั้งหมด | D1-1 ถึง D1-15 |

## Add-on

- **2026-11-13 (impeccable critique My Space, ผู้ใช้เลือก "ทำทั้งหมด")**
  - US-006: `Resolved` หยุดนับ SLA — เดิมเรื่องที่แก้แล้วแต่ยังรอปิด 7 วันขึ้น "เลยกำหนด" สีแดง ทั้งที่ IT ทำเสร็จแล้ว · ไม่เพิ่ม `Resolved` เข้า `closedStatuses` เพราะสถานะนั้นยัง Close / Re-open / ค้น "Open" ได้ — แก้เฉพาะการคำนวณ Time Left
  - US-009: default columns 8 → 5 (FR-014 `[PROP]`) เพราะที่จอ 1280 ตาราง 8 คอลัมน์กว้าง 1215px ในการ์ด ~830px ทำให้ Time Left ต้องเลื่อนหา · ผู้ใช้ที่เคยเลือกคอลัมน์ไว้ยังได้ค่าเดิม (localStorage) · ค่า default เดียวกันใช้กับ Search
  - US-009: เรียงตามความเร่งด่วน + แถบสรุป + ลิงก์งานของ approver / agent (My Space ของสองกลุ่มนี้เดิมว่าง 2 การ์ด)

