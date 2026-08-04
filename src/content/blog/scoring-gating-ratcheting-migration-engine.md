---
title: "Scoring, Gating, Ratcheting: The Migration Engine Nobody Builds"
description: "Most migrations are a person reading a guide and hoping. This is the engine that automates it: five-factor confidence scoring, ratcheted state transitions, and gates that never roll backward."
pubDate: "Aug 4 2026"
heroImage: "../../assets/blog/scoring-gating-ratcheting-migration-engine/hero.webp"
tags: ["webdev", "refactoring", "architecture", "automation"]
slug: "scoring-gating-ratcheting-migration-engine"
---

_James Coombs is a design engineer who built a migration engine for a 962-file Material UI to custom design system migration. 7,065 lines of bot code, 5-factor confidence scoring, and a state machine with gated transitions._

Once the CSS coexistence layer was in place (I covered that in "The CSS Problem Nobody Thinks Is Solvable"), both frameworks could run side-by-side. The next question: how do you actually migrate 962 files across 12 packages without drowning in manual work or shipping regressions?

The standard answer is codemods. Write a jscodeshift transform, run it across the repo, review the output. Codemods work for mechanical substitutions: rename an import, swap a prop name, update a function signature. They don't work when the mapping isn't 1:1. A Material UI `<TextField variant="outlined">` doesn't map to a single design system component. It maps to different components depending on context: `<Input>` for plain text, `<Textarea>` for multiline, `<Select>` for dropdowns with `select` prop. The prop API differs. The composition pattern differs. The styling approach differs.

962 files. Some are mechanical (swap the import, done). Some require architectural judgment. Treating them identically wastes time on the easy ones and ships regressions on the hard ones.

---

## Confidence scoring

Weighted scoring for migration prioritization is an established practice (AWS uses it for cloud migration, Cortex uses it for service compliance). What's less common is applying it at the per-file level for frontend component migration, where the factors that predict success are different from application-level migration.

Every file in the migration gets a confidence score before anyone touches it. Five factors, weighted:

| Factor                | Weight | What it measures                                                                                                |
| --------------------- | ------ | --------------------------------------------------------------------------------------------------------------- |
| Size                  | 20%    | Lines of code, number of components. Smaller files are easier to verify.                                        |
| Semantic complexity   | 25%    | How many MUI components, how deeply nested, how much conditional rendering.                                     |
| Mapping coverage      | 25%    | What percentage of MUI components in this file have complete prop-level transforms in the mapping data.         |
| Test coverage         | 15%    | Does the file have tests? How comprehensive? Files with tests catch regressions; files without them hide them.  |
| Navigation complexity | 15%    | Is this file a leaf component or a route-level page? Pages compose dozens of components; a regression cascades. |

Three tiers: high (>= 0.75), medium (>= 0.45), low (< 0.45). A high-confidence file (small, well-tested leaf component with complete mappings) can be auto-migrated with automated visual regression checking. A low-confidence file (large route-level page, partial mappings, no tests) routes to human review after the agent's attempt.

"Success" means the file reaches `screenshot_approved` without hitting `failed`: TypeScript compiles, tests pass, and the visual diff is below threshold. That's the outcome the score predicts.

The weights came from the first 20 migrations. Size mattered less than expected (small files with complex conditional rendering were harder than large files with repetitive layouts). Semantic complexity and mapping coverage were the strongest predictors of first-attempt success.

The scoring is deterministic: the LLM agent writes raw factor values to the manifest; a Node.js module computes the final score. The agent never sets its own confidence. This separation matters because LLMs are optimistic about their own output. The scoring module doesn't care what the agent thinks; it scores the file's structural properties.

---

## The state machine

A boolean (migrated/not-migrated) isn't enough. Migration is a multi-step process, and each step has a quality gate.

The state machine tracks each file through 15 statuses with gated transitions. State is stored in a JSON manifest file. Node.js is the single writer; the LLM agent proposes transitions but never mutates state directly.

```
not_started → checked → plan_created → plan_validated → migrating → migrated
→ ts_verified → test_verified → screenshot_captured → screenshot_approved
→ pr_created → merged
```

With two terminal escape states: `failed` (reachable from any active state) and `wont_migrate` (reachable from `not_started` for files that should never be migrated).

Each transition has a named gate:

- **not_started to checked:** `ds-migrate-check-passes` (migration readiness assessment)
- **checked to plan_created:** `confidence-score-computed` (all five factors assessed)
- **plan_created to plan_validated:** `validate-plan-exits-0` (plan passes structural validation)
- **migrated to ts_verified:** `tsc-exits-0` (TypeScript compiles clean)
- **ts_verified to test_verified:** `tests-pass-or-no-tests`
- **test_verified to screenshot_captured:** `screenshots-captured-and-diffed` (visual regression screenshots taken)
- **screenshot_captured to screenshot_approved:** `diff-below-threshold-and-high-confidence` (automated approval for high-confidence files) or routes to `awaiting_human_review` for manual approval

