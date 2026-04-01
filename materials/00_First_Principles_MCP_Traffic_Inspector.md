# First Principles Analysis: MCP Traffic Inspector

## Problem & Goal

**Problem:** A developer cannot observe the real-time message exchange between an LLM and MCP-connected tools during active inference without specialized tooling.

**Goal:** The simplest possible local tool that makes every step of the LLM ↔ MCP conversation visible and triggerable by a human in real time.

---

## Source Materials

| Source | Type | Key Information |
|--------|------|-----------------|
| User prompt | Text description | Requires: chat input, live log, 5-step visualization (user msg → LLM routing → MCP call → MCP result → final response) |
| MCP specification | Protocol standard | JSON-RPC 2.0 over stdio/SSE/WebSocket; tool calls have defined `tools/call` message shape |
| LLM tool-use APIs | API contracts | Claude emits `tool_use` content blocks; OpenAI emits `tool_calls`; both are observable at HTTP response boundary |

---

## Assumptions Audit

### Identified Assumptions

| Assumption | Source | Status |
|------------|--------|--------|
| "Real-time" requires a streaming UI or web app | Problem framing | ❌ Challenged |
| Observation requires a network proxy between client and server | Conventional inspector tools (Charles, mitmproxy) | ❌ Challenged |
| "Single-line chat input" requires a web form or TUI framework | UI convention | ⚠️ Uncertain |
| Tool calls are strictly sequential | Problem description (step-by-step list) | ⚠️ Uncertain |
| "LLM routing decision" is a discrete, separable event | Problem framing | ❌ Challenged |
| The tool must support multiple LLM providers | Not stated; commonly assumed | ⚠️ Uncertain |
| A web browser is the right rendering target | Common for "dashboards" | ❌ Challenged |

### Challenged Assumptions

**"Observation requires a network proxy"**
> A proxy sits between two parties who don't know it's there. But here, *we control the client*. The client already sees every byte it sends and receives. Wrapping the client's send/receive calls is O(1) instrumentation with zero infrastructure overhead. A proxy is an analogy-driven solution imported from network debugging — it's unnecessary when you own the code.

**"'Real-time' requires a web app or streaming dashboard"**
> Real-time means the display updates *before the full loop completes* — i.e., you see the MCP call before the final LLM response arrives. A terminal that prints each step as it happens satisfies this. A browser adds a server, WebSocket, and build pipeline with zero observability benefit for a local dev tool.

**"LLM routing decision is a discrete, separable event"**
> The LLM does not emit a "I am now routing to a tool" signal. What you observe is: LLM response contains a `tool_use` block (Claude) or `tool_calls` array (OpenAI). The "routing decision" *is* the response — there is no intermediate signal to capture. The 5-step sequence in the problem is a logical model, not a protocol reality.

**"A web browser is the right rendering target"**
> Convention. A local dev tool runs in the terminal where the developer already is. `stdout` with ANSI color codes provides structured, readable, real-time output with zero setup. This satisfies all stated requirements.

---

## Fundamental Truths

1. **MCP is a defined protocol** — JSON-RPC 2.0; tool calls always have `method: "tools/call"` with `params.name` and `params.arguments`. The shape is immutable regardless of implementation.

2. **There are exactly two observable communication channels** — Client ↔ LLM API (HTTP/SSE) and Client ↔ MCP Server (stdio/SSE/WebSocket). All traffic inspector requirements reduce to logging these two channels.

3. **The agentic loop has a fixed structure** — Send message to LLM → receive response → if response contains tool call: execute tool via MCP → append result → repeat. If no tool call: done. This is a deterministic, finite state machine.

4. **Observation is only possible at a boundary you control** — You can observe at: (a) network proxy, (b) client library wrapper, or (c) the client itself. Option (c) has the least overhead because the client *is* the observer.

5. **LLM tool-use is fully visible at the API response boundary** — Every tool call decision manifests as structured data in the LLM's HTTP response. Nothing is hidden inside the model; the routing decision is encoded in the response payload.

6. **MCP SDK exists in TypeScript and Python** — Official SDKs handle protocol framing. You do not need to implement JSON-RPC from scratch. Wrapping the SDK's `client.callTool()` method is sufficient to intercept all MCP traffic.

7. **A terminal can render structured, real-time, multi-stream output** — ANSI escape codes provide color, indentation, and formatting. `readline` provides non-blocking single-line input. No additional dependencies required.

---

## First Principles Reasoning

### The two-channel reduction eliminates proxy complexity
The problem mentions 5 logical steps, but physically there are only 2 channels: LLM API and MCP. Every one of those 5 steps is a read or write on one of those two channels. If you log every read/write on both channels, you have a complete traffic inspector. This means: **wrap `anthropic.messages.create()` and `mcpClient.callTool()` — that's the entire interception surface.** No proxy, no middleware, no network tap.

### The agentic loop IS the inspector
Conventional network inspectors are passive — they watch traffic between two parties. But here, we *are* one of the parties (the client). Writing the agentic loop from scratch and emitting a log line at each step is architecturally equivalent to building a proxy, but with zero proxy complexity. The inspector is not a separate tool layered on top of the client — **the client IS the inspector.**

