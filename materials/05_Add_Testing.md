# Module 5: Add Testing — Playwright MCP & E2E Autonomous Validation

**Time Allocation:** 15 minutes (20 minutes with buffer)
**Format:** Live Demo + Hands-On



> **Skill Levels:** New to AI tools? Focus on Approach 1 (Playwright MCP, 7 min hands-on) — it produces a real test file you can run. Already advanced? Approach 3 (Stop Hook) shows automated self-correction that will change how you work with AI agents daily.

> **Time Budget:** Approach 1: 7 min hands-on | Approach 2: 2 min overview | Approach 3: 6 min hands-on + demo

---

## Learning Objectives

You've built working code. Now prove it works. You'll learn two complementary approaches to AI-driven testing:

1. **Playwright MCP** — Generate reusable E2E test scripts from natural language.
2. **Claude `e2e-test` Skill** — Fully autonomous end-to-end validation (discover, test, fix).

---

## Approach 1: Playwright MCP — Targeted Test Generation

**What it is:** Playwright MCP exposes Microsoft's Playwright browser automation to AI agents. Instead of writing brittle CSS selectors, you describe tests in English — the AI generates executable `.spec.ts` files.

**When to use it:** You want _permanent regression tests_ that live in your CI pipeline.

### How It Works

Claude Code ships **Playwright Test Agents** — three Claude Code subagents that layer on top of Playwright MCP:

| Sub-Agent     | Role                                                                                           |
| ------------- | ---------------------------------------------------------------------------------------------- |
| **Planner**   | Suggests test scenarios from your code                                                         |
| **Generator** | Converts English intent into Playwright test code                                              |
| **Healer**    | When a test fails due to a changed selector, it reads the new DOM, fixes the test, and re-runs |

### ✏️ Hands-On: Generate a Test (7 min)

**Prerequisites:** Playwright MCP must be configured in VS Code. If you haven't set it up, add it to `.vscode/mcp.json` (create the file if it doesn't exist):

```json
{
  "servers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp"]
    }
  }
}
```

Then reload VS Code (Cmd+Shift+P → "Reload Window"). If you already configured `.vscode/mcp.json` in Module 04, add the `playwright` entry alongside your existing `logistics-tools` server.

**Step 1:** Start your MCP Traffic Inspector server:

```bash
npm start
```

**Step 2:** Open a **fresh** Copilot Agent Mode session.

**Step 3:** Prompt:

> _"Use Playwright MCP. Navigate to `localhost:3000/api/tools`. Assert that the response is JSON with a `tools` array where each item has `name` and `description` keys. Generate the test file as `tests/tools-api.spec.ts`."_

**Step 4:** Review the generated test. Run it:

```bash
npx playwright test
```

> **First run only:** If Playwright hasn't been set up on this machine, install the browser first: `npx playwright install chromium`

> 💡 The self-healing capability means if you later rename the endpoint to `/api/v2/rate-status`, the Healer agent will detect the failure, find the new route, update the test, and pass — automatically.

---

## Approach 2: Claude `e2e-test` Skill — Full Autonomous Validation

**What it is:** A Claude Code skill that autonomously discovers user journeys, launches a browser, tests them, fixes bugs inline, and generates a report (`e2e-test-report.md`). It runs six phases: Research → Startup → Plan → Test → Cleanup → Report — all without manual intervention. Think of it as an AI QA pass that runs after implementation, before code review.

> **Try this post-workshop:** Run `/e2e-test` in Claude Code against your MCP Traffic Inspector to see it discover and validate every user journey automatically. No test files to maintain — it runs fresh each time.

---

## Approach 3: Claude Code Stop Hook — Automated Static Analysis

> 📖 **Facilitator Demo:** The instructor will demonstrate the Stop hook live — watch for the self-correction loop: Claude edits code, the hook catches a lint error, and Claude fixes it in the same turn without any re-prompting. The configuration below is yours to set up after the workshop.

> 📖 **Informational:** This section covers a Claude Code-specific capability. If your team uses a different AI coding tool (GitHub Copilot, Cursor, etc.), the same concept applies via that tool's automation hooks or task runners.

**What it is:** Claude Code's _hook system_ lets you attach shell commands to lifecycle events in the AI's session. The **Stop hook** fires every time Claude finishes a response — making it the ideal trigger for static analysis that should run after every code modification.

**When to use it:** During active implementation. While Playwright MCP and the `e2e-test` skill validate runtime behavior, the Stop hook catches problems that don't require running the app at all: type errors, lint violations, unused imports, insecure patterns.

### Why This Matters

The feedback loop without hooks:

```
Claude edits code → You review → You run lint → You see error → You tell Claude → Claude fixes
```

The feedback loop with a Stop hook:

```
Claude edits code → Hook runs lint automatically → Claude sees error → Claude fixes — same turn
```

The AI self-corrects before you even look at the diff. This is especially powerful during the "One Task = One Session" workflow from Module 3 — every sub-task ends with a clean static check, and the commit only happens after the hook passes.

### How It Works

