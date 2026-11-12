# Implementation

## Code Organization
- **Architecture pattern**: Feature-based SPA + `domain/` (pure) + `data/` (repository) (D3-9)
- **Repository type**: single repo, root ของ workspace (`git init -b main` เป็น task แรกตามนโยบาย)

### Directory Structure
```
ITSM-Support-Desk/
├── .env.example               # ตัวแปรตัวอย่าง (ไม่มีค่า secret)
├── .env.local                 # ค่าจริง (gitignored)
├── .gitignore
├── index.html
├── package.json
├── tsconfig.json              # strict: true
├── vite.config.ts             # react plugin, tailwind, proxy /api/ai/assist
├── vitest.config.ts
├── playwright.config.ts
├── components.json            # shadcn/ui config
├── src/
│   ├── main.tsx
│   ├── styles/
│   │   ├── tokens.css         # design tokens (runtime source of truth) — sync กับ .claude/rules/design-system.md
│   │   └── globals.css        # @import tokens, tailwind, base styles
│   ├── app/                   # C1 shell, routes, guard, layout
│   ├── domain/                # C3, C4 — pure, ห้าม import React / storage
│   │   ├── types.ts
│   │   ├── access.ts
│   │   ├── priority.ts
│   │   ├── sla.ts
│   │   ├── stateMachine.ts
│   │   └── numbering.ts
│   ├── data/                  # C10
│   │   ├── database.json      # copy จาก initial-requirements (ข้อมูลสมมติ)
│   │   ├── schemas.ts
│   │   ├── storage.ts
│   │   └── repositories.ts
│   ├── features/
│   │   ├── auth/              # C2
│   │   ├── my-space/          # C5
│   │   ├── catalog/           # C6
│   │   ├── call-form/         # C7
│   │   ├── calls/             # C8 callService
│   │   ├── search/            # C9
│   │   ├── call-detail/       # C9
│   │   ├── approvals/         # C14
│   │   └── ai-assistant/      # C15
│   └── shared/
│       ├── ui/                # shadcn/ui components (generated)
│       ├── components/        # StatusBadge, PriorityBadge, TimeLeft, CallTable, EmptyState, FilterChips
│       ├── icons.ts           # allow-list Lucide icon map
│       ├── sanitize.ts        # C13
│       ├── logger.ts          # C11
│       └── ErrorBoundary.tsx
└── tests/
    ├── unit/                  # *.test.ts(x) ของ domain, data, service
    ├── properties/            # *.properties.test.ts (fast-check)
    └── e2e/                   # Playwright smoke
```

### Module Boundaries
- `domain/` ห้าม import จาก `data/`, `features/`, `shared/`, React
- `features/*` ห้าม import ข้าม feature กันตรง ๆ — ใช้ `domain/`, `data/`, `shared/` หรือ service ที่ export
- เขียนข้อมูลได้เฉพาะผ่าน service (C8, C14) → `data/commit()`
- component ห้ามใช้ค่าสี/ระยะ hardcode — ใช้ token ผ่าน Tailwind theme ที่ map จาก CSS variables

### Naming Conventions
ตาม `code-conventions.md`: camelCase ตัวแปร/ฟังก์ชัน · PascalCase component/type · UPPER_SNAKE_CASE constant · ไฟล์ component = PascalCase.tsx · ไฟล์ logic = camelCase.ts · test = `<name>.test.ts` / `<name>.properties.test.ts`

---

## Technology Stack

