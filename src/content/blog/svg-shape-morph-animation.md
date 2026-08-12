---
title: "Why Animating an SVG the Obvious Way Breaks It"
description: "The obvious way to morph an SVG shape tears it apart. Why it breaks, and the least-squares transform fit that makes the animation actually work."
pubDate: "Aug 10 2026"
heroImage: "../../assets/blog/svg-shape-morph-animation/hero.webp"
tags: ["javascript", "svg", "animation", "webdev"]
slug: "svg-shape-morph-animation"
---

_James Coombs is a design engineer who maintains the icon and illustration system for a product design system. He spent a week getting one illustration to animate between two states the way the designer's Figma prototype did, and most of that week went to discovering how the obvious approach fails._

The obvious approach: you have two SVGs, the same illustration in two poses, and you want to animate from one to the other. An SVG is a list of paths, and each path is a string of letter commands (move, line, curve) followed by the numbers that position them. So to animate, you interpolate the numbers: at the halfway point, every coordinate sits halfway between its start and end value. Ninety percent of the illustration animates perfectly this way. The other ten percent comes apart in mid-air.

The part that came apart was a circle that rotates as it moves. Play it back frame by frame and you see path fragments detaching from their own shape and flying off, like a diagram of an explosion. It took me longer than I'd like to admit to understand why, because two causes were tangled together, not one.

A note before the mechanism: libraries handle SVG morphing already (MorphSVG, Flubber, KUTE among them). I'm not reimplementing them. I'm after the mechanism they hide, plus two things they don't hand you: how to recover a rigid motion from two designer poses, and a build-pipeline trap that corrupts the shapes before any library sees them.

## Why interpolating points can't rotate

A rotation is not a linear operation on coordinates. When a shape rotates, every point travels along an arc, and where it lands is a function of sine and cosine. Interpolating each x and y on its own draws the straight-line shortcut across the arc the point should be following. For a shape that only shifts position, the shortcut and the arc are the same line, so nothing goes wrong. For a rotation they diverge: the blended shape pulls inward toward the middle of the animation and turns unevenly, shrinking and wobbling instead of holding its size and spinning at a steady rate.

That distortion is subtle, a shrink you might not consciously notice. The violent version, fragments detaching and flying off, had a second cause I'll come to. But both trace to the same mistake: I was interpolating the wrong thing. The circle doesn't change shape between the two states. It rotates and translates as one rigid body. What should animate isn't its several hundred coordinates. It's the single motion that carries the whole group from one pose to the other.

## Interpolate the motion, not the points

Instead of moving each point on its own, you can describe the whole motion once, as a formula every point runs through to find its new home. In SVG that formula is a transform matrix, `matrix(a, b, c, d, e, f)`, and it maps a point like this:

```
x' = a*x + c*y + e
y' = b*x + d*y + f
```

A rigid rotation with uniform scale and translation is a similarity transform, which pins that matrix to a specific shape:

```
matrix(a, b, -b, a, tx, ty)
```

where `a = s*cos θ`, `b = s*sin θ`, `s` is the scale, `θ` the rotation, and `tx, ty` the translation. Four numbers describe the entire motion of the group.

Finding those four numbers is a best-fit problem: given the group's points in the start pose and the same points in the end pose, find the scale, angle, and shift that map one onto the other with the least total error. This is a standard shape-alignment fit (the Procrustes problem) and has a closed-form solution; I set it up as a small least-squares solve in TypeScript, no math library, because four unknowns don't need one. On the illustration that started this, the fit ran over 268 point pairs and its best answer was off by about 0.0005 pixels, which is zero for anything a screen can show. It recovered a rotation of 36.84 degrees and a scale of 1.0 to four decimals: the designer had rotated the object without resizing it, and the fit found that without being told.

To animate, interpolate the recovered angle and scale, with `t` running from 0 (start pose) to 1 (end pose):

