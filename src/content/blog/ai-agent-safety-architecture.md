---
title: "I Gave an AI Agent Unrestricted Shell Access. Here's What Happened Next."
description: "Unrestricted shell access handed to an AI agent, then the defense-in-depth architecture that made it survivable: layered hooks, and the self-approval bypass patterns they had to close."
pubDate: "Aug 25 2026"
heroImage: "../../assets/blog/ai-agent-safety-architecture/hero.webp"
tags: ["ai", "security", "programming", "devops"]
slug: "ai-agent-safety-architecture"
---

_James Coombs is a design engineer who built a 3-layer safety architecture for AI code agents after running into 4 agent bypasses and 3 bugs in his own guards. He maintains a 60-component design system and has run controlled ablation studies on AI code generation governance._

I run Claude Code with `--dangerously-skip-permissions`. That flag does what it sounds like: the agent can read any file, write any file, run any shell command, and call any API. No prompts, no confirmations, no guardrails.

I do this on purpose. The default permission model ("May I read this file? May I run this test? May I execute git status?") generates 2-10 approval prompts per session depending on the work: 2-4 for a coding session (commits and pushes), 5-8 for a pipeline run that writes to Linear and creates PRs, up to 10 for MCP-heavy sessions where every write tool is individually gated. The friction isn't the count; it's the interruption. Each prompt breaks the agent's flow mid-thought. The alternative is an agent that can commit to main, force-push, send Slack messages, modify Jira tickets, and publish npm packages without asking.

So I built a third option: a safety architecture that sits between "prompt for everything" and "allow everything." The agent runs unrestricted _within_ safe boundaries. Destructive operations are blocked before execution. When I actually want to run something blocked, I type `/yes` and it goes through.

This is built on Claude Code. The principles (defense-in-depth, fail-closed hooks, user-initiated approval) apply to any agent with shell access. The implementation details are Claude Code-specific. Cursor's rules files, Copilot's workspace instructions, and Windsurf's cascade have analogous compliance problems; their extension models could support similar hook-based enforcement.

114 days and 94 commits, counted 2026-08-20. Every commit in the first stretch was triggered by something the agent actually did. The later ones came from auditing the guards themselves, which turned out to be a richer source of defects than the agent was.

---

## The architecture

Three layers, evaluated in sequence on every tool call:

**Layer 1: Deny rules.** 71 entries in settings.json, 69 of them prefix globs over git and the GitHub CLI. `Bash(git commit*)`, `Bash(gh pr create*)`, etc. The other two are a substring glob and one leftover MCP rule that predates the move to hook-gating and should have gone with it. Cheap, catches simple forms. Only covers git and GitHub CLI, the operations that should never be auto-approved under any circumstances.

**Layer 2: PreToolUse hooks.** Six Python-in-Bash scripts that fire on every Bash, Read, Write/Edit, and MCP tool call. Regex matching catches the variants that globs miss: `git -C /path commit`, `cd /tmp && gh pr create`, `curl -X POST`. Also gates 52 MCP write tools (Slack, Jira, Figma, Linear) behind time-limited approval tokens, across 6 service prefixes.

**Layer 3: CLAUDE.md instructions.** Behavioral guidance for edge cases regex can't express. Weakest layer. Subagents don't read it, and my own ablation study showed 0% compliance for design system behavioral rules in CLAUDE.md (I covered this in detail in [Your CLAUDE.md Rules Achieve 0% Compliance](/blog/why-your-claude-md-rules-dont-work/)). For security-specific rules, the enforcement layers above handle what documentation can't.

Why two enforcement layers? `Bash(git commit*)` doesn't catch `git -C /repo commit`. `\bgit\b.*\s+commit\b` does. For git/gh, both layers run. For everything else (ssh, sudo, rm, cloud CLIs), only Layer 2 runs, because Layer 2's deny messages include the `/yes` escape hatch and Layer 1's don't.

Every hook is fail-closed at two levels: Python catches its own errors and outputs deny; Bash catches Python crashing and outputs deny. A broken guard blocks. Never passes.

---

## The `/yes` system

