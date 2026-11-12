# Design System — ITSM Support Desk

> การตัดสินใจ + เหตุผล + token map + page blueprint ของโครงการ · ค่าจริงอยู่ที่ `src/styles/tokens.css` (runtime source of truth) — **แก้/เพิ่ม token ต้องแก้ทั้งสองไฟล์พร้อมกัน** · อยู่ใต้กรอบ `workshop-policies/design-system-policies.md`
>
> ที่มา: D3-5, D3-15, D3-16 (`.aidlc/workflow/itsm-support-desk/decisions-design.md`, "use recommendations" 2026-11-11) · ค่าที่ไม่อยู่ใน D3 = **ค่าที่ระบบแนะนำ** (traceable) แก้ได้ภายหลัง

## 1. หลักคิด
- ผู้ใช้หลักทำงานบน PC ดูตารางและฟอร์มทั้งวัน → อ่านง่าย ความหนาแน่นพอดี ลำดับชั้นชัด (สถานะ, Time Left, ปุ่ม action เด่นสุด)
- คาแรกเตอร์: ระบบงานภายในที่น่าเชื่อถือแต่ไม่แข็ง — indigo-blue เป็นแกน, teal เป็นจุดเน้นรอง, พื้น neutral อุ่น (ไม่ใช่เทาเย็นแบบ template)
- ห้ามลอกระบบเดิม (Requirements §1.2) · ห้ามอิโมจิ · light mode เท่านั้น

## 2. Decisions

| หัวข้อ | Decision | เหตุผล | ที่มา |
|---|---|---|---|
| Primary | Indigo `#3B4CCA` (hover `#2F3DA8`) | ตัวอักษรขาวบนปุ่ม 6.83:1 · ต่างจากฟ้ามาตรฐานของ template | D3-15 |
| Accent | Teal `#0F7C74` | ใช้กับ highlight รอง/ลิงก์ AI · ขาวบน teal 5.05:1 | D3-15 |
| Neutral | Warm neutral `#F7F5F2` (page) → `#1C1A18` (text) | ลดความแข็งของตาราง · text บน page 15.9:1 | D3-15 |
| Semantic | success `#1E7B45` · warning `#B26F00` (icon) / `#8A4F00` (text) · danger `#C4302B` · info `#1F6FB2` | ทุกคู่ text/พื้นอ่อน ≥ 6:1 | แนะนำ |
| Font | IBM Plex Sans Thai + IBM Plex Sans (OFL) ผ่าน @fontsource self-host | ไทย/อังกฤษชุดเดียวกัน ตัวเลขในตารางชัด · ไม่โหลด CDN | D3-16 |
| Icon | Lucide (ISC) ผ่าน `lucide-react` · stroke 1.75 | `database.json` ใช้ชื่อ Lucide อยู่แล้ว | data |
| Component | shadcn/ui (Radix) + Tailwind v4 อ่าน token ผ่าน `@theme inline` | a11y ของ dialog/select/popover มาให้ | D3-5 |
| Mode | Light เท่านั้น | HARD RULE #7 | policy |

### Contrast ที่ตรวจแล้ว (WCAG 2.2 AA)
| คู่ | Ratio | ใช้กับ |
|---|---|---|
| foreground / background | 15.94 | body text |
| muted-foreground / white | 7.24 | helper, meta |
| primary-foreground / primary | 6.83 | ปุ่มหลัก |
| primary / white | 6.83 | ลิงก์, focus ring |
| placeholder / white | 4.81 | placeholder |
| input border / white | 3.65 | ขอบ input (UI ≥ 3:1) |
| warning icon / white | 4.06 | icon เท่านั้น ไม่ใช่ข้อความ |
| status fg / status bg (ทุกกลุ่ม) | ≥ 6.0 | StatusBadge |
> `--border` (`#E2DED7`) เป็นเส้นตกแต่งเท่านั้น — ห้ามใช้เป็นขอบ form control

## 3. Token Map (สรุป — ค่าเต็มใน `tokens.css`)

