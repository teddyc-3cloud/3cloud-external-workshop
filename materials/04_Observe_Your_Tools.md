# Module 4: Observe Your Tools — Live Traffic Visibility

**Time Allocation:** 15 minutes (20 minutes with buffer)
**Format:** Hands-On Workshop



> **Skill Levels:** New to AI tools? Focus on Step 1 — exploring the live traffic log requires no AI interaction. Already comfortable with AI agents? Step 2's latency alerting and Step 3's MCP config show how observability patterns transfer to production.

---

## Learning Objectives

You've built a working MCP Traffic Inspector. Unlike most workshop apps, yours already has observability built in. Now you'll:

1. **Understand what you built** — trace the full MCP call chain through the dashboard
2. **Enhance the audit log** — add latency alerting and correlation IDs to `traffic-audit.jsonl`
3. **Connect VS Code** — expose the mock MCP server as a tool your AI assistant can call directly
4. **Stretch goal** — swap the mock LLM for a real API (OpenAI/Anthropic)

---

## Why This Matters

> **What is MCP?** MCP (Model Context Protocol) is the open standard that lets AI assistants call external tools. When Copilot uses a tool in Agent Mode — reading a file, running a search, querying a database — it's speaking MCP under the hood. Your MCP Traffic Inspector shows this protocol in action, in real time, with every message.

When your AI assistant calls a tool, you need to know:

- **What** tool was called (was it the right one?)
- **With what arguments** (did it send PII?)
- **When** (is something calling tools at 3am?)
- **How long** it took (is a tool hanging?)

Without this, your AI tooling is a black box. **You just built the tool that opens it.**

```
  Chat Input (Browser)
       │
       ▼
  ┌──────────────────────────┐
  │  Express Proxy            │  ← Every step logged to traffic-audit.jsonl
  │  Mock LLM Router          │      and streamed live to the dashboard
  └──────────┬───────────────┘
             │
             ▼ MCP stdio
  ┌──────────────────────────┐
  │  Mock MCP Server          │  ← 3 logistics tools, stdio transport
  │  get_shipments            │      same protocol as production MCP servers
  │  track_package            │
  │  get_inventory            │
  └──────────────────────────┘
```

---

## ✏️ Step 1: Explore the Live Traffic Log (5 min)

Start your server and send a few messages:

```bash
npm run dev
```

Open `localhost:3000` and try:

```
track PKG-4892
show my shipments
inventory WH-002
hello world
```

**Watch the dashboard** — for each message you should see 5 event cards appear:

| Card color | Event type | What it shows |
|---|---|---|
| Blue | `USER_MESSAGE` | The raw input |
| Gray | `LLM_THINKING` | The routing decision |
| Orange | `MCP_TOOL_CALL` | Tool name + arguments |
| Green | `MCP_TOOL_RESULT` | Raw result + latency in ms |
| Purple | `LLM_RESPONSE` | The formatted answer |

Now look at the audit log:

```bash
cat logs/traffic-audit.jsonl
```

Every event is there in structured JSON — the same format a SIEM (like Azure Sentinel) would ingest to detect anomalies.

> 🗣️ **Discussion:** Type "hello world" — notice only `USER_MESSAGE`, `LLM_THINKING`, and `LLM_RESPONSE` appear. No MCP cards. Why? The mock LLM correctly identified there was no tool to call.

---

## ✏️ Step 2: Enhance the Audit Log (5 min)

The current logger captures events but doesn't flag slow tool calls. Let's add latency alerting.

Open a **fresh** Agent Mode chat. Run:

```
/opsx:ff add-latency-alerting
```

> **Refresher:** `/opsx:ff` (fast-forward) generates all four OpenSpec artifacts (proposal, specs, design, tasks) in one shot and then implements them. It's the single-step version of the `/opsx:new` → `/opsx:continue` cycle you used in Module 02. Use it for small, well-scoped changes like this one.

Describe the change:

> _"Enhance `src/traffic-logger.ts` to emit a Pino WARN log whenever an MCP_TOOL_RESULT event has `latencyMs > 500`. The warn entry should include the toolName, latencyMs, and a message 'Slow tool call detected'. Add a unit test that verifies the warning fires above threshold and does not fire below it."_

Review the proposal. Then:

```
/opsx:apply
```

After implementing:

```bash
npm test
/opsx:archive
git add -A && git commit -m "Add latency alerting for slow MCP tool calls"
```

