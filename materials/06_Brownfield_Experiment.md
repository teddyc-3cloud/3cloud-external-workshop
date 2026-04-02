# Module 6: Brownfield Experiment — Reverse-Spec Legacy Code

**Time Allocation:** 20 minutes (25 minutes with buffer)
**Format:** Hands-On Workshop



## What You've Built So Far

Before diving into brownfield work, here's the complete MCP Traffic Inspector you built across Modules 1-5:
(it will be something similar - cannot be exactly the same, as our specification didn't explicitly enforced structure)

```
mcp-traffic-inspector/
├── spec.md                         ← First-principles specification (Module 1-2)
├── openspec/
│   ├── specs/                      ← Living documentation (Module 2-3)
│   └── changes/                    ← Archived change history
├── public/
│   └── index.html                  ← Live traffic dashboard (Module 3)
├── src/
│   ├── types.ts                    ← TrafficEvent, Shipment, InventoryItem (Module 3)
│   ├── mock-data.ts                ← Logistics data generators (Module 3)
│   ├── mock-mcp-server.ts          ← MCP server: 3 logistics tools (Module 3)
│   ├── mock-llm.ts                 ← Pattern router: chat → tool calls (Module 3)
│   ├── mcp-client.ts               ← Spawns MCP subprocess via stdio (Module 3)
│   ├── traffic-logger.ts           ← Pino + circular buffer + SSE pub/sub (Module 3-4)
│   └── server.ts                   ← Express: /api/chat, /api/traffic, /api/tools (Module 3)
├── logs/
│   └── traffic-audit.jsonl         ← Full LLM-MCP audit trail (Module 4)
├── tests/
│   └── tools-api.spec.ts           ← Playwright E2E test (Module 5)
├── .claude/
│   └── settings.json               ← Stop hook configuration (Module 5)
└── .vscode/
    └── mcp.json                    ← AI assistant MCP config (Module 4)
```

In Modules 2-5, you built everything from scratch with full specs. Now you'll apply those same skills to the real world — where the code already exists and the docs don't.

---

## Learning Objectives

Real dev work isn't always greenfield. Most of the time, you're modifying code someone else wrote — with no documentation. In this module, you'll learn:

1. The **Reverse-Spec Playbook** — use AI to _understand before you change_.
2. **Sub-Agents & CLI Analysis** — spin up parallel, context-isolated AI sessions to analyze legacy code from multiple angles simultaneously using **Copilot Agent Mode** (`#runSubagent` + plan mode), **Claude Code** (Agent tool + plan mode + sandbox), **Copilot CLI** (terminal-native agent with parallel sub-agents + plan mode), or **Codex CLI** (sequential sandboxed analysis).
3. **Seeding OpenSpec from a reverse spec** — convert discovery output into a living baseline, then iterate with `/opsx:ff` (simple changes) or `/opsx:new` (complex refactors) over time.

---

## The Brownfield Problem

You're assigned to modify a 15-year-old shipping label generator. No docs. The original author is gone. The code is 3,000 lines of undocumented logic.

You _cannot_ just tell Copilot "add a barcode" — it lacks holistic context of the edge cases.

**The Rule:** Do not write code first. Write specs first.

---

## Sub-Agents & CLI Analysis: Multiple Tool Approaches

A single chat trying to analyze 3,000 lines of legacy code will hit context limits and start hallucinating. The solution is to **split the analysis into focused, parallel tasks** — each with clean context. Different tools achieve this differently:

### Approach A: Copilot Agent Mode (`#runSubagent` + Plan Mode)

GitHub Copilot's `#runSubagent` command (VS Code v1.107+) spins up an **isolated AI session** with its own context. It does its work, then returns only the final result to your main chat. Copilot Agent Mode also supports **plan mode** — review the AI's analysis strategy before executing.

- Sub-agents execute in **parallel** with clean context (no cross-contamination)
- Only the distilled findings come back, not the intermediate reasoning

```
  Main Agent Mode Chat
       │
       ├──▶ #runSubagent 1: Business Logic Extractor
       │         └──▶ Returns: business rules, edge cases
       │
       ├──▶ #runSubagent 2: Dependency & Security Auditor
       │         └──▶ Returns: deps, risks, tech debt
       │
       └──▶ #runSubagent 3: Test Coverage Analyzer
                 └──▶ Returns: untested paths, test gaps
       │
       ▼
  Consolidated reverse_spec.md
```

### Approach B: Claude Code (Sub-Agents + Plan Mode + Sandbox)

Claude Code's **Agent tool** launches isolated sub-agents — analogous to `#runSubagent`. Key differentiators: **plan mode** forces you to design your analysis strategy _before_ executing, and **sandbox mode** runs analysis in an isolated environment so the AI cannot modify your legacy files during exploration.

**The flow:**

```
  claude (plan mode)
       │
       ▼
  Design analysis plan → User approves
       │
       ▼
  Agent 1: Business Analyst ─────┐
  Agent 2: Security Engineer ────┼──▶ (parallel execution)
  Agent 3: QA Engineer ──────────┘
       │
       ▼
  Consolidated reverse_spec.md
```

**Why plan mode matters for brownfield:**
- You review the AI's analysis strategy _before_ it reads the code
- Prevents the AI from making assumptions about undocumented systems
- You can adjust the focus areas (e.g., "focus on the fee calculation, not the UI code") before wasting context

### Approach C: Codex CLI (Sequential Analysis + Sandbox)

Codex CLI lacks native sub-agents, but compensates with **sandboxed execution**: all analysis runs inside Docker/macOS Sandbox, so the AI physically _cannot_ modify your legacy files during analysis.

**The flow:**

```
  codex (--approval-mode suggest)
       │
       ├──▶ Prompt 1: Business Analyst role → Returns rules
       ├──▶ Prompt 2: Security Engineer role → Returns risks
       └──▶ Prompt 3: QA Engineer role → Returns test gaps
       │
       ▼
  Consolidated reverse_spec.md
```

**The sandbox advantage:** When analyzing legacy code with unknown side effects, the sandbox guarantees the AI cannot accidentally modify files, run destructive scripts, or execute embedded commands found in the codebase.

### Approach D: Copilot CLI

Copilot CLI (`copilot`) is GitHub's **terminal-native agentic coding tool** — the same agentic harness that powers the Copilot coding agent, running directly in your terminal. Like Claude Code, it can read your codebase, spawn parallel sub-agents, generate multi-file changes, and operate in plan mode. It ships with GitHub's MCP server by default and authenticates with your existing GitHub account.

```bash
# Launch Copilot CLI in plan mode (review strategy before executing):
copilot
# Then press Shift+Tab to toggle into plan mode

# Or use @ to attach files directly:
# @legacy_calculator.js analyze this file...
```

**Key capabilities for brownfield analysis:**
- **Parallel sub-agents** — Use `/fleet` to enable fleet mode, then the Task tool spawns `explore`, `task`, `general-purpose`, and `code-review` agents that run in parallel with isolated context
- **Plan mode** — Press `Shift+Tab` to cycle into plan mode; review the AI's analysis strategy before it executes
- **File access** — Use `@` to mention and attach files directly into context
- **MCP extensibility** — Ships with GitHub's MCP server; add custom MCP servers for additional tool integrations
- **Full control** — Preview every action before execution; nothing happens without your approval

Use Copilot CLI when you want a **terminal-first, GitHub-integrated** agentic workflow without leaving the command line.

### Brownfield Tool Comparison

| Capability | Copilot Agent Mode | Claude Code | Codex CLI | Copilot CLI |
| --- | --- | --- | --- | --- |
| Parallel sub-agents | Yes (`#runSubagent`) | Yes (Agent tool) | No (sequential) | Yes (Task tool + `/fleet`) |
| Agent team (multi-agent collaboration) | No | Yes (TeamCreate) | No | No |
| Plan mode (review-before-action) | Yes | Yes | No | Yes (`Shift+Tab`) |
| Sandboxed execution | No | Yes (Bash tool sandbox) | Yes (Docker/Sandbox) | No |
| Reads codebase | Yes | Yes | Yes | Yes |
| MCP support | Yes | Yes | No | Yes (built-in GitHub MCP) |
| Brownfield role | Primary analysis | Primary analysis | Primary analysis | Primary analysis |

### The Common Output

Regardless of which tool you use, the output feeds the same downstream workflow:

```
  Consolidated reverse_spec.md
       │
       ▼
  Seed openspec/specs/  ──▶  /opsx:ff or /opsx:new  ──▶  /opsx:apply  ──▶  /opsx:archive
  (baseline from reverse       (simple: all artifacts      (implement)       (merge delta
   spec output)                 at once; complex: one                         into specs)
                                artifact at a time)                                │
       ◄──────────────────────────── next change ───────────────────────────────┘
```

---

## The Reverse-Spec Playbook

```
 Scan & Extract     ──▶ Review Baseline ──▶ Seed OpenSpec  ──▶ Propose Change ──▶ Implement ──▶ Archive
 (Sub-agents analyze     (Human verifies    (Convert to         (OpenSpec         (AI writes     (Merge delta
  legacy code in          the spec)          baseline specs)     delta proposal)   code)          into specs)
  parallel)                                                                                         │
                                                                                                    ▼
                                                                                             Repeat: propose
                                                                                             next feature...
```

---

## ✏️ Hands-On Exercise: Reverse-Spec a Legacy Module (20 min)

### Step 1: Choose Your Target

Either:

- Pull a single, complicated legacy file from your actual work repo, OR
- Use the workshop's included `legacy_calculator.js` file (located at `Assets/01-Tooling-and-Dev/legacy_calculator.js` in the workshop repo). Copy it into your working directory:

```bash
cp /path/to/workshop/Assets/01-Tooling-and-Dev/legacy_calculator.js ./legacy_calculator.js
```

### Step 2: Launch Your Analysis (Pick Your Tool)

Choose the approach that matches your tool. All four produce the same output: a consolidated `reverse_spec.md`.

> **First time with AI agents?** Start with **Claude Code** (Approach B) or **Copilot CLI** (Approach D) — both have plan mode that forces you to review the analysis strategy before executing, which is the safest path when you're still building intuition for how AI agents work. **Copilot Agent Mode** (Approach A) also supports plan mode and is the natural choice if you're using VS Code exclusively.

> 💡 **Predefined agents as a shortcut:** Instead of writing detailed agent role descriptions from scratch, you can drop pre-built agent definitions into your project's config folder (`.claude/`, `.codex/`, `.github/`). Open-source repos like [agency-agents](https://github.com/msitarzewski/agency-agents) provide ready-made personas (Business Analyst, Security Engineer, QA Engineer, etc.) that you can import directly. This saves time and gives you battle-tested role prompts.

#### If using Copilot Agent Mode (VS Code)

1. Open VS Code with GitHub Copilot. Ensure you're in **Agent Mode**.
2. Attach the legacy file using `#file`.
3. Run **three sub-agents in a single prompt** — they execute in parallel:

```
I need to reverse-engineer #file:legacy_calculator.js before modifying it.
Launch three parallel analyses:

#runSubagent Act as a Business Analyst. Analyze #file:legacy_calculator.js.
Extract every business rule and edge-case validation as a numbered list.
For each rule, note which line(s) implement it.
Return ONLY the numbered list, nothing else.

#runSubagent Act as a Security Engineer. Analyze #file:legacy_calculator.js.
List: 1) All external dependencies. 2) Any security risks (injection,
unsanitized input, etc.). 3) Tech debt items (dead code, deprecated APIs).
Return a structured summary, nothing else.

#runSubagent Act as a QA Engineer. Analyze #file:legacy_calculator.js.
Identify: 1) Which functions have no error handling.
2) Which code paths are hardest to test and why.
3) Suggested test cases for full coverage.
Return a structured summary, nothing else.

Once all three sub-agents return, consolidate their findings into
a single document called reverse_spec.md with sections:
## Business Rules, ## Dependencies & Risks, ## Test Coverage Gaps.
```

> 💡 **What just happened?** Three isolated AI sessions analyzed the same file from different angles — simultaneously. Each sub-agent had clean context (no cross-contamination), and only the distilled results came back to your main chat.

#### If using Claude Code (Terminal)

1. Start Claude Code in **plan mode** — this forces you to review the analysis strategy before executing:

```bash
claude --permission-mode plan
```

Or press `Shift+Tab` after launching `claude` to toggle plan mode interactively.

2. Describe what you want to analyze. Claude will draft a plan showing how it will split the analysis. **Review and approve the plan** before it touches the code.

3. After approval, Claude launches **three parallel sub-agents** via the Agent tool:

```
I need to reverse-engineer legacy_calculator.js before modifying it.

Launch three parallel agents to analyze this file:

Agent 1 (Business Analyst): Read legacy_calculator.js. Extract every
business rule and edge-case validation as a numbered list. For each rule,
note which line(s) implement it. Return ONLY the numbered list.

Agent 2 (Security Engineer): Read legacy_calculator.js. List:
1) All external dependencies. 2) Any security risks (injection,
unsanitized input, etc.). 3) Tech debt items (dead code, deprecated APIs).
Return a structured summary.

Agent 3 (QA Engineer): Read legacy_calculator.js. Identify:
1) Which functions have no error handling.
2) Which code paths are hardest to test and why.
3) Suggested test cases for full coverage.
Return a structured summary.

Once all three agents return, consolidate their findings into
reverse_spec.md with sections:
## Business Rules, ## Dependencies & Risks, ## Test Coverage Gaps.
```

> 💡 **Plan mode advantage:** You reviewed the AI's analysis strategy _before_ it consumed context reading 3,000 lines of legacy code. If the plan was wrong (e.g., focusing on the wrong module), you caught it before wasting time.

#### If using Codex CLI (Terminal)

1. Start Codex CLI in suggest mode (the default — shows diffs, waits for approval):

```bash
codex
```

2. Run **three sequential prompts**, each focused on one analysis angle. Codex CLI doesn't have sub-agents, but the sandbox ensures it can't accidentally modify the legacy file:

```
> Act as a Business Analyst. Read legacy_calculator.js. Extract every
  business rule and edge-case validation as a numbered list. For each rule,
  note which line(s) implement it. Write the output to reverse_spec_rules.md.
```

```
> Act as a Security Engineer. Read legacy_calculator.js. List:
  1) All external dependencies. 2) Any security risks. 3) Tech debt items.
  Write the output to reverse_spec_risks.md.
```

```
> Act as a QA Engineer. Read legacy_calculator.js. Identify:
  1) Functions with no error handling. 2) Hardest-to-test code paths.
  3) Suggested test cases. Write the output to reverse_spec_tests.md.
```

```
> Consolidate reverse_spec_rules.md, reverse_spec_risks.md, and
  reverse_spec_tests.md into a single reverse_spec.md with sections:
  ## Business Rules, ## Dependencies & Risks, ## Test Coverage Gaps.
```

> 💡 **Sandbox advantage:** All four prompts ran inside Docker/macOS Sandbox. Even if the legacy file contained executable code or destructive scripts, the AI couldn't run them or modify your original files.

#### If using Copilot CLI (Terminal)

1. Launch Copilot CLI and toggle into **plan mode** — this forces you to review the analysis strategy before executing:

```bash
copilot
```

Then press `Shift+Tab` to cycle into plan mode.

2. Use `@` to attach the legacy file and describe your analysis. Copilot CLI will draft a plan showing how it will split the analysis. **Review and approve the plan** before it touches the code.

3. After approval, Copilot CLI launches **parallel sub-agents** via the Task tool (enable `/fleet` for parallel execution):

```
I need to reverse-engineer @legacy_calculator.js before modifying it.

Launch three parallel agents to analyze this file:

Agent 1 (Business Analyst): Read legacy_calculator.js. Extract every
business rule and edge-case validation as a numbered list. For each rule,
note which line(s) implement it. Return ONLY the numbered list.

Agent 2 (Security Engineer): Read legacy_calculator.js. List:
1) All external dependencies. 2) Any security risks (injection,
unsanitized input, etc.). 3) Tech debt items (dead code, deprecated APIs).
Return a structured summary.

Agent 3 (QA Engineer): Read legacy_calculator.js. Identify:
1) Which functions have no error handling.
2) Which code paths are hardest to test and why.
3) Suggested test cases for full coverage.
Return a structured summary.

Once all three agents return, consolidate their findings into
reverse_spec.md with sections:
## Business Rules, ## Dependencies & Risks, ## Test Coverage Gaps.
```

> 💡 **Plan mode advantage:** You reviewed the AI's analysis strategy _before_ it consumed context reading 3,000 lines of legacy code. If the plan was wrong (e.g., focusing on the wrong module), you caught it before wasting time. Copilot CLI's plan mode works identically to Claude Code's — press `Shift+Tab` to toggle it on or off.

### Step 3: Review the Consolidated Output

Read `reverse_spec.md`. Check each sub-agent's findings:

| Sub-Agent             | What to verify                                                                                    |
| --------------------- | ------------------------------------------------------------------------------------------------- |
| **Business Analyst**  | Did it catch all the edge cases? Compare the numbered rules against the actual code line-by-line. |
| **Security Engineer** | Did it flag real risks, or hallucinate vulnerabilities that don't exist?                          |
| **QA Engineer**       | Are the suggested test cases actually meaningful? Would they catch regressions?                   |

> **Watch for hallucinated business rules.** A common failure: the Business Analyst sub-agent reports "Rule 7: Negative results are clamped to zero" — but line 142 of the legacy code actually returns negative values as-is. The AI inferred a clamping rule that doesn't exist because it _expected_ one. Always verify sub-agent findings against the actual code line-by-line. If a rule cites a line number, read that line. If no line is cited, the rule may be invented.

> **What Good Review Looks Like:**
> - Every business rule cites specific line numbers in the source — check at least 3 of them
> - Security risks are real, not generic boilerplate ("uses eval" is a real finding; "could be vulnerable to injection" without specifics is not)
> - Test case suggestions map to actual code paths, not hypothetical scenarios
> - No business rules appear that contradict what the code actually does

> 🔑 **Key insight:** AI is better at _understanding_ than _generating_. By splitting the analysis across sub-agents, each one stays focused and you get higher-quality results than a single monolithic prompt.

### Why Sub-Agents Beat a Single Prompt

| Approach              | Risk                                            | Result                  |
| --------------------- | ----------------------------------------------- | ----------------------- |
| Single long prompt    | Context overload → hallucinations, missed rules | Unreliable spec         |
| 3 parallel sub-agents | Each focused, isolated, returns only findings   | Higher accuracy, faster |

### Step 4: Seed OpenSpec With the Reverse Spec (The Bridge)

This is the critical step. Your `reverse_spec.md` is a _discovery document_ — it needs to become OpenSpec's **source of truth** so the AI builds on it for every future change.

**4a. Initialize OpenSpec (if not already done):**

```bash
openspec init --tools github-copilot
```

This creates the OpenSpec folder structure:

```
openspec/
├── specs/           # Source of truth (empty right now)
├── changes/         # Proposed changes go here
└── config.yaml      # Project configuration
```

**4b. Ask the AI to convert `reverse_spec.md` into OpenSpec baseline specs:**

```
I've reverse-engineered our legacy calculator and documented it in
#file:reverse_spec.md.

Convert this into OpenSpec baseline specs. For each business rule
in the "Business Rules" section, create a formal requirement with
Given/When/Then scenarios. Organize into:
- openspec/specs/calculator/spec.md (core logic)
- openspec/specs/validation/spec.md (input validation & edge cases)

Use the rules and edge cases from the reverse spec verbatim — do NOT
infer new behavior.
```

**What you should see created:**

```
openspec/specs/
├── calculator/
│   └── spec.md       # Core arithmetic: add, subtract, multiply, divide
└── validation/
    └── spec.md       # Input validation, division by zero, overflow handling
```

**Example of a generated baseline spec** (`openspec/specs/calculator/spec.md`):

```markdown
# Calculator Specification

## Purpose

Core arithmetic operations for the legacy calculator module.

## Requirements

### Requirement: Division Operation

The system SHALL perform division and handle edge cases.

#### Scenario: Division by zero

- GIVEN a division operation
- WHEN the divisor is zero
- THEN the system returns an error message "Cannot divide by zero"
- AND no calculation is performed

#### Scenario: Floating point division

- GIVEN two integers that don't divide evenly
- WHEN division is performed
- THEN the result is returned as a float with up to 10 decimal places
```

> 🔑 **Why this matters:** OpenSpec's `specs/` folder is now the AI's "memory" of how this legacy code works. Every future change is proposed as a **delta** against this baseline — the AI knows what exists and what's changing.

**4c. Add project context** (optional but recommended):

Edit `openspec/config.yaml` to give the AI persistent context about the legacy codebase:

```yaml
schema: spec-driven

context: |
  This is a legacy calculator module (~3,000 lines, no original docs).
  Language: JavaScript (ES5, no modules)
  Key constraint: backward compatibility — existing callers must not break.
  Testing: No existing tests. All new code must include tests.
```

**4d. Commit the baseline:**

```bash
git add openspec/ && git commit -m "Brownfield: baseline specs from reverse-engineered legacy calculator"
```

> 💡 **This is your time-zero snapshot.** Every spec change going forward is tracked as a delta against this commit.

---

### Step 5: Propose Your First Feature (OpenSpec)

Now use OpenSpec to propose a modification _on top of the baseline_:

```
/opsx:ff add-power-function
```

Describe the change:

> _"Add a `power(base, exponent)` function to the calculator. Follow the existing patterns in `openspec/specs/calculator/spec.md`. Handle negative exponents and zero."_

**What OpenSpec creates:**

```
openspec/changes/add-power-function/
├── proposal.md           # Why we're doing this
├── specs/
│   └── calculator/
│       └── spec.md       # Delta spec: ADDED requirements only
├── design.md             # How to implement (references existing code)
└── tasks.md              # Implementation checklist
```

Notice the **delta spec** — it only describes what's _new_, not the entire calculator:

```markdown
# Delta for Calculator

## ADDED Requirements

### Requirement: Power Operation

The system SHALL compute base raised to exponent.

#### Scenario: Positive exponent

- GIVEN base=2 and exponent=3
- WHEN power is calculated
- THEN the result is 8

#### Scenario: Zero exponent

- GIVEN any non-zero base and exponent=0
- WHEN power is calculated
- THEN the result is 1

#### Scenario: Negative exponent

- GIVEN base=2 and exponent=-3
- WHEN power is calculated
- THEN the result is 0.125
```

Review the proposal. Does the AI correctly reference the existing patterns from your baseline specs?

### Step 6: Implement, Archive, and Iterate

**Implement:**

```
/opsx:apply
```

**Archive** (merges the delta into baseline specs):

```
/opsx:archive
```

> 🔑 **What just happened during archive:** The delta spec's `ADDED Requirements` were merged into `openspec/specs/calculator/spec.md`. Your baseline now includes the power function. The next `/opsx:ff` will see it as existing behavior.

**Commit and continue:**

```bash
git add -A && git commit -m "Brownfield: added power() to legacy calculator"
```

**The virtuous cycle — keep going:**

```
/opsx:ff add-input-history           # Next feature (simple)
/opsx:ff fix-overflow-handling       # Bug fix (simple)
/opsx:new refactor-to-modules        # Tech debt (complex — use /opsx:continue to review each artifact)
```

Each proposal reads the _current_ `openspec/specs/` (which now includes all archived changes), proposes deltas, and the cycle repeats. Your specs grow organically as you modernize the legacy code — no big-bang rewrite needed.

```
  Time Zero              After 1st archive       After Nth archive
  ┌──────────────┐       ┌──────────────┐        ┌──────────────┐
  │  specs/       │       │  specs/       │        │  specs/       │
  │  (baseline    │──────▶│  + power()   │──────▶ │  + history   │
  │   from reverse│       │              │        │  + overflow  │
  │   spec)       │       │              │        │  + modules   │
  └──────────────┘       └──────────────┘        └──────────────┘
         ▲                       ▲                       ▲
     reverse_spec.md        /opsx:archive          /opsx:archive
                          (delta merged)          (deltas merged)
```

---

### Step 7: Ship It — Create & Review PRs from the CLI

Your brownfield changes are committed. Now ship them. Each CLI tool can create a PR and run a code review without leaving the terminal — but the commands differ. Here's what to use for each tool.

#### Claude Code

**Create a PR** — ask Claude in natural language; it uses `gh pr create` via the Bash tool:

```
Create a pull request for my brownfield changes. Title: "Brownfield: add power() to legacy calculator"
Add a summary of what changed and request a review.
```

**Review in-terminal** — runs 4 parallel review agents, scores issues by confidence, filters noise:

```bash
/code-review
```

**Review and post findings as a PR comment:**

```bash
/code-review --comment
```

> 💡 `/code-review` launches 4 parallel agents (CLAUDE.md compliance × 2, bug scan, git blame context). Each issue is scored 0–100; only issues scoring ≥ 80 are reported — low-confidence noise is filtered automatically.

---

#### Copilot CLI

**Create a PR** — ask in natural language; Copilot CLI uses `gh pr create` via its built-in GitHub MCP server:

```
Commit all staged changes, push the branch, and open a pull request.
Add me as assignee and Copilot as a reviewer.
```

**Review in-terminal** — analyze changes before opening the PR:

```bash
/review
```

Optionally scope the review to a path or file pattern:

```bash
/review src/legacy_calculator.js
/review Focus on the division and power functions only
```

**Request Copilot Code Review on GitHub** (requires `gh` CLI v2.88.0+):

```bash
gh pr edit --add-reviewer @copilot
```

Or select `@copilot` from the interactive reviewer list during `gh pr create`.

---

#### Codex CLI

**Create a PR** — ask in natural language; Codex uses `gh pr create`:

```
Commit my changes with a descriptive message and open a pull request against main.
```

**Review in-terminal** — type `/review` to open the review presets menu:

```bash
/review
```

Four presets are available:

| Preset | What it does |
| --- | --- |
| Review against a base branch | Picks a branch, diffs against upstream, highlights risks before you open the PR |
| Review uncommitted changes | Inspects staged, unstaged, and untracked changes — catch issues before committing |
| Review a commit | Lists recent commits; analyzes the exact changeset for a SHA you choose |
| Custom review instructions | Accepts your own wording (e.g., "Focus on division edge cases") |

**Request a Codex review on GitHub** — comment on any open PR:

```
@codex review
```

---

#### OpenCode

**Create a PR** — ask in natural language; OpenCode uses `gh pr create`:

```
Commit my changes and open a pull request. Summarize what was added.
```

**Request a review on GitHub** — comment `/opencode` or its shorthand `/oc` on any open PR:

```
/opencode review this PR for edge cases in the power() function
```

```
/oc review
```

If you've installed the [OpenCode GitHub App](https://github.com/apps/opencode-agent), it will automatically review PRs when they are opened, updated, or reopened — no manual comment needed.

> 💡 **OpenCode has no CLI-side `/review` command.** Its review strength is GitHub-side (App auto-review + PR comments). For in-terminal review, use natural language prompts in your OpenCode session before committing.

---

### PR & Review Quick Reference

| Tool | Create PR | Review (In CLI) | Review (GitHub) |
| --- | --- | --- | --- |
| **Claude Code** | Natural language → `gh pr create` | `/code-review` · `/code-review --comment` | GitHub Actions (`claude-code-action`) |
| **Copilot CLI** | Natural language → `gh pr create` | `/review` (optional path/pattern/prompt) | `gh pr edit --add-reviewer @copilot` |
| **Codex CLI** | Natural language → `gh pr create` | `/review` (4 presets) | Comment `@codex review` on the PR |
| **OpenCode** | Natural language → `gh pr create` | Natural language prompt | Comment `/opencode` or `/oc` on the PR |

> 🔑 **The pattern:** Every CLI delegates PR creation to `gh pr create` under the hood — no vendor lock-in on the git workflow. The differentiation is in the **review experience**: Claude Code uses parallel agents with confidence scoring; Codex CLI gives structured presets for granular control; Copilot CLI uses a scoped slash command; OpenCode relies on GitHub-side automation.

---

## The Brownfield vs. Greenfield Decision

|                    | Brownfield (Reverse-Spec)               | Greenfield (Spec-First)       |
| ------------------ | --------------------------------------- | ----------------------------- |
| **Start with**     | Existing code → extract spec            | Human intent → write spec     |
| **AI's first job** | Understand & document                   | Plan & architect              |
| **OpenSpec start** | Seed `specs/` from reverse spec output  | Write `specs/` from scratch   |
| **Risk**           | AI hallucinates business rules          | AI hallucinates architecture  |
| **Mitigation**     | Human validates baseline spec           | Human validates plan.md       |
| **Iteration**      | `/opsx:ff` or `/opsx:new` adds deltas to baseline | `/opsx:ff` or `/opsx:new` adds features |
| **When**           | Legacy code, undocumented systems       | New features, new projects    |

---

