---
title: "The Verification Gap: We Automated Code Generation and Forgot to Scale Review"
description: "We scaled code generation and left review behind. Four weeks of org data: 90.7% of pull requests AI-assisted, and at least half merged with no human review. The dashboards say review caught up because they count bots as reviewers. The gap, and how to close it."
pubDate: "Sept 28 2026"
heroImage: "../../assets/blog/the-verification-gap/hero.webp"
tags: ["ai", "programming", "machinelearning", "productivity"]
slug: "the-verification-gap"
---

_James Coombs is a design engineer who writes the code-review skills that AI agents run on pull requests. He pulled four weeks of merged pull requests across 49 repositories to see whether review was keeping up with generation. The dashboard says it is. Take the bots out and it isn't._

Across 49 repositories in one engineering org, 1,239 pull requests merged in the four weeks from 24 August to 20 September 2026, and 90.7% of them were AI-assisted (flagged as such at commit time). Half of them, 50.6%, merged without a review from any person's account. Not a light review. None. And that is the floor, because several engineers post agent-written reviews under their own names, so a review from a person's account is not always a person's review. The org's review metrics look healthier: the median pull request collects two comments, and only 30.6% carry none. Both are true, because the metrics count bots as reviewers. In the last week of that window, bots left 635 of the 898 reviews. We scaled how fast code gets written, then scaled review by the same means, and human review did not scale at all.

## The gap, and the easy story that's wrong

I first ran these numbers in July, on one week and 331 pull requests. Then the median pull request got zero comments, 55.6% carried none, and 43.2% had no review from anyone but their author. Now they read two, 30.6% and 25.7%. That looks like review catching up. It isn't. Count only reviews from people's accounts and the share of pull requests with none went from 47.7% in July to 50.6% over the last four weeks, and 61.6% in the most recent week alone. The dashboard's gain is bot reviews.

The tempting narrative is that AI writes sloppy code and humans wave it through. I cannot test that, and it is worth being precise about why rather than reaching for the nearest number. The collector counts pull requests whose title begins with "revert". That is a count of revert PRs, not a measure of whose code later got reverted, and there was exactly one in four weeks. Reverts also only count regressions someone caught, so here they undercount defects rather than clear the code. In July I read something into speed: AI-assisted PRs sat open a median of 2.4 hours against 0.6 for human-only ones. Now it is 3.4 hours against 3.8, single weeks point both ways, and only 115 of 1,239 PRs were human-only, so I've dropped that argument.

One caveat before anyone builds a policy on these figures: this is a single organization over **four weeks**, so read it as a shape rather than a constant. Small repositories skew hard, and this set is full of them. Twenty of the forty-nine had three or fewer merged pull requests in four weeks, and 27 of 49 sit at a median of zero comments while the pull-request-weighted median is two. So do not lean on the per-repo count. Inline comments are also recorded per pull request rather than per author, so the share with no human comment can only be bounded: between 37.8% and 66.2%. The number that survives both objections is review coverage: **627 of 1,239 pull requests had no review from any person's account at all**, and agent reviews posted under people's names mean the true count is higher.

A zero-comment approval isn't automatically a bad review. Sometimes the change is trivial and the reviewer is right to wave it through. The stricter measure, approvals carrying no written comment at all, is 5.3% of every pull request. Measured against the 49.2% that collected an approval, about **one in nine** was approved in silence, down from one in four in July. Restrict it to approvers on people's accounts and it is 17.7%, closer to one in six. What I'm not saying is that a bot review is worthless. The point is that a bot reviewing an agent's pull request is the system checking itself, and a metric that books it as review cannot tell the difference. When at least half the merges have no human reviewer, review has quietly become a signature, and increasingly a machine's.

## Why the obvious fix fails

The reflex, once you see this, is to mandate rigor. Require substantive comments. Add a review checklist. Bolt on a required check nobody tuned. Write "verify behavior, not just code" into the contributing guide or the agent's instruction file.

