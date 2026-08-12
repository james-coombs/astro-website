---
title: "46KB for Twelve Shapes: When Not to Reach for the Animation Library"
description: "A 46KB animation library for twelve shapes. The build-vs-buy math that said write the tiny requestAnimationFrame engine instead, and when that call is the right one."
pubDate: "Aug 12 2026"
heroImage: "../../assets/blog/build-vs-buy-animation-engine/hero.webp"
tags: ["javascript", "webperf", "animation", "webdev"]
slug: "build-vs-buy-animation-engine"
---

_James Coombs is a design engineer who maintains the icon and illustration system for a product design system. He had a working hand-rolled animation engine and a mature library that could replace it, so he built the whole thing a second time to find out which one to keep._

I built the animation engine twice. The first version was a few hundred lines of hand-rolled code driving requestAnimationFrame, the browser's frame-by-frame render loop. The second used GSAP, the standard, well-liked JavaScript animation library, and its MorphSVGPlugin, which reshapes one path into another. Then I shipped the first one and deleted the second.

This is a build-versus-buy decision, and I want to show the version that doesn't usually get written up: the one where you build the "buy" option all the way, measure it honestly, and it loses.

## Why build the thing you might throw away

I already had [the hand-rolled engine](/blog/svg-shape-morph-animation/) working. The tempting move at that point is either to leave it alone or to swap in the library, because reaching for a mature library is what a responsible engineer is supposed to do. Both of those are guesses dressed up as a decision. The only way to actually know whether GSAP was worth adopting was to implement the animations both ways and put them side by side.

So I did: the same illustrations, the same five trigger modes, rendered by each engine and compared frame by frame in a component workbench (Storybook).

## What the library actually bought

Almost nothing in the rendered output, which is not the same as nothing. Across three illustration pairs, roughly 560 vector shapes, the individual paths that make up an SVG, the two engines were pixel-identical on everything that mattered. The ~250 shape-morph paths interpolate the same way whether my code does it or the plugin does, because my source and target paths were already point-aligned, so the plugin's morph and my per-coordinate lerp land on the same frames. The ~300 rigid-body paths run the same matrix math in both. The only visible difference was on about 12 near-static fragments, the ones the build pipeline had mangled so they couldn't be interpolated directly, where the library's true shape morph was a shade cleaner than my opacity crossfade.

Twelve shapes out of 560. And the price for those twelve was 46KB gzipped in my build: 32 for GSAP's core, 12 for the morph plugin, 2 for the glue that wires it into React. The consuming app used GSAP for nothing else, so every one of those kilobytes would exist only to make twelve near-static fragments slightly crisper.

That is only half a ledger, and I want to be honest about the other half. The engine I kept is a few hundred lines only I maintain, with its own correctness traps (it already had one). The real trade is 46KB of battle-tested library against the cost of owning that code myself. For an app that uses GSAP nowhere else, to clean up twelve fragments in one asset, the 46KB still lost. It would not have taken much to flip it.

## The bug I'd have shipped if I hadn't built it

Building the alternative paid for itself in a way the bundle math doesn't capture: it taught me something about the library I would have gotten wrong by swapping it in blind.

My engine uses a cubic ease (`4t³`), the curve that makes a motion speed up and then settle instead of moving at a constant rate. GSAP names its power eases `power1`, `power2`, `power3`, and the intuitive mapping is cubic to `power3`. That mapping is wrong. GSAP's `power1` is quadratic (t²), `power2` is cubic (t³), and `power3` is quartic (t⁴): each name sits one degree above what it sounds like. The cubic match is `power2.inOut`, not `power3.inOut`. At t=0.3 the two curves differ by about 40 percent (0.108 versus 0.065), a visibly different motion. Had I simply replaced my engine with GSAP and reached for the name that sounded right, the animation would have felt subtly off and I would not have known why.

You calibrate against a library fastest when you have a reference implementation to diff it against. That is the hidden return on building the option you plan to reject: not the code, which I deleted, but the calibration.

## Keep the branch you didn't ship

I didn't throw the GSAP version away. It lives on a branch, because a build-versus-buy decision is only true for the inputs you had when you made it. The rejected implementation is two things at once: the evidence for the decision, so someone can check the 46KB-for-twelve-shapes claim against real code, and a head start if the numbers move, for as long as it still builds. The calibration in this writeup outlives the branch.

And they move under conditions I can name now. If the app adopts GSAP for other animations, the marginal cost of the morph plugin drops from 46KB to about 12, and the decision probably flips. If the build pipeline starts mangling more paths, the library's cleaner fade morph stops being worth twelve paths and starts being worth fifty. If the animations grow into long sequenced timelines, the library's API is genuinely better than a hand-rolled state machine. None of those hold today. All of them are worth writing down next to the branch, so the next person doesn't repeat the whole evaluation to arrive at the same answer.

## The rule

Before you add a dependency to replace working code, build enough of the replacement to measure what it actually buys on your asset. Then weigh it against both ledgers: the library's real marginal cost to your bundle, and the cost of owning the alternative yourself. Sometimes the library wins, and the day this app adopts GSAP elsewhere, it will. This time, for this asset, it was 46KB for twelve shapes, and the honest move was to delete the version I had just finished writing.
