## Workflow

All features, fixes, refactors, and behavior changes must use the OpenSpec workflow.
Codex CLI should always prefer the matching OpenSpec skill over ad hoc implementation whenever the request is about starting, planning, implementing, verifying, syncing, or archiving a change.

### Skill routing
Use these skills by default:

1. `openspec-explore` — when the user wants to investigate, clarify scope, or think through an approach
2. `openspec-new-change` — when the user wants to start a new change in the normal step-by-step flow
3. `openspec-ff-change` — when the change is simple and the user wants to fast-forward artifact creation
4. `openspec-continue-change` — when the next OpenSpec artifact should be created
5. `openspec-apply-change` — when implementing tasks from an existing OpenSpec change
6. `openspec-verify-change` — when checking implementation against change artifacts
7. `openspec-sync-specs` — when syncing accepted delta specs into main specs without archiving
8. `openspec-archive-change` — when finalizing a completed change
9. `openspec-bulk-archive-change` — when archiving several completed changes together
10. `openspec-onboard` — when the user wants a narrated walkthrough of the workflow

Do not skip straight to code changes when an OpenSpec artifact should exist first, unless the user explicitly asks to bypass the workflow.

### Skill shorthands

Use these `opsx:` aliases when invoking OpenSpec skills:

| Shorthand           | Full skill name                |
| ------------------- | ------------------------------ |
| `opsx:explore`      | `openspec-explore`             |
| `opsx:new`          | `openspec-new-change`          |
| `opsx:ff`           | `openspec-ff-change`           |
| `opsx:continue`     | `openspec-continue-change`     |
| `opsx:apply`        | `openspec-apply-change`        |
| `opsx:verify`       | `openspec-verify-change`       |
| `opsx:sync`         | `openspec-sync-specs`          |
| `opsx:archive`      | `openspec-archive-change`      |
| `opsx:bulk-archive` | `openspec-bulk-archive-change` |
| `opsx:onboard`      | `openspec-onboard`             |

### When starting in plan mode
Plan mode is the exploration and design phase. When plan mode exits:

1. For simple changes, use `openspec-ff-change`
2. For complex changes, use `openspec-new-change` and then `openspec-continue-change`

Do not jump directly from plan mode to implementation. Create the OpenSpec change first.

### Recognizing plan mode exit

Plan mode exits when:
- The user says "go ahead", "approved", "implement", "do it", or similar
- The system-reminder with "Plan Mode - CRITICAL" is no longer present

When this happens, your FIRST action must be loading the `openspec-ff-change` or `openspec-new-change` skill. Do NOT start with file edits, bash commands, or code changes.

### Pre-implementation gate

Before making ANY file edit (code, config, or otherwise):
1. Check: Does an OpenSpec change exist for this work? (`openspec list --json`)
2. If NO change exists → STOP. Load `openspec-ff-change` or `openspec-new-change` first.
3. If a change exists but artifacts are incomplete → Load `openspec-continue-change`.
4. Only proceed to edits after all required artifacts are created.

This gate applies even after plan approval. "Go ahead" means "go ahead with the OpenSpec workflow," not "go ahead and write code."

### After artifacts are created

1. Use `openspec-apply-change` to implement tasks (clear context first — see Context hygiene)
2. Use `openspec-verify-change` to confirm implementation matches artifacts (clear context first — see Context hygiene)
3. Use `openspec-archive-change` to archive the completed change

### Context hygiene

Before running `openspec-apply-change` or `openspec-verify-change`, the agent **must** clear its conversation context by issuing `/clear` or `/new`. This ensures a fresh context window free of stale references, preventing token bloat and hallucinated state. This rule applies whether the command is triggered by the user (e.g. `opsx:apply`, `opsx:verify`) or routed internally by skill routing.

### When not in plan mode

Follow the full sequence manually:
1. `openspec-explore`
2. `openspec-new-change` and `openspec-continue-change`, or `openspec-ff-change` for simple changes
3. `openspec-apply-change` (clear context first — see Context hygiene)
4. `openspec-verify-change` (clear context first — see Context hygiene)
5. `openspec-archive-change`

### Exceptions
These requests may skip OpenSpec unless they clearly affect behavior, requirements, or shipped functionality:

1. Purely informational questions
2. Minor wording or documentation-only edits
3. Small mechanical changes that the user explicitly wants handled outside the workflow

If there is any doubt, use OpenSpec.