```
θt = t*θ
st = 1 + t*(s - 1)
matrix(st*cos θt, st*sin θt, -st*sin θt, st*cos θt, t*tx, t*ty)
```

Render the group's paths once, wrap them in a `<g>`, and drive that one transform. The shape never distorts at any frame because it turns at a constant rate and scales uniformly. (One thing the snippet skips: rotate around the group's own center, not the SVG origin, or the shape orbits the corner instead of turning in place.) The tempting shortcut, interpolating the matrix numbers `a` and `b` directly, quietly reintroduces the original problem one level down: the shape shrinks toward the midpoint and swells back, invisible at 37 degrees, a 29 percent collapse at 90. Interpolate the angle, not the numbers that encode it.

The fit's error earns its keep a second way. A near-zero error mostly confirms the input really was rigid, which is exactly what makes the same number a validity check: hand the fit a group that isn't one rigid body and the best possible similarity can't match it, so the error climbs. I warn above 0.1 pixels, which catches "the thing you called one rigid body is really two things moving differently" before it ships as a glitch.

## One strategy is not enough

Fitting a transform is right for the rigid group and wrong for everything else. The paper behind the circle, the text lines, the small marks, those genuinely do change shape between states, in small ways, and for them the naive coordinate interpolation is correct. So the real animation is a hybrid, and the interesting work is deciding which path gets which treatment.

- Paths that barely move and keep their structure get **per-coordinate interpolation**: split the path string into its command letters and its numbers, interpolate the numbers, put it back together. This only works when both states carry the same command letters in the same order, which matters more than it sounds like it should, for reasons below.
- Paths that move as a rigid unit get the **fitted transform** above.
- Paths that can't be interpolated at all get an **opacity crossfade**: the start version fades out while the end version fades in, both pinned in place.

I sorted paths into those buckets by fill color, because in this illustration the moving element's fill cleanly separated it from everything static. That won't generalize: a shared brand color, or an element that changes color between states, will misfile. The durable signal is an explicit group id or layer name from the designer, with fill as a fallback. And the taxonomy itself assumes one rigid body plus near-static extras; genuine non-uniform scaling, shear, or several bodies moving differently needs a fuller fit, or one group per body.

## The gotcha that cost me a day

Here is the part I did not see coming, and the second cause of the flying-apart. My first attempts interpolated almost nothing correctly, even the paths that should have been trivial, and the reason was the build pipeline, not the math.

The illustration components in the repo are optimized. They pass through SVGO, which shrinks path data and, more consequentially, merges and re-segments paths: it collapsed the illustration's 284 source paths down to 26. It also runs on each file independently, so the two poses get different merges and different command rewrites. This is not reformatting, it is restructuring: paths combined, points dropped, commands swapped, differently in each file. The point-for-point correspondence an interpolation depends on is gone, and interpolating one file against the other sends fragments to the wrong places. That is the explosion.

Measured, it was stark: of the 26 paths SVGO left in the optimized files, exactly 3 still corresponded between the two states. In the designer's raw exports, before optimization, 269 of 284 did. Normalizing both files to a canonical command set fixes the reformatting, which is what the morph libraries do internally, but it cannot undo the merging, so the reliable move is to feed the animation from the raw exports and let SVGO keep only the static components. I did that because it shipped faster; the cost is that the one asset that animates ships un-optimized.

## The last stretch is rendering order

One more thing that looks like a transparency bug and isn't. SVG has no z-index; elements paint in document order, last on top. The rigid group has to be the final child of the SVG, or the paper lines behind it paint over it and you get what looks like the moving object showing through when it is really being drawn underneath. I lost an hour to that before remembering how painting order works. The fix is one line: append the group last.

## Before you animate two shapes

Ask one question per element: does it change shape, or does it move as a rigid body? If it changes shape, interpolate its coordinates. If it moves as a body, recover the motion and interpolate its angle and scale. Then check that your build pipeline hasn't rewritten the two states out of correspondence before your code ever sees them.
