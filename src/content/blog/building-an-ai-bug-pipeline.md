---
title: "The Hard Problem Isn't Automation. It's Classification."
description: "Automating a bug pipeline is the easy part. Deciding which tier each bug belongs to is the bottleneck, and it is where the real engineering lives."
pubDate: "Sept 13 2026"
heroImage: "../../assets/blog/building-an-ai-bug-pipeline/hero.webp"
tags: ["ai", "programming", "testing", "automation"]
slug: "building-an-ai-bug-pipeline"
---

_James Coombs is a design engineer who built an AI-assisted bug pipeline that ships full-stack fixes across backend, API, and frontend layers in production._

An "error handling improvement" that touches C# backend, GraphQL schema, and React frontend required 5 hours and 17 iterations. The title said Tier A. The integration boundaries said Tier B. The difference between those tiers is the difference between 70 minutes of wall clock and a full day.

AI agents can fix a lot of bugs. "Throw every ticket at an agent" fails for a predictable reason: the hard problem isn't getting AI to write the fix. It's knowing which tickets to give it, how much supervision they need, and when to stop the agent before it burns hours on something that needs a human.

---

## The pipeline

Four stages. Select, Classify, Dispatch, Monitor.

**Select** queries the project tracker, filters open tickets, ranks by estimated complexity. Nothing novel.

**Classify** reads the ticket, examines the code, and assigns a tier:

| Tier | What it means                  | Human involvement    | Typical time          |
| ---- | ------------------------------ | -------------------- | --------------------- |
| A    | Single-layer fix, clear scope  | None until merge     | ~70 min (5 min human) |
| B    | Crosses integration boundaries | Human reviews the PR | ~4-5 hours            |
| C    | Investigation only             | Human implements     | ~30 min analysis      |

**Dispatch** routes to the implementation skill with domain-specific context pre-loaded: build commands, CI failure patterns, cross-layer rebuild sequences. A generic agent discovers these through trial and error (3-5 CI failures per unfamiliar pattern). The pipeline pre-loads them.

**Monitor** re-runs critical gates independently after the agent finishes. Doesn't trust that the agent honored the injected context. Also tracks CI, triages reviewer comments, and coordinates parallel tickets.

---

## The rule that matters most

> If a ticket touches 3+ integration layers (backend ORM + API schema + frontend component), reclassify to Tier B regardless of stated complexity.

This exists because of one ticket. The title said "error handling improvement." The actual fix required changes across backend, API schema, and frontend files, 5 hours, and 17 iterations across layer boundaries. Cross-layer tickets look simple from the title. They explode at integration boundaries.

The 3-layer rule catches this before dispatch, not after a failed automation attempt.

---

## Results across 8 runs

Full-stack range: backend services, API resolvers, frontend components, error handling, one security finding (an authorization check missing on a file-sharing endpoint).

The CI failure pattern library started empty. Seven recurring patterns accumulated over 8 runs. By run 5, the agent was hitting familiar patterns and applying known fixes on first encounter instead of iterating.

The most interesting output wasn't the bug fixes. During one Tier B run, the agent fixed the reported bug and then identified a systemic error-handling pattern: API endpoints across the codebase were swallowing inner exceptions and returning raw error details to clients. That wasn't in the ticket. It was discovered during investigation.

In a later run, a UI alignment fix surfaced two more systemic issues during QA: undersized form controls from a design system migration regression, and redundant wrapper components across 5+ files that should be caught by an ESLint rule. One pipeline run generating three tickets of follow-on work.

Fix one bug, surface the pattern. That cascading discovery is the highest-value output of the pipeline, higher than any individual fix.

---

## Why tiers, not binary

The obvious approach is "automate or don't." Tiers are better.

**Tier B captures the valuable middle.** Many tickets are too complex for full automation but too simple to justify a full human implementation. Agent implements, human reviews the PR. That middle ground is where most of the backlog lives.

**Tier C produces value without risk.** Investigation-only tickets generate a plan, identify affected files, estimate scope. Even with manual implementation, the analysis saves 30-60 minutes.

**Reclassification catches misclassifications early.** The 3-layer rule reclassifies before dispatch. Better than learning the ticket was Tier B after the agent has been running for 2 hours.

The same "enforcement over documentation" principle (covered in [I Gave an AI Agent Unrestricted Shell Access](/blog/ai-agent-safety-architecture/)) applies here: the classifier blocks dispatch, not documentation.

---

## The independent verification gate

The agent is optimizing for task completion. It will report "all tests pass" based on the subset of tests it ran.

The monitor re-runs the full gate (type checker, build, lint) to catch:

- Tests that pass in isolation but fail in the full suite
- Type errors in files the agent didn't modify but that depend on modified interfaces
- Build failures from stale codegen (GraphQL schema changes without re-running codegen)

Trust but verify. The verification gate exists because the agent's "done" and my "done" are different standards. This is the same compliance gap from my ablation study ([Your CLAUDE.md Rules Achieve 0% Compliance](/blog/why-your-claude-md-rules-dont-work/)): the agent says "done" and means something different than I do.

---

## What I'd build differently

**Customer-facing framing from day one.** The pipeline started as "fix bugs faster," an internal productivity framing. A stronger frame: "proactive customer quality discovery." Two of the queued tickets turned out to be customer-experience fixes: notification emails referencing unavailable features, and malformed output files. That reframe changes who cares about the pipeline and how it gets resourced.

**Systemic discovery as a first-class output.** The cascading pattern (fix one, surface the pattern) was treated as a side effect. It should be an explicit pipeline output: not just "fix this ticket" but "what does this ticket tell us about the codebase?"

**Earlier CI failure pattern sharing.** The pattern library was local to the pipeline. It should feed back into shared documentation so human engineers benefit from it too.

---

## If you want to build one

Start with classification. Before automating anything, sort your backlog into tiers. The 3-integration-boundary rule works for any codebase with backend/API/frontend layers.

Build Tier A first. Get the dispatch-and-verify loop working for easy tickets before touching cross-layer complexity.

Start an empty CI failure pattern library. Add to it every time the agent hits something new. It compounds.

Point the pipeline at tickets you'd never automate. The Tier C analysis output alone is worth the run time, and occasionally a Tier C ticket turns out to be Tier A once the agent actually reads the code.
