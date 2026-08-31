---
title: "Your AI Skills Have the Same Problem as Your CLAUDE.md. Here's the Data."
description: "A controlled ablation, 42 runs: a behavioral-payload skill added zero marginal defect detection over a no-guidance control. A skill whose payload is documentation inherits documentation's 0%."
pubDate: "Aug 31 2026"
heroImage: "../../assets/blog/ai-skills-compliance-ablation/hero.webp"
tags: ["ai", "machinelearning", "programming", "productivity"]
slug: "ai-skills-compliance-ablation"
---

_James Coombs is a design engineer who ran a 42-run controlled study to test whether a discipline skill he wrote, and used for months, caught anything a plain agent wouldn't. It didn't. He maintains a 60-component design system and has run two prior studies on why AI governance-by-documentation fails._

I wrote a skill to make Claude audit its own changeset before every commit: six bug-pattern dimensions, a required output format, a clause that refused the usual excuses. I used it for months. Then I ran a controlled study to see if it caught anything a plain agent wouldn't.

It didn't. 42 runs, and a no-guidance control caught every planted defect the skill caught. Zero marginal detection. The same result my CLAUDE.md rules got, one layer up.

This isn't a claim that skills don't work. Skills that route, discover, or enforce work fine. It's narrower and more uncomfortable: a skill whose payload is behavioral documentation ("here are the things to check for") inherits documentation's 0%, because the model already does the thing whether the skill fires or not.

---

## The skill

`self-review`. Before a commit, it scanned the diff across six dimensions: whether errors propagate, whether tests actually test, whether docs match the code, whether a comparison can ever match at runtime, whether a called interface actually exists, and whether the change reaches beyond its task. Each dimension had to report "Checked: X. Found: Y." It refused rationalizations: "the diff is small," "I already reviewed it mentally."

On paper it was a well-formed discipline skill. That's the point. It was well-formed and it did nothing.

---

## The study

Same shape as my CLAUDE.md ablation: two arms, one with the skill, one with no guidance at all, each scored on whether it caught a planted defect. I escalated difficulty across three rounds, each one built to give the null result a chance to break.

| Round       | Planted defect                                                                                                           | Control (no skill) | With the skill |
| ----------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------ | -------------- |
| Easy        | import of a function that doesn't exist; scope creep against an explicit brief                                           | 10/10              | 10/10          |
| Hard        | swapped-argument bug whose definition was buried in another file; unrequested scope creep with no priming                | 6/6                | 6/6            |
| Adversarial | a config-key typo returning `undefined`, under pressure to sign off ("the lead already looked, we ship in five minutes") | 5/5                | 5/5            |

The control never failed. 21 control runs, 0 misses. In the adversarial round the plain agent refused to sign off on a real bug even after being told the reviewer had already approved and the clock was running. It found defects I never planted: a count that included skipped items, a 500 on a duplicated query parameter, an error field the SDK doesn't expose.

The skill's marginal value, every round, was 0.

---

## Why

The agent is a competent reviewer by default. Telling it to review is like handing a checklist to someone already running the check. When the skill and the agent's default align, the skill is redundant.

That is the opposite failure from my CLAUDE.md study, where the rules asked for behavior the agent wasn't doing and got rationalized away. Same verdict, opposite mechanism: there, documentation couldn't raise a floor; here, a skill couldn't exceed a ceiling.

The skill was squeezed from both sides. Below it, the deterministic checks I already run on every Stop (type-check, lint, format) own the mechanical half: unused imports, dead code, duplicate constants. Above it, model competence owns the judgment half. The band in between, the thing the skill claimed as its value, is empty.

---

## Three layers, one result

I've now seen this at three layers of the stack.

CLAUDE.md rules for behavioral shifts scored 0% compliance, in an earlier study of mine, [Your CLAUDE.md Rules Achieve 0% Compliance](/blog/why-your-claude-md-rules-dont-work/). The architecture that actually fixed compliance was hooks, not documentation, which I wrote up in [I Gave an AI Agent Unrestricted Shell Access](/blog/ai-agent-safety-architecture/). And now the skill layer: a skill whose payload is "remember to check" is a CLAUDE.md rule wearing a slash command, and it scores the same 0.

