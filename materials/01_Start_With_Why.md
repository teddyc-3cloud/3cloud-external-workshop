# Module 1: Start With Why — First-Principles Spec Writing

**Time Allocation:** 20 minutes (25 minutes with buffer)
**Format:** Discussion + Guided Exercise

> **Skill Levels:** New to AI coding tools? This module gives you the foundational mental model for everything that follows. Already writing structured prompts daily? Watch for the first-principles decomposition technique — it gives your existing practice a shareable vocabulary and a systematic edge.

---

## The Problem: Why "Vibe Coding" Fails

**Vibe Coding:** Giving an AI assistant a vague prompt ("make a login page") and accepting whatever it generates.

- **Result:** Code drift, hallucinations, technical debt, and unmaintainable legacy code created at lightspeed.

**Engineering with AI:** Providing structured specifications, enforcing quality gates, and using the right tool for the right context.

- **Result:** Predictable, maintainable, and verifiable code.

> 💡 AI is a force multiplier. If your input is vague, it multiplies vagueness. If your input is precise, it multiplies precision.

---

## The Fix: Let AI Do the First-Principles Decomposition

First-principles thinking boils down to: **strip away assumptions, break the problem down to its atomic fundamentals, and build up from there.**

The twist: **don't do this manually — ask the LLM to do it for you.**

Before you write a single line of spec, give the AI your raw problem and have it decompose it into atomic components. This surfaces hidden assumptions, edge cases, and constraints you'd otherwise miss.

### Step 1: The First-Principles Decomposition Prompt

Give the AI your rough problem statement and this prompt:

```
Use first-principles thinking to break down the following problem
into its atomic-level fundamentals.

PROBLEM: [paste your raw problem description here]

For each atomic component, identify:
1. The fundamental truth (what MUST be true regardless of implementation)
2. The assumptions we're making (what we THINK is true but could be wrong)
3. The constraints (what limits our options)
4. The unknowns (what we don't know yet)

Then synthesize: given only the fundamental truths, what is the simplest
possible solution that satisfies all of them?
```

### Step 2: See What the AI Surfaces

For example, if you prompt: _"We need a booking widget for freight forwarders"_, and ask AI to apply first principle thinking, the AI might decompose it to:

E.g.
```
Use first-principles thinking to break down the following problem
into its atomic-level fundamentals.

PROBLEM: We need a booking widget for freight forwarders

For each atomic component, identify:
1. The fundamental truth (what MUST be true regardless of implementation)
2. The assumptions we're making (what we THINK is true but could be wrong)
3. The constraints (what limits our options)
4. The unknowns (what we don't know yet)

Then synthesize: given only the fundamental truths, what is the simplest
possible solution that satisfies all of them?
```


| Atomic Component | Fundamental Truth                                   | Assumption to Challenge                                                         |
| ---------------- | --------------------------------------------------- | ------------------------------------------------------------------------------- |
| **Data entry**   | A booking requires shipper, consignee, cargo, dates | We assume a form is the right interface — could it be voice? Import from email? |
| **Validation**   | Carrier rules define what is valid                  | We assume rules are static — but they change per carrier, per lane, per season  |
| **Submission**   | The booking must reach the carrier system           | We assume the user has connectivity — what about at a warehouse with no signal? |
| **Feedback**     | The user must know the booking succeeded            | We assume instant confirmation — but some carriers batch-process bookings       |

> 💡 **The insight:** The AI just surfaced 4 design decisions you'd have discovered _mid-sprint_ if you'd gone straight to coding. Now you address them _before_ writing a single line.

### Step 3: Convert Decomposition Into a Spec Prompt

Take the atomic fundamentals and convert them into a structured spec input:

```
PROBLEM:   [Refined problem from the decomposition]
USER:      [Who — informed by the "assumptions to challenge" column]
RULES:     [Hard constraints from the "constraints" column]
SUCCESS:   [Acceptance criteria from the "fundamental truths" column]
```

### Example: Before & After

| ❌ Vibe Prompt              | ✅ First-Principles → Spec                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| "Build me a booking widget" | **Problem:** Freight forwarders waste 20 min per booking filling forms manually. **User:** Operations clerk who processes 50+ bookings/day, sometimes offline at warehouses. **Rules:** Must work in our existing React app, must validate against carrier-specific rules (not static), must handle offline gracefully. **Success:** Clerk can complete a booking in under 3 minutes. Validation errors shown inline. Offline submissions queue locally and sync when reconnected. Carrier confirmation displayed async. |

---

## ✏️ Exercise: Write Your Spec Prompt (5 min)

Using the First-Principles Template above, write a prompt for the following scenario:

**Scenario:** You need an **MCP Traffic Inspector** — a local tool that shows you the real-time conversation between an LLM and MCP tools. It should include a **single-line chat input** to trigger tool calls, and a **live traffic log** that visualizes each step: user message → LLM routing decision → MCP tool call → MCP result → final response.

Write down:

1. **PROBLEM** — Why does this matter? (What can't engineers see today?)
2. **USER** — Who consumes this?
3. **RULES** — What are the technical constraints?
4. **SUCCESS** — What does "done" look like?

> 🎯 **Hold onto your output — you'll use it directly.** In Module 02, you'll paste this PROBLEM/USER/RULES/SUCCESS output into the OpenSpec CLI as the input for your formal spec. The better your decomposition here, the better your blueprint in the next module.

## Copy and Paste: To CLI
Use first-principles thinking to break down the following problem
into its atomic-level fundamentals.

