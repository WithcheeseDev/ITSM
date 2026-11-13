---
inclusion: manual
---

# SRS Document Style

ข้อกำหนดรูปแบบเอกสารสำหรับ SRS ใช้คู่กับโครงเอกสารใน #[[file:.kiro/steering/srs-template.md]]
(โครงหัวข้อดูจาก srs-template.md, รูปแบบตัวอักษรดูจากไฟล์นี้)

## Font Variables

| Variable | Value |
|----------|-------|
| thaiFontName | TH Sarabun New |
| thaiFontSize | 16 |
| engFontName | Arial |
| engFontSize | 12 |

> thaiFontSize / engFontName / engFontSize เลือกให้โดย Kiro: TH Sarabun New ตัวเล็กกว่าฟอนต์ทั่วไป จึงใช้ 16pt ส่วน Arial 12pt ให้ขนาดดูใกล้กัน ปรับได้ที่ตารางนี้ที่เดียว

## Typography

| Element | Font | Size | Style |
|---------|------|------|-------|
| Heading 1 | [thaiFontName] | 18pt | Bold |
| Heading 2 | [thaiFontName] | 16pt | Bold |
| Heading 3 | [thaiFontName] | 14pt | Bold |
| เนื้อหาไทย | [thaiFontName] | [thaiFontSize]pt | Normal |
| เนื้อหาอังกฤษ | [engFontName] | [engFontSize]pt | Normal |
| ตาราง Header | mixed | 12pt | Bold |
| ตาราง Body | mixed | 11pt | Normal |
| Header/Footer | [engFontName] | 9pt | Normal |

## Rules

- แทนค่า `[variable]` ด้วยค่าจากตาราง Font Variables ทุกครั้งที่สร้างเอกสาร
- "mixed" = ข้อความไทยใช้ thaiFontName, ข้อความอังกฤษและตัวเลขใช้ engFontName
- หัวข้อใช้เลขลำดับตาม srs-template.md (เช่น 7.3 Functional Requirements)
- ตั้งค่า font ทั้ง ascii และ cs (complex script) เมื่อสร้างไฟล์ DOCX เพื่อให้ภาษาไทยแสดงถูกต้อง