| Layer | Prefix | ตัวอย่าง |
|---|---|---|
| Primitive | `--palette-*`, `--fs-*`, `--fw-*`, `--space-*`, `--radius-*`, `--shadow-*`, `--dur-*`, `--ease-*` | `--palette-indigo-600` |
| Semantic | ชื่อตาม shadcn/ui: `--background`, `--foreground`, `--card`, `--primary(-hover/-active/-foreground/-soft)`, `--accent(-soft)`, `--muted(-foreground)`, `--border`, `--input`, `--ring`, `--success/warning/destructive/info(-soft/-soft-foreground)`, layout `--container-max`, `--form-max`, `--gutter`, `--sidebar-width`, `--header-height`, `--section-gap`, `--tap-target` | `--primary` |
| Component | `--button-*`, `--input-*`, `--card-*`, `--table-*`, `--badge-*`, `--sidebar-*`, `--status-*`, `--icon-*`, `--logo-*` | `--status-waiting-bg` |

**Tailwind v4 wiring** (`src/styles/globals.css`):
```css
@import "tailwindcss";
@import "./tokens.css";
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  /* …ทุก semantic color… */
  --font-sans: var(--font-sans);
  --radius-lg: var(--radius-lg);
}
```
component ใช้ utility (`bg-primary`, `text-muted-foreground`) หรือ `var(--token)` — **ห้าม hex/rgb ใน component** (ตรวจด้วย `node .claude/skills/design-system/scripts/validate-tokens.cjs --dir src/`)

### Typography scale
| Token | px | ใช้กับ |
|---|---|---|
| `--fs-2xl` / `--fs-xl` | 28 / 22 | page title (≥ md / mobile) · semibold |
| `--fs-lg` | 18 | section title · semibold |
| `--fs-base` | 16 | body, input (กัน iOS zoom) |
| `--fs-sm` | 14 | ตาราง, helper, badge |
| `--fs-xs` | 12 | meta เล็ก (timestamp ใน timeline) เท่านั้น |
- line-height body 1.6 (สระ/วรรณยุกต์ไทย) · title 1.3 · ตัวเลขในตาราง `font-variant-numeric: tabular-nums`

### Spacing / Radius / Shadow / Motion
- Spacing ฐาน 4px · ภายใน card 20px · ระหว่าง section 24px · ระหว่าง field 16px
- Radius: control 8px · card 12px · badge/chip pill
- Shadow: card `--shadow-sm` → hover `--shadow-md` · dialog/popover `--shadow-lg` · จัดกลุ่มด้วย spacing ก่อนเส้น
- Motion: hover/press 120ms · panel/dialog 200ms · drawer 320ms · `prefers-reduced-motion` → 0ms

## 4. Status / Priority / Time Left (ห้ามสื่อด้วยสีอย่างเดียว)

| กลุ่ม | สถานะ | Icon (Lucide) | Token |
|---|---|---|---|
| new | New, Request Submitted, Draft, Request For Change | `CircleDot` | `--status-new-*` |
| progress | Assigned, In Process, Re-Opened, Request In-Progress, Under Review, Scheduled for Review, Implementation, Department Accepted, Head Approved, Ready for CAB, Root Cause Identify, Known Error, Resolution Identify, Monitoring, Delivered | `Loader` (static) | `--status-progress-*` |
| waiting | Pending, Waiting For Approve, Waiting for return | `Clock` | `--status-waiting-*` |
| resolved | Resolved, Request Completed, Completed | `CircleCheck` | `--status-resolved-*` |
| closed | Closed, Cancelled, Request Cancelled | `CircleSlash` | `--status-closed-*` |
| rejected | Department Declined, Head Rejected, Failed | `CircleX` | `--status-rejected-*` |

- **Priority**: P1 `ChevronsUp` + danger · P2 `ChevronUp` + warning · P3 `Minus` + info · P4 `ChevronDown` + muted — แสดง label "P1" เสมอ
- **Time Left**: ปกติ = ข้อความ · เหลือ < 25% ของ SLA = `AlertTriangle` + warning-soft · เลยกำหนด = `AlertOctagon` + destructive-soft + label "เลยกำหนด" · รออนุมัติ = `Hourglass` + "รออนุมัติ"

