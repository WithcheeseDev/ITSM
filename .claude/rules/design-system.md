# Design System — ITSM Support Desk

> การตัดสินใจ + เหตุผล + token map + page blueprint ของโครงการ · ค่าจริงอยู่ที่ `src/styles/tokens.css` (runtime source of truth) — **แก้/เพิ่ม token ต้องแก้ทั้งสองไฟล์พร้อมกัน** · อยู่ใต้กรอบ `workshop-policies/design-system-policies.md`
>
> ที่มา: D3-5, D3-15, D3-16 (`.aidlc/workflow/itsm-support-desk/decisions-design.md`, "use recommendations" 2026-11-11) · ค่าที่ไม่อยู่ใน D3 = **ค่าที่ระบบแนะนำ** (traceable) แก้ได้ภายหลัง

## 1. หลักคิด
- ผู้ใช้หลักทำงานบน PC ดูตารางและฟอร์มทั้งวัน → อ่านง่าย ความหนาแน่นพอดี ลำดับชั้นชัด (สถานะ, Time Left, ปุ่ม action เด่นสุด)
- คาแรกเตอร์: ระบบงานภายในโทนแดง-ขาว — crimson เป็นแกน, charcoal เป็นจุดเน้นรอง, พื้นขาวอมเทา (D3-15 rev 2026-11-13 · ไม่ใช้แบรนด์/hex ขององค์กรใด)
- สีแดงเต็มพื้นมีแค่ปุ่มหลัก — destructive ใช้ปุ่มขอบแดง + icon `CircleX` เพื่อไม่ให้สับสนกับ primary
- ห้ามลอกระบบเดิม (Requirements §1.2) · ห้ามอิโมจิ · light mode เท่านั้น

## 2. Decisions

| หัวข้อ | Decision | เหตุผล | ที่มา |
|---|---|---|---|
| Primary | Crimson `#B0142A` (hover `#8E1022`, active `#6F0C1A`, soft `#FDEDEF`) | ตัวอักษรขาวบนปุ่ม 7.05:1 · โทนแดง-ขาวตามที่ผู้ใช้ขอ · hex เลือกเอง ไม่ใช่สีแบรนด์ขององค์กรใด | D3-15 rev |
| Accent | Charcoal `#2E3440` (soft `#EEF0F3`) | highlight รอง/ลิงก์ AI · ขาวบน charcoal 12.49:1 · ชุดแดง-ขาว-เทาเข้ม | D3-15 rev |
| Neutral | Cool neutral `#FAFAFA` (page) → `#18181B` (text) | พื้นขาวอมเทาให้แดงเด่น · text บน page 16.97:1 | D3-15 rev |
| Semantic | success `#1E7B45` · warning `#B26F00` (icon) / `#8A4F00` (text) · danger `#C4302B` · info `#1F6FB2` | ทุกคู่ text/พื้นอ่อน ≥ 6:1 | แนะนำ |
| Font | IBM Plex Sans Thai + IBM Plex Sans (OFL) ผ่าน @fontsource self-host | ไทย/อังกฤษชุดเดียวกัน ตัวเลขในตารางชัด · ไม่โหลด CDN | D3-16 |
| Icon | Lucide (ISC) ผ่าน `lucide-react` · stroke 1.75 | `database.json` ใช้ชื่อ Lucide อยู่แล้ว | data |
| Component | shadcn/ui (Radix) + Tailwind v4 อ่าน token ผ่าน `@theme inline` | a11y ของ dialog/select/popover มาให้ | D3-5 |
| Mode | Light เท่านั้น | HARD RULE #7 | policy |

### Contrast ที่ตรวจแล้ว (WCAG 2.2 AA)
| คู่ | Ratio | ใช้กับ |
|---|---|---|
| foreground / background | 16.97 | body text |
| muted-foreground / white | 7.38 | helper, meta |
| primary-foreground / primary | 7.05 | ปุ่มหลัก |
| primary / white | 7.05 | ลิงก์, focus ring |
| primary-soft-foreground / primary-soft | 8.25 | sidebar active, status progress |
| accent-foreground / accent | 12.49 | accent |
| destructive / white | 5.52 | ข้อความ + ขอบปุ่ม destructive |
| placeholder / white | 5.04 | placeholder |
| input border / white | 3.55 | ขอบ input (UI ≥ 3:1) |
| warning icon / white | 4.06 | icon เท่านั้น ไม่ใช่ข้อความ |
| status fg / status bg (ทุกกลุ่ม) | ≥ 6.0 | StatusBadge |
> `--border` (`#E4E4E8`) เป็นเส้นตกแต่งเท่านั้น — ห้ามใช้เป็นขอบ form control

## 3. Token Map (สรุป — ค่าเต็มใน `tokens.css`)