The split holds all three times. Discovery (a tool the agent queries) and enforcement (a hook that blocks) change behavior. Documentation, and what I'll call routing-by-restatement, a skill whose payload just repeats the behavior you want instead of pointing to a tool, do not, for anything the agent already does. A skill that routes to a tool is a different thing, and it works. My Stop hook said this out loud months ago: it replaced an LLM "please check your work" round with a zero-token deterministic gate. Retiring the review skill is that same move, finished one layer up.

---

## What I did instead

I deleted the skill. I kept one thing.

Across all 42 runs, the only behavior that differed between the arms was small. Agents following the skill reported what they could not verify ("unverified: I did not open that file") instead of folding it into "looks fine." That honesty is worth keeping. So I moved it out of a standalone skill and into the point where the work actually hands off: a single instruction in the implementer's handoff step to report evidence rather than assertion, and to flag the unverified explicitly.

That matches what the ablation taught me the first time. A two-sentence instruction at the point of action beat a comprehensive governance file by 11 points. The salvage is the same principle: not a skill loaded at session start, an instruction delivered when the agent is about to act. If it ever needs teeth, the right form is a hook that blocks a "clean" claim with no evidence behind it, the same shape as the quality gate I already run.

---

## What this means for your skill library

Run the test I ran on my CLAUDE.md rules, on your skills. For each one, ask what happens if the agent never loads it. If the answer is "the same thing, because the model does it anyway," the skill is inert, whatever the slash command in front of it suggests.

The suspects are the review-shaped and checklist-shaped skills: "audit the diff," "check for these patterns," "remember to validate." They feel productive to write. They encode competence the model already has. Point a no-guidance control at each one and watch whether the control fails. If it doesn't, the skill adds nothing to a clean review: keep the one behavior worth keeping at the point of action or behind a hook, and drop the rest. One honest limit on that advice: clean review is the best case for the control, and it is the only case I tested. If a skill is really meant for long, self-authored work with momentum to finish, that regime is untested here, and a hook that fires at the moment of action is a safer home for the check than a skill loaded at session start.

Every skill you retire is prompt budget returned: its description stops loading into every session, and its body stops loading into the ones that used to trigger it.

---

## Methodology notes

- **Design:** two arms (skill, no-guidance control), 5 planted-defect fixtures across 3 difficulty rounds, scored by reading each run's findings for the planted defect. Never by keyword match; template echoes fake both a hit and a miss.
- **Reps:** 42 runs, 21 per arm. Small per cell (3 to 5), so no single cell proves much. The result is only strong pooled, and even then loosely: 0 misses in 21 control runs puts the pooled miss rate under about 14% at 95% confidence (rule of three). But those 21 span easy, hard, and adversarial fixtures unequally, weighted toward easy, so the bound describes the mixture, not the hard tail. The adversarial cell on its own (0 of 5) is only bounded near 60%. Treat 14% as directional, not a clean rate, and if a decision is close it tells you how many more runs to buy.
- **Confound:** the skill arm was told to follow the skill, so "skill vs. control" partly measures instruction-following. The comparison that carries the weight is the control on its own: with no guidance at all it already catches everything, so the skill has no headroom to add value.
- **Scope, and where I'd expect the skill to earn its place:** every run was a fresh agent given one small diff and one job. That is the best case for attention. I did not test the regime the skill was really for: an agent 30 turns deep, reviewing code it wrote itself, with momentum to finish. I have exactly one data point from that regime, and it's me. Halfway through this investigation I asserted a claim I hadn't checked, one turn after writing the "report evidence, not assertion" rule I just described. The failure the skill targets is real. It shows up under load, not in a clean review. That is exactly the setting where a session-start skill helps least and a hook helps most.
- **Model:** Claude Opus 4.8. My CLAUDE.md study was Opus 4.6. The finding held across both, which fits the earlier claim that it's architectural, not model-specific.
- **Cost:** 42 subagent runs, roughly 1.3M tokens. Cheap enough to run on every skill you own before you decide to keep it.
