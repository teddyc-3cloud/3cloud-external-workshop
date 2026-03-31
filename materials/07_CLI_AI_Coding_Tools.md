# Module 7: CLI AI Coding Tool Landscape

**Time Allocation:** 15 minutes (20 minutes with buffer)
**Format:** Hands-On + Reference
**Purpose:** Landscape session for terminal-native AI coding tools — when to use each, how they compare, and how the same OpenSpec workflow maps across Copilot, Codex CLI, Claude Code, and OpenCode.

---

> **Workshop Navigation**
> **Previous:** [06 — Brownfield Experiment](./06_Brownfield_Experiment.md)

> **Skill Levels:** Already using one of these CLI tools daily? Compare your setup against the capability matrix below and identify gaps. New to CLI AI tools? Focus on the decision guide and the hands-on exercise — you'll install one tool and run a real workflow with it.

---

## Why This Matters

The workshop uses **GitHub Copilot Agent Mode** as its primary implementation tool — and that's the right choice for most VS Code-centric enterprise teams. But the AI coding tool landscape is broader, and different team contexts call for different tools:

- A platform engineer running automated tasks in a CI pipeline has no IDE
- A security-conscious team may need sandboxed execution before applying code changes
- A team standardizing on Anthropic models wants the same quality-gate hooks across every developer machine
- A developer debugging a Kubernetes cluster over SSH needs command-line assistance, not a GUI

**The key insight:** the workflow discipline — spec first, propose, review, implement, test, commit — is tool-agnostic. Any CLI coding tool can follow it. This module maps that workflow across four tools so your team can choose based on context, not familiarity.

---

## The Four CLI Tools at a Glance

| Tool | Maker | Type | Best Fit |
| ---- | ----- | ---- | -------- |
| **Codex CLI** | OpenAI | Full coding agent (CLI) | Maximum sandbox isolation, multi-provider models, open-source preference |
| **Claude Code** | Anthropic | Full coding agent (CLI) | Mature hooks/auto-correction, MCP workflows, Anthropic model teams |
| **Copilot CLI** (`copilot`) | GitHub | Full coding agent (CLI) | GitHub-native workflows, MCP-powered tasks, plan mode and parallel sub-agents |
| **OpenCode** | Community | Full coding agent (CLI) | BYO model, provider-agnostic, local/self-hosted LLMs |

