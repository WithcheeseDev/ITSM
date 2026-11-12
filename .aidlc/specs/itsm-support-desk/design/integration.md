# Integration

## Overview
ระบบมี integration ภายนอก 1 ตัว: AI agent บน Azure (FR-110–114) เรียกผ่าน Vite dev proxy (D3-8) · ไม่มี inter-unit communication (comprehensive mode, 1 แอป) · ไม่มี message queue / event bus

---

## External Integrations

### Azure AI Agent
| รายการ | ค่า |
|---|---|
| Purpose | ช่วยเปิด ticket (เสนอ draft ฟอร์ม) และ navigate (US-032, US-033) |
| Type | REST (HTTP JSON) ผ่าน dev proxy |
| Path ฝั่งแอป | `POST /api/ai/assist` → Vite `server.proxy` → `AZURE_AI_ENDPOINT` |
| Auth | proxy ใส่ header จาก `AZURE_AI_KEY` (`.env.local`, ไม่ commit) — browser ไม่เห็น key · รูปแบบ header จริง `[TBD]` ตาม contract |
| Request/Response | contract ฝั่งแอปตาม `design/api-spec.md` §2 · contract ของ Azure `[TBD]` → adapter `azure.ts` แปลง |
| Data sent | `text` ที่ผู้ใช้พิมพ์ + `page` เท่านั้น (FR-114, PDPA §15) · ไม่ส่ง user id, ชื่อ, อีเมล, เบอร์ |
| Timeout | 10 วินาที (AbortController ฝั่ง client) |
| Retry | ไม่ retry อัตโนมัติ — ผู้ใช้ส่งใหม่เองได้ (กันยิงซ้ำ) |
| Fallback | timeout / 4xx / 5xx / parse ไม่ผ่าน → `RuleBasedAssistant` + ข้อความ "AI ไม่พร้อมใช้งาน ใช้การค้นหาแบบคำสำคัญแทน" (US-034) |
| Mode switch | `VITE_AI_MODE=mock` (default) ใช้ rule-based ล้วน · `azure` ใช้ Azure + fallback |
| Output safety | response parse ด้วย Zod · route/ID ต้องมีจริงและผ่าน `can()` · draft ไม่สร้าง ticket เอง |

**Proxy config (แนวทาง)** — `vite.config.ts`
```ts
server: {
  proxy: {
    '/api/ai/assist': {
      target: env.AZURE_AI_ENDPOINT,       // จาก loadEnv(mode, cwd, '') — ไม่ใช่ VITE_ prefix
      changeOrigin: true,
      rewrite: () => env.AZURE_AI_PATH ?? '',
      headers: { /* [TBD] เช่น 'api-key': env.AZURE_AI_KEY */ },
    },
  },
}
```
> ตัวแปรที่มี prefix `VITE_` จะถูก bundle เข้า browser — key ต้องไม่มี prefix นี้

### Rule-based Assistant (internal fallback)
- ใช้ `ai.fallbackKeywordToServiceDefinition` (keyword → serviceDefinitionId) และ `ai.fallbackIntentToRoute` (keyword → route) จาก dataset
- จับคู่แบบ case-insensitive substring; หลาย keyword ตรง → เลือกรายการแรกตามลำดับใน data
- route จาก data ที่ไม่ตรง route table จริง (`/answers` — Knowledge เป็น Nice) → ถือว่า `unknown`

---

## Inter-Unit Communication
ไม่มี — แอปเดียว ไม่แบ่ง unit (นโยบาย hands-on-project)

---

## Integration Testing
- **Strategy**: test `AiAssistant` interface กับทั้ง 2 implementation
- **Mocking**: Azure ใช้ `fetch` mock (Vitest `vi.fn`) จำลอง 200 / 502 / timeout / JSON ผิด shape → ต้องได้ fallback ทุกกรณี
- **Contract**: Zod schema ของ response เป็น contract test ฝั่งแอป · contract test กับ Azure จริงทำเมื่อได้ spec `[TBD]`
- **Smoke ด้วยมือ**: ตั้ง `VITE_AI_MODE=azure` แต่ไม่ตั้ง endpoint → ต้องได้ข้อความ fallback ไม่ crash