Claude Code reads a `settings.json` file (in `~/.claude/` or your project's `.claude/` directory) that defines hooks. Each hook specifies:

| Field     | What it does                                                              |
| --------- | ------------------------------------------------------------------------- |
| `event`   | Which lifecycle event triggers the hook (`Stop`, `PreToolUse`, etc.)      |
| `command` | The shell command to run                                                  |
| `timeout` | How long to wait before giving up (seconds)                               |

When the hook command exits with a **non-zero code**, Claude Code surfaces the output back into the conversation. Claude reads the failure output and self-corrects. When the hook exits **0**, the session ends cleanly.

```
Claude writes code
      │
      ▼
 [Stop event fires]
      │
      ▼
 Hook script runs:
   npm run lint && npx tsc --noEmit
      │
      ├── Exit 0 (clean) ──▶ Session ends, commit is safe
      │
      └── Exit 1 (errors) ──▶ Output fed back to Claude
                                    │
                                    ▼
                               Claude reads errors,
                               edits the offending file,
                               hook fires again...
```

### Hands-On: Configure a Stop Hook (5 min)

**Step 1:** Create or edit `.claude/settings.json` in your project root:

```json
{
  "hooks": {
    "Stop": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "npm run lint && npx tsc --noEmit",
            "timeout": 30
          }
        ]
      }
    ]
  }
}
```

**Step 2:** Make sure your `package.json` has a `lint` script (ESLint is typical for TypeScript projects):

```json
{
  "scripts": {
    "lint": "eslint src --ext .ts --max-warnings 0"
  }
}
```

**Step 3:** Ask Claude to make a deliberate mistake to test the hook:

> _"In `src/mock-llm.ts`, add a variable `unusedVar` that is declared but never used."_

**What you should see:** Claude adds the variable → the Stop hook fires → ESLint exits 1 with `no-unused-vars` → Claude reads the error → Claude removes the variable — all within the same response cycle.

> 💡 The `--max-warnings 0` flag is important: it treats warnings as errors. Without it, ESLint exits 0 even when it finds issues, and the hook never triggers.

### Advanced: Multi-Check Hook Script

For production use, a dedicated script gives you more control — run multiple tools, format output cleanly, and differentiate between blocking errors and advisory warnings.

Create `.claude/hooks/static-check.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

ERRORS=0

echo "=== Lint ==="
if ! npm run lint --silent; then
  ERRORS=$((ERRORS + 1))
fi

echo ""
echo "=== Type Check ==="
if ! npx tsc --noEmit; then
  ERRORS=$((ERRORS + 1))
fi

echo ""
echo "=== Dependency Audit ==="
# Advisory only — do not block on audit warnings
npm audit --audit-level=critical 2>&1 || true

if [ $ERRORS -gt 0 ]; then
  echo ""
  echo "STATIC CHECK FAILED: $ERRORS check(s) did not pass. Fix the above errors before committing."
  exit 1
fi

echo ""
echo "All static checks passed."
exit 0
```

Then reference it in `settings.json`:

```json
{
  "hooks": {
    "Stop": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "bash .claude/hooks/static-check.sh",
            "timeout": 60
          }
        ]
      }
    ]
  }
}
```

> 💡 **Key design choices in this script:**
> - `set -euo pipefail` — fail fast on any unexpected error in the script itself
> - Counts failures across all checks so all errors are shown, not just the first
> - `npm audit` runs in advisory mode (`|| true`) so a known dep vulnerability doesn't block coding, but the output is still visible

### The Connection to the Module 3 Workflow

Recall the **One Task = One Session = One Commit** rule from Module 3:

```
Fresh chat → /opsx:new or /opsx:ff → review → /opsx:apply → verify → /opsx:archive → git commit
```

With a Stop hook, the "verify" step is no longer manual — it's automatic. Claude cannot finish a task without the static checks passing first. The commit that follows is always green.

---

## When to Use Each

|                 | **Playwright MCP**            | **Claude `e2e-test` Skill**               | **Stop Hook**                              |
| --------------- | ----------------------------- | ----------------------------------------- | ------------------------------------------ |
| **Best for**    | Reusable test scripts in CI   | Full-app validation before code review    | Catching errors inline during coding       |
| **Output**      | `.spec.ts` test files         | Screenshots, DB checks, bug fixes, report | Console output fed back into conversation  |
| **Maintenance** | Self-healing selectors        | No test files — runs fresh each time      | Script lives in `.claude/hooks/`           |
| **Scope**       | Specific scenarios you define | Auto-discovers _every_ user journey       | Static: types, lint, security audit        |
| **When it runs**| On demand                     | On demand                                 | Automatically after every Claude response  |

> 💡 **Pro Tip:** Use all three together. The Stop hook keeps every edit clean, Playwright MCP generates permanent regression tests for critical paths, and the `e2e-test` skill validates the full app before code review.

---

## Checkpoint

You now have three layers of automated quality assurance for your MCP Traffic Inspector:
- **Playwright MCP** — permanent regression tests in CI
- **Claude `e2e-test` skill** — full-app autonomous validation on demand
- **Stop hook** — inline static analysis that self-corrects during coding

These testing patterns apply equally to unfamiliar codebases. In Module 06, you'll prove it — applying everything you've built to reverse-engineer and extend legacy code.

