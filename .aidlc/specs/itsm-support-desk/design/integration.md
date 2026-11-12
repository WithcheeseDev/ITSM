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

**Proxy config (แนวทาง เดิม — ถูกแทนด้วย middleware `server/aiAssist.ts` ตาม Add-on 2026-11-13)** — `vite.config.ts`
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

---

## Add-on

### 2026-11-13 — Azure AI Foundry contract (task 4.6 ปลดล็อก)
ผู้ใช้ให้ code template ของ Azure AI Foundry (OpenAI v1 **Responses API**) → แทน `[TBD]` ของ Azure AI Agent ข้างบน:

| รายการ | ค่า |
|---|---|
| Azure endpoint | `AZURE_AI_ENDPOINT` = `https://<resource>.services.ai.azure.com/openai/v1` → เรียก `POST {endpoint}/responses` |
| Model | `AZURE_AI_DEPLOYMENT` (deployment name เช่น `gpt-5-4-mini`) ส่งเป็น `model` ใน body |
| Auth | header `api-key: <AZURE_AI_KEY>` ใส่ฝั่ง Node เท่านั้น (ไม่มี prefix `VITE_`) |
| ตัวกลาง | **Vite plugin middleware** `server/aiAssist.ts` (แทน `server.proxy` แบบ pass-through เดิม) — ทำงานใน `vite dev` และ `vite preview` · ไม่มี backend production |
| Prompt | server สร้าง `instructions` จาก seed `src/data/database.json`: `serviceDefinitions` (id, name, description) + route ที่อนุญาต (`ai.fallbackIntentToRoute` ที่ตรง route table) · browser ส่งแค่ `{ text, page }` (FR-114 คงเดิม) |
| Output | `text.format` = `json_schema` (strict) ช่อง `kind`, `serviceDefinitionId`, `route`, `summary` (nullable) · อ่านข้อความจาก item `type: "message"` → content `type: "output_text"` (ไม่ใช้ `output[0]` เพราะ model ตระกูล reasoning มี item `reasoning` นำหน้า) |
| Timeout | server 9 วินาที (`AbortSignal.timeout`) < client 10 วินาที |
| แปลงเป็น AiResult | ฝั่ง browser (`azure.ts`): Zod parse → `serviceDefinitionId` ต้องมีใน dataset, route ต้องอยู่ใน route table · urgency/impact = ค่า default ของ template (ไม่ให้ AI เลือก) · notes = ข้อความผู้ใช้ escape แล้ว (เหมือน rule-based) |
| Fallback | เดิม: timeout / 4xx / 5xx / parse ไม่ผ่าน / ID ไม่มีจริง → rule-based + AI_UNAVAILABLE |
| Log | server log แค่ status / ชนิด error ไม่ log ข้อความผู้ใช้หรือ key |

### 2026-11-13 — AI SDK ToolLoopAgent + model adapter (แทน fetch ตรงใน middleware)
ผู้ใช้ขอให้ห่อการเรียก model ด้วย Vercel AI SDK และสลับค่ายได้ · ไม่ใช้ `HarnessAgent` / ACP (ตัวนั้นรัน coding-agent runtime สำเร็จรูปใน sandbox ไม่ได้ห่อ model ของเรา)

| รายการ | ค่า |
|---|---|
| Agent | `ToolLoopAgent` (`ai`) ใน `server/ai/agent.ts` · `Output.object({ schema })` (Zod 4 ช่องเดิม) · `stopWhen: isStepCount(4)` |
| Model adapter | `server/ai/model.ts` `resolveModel(env)` ตาม `AI_PROVIDER`: `azure` → `createAzure({ baseURL: AZURE_AI_ENDPOINT, apiKey: AZURE_AI_KEY }).responses(AI_MODEL)` · `bedrock` → `createAmazonBedrock({ region: AWS_REGION, accessKeyId: AWS_ACCESS_KEY_ID, secretAccessKey: AWS_SECRET_ACCESS_KEY })(AI_MODEL)` · ค่าอื่น / env ขาด → `500 config_missing` · เพิ่มค่าย = ติดตั้ง provider package + 1 case |
| Tools | `server/ai/tools.ts` อ่านอย่างเดียว ไม่ต้องอนุมัติ: `searchServices({ query })` → บริการไม่เกิน 10 รายการ `{ id, name, description }` จาก seed `database.json` · `listRoutes()` → route ที่อนุญาต (`ai.fallbackIntentToRoute` ∩ route table) |
| Instructions | สั้น: บทบาท + กติกา + route ที่อนุญาต · ไม่ dump บริการทั้งหมด (model ต้องเรียก `searchServices` ก่อนเลือก id) |
| เรียก | `agent.generate({ prompt: text, abortSignal: AbortSignal.timeout(9000) })` → `result.output` ตรวจด้วย Zod ก่อนตอบ |
| Log | status, provider, จำนวน step · ไม่ log ข้อความผู้ใช้ / key / output ของ model |
| Env | `AI_PROVIDER`, `AI_MODEL`, `AZURE_AI_ENDPOINT`, `AZURE_AI_KEY`, `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` · ลบ `AZURE_AI_DEPLOYMENT` (แทนด้วย `AI_MODEL`) |
| Contract ฝั่ง browser | ไม่เปลี่ยน (api-spec §2 Add-on 2026-11-13) |
| ความเร็ว | loop 2 step (tool + คำตอบ) ราว 2.5–3 วินาที ยังต่ำกว่า timeout 9 วินาที |

