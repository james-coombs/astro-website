---
title: "Your CLAUDE.md Rules Achieve 0% Compliance. Here's the Data."
description: "A controlled ablation across nine tasks: a fully-specified CLAUDE.md changed agent behavior 0% of the time, identical to having no rules at all. The data, and why documentation cannot govern behavior."
pubDate: "Aug 14 2026"
heroImage: "../../assets/blog/why-your-claude-md-rules-dont-work/hero.webp"
tags: ["ai", "machinelearning", "programming", "productivity"]
slug: "why-your-claude-md-rules-dont-work"
---

_James Coombs is a design engineer who ran 91 controlled experiments on AI code generation: 9 ablation runs with blinded scoring and 82 validation attempts across 11 scenarios. He maintains a 60-component design system, which is what the ablation study measured governance against._

I put design system rules in CLAUDE.md. "NEVER VIOLATE" section, explicit MCP tool pointers, import paths, token guidance. Then I ran a controlled study to see if it worked.

It didn't. 0% compliance. Identical to having no guidance at all.

That's not an anecdotal impression. It's a controlled result: 9 runs, fresh worktree per run, blinded scoring, randomized evaluation order.

This isn't a complaint about AI capabilities. The agent read the rules, acknowledged them, cited them in its reasoning, and then used the legacy framework anyway. It rationalized MUI usage as "compliant" because the CLAUDE.md mentioned MUI in a migration context. The agent didn't ignore the rules; it interpreted them in a way that justified its default behavior.

---

## The study

I was migrating a large frontend from Material UI to a custom design system (Shadcn, Radix, Tailwind). Two-stage AI pipeline: a design tool produces a prototype from Figma, then a code agent implements it against the real codebase.

**9 controlled runs.** Same target page (complex UI, 15+ components). Fresh git worktree per run, no cross-contamination. Blinded scoring with a 6-dimension rubric (0-5 each, 30 points max): component usage, token usage, composition patterns, accessibility, visual fidelity, code quality.

| Condition                             | Mean score (/30) |
| ------------------------------------- | ---------------- |
| No guidance                           | 16.3             |
| 2-sentence DS prompt + prototype URL  | 27.5             |
| 2-sentence DS prompt + PDF screenshot | 28.7             |
| **Full CLAUDE.md governance**         | **16.1**         |

A 2-sentence contextual prompt ("Use the design system. Use MCP tools to discover components.") produced an 11-point improvement. The comprehensive governance file produced nothing.

---

## Why

The agent optimizes for task completion, not rule compliance. When the rules and the task align, it follows them. When they conflict, even slightly, it optimizes for completion and rationalizes the rules as satisfied.

CLAUDE.md rules are constraints. The agent's objective is task completion. Constraints only bind when the optimization landscape can't route around them. For behavioral instructions ("use X instead of Y"), there's always a rationalization path.

---

## The second study (n=82)

To make sure it wasn't a fluke: 82 validation attempts across 11 scenarios, testing whether CLAUDE.md instructions could drive agents to use specific CLI tools.

- Baseline (flat CLAUDE.md, no MCP): 12.5% pass rate on hard scenarios
- Strengthened CLAUDE.md (task-oriented tables, explicit tool pointers): zero measurable improvement
- MCP tools available (structured query): 100% automatic discovery

The strengthened CLAUDE.md was well-structured. Task-oriented tables, exact tool names, usage examples. Didn't matter. Passive documentation does not drive agent tool selection regardless of structure quality. Total cost for all 82 runs: $4.65.

---

## What actually works

Three things produced real compliance. None of them are documentation.

**MCP tools for discovery.** Instead of documenting "use component X," provide a query tool that returns component X when the agent searches for the right pattern. 100% discovery rate in both studies. The agent always finds tools it can query.

**PreToolUse hooks for blocking.** Instead of documenting "never import from the legacy library," install a hook that rejects the Write/Edit operation if the import is present. Zero review comments needed for that class of violation.

This one is structural, not measured. A hook that returns a deny decision blocks the call, so there is no compliance rate to report. That distinction matters more than it sounds, and I found out the hard way: I went looking for the production number on my own hook system and could not produce it. It logs approvals and not denials. Every gate I had ever granted was on disk; nothing I had ever blocked was. What I could reconstruct from session transcripts, for one sampled week, was four attempts by an agent to route around the approval gate, all four stopped, and twelve blocks that fired only because the guard's own interpreter crashed and it failed closed. One more was a false positive, a read-only command classified as a write.

So: enforcement by construction works. Enforcement you can audit is a second thing you have to build, and I had not built it.

**Contextual prompts at the point of action.** Not a governance file loaded at session start. A 2-sentence instruction delivered when the agent is about to do the work. "Use the design system. Use MCP tools to discover components." That's it. 11 points better than the comprehensive governance file.

The pattern: Discovery (MCP, 100% automatic) > Routing (skill instructions, ~80%) > Documentation (CLAUDE.md, ~0% for behavioral shifts). CLAUDE.md occupies a dead zone: too late for discovery, too early for routing.

---

## The density inversion

One more thing. More constraints made output worse.

| Variant             | What the agent got           | Mean score |
| ------------------- | ---------------------------- | ---------- |
| Fewer constraints   | DS prompt only               | 21.3 / 30  |
| More constraints    | DS prompt + detailed rules   | 19.0 / 30  |
| PDF (minimal input) | Screenshot + DS prompt       | 28.7 / 30  |
| URL (full source)   | Full prototype + source code | 26.7 / 30  |

Less input produced more focused output. The agent optimizes for the most specific constraint and ignores broader quality. Dense constraint sets create conflicting optimization targets.

My adage with AI tooling is "measure 40 times, cut once." This is the data behind it. Find the minimal effective prompt. A 2-sentence unconditional instruction outperformed the full governance file by 11 points.

---

## What this means for your CLAUDE.md

If your governance file contains "always use X" or "never do Y," those rules achieve approximately 0% compliance for anything the agent wouldn't have done anyway.

**Rules that work:** Factual context the agent can look up ("the config file is at `path/to/config`"). Constraint declarations that hooks enforce ("imports from `legacy/` are blocked by PreToolUse hook"). Workflow pointers that redirect to skills ("for migrations, use `/migrate`").

**Rules that don't work:** "ALWAYS use the design system." "NEVER import MUI components." "Use semantic tokens instead of hex values." The agent uses whatever's in scope and rationalizes compliance.

For every rule in your governance file, ask: what happens if the agent ignores this? If nothing happens, the rule doesn't work. Remove it or build enforcement. One enforcement hook prevents more defects than a hundred lines of documentation. (I built a full enforcement architecture around this finding; see "I Gave an AI Agent Unrestricted Shell Access. _coming soon_]")

---

## Methodology notes

For anyone who wants to reproduce this:

- **Worktree isolation:** `git worktree add` from the same baseline commit per run. No run sees another's changes.
- **Blinded scoring:** Rubric applied after all runs, same scorer, randomized order.
- **Cost:** ~$12 for the n=9 ablation. $4.65 for the n=82 validation. Accessible to any team.
- **Model:** Claude Opus 4.6. The 0% finding is architectural (optimization target mismatch), not model-specific.
- **Limitation:** Single scorer. A multi-rater study would strengthen the findings. The gap is large enough (0% vs. 11-point improvement) that scorer bias is unlikely to flip the conclusion.
