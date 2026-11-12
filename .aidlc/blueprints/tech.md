# Tech

## Summary
- **Stack**: TypeScript 6.0 / React 19.3 + Vite 8.3 / localStorage (no backend)
- **Architecture**: SPA feature-based + domain pure functions + repository layer
- **Infra**: รันบน local · AI agent บน Azure ผ่าน dev proxy

## Stack
- **Languages**: TypeScript 6.0.3 strict (D3-1)
- **Frameworks**: React 19.3.1, React Router 8.5.1, Zustand 5.1.0, Tailwind 4.3.5 + shadcn/ui, React Hook Form 7.92.0 + Zod 4.6.7, Tiptap 3.33.1 + DOMPurify 3.4.17, lucide-react 1.72.0
- **Build system**: Vite
- **Package manager**: npm (Node.js 22 LTS)
- **Testing**: Vitest 4.1.12 + Testing Library 16.3.3 + fast-check 4.10.2 + Playwright 1.65.0

## Architecture
- **Pattern**: Feature-based SPA (D3-9)
- **API style**: ไม่มี backend API ใน scope ปัจจุบัน · Azure agent contract `[TBD]`

## Infrastructure
- **Cloud provider**: Azure (เฉพาะ AI agent)
- **Compute**: local dev server
- **Database**: localStorage key `itsm.db.v1`, seed `database.json` (D3-2)
- **IaC tool**: N/A

## Patterns & Conventions
- **Architecture pattern**: features → services (C8/C14/C15) → domain (pure) + data (repositories)
- **Data access**: Repository<T> บน localStorage, `commit()` เขียน dataset ครั้งเดียวต่อ use case
- **API response format**: in-process `Result<T> = { ok, data } | { ok:false, error: AppError }`
- **Error handling**: AppError codes + ข้อความไทย · React ErrorBoundary
- **State**: Zustand + persist (D3-3) · **Routing**: React Router + route guard
- **Logging**: `shared/logger.ts` ตัด PII (Minimal, D3-12/13)
- **Design tokens**: `src/styles/tokens.css` ↔ `.claude/rules/design-system.md`
- **Business logic**: pure functions สำหรับ priority, SLA/due date, state machine
- **Authentication**: mock login (เลือก user จาก `database.json`) · default-deny ทุกหน้า/action
- **Validation**: ตาม Requirements §4.5
- **Security**: sanitize rich text ก่อนแสดง · key/endpoint ของ Azure agent อยู่ใน `.env.local` ผ่าน dev proxy
- **Logging**: ห้าม log PII
- **Naming**: camelCase ตัวแปร/ฟังก์ชัน, PascalCase component, UPPER_SNAKE_CASE ค่าคงที่ (`code-conventions.md`)
- **UI**: CSS variables เท่านั้น ตาม `design-system-policies.md`

## Environment Configuration
- **Config approach**: env vars (`.env.local`) — 12-factor
- **Environments**: local
- **Secrets management**: `.env.local` (ไม่ commit)

## CI/CD Pipeline
- [TBD - not decided in D3] (deploy = optional)

## Dependency Management
- npm + package-lock.json · pin exact versions ตาม design/implementation.md