> **Note:** The **GitHub Copilot CLI** is a standalone terminal coding agent (not the `gh copilot` extension). Install via `npm install -g @github/copilot` and invoke as `copilot`. See the [Copilot CLI profile](#github-copilot-cli-copilot) below.

---

## Tool Profiles

### Codex CLI (OpenAI)

**What it is:** An open-source, terminal-native coding agent from OpenAI. You give it a task in natural language; it reads your codebase, generates a plan, executes shell commands, and shows you a diff before applying changes.

**Install:**

```bash
npm install -g @openai/codex
```

**Key feature — Sandboxed execution:** Codex CLI offers the strongest sandbox isolation of any tool in this list. On macOS, it uses Apple Seatbelt (`sandbox-exec`) — a read-only jail except for `$PWD` and `$TMPDIR`, with all outbound network blocked. On Linux, it uses Docker with firewall rules denying all egress except the OpenAI API. The agent cannot modify your filesystem or run arbitrary commands until you explicitly approve the diff.

**Approval modes:**

| Mode | Behavior | Use case |
| ---- | -------- | -------- |
| `--approval-mode suggest` | Shows diff, waits for your approval | Default — safest |
| `--approval-mode auto-edit` | Applies file edits automatically, waits for commands | Faster iteration |
| `--approval-mode full-auto` | Fully automated | CI pipelines only |

**Lifecycle hooks:** Codex CLI has a full hooks system (implemented in the Rust rewrite): `session_start`, `pre_tool_use`, `post_tool_use`, `user_prompt_submit`, and `stop`. Hooks can approve, deny, or modify tool behavior — enabling the same automated quality gates as Claude Code.

**IDE integration:** Works with VS Code, Cursor, and Windsurf, plus a standalone desktop app (`codex app`).

**OpenSpec integration:** Codex CLI reads `AGENTS.md` in your project root (see `AGENTS.example.md` for the full workshop config). This file tells the agent which OpenSpec skills to use and when — so `/opsx:apply` in a Codex CLI session follows the same workflow as Copilot Agent Mode.

**Running the Module 3 workflow in Codex CLI:**

```bash
# Start a new session (equivalent to opening a fresh Copilot Agent Mode chat)
codex

# Inside the session — start the change (generates proposal first)
> Read spec.md and run /opsx:new rate-limit-monitor

# Review proposal.md, then generate each remaining artifact
> /opsx:continue
# Repeat /opsx:continue until all artifacts exist (specs, design, tasks)

# Review artifacts, then apply
> /opsx:apply

# Archive and commit
> /opsx:archive
```

```bash
git add -A && git commit -m "Task 1: Project setup + in-memory store"
```

**Models:** Defaults to `o4-mini`. Supports multiple providers via `--provider`: `openai` (default), `openrouter`, `azure`, `gemini`, `ollama`, `mistral`, `deepseek`, `xai`, `groq`, and any OpenAI-compatible endpoint.

**When to choose Codex CLI:**
- You need the strongest sandbox isolation before trusting AI-written code (Apple Seatbelt + Docker)
- You prefer open-source tooling you can inspect and contribute to
- You need a multi-provider agent that isn't locked to a single AI vendor
- You need a CLI agent for automated CI pipelines

---

### Claude Code (Anthropic)

**What it is:** Anthropic's terminal-native coding agent. Like Codex CLI, it reads your codebase and executes multi-file tasks — but its standout capability is the **hooks system**: shell commands that fire at lifecycle events in every AI session, enabling automated quality gates.

**Install:**

```bash
npm install -g @anthropic-ai/claude-code
```

**Sandboxed execution:** Claude Code has native OS-level sandboxing — bubblewrap on Linux and macOS Seatbelt — that restricts file access to the working directory and blocks network access. This reduces the blast radius of unreviewed AI actions without requiring a separate Docker setup.

**OpenSpec integration:** Claude Code reads `CLAUDE.md` in your project root (see `CLAUDE.example.md` for the workshop config). This file routes OpenSpec commands the same way `AGENTS.md` does for Codex CLI.

**Running the Module 3 workflow in Claude Code:**

```bash
# Start a new session
claude

# Start the change (generates proposal first)
> Read spec.md and run /opsx:new rate-limit-monitor

# Review proposal.md, then generate each remaining artifact
> /opsx:continue
# Repeat /opsx:continue until all artifacts exist (specs, design, tasks)

# Review artifacts, then apply
> /opsx:apply

# Archive and commit
> /opsx:archive
```

```bash
git add -A && git commit -m "Task 1: Project setup + in-memory store"
```

**The hook advantage:** Claude Code has the most mature native lifecycle hook system of any tool in this list. The Stop hook from Module 5 runs automatically after every response — no manual step required. This means your static analysis gates are enforced by the tool, not by discipline.

```
Copilot Agent Mode:   Edit → You manually run lint → Catch error → Fix
Codex CLI:            Edit → Hook can run lint → Claude sees error → Claude fixes
Claude Code:          Edit → Stop hook runs lint → Claude sees error → Claude fixes
```

See [Module 5 — Approach 3: Stop Hook](./05_Add_Testing.md#approach-3-claude-code-stop-hook--automated-static-analysis) for the full hook configuration.

**Additional capabilities of Claude Code:**

| Feature | What it does |
| ------- | ------------ |
| **Plan mode** | Forces design-before-code discipline — the agent writes a plan and waits for approval before any file edits |
| **Skills** | Reusable prompt scripts (e.g., `e2e-test`, `commit`) stored in `~/.claude/skills/` |
| **Sub-agents** | Parallel isolated sessions within a single task — analogous to `#runSubagent` in Copilot |
| **MCP integration** | Native client for any MCP server — tool calls from your codebase work out of the box |

**IDE integration:** Official VS Code extension (from the Visual Studio Marketplace) and a JetBrains plugin (Beta) supporting IntelliJ, PyCharm, WebStorm, and others. Both open proposed edits in the IDE diff viewer.

**Models:** Uses Anthropic API (`ANTHROPIC_API_KEY`). Defaults to Claude Sonnet 4.6. Pass `--model claude-opus-4-6` for complex tasks. Also supports AWS Bedrock and Google Vertex AI.

**When to choose Claude Code:**
- You want the most mature automated quality hooks that self-correct without manual re-prompting
- Your team uses MCP servers and needs the AI to call them natively
- You want Plan mode to enforce review-before-implementation
- Your team uses Anthropic models

---

### GitHub Copilot CLI (`copilot`)

**What it is:** A standalone terminal coding agent from GitHub. You describe a task in natural language; it reads your codebase, writes multi-file changes, runs tests and shell commands, and reports results — all from the terminal. It is GitHub-native: it ships with the GitHub MCP server built-in and works directly with your issues and pull requests.

**Install:**

```bash
npm install -g @github/copilot
# or
curl -fsSL https://gh.io/copilot-install | bash
```

**Key capabilities:**

| Feature | What it does |
| ------- | ------------ |
| **Plan mode (`/plan`)** | Outlines the work and waits for approval before executing any changes |
| **Sub-agents (`/fleet`)** | Run the same task across multiple sub-agents in parallel for broad refactors or research |
| **Model switching (`/model`)** | Switch between models from Anthropic, Google, and OpenAI mid-session |
| **GitHub integration** | Native MCP support for working with issues, branches, and pull requests; `/delegate` creates branches and PRs |
| **MCP integration** | Ships with GitHub MCP server built-in; configure custom MCP servers for additional tools |

**Running the Module 3 workflow in Copilot CLI:**

```bash
# Start a new session
copilot

# Start the change (generates proposal first)
> Read spec.md and run /opsx:new rate-limit-monitor

# Review proposal.md, then generate each remaining artifact
> /opsx:continue
# Repeat /opsx:continue until all artifacts exist (specs, design, tasks)

# Review artifacts, then apply
> /opsx:apply

# Archive and commit
> /opsx:archive
```

```bash
git add -A && git commit -m "Task 1: Project setup + in-memory store"
```

**When to choose Copilot CLI:**
- Your team is GitHub-native and wants AI tooling that integrates directly with GitHub issues, PRs, and MCP
- You need a terminal agent outside VS Code but want to stay in the GitHub ecosystem
- You want plan mode (`/plan`) and parallel sub-agents (`/fleet`) for broad exploration tasks
- You want multi-model flexibility (Anthropic, Google, OpenAI) with GitHub auth and governance

---

### OpenCode

**What it is:** A terminal-native AI coding agent that is provider-agnostic — it works with OpenAI, Anthropic, Google Gemini, local models via Ollama, and any OpenAI-compatible endpoint. With 132K+ GitHub stars (March 2026), it is one of the most widely adopted open-source coding agents.

**Install:**

```bash
npm install -g opencode-ai
```

**Key differentiator — provider flexibility:**

```bash
# OpenAI
OPENAI_API_KEY=... opencode

# Anthropic
ANTHROPIC_API_KEY=... opencode --model anthropic/claude-sonnet-4-6

# Local (Ollama)
opencode --model ollama/qwen2.5-coder:32b
```

**Additional capabilities:**

| Feature | What it does |
| ------- | ------------ |
| **Plan agent** | Built-in Plan agent with read-only permissions — outlines work and waits for approval before edits |
| **Plugin hooks** | JS/TS plugin system with hooks (e.g., `session.compacting`) for lifecycle automation |
| **Sub-agents** | Custom agent definitions in config; multiple agents can run for parallel tasks |
| **VS Code extension** | Official extension (`sst-dev.opencode`) for IDE-embedded sessions |

**Config file:** OpenCode reads `opencode.json` (or `.jsonc`) from the project root. Global config lives at `~/.config/opencode/opencode.json`.

**When to choose OpenCode:**
- Your organization requires self-hosted or on-premises LLMs (Azure OpenAI, Ollama, LM Studio)
- You want to experiment with different models without switching tools
- Cloud LLM usage is restricted by policy and you need a local option
- You want open-source tooling that isn't locked to a single AI provider

---

## Capability Comparison Matrix

| Capability | Copilot Agent Mode | Codex CLI | Claude Code | Copilot CLI | OpenCode |
| ---------- | ------------------ | --------- | ----------- | ----------- | -------- |
| Full coding agent (multi-file) | Yes | Yes | Yes | Yes | Yes |
| Sandboxed execution | Yes (terminal sandbox, macOS/Linux) | Yes (Seatbelt/Docker) | Yes (bubblewrap/seatbelt) | No (direct) | No (direct) |
| Lifecycle hooks | Yes | Yes (session_start, pre_tool_use, post_tool_use, stop) | Yes (Stop, PreToolUse, etc.) | No | Yes (plugin system) |
| Plan mode | Yes | Yes | Yes | Yes (Shift+Tab) | Yes (Plan agent) |
| Sub-agents / parallel tasks | Yes (`#runSubagent`) | Yes | Yes | Yes (`/fleet`) | Yes |
| MCP client integration | Yes | Yes (native) | Yes (native) | Yes (native, GitHub MCP built-in) | Yes |
| OpenSpec via config file | `copilot-instructions.md` | `AGENTS.md` | `CLAUDE.md` | `AGENTS.md` | `opencode.json` |
| Model flexibility | GitHub-managed | Multi-provider (OpenAI, Gemini, Ollama, Mistral, Azure, etc.) | Anthropic models (Bedrock/Vertex supported) | Multi-model (Anthropic, Google, OpenAI) | Any provider |
| Open source | No | Yes | No | No | Yes |
| IDE integration | Deep (VS Code native) | Yes (VS Code, Cursor, Windsurf) | Yes (VS Code, JetBrains) | No | Yes (VS Code extension) |

---

## Workflow Equivalence: Module 3 Across Tools

The **One Task = One Session = One Commit** discipline from Module 3 applies regardless of tool. Here's what each step looks like:

| Workflow Step | Copilot Agent Mode | Codex CLI | Claude Code | Copilot CLI |
| ------------- | ------------------ | --------- | ----------- | ----------- |
| **Start fresh session** | Open new Agent Mode chat | `codex` (new invocation) | `claude` (new invocation) | `copilot` (new invocation) |
| **Propose (simple)** | `/opsx:ff <name>` in chat | `> /opsx:ff <name>` | `> /opsx:ff <name>` | `> /opsx:ff <name>` |
| **Propose (complex)** | `/opsx:new <name>` then `/opsx:continue` | `> /opsx:new <name>` then `> /opsx:continue` | `> /opsx:new <name>` then `> /opsx:continue` | `> /opsx:new <name>` then `> /opsx:continue` |
| **Review artifacts** | Open files in VS Code editor | Open files in editor / terminal pager | Open files in editor / terminal pager | Open files in editor / terminal pager |
| **Apply (implement)** | `/opsx:apply` in chat | `> /opsx:apply` | `> /opsx:apply` | `> /opsx:apply` |
| **Static check** | Hooks or re-prompt | Hook or manual (`npm run lint`) | Automatic (Stop hook fires) | Manual (`npm run lint`) or `/plan` re-review |
| **Archive** | `/opsx:archive` in chat | `> /opsx:archive` | `> /opsx:archive` | `> /opsx:archive` |
| **Commit** | `git add -A && git commit` | `git add -A && git commit` | `git add -A && git commit` | `git add -A && git commit` |

> 💡 The OpenSpec commands (`/opsx:ff`, `/opsx:new`, `/opsx:continue`, `/opsx:apply`, `/opsx:archive`) work identically across all four — the tool reads its config file (`copilot-instructions.md`, `AGENTS.md`, `CLAUDE.md`, `opencode.json`) and routes to the right skill. **The workflow is the constant. The tool is the variable.**

---

## Decision Guide: Choosing Your Tool

```
Start here
    │
    ▼
Are you working inside VS Code?
    │
    ├── Yes ──▶ GitHub Copilot Agent Mode
    │           (deep IDE integration, sub-agents, hooks, GitHub ecosystem)
    │
    └── No ──▶ Is GitHub ecosystem integration your top priority?
                    │
                    ├── Yes ──▶ Copilot CLI
                    │           (GitHub-native, MCP-powered, /plan mode, /fleet sub-agents, multi-model)
                    │
                    └── No ──▶ Do you need maximum sandbox isolation?
                                    │
                                    ├── Yes ──▶ Codex CLI
                                    │           (Apple Seatbelt + Docker, strongest isolation, open-source, multi-provider)
                                    │
                                    └── No ──▶ Do you need the most mature auto-correcting hook system?
                                                    │
                                                    ├── Yes ──▶ Claude Code
                                                    │           (Stop hook = lint/typecheck after every edit, MCP native, Anthropic models)
                                                    │
                                                    └── No ──▶ Do you need local/self-hosted LLMs?
                                                                    │
                                                                    ├── Yes ──▶ OpenCode
                                                                    │           (BYO model, Ollama, open-source)
                                                                    │
                                                                    └── No ──▶ Any of Codex CLI, Claude Code, or OpenCode
                                                                                (choose based on model preference and team convention)
```

> **Note on converging capabilities:** As of early 2026, hooks, plan mode, sub-agents, MCP support, and sandboxed execution have become broadly available across tools (see matrix). Differentiation now lives in _maturity_ (Claude Code has the most battle-tested hook system), _isolation depth_ (Codex CLI uses kernel-level sandboxing — the strongest of the three tools that support it), and _ecosystem fit_ (Copilot CLI for GitHub-native teams with its `/delegate` PR workflow, OpenCode for self-hosting).

---

## Config File Reference

Each tool reads a project-level config file that encodes your workflow rules. The workshop provides example configs for both major coding agents:

| Tool | Config File | Workshop Example |
| ---- | ----------- | ---------------- |
| GitHub Copilot Agent Mode | `.github/copilot-instructions.md` | _(inline in VS Code workspace)_ |
| Copilot CLI | `AGENTS.md` | _(same as Codex CLI — copy `AGENTS.example.md`)_ |
| Codex CLI | `AGENTS.md` | [`AGENTS.example.md`](./AGENTS.example.md) |
| Claude Code | `CLAUDE.md` | [`CLAUDE.example.md`](./CLAUDE.example.md) |
| OpenCode | `opencode.json` | _(customize from Codex CLI template)_ |

To use the OpenSpec workflow with Codex CLI: copy `AGENTS.example.md` to `AGENTS.md` in your project root.

To use the OpenSpec workflow with Claude Code: copy `CLAUDE.example.md` to `CLAUDE.md` in your project root.

---

## Hands-On: Try a New CLI Tool (5 min)

Pick **one** CLI tool from this module that you haven't used before. Install it and run a single command against your MCP Traffic Inspector project:

**Option A — Install Codex CLI and explore your project:**
```bash
npm install -g @openai/codex
codex
> Explain the architecture of this project in one paragraph
```

**Option B — Install Claude Code and run a quick check:**
```bash
npm install -g @anthropic-ai/claude-code
claude
> Read tasks.md and tell me which tasks are marked complete
```

**Option C — Install OpenCode with a different provider:**
```bash
npm install -g opencode-ai
opencode
> List all TypeScript files in src/ and summarize their exports
```

**Option D — Install Copilot CLI and run a plan:**
```bash
npm install -g @github/copilot
copilot
> /plan fix any open TODO in the codebase
```

The point is not to master the tool in 5 minutes — it's to prove that the workflow you've practiced all day is portable. The commands, the specs, and the discipline transfer. The tool is just the variable.

---

## The Key Takeaway

> **The workflow is the constant. The tool is the variable.** The OpenSpec commands (`/opsx:ff`, `/opsx:new`, `/opsx:apply`, `/opsx:archive`) work identically across Copilot Agent Mode, Codex CLI, Claude Code, and Copilot CLI. The spec-first discipline you practiced today doesn't lock you into any single tool — it works with whatever your team adopts next.


> **Previous:** [06 — Brownfield Experiment](./06_Brownfield_Experiment.md)
