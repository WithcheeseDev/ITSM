# Structure

## Summary
- **Repo**: Single, git branch `main` (ยังไม่มี commit)
- **Source dirs**: `src/app`, `src/domain`, `src/data`, `src/features/*`, `src/shared`, `src/styles`, `tests/`
- **Entry points**: `src/main.tsx`, `vite.config.ts` (dev proxy)

## Repository
- **Type**: Single repo
- **Root**: `.claude/` (rules, skills), `.aidlc/` (specs, workflow, blueprints), `initial-requirements/` (requirements + ข้อมูลตัวอย่าง)

## Key Directories

| Directory | Purpose | Key Contents |
|-----------|---------|--------------|
| `initial-requirements/project-requirements/` | input ของโครงการ | `Requirements.md`, `database.json` |
| `.claude/rules/` | นโยบายโครงการ | workshop-policies, standards-practices |
| `.aidlc/` | AI-DLC artifacts | specs, workflow, blueprints |
| `src/domain/` | pure business rules | access, priority, sla, stateMachine, numbering |
| `src/data/` | repositories + seed | database.json, schemas, storage |
| `src/features/` | หน้าจอ + services | auth, my-space, catalog, call-form, calls, search, call-detail, approvals, ai-assistant |
| `src/shared/` | UI + utilities | ui (shadcn), components, logger, sanitize |
| `src/styles/` | design tokens | tokens.css, globals.css |
| `tests/` | unit / properties / e2e | |

## Key Files

| File | Purpose | Notes |
|------|---------|-------|
| `initial-requirements/project-requirements/Requirements.md` | ร่าง requirements | DRAFT, ป้าย `[OBS]/[PROP]/[ASM]` |
| `initial-requirements/project-requirements/database.json` | ข้อมูลตัวอย่าง | สมมติทั้งหมด |
| `.claude/rules/design-system.md` | design decisions ของโครงการ | sync กับ `src/styles/tokens.css` |
| `src/styles/tokens.css` | ค่า token จริง | runtime source of truth |
| `.env.local` | AI proxy secrets | gitignored |

## Entry Points

| Entry | Type | Description |
|-------|------|-------------|
| `src/main.tsx` | SPA entry | mount React + router |
| `vite.config.ts` | dev server | proxy `/api/ai/assist` → Azure |