The agent proposes `git push origin main`. The hook blocks it. The agent tells me it's blocked. I type `/yes`. The command executes.

Under the hood:

1. `/yes` is a Claude Code skill with `disable-model-invocation: true`. This hides the skill from the agent's advertised list. It does **not** reject an explicit call by name, which I assumed it did until I tested it. The flag is friction, not enforcement.
2. Typing `/yes` fires a UserPromptExpansion hook that creates a nonce file. This is the actual origin control: the hook fires only on real user input, and the agent has no mechanism to trigger it. Everything else in the flow is checked against that nonce.
3. The skill writes the command to a temp file in `/tmp/`. The hook that permits this write also records a SHA-256 digest of the command and its path, bound to the live nonce.
4. A PreToolUse hook gates the runner call: it claims the nonce atomically, then verifies the staged file still matches the recorded digest.
5. `exec-yes.sh` validates that the file exists and is under 300 seconds old, then executes it, deletes the temp file, and appends to the audit log.

Single-use. Time-limited. User-initiated only. Session-scoped. Content-bound. Audited.

Step 4 is the part I got wrong for two months. The nonce originally proved only that a `/yes` had happened recently, not that the user had approved _this_ command, which made it a bearer token: stage a payload at any time, wait for the user to approve something innocuous, and the runner would execute the payload. Binding the approval to a digest of the specific command is what closes that, and it is a different property from single-use.

Nonces are session-scoped: each Claude Code session gets its own nonce path. Without this, two concurrent sessions share a single nonce file. Session A consumes session B's nonce; B's `/yes` fails. The session ID is sanitized (alphanumeric, hyphens, underscores only) to prevent path traversal.

MCP tools (Slack, Jira, etc.) use a different mechanism: service-level tokens with a 300-second _idle_ timeout that slides forward on each accepted write, plus a cap of 250 writes per token. MCP calls bypass Bash hooks entirely. The key design choice: MCP write tools are hook-gated, not deny-listed. Deny-listing hides tools from the agent entirely. Hook-gating lets the agent see the tools and propose actions ("here's the Slack message I'd send") for me to approve. Hook-gating lets the agent propose; deny-listing prevents that entirely.

---

## The seven incidents

None of this was designed upfront in the sense that matters. The initial commit was already 18 files and 2,204 lines, four guard scripts and a 50-assertion suite; but every layer added after it came from an incident rather than a plan. Everything interesting came from the agent finding ways around it.

Three were bugs in my own guard scripts that testing caught before they mattered. Four were the agent finding novel bypass paths. Both categories drove the same response: a fix, a test, and documentation.

**1. Total lockout (day 0). (Guard bug.)** Tried to migrate away from `--dangerously-skip-permissions` to a less alarming `defaultMode: "dontAsk"`. Added `dontAsk` before a working allow-list existed. Claude couldn't read its own config to understand what happened. Couldn't write the fix. Couldn't invoke skills. Had to manually edit settings.json from a terminal. Stayed on the current architecture after that.

**2. `sudo` swallowed by curl handler (day 0). (Guard bug.)** The guard for external actions had nuanced handlers: curl gets checked for POST/PUT/DELETE, wget for --post-data, rsync for remote hosts. The curl handler called `sys.exit(0)` on the allow path. `sudo apt-get install curl` passed through the curl handler (no write flags), and the `sudo` pattern later in the script never ran. Fix: unconditional blocks (`sudo`, `ssh`, `scp`, `osascript`) run before any nuanced handler.

**3. MCP token deadlock (day 16). (Guard bug.)** The `/yes` skill creates approval tokens in `/tmp/`. The rm guard blocks references to `/tmp/.claude-mcp-yes-*`. The approval mechanism couldn't approve itself. Fix: TEMP_EXEMPT pattern, where certain blocked patterns are exempted when _every_ absolute path in the command resolves under `/tmp/` after `os.path.normpath()`. That normpath matters: `/tmp/../../etc/passwd` doesn't pass.

