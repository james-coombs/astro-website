---
title: "Your Migration Guide Is Already Wrong"
description: "A migration guide starts rotting the moment it is written. Separate knowledge, procedure, and data, and the guide becomes a product that stays right."
pubDate: "Aug 19 2026"
heroImage: "../../assets/blog/your-migration-guide-is-already-wrong/hero.webp"
tags: ["webdev", "refactoring", "documentation", "architecture"]
slug: "your-migration-guide-is-already-wrong"
---

_James Coombs is a design engineer who replaced a migration guide with 49 JSON data files and a handoff playbook. Engineers on four other teams migrated components without being walked through it. Zero legacy imports in the migrated codebase._

I wrote a migration guide for a 962-file Material UI to custom design system migration. Within 10 days, 4 of the files it referenced had already been migrated and the counts were wrong. The guide listed 941 files; the real count was 939 and dropping. Notes referenced deleted files. Per-package breakdowns were stale in 3 of 12 tables.

The guide was the wrong artifact. "Single source of truth" and "documentation drift" are known problems. The specific lesson: for a design system migration with 12 packages and active parallel work, the threshold at which a guide becomes wrong is measured in days, not months.

---

## Why guides fail

A migration guide is a snapshot. The codebase is a stream. The guide says "246 MUI files remaining in the dashboard package." An engineer migrates 3 files. The guide now says 246 when the answer is 243. Nobody updates it. A week later, another engineer reads "246" and plans accordingly. The plan is wrong before it starts.

This isn't a discipline problem. Expecting engineers to update a prose document every time they migrate a file is expecting a process that scales linearly with migration volume. The whole point of automation is to avoid linear scaling.

The guide also had a structural problem: it mixed procedures ("run this command"), data ("these files need migration"), and rationale ("here's why we chose this approach") in a single document. When the data changed, the procedures that referenced it drifted. When the procedures were updated, the rationale paragraphs still described the old approach.

---

## 48 JSON files

The replacement: 48 structured data files (~6,900 lines of JSON) driving all automation. 6,900 lines of JSON is not simpler than 200 lines of prose. It is more correct. The complexity didn't disappear; it became machine-verifiable. A JSON file with a wrong component mapping fails a test. A prose guide with a wrong component name passes every check except a human reading it carefully.

Three categories:

**Mappings (12 files).** Component-level transforms: MUI component name, design system equivalent, prop translations, composition changes, conditional mappings. Each file covers one component family. Adding a new mapping is a data change, not a code change. (I covered how these feed the migration engine in "Scoring, Gating, Ratcheting: The Migration Engine Nobody Builds.")

**Rules and checks (18 files).** Validation logic: which bundles need design system config, which imports are forbidden, which CSS variants apply to which packages. Each check has scoped applicability conditions (verify component usage before applying config, not just package dependency).

**Configuration and status (18 files).** Bot configuration, phase definitions, package metadata, status tracking. The `phases.json` file defines the 7-phase rollout: which packages in which order, T-shirt complexity sizing per package, current status per file.

The key property: every number that appears in human-readable output is computed from the JSON, not hardcoded. `pnpm migration:status` reads the data files, counts the files in each state, and prints the current totals. The CLI is the source of truth. The data files are the source of the CLI. Nothing else is authoritative.

The JSON is supposed to not drift, because the migration bot is meant to be its single writer. In practice the status file's last write was a human pull request and its timestamp is six months old, which is the same failure one layer down and the reason the redesign below exists. The schema half does hold: tests validate the schema (confidence scoring, state machine transitions, plan validation, rule validation). When a mapping is wrong, a test fails. When a prose guide is wrong, nobody notices until someone reads it carefully.

---

## Three-layer separation

The early version of the migration system had the "tutorial anti-pattern": procedures embedded in prose, data mixed with instructions, rationale interleaved with commands. When the JSON schema changed, the prose instructions drifted. When the CLI commands were updated, the tutorial still described the old flags.

Separating "what" from "how" from "why" is standard architectural practice. The specific application to migration infrastructure is what mattered here. The refactored architecture enforces strict separation:

**Commands** (orchestration only): "Execute checks 2a through 2e from checks.json." The command layer knows WHAT to run, not HOW it works or WHY it exists.

**Data** (JSON): Mappings, rules, checks, configuration. The data layer is machine-readable and CLI-queryable. Tools read it directly. Humans read the CLI output, not the JSON.

**Documentation** (markdown): WHY features exist, not HOW they work. Architecture decisions, trade-offs, context for future maintainers. The documentation never contains a number, a file count, or a procedure.

The refactor replaced 200+ lines of procedural prose with 10-20 lines referencing JSON. Zero regression. The migration kept running through the refactor because the data files (the actual source of truth) didn't change.

---

## The playbook as product

The data files and the engine run the migration. The playbook tells engineering managers how to hand it off to their teams.

Not a document: a product. Eleven sections, of which four carry the weight:

**Decision trees.** "The tool stopped: did it write anything? If yes, review the diff and finish by hand. If no, check whether the file is in the curated list." Branch on observable state, not on judgment calls.

**CLI reference.** Every command an engineer needs, with expected output. `pnpm migration:status --package dashboard` shows the current state; the flags are space-separated, and an equals sign is parsed as part of the value. `pnpm migration:scan --file Packages/dashboard/src/pages/Home.tsx` shows what needs to change. No tribal knowledge required.

