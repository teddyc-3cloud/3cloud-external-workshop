# Module 2: Spec to Blueprint — From Idea to Technical Plan

**Time Allocation:** 15 minutes (20 minutes with buffer)
**Format:** Live Demo + Hands-On


> **Skill Levels:** New to AI tools? Focus on Phases 1-2 — writing the spec and watching the blueprint generate. Already using Agent Mode regularly? OpenSpec adds structure and auditability to a workflow you're likely running informally — watch for how the review gates change your prompting habits.

---

## Learning Objectives

Turn the first-principles prompt from Module 1 into a formal, AI-consumable specification — then use **[OpenSpec](https://github.com/Fission-AI/OpenSpec)** to generate a technical blueprint and task breakdown automatically.

The core workflow is **Specify → Propose → Review → Implement**:

```
 ┌──────────┐     ┌───────────────────┐     ┌──────────┐     ┌───────────┐
 │ SPECIFY  │ ──▶ │     PROPOSE       │ ──▶ │  REVIEW  │ ──▶ │ IMPLEMENT │
 │ (Human)  │     │ (OpenSpec + AI)   │     │ (Human)  │     │ (AI+Human)│
 └──────────┘     └───────────────────┘     └──────────┘     └───────────┘
   spec.md         proposal.md, design.md,    human gate       code + tests
                   specs/, tasks.md
```

Module 1 taught you **why** spec-first matters. Now you'll learn the **how** — and OpenSpec is the tool that enforces the workflow automatically.

---

## What Is OpenSpec?

[OpenSpec](https://github.com/Fission-AI/OpenSpec) wraps every code change in a **propose → apply → verify → archive** loop. Think of it as pull-request-level discipline, but for your AI prompts.

```
 Simple:  /opsx:ff   ──▶  review  ──▶  /opsx:apply  ──▶  /opsx:verify  ──▶  /opsx:archive
          (all 4 artifacts  (Human)    (AI writes)      (AI checks all      (Living docs
           at once)                                       tasks.md items)      updated)

 Complex: /opsx:new  ──▶  review  ──▶  /opsx:continue  ──▶  review  ──▶  (×3)  ──▶  /opsx:apply  ──▶  /opsx:verify  ──▶  /opsx:archive
          (proposal)       (Human)     (next artifact)       (Human)
```

> **CLI command reference** — Claude Code uses `/opsx:` shorthands; Codex and Copilot CLI use the full skill name:
>
> | Claude Code shorthand | Full skill name (Codex / Copilot CLI) |
> | --------------------- | ------------------------------------- |
> | `/opsx:ff`            | `openspec-ff-change`                  |
> | `/opsx:new`           | `openspec-new-change`                 |
> | `/opsx:continue`      | `openspec-continue-change`            |
> | `/opsx:apply`         | `openspec-apply-change`               |
> | `/opsx:verify`        | `openspec-verify-change`              |
> | `/opsx:archive`       | `openspec-archive-change`             |

Both paths produce the same four artifacts — `/opsx:ff` generates them all at once; `/opsx:new` + `/opsx:continue` generates them one at a time with a human review gate between each:

| Artifact      | Purpose                                                   |
| ------------- | --------------------------------------------------------- |
| `proposal.md` | The "why" and "what" — captures intent, scope, approach   |
| `specs/`      | Delta specs showing ADDED/MODIFIED/REMOVED requirements   |
| `design.md`   | The "how" — technical approach and architecture decisions |
| `tasks.md`    | Implementation checklist with checkboxes                  |

> 🔑 **Key insight:** These are the same artifacts you'd create manually with free-form prompts. OpenSpec standardizes the structure and keeps them organized.

> **No OpenSpec?** The same workflow runs without it. Write a `spec.md`, paste it into Agent Mode with: _"Generate a proposal, technical design, and task breakdown for this spec."_ Review the output, implement one task per session, commit after each. OpenSpec automates what discipline achieves manually.

---

## ✏️ Hands-On: Build Your Blueprint (15 min)

> 🏠 **Local-only:** This entire exercise runs on your machine with zero cloud resources — no databases, no external services.

We'll use the MCP Traffic Inspector scenario from Module 1 and walk through the full workflow. Implementation (Phase 4) happens in Module 3.

### Phase 1: Specify (Human)

> **Start in plan mode.** Before running any OpenSpec commands, switch your AI assistant to plan mode. This ensures the AI explores and proposes a design before it makes any edits.
>
> **How to enter plan mode per tool:**
> - **Copilot Agent Mode:** Click the model selector dropdown and choose a "thinking" model, or prefix your prompt with "Plan first, don't write code yet."
> - **Claude Code:** Press `Shift+Tab` to toggle plan mode, or launch with `claude --permission-mode plan`.
> - **Codex CLI:** Use `--approval-mode suggest` (default) — it shows diffs and waits for approval before any changes.

**Step 1:** Create a project folder and initialize it.

```bash
mkdir mcp-traffic-inspector && cd mcp-traffic-inspector
git init
```

**Step 2:** Install OpenSpec and initialize it in your project.

```bash
npm install -g @fission-ai/openspec@latest
openspec init
```

This creates an `openspec/` folder with your living documentation structure:

```
openspec/
├── specs/          # Source of truth (your system's behavior)
└── changes/        # Proposed changes (one folder per feature)
```

**Step 3:** Here, you have 2 ways of doing this. 
1. use /opsx:new command and copy and paste solution details came out from first principle thinking from previous "start with why" section.

2. Or, you can just create `spec.md` using your first-principles output from Module 1, and with /opsx:new [point location of your spec.md file]

Here's a starting point (Provided here from first principle output for your convenience):

```markdown
# Feature: MCP Traffic Inspector

## Problem

When engineers integrate LLMs with MCP servers, the traffic between them
is invisible. Tool calls happen inside the process with no built-in tracing.
Debugging requires log archaeology, not live observation.

## User

Platform engineers and AI integration developers who need to understand
and debug LLM-to-MCP traffic during development.

## Rules

- Must run locally with `npm start` only — no external API key required.
- Mock LLM uses keyword pattern matching (no API key); real LLM is a stretch goal.
- Mock MCP server uses `@modelcontextprotocol/sdk` with stdio transport.
- Backend: Node.js with Express, TypeScript.
- Frontend: Vanilla HTML + CSS + JS — no build step, no frontend framework.
- All traffic events stream to the browser via Server-Sent Events (SSE).

## Requirements

### Backend

- Expose `POST /api/chat` — routes message through mock LLM, calls MCP if needed.
- Expose `GET /api/traffic` as an SSE stream of `TrafficEvent` objects.
- Expose `GET /api/tools` returning the available MCP tool list.
- Log all events to `logs/traffic-audit.jsonl` using structured Pino logging.
- MCP client spawns the mock MCP server as a child process via stdio transport.

### Mock MCP Server (logistics-themed)

- Tool `get_shipments` — returns a list of recent shipments.
- Tool `track_package` — takes `packageId`, returns tracking history.
- Tool `get_inventory` — takes optional `warehouseId`, returns inventory summary.
- All data is randomly generated in-process — no external services required.

### Frontend (Dashboard)

- Single-line chat input at the top with a Send button.
- Scrolling traffic log showing events in arrival order.
- Color-coded event cards: blue (user), gray (LLM thinking), orange (MCP call), green (MCP result), purple (response).
- Latency badge shown on MCP tool result cards.
- Available tools panel fetched from `/api/tools`.
- SSE reconnects automatically; replays last 200 events on page refresh.

## Acceptance Criteria

- [ ] "track PKG-1234" shows full chain: USER → LLM_THINKING → MCP_TOOL_CALL → MCP_TOOL_RESULT → LLM_RESPONSE
- [ ] Each event card is color-coded by type
- [ ] MCP round-trip latency shown on result cards
- [ ] Dashboard reconnects SSE without losing recent events
- [ ] `GET /api/tools` returns the tool list
- [ ] Runs with `npm start` — no database or external service needed
```

> 🔑 **Key insight:** The acceptance criteria are checkboxes. They become the AI's definition of "done." Every criterion it can't check off is a conversation you need to have _before_ writing code.

---

### Phase 2: Propose (OpenSpec + AI)

**Step 4:** Open VS Code with your AI assistant. Make sure `spec.md` from Phase 1 is in the project root — it is the starting point for the entire blueprint. In **Agent Mode**, start the change:

```
# Claude Code — explicitly pass spec.md as the input
> Using spec.md as the starting point, run /opsx:new mcp-traffic-inspector

# Codex / Copilot CLI
> Using spec.md as the starting point, run openspec-new-change mcp-traffic-inspector
```

OpenSpec reads `spec.md` and generates the **proposal** — the first artifact:

```
openspec/changes/mcp-traffic-inspector/
└── proposal.md     ← why we're doing this, what's changing
```

> 💡 **Why `/opsx:new` instead of `/opsx:ff`?** The MCP Traffic Inspector spans 6 components: types, mock MCP server, mock LLM router, MCP client, Express server, and the dashboard. For a project this size, you want to review each artifact _before_ the AI generates the next — so you catch scope creep in the proposal before it propagates into the design and tasks. For smaller, well-scoped changes (like the latency alerting in Module 4), you'll use `/opsx:ff` to generate all four at once.

**Step 5:** Review `proposal.md`. Once satisfied, generate the next artifact:

```
# Claude Code
/opsx:continue

# Codex / Copilot CLI
openspec-continue-change
```

Run `/opsx:continue` for each remaining artifact, reviewing each before proceeding, until all four exist:

```
openspec/changes/mcp-traffic-inspector/
├── proposal.md     ← why we're doing this, what's changing
├── specs/           ← delta specs with requirements & scenarios
├── design.md        ← technical approach & architecture
└── tasks.md         ← implementation checklist
```

> 💡 **What just happened?** Each `/opsx:continue` built the next artifact on top of what you already reviewed — proposal → specs → design → tasks. Human review between every step means the task breakdown reflects architecture you've already approved.

---

### Phase 3: Review (Human)

**Step 6:** Review the generated artifacts. This is your **quality gate**.

**Check `proposal.md`:**

- Does the scope match what you intended?
- Did the AI invent requirements you didn't ask for?

> **What a bad proposal looks like:** Watch for the AI adding features you didn't request — e.g., "Added user authentication and role-based access control" when your spec said nothing about auth. Another common failure: the AI downgrades a hard constraint to a "nice to have" — e.g., changing "must work offline" to "offline support planned for v2." If you see either, edit the proposal directly or re-prompt: "Remove the auth section. Restore offline as a hard requirement, not a future item."

> **What Good Review Looks Like:**
> - Every bullet in the proposal traces back to something in your spec — no invented features
> - Constraints from your RULES section appear as constraints in the proposal, not suggestions
> - The scope feels right-sized for the task — not a three-sprint epic for a one-session feature
> - Dependencies listed are ones you'd actually use (not the AI's favorites)

**Check `design.md`:**

- Does the architecture match your team's patterns?
- Did it pick reasonable dependencies?

**Check `tasks.md`:**

- Are tasks small enough for one session each?
- Does each task have clear acceptance criteria?

A good `tasks.md` looks like:

```markdown
# Tasks

## T1. Types and mock data generators

- [ ] Create `src/types.ts` with TrafficEvent, Shipment, InventoryItem interfaces
- [ ] Create `src/mock-data.ts` with logistics data generators (no external deps)
- AC: `npm run build` succeeds; generators return valid shaped objects

## T2. Mock MCP server

- [ ] Create `src/mock-mcp-server.ts` with 3 tools: get_shipments, track_package, get_inventory
- AC: `npx tsx src/mock-mcp-server.ts` starts without errors

## T3. Mock LLM router

- [ ] Create `src/mock-llm.ts` — pattern matcher mapping chat text to tool calls
- AC: Unit test proves each routing pattern resolves correctly

## T4. MCP client

- [ ] Create `src/mcp-client.ts` — spawns MCP server subprocess via StdioClientTransport
- AC: `callTool` returns result + latencyMs

## T5. Express server

- [ ] Create `src/server.ts` — POST /api/chat, GET /api/traffic (SSE), GET /api/tools, static
- AC: `npm start` → POST to /api/chat returns a response; SSE stream delivers events

## T6. Dashboard UI

- [ ] Create `public/index.html` — chat input + color-coded traffic log + tools panel
- AC: Full chain visible in log after a single chat message; page refresh replays events
```

> ⚠️ **Gate:** Do NOT proceed until you're satisfied with _all_ artifacts. Edit them manually if needed — OpenSpec lets you update any artifact at any time.

**Step 7:** Once satisfied with all artifacts, exit plan mode. Your blueprint is ready — implementation starts in Module 3.

Your AI assistant will usually prompt you to exit plan mode (approve the plan) before proceeding. If it doesn't, switch to build mode manually:

- **Claude Code:** type shift+tab or approve when prompted. If Context consumption is high, /clear
- **Codex CLI / Copilot:** shift+tab, or confirm the plan in the session. If Context consumption is high, use new session or /clear

> **Proceed to Module 3.** You'll implement each task with `/opsx:apply`, then verify and archive the change — one clean cycle to close out the build.

---

## The Fundamentals ↔ Tooling Connection

| You learned the fundamental...                  | OpenSpec automates it as...                                   |
| ----------------------------------------------- | ------------------------------------------------------------- |
| Write a spec with problem, user, rules, success | `spec.md` → input to `/opsx:new` (complex) or `/opsx:ff` (simple) |
| Ask AI to generate a technical plan             | `proposal.md` + `design.md` (auto-generated)                  |
| Ask AI to break the plan into tasks             | `tasks.md` (auto-generated)                                   |
| Human review gate between each phase            | You still review — but artifacts are structured and organized |
| Confirm AI actually finished what it promised   | `/opsx:verify` — checks every `tasks.md` item against the code |

> **Facilitator Note:**
> - **Timing:** Phase 1 (5 min), Phase 2 (5 min), Phase 3 (5 min). If `openspec init` fails for a participant, the most common cause is npm global bin not in PATH — see Module 00 troubleshooting.
> - **Common issue:** Some participants will try to skip the review gate and go straight to `/opsx:apply`. Redirect: "The review is the whole point — this is where you catch AI drift before it becomes code."
> - **If behind schedule:** Provide the pre-built `openspec/changes/mcp-traffic-inspector/` folder as a checkpoint so participants can skip to Phase 3.

> 🎯 **You now have your implementation roadmap.** Each task becomes a single, focused Agent Mode session in Module 3 — where you'll build, verify, and archive the change.

---