### 2026-11-13 — Page guide + `searchPages` (lite RAG)
- ข้อมูลหน้า: `server/ai/pages.json` (route, title TH/EN, purpose, keywords TH/EN, params, permission, roles, `aiNavigable`, examples) · ข้อเท็จจริงมาจาก `routes.tsx`, `rolePermissions`, component ของแต่ละหน้า
- ค้น: MiniSearch 7.2.0 (BM25 + prefix/fuzzy) index ใน memory ตอนโหลด middleware · ตัดคำด้วย `Intl.Segmenter('th', { granularity: 'word' })` (ไทยไม่เว้นวรรค) · field: title, purpose, keywords, examples (boost title/keywords)
- Tool `searchPages({ query })` แทน `listRoutes` → คืนไม่เกิน 3 หน้า `{ route, title, purpose, params }` เฉพาะ `aiNavigable: true`
- Output guard ฝั่ง server: `kind = navigate` ต้องมี route อยู่ในชุด `aiNavigable: true` ไม่งั้นถือว่า output ผิด → `502` → browser fallback (เดิม) · instructions ไม่ inline รายการ route แล้ว ให้เรียก `searchPages`
- สิทธิ์ตาม role ยังตรวจที่ browser (`can()` ใน AiPanel, US-033) · contract `{ text, page }` ไม่เปลี่ยน (ไม่ส่ง role / user id, FR-114)
- **อัปเดต (วันเดียวกัน, verify กับ Azure จริง)**: บาง request ค้างราว 7.5 วินาที (ปกติ 0.6–0.8 วินาที) ทำให้ timeout 9 วินาทีของทั้ง loop หมด → `stallRetryFetch` ใน `server/ai/model.ts` ตัด request ที่เกิน 3.5 วินาทีแล้วยิงใหม่ 1 ครั้ง (ใช้กับทุก provider, ไม่ retry เมื่อผู้เรียก abort หรือ error อื่น) · instructions แยก "ถามว่ามีบริการอะไร / ดู catalog" เป็น navigate ไม่ใช่ draft · route ใช้ตามที่ `searchPages` คืน ไม่เติม param

### 2026-11-13 — คุยคำถามทั่วไป (`kind: "reply"`)
- ผู้ใช้ขอให้ agent ตอบคำทักทาย / คำถามทั่วไปได้ (เดิมตอบ `unknown` → "ยังไม่เข้าใจคำขอนี้")
- Output ของ agent เพิ่ม `kind: "reply"` และ field `reply: string | null` (ทุก key ยัง required เพราะ strict schema) · `reply` มีค่าเฉพาะ kind `reply`, kind อื่นเป็น `null`
- ลำดับตัดสิน: ปัญหาจริง / ขอบริการ → `draft` · อยากไปหน้า → `navigate` · ทักทาย ขอบคุณ ถามว่าช่วยอะไรได้ ถามความรู้ IT ทั่วไป หรือคำถามทั่วไปอื่น → `reply` · อ่านไม่ออก → `unknown`
- กติกาคำตอบ: ภาษาเดียวกับผู้ใช้ · ข้อความล้วนไม่มี markdown · ≤ 500 ตัวอักษร · ห้ามอ้างว่าสร้าง/แก้เรื่องแล้ว · ห้ามเดาสถานะเรื่องหรือข้อมูลของผู้ใช้ (agent ไม่เห็นข้อมูล) · คำถามนอกงาน IT ตอบสั้นแล้วชวนกลับมาที่สิ่งที่ช่วยได้ · ห้ามใส่ข้อมูลส่วนบุคคล
- Server guard: kind `reply` ที่ `reply` ว่าง → `502` · ยาวเกิน 1000 ตัวอักษร → ตัดเหลือ 1000 · ไม่ log ข้อความ reply
- Browser: `AiResult` เพิ่ม `{ kind: "reply"; text }` แสดงเป็นข้อความธรรมดา (React escape, ไม่ render HTML) · kind `reply` ที่ไม่มีข้อความ → `bad_output` → fallback · rule-based mock ไม่เปลี่ยน
- ยังส่งทีละข้อความ ไม่มีประวัติสนทนา (FR-114 คงเดิม: `{ text, page }`)