### Key Dependencies (resolved 2026-11-11 จาก npm registry)
| Package | Version | หมายเหตุ |
|---|---|---|
| react / react-dom | 19.3.1 | |
| vite | 8.3.8 | major 8 ออก 2026-03 |
| @vitejs/plugin-react | ตาม peer ของ vite 8 (resolve ตอน setup) | |
| typescript | 6.0.3 | 7.x เป็น compiler เขียนใหม่ มี release เดียว → ใช้ 6 |
| react-router | 8.5.1 | |
| zustand | 5.1.0 | |
| tailwindcss + @tailwindcss/vite | 4.3.5 | |
| shadcn/ui (CLI) + Radix primitives | ตามที่ CLI ติดตั้ง (เช่น @radix-ui/react-dialog 1.3.1) | |
| react-hook-form | 7.92.0 | |
| zod | 4.6.7 | |
| @hookform/resolvers | 5.9.2 | 6.x/7.x ออกไม่ถึง 3 เดือน |
| @tiptap/react + @tiptap/starter-kit (+ extension underline, table) | 3.33.1 | |
| dompurify | 3.4.17 | |
| lucide-react | 1.72.0 | ISC license |
| @fontsource/ibm-plex-sans-thai, @fontsource/ibm-plex-sans | 5.3.0 | OFL, self-host (ไม่โหลดจาก CDN) |
| vitest | 4.1.12 | 5.x ออกไม่ถึง 3 เดือน |
| @testing-library/react | 16.3.3 | + jsdom |
| fast-check | 4.10.2 | |
| @playwright/test | 1.65.0 | |

Runtime: Node.js 22 LTS (เครื่องนี้ v22.23.2) · package manager: npm (มากับ Node, ไม่ได้ถามใน D3 → ใช้ค่ามาตรฐาน)

---

## Development Setup

### Prerequisites
- Node.js 22 LTS + npm
- Browser สมัยใหม่ (Chrome / Edge / Safari / Firefox ล่าสุด)

### Setup Commands (fresh clone)
```bash
npm install
cp .env.example .env.local
npm run dev            # http://localhost:5173
```

### Scripts (package.json)
| Script | Command |
|---|---|
| dev | `vite` |
| build | `tsc -b && vite build` |
| preview | `vite preview` |
| test | `vitest run` |
| test:watch | `vitest` |
| test:e2e | `playwright test` |
| typecheck | `tsc -b --noEmit` |

### Environment Variables
| Name | Where | Description | Example |
|---|---|---|---|
| `VITE_AI_MODE` | browser | `mock` หรือ `azure` | `mock` |
| `AZURE_AI_ENDPOINT` | proxy only | base URL ของ Azure agent | `https://example-agent.azurewebsites.net` |
| `AZURE_AI_PATH` | proxy only | path ของ endpoint | `/api/assist` |
| `AZURE_AI_KEY` | proxy only | key ของ agent — **ห้ามใช้ prefix `VITE_`** | `replace-me` |

---

## Testing
| Type | Framework | Command | ขอบเขต |
|---|---|---|---|
| Unit | Vitest + Testing Library (jsdom) | `npm test` | domain, data, service, component หลัก |
| Property-based | fast-check บน Vitest | `npm test -- tests/properties` | rules engine, access, full-text (`design/correctness.md`) |
| E2E smoke | Playwright (chromium) | `npm run test:e2e` | 3 flow หลัก (`design/testing-strategy.md`) |

- **Coverage target**: domain/ ≥ 80% · ส่วนอื่นตาม flow หลัก (นโยบายให้ test อยู่กลุ่มท้าย)
- **Definition of Done** (นโยบาย): `npm run build` ผ่าน, `npm run dev` เปิดได้, flow หลักคลิกได้จริง, ไม่มี error ใน console

---

## Add-on

### 2026-11-12 — Task 1.2: Node version + dev launch (ผู้ใช้อนุมัติ "เก็บ แล้ว next")
- **`.nvmrc`** = `22.23.2` — shell ของเครื่องเริ่มที่ Node 20 → `nvm use` เลือก 22 ให้ตรง `engines` (`>=22.22.2`)
- **`.claude/launch.json`** — config `itsm-dev` (`npm run dev`, port 5173) สำหรับเปิด dev server ใน Browser pane ของ Claude desktop · path ของ npm ผูกกับเครื่องนี้ (`~/.nvm/versions/node/v22.23.2`)
- **npm workaround** — npm 10.9.8 (มากับ Node 22.23.2) crash ตอน resolve peer: `Cannot read properties of null (reading 'edgesOut')` → `package-lock.json` สร้างด้วย npm 10.8.2 (Node 20) · runtime/build ใช้ Node 22 · ถ้า `npm install` บน Node 22 ล้ม ให้ใช้ npm 10.8.x ติดตั้งแทน
- ตัด `@testing-library/jest-dom` (ไม่อยู่ใน D3, ทำให้ resolve vitest 5) · ลบ `baseUrl` ใน tsconfig (TS 6 deprecated)