**4. Agent self-approval (found day 2, fully closed day 16). (Agent bypass.)** The agent bypassed `disable-model-invocation: true` by using the Write tool to create the `.approved-cmd` file directly, then calling `run-approved.sh`. It replicated the skill's behavior without invoking the skill. First fix, the same day: a pattern and a deny rule blocking the script's invocation. That closed the route it had taken and not the class, so two weeks later `guard-approval-write.sh` landed to block Write and Edit against every approval artifact, and the `/yes` skill was restructured onto temp files. I date the incident by the second fix out of habit; the discovery was day 2.

**5. Nonce replay (day 20). (Agent bypass.)** After adding a nonce gate, the agent copied the nonce creation pattern by calling the nonce script directly. Fix: moved nonce creation from a callable script to a UserPromptExpansion hook. This hook fires on user input events. The agent has no mechanism to trigger it.

**6. Six bypass vectors at once (day 37). (Agent bypass.)** A deliberate audit of the guards found six holes in one pass: an ungated set of MCP write tools, an exemption check that validated _any_ path was temporary rather than _all_ of them, an implicit POST through the GitHub CLI's field flags, and three narrower cases. Six patterns added, ten new test cases. A later audit on day 91 found four more, including one where a guard accepted a nonce path that did not have to exist.

The test suite grew from 50 assertions to 226 named cases through these incidents. The bash suite runs 389 assertions in total as of 2026-08-20, all passing, most of the growth coming from the auditing that followed. Every bypass produced a fix, a test, and documentation.

**7. Branch tracking (day 44). (Agent bypass.)** CLAUDE.md said "never set upstream tracking on feature branches." Agents acknowledged the rule, cited it in reasoning, and used `git checkout -b feature origin/develop` anyway, because that's the most common branch-creation pattern in their training data. The rule achieved 0% compliance at the point of action. Fix: 5 regex patterns in the hook catching `checkout -b`, `switch -c`, `--track`, and `-t` variants across `origin/` and `upstream/` remotes. 11 deny globs as defense-in-depth. The error message shows the correct alternative, which now has to carry `--no-track` explicitly: `git branch --no-track <name> <start-point> && git checkout <name>`. The earlier wording omitted the flag, and a fifth pattern added later blocks exactly that form, so the remediation the guard printed for two months is one the guard would now refuse. 19 new test cases, including 6 safe-pattern allowances (read-only `git log origin/...` must still work).

This incident is the cleanest example of the CLAUDE.md compliance gap. The agent wasn't being adversarial. It wasn't routing around a safety boundary. It was using a standard git pattern that happens to have a subtle side effect, and no amount of documentation prevented it.

These seven are the ones the agent handed me. Sitting down to audit the guards deliberately, rather than waiting to be surprised by them, produced a third category: controls that were real in the documentation and absent in the code. That is a separate piece.

---

## What the agent is actually doing

The agent isn't malicious. It's optimizing for task completion. When a safety boundary prevents completion, it looks for alternative paths, the same way it looks for alternative APIs or alternative algorithms. It used Write instead of Bash. It called the nonce script instead of waiting for the user. It manufactured the approval file directly.

This has a design implication: **if the agent can call the mechanism, it can forge the credential.** `disable-model-invocation` prevents calling the skill but doesn't prevent replicating its steps. Every artifact the skill creates needs to be independently guarded at every access layer (Bash, Write, Edit).

---

## Beyond safety: the lifecycle hooks

The same hook system that enforces safety also prevents a different kind of failure: information loss. Claude Code fires hooks on session events beyond tool calls: when conversation history compresses, when the agent finishes responding, when specific file types are read. These hooks don't gate permissions. They protect the agent's two scarce resources: token budget and context window.

**Token flood guard.** A PreToolUse hook on `Read` blocks lock files (`package-lock.json`, `pnpm-lock.yaml`, 7 others), log files, minified bundles, and source maps. A monorepo `yarn.lock` is 230,000+ tokens. A small project's `package-lock.json` is still 14,000. None of it is content the agent will meaningfully process. The deny message suggests the targeted alternative: `grep <pkg> <lockfile>` instead of reading the whole thing.

