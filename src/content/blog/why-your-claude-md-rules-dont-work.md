---
title: "Your CLAUDE.md Rules Achieve 0% Compliance. Here's the Data."
description: "A controlled ablation across nine tasks: a fully-specified CLAUDE.md changed agent behavior 0% of the time, identical to having no rules at all. The data, and why documentation cannot govern behavior."
pubDate: "Aug 14 2026"
heroImage: "../../assets/blog/why-your-claude-md-rules-dont-work/hero.webp"
tags: ["ai", "machinelearning", "programming", "productivity"]
slug: "why-your-claude-md-rules-dont-work"
---

_James Coombs is a design engineer who ran two controlled studies on AI code generation: a 9-run ablation and 82 validation attempts across 11 scenarios. He maintains a 60-component design system, which is what the ablation study measured governance against._

I put design system rules in CLAUDE.md. "NEVER VIOLATE" section, explicit MCP tool pointers, import paths, token guidance. Then I ran a controlled study to see if it worked.

It didn't. 0% compliance. Identical to having no guidance at all.

That's not an anecdotal impression. It's a controlled result, and the part that carries it is not a score. The agent read the rule, cited it by name, and then wrote 91 `styled()` calls and zero design-system imports. That is a count from a diff, not a judgement.

This isn't a complaint about AI capabilities. The agent read the rules, acknowledged them, cited them in its reasoning, and then used the legacy framework anyway. It rationalized MUI usage as "compliant" because the CLAUDE.md mentioned MUI in a migration context. The agent didn't ignore the rules; it interpreted them in a way that justified its default behavior.

---

## The study

I was migrating a large frontend from Material UI to a custom design system (Shadcn, Radix, Tailwind). Two-stage AI pipeline: a design tool produces a prototype from Figma, then a code agent implements it against the real codebase.

**9 controlled runs on one page.** Same target throughout, deliberately, to hold page complexity constant. Fresh git worktree per run, no cross-contamination. Six-dimension rubric, 0 to 5 each, 30 max: token fidelity, component API, anti-pattern compliance, dark mode, composition, visual quality. Same scorer, scoring from diffs after every run finished. I set up blinding and did not achieve it, because I had already seen the session logs. The governance condition is **one run**; the baseline is two and each prompted condition is three.

| Condition                             | Mean score (/30) |
| ------------------------------------- | ---------------- |
| No guidance                           | 16.3             |
| 2-sentence DS prompt + prototype URL  | 26.7             |
| 2-sentence DS prompt + PDF screenshot | 28.7             |
| **Full CLAUDE.md governance**         | **16.4**         |

A 2-sentence contextual prompt ("Use the design system. Use MCP tools to discover components.") produced an 11-point improvement. The comprehensive governance file produced nothing.

---

## Why

The agent optimizes for task completion, not rule compliance. When the rules and the task align, it follows them. When they conflict, even slightly, it optimizes for completion and rationalizes the rules as satisfied.

CLAUDE.md rules are constraints. The agent's objective is task completion. Constraints only bind when the optimization landscape can't route around them. For behavioral instructions ("use X instead of Y"), there's always a rationalization path.

---

## The second study (n=82)

To make sure it wasn't a fluke: 82 validation attempts across 11 scenarios, testing whether CLAUDE.md instructions could drive agents to use specific CLI tools.

- Baseline (flat CLAUDE.md, no MCP): 12.5% pass rate on hard scenarios, which is 1 of 8
- Strengthened CLAUDE.md (task-oriented tables, explicit tool pointers): zero measurable improvement
- MCP tools available (structured query): 100% automatic discovery

The strengthened CLAUDE.md was well-structured. Task-oriented tables, exact tool names, usage examples. Didn't matter. Passive documentation does not drive agent tool selection regardless of structure quality. Total cost for all 82 runs: $4.65.

---

## What actually works

Three things produced real compliance. None of them are documentation.