Files can move backward. Any active state can transition to `failed` with notes on what broke. The `checked` state can return to `not_started` via a `file-changed-staleness` gate (the source file was modified since it was last checked, invalidating the analysis). Stale states have configurable timeouts: 1 hour for `migrating`, 2 weeks for `awaiting_human_review`, 30 days for `pr_created`.

Why this matters: without gated transitions, teams mark files as "done" when the PR merges. But "PR merged" and "verified in production with no regressions" are different things. 15 states and 12 gates make that gap explicit and enforceable.

---

## Component mappings

12 mapping files. 100+ MUI-to-design-system transforms with prop-level translation.

A mapping isn't just "replace `<Button>` with `<Button>`." It's:

- Import path change (`@mui/material/Button` to `@company/design-system`)
- Prop renames (`variant="contained"` to `variant="default"`)
- Prop removals (MUI's `disableElevation` has no equivalent)
- Prop additions (design system requires `size` where MUI inferred it)
- Composition changes (MUI's `startIcon` prop becomes a child `<Icon>` component)
- Conditional mappings (MUI's `TextField` maps to 3 different components based on props)

Each mapping includes the confidence impact. A component with a complete mapping (all props translated, all variants covered) contributes 100% to the mapping coverage factor. A component with a partial mapping (3 of 7 props translated) contributes proportionally. This feeds directly into the confidence score.

The mappings are JSON, not code. Adding a new component mapping is a data change, not a code change. The migration bot reads the mappings; the bot code doesn't change when new components are added.

---

## The ratchet

The ratchet pattern (monotonically decreasing violation counts, enforced through CI) is well-established. Dusty Burwell described it in 2019. What's less common is applying it at the write layer for design system imports.

PreToolUse hooks (66 lines, 17 tests) fire on every file write. If an edit introduces an import from the legacy framework in a file that's been marked "complete," the edit is rejected before it lands. Not at CI. Not at PR review. At the moment the engineer types the import. The engineer sees an error message explaining why and pointing to the design system equivalent.

This is not documentation ("please use the new components"). This is enforcement at the earliest possible point. The count of legacy imports only goes down, never up.

The ratchet catches a specific failure mode: an engineer working on an unrelated feature in a migrated file reaches for the familiar MUI component because it's what they know. Without the ratchet, the migration regresses silently. With it, the regression is blocked at write time, before the PR is even created.

Result: zero legacy imports in any file marked "complete." Zero review comments needed for that class of violation.

---

## The learning log

11 entries over 3 months. Each entry: date, source, what happened, what rule it produced.

Examples:

- A static hex color (`#6464f0`) wasn't converted to a design token during migration. Added a check to the migration step that flags unconverted hex values.
- A migration check was too broad: it added design system config to bundles that didn't use any migrated components. Refined the check to verify component usage before applying config.
- A Drawer component's portal rendered outside the scope wrapper, breaking ref-forwarding. Added a rule for portal scoping and updated the component's test suite.

The log is append-only with mandatory fields. Rules flow from failures, not from predictions. Starting the log on day 1 would have been better; the first three months of failures had to be reconstructed from git history.

---

## What didn't work

**Hardcoded confidence weights.** The initial weights were guesses. Size was weighted too high (30%), semantic complexity too low (15%). After 20 real migrations, the data showed which factors actually predicted success. Recalibrating the weights changed the priority order for ~40% of the remaining files. Start with any weights; recalibrate from real data after the first batch.

**Generic checks without scoping.** A check that asks "does this package depend on the design system?" catches packages that imported one design system utility for an unrelated reason. Three bundles got unnecessary config added before the check was refined to verify actual component usage. Automation checks need nested conditions, not just existence tests.

---

## The numbers

| Metric                | Value                                         |
| --------------------- | --------------------------------------------- |
| Migration bot code    | 7,065 lines + 2,363 lines of tests            |
| Component mappings    | 12 files, 100+ prop-level transforms          |
| Structured data files | 48 (~6,900 lines of JSON)                     |
| Scoring factors       | 5 (size, semantic, mapping, test, navigation) |
| State machine         | 15 statuses, 12 named gates, JSON-stored      |
| Enforcement hooks     | 66 lines, 17 tests                            |
| Learning log entries  | 11 entries, 15+ rule refinements              |

---

## If you're building a migration engine

Score before you migrate. Any scoring system (even a rough one) is better than migrating files in directory order. The scoring reorders 962 files so the first 50 are almost guaranteed to succeed, building confidence and catching mapping gaps early.

Gate your transitions. "PR merged" is not "migration complete." Define what "complete" means, build the states between "started" and "complete," and enforce the gates.

Build the ratchet in week 1. Every day without enforcement is a day legacy imports can re-enter the codebase through unrelated work.

Start the learning log immediately. The failures from the first 10 migrations will produce the rules that prevent failures in the next 100.
