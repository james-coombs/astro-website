---
title: "I Trusted My Own Safety Documentation. Then I Read the Test Suite."
description: "My safety doc said a control was enforced at the tool layer. It was enforced by nothing, and a passing test in the same repository had contradicted the doc for 21 days. The documented-but-unenforced control as a defect class."
pubDate: "Oct 18 2026"
heroImage: "../../assets/blog/auditing-ai-agent-safety-controls/hero.webp"
tags: ["ai", "security", "testing", "programming"]
slug: "auditing-ai-agent-safety-controls"
---

_James Coombs is a design engineer who built a 3-layer safety architecture for AI code agents after running into 7 real bypass incidents. He maintains a 60-component design system and has run controlled ablation studies on AI code generation governance._

My documentation said the guard scripts were protected from agent edits, "enforced at the tool layer." My test suite contained a passing assertion that they were not:

```
check "Write to normal hook file → ALLOW" "ALLOW" "$OUT"
```

The file that assertion targets is the largest guard in the system. The assertion was green, and it was correct. No hook enforced that protection. The only thing stopping an agent from rewriting a guard was the permission classifier's judgment, and my own documentation describing that as tool-layer enforcement was false.

The dates are the uncomfortable part. That assertion went in on day 16 of the project and had been passing for 77 days. The sentence claiming tool-layer enforcement went in on day 72. So for 21 days the repository contained a document and a test that directly contradicted each other, and the test was the one telling the truth.

I wrote about the seven bypass incidents that built this architecture in [I Gave an AI Agent Unrestricted Shell Access](/blog/ai-agent-safety-architecture/). Every one of those was handed to me: the agent did something, I noticed, I fixed it. This one was different. I found it by sitting down to audit the guards deliberately, and the audit turned up a category the incidents never did. Not a guard bug, not an agent bypass. A control that was real in the prose and absent in the code.

---

## What the gate actually was

The protection is called a self-modification gate. Its purpose is narrow and important: an agent should not be able to weaken the thing that constrains it. If the agent can edit `guard-destructive.sh`, every other layer is decoration.

The intended enforcement was the permission classifier, a model that evaluates each tool call in the permissive mode I run in. Ask it to edit a guard script and it refuses, correctly, even when I asked for the change in conversation. That behavior is real. I had watched it work dozens of times, which is exactly why I never checked whether anything else backed it up.

Two properties of that arrangement matter, and I had thought about neither.

The classifier only runs in one permission mode. Drop out of that mode and nothing consults it. The gate does not weaken; it ceases to exist.

Leaving that mode is not exotic. It is the documented workaround when the classifier is unavailable, which happened to me mid-audit: the model backing it went down, every tool call started failing, and the remedy was to switch modes and keep working. So the control was absent precisely when I was already working around a failure, at the moment I was least likely to notice.

That is an asymmetry worth naming. The gate **fails closed on an outage and open on a mode change.** An unreachable classifier denies everything, which is the correct direction. A mode change silently permits everything, with no message and no log line. Same control, opposite failure, and only one of them announces itself.

The fix is unglamorous. Six regex patterns in the hook that already gates writes, covering the 11 files that decide, mint, release or execute an approval, and deliberately not the test suite, which has to stay editable or the whole test-first workflow becomes impossible. Three of the 11 had never been in the gate list at all, including the script that mints the approval tokens. 18 assertions now cover it: every protected file denied, `Edit` denied as well as `Write` so there is no second route in, the test suite still permitted, unrelated hooks still permitted, and the existing escape hatch preserved.

Then I verified it the only way that counts. I switched out of the classifier's mode, so the layer I had been relying on was off, and tried to write a guard file myself. The hook refused. That refusal is the first evidence I have ever had that this control exists.

If you have a security control you have never seen fire, you do not have evidence it works. You have a habit of not testing it.

---

## The audit also found the credential was too weak

The same pass turned up a second problem, in a mechanism I was more confident about. I described the approval nonce and its content-binding fix in [I Gave an AI Agent Unrestricted Shell Access](/blog/ai-agent-safety-architecture/); what that piece did not say is that I found the flaw the same way I found the missing gate, by auditing rather than by being bitten.