**MCP tools for discovery.** Instead of documenting "use component X," provide a query tool that returns component X when the agent searches for the right pattern. In the 82-run validation, discovery was 100%. Not in this one: the agent had 14 tools available in every run and called none of them in three of nine, including the governance run. It finds tools it is told to use.

**PreToolUse hooks for blocking.** Instead of documenting "never import from the legacy library," install a hook that rejects the Write/Edit operation if the import is present. Zero review comments needed for that class of violation.

This one is structural, not measured. A hook that returns a deny decision blocks the call, so there is no compliance rate to report. That distinction matters more than it sounds, and I found out the hard way: I went looking for the production number on my own hook system and could not produce it. It logged approvals and not denials. Every gate I had ever granted was on disk; nothing I had ever blocked was, so the one number that would have told me whether the enforcement layer was doing anything did not exist. I fixed it, and then found the fix was mostly cosmetic. The log now holds about a thousand entries, but roughly two thirds of them landed on one day, and that day is when I last ran the regression suite: they are the suite's own fixtures, synthetic commands written to be refused. Denials from real work run five to twenty a day and are mostly benign. Worse, three of the six guards that can refuse anything still record nothing when they do. So the number I went looking for still does not exist. I just have a log that looks like it does, which is the same failure as the rules file one layer down: the instrumentation is documented, not enforced.

So: enforcement by construction works. Enforcement you can audit is a second thing you have to build, and I had not built it.

**Contextual prompts at the point of action.** Not a governance file loaded at session start. A 2-sentence instruction delivered when the agent is about to do the work. "Use the design system. Use MCP tools to discover components." That's it. Ten points better than the comprehensive governance file, on the like-for-like comparison.

The pattern: Discovery (MCP, 100% automatic) > Routing (skill instructions, about 80% and only with hints) > Documentation (CLAUDE.md, ~0% for behavioral shifts). CLAUDE.md occupies a dead zone: too late for discovery, too early for routing.

---

## What this means for your CLAUDE.md

If your governance file contains "always use X" or "never do Y," those rules achieve approximately 0% compliance for anything the agent wouldn't have done anyway.

**Rules that work:** Factual context the agent can look up ("the config file is at `path/to/config`"). Constraint declarations that hooks enforce ("imports from `legacy/` are blocked by PreToolUse hook"). Workflow pointers that redirect to skills ("for migrations, use `/migrate`").

**Rules that don't work:** "ALWAYS use the design system." "NEVER import MUI components." "Use semantic tokens instead of hex values." The agent uses whatever's in scope and rationalizes compliance.

For every rule in your governance file, ask: what happens if the agent ignores this? If nothing happens, the rule doesn't work. Remove it or build enforcement. One enforcement hook prevents more defects than a hundred lines of documentation. (I built a full enforcement architecture around this finding; see "I Gave an AI Agent Unrestricted Shell Access _coming soon_.")

---

## Methodology notes

For anyone who wants to reproduce this:

- **Worktree isolation:** `git worktree add` from the same baseline commit per run. No run sees another's changes.
- **Scoring:** applied after all runs from diffs, same scorer throughout. Blinding was set up and not achieved: the scorer had seen the session logs. No randomisation of order.
- **What the headline rests on:** not the score. Zero design-system imports, zero semantic tokens and zero MCP calls in the governance run, counted from the diff. A rubric can be biased; those cannot.
- **Cost:** $4.65 for the n=82 validation, with a per-attempt breakdown. Accessible to any team.
- **Model:** Claude Opus 4.6. The 0% finding is architectural (optimization target mismatch), not model-specific.
- **Limitations, plainly.** One scorer, no blind, and the governance condition is a single run. The rubric also has a defect I did not catch until later: its dark-mode dimension counts Tailwind palette classes, so code that bypasses Tailwind entirely scores 5 out of 5 on it. The two no-guidance runs collected that free 5 while carrying 121 to 270 hardcoded hex values, and the governance run collected it with 2, which means any conversion of 16.3 or 16.4 into a percentage is reading two points that were never earned. None of this touches the 0%, because that is a count of imports rather than a score.