### "Real-time" is satisfied by synchronous stdout, not streaming infrastructure
Each step of the agentic loop is already synchronous (await LLM response → await MCP result). Printing to stdout after each `await` gives you real-time updates in the correct causal order with zero buffering. There is no race condition, no WebSocket, no event bus needed. The sequential nature of the loop is an asset, not a constraint to work around.

### Single-line input + live log don't conflict in a terminal
The assumption that you need a TUI framework (or a web app) to simultaneously accept input and display output is false. `readline.createInterface()` in Node.js (or Python's `input()` in async context) handles this. The log scrolls above the prompt. This is how `psql`, `node REPL`, and `gdb` work — they've solved this for 40 years.

### The 5-step visualization is a labeling problem, not a rendering problem
"User message → LLM routing decision → MCP tool call → MCP result → final response" — these are just labels for log lines. Each line gets a prefix: `[USER]`, `[LLM→]`, `[→MCP]`, `[MCP→]`, `[LLM]`. Color-coded, timestamped. This is 5 `console.log` calls with ANSI colors. There is no rendering engine required.

---

## Solution Space

### What Becomes Possible (challenged assumptions discarded)

- A **single TypeScript file** (~250 lines) that: connects to MCP server(s), runs the agentic loop, logs every step to stdout, accepts input via `readline`
- Zero build pipeline: run with `bun run inspector.ts` or `npx ts-node inspector.ts`
- Zero server: no Express, no WebSocket, no port to open
- Zero proxy: no `mitmproxy`, no Charles, no TLS certificate management
- Extensible: add new MCP servers by adding entries to a config object at the top of the file
- Portable: runs anywhere Node/Bun runs

### Practical Constraints

| Constraint | Type | Impact |
|------------|------|--------|
| Must observe both channels simultaneously | Hard | Requires being the client; cannot be a passive observer of someone else's session |
| LLM API key required | Hard | Must be in environment or config file |
| MCP server must be reachable | Hard | stdio servers must be spawned by the inspector; SSE servers must be running |
| Parallel tool calls (if LLM emits multiple at once) | Hard | Loop must handle `tool_use` arrays, not just single tool calls |
| Terminal width for log readability | Soft | Use `process.stdout.columns` to wrap long payloads |

---

## Recommended Approach

### Strategy

Build a single TypeScript CLI script using the official `@anthropic-ai/sdk` and `@modelcontextprotocol/sdk`. The script spawns or connects to MCP server(s), then enters a `readline` input loop. Each user message triggers the agentic loop: call Anthropic API → log response → if `tool_use` block present, call MCP tool → log result → repeat until final text. Every boundary crossing emits a color-coded, timestamped log line to stdout. No web server, no proxy, no build step beyond a `package.json`.

### Why This Over Alternatives

**Over a web app:** Eliminates a server process, WebSocket layer, React build, and port management — none of which add observability. The terminal is already open where the developer works.

**Over a network proxy:** Eliminates TLS interception, proxy configuration, and the need to modify the target application. Since we control the client, we ARE the client — observing from inside is simpler than intercepting from outside.

---

## Action Plan

| Priority | Action | Rationale | Owner | Timeline |
|----------|--------|-----------|-------|----------|
| 1 | Define config schema: LLM model, API key, MCP server(s) (stdio command or SSE URL) | Hard constraint: both channels must be reachable before the loop starts | Dev | 30 min |
| 2 | Implement MCP connection + tool discovery (`mcpClient.listTools()`) | Fundamental truth #6: SDK handles protocol; wrapping it is the interception point | Dev | 1 hr |
| 3 | Implement agentic loop with per-step stdout logging (color-coded, timestamped) | Insight: the loop IS the inspector; log lines are the visualization | Dev | 2 hr |
| 4 | Add `readline` input loop; connect user input to loop trigger | Fundamental truth #7: terminal handles input+output without a TUI framework | Dev | 30 min |
| 5 | Handle parallel tool calls (multiple `tool_use` blocks in one response) | Hard constraint: some LLMs emit multiple tool calls simultaneously | Dev | 1 hr |
| 6 | Add JSON pretty-print with truncation for large payloads | Soft constraint: terminal width limits readability of raw MCP arguments | Dev | 30 min |

---

## Open Questions & Risks

- **Which LLM provider?** The problem says "LLM" generically. Claude (Anthropic) is the natural fit given MCP's origin, but the loop structure differs slightly for OpenAI (`tool_calls` vs `tool_use`). Decision needed before step 3. *Resolution: design the loop abstraction to be provider-swappable via a thin adapter.*

- **MCP server transport:** stdio servers must be spawned by the inspector as child processes. SSE servers need a URL. The config schema must handle both. *Resolution: support both via a `transport: "stdio" | "sse"` field per server config.*

- **Streaming vs. non-streaming LLM responses:** Streaming gives faster time-to-first-log-line but complicates tool-use detection (must accumulate chunks). Non-streaming is simpler but adds latency before the first log line appears. *Resolution: start non-streaming; add streaming as an enhancement.*

- **Session persistence:** Should the conversation history persist across restarts? Not stated. *Resolution: in-memory only for v1; history is lost on exit. Log file can be added as an enhancement.*

---

**Synthesis:** The simplest solution that satisfies all fundamental truths is a ~250-line TypeScript script that *is* the client, wraps both SDK call sites, and prints to stdout. No proxy, no web app, no framework. The entire "traffic inspector" is an instrumented agentic loop running in a terminal.