> **Timing fallback:** If `/opsx:ff` is taking more than 5 minutes, the core change is ~10 lines in `traffic-logger.ts` — add an `if (event.latencyMs > 500) logger.warn(...)` check. You can write it manually and still hit the learning objective.

> 💡 **Key insight:** This is ~10 lines of code. The pattern — structured log → threshold check → alert — is exactly how enterprise APM tools (Datadog, New Relic, Azure Monitor) detect degraded AI tooling in production.

---

## ✏️ Step 3: Connect VS Code to Your MCP Server (5 min)

Your mock MCP server speaks the same protocol as any production MCP server. Connect it to your AI assistant so Copilot can call your logistics tools directly.

Create `.vscode/mcp.json` in your project:

```json
{
  "servers": {
    "logistics-tools": {
      "command": "npx",
      "args": ["tsx", "src/mock-mcp-server.ts"]
    }
  }
}
```

Then:

1. **Reload VS Code** so it discovers the server:
   - Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows)
   - Type **"Reload Window"** → select **Developer: Reload Window**

2. In Copilot Agent Mode, ask:

   > _"Use the get_shipments tool to show me current shipments."_

3. Copilot calls your `get_shipments` tool via MCP — the same protocol your traffic inspector uses internally.

> 💡 **The loop closes here.** You built a tool that observes MCP traffic, and now your AI assistant is generating MCP traffic that you can observe. Every tool call Copilot makes appears in `traffic-audit.jsonl`.

### Archive & Commit

```
/opsx:archive
git add -A && git commit -m "Add VS Code MCP config for logistics tools"
```

---

## Stretch Goal: Swap in a Real LLM — only if ahead of schedule

> 📖 **Stretch Goal — only if ahead of schedule.** This replaces the mock LLM router with a real API call. Requires an OpenAI or Anthropic API key.

The mock LLM in `src/mock-llm.ts` uses keyword matching. The interface it exposes is:

```typescript
function routeMessage(message: string): LLMRouterResult
```

To swap in a real LLM:

1. Create `src/real-llm.ts` that calls the OpenAI or Anthropic API with the same tool definitions (`get_shipments`, `track_package`, `get_inventory`)
2. Export a `routeMessage` function with the same signature
3. In `src/server.ts`, replace `import { routeMessage } from "./mock-llm"` with `"./real-llm"`

The dashboard still works — the traffic log still shows all 5 event types — but now the routing decisions come from a real LLM. The architecture didn't change; only one module did.

---

## The Connection to Enterprise Observability

| Enterprise Playbook Layer | What's Already in Your App |
|---|---|
| **Traffic Logging** | `traffic-audit.jsonl` — structured log of every LLM↔MCP message |
| **Tool Call Auditing** | `toolName` + `toolArgs` + `latencyMs` on every call |
| **Anomaly Detection** | Latency alerting (after this module) → feed into a SIEM |
| **Real-time Visibility** | Live SSE dashboard — see anomalies as they happen, not in the next morning's report |

> 🗣️ **Discussion:** _"If this MCP server were connected to a real logistics database instead of mock data, what would you want the logger to capture that it doesn't today?"_
>
> (Answer: the actual data returned — but now you have a PII risk. This is where input/output sanitization and data masking come in.)

---

## Checkpoint

At this point you have:

- [x] A working MCP Traffic Inspector with live dashboard (Modules 1–3)
- [x] Full understanding of the 5-event MCP call chain
- [x] Enhanced audit logging with latency alerting
- [x] A `.vscode/mcp.json` config so your AI assistant can call your MCP tools directly
- [x] A clear extension point for swapping mock LLM → real LLM

You can now **see** exactly what your AI is doing when it uses MCP tools — in real time, with a structured audit trail.

---

> **Facilitator Note:**
> - **Timing:** Step 1 (5 min), Step 2 (5 min), Step 3 (5 min). The stretch goal is buffer — skip it if behind schedule.
> - **Common issue:** `.vscode/mcp.json` not picked up after creation. Solution: the participant must reload the VS Code window (Cmd+Shift+P → "Reload Window"), not just save the file.
> - **If Step 2 stalls:** The `/opsx:ff` workflow may take longer than expected for some participants. Direct them to the manual fallback (add the `if` check manually) to keep the group moving.

---

> **Next:** [05 — Add Testing](./05_Add_Testing.md)