I've measured what happens to that kind of instruction. In an earlier ablation study on behavioral rules written into an AI agent's configuration, [compliance was 0%](/blog/why-your-claude-md-rules-dont-work/). A rule that costs something to follow, and that nothing enforces, is followed exactly as often as a rule that doesn't exist. The same logic holds for humans and review checklists. The checklist that adds five minutes to a two-line change is the checklist people learn to skip.

So here is what I want to argue against: the idea that the verification gap is a rigor problem. It isn't. Rigor is easy to specify and easy to ignore. The gap is an adoption problem.

## Why this is an adoption problem

You can design a review process that catches everything. If it costs more than people will pay on the median change, they route around it, and a check that's routinely skipped provides less assurance than a lighter one that actually runs, as long as the lighter one still clears a real floor. Drop below that floor and you get the worse failure: a check that runs, passes, and manufactures confidence while the defect ships anyway. So the design question is not how thorough the check can be. It's how thorough it can be while people still run it on the PR they were about to wave through.

The org numbers show the gap. What building the tooling taught me is the cause: the checks meant to close it get skipped, not that they're wrong. That's one skill in one org, a starting point rather than a proof. Four things made the difference.

**Scale the bar to the risk.** Each change gets a risk tier from two factors: how likely it is to break something, and how bad it would be if it did. A copy tweak owes a single piece of evidence; a change to a payment path owes the full contract. The catch is who sets the tier: if the author scores their own risk, the light bar becomes the bar everyone claims, so the tier has to come from something they can't quietly overrule, a diff heuristic or a path rule. Get that wrong and you've only moved the gaming from skipping the check to misgrading the risk.

**Never demand evidence that can't be produced.** This is the one most checklists get wrong. Every required item has to name how you would actually produce it. A requirement with no capture path, a screenshot of a change that has no visual output, can't be satisfied, and an unsatisfiable item is worse than no item, because it teaches people the whole system is noise. An unreachable bar doesn't just fail on its own line. It discredits the reachable ones next to it.

**Artifact over claim.** Stop accepting prose as proof. "Tested manually" is a promise, not something a second person can inspect. A screenshot, a grep result, a test output, a log line: those are evidence. In the skill a bare claim downgrades a requirement to partial at best, because the sentence is exactly what the artifact is meant to replace. That matters more when at least half the pull requests never reach a human who could ask for the artifact.

**Refuse to launder your own output.** This is the counterintuitive one. When the skill both gathers evidence and grades it, the evidence it gathered itself can't lift a requirement above partial, and it's flagged as self-reported. An agent that verifies its own work and reports "verified" has told you nothing. And that flag has to feed a gate that acts on it, not sit in a record for a human reviewer who, on at least half of these merges, doesn't exist. The same holds one level up: an org whose bots review its agents' code, and whose metrics call that review, has laundered its output at org scale. The moment a system checks itself, the ceiling on its own confidence has to be enforced rather than advisory, or it has turned a claim into a fact.

## What didn't work

None of this arrived clean. The first version demanded the full evidence contract on every change. It was thorough, and it was ignored worst on small PRs, the exact high-volume case a light check is for: I had built the payment-change bar and pointed it at typo fixes. The second mistake was demanding evidence with no capture path, then watching reviewers decide the tool was noise and stop reading all of it, including the parts that were signal. The lesson is uncomfortable: a bar that gets ignored is worse than no bar, because it also burns the credibility of the next one you set.

## Where this leaves you

The verification gap will not close by writing "review more carefully" into a policy, and it will not close by adding review bots and watching the comment count rise. Generation got automated. Review has to be re-engineered to survive the volume: scale the bar to the risk, give every required item a real capture path, prefer artifacts to assertions, and make any system that checks itself say so.

You don't need my data to start, and the real test is whether the skip rate drops when another team adopts this. First, split your review metrics into human and bot, and count an agent review posted from a person's account as the agent's, because until you do, the dashboard will tell you the gap is closing while it widens. Then find the check your team quietly skips on small changes, and ask whether it's skipped because it's worthless or because it's miscalibrated. If it's miscalibrated, the fix isn't more discipline. It's a lighter bar for the low-risk case, so the check survives to catch the high-risk one. Go find that check this week.