## 5. Logo & Icon Sizing
| บริบท | ขนาด | Token |
|---|---|---|
| โลโก้ product (header, ≥ lg / < lg) | สูง 28 / 24px, `object-fit: contain` | `--logo-height(-mobile)` |
| ไอคอนใน text / ตาราง | 16px | `--icon-sm` |
| ไอคอนปุ่ม / sidebar | 20px | `--icon-md` |
| ไอคอนการ์ดหมวด (mobile / ≥ md) | 24 / 32px | `--icon-lg` / `--icon-xl` |
| favicon | 32px + SVG | — |
- โลโก้ = wordmark "ITSM Support Desk" ของ product เอง (SVG, สี `--primary`) — ไม่มีโลโก้บุคคลที่สาม
- ปุ่มที่มีแต่ icon ต้องมี `aria-label` และพื้นที่กด ≥ 44px

## 6. Components (สเปกย่อ)
| Component | Default | Hover | Active | Focus | Disabled |
|---|---|---|---|---|---|
| Button primary | `--primary` / ขาว | `--primary-hover` | `--primary-active` | ring 2px `--ring` offset 2px | `--muted` / `--muted-foreground` + เหตุผลแสดงเป็นข้อความข้างปุ่ม (ไม่ใช่ tooltip) |
| Button secondary | `--secondary` | `--surface-sunken` เข้มขึ้น | — | ring | เหมือนบน |
| Button ghost | โปร่ง | `--muted` | — | ring | เหมือนบน |
| Button destructive | `--destructive` | `--palette-red-700` | — | ring | เหมือนบน |
| Input / Select | ขาว, ขอบ `--input` | ขอบ `--muted-foreground` | — | ring + ขอบ `--primary` | `--muted` |
| Input error | ขอบ `--destructive` + ข้อความใต้ field (`aria-describedby`) + icon `CircleAlert` | | | | |
| Card | `--card`, radius 12, `--shadow-sm` | `--shadow-md` (เฉพาะการ์ดที่คลิกได้) | — | ring | — |
| Table row (คลิกได้) | ขาว, สูง 44px | `--table-row-hover` | — | ring ที่ row | — |
| Filter chip | ขอบ `--input` | `--muted` | เลือกแล้ว: `--primary-soft` + icon `Check` | ring | — |

- ปุ่ม action วางข้างส่วนที่กระทำ (แถวเดียวกัน ชิดขวา) ไม่รวมไว้มุมเดียว (UI default ของ user)
- Loading: skeleton โทน `--muted` (ไม่ใช้ spinner เปล่า) · Empty state: icon + ข้อความ + ปุ่ม action หลัก

## 7. Page Layout Blueprint
**Shell (ทุกหน้า หลัง login)**
```
┌ Header 56px: [☰ < lg] Logo ··········· [AI Assistant] [ชื่อผู้ใช้ ▾] ┐
├ Sidebar 240px (≥ lg, drawer < lg) ┬ Main: container ≤ 1280, padding 16/32 ┤
│ My Space                          │  Page title + action ขวา               │
│ Service Catalog                   │  [section card] gap 24                 │
│ แจ้งเรื่องใหม่                      │  [section card]                        │
│ ค้นหาเรื่อง                         │                                        │
│ อนุมัติ (approver)                  │                                        │
└───────────────────────────────────┴────────────────────────────────────────┘
```
sidebar แบน ทุกหน้าเป็น item ระดับบนพร้อม icon · active = `--sidebar-item-active-*` + `aria-current="page"`

