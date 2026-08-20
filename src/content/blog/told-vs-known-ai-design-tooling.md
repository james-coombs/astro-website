---
title: '"Told" vs. "Known": The One Variable That Predicts AI Design Tool Quality'
description: "AI design tools succeed or fail on one variable: whether the model is told what to do or can query what is actually known. The distinction that predicts output quality."
pubDate: "Jul 24 2026"
heroImage: "../../assets/blog/told-vs-known-ai-design-tooling/hero.webp"
tags: ["AI", "designsystems", "machinelearning", "productivity"]
slug: "told-vs-known-ai-design-tooling"
---

_James Coombs is a design engineer who built a 60-component design system with a structured query server and ran a controlled ablation study (n=9) measuring AI tool fidelity against it._

After evaluating six categories of AI design-to-code tools against a 60-component design system, one variable predicted output quality better than anything else: whether the tool had been _told_ about the design system or _knew_ it.

**"Told" tools**: You describe your components in natural language or docs. The AI interprets. It generates something that looks like your Button but uses the wrong prop names, the wrong import path, or a plausible-but-nonexistent variant.

**"Known" tools**: The AI queries a structured index of your actual components. It gets the exact name, exact props, exact import, exact usage examples. No interpretation gap.

| Tool type                                       | Awareness                                  | Typical fidelity |
| ----------------------------------------------- | ------------------------------------------ | ---------------- |
| General AI prototypers (v0, Bolt, Lovable)      | Told (generic framework knowledge)         | ~50-60%          |
| AI design tools (Claude Design, Pencil)         | Told (LLM ingestion of your docs)          | ~70-80%          |
| AST-parsed indexers (Builder.io Visual Copilot) | **Known** (parsed component source)        | ~95-100%         |
| Manual component maps (Figma Code Connect)      | **Known** (hand-mapped per component)      | 100%             |
| AI agent + structured query (MCP server)        | **Known** (live query against real source) | 100%             |

The gap between "Told" and "Known" isn't incremental. It's categorical.

---

## Why "Told" fails

When you tell an AI "use our Button component with `variant='primary'`," the AI generates something that looks like a primary button. Maybe it uses your component, maybe a common library's. Maybe `variant='primary'` is a valid prop, maybe your API uses `variant='default'`. Maybe it applies your violet palette, maybe generic blue.

Each step introduces interpretation drift. By the time the output reaches an engineer, it looks close enough to pass a design review but wrong enough to require a rewrite.

Worse: "Told" tools hallucinate components that don't exist. They use prop names that are close but wrong. They apply tokens that look plausible but aren't in your system. This is worse than obviously wrong output. Obviously wrong gets rewritten. Plausibly wrong gets merged.

And your design system changes. Components get new variants, tokens get renamed. "Told" tools have whatever version was in their training data. "Known" tools query the current state.

---

## The three "Known" approaches

**AST-parsed component index.** Parse your source into a structured index: component names, prop types (from TypeScript), variants, tokens. Regenerate on build. Captures structure but not intent; doesn't know _when_ to use Dialog vs. Sheet.

**Hand-mapped component bridge (Figma Code Connect).** Manually map each Figma component to its React counterpart. 100% fidelity by definition. But manual maintenance: every new component or variant needs an update. Scales linearly with component count.

**AI agent + structured query (MCP server).** Give the agent a query interface. It discovers components by searching, not guessing. No pre-built index needed. Works for discovery ("what handles file uploads?"), not just lookup. You build the interface once, and every AI tool, current and future, benefits.

---

## The data

My ablation study (n=9, controlled) confirmed this:

- Agent + MCP query (Known): 26.7 / 30 on design system compliance
- AI design tool interpretation (Told): 16.3 / 30
- CLAUDE.md rules ("always use the design system"): 16.4 / 30, identical to no guidance

The MCP server took about a week to build. It gives every AI tool structured access to the real design system. The cost-per-tool amortization improves with every new tool that connects.

---

## When "Told" is fine

Throwaway prototypes where 70% fidelity is the goal. Greenfield exploration when you don't have a design system yet. Product demos where brand fidelity doesn't matter.

## When you need "Known"

Production code generation. Design system migrations, where "close but wrong" imports are worse than obviously wrong ones. Multi-person teams where plausibly wrong output gets merged. Brand-critical surfaces where your violet isn't someone else's purple.

---

## The practical takeaway

Before evaluating any AI design tool, ask one question: **does it query my real components, or does it guess?**

If your team generates AI code that goes into production, invest in a structured query interface. MCP server, CLI tool, AST index: the form factor matters less than the structured access. Build it once; every AI tool benefits. The returns compound.

Don't try to improve "Told" fidelity by writing better documentation or more detailed prompts. My data says the returns stop, and may reverse: across three versions of a design-system manifest the middle one scored best, and the densest scored worst. Treat that as a ceiling rather than a slope, and note that the gap between versions is smaller than the variation between runs of the same version. A 2-sentence prompt + structured query beats a comprehensive governance file by 11 points.