**Day-1 checklist.** What to do in the first hour of picking up a migration task. Read the file's confidence score. Check its state in the state machine. Review the component mappings. Run the scanner. This eliminates the "where do I start?" problem that kills velocity on the first day of any unfamiliar task.

**Definition of done at 4 tiers.** Per-file done (all MUI imports removed, tests passing). Per-package done (every file in the package at "complete" state). Per-phase done (all packages in the phase at package-done). Full migration done (all phases complete, legacy framework dependency removed from package.json).

The playbook went out for spot-checks before broad rollout, to three people picked for their distance from the work rather than their availability: an engineering manager with no migration context, a technical EM whose team was furthest along on adoption, and an IC lead who had reviewed migration pull requests without living in them. Each got a different entry point and three questions, and the questions were the point. The cold reader was asked which phases applied to his team and how he would check his team's current progress. The technical reader was asked whether the data-file cleanup was right for his packages and whether the CLI-first approach matched what he would actually run. The IC lead was asked whether he could tell where to start, and whether the CLI references were clear enough to type. Every one of those is answerable in ten minutes and none of them can be answered by skimming.

Over the following three months, engineers on four other teams shipped design-system migrations against their own teams' tickets, without scheduled pairing sessions and without anyone assigning them a phase. No package reached zero in that window, so this is adoption spreading by individual rather than a phase plan being executed. Individual questions came through Slack, but nobody asked "how do I start?" Nobody updated a stale guide. The CLI always had the current numbers.

---

## What didn't work

**Half the playbook shipped at month 7. The half engineers needed shipped ten weeks after that.** The manager-facing overview went up on the wiki. The engineer-facing document, the one with the day-one checklist and the decision trees, was written, reviewed, and then sat on a branch for two and a half months after its pull request was closed unmerged, with the wiki page pointing at a dead link the whole time. It reached the main branch only after the work it was meant to unblock had already happened without it. The system was mature and the engine was running, and engineering managers still couldn't plan team assignments, because the artifact they were told to read did not exist at the address they were given. EMs need 4-6 weeks of lead time to allocate migration work. Shipping the playbook alongside the first usable version of the engine would have accelerated adoption by months. The handoff artifact is the delivery mechanism, not documentation. Shipping it last is shipping the product last.

**Instrumentation started at month 3**, counting from the first design-system commit in November 2025. The learning log that feeds governance rules (covered in "Scoring, Gating, Ratcheting") started 3 months into the project. Earlier failures had to be reconstructed from git history. The strongest impact period (months 1-3, when the architecture was established) was the least documented.

**Hardcoded counts in phases.json, and a fix that took ten weeks to land.** The first version of the phase configuration listed 25 curated files and a manually entered total of 969. Within days both had drifted. The fix was the same principle applied everywhere, compute rather than hardcode, and it was written into the same pull request as the playbook: strip the total, strip the percentage, strip the per-package counts, and replace each one with the command that regenerates it. That pull request was closed unmerged and the fix sat on the branch with it for ten weeks. When it finally landed, the cleanup told the story better than the original numbers had. The header claimed 19 curated files. The list underneath it held 16, because an earlier edit had dropped nine entries and moved the count by six. Twelve of those 16 then came out: four files no longer exist in the codebase, and eight no longer import MUI in the file that was named, though two of the eight still pull it in through a sibling style module and are booked for re-curation. Four are left, out of 25 at the start. The header number had been wrong about its own list for four months before anybody got as far as asking whether the list was right about the codebase.

---

## The numbers

| Metric                                                        | Value                                                                                                                                   |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Data files                                                    | 49 (9,471 lines of JSON) as of 2026-08-19, of which 25 files and 4,635 lines are the migration pipeline; the rest are sibling pipelines |
| Playbook length                                               | 588 lines at handoff, 11 sections; the CLI reference and decision trees are 16% of it                                                   |
| Files targeted for migration                                  | 962 across 12 packages, as recorded in April 2026                                                                                       |
| Time before the manual guide was wrong                        | 10 days                                                                                                                                 |
| Engineers on other teams who shipped design-system migrations | 4, across four ticket prefixes                                                                                                          |
| Legacy imports remaining in the migrated scope                | 0                                                                                                                                       |
| Claude Code slash commands documented                         | 13                                                                                                                                      |
| Spot-check recipients                                         | 3 (cold-start EM, technical EM, IC lead)                                                                                                |

One more, and it happened while I was writing this.

The paragraph above first said the curated list fell to 6. That was the number on the branch where the fix had been written. By the time the pull request actually went up, the same field read 4, because two more of those files had been migrated in the weeks in between. I had taken a count from a document describing the codebase instead of from the codebase, which is the precise error this article is about, committed inside the article about it. The fix was the one I am recommending to you: I ran the thing and read what it said.

---

## If you're organizing a migration

Replace every hardcoded number with a CLI command. If the count lives in a document, it's already wrong. If the count lives in a CLI that reads the codebase, it's always right.

Separate commands, data, and documentation. When one changes, the others shouldn't need updating. If your migration guide contains both "here's why" and "run this command," it will drift.

Ship the playbook with the first usable version of the tooling, not after. Engineering managers plan in 4-6 week cycles. If they can't see the handoff artifact, they can't allocate the work.

Spot-check the playbook with three people at different distances from the work, and ask each of them the question only they can answer. Give them ten minutes of specific work, not an open-ended review, or you will get an open-ended silence back.

Start the learning log on day 1. The failures from the first week produce the rules that prevent failures for every month after.