| Page | Blueprint |
|---|---|
| Login | การ์ดกลางจอ กว้าง ≤ 480: โลโก้ + "เลือกผู้ใช้ตัวอย่าง" + รายการผู้ใช้ (ชื่อ, role badge) แต่ละแถวเป็นปุ่ม 44px + หมายเหตุ "ข้อมูลสมมติ" |
| My Space | title "Welcome Back : {ชื่อ}" + ปุ่ม "แจ้งเรื่องใหม่" ขวา → การ์ด "Calls Logged For You (n)" + ปุ่มเลือกคอลัมน์ในหัวการ์ด → การ์ด "Calls You Opened On Behalf (n)" |
| Service Catalog | breadcrumb → grid การ์ดหมวด (1 / 2 / 3 / 4 คอลัมน์ ตาม breakpoint) icon + ชื่อ + คำอธิบาย + slaNote → ระดับบริการ: ตาราง (mobile = list การ์ด) + ปุ่ม "Request this service" ท้ายแถว |
| Add Support Call | คอลัมน์ฟอร์มกว้าง ≤ 880 · section การ์ดตามลำดับ: Requested for → Contact → Priority & Template (priority preview เป็น badge ข้าง Impact) → CI → Details → Attachments · แถบปุ่ม OK / Cancel ล่างฟอร์ม (sticky บน mobile) |
| Search | การ์ดเงื่อนไข: แถว Default Criteria (grid 1 / 2 / 3) + call type & Open/Closed เป็น chip + "Advance Criteria" พับได้ + Search / Clear ขวา → การ์ดผล (จำนวน + เลือกคอลัมน์) → ตาราง scroll แนวนอนภายในการ์ด |
| Call Detail | header: เลข + summary + StatusBadge + Priority + Time Left · action bar ขวาของ header (ตามสิทธิ์) · ≥ lg: 2 คอลัมน์ (ซ้าย 2/3: Details, Notes, Timeline + ช่องความเห็น · ขวา 1/3: ข้อมูลติดต่อ, คิว/assign, Approval steps, Activities) · < lg: เรียงเดี่ยว header → action → details → approval → timeline |
| Approvals | การ์ดเงื่อนไข (My Approvals, Done = No เป็น default) → list การ์ดคำขอ: เลข, summary, ผู้แจ้ง, ขั้น, ปุ่ม อนุมัติ / ปฏิเสธ ในแถวเดียวกัน → ปฏิเสธเปิด dialog บังคับเหตุผล |
| AI Assistant | ปุ่มใน header → side sheet ขวา กว้าง 400 (mobile เต็มจอ) · ข้อความ · ผลลัพธ์เป็นการ์ด "เปิดฟอร์มที่กรอกไว้" / "ไปที่หน้า …" · แถบแจ้ง fallback โทน warning-soft |

## 8. Responsive
| Breakpoint | Width | พฤติกรรม |
|---|---|---|
| base | < 640 | 1 คอลัมน์, sidebar = drawer, ตาราง My Space/Search = list การ์ด (Number, Summary, Status, Time Left), gutter 16 |
| sm | ≥ 640 | grid การ์ดหมวด 2 คอลัมน์ |
| md | ≥ 768 | ตารางแสดงเป็น table (scroll แนวนอนในการ์ด), title 28px |
| lg | ≥ 1024 | sidebar ถาวร, Detail 2 คอลัมน์, gutter 32 |
| xl | ≥ 1280 | container เต็ม 1280, grid หมวด 4 คอลัมน์ |
- เขียน CSS แบบ mobile-first (min-width) แต่ออกแบบ/ทดสอบ desktop เป็นหลัก (NFR-011)
- ไม่มี horizontal scroll ระดับหน้า · เคารพ `env(safe-area-inset-*)` · ทดสอบ 375 / 768 / 1280 ก่อนส่งมอบ

## 9. Add-on
- **2026-11-12 (Task 1.3)** — `@theme inline` ใน `globals.css` **ไม่** map `--font-sans` / `--radius-*` / `--shadow-*` (ตัวอย่าง §3 จะอ้างตัวเองวน) เพราะ `tokens.css` ประกาศชื่อเดียวกันแบบ unlayered ทับ theme layer ของ Tailwind อยู่แล้ว · `@custom-variant dark` ผูกกับ class `.dark` ที่ไม่ใช้ → `dark:` ใน shadcn ไม่ทำงาน (light only) · shadcn ใช้ `accent` เป็นสี hover แต่ของเรา accent = teal → แก้ hover เป็น `muted` ทุก component
- **2026-11-12 (Task 2.8)** — เพิ่ม token layout `--form-max: 55rem` (880px) สำหรับคอลัมน์ฟอร์ม Add Support Call ตาม §7 (เดิมระบุ "กว้าง ≤ 880" แต่ไม่มี token)
