---
title: "Context Is a Contaminant: Your AI Reviewer Should Know Less"
description: "A reviewer that knows who wrote the code and why reviews it worse. Independence comes from withholding provenance, not adding context. Your AI reviewer should know less."
pubDate: "Oct 4 2026"
heroImage: "../../assets/blog/context-is-a-contaminant/hero.webp"
tags: ["ai", "programming", "machinelearning", "productivity"]
slug: "context-is-a-contaminant"
---

_James Coombs is a design engineer who builds the review agents that check other agents' output before it ships. What he keeps relearning is that a verifier gets worse as you give it more of the wrong context._

When I finish something an AI helped produce, I don't ask it whether it's right. It will tell me it's right. I hand the artifact to a second agent that never saw the first one work, give it the standard the work has to meet, and tell it to prove the thing wrong. The last time I did this, the fresh reviewer flagged a benchmark figure I'd have sworn was solid. It had no reproducible source.

That cuts against the default advice, which is to give a model more context so it can do a better job. For generating, the advice is right. For verifying, some context is fuel and some is poison, and the two are easy to confuse.

## Why the generator can't review itself

The agent that produced an artifact is a poor judge of it, because it is committed to what it just made. Ask it "is this correct?" and it re-runs the reasoning that produced the thing, lands in the same place, and reports confidence. It isn't lying. It is defending its own output, and self-review from that position is theater. We accept this for humans; it's why we don't merge our own pull requests unreviewed.

There are two failure modes here, and conflating them is how people build weak verifiers. One is anchoring: an agent that watched the work get made inherits the author's frame. The other is plain agreeableness: a language model handed almost anything tends to say it looks fine. A fresh reviewer fixes the first. Only an adversarial job (find what's wrong and prove it) plus a hard evidence rule fixes the second. You need both, and most people ask the same agent, in the same conversation, "does this look right?" and get neither.

## Withhold the story, not the standard

Here is the distinction the word "context" hides. There is context about _how the artifact was made_, the author's reasoning, the running intent, the last reviewer's verdict. And there is context about _what the artifact must satisfy_, the spec, the conventions, the cross-file invariants. The first is the contaminant: it transfers the author's confidence to the reviewer. The second is ground truth, and starving the reviewer of it doesn't sharpen the review, it blinds it.

So the rule isn't "give the reviewer nothing." It's withhold the story, supply the standard. A blind reviewer with no spec misses the defects that only exist relative to the system: the duplicated utility, the violated boundary, the change that's correct in isolation and wrong for this codebase. If correctness depends on an invariant the artifact can't carry on its face, that invariant goes in as ground truth, pulled from spec or tests, not the author's say-so. What never goes in is how the thing came to be.

Three mechanics follow, and each is about what the reviewer sees, and when.

**Start with no provenance.** The reviewer is a fresh agent with no memory of the work being produced. Its brief is explicit: you have no history on how this was made, judge it on what it says and what the sources show. Independence isn't requested as good behavior; it's manufactured by starting blind.

**Withhold the previous round.** When a second pass is warranted, it sees the revised artifact and the diff, not the first round's findings or severity labels. Show a reviewer what the last one thought was critical and it pattern-matches to that verdict instead of forming its own. That is anchoring in the literal sense, and the fix is to keep the second pass as blind as the first.

**Check the sources before the reasoning.** Before asking whether the argument holds, check whether the facts under it are real and reproducible. A claim whose source can't be re-established is a finding on its own, usually a hallucination, and it has to be caught before anything built on top of it is judged. A sound argument on an invented number is still wrong. This ordering is the part most setups skip, and it's where a fresh reviewer earns its keep.

The author responds, but one rule keeps the response honest: for a finding about a fact or a source, the rebuttal has to be a file and its contents that anyone can open, not an argument about why the reviewer misunderstood. A path and the line that settles it is checkable by a third party. It's the rule I've argued for review in general, [a claim loses to an artifact](/blog/the-verification-gap/), pointed back at the author.

Reasoning-level disagreements no file can settle, a race that can't occur, a check that happens upstream, don't get waved away; they go to a human. So does the verdict the tool isn't allowed to act on alone: if the reviewer says "rethink the approach," it stops and hands the call over rather than quietly rewriting the plan. The loop is capped at that, one round, sometimes a second, rarely a third; two passes that don't converge usually mean the unit is too big to review whole or the standard itself is ambiguous, and more blind passes won't fix either.

## This isn't just "add a verify step"

If you've read about loop-correctness patterns, this is adjacent. Those patterns make one agent's loop trustworthy: generate, record, check against ground truth, act on the difference. They assume one loop, and a second agent isn't a new idea either. The move that matters is what you refuse to hand it: the provenance you already have, which would make the review easier and useless.

## What didn't work

The first versions gave the reviewer more, on the theory that context helps. I fed it the author's reasoning so it could understand the intent. It understood the intent and adopted it. The pattern held across runs: the more the reviewer knew, the more agreeable it got.

The second mistake was letting the author fix its own flagged issues in place. Every fix quietly re-introduced the bias the fresh pass had removed, because the same committed agent was deciding what "fixed" meant. The rule that replaced it: the reviewer reports, the author revises, a new blind pass judges the result. Nobody grades their own repair.

The next time you have an agent check its own work, don't; it will pass itself. Give the artifact to something that never watched it get made, hand it the standard and not the story, and make every factual rebuttal point to a file anyone can open. You give up an agent that always says the job is done. What you get instead can tell you when it isn't.

I ran this piece through that process before you read it. The blind pass made me cut a claim I was fond of and pin down the word "context," which I'd been using to mean three different things. It wasn't the first time, and I've started keeping a log of these catches. Every entry is something I'd already read and passed. This is the version that came back.