The nonce proved the wrong proposition. It established that an approval had happened in the last 300 seconds. It never established that the approval was for _this_ command. That gap is exploitable without breaking anything: write a payload to the staging path when nothing is watching, wait, and the next routine approval executes it. The credential was a bearer token: possession proved recency, not intent.

The fix binds a SHA-256 digest of the exact command to the live nonce, and the detail that matters is the failure path: a mismatch consumes the nonce anyway, deliberately, so a rejected attempt cannot be retried against a different payload.

Ask what your credential proves, not how hard it is to forge.

---

## Why the audit found more than the agent did

The agent found seven things in 44 days. The audit found more than that in three, and the difference is not effort.

The agent only probes paths it needs. It routes around a boundary when the boundary blocks a task, which means it exercises the parts of the system that get in its way. The parts that never get in its way are never tested, and a control that does not exist never gets in anybody's way. That is why the missing gate survived: an agent that can freely edit a guard has no reason to attempt anything clever, so there is no incident to notice.

The second reason is less comfortable. I ran the audit with blind reviewers, separate agent sessions given the changed files and none of my reasoning, a technique I argued for in [Context Is a Contaminant](/blog/context-is-a-contaminant/). Two review rounds on one change document returned 23 findings I then verified against the code. All 23 were real. I had self-caught none of them.

The shape of my own errors was consistent enough to be embarrassing. Counting across the whole audit, not just those 23, twelve defects were the same species: an artifact asserting something other than what was there. Seven of the twelve were specifically an assertion that could not fail. A test whose grep read the wrong constant, so it passed by coincidence. A count of a literal that stays identical when you extract that literal into a named constant, because the constant's own definition contains it, so the test cannot detect the change it exists to verify. A comment describing the state of three other files, which one commit falsified.

Every one of those looked right when I wrote it. Every one passed. Nothing about care or attention would have caught them, because the failure was structural: each artifact asserted something other than what was there, and a passing test looks the same either way.

There is one technique that did work, and it is narrow enough to be worth stealing. When a change is already applied and its test passes, run that test against the previous version from source control. If it passes there too, it covers nothing. That check caught the last two instances before any reviewer saw them, and it is the only thing in this piece I would call a method rather than a lesson.

---

## What I would tell someone who has already built this

Audit the layer you trust most. Not the newest one, not the one you are least sure of. The control you stopped thinking about is the one whose documentation has drifted furthest from its code, because nothing has forced you to reread either.

Write down what each control actually enforces and where. Then go read the code and check. The prose and the mechanism drift apart silently, and there is no test for "the README is lying." I wrote the false sentence and the assertion that contradicted it, 56 days apart, and never put them side by side.

Trigger every control once, from the position of the thing it constrains. Not in a unit test. Attempt the action it forbids and watch it refuse.

Ask what your credentials prove rather than how strong they are. "Single-use, time-limited, session-scoped" describes the token's lifecycle and says nothing about what it authorizes.

Do not let an assertion into the suite until you have seen it fail. The version of the file before your change is sitting in source control, and it costs nothing to run the test against it.

The seven incidents in the original piece all arrived as symptoms, and symptom-driven hardening is honest work. It is also bounded by what the agent happens to try. Everything expensive I found this month was sitting in a path nothing had reason to walk.

---

## The numbers

- 1 control documented as enforced, enforced by nothing, across all 93 days of the project
- 77 days that a passing test asserted the permissive behavior, 21 of them alongside a document claiming the opposite
- 6 patterns and 18 assertions to make it real
- 11 approval-machinery files now write-protected at the hook layer, 3 of which had never been in the gate list
- 23 findings across 2 blind review rounds, 23 verified real, 0 self-caught
- 12 defects of one species (an artifact asserting something other than what was there), 7 of them an assertion that could not fail
- 361 assertions in the bash regression suite (as of 2026-08-19)
- 4 independent time windows in the system, all 4 unnamed literals before this pass, 3 of them named by it. Enumerating them for this list is what surfaced the fourth, a 5-second anti-replay cooldown the audit itself had walked past.