### 2026-11-12 — Task 1.3: dependency/config ที่ shadcn + Tailwind ต้องใช้ (ผู้ใช้อนุมัติ "บันทึก แล้ว next")
- **`vite.config.ts`** — เพิ่ม plugin `@tailwindcss/vite`
- **dependencies** (pin exact): `radix-ui` 1.8.1, `cmdk` 1.1.1, `sonner` 2.0.8 · **devDependencies**: `tw-animate-css` 1.4.0 (class `animate-in` ของ dialog/sheet)
- ไม่ใช้ `next-themes` (light only) · `components.json` alias: ui → `@/shared/ui`, utils → `@/lib/utils`
- shadcn CLI 4.23.0 หา alias ไม่เจอเพราะ root `tsconfig.json` ไม่มี `paths` → ไฟล์ลงโฟลเดอร์ `@/` ต้องย้ายเอง · ครั้งหน้าใช้ `add` ให้ย้ายไฟล์ + แก้ `from "cn"` เป็น `@/lib/utils`
- `src/main.tsx` เป็นหน้า test token ชั่วคราว — Task 1.5 แทน

### 2026-11-12 — Task 1.5: ไฟล์นอก Files ที่ต้องแก้ตาม (ผู้ใช้อนุมัติ "บันทึก แล้ว next")
- **`vitest.config.ts`** — `vite.config.ts` เป็น function (ใช้ `loadEnv`) → `defineConfig((env) => mergeConfig(viteConfig(env), {...}))`
- **`src/main.tsx`** — render `<App />` แทนหน้า test token
- **`src/shared/ui/sheet.tsx`, `dialog.tsx`** — ปุ่มปิด 16px → `size-[var(--tap-target)]` (44px, HARD RULE #6) + sr-only "ปิด" · แก้ข้อบกพร่องจาก Task 1.3
- proxy `/api/ai/assist` ลงทะเบียนเฉพาะเมื่อมี `AZURE_AI_ENDPOINT` (ไม่มีค่า → ไม่สร้าง proxy, dev server ไม่ error) · header auth `[TBD]` ถึง Task 4.6
- permission ต่อ route `[ASM]`: `/my-space`, `/calls/search`, `/calls/:callId` = `call:view_own` · `/catalog*` = `catalog:view` · `/calls/new` = `call:create` · `/approvals` = `approval:view_assigned`

### 2026-11-12 — Task 2.4: `src/app/App.tsx` (ผู้ใช้อนุมัติ "บันทึก แล้ว next")
- เพิ่ม route `/login` → `LoginPage` · ทุก route ใน layout ครอบด้วย `RequirePermission` จาก `ROUTES` (permission จุดเดียว) · layout เองครอบด้วย `RequirePermission permission={null}` (ต้องมี session)
- mount `<Toaster>` (sonner) + `TooltipProvider` ระดับ app
- โหลดครั้งแรกเจอ `STORAGE_CORRUPT` → toast เตือน 1 ครั้ง (US-001) ผ่าน `dataStore.takeLoadWarning()`
- shortcut: "รีเซ็ตข้อมูลตัวอย่าง" reload หน้าเพื่อให้ทุกหน้าอ่าน dataset ใหม่ — ปรับเมื่อมี data subscription

### 2026-11-12 — Task 2.6: `src/main.tsx` เรียก `runAutoClose()` ก่อน render (ผู้ใช้อนุมัติ "บันทึก แล้ว next")
- ปิดเรื่อง Resolved เกิน 7 วันก่อนหน้าใดอ่านข้อมูล (US-028 "เมื่อโหลดข้อมูล")
- หมวดของ call สำหรับกฎ SLA: จาก `serviceDefinitionId` ที่ผู้ใช้เลือก → fallback service definition แรกที่ใช้ template เดียวกัน
- approver ต้องมี `approval:decide_assigned` ไม่งั้นถือว่า `APPROVER_NOT_FOUND`

### 2026-11-12 — Task 2.7: `src/app/App.tsx` route wiring (ผู้ใช้อนุมัติ "อนุญาต แล้ว next")
- `guarded(route, page)` รับ element ของหน้า · `/catalog`, `/catalog/:categoryId` → `CatalogPage`
- **อนุญาตถาวร**: task หน้าจอที่เหลือ (2.8–2.11, 3.x, 4.x) แก้ `App.tsx` เพื่อต่อ route ของหน้าตัวเองได้โดยไม่ต้องถามซ้ำ — บันทึกใน audit ของ task นั้น

### 2026-11-12 — Task 2.8: `src/features/call-form/Field.tsx` (ผู้ใช้อนุมัติ "บันทึก แล้ว next")
- `Field` (label + control + error ใต้ช่อง ผูก `aria-describedby`, icon `CircleAlert`) และ `FormSection` (การ์ด section) ใช้ร่วมทุก section ของ C7

### 2026-11-12 — Task 2.9: `src/features/calls/callService.ts` ข้อความไฟล์แนบ (ผู้ใช้อนุมัติ "บันทึก แล้ว next")
- `MESSAGES.attachmentCount` = "แนบได้สูงสุด 5 ไฟล์" ให้ตรง US-019 (เดิม "แนบไฟล์ได้ไม่เกิน 5 ไฟล์")
- Tiptap v3 StarterKit รวม Underline แล้ว → ไม่ register `@tiptap/extension-underline` แยก (ยังอยู่ใน package.json)

### 2026-11-12 — Task 2.10: `RICH_TEXT_CLASS` (ผู้ใช้อนุมัติ "บันทึก แล้ว next")
- `src/features/call-form/RichTextEditor.tsx` export `RICH_TEXT_CLASS` (style list / table ที่ Tailwind preflight ลบ) ใช้ทั้ง editor และ Notes ในหน้า Call Detail
- [ASM] Activities ในหน้า Detail แสดงเป็นบล็อกต่อรายการ (ครบ 6 field ของ US-029) แทนตาราง เพราะอยู่ในคอลัมน์ 1/3 ตาม blueprint

### 2026-11-12 — Task 4.5: `src/features/call-form/CallFormPage.tsx` รับร่างจาก AI (ผู้ใช้อนุมัติ "บันทึก ข้าม 4.6")
- อ่าน `location.state.aiDraft` (C7 "Exposes state aiDraft") เติม template / urgency / impact / summary / notes พร้อมข้อความ "ตรวจข้อมูลก่อนกด OK" — ผู้ใช้กด OK เอง
- `CallFormPage` ครอบ `<CallForm key={location.key}/>` → โหลดฟอร์มใหม่ทุกครั้งที่ navigate เพื่อให้ `?service=` หรือร่าง AI ใหม่เติมทับฟอร์มที่เปิดค้าง

### 2026-11-12 — Task 5.1: `tsconfig.node.json` (ผู้ใช้อนุมัติ "แก้ แล้ว next")
- เปิด `allowImportingTsExtensions` และให้ `vitest.config.ts` import `./vite.config.ts` พร้อมนามสกุล — ตัด warning `configLoader: 'native'` ของ Vite

### 2026-11-12 — Task 5.3: `src/shared/sanitize.ts` sanitize ซ้ำจนนิ่ง (ผู้ใช้อนุมัติ "แก้ sanitize.ts")
- PBT P12 เจอ input ผิดรูป `<p><table><p>` → รอบแรกได้ `<p><p></p><table></table></p>` ซึ่ง parse ซ้ำแล้วต่าง → ไม่ idempotent (ความปลอดภัยยังผ่าน)
- `sanitizeHtml` เรียก DOMPurify ซ้ำจนผลไม่เปลี่ยน สูงสุด 3 รอบ (`MAX_PASSES`) · log `removedCount` รวมทุกรอบ