| Layer | Prefix | ตัวอย่าง |
|---|---|---|
| Primitive | `--palette-*`, `--fs-*`, `--fw-*`, `--space-*`, `--radius-*`, `--shadow-*`, `--dur-*`, `--ease-*` | `--palette-indigo-600` |
| Semantic | ชื่อตาม shadcn/ui: `--background`, `--foreground`, `--card`, `--primary(-hover/-active/-foreground/-soft)`, `--accent(-soft)`, `--muted(-foreground)`, `--border`, `--input`, `--ring`, `--success/warning/destructive/info(-soft/-soft-foreground)`, layout `--container-max`, `--form-max`, `--gutter`, `--sidebar-width`, `--header-height`, `--section-gap`, `--tap-target` | `--primary` |
| Component | `--button-*`, `--input-*`, `--card-*`, `--table-*`, `--badge-*`, `--sidebar-*` (รวม `--sidebar-fg`, `--sidebar-overlay`, `--sidebar-ring`, `--sidebar-inset`, `--sidebar-radius`, `--sidebar-shadow`, `--sidebar-rail-width`), `--app-canvas`, `--content-panel-*` (bg, radius, shadow, image-wash), `--status-*`, `--icon-*`, `--logo-*` | `--status-waiting-bg` |

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
- พื้นผิวหลัง login 3 ระดับ (policy §2.2): พื้นนอก `--app-canvas` (#F1F1F3, ≥ lg เท่านั้นที่เห็น) → content panel `--content-panel-bg` (ขาว) + `--content-panel-shadow` (ขอบ 1px `--border` + shadow-md) → การ์ด `--card` (ขาว) + เส้นขอบ `--card-border` 1px ผ่าน `--card-shadow` · panel กับพื้นนอก 1.13:1 แยกด้วยขอบ + เงา · ข้อความบน panel ตรงๆ ใช้ `--foreground` / `--muted-foreground` (7.38:1 บนขาว)
- Motion: hover/press 120ms · panel/dialog 200ms · drawer 320ms · `prefers-reduced-motion` → 0ms
- Motion เด่นจุดเดียวของ shell: indicator ของ sidebar (พื้นเข้มของ active item) เลื่อนจาก item เดิมไป item ใหม่เมื่อเปลี่ยนหน้า — `transform` + `opacity`, `--dur-normal` / `--ease-standard` · ครั้งแรก (โหลดหน้า / เปิด drawer) วางทันทีไม่เลื่อน · หน้าที่ไม่อยู่ในเมนู → จางหาย · reduced-motion → กระโดดทันที
- Motion รองของ shell (เล่นพร้อม indicator ของ sidebar ไม่แย่งความเด่น): เปลี่ยนหน้าแล้วเฉพาะเนื้อหาใน `<main>` (สิ่งที่ `<Outlet />` render) เข้ามาด้วย opacity 0.6 → 1 + `translateY(8px)` → 0, `--dur-normal` / `--ease-standard` · sidebar / header / panel ไม่ขยับ · key = pathname (query string เปลี่ยน เช่น filter ของ Search ไม่เล่นซ้ำ) · เริ่มที่ 0.6 ไม่ใช่ 0 และไม่ใช้ fill-mode both/backwards เพื่อไม่ให้หน้าว่างระหว่างรอ animation เริ่ม · reduced-motion → ไม่เล่นเลย (`animation: none`)

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
| favicon | `public/favicon-32.png`, `public/icon-192.png`, `public/favicon.ico` (16 / 32 / 48) + `public/apple-touch-icon.png` 180px — รูป robot ที่ผู้ใช้ให้มา (Add-on 2026-11-13) | — |
- โลโก้ = wordmark "ITSM Support Desk" ของ product เอง (SVG, สี `--primary`) — ไม่มีโลโก้บุคคลที่สาม
- ปุ่มที่มีแต่ icon ต้องมี `aria-label` และพื้นที่กด ≥ 44px

## 6. Components (สเปกย่อ)
| Component | Default | Hover | Active | Focus | Disabled |
|---|---|---|---|---|---|
| Button primary | `--primary` / ขาว | `--primary-hover` | `--primary-active` | ring 2px `--ring` offset 2px | `--muted` / `--muted-foreground` + เหตุผลแสดงเป็นข้อความข้างปุ่ม (ไม่ใช่ tooltip) |
| Button secondary | `--secondary` | `--surface-sunken` เข้มขึ้น | — | ring | เหมือนบน |
| Button ghost | โปร่ง | `--muted` | — | ring | เหมือนบน |
| Button destructive | `--card` + ขอบ/ข้อความ `--destructive` + icon `CircleX` | `--destructive-soft` | — | ring | เหมือนบน |
| Input / Select | ขาว, ขอบ `--input` | ขอบ `--muted-foreground` | — | ring + ขอบ `--primary` | `--muted` |
| Input error | ขอบ `--destructive` + ข้อความใต้ field (`aria-describedby`) + icon `CircleAlert` | | | | |
| Card | `--card`, radius 12, `--card-shadow` (ขอบ 1px `--card-border` + `--shadow-sm`) | `--card-shadow-hover` (เฉพาะการ์ดที่คลิกได้) | — | ring | — |
| Table row (คลิกได้) | ขาว, สูง 44px | `--table-row-hover` | — | ring ที่ row | — |
| Filter chip | ขอบ `--input` | `--muted` | เลือกแล้ว: `--primary-soft` + icon `Check` | ring | — |

- ปุ่ม action วางข้างส่วนที่กระทำ (แถวเดียวกัน ชิดขวา) ไม่รวมไว้มุมเดียว (UI default ของ user)
- Loading: skeleton โทน `--muted` (ไม่ใช้ spinner เปล่า) · Empty state: icon + ข้อความ + ปุ่ม action หลัก

## 7. Page Layout Blueprint
**Shell (ทุกหน้า หลัง login)** — ≥ lg: sidebar เป็นการ์ดลอย (Add-on 2026-11-13)
```
   ╭ Sidebar 240px ─────────╮ ╭ Content panel (ขาว, shadow-md) ────────────────────╮
   │ [Banner 3:1 ภาพ ITSM]   │ │ Header 56px (พื้น panel, ไม่มีเส้น): ··· [AI] [ผู้ใช้ ▾]│
   │ ─────────               │ │ Main: container ≤ 1280, padding 16/32             │
   │ My Space                │ │  Page title + action ขวา                          │
   │ Service Catalog         │ │  [section card ขาว + ขอบ 1px] gap 24              │
   │ แจ้งเรื่องใหม่            │ │  [section card ขาว + ขอบ 1px]                     │
   │ ค้นหาเรื่อง               │ │                                                   │
   │ อนุมัติ (approver)        │ │                                                   │
   ╰─────────────────────────╯ ╰───────────────────────────────────────────────────╯
   ↑ ทั้งสองแผ่นวางบนพื้น `--app-canvas` (#F1F1F3): inset 12px · radius 12 · sticky, สูง 100dvh − 24px · sidebar shadow-lg, panel shadow-md
   sidebar ≥ lg = การ์ด 2 ใบ (banner 240×80 + เมนู flex-1) ห่างกัน 8px (`--space-2`) · แต่ละใบ radius 12 + shadow-lg
   panel เลื่อนเนื้อหาภายในตัวเอง (header ติดบนสุดของ panel) · เปลี่ยนหน้า → เลื่อนกลับบนสุด
```
< lg: header + เนื้อหาบนพื้น `--content-panel-bg` เต็มจอ (ไม่มีขอบ/มุมโค้ง) `[☰] Logo (สี brand) ··· [AI] [ผู้ใช้]` + sidebar เป็น drawer

sidebar แบน ทุกหน้าเป็น item ระดับบนพร้อม icon · active = `--sidebar-item-active-*` + `aria-current="page"`

Sidebar background: รูป `src/assets/sidebar-bg.webp` (ลายเรขาคณิตแดง ผู้ใช้ให้มา 2026-11-13) `cover` ชิดซ้ายบน + overlay `--sidebar-overlay` ทับทั้งแผ่นให้ข้อความขาวผ่าน AA · พื้นสำรองระหว่างโหลดรูป `--sidebar-bg` (crimson-800) · ภายใน `.sidebar-surface` เปลี่ยนค่า `--foreground` / `--muted-foreground` → `--sidebar-fg` (ขาว), `--muted` → `--sidebar-item-hover-bg` (ดำ 20%), `--border` → `--sidebar-border`, `--ring` → `--sidebar-ring` (ขาว) · active item = พื้นดำโปร่ง 32% (`--sidebar-item-active-bg`, เป็น indicator ชิ้นเดียวที่เลื่อนตาม item ที่ active — ดู §3 Motion) + ตัวหนา semibold · ไม่มี accent bar / เส้นขอบรอบ item · ตัวอักษรขาว · hover = ดำ 14% · ใช้ทั้ง sidebar ถาวร (≥ lg) และ drawer (< lg)

| Page | Blueprint |
|---|---|
| Login | การ์ดกลางจอ กว้าง ≤ 480: โลโก้ + "เลือกผู้ใช้ตัวอย่าง" + รายการผู้ใช้ (ชื่อ, role badge) แต่ละแถวเป็นปุ่ม 44px + หมายเหตุ "ข้อมูลสมมติ" |
| My Space | title "Welcome Back : {ชื่อ}" + ปุ่ม "แจ้งเรื่องใหม่" ขวา → แถบสรุปบรรทัดเดียว (เลยกำหนด / ใกล้ครบ / รออนุมัติ เป็นข้อความ + icon สีตาม Time Left · ลิงก์ "รออนุมัติจากคุณ n" / "คิวกลุ่มคุณ n" ตามสิทธิ์ · ไม่มีเรื่องเร่ง → "ทุกเรื่องยังอยู่ในเวลา") → แถบ "บริการยอดนิยม" (หัวข้อเล็ก + ลิงก์บริการ 6 รายการเรียงแนวนอน wrap ได้ ไม่ใช่การ์ด) → การ์ด "Calls Logged For You (n)" + ปุ่มเลือกคอลัมน์ในหัวการ์ด → การ์ด "Calls You Opened On Behalf (n)" · แถวเรียงเลยกำหนดก่อน · default 5 คอลัมน์ (Number, Summary, Status, Priority, Time Left) |
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
- **2026-11-13 (change request: โทนแดง-ขาว)** — D3-15 rev: primary indigo → crimson `#B0142A`, accent teal → charcoal `#2E3440`, neutral อุ่น → neutral เย็น (`#FAFAFA` page) · ไม่ใช้โลโก้/hex/ชื่อแบรนด์ขององค์กรใด (HARD RULE #9) · เพิ่ม primitive `--palette-crimson-*`, `--palette-charcoal-*` · `--palette-indigo-*`, `--palette-teal-*` คงชื่อไว้ (ห้ามลบชื่อ token) แต่ไม่มี semantic ใดอ้างแล้ว · ปุ่ม destructive เปลี่ยนจากแดงเต็มพื้นเป็นขอบแดง + icon `CircleX` เพราะแดง primary กับ `--destructive` ต่างกันแค่ 1.28:1 · StatusBadge: กลุ่ม progress เดิมใช้ `--primary-soft` (กลายเป็นชมพูแดง ใกล้กลุ่ม rejected) → ย้ายเป็น `--info-soft` (ฟ้า, 6.35:1) และกลุ่ม new ย้ายเป็น `--accent-soft` (charcoal, 13.66:1)
- **2026-11-13 (change request: sidebar background)** — ผู้ใช้ขอใช้ CIMB Chevron เป็นต้นแบบ → ไม่ทำ (โลโก้บุคคลที่สาม, HARD RULE #9 / policy §7) · ลองลาย chevron ออกแบบเองก่อน แล้วผู้ใช้ส่งรูปลายเรขาคณิตแดงมาแทน (ไม่ใช่โลโก้) → sidebar เป็นพื้นเข้ม: รูป `cover` + overlay `rgb(24 24 27 / 0.35)` · วัดจากรูปจริงที่ความสูง sidebar 560 / 788 / 1100px: ข้อความขาวบนรูปเปล่าต่ำสุด 2.72:1 (ไม่ผ่าน) → หลังใส่ overlay ≥ 5:1 · hover ใช้ดำ 20% (ไม่ใช้ขาว เพราะทำให้ contrast ต่ำลง) · active = พื้นขาว / crimson-700 9.34:1 · token ใหม่ `--sidebar-fg`, `--sidebar-item-hover-bg`, `--sidebar-border`, `--sidebar-overlay`, `--sidebar-ring` · `--sidebar-bg` เปลี่ยนค่าเป็น crimson-800 · `--sidebar-item-active-bg/fg` เปลี่ยนค่า
- **2026-11-13 (change request: sidebar เต็ม pane ซ้าย)** — ≥ lg: sidebar `sticky top-0 h-dvh` ตั้งแต่ขอบบนถึงขอบล่างของจอ · logo (wordmark) ย้ายจาก header ไปแถวบนสุดของ sidebar สูงเท่า header (56px) ตัวอักษรขาว (`--sidebar-fg`) · สี่เหลี่ยม crimson ของ logo กลืนกับพื้นแดง → ขอบ 1px `--sidebar-border` เฉพาะใน sidebar · header อยู่เฉพาะคอลัมน์เนื้อหา ยัง sticky · < lg ไม่เปลี่ยน
- **2026-11-13 (change request: header เข้ากับ sidebar)** — ผู้ใช้เลือก header แดงเข้มต่อจาก sidebar (กรอบตัว L) · เพิ่ม primitive `--palette-crimson-900: #4a0a11` (สีที่วัดจากรูปจริงที่ขอบขวาของ sidebar หลัง overlay) + semantic `--header-bg` · แยกการ re-point token ของ `.sidebar-surface` ออกเป็น `.on-brand` ใช้ร่วมกับ `.header-surface`
- **2026-11-13 (change request: sidebar แยกจากส่วนอื่น)** — ผู้ใช้ต้องการให้เห็นทันทีว่าเป็น sidebar → เลือก sidebar การ์ดลอย (inset `--sidebar-inset` 12px, radius `--sidebar-radius` 12px, `--sidebar-shadow` = `--shadow-lg`, `overflow: hidden` ให้มุมตัดรูป) · header กลับเป็นพื้นเดียวกับหน้า ไม่มีเส้น · logo ใน header (< lg) กลับเป็นสี brand · แทนที่ L-frame ของรายการก่อนหน้า (ยังไม่เคย commit) → ลบ `--palette-crimson-900`, `--header-bg`, `.header-surface` ออก (เพิ่มและลบใน change เดียวกันที่ยังไม่ commit)
- **2026-11-13 (impeccable shape: menu item เข้ากับ background image)** — active item เดิมเป็นพื้นขาวทึบดูเหมือนสติกเกอร์ทับรูป → brief ที่ผู้ใช้ยืนยัน: เหลี่ยมที่รับแสง (พื้นดำ 28% + ขอบซ้ายสว่างแบบขอบเหลี่ยมในรูป + เส้นขอบโปร่ง + semibold) · ขอบซ้ายใช้ inset box-shadow ไม่ใช้ `border-left` · ตัวขาวจุดที่รูปสว่างสุด: บน active 8.0:1+, hover (ดำ 14%) ≥ 6:1 · พื้นขาวโปร่ง 16% ถูกตัดเพราะได้แค่ 3.85:1 · token: `--sidebar-item-active-bg` / `-fg` เปลี่ยนค่า, เพิ่ม `--sidebar-item-active-edge`, `--sidebar-item-active-ring`, `--sidebar-item-active-shadow` · `--sidebar-item-hover-bg` 0.2 → 0.14
- **2026-11-13 (animation เปลี่ยน menu item)** — ผู้ใช้เลือกแบบเลื่อน: พื้น/ขอบสว่างของ active ย้ายจากแต่ละ item ไปเป็น indicator ชิ้นเดียวใน `Sidebar.tsx` วัดตำแหน่ง item ที่มี `aria-current="page"` แล้วเลื่อนด้วย `translateY` · ไม่เพิ่ม token (ใช้ `--dur-normal`, `--ease-standard`, `--sidebar-item-active-*`) · item เก็บแค่ตัวหนา + สีตัวอักษร
- **2026-11-13 (impeccable: แก้ accent ai slop ของ menu item)** — ผู้ใช้ชี้ว่าขอบซ้ายสว่าง + เส้นขอบโปร่งรอบ item เป็นท่า AI slop (accent bar บนการ์ดมุมโค้ง, craft floor ก็ refuse) → ลบทั้งคู่ · active แยกด้วยพื้นเข้มขึ้น 28% → 32% + semibold (hover 14%) · ลบ token `--sidebar-item-active-edge`, `-ring`, `-shadow` (เพิ่มและลบใน change ที่ยังไม่ commit)
- **2026-11-13 (impeccable critique: My Space)** — critique 27/40: Time Left หลุดจอที่ 1280 (ตาราง 1215px / การ์ด ~830px), Resolved ขึ้น "เลยกำหนด", ไม่มีลำดับความสำคัญ, My Space ของ agent/approver ว่าง → default 5 คอลัมน์, เรียงตามความเร่งด่วน, แถบสรุปใต้ title (ไม่ใช่การ์ด KPI — ข้อความบรรทัดเดียว ใช้ icon + สีชุดเดียวกับ Time Left §4), ลิงก์งานตามสิทธิ์ · Time Left ของ `Resolved` แสดงแบบ closed (สีเทา) · ไม่เพิ่ม token
- **2026-11-13 (change request: บริการของ Request a Service)** — Catalog ใช้ grid การ์ดหมวด + ตารางบริการเดิม (14 การ์ดใต้ Request a Service) · icon หมวดใหม่จาก Lucide (เพิ่มใน allow-list `src/shared/icons.ts`) · My Space เพิ่มแถบบริการยอดนิยมใต้แถบสรุป เป็นลิงก์ข้อความ + icon หมวด ไม่ใช่การ์ด (craft floor: ไม่ใช้การ์ด icon+heading ซ้ำๆ เป็นโครงหน้า) · ไม่เพิ่ม token
- **2026-11-13 (change request: container ด้านขวาของ sidebar)** — ผู้ใช้บอกว่าเนื้อหาดูลอย (พื้น #FAFAFA กับการ์ดขาวต่างกัน 1.04:1) · เลือก panel เทาคู่ sidebar: ≥ lg คอลัมน์ขวาเป็น panel inset/radius/ความสูงเท่า sidebar, พื้น `--surface-sunken` + ขอบ `--border` 1px (ไม่มีขอบจะมองไม่เห็นเพราะ #F1F1F3 กับ #FAFAFA ใกล้กัน), header อยู่ใน panel, panel scroll ในตัว · < lg พื้นเนื้อหา = สี panel ไม่มีขอบ · เปลี่ยนหน้าแล้วเลื่อนกลับบนสุด · token ใหม่ `--content-panel-bg`, `--content-panel-border`, `--content-panel-radius`
  - **อัปเดต (วันเดียวกัน)**: ผู้ใช้บอกว่า panel เทาอ่อนกลืนกับพื้นนอก (#F1F1F3 กับ #FAFAFA 1.05:1) → พื้นนอกของ shell เป็น `--app-canvas` = neutral-300 (#CFCFD6, 1.37:1 กับ panel) · panel ใช้เงา `--content-panel-shadow` (shadow-md) แทนเส้นขอบ · ลบ `--content-panel-border` (เพิ่มและลบใน change ที่ยังไม่ commit) · `--background` ไม่เปลี่ยน (หน้า login ยังใช้)
- **2026-11-13 (change request: main content สีขาว)** — ผู้ใช้ขอให้ container ของเนื้อหาเป็นขาวสว่าง · `--content-panel-bg` → `--card` (ขาว) · การ์ดขาวบน panel ขาวจะหาย → ผู้ใช้เลือกการ์ดมีเส้นขอบบาง: เพิ่ม `--card-border` (= `--border`) และ `--card-shadow` / `--card-shadow-hover` เป็น ring 1px + เงาเดิม (ใช้ box-shadow ไม่ใช้ border จึงไม่ขยับ layout และทุก component ที่อ้าง token ได้ขอบพร้อมกัน) · panel ขาวกับพื้นนอก #CFCFD6 1.55:1
- **2026-11-13 (change request: page transition)** — ผู้ใช้ขอ animation ระหว่างเปลี่ยนหน้า → ห่อ `<Outlet />` ด้วย `<div key={pathname} className="page-enter">` ใน `AppLayout.tsx` + `@keyframes page-enter` ใน `globals.css` (opacity 0.6 → 1, translateY 8px, `--dur-normal` / `--ease-standard`) · เป็น motion รองของ indicator ใน §3 · reduced-motion → `animation: none` (rule 0.01ms เดิมยังวาด frame แรกที่ 0.6) · ไม่เพิ่ม token
- **2026-11-13 (change request: favicon)** — ผู้ใช้ให้รูป robot แดง-ขาวใส่หูฟัง (ภาพประกอบ ไม่ใช่โลโก้บุคคลที่สาม, พื้นโปร่งใส) มาใช้เป็น icon ของ browser tab → ตัดเฉพาะส่วนที่มีภาพแล้ววางกลางสี่เหลี่ยมพื้นใส · `favicon.ico` 16/32/48 + `apple-touch-icon.png` 180 (พื้นขาว เพราะ iOS ทำส่วนใสเป็นดำ) ใน `public/` · เดิมสเปกเขียน "32px + SVG" แต่ไม่มีไฟล์จริง · ไม่เพิ่ม token · wordmark ใน header/sidebar ไม่เปลี่ยน
- **2026-11-13 (change request: banner ของ sidebar)** — ผู้ใช้ให้ภาพ banner แดง (robot + "ITSM / IT Service Management", ภาพของ product เอง ไม่ใช่โลโก้บุคคลที่สาม) ใส่ top section ของ sidebar → แทนแถว wordmark ใน sidebar (≥ lg) และวางบนสุดของ drawer (< lg) · `src/assets/sidebar-banner.webp` 480×160 (2x ของ 240×80) · เต็มความกว้างการ์ด ไม่มี padding, `aspect-ratio: 3 / 1`, `object-fit: cover`, เส้นคั่น `--sidebar-border` ใต้ banner · เป็นลิงก์ไป My Space ชื่อที่อ่านได้ = alt "ITSM Support Desk" (ข้อความในภาพเล็กเกินอ่านที่ 240px จึงไม่ใช่ข้อความหลัก) · focus ring วาดด้านใน (offset −2px) เพราะ sidebar ตัดมุมด้วย overflow · header < lg ยังใช้ wordmark สี brand · ไม่เพิ่ม token
  - **อัปเดต (วันเดียวกัน)**: ผู้ใช้ขอแยก banner กับเมนูเป็นคนละ container → ≥ lg `<aside>` เป็นคอลัมน์โปร่ง (ไม่มีพื้น/เงา) ข้างในมีการ์ด 2 ใบ ห่างกัน `--sidebar-inset` (12px): การ์ด banner (`shrink-0`, radius `--sidebar-radius`, `--sidebar-shadow`, `overflow: hidden`, ไม่มีเส้นคั่น) + การ์ดเมนู (`.sidebar-surface` รูปพื้นแดง, `flex: 1`, scroll ในตัว, radius/เงาเดียวกัน) · การ์ด banner ใส่ `.on-brand` ให้ focus ring เป็นขาวบนภาพแดง · ความสูงรวมยังเท่า content panel · drawer < lg คงแผ่นเดียว (banner + เส้นคั่น + เมนู) เพราะ sheet ชิดขอบจอ · ไม่เพิ่ม token
  - **อัปเดต (วันเดียวกัน)**: ผู้ใช้ขอลดช่องระหว่างการ์ด banner กับการ์ดเมนู → 12px (`--sidebar-inset`) เป็น 8px (`--space-2`) · ไม่เพิ่ม token
- **2026-11-13 (change request: พื้นนอกสว่างขึ้น)** — ผู้ใช้ขอพื้นนอก (parent ของ sidebar / content panel) ขาวสว่าง แต่ไม่กลืนกับ panel → `--app-canvas` neutral-300 (#CFCFD6) → neutral-100 (#F1F1F3) · สีต่างกันเหลือ 1.13:1 จึงให้ `--content-panel-shadow` = ขอบ 1px `--border` (#E4E4E8) + shadow-md (ขอบคือสิ่งที่แยก ไม่ใช่สี) · ไม่ใช้ neutral-50 (#FAFAFA) เพราะใกล้ขาวจนขอบเป็นตัวแยกอย่างเดียว · ไม่เพิ่ม token
- **2026-11-13 (change request: navigation rail)** — ผู้ใช้ขอให้ sidebar หุบได้ (Navigation Rail) · ผู้ใช้เลือก: หุบเหลือ icon อย่างเดียว + tooltip และปุ่มหุบ/ขยายอยู่ซ้ายสุดของ header ใน content panel · เฉพาะ ≥ lg (drawer < lg ไม่เปลี่ยน)
  - กว้าง: ขยาย `--sidebar-width` 240 · หุบ `--sidebar-rail-width` 72 (token ใหม่) · เปลี่ยนความกว้างด้วย `transition: width` `--dur-normal` / `--ease-standard` · reduced-motion → ไม่เลื่อน
  - การ์ด banner ตอนหุบ: สี่เหลี่ยม 72×72 พื้น `.sidebar-surface` + รูป robot (ชุดเดียวกับ favicon) 48px กลางการ์ด · ยังเป็นลิงก์ไป My Space ชื่อ "ITSM Support Desk"
  - เมนูตอนหุบ: icon อยู่กลาง (สูง ≥ 44px คงเดิม) · label ยังอยู่ใน DOM เป็น `sr-only` (ชื่อลิงก์ไม่หาย) · tooltip ขวา (`side="right"`) แสดง label ตอน hover/focus เฉพาะตอนหุบ · indicator active เลื่อนตามเดิม (วัดใหม่เมื่อความกว้างเปลี่ยน)
  - ปุ่ม: `Button` ghost icon ซ้ายสุดของ header แสดงเฉพาะ ≥ lg · icon `PanelLeftClose` (ตอนขยาย) / `PanelLeftOpen` (ตอนหุบ) · `aria-label` "ย่อเมนู" / "ขยายเมนู" + `aria-expanded` + `aria-controls` ชี้ `<aside>` · ปุ่ม ☰ < lg คงเดิม
  - จำสถานะใน `localStorage` key `itsm.ui.sidebarCollapsed` (อ่าน/เขียนใน try/catch, อ่านไม่ได้ = ขยาย) · ค่าเริ่มต้น = ขยาย
  - **อัปเดต (วันเดียวกัน)**: ผู้ใช้ขอย้ายปุ่มหุบ/ขยายจาก header ไปกลาง sidebar แบบ ribbon → แท็บแคปซูล 20×48 (`rounded-full`) วางคร่อมขอบขวาของ `<aside>` (ครึ่งหนึ่งยื่นเข้าช่องว่าง 12px ระหว่าง sidebar กับ panel) กึ่งกลางแนวตั้ง (`top: 50%`, `translateY(-50%)`) · พื้น `--sidebar-bg` + ขอบ 1px `--sidebar-border` + `--shadow-md` · icon `ChevronLeft` (ตอนขยาย) / `ChevronRight` (ตอนหุบ) 16px สี `--sidebar-fg` · พื้นที่กด ≥ 44×48 (ขยายด้วย pseudo-element เข้าไปทาง sidebar) · focus ring `--ring` (crimson) ตกบนพื้นนอกที่สว่าง · tooltip ขวา "ย่อเมนู" / "ขยายเมนู" · aria เดิม (`aria-label`, `aria-expanded`, `aria-controls="app-sidebar"`) · ลบปุ่มใน header · ≥ lg เท่านั้น · ไม่เพิ่ม token
- **2026-11-13 (change request: app background image)** — ผู้ใช้ให้ภาพพื้นชมพู-ขาว มีโค้งแดงด้านล่างและ chevron จางด้านขวา (ภาพของ product เอง ไม่มีโลโก้/ข้อความ) มาใช้เป็นพื้นของ app → class `.app-canvas-surface` ใน `globals.css` (แบบเดียวกับ `.sidebar-surface`): `url("../assets/app-bg.webp") center bottom / cover no-repeat, var(--app-canvas)` · ใช้ที่ root ของ shell (`AppLayout`, เห็นเฉพาะ ≥ lg รอบ sidebar / panel) และ `<main>` ของหน้า Login (การ์ดขาวอยู่กลาง) · `src/assets/app-bg.webp` กว้าง 1920 · panel ขาวยังแยกด้วยขอบ 1px + shadow (`--content-panel-shadow`) · ข้อความไม่วางบนภาพโดยตรง (อยู่บน panel / การ์ดขาวทั้งหมด) จึงไม่กระทบ contrast · `--app-canvas` คงไว้เป็นสีสำรองระหว่างโหลด · ไม่เพิ่ม token
  - **แก้ (วันเดียวกัน)**: ผู้ใช้ต้องการภาพนี้เป็นพื้นของ main content ไม่ใช่ parent → root ของ shell กลับเป็น `bg-[var(--app-canvas)]` และ Login กลับเป็น `bg-background` · เปลี่ยนชื่อ class เป็น `.content-panel-surface`: `url("../assets/app-bg.webp") center bottom / cover no-repeat, var(--content-panel-bg)` เฉพาะ ≥ lg (ใน `@media (min-width: 64rem)`; < lg panel เต็มจอ เลื่อนทั้งหน้า ภาพ cover บนหน้ายาวจะขยายเกิน จึงคงขาว) · ใส่ที่ content panel (scroll container) — `background-attachment` ค่าเริ่มต้นทำให้ภาพอยู่กับที่ขณะเนื้อหาใน panel เลื่อน · header sticky: ≥ lg พื้นขาวโปร่ง 75% (`color-mix(in srgb, var(--content-panel-bg) 75%, transparent)`) + `backdrop-blur-md` ให้เนื้อหาที่เลื่อนผ่านไม่ทับตัวหนังสือ และไม่เป็นแถบขาวทึบบนภาพ · การ์ดยังขาวทึบ · ข้อความที่วางบน panel ตรงๆ (title, แถบสรุป, หัวข้อเล็ก) อยู่ส่วนบนที่เป็นชมพูอ่อน (`--muted-foreground` ≥ 6:1) · ส่วนโค้งแดงด้านล่างไม่ควรมีข้อความวางตรงๆ — ตรวจทุกหน้า
  - **อัปเดต (วันเดียวกัน)**: ผู้ใช้บอกว่าภาพเด่นกว่าเนื้อหา → ทับภาพด้วยชั้นขาว `--content-panel-image-wash` (token ใหม่ = `--content-panel-bg` 60%) ใน `.content-panel-surface` (gradient สีเดียววางบนภาพ) ภาพเหลือความเข้มราว 40% · ปรับความจางได้จากค่า % ใน token เดียว
  - **อัปเดต (วันเดียวกัน)**: ผู้ใช้ให้รูป reference ของแท็บ ribbon → เปลี่ยนจากแคปซูลคร่อมขอบ เป็นแท็บติดด้านนอกขอบขวาของ `<aside>` (`translate-x-full`): 24×44, ซ้ายแบน มุมขวา `--radius-md`, พื้น `--primary` (hover `--primary-hover`), chevron `--primary-foreground` 20px stroke 2.5, `--shadow-sm` ไม่มีขอบ · แท็บยื่นข้ามช่อง 12px ทับขอบ panel 12px → `<aside>` ใส่ `z-10` (sticky สร้าง stacking context, panel มาทีหลังใน DOM จะบังแท็บ) · hit area 44×44 (pseudo-element ขยายเข้า sidebar) · tooltip / aria เดิม
  - **อัปเดต (วันเดียวกัน)**: ผู้ใช้ขอ rail ที่ compact ขึ้น → `--sidebar-rail-width` 72 → 56px · ตอนหุบ padding แนวนอนของเมนู `--space-3` → `--space-1` (ปุ่มเมนูกว้าง 48 ยัง ≥ 44) · การ์ด banner หุบ 56×56 + robot 40px
  - **อัปเดต (วันเดียวกัน)**: ผู้ใช้ให้ภาพแดงแบบเหลี่ยมตัด (พื้นใส) เป็นพื้นของแท็บ ribbon → ตัดเฉพาะส่วนที่มีภาพเป็น `src/assets/ribbon-tab.webp` 48×88 (2x ของ 24×44) · class `.ribbon-tab-surface` ใน `globals.css`: ภาพ `100% 100%` + `--primary` สำรองระหว่างโหลด · hover = `brightness(1.1)` แทน `--primary-hover` · chevron ขาวบนส่วนที่สว่างสุดของภาพ ≥ 4.5:1
  - **อัปเดต (วันเดียวกัน)**: ผู้ใช้ขอให้ภาพพื้น main content เต็ม container แบบไม่ตัดขอบ (ผู้ใช้เลือกยืดเต็มกรอบ แทน cover) → `.content-panel-surface` ใช้ `center / 100% 100%` เห็นภาพครบทุกด้าน สัดส่วนภาพตามสัดส่วน panel (ยืด/บีบได้) · ภาพยังอยู่กับที่ตอนเนื้อหาใน panel เลื่อน · wash 60% เดิม · ไม่เพิ่ม token
- **2026-11-13 (change request: AI Assistant เป็น FAB)** — ผู้ใช้ขอเอาปุ่ม "AI Assistant" ออกจาก header แล้วทำเป็น FAB มุมขวาล่างของจอ · ทุก breakpoint
  - ปุ่มกลม `--fab-size` 56px (token ใหม่), `position: fixed`, ห่างขอบขวา/ล่าง `--fab-offset` (= `--space-6` 24px, token ใหม่) และเคารพ `env(safe-area-inset-right/bottom)` · ≥ lg ตกอยู่ในมุมของ content panel (panel inset 12px)
  - พื้น `--accent` (charcoal) + icon `Sparkles` `--icon-md` สี `--accent-foreground` (12.49:1) · hover `--accent-hover` (charcoal-700, token ใหม่) · `--shadow-lg` · focus ring `--ring` · ไม่ใช้ crimson เพราะปุ่มหลักของหน้า ("แจ้งเรื่องใหม่") เป็น crimson อยู่แล้ว
  - icon อย่างเดียว: `aria-label="AI Assistant"`, `aria-expanded`, tooltip ซ้าย "AI Assistant" · แสดงเฉพาะผู้มีสิทธิ์ `ai:use` (เงื่อนไขเดิม) · z-index ต่ำกว่า sheet ของ AI panel (sheet เปิดแล้วบัง FAB)
  - กันเนื้อหาท้ายหน้าโดนบัง: `<main>` padding ล่าง = `--fab-size` + 2 × `--fab-offset` เมื่อแสดง FAB
  - < md หน้าฟอร์มแจ้งเรื่อง (แถบปุ่ม OK/Cancel sticky ล่าง, ติด `data-sticky-actions`): FAB ยกขึ้นเหนือแถบ (`body:has([data-sticky-actions])`)
  - **อัปเดต (วันเดียวกัน)**: ผู้ใช้ให้รูป robot แดงใส่แว่น+หูฟัง (พื้นใส ภาพของ product เอง ไม่ใช่โลโก้บุคคลที่สาม) มาเป็น icon ของ FAB แทน `Sparkles` → ตัดเฉพาะส่วนที่มีภาพ วางกลางสี่เหลี่ยมพื้นใส `src/assets/ai-fab-robot.webp` 96×96 (2x ของ 48px) · FAB เปลี่ยนพื้นจาก charcoal เป็น `--card` (ขาว) + ขอบ 1px `--border` + `--shadow-lg` เพราะ robot แดงบน charcoal มืดจนหน้าจอดำของ robot กลืน · รูป 48px `object-contain` `alt=""` (ชื่อปุ่มมาจาก `aria-label`) · hover พื้น `--muted` · ลบ `--accent-hover` (เพิ่มและลบใน change ที่ยังไม่ commit)
- **2026-11-13 (change request: header แยกเป็น card)** — ผู้ใช้ขอแยก top section (header) ออกจาก container ของ main content และให้สูงเท่าการ์ด banner ของ sidebar · ≥ lg เท่านั้น
  - คอลัมน์ขวาเป็นคอลัมน์โปร่ง (sticky, inset/ความสูงเท่า sidebar) มีการ์ด 2 ใบห่างกัน `--space-2` (8px) เหมือนฝั่ง sidebar: การ์ด header (`shrink-0`) + content panel (`flex: 1`, scroll ในตัว, ภาพพื้นเดิม)
  - การ์ด header: พื้น `--content-panel-bg` ทึบ (ไม่มี blur แล้วเพราะไม่มีเนื้อหาเลื่อนผ่าน), radius `--content-panel-radius`, `--content-panel-shadow` · สูงเท่าการ์ด banner ตามสถานะ rail: ขยาย = `--sidebar-width` / 3 (80px, banner 3:1) · หุบ = `--sidebar-rail-width` (56px) · เปลี่ยนความสูงด้วย `--dur-normal` / `--ease-standard` พร้อมความกว้างของ sidebar → ขอบล่างของ header กับ banner และขอบบนของ content panel กับการ์ดเมนูตรงกัน
  - เนื้อหาใน header เดิม (เมนูผู้ใช้ชิดขวา) จัดกลางแนวตั้ง · `--header-height` (56) ยังใช้ < lg
  - < lg ไม่เปลี่ยน: header sticky บนพื้น panel เต็มจอ
  - **อัปเดต (วันเดียวกัน)**: ผู้ใช้ขอ FAB ที่ compact ขึ้น → `--fab-size` 56 → 44px (เท่า `--tap-target` ขั้นต่ำ) · รูป robot 48 → 36px · offset 24px เดิม · padding ล่างของ `<main>` ลดตามเอง (คำนวณจาก token)
  - **อัปเดต (วันเดียวกัน)**: ผู้ใช้ขอให้ robot ใน FAB ขยับวนตลอด (ผู้ใช้เลือก: sprite sheet 1 รูปจาก codex-image โดยใช้รูป robot เดิมเป็น ref · ท่ากะพริบตา + ยิ้ม) → `src/assets/ai-fab-robot-frames.webp` strip 8 frame × 96px (768×96, พื้นใส): ลืมตา → ตาครึ่ง → หลับ → ตาครึ่ง → ลืมตา → ยิ้มกว้าง → ตายิ้ม ^ ^ + ยิ้มเปิดปาก → ยิ้มกว้าง · `.ai-fab-robot` (globals.css) เลื่อน `background-position` แบบ `step-end` วน 3s: ค้าง frame แรก 1.2s แล้วกะพริบเร็ว (frame ละ 90–120ms) แล้วยิ้ม · reduced-motion → ค้าง frame แรก (`animation: none`) · element เป็น `span aria-hidden` (ชื่อปุ่มจาก `aria-label`) · แทน `ai-fab-robot.webp` เดิม (ลบแล้ว) · ไม่เพิ่ม token
  - **อัปเดต (วันเดียวกัน)**: ผู้ใช้บอกว่า 8 frame ดูกระตุก → ไม่ gen รูปใหม่ (ไม่ใช้ quota) · สร้าง frame คั่นแบบ dissolve ด้วย ImageMagick `-morph 3` ระหว่าง ยิ้มเล็ก→ยิ้มกว้าง และ ยิ้มกว้าง→ตายิ้ม ^ ^ · strip ใหม่ 11 frame (1056×96): ลืมตา, ตาครึ่ง, หลับ, คั่น×3, ยิ้มกว้าง, คั่น×3, ^ ^ · เล่นบนกริด 40ms (25fps) รอบละ 3.04s: ค้างหน้าปกติ 1.2s → กะพริบ (ตาครึ่ง→หลับ→ตาครึ่ง) → ค่อยๆ ยิ้มขึ้นแล้วค่อยๆ กลับ (ไม่กระโดดจากยิ้มกว้างกลับหน้าปกติตอนวนรอบ) · frame "ลืมตา/ยิ้มกว้าง" ที่ซ้ำกันในชุดเดิมตัดออก · keyframes สร้างจากรายการ (frame, จำนวน tick)
- **2026-11-13 (change request: เอาเมนู "แจ้งเรื่องใหม่" ออกจาก sidebar)** — ผู้ใช้ต้องการให้เปิดเรื่องใหม่จากการเลือกบริการใน Service Catalog เท่านั้น → ลบ item "แจ้งเรื่องใหม่" ออกจาก `NAV_ITEMS` (sidebar ถาวร, rail, drawer) · route `/calls/new` ยังอยู่ (Catalog "Request this service", บริการยอดนิยม, ปุ่มบน My Space และ AI Assistant ยังพาไป) · อยู่ที่ `/calls/new` → ไม่มี item active, indicator จางหาย (§3 Motion) · ไม่เปลี่ยนสิทธิ์
  - **อัปเดต (วันเดียวกัน)**: ผู้ใช้ให้เอาปุ่ม "แจ้งเรื่องใหม่" บน My Space ออกด้วย → ลบปุ่มข้าง title (title อยู่แถวเดียว) · empty state ของ "Calls Logged For You" เปลี่ยน action เป็น "ไปที่ Service Catalog" (icon `LayoutGrid`, แสดงเมื่อมีสิทธิ์ `catalog:view`) · blueprint My Space (§7) ไม่มีปุ่ม "แจ้งเรื่องใหม่" ขวาของ title แล้ว · ทางเข้าเปิดเรื่องที่เหลือ: Catalog, บริการยอดนิยม, AI Assistant
- **2026-11-13 (change request: background ของ top nav)** — ผู้ใช้ให้ภาพแถบไล่สีชมพูอ่อน → แดง → แดงเข้ม ลายเฉียง (ภาพของ product เอง ไม่มีโลโก้/ข้อความ) เป็นพื้นของ header ทุก breakpoint → ตัดเฉพาะแถบ (ไม่เอามุมโค้งของภาพ; มุมมาจาก radius ของการ์ด header) เป็น `src/assets/header-bg.webp` 1600×98 · class `.header-surface` ใน `globals.css`: ภาพ `center / 100% 100%` + `--content-panel-bg` สำรองระหว่างโหลด · ด้านซ้ายสว่าง: wordmark crimson (< lg) และปุ่ม ☰ อ่านได้ตามเดิม · ด้านขวาแดงเข้ม/แดงสด ข้อความเข้มอ่านไม่ได้และข้อความขาวไม่ผ่านบนช่วงชมพู-แดงกลาง (ปุ่มผู้ใช้กว้างถึง ~30% ของ header ที่ 1024) → ปุ่มเมนูผู้ใช้เป็นพื้น `--card` (ขาว) + `--card-shadow` อ่านได้ทุกความกว้าง · hover `--muted` เดิม · ไม่เพิ่ม token
  - **อัปเดต (วันเดียวกัน)**: ผู้ใช้ให้ภาพใหม่แทน — แถบแดงเข้มทั้งแผ่น ลายเฉียง + chevron ด้านขวา (ภาพของ product เอง ไม่มีโลโก้/ข้อความ) → แทนไฟล์ `src/assets/header-bg.webp` (1600×92) class เดิม · พื้นเข้มทั้งแผ่น: ปุ่ม ☰ และ wordmark (< lg) ใส่ `.on-brand` → ตัวขาว (`--sidebar-fg`) + focus ring ขาว · wordmark ไม่ใช้ `text-primary` แล้ว (crimson บนแดงอ่านไม่ได้) · ปุ่มเมนูผู้ใช้คงพื้นขาว (`.on-brand` ไม่ครอบปุ่มนี้ เพราะจะทำให้ตัวอักษรเป็นขาวบนขาว) · ไม่เพิ่ม token
- **2026-11-13 (change request: ปุ่มปิด AI drawer ทับข้อความ)** — ปุ่มปิดของ sheet (44×44 วางมุมขวาบน ห่าง 8px) ลอยทับหัวข้อ/คำอธิบายของ AI panel พอ hover พื้น `--muted` ของปุ่มจึงบังตัวหนังสือ → header ของ AI panel เว้นขวา `--tap-target` + `--space-4` (60px) ให้ข้อความตัดบรรทัดก่อนถึงปุ่ม เหลือช่อง 8px · ไม่แก้ component sheet กลาง (drawer เมนู < lg มี header แบบ sr-only ไม่โดน) · ไม่เพิ่ม token
- **2026-11-14 (change request: AI streaming + animation)** — ผู้ใช้ขอ animation ตอนรอ AI และตอนแสดงคำตอบ · ไม่เพิ่ม token
  - รอคำตอบ (ยังไม่มีข้อความ): จุด 3 จุด 6px (`--muted-foreground`) ห่าง 4px ในการ์ดคำตอบแทนข้อความ "กำลังคิด…" · `@keyframes typing-dot` 1.2s `--ease-standard` วนตลอด: แต่ละจุดจาง 0.35 เป็น 1 และขยับขึ้น 3px แล้วกลับ · หน่วงจุดละ 150ms · มี `sr-only` "กำลังคิด" (`role="status"`) · reduced-motion → ไม่เคลื่อนไหว opacity 0.6
  - แสดงคำตอบ (kind reply ทั้งจาก stream และไม่ใช่ stream): พิมพ์ทีละ grapheme (`Intl.Segmenter` ไม่แยกสระ/วรรณยุกต์ไทยออกจากพยัญชนะ) ด้วย requestAnimationFrame · ต่อ frame เปิด `max(1, ceil(ที่ค้าง / 8))` grapheme ไม่ให้ช้ากว่า stream · caret 2px สูง 1em สี `--foreground` กะพริบ (`@keyframes caret-blink` 1s steps) ระหว่างพิมพ์ หายเมื่อพิมพ์ครบ · ข้อความที่กำลังพิมพ์ `aria-hidden` ข้อความเต็มอยู่ใน `sr-only` เมื่อจบ (live region ไม่อ่านทุก frame) · ข้อความที่พิมพ์ครบแล้วไม่เล่นซ้ำเมื่อเปิดแผงใหม่ · reduced-motion → แสดงทั้งหมดทันที ไม่มี caret
  - การ์ด draft / navigate แสดงทันทีเหมือนเดิม