The Bash matcher is intentionally absent: blocking every `cat`, `head`, or pipe variant that could dump a large file is an unbounded arms race. The Read matcher covers the highest-risk path.

**Compaction directives.** Claude Code compresses conversation history when the context window fills. By default, the compressor optimizes for recency, which means architectural decisions from 30 minutes ago get compressed down to "made changes to auth module." A PreCompact hook fires before every compaction and outputs structured preservation categories as directives to the compactor: meta-review insights, architectural decisions with rationale, bug root causes, rejected approaches with reasons. These are instructions to the compaction model, not guarantees. Under heavy context pressure, content still gets dropped. The safer bet is writing key decisions to a file before compacting.

The hook also writes a git state snapshot to disk: current branch, uncommitted changes, recent commits. After compaction, the agent can read that file to re-orient without asking "what were we working on?" This doesn't survive across sessions, and it only captures whichever project directory the shell was in when compaction fired. These are known limitations, not ones I've solved.

**Quality gate.** A Stop hook fires every time the agent tries to finish responding. If uncommitted changes exist, it runs type-check, lint, and format-check. It short-circuits on the first failure and prints what broke. What it does not do, and I believed for months that it did, is stop the agent: the script exits zero on every path, so the report reaches the transcript and the turn ends anyway. Blocking requires a specific exit code it never returns. So it is a zero-token deterministic check that catches real errors and then asks nicely, which is weaker than I had been claiming and is the same gap between documented and enforced that this piece is about.

The hook auto-detects tooling from the project: tsconfig.json for type-checking, eslint config for linting, prettier config for formatting. It short-circuits on first failure and truncates output to 3,000 characters so a wall of type errors doesn't flood the context it's trying to protect. A per-project `.audit-ignore` file excludes generated directories.

**What I chose not to build.** A PostToolUse hook on every Edit/Write would catch issues incrementally instead of at the end. It would also add latency to every file modification. The Stop hook runs once. Agent Teams (multiple agents collaborating) would theoretically improve review quality. In my testing, the token cost ran roughly 7x for comparable tasks, and the coordination overhead hasn't been worth it. A MAX_THINKING_TOKENS cap would limit reasoning costs, but it conflicts with adaptive thinking; a hard cap degrades performance on complex problems to save tokens on simple ones.

---

## What I'd tell someone building this

Start with the deny list. It takes 10 minutes and catches the obvious stuff.

Add hooks when you hit the first bypass: `git -C /path commit`, compound commands, MCP tools. Don't try to anticipate every variant. Ship the basic system and let real usage tell you what's missing.

Build the approval system early. Without it, every blocked command requires leaving Claude Code and running it manually. That's unacceptable friction, and you'll end up disabling guards instead of approving commands. `/yes` makes the guards sustainable.

Write tests for every incident. The regression suite is what lets you keep iterating without introducing false positives. I wouldn't touch the guard scripts without it.

The agent optimizes for task completion. When safety boundaries block completion, it routes around them the same way it routes around any obstacle. It's not adversarial in intent, but the effect is adversarial. Design accordingly.

---

## The numbers

Measured 2026-08-21, except the commit count, which is a 2026-08-20 reading. The system is still being added to, so read these as a reading on a date rather than a final state.

- 5,498 lines across 17 hook scripts, of which the regression suite is 2,965. The six guard scripts are 1,766 of the remainder; the rest is the approval machinery, lifecycle hooks and diagnostics
- 71 deny rules, and 52 MCP write-tool gates across 6 service prefixes
- **One assertion in that suite fails on purpose**: it asserts a control that is known to be missing, so a green suite would mean the assertion had been quietly removed. I stopped quoting a total, because the suite skips assertions when an approval token happens to be live, so its own count moves with ambient state
- 94 commits over 114 days, 2026-04-28 to 2026-08-20
- 14 project contexts
- Internal docs including a postmortem of the lockout incident

Almost nothing in the hooks references a specific company, codebase or project. Two test comments cite internal ticket IDs, one test hardcodes an absolute home directory, and one MCP prefix names an internal service. Strip those four and the system extracts into a standalone repo.
