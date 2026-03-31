# Module 3: Greenfield Build — Implement With OpenSpec

**Time Allocation:** 30 minutes (35 minutes with buffer)
**Format:** Hands-On Workshop

---

> **Workshop Navigation**
> **Previous:** [02 — Spec to Blueprint](./02_Spec_to_Blueprint.md)
> **Next:** [04 — Observe Your Tools](./04_Observe_Your_Tools.md)

---

> **Skill Levels:** First time using AI for implementation? Focus on T1 and T2 — internalize the "One Task = One Session = One Commit" cycle. Already AI-proficient? Pay attention to the verify/sync/archive workflow — it's the discipline layer most AI-assisted workflows lack.

---

## Learning Objectives

Now we _build_. You'll use OpenSpec's `/opsx:apply` to implement your blueprint — one task at a time — and learn how to prevent context rot by following a strict session discipline.

---

## Recap: Where We Are

In Module 2, you ran `/opsx:new mcp-traffic-inspector` followed by `/opsx:continue` to generate:

```
openspec/changes/mcp-traffic-inspector/
├── proposal.md     ← what we're building and why
├── specs/          ← delta specs with requirements
├── design.md       ← technical architecture
└── tasks.md        ← implementation checklist
```

Now we implement — one task at a time, using `/opsx:apply`.

---

## ✏️ Hands-On: Build Task 1 (5 min)

We'll implement **T1** from your `tasks.md` (Types + mock data generators).

### Step 1: Apply

Open your AI assistant in **Agent Mode** and run:

```
/opsx:apply
```

OpenSpec reads the `tasks.md` checklist and implements each sub-task in order. It follows the architecture defined in `design.md` and the requirements in `specs/`.

> 💡 **What's different from free-form prompting?** The AI isn't improvising — it's working from a reviewed, approved blueprint. Every file it creates ties back to an artifact you already approved.

### Step 2: Verify

1. Run the build: `npm run build`
2. Confirm `src/types.ts` and `src/mock-data.ts` exist and compile cleanly.

### Step 3: Commit

Once satisfied:

```bash
git add -A && git commit -m "T1: Types and mock data generators"
```

> ✅ **T1 is done.** Move on to the next task — keep the same change open until all tasks are complete.

---

## ✏️ Hands-On: Build Task 2 (7 min)

Repeat the cycle for **T2** (Mock MCP Server).

### The Anti–Context-Rot Rule

> 🧠 **Critical:** Clear your AI chat session before starting T2.

Context rot happens when a single chat session accumulates too much history — old ideas, deleted files, previous mistakes. The AI starts hallucinating methods that don't exist or undoing earlier work.

> **What context rot looks like in practice:** You're on T4 (MCP client) in the same session where you built T1-T3. The AI references `parseShipmentData()` — a helper you wrote in T1 but renamed to `generateShipmentData()` in T2. The AI confidently calls the old name because it's still in the session history. The code compiles but crashes at runtime. In a fresh session, the AI reads the _current_ files and uses the correct name.

**The Rule: One Task = One Session = One Commit**

> **How to start a fresh session per tool:**
> - **Copilot Agent Mode:** Click the `+` icon in the Chat panel to open a new chat, or press `Ctrl+L` / `Cmd+L`.
> - **Claude Code:** Type `/clear` to reset context, or exit and run `claude` again.
> - **Codex CLI:** Exit the current session (`Ctrl+C`) and run `codex` again.

1. Open a **fresh** Agent Mode chat.
2. `/opsx:apply` → the AI implements the mock MCP server with three logistics tools.
3. Run tests: `npm test`
4. `git add -A && git commit -m "T2: Mock MCP server with logistics tools"`

> 💡 Notice how each task is self-contained. You could hand any single task to a teammate (or a Coding Agent) and they'd have full context from the proposal alone.

---

## ✏️ Complete the Build: Tasks T3–T6 (20 min)

Follow the same cycle for **T3 through T6** from your `tasks.md`:

| Task | What to Build | Acceptance Check |
| ---- | ------------- | ---------------- |
| **T3: Mock LLM router** | Pattern matcher mapping chat text → MCP tool calls. "track", "shipments", "inventory" each route correctly. | `npm test` — unit tests verify all 5 routing patterns |
| **T4: MCP client** | Spawns MCP server subprocess via `StdioClientTransport`. `callTool()` returns result + latency. | Build succeeds; singleton initialized at startup |
| **T5: Express server** | `POST /api/chat`, `GET /api/traffic` (SSE), `GET /api/tools`, static serving. Orchestrates full flow. | `npm start` → POST `{ message: "track PKG-1234" }` → JSON response returned |
| **T6: Dashboard UI** | Chat input + scrolling traffic log (SSE) + tools panel. Color-coded event cards with latency badges. | Open `localhost:3000/` → type "track PKG-1234" → full 5-event chain appears in the log |

