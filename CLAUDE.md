@AGENTS.md

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

### Agent team members (TeamCreate)

When spawning team of agents, always set `mode: "plan"` so each agent must get plan approval before making any edits. Always try to set most appropriate agent. You have many agents you can select under @agents/ folder
Team members MUST also follow the OpenSpec workflow — they cannot jump straight to implementation after their plan is approved.
The same post-plan rules apply: always create the OpenSpec change first via `opsx:ff` or `opsx:new` → `opsx:continue`.
Team members must use Sonnet model.
Team members must clear context (`/clear` or `/new`) before invoking `openspec-apply-change` or `openspec-verify-change`.

### Post-plan enforcement

When plan mode is approved/exited, the FIRST tool call must be loading an OpenSpec skill (`openspec-ff-change` for simple, `openspec-new-change` for complex). No exceptions unless the user explicitly says to bypass OpenSpec.

Before making ANY file edit, verify an OpenSpec change exists with all required artifacts complete. If not, create the change first. "Go ahead" means "go ahead with the OpenSpec workflow," not "go ahead and write code."