For each task, follow the **One Task = One Session = One Commit** rule:

1. Open a **fresh** Agent Mode chat.
2. `/opsx:apply` → implements the task.
3. Verify → `git commit`.

> **Checkpoint code available.** If you're running behind, the instructor has checkpoint code for T3-T6. Raise your hand — catching up is more valuable than falling behind. The important thing is that you've internalized the cycle.

### The Payoff: Watch Your MCP Traffic Inspector Come Alive

After completing T6, this is the moment everything clicks:

1. Start the server: `npm start`
2. Open your browser to `http://localhost:3000/`
3. Type **"track PKG-1234"** in the chat input and press Send
4. Watch the dashboard — five color-coded event cards appear in sequence: blue (your message) → gray (LLM thinking) → orange (MCP tool call) → green (MCP result with latency) → purple (final response)

You just built a complete, working MCP Traffic Inspector — from a first-principles spec to a live system — without vibe coding. Every file traces back to an artifact you reviewed and approved.

---

## Verify & Archive the Change

With all six tasks committed, close out the change:

**Step 1:** Run `/opsx:verify` to check every `tasks.md` item against the actual code:

```
# Claude Code
/opsx:verify

# Codex / Copilot CLI
openspec-verify-change
```

Review the report carefully — this is your second human gate (the first was reviewing the plan, the second is confirming delivery matched the plan).

> **What Good Review Looks Like:**
> - Every task checkbox in `tasks.md` maps to a real file or function that exists in the codebase
> - Acceptance criteria (AC lines) were actually exercised — not just marked done
> - No tasks were silently skipped because they were hard
> - Running `npm start` and `npm test` both succeed without errors

Fix any gaps before proceeding.

**Step 2:** Sync the delta specs into the main spec tree:

```
# Claude Code
/opsx:sync

# Codex / Copilot CLI
openspec-sync-specs
```

This merges only the accepted delta specs from `changes/mcp-traffic-inspector/specs/` into the top-level `openspec/specs/` directory — without closing the change. Each OpenSpec change keeps its deltas scoped to that change folder; without an explicit sync, the main specs never learn what was actually built. Over time, unsynced changes cause the main spec tree to drift from the codebase, turning your living documentation into stale noise. Syncing is how you keep the specs authoritative.

**Step 3:** Once synced, archive the change:

```
# Claude Code
/opsx:archive

# Codex / Copilot CLI
openspec-archive-change
```

Archiving closes the change folder and records it as complete. The main specs are already current from Step 2, so archive is purely a housekeeping step.

**Step 4:** Final commit:

```bash
git add -A && git commit -m "chore: verify, sync, and archive mcp-traffic-inspector change"
```

> 🔑 **Key insight:** Verify → Sync → Archive — in that order. Syncing without verifying risks committing inaccurate specs; archiving without syncing leaves the main spec tree out of date.

---

## Checkpoint

At this point you have:

- [x] A formal spec (`spec.md`)
- [x] A technical blueprint (`proposal.md` + `design.md`)
- [x] A task breakdown (`tasks.md`)
- [x] All six tasks implemented & committed
- [x] Implementation verified with `/opsx:verify` — every task checked against actual code
- [x] Delta specs synced with `/opsx:sync` — main spec tree updated with accepted deltas
- [x] Change archived with `/opsx:archive` — change folder closed as complete
- [x] A **working MCP Traffic Inspector** — `npm start` launches the server
- [x] A **live dashboard** at `localhost:3000/` — type a message and watch LLM↔MCP traffic flow in real time
- [x] A **mock MCP server** with logistics tools (shipments, tracking, inventory)
- [x] Living documentation in `openspec/specs/`

You've gone from a first-principles prompt to a fully working application — with a backend API, MCP integration, SSE streaming, and a live frontend — without vibe coding.

You built the MCP Traffic Inspector. In Module 04, you'll use it to observe real AI behavior — and discover what your tools are actually doing under the hood.

> **Next:** [04 — Observe Your Tools](./04_Observe_Your_Tools.md)
