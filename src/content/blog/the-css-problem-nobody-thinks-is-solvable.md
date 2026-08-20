---
title: "The CSS Problem Nobody Thinks Is Solvable"
description: "Two design systems on one page usually means a rewrite. A two-tier CSS architecture, scoped plus utilities, lets them coexist without one."
pubDate: "Aug 19 2026"
heroImage: "../../assets/blog/the-css-problem-nobody-thinks-is-solvable/hero.webp"
tags: ["css", "webdev", "frontend", "refactoring"]
slug: "the-css-problem-nobody-thinks-is-solvable"
---

_James Coombs is a design engineer who migrated a large frontend from Material UI to a custom design system (Radix, Tailwind). Four CSS systems had to coexist during migration. Three approaches to it had already been considered and rejected before anyone tested the CSS layer._

Four CSS systems running simultaneously: a CSS-in-JS framework (Material UI's emotion runtime), two legacy utility frameworks, one in-house and one open-source, alongside an in-house component library, and the new design system (Tailwind CSS 4). Migration required all four in the same bundles, on the same pages, without collision.

The received answer was that it could not be done without component-level isolation, and three approaches had already been considered and rejected on that basis. Nobody had tested it at the CSS layer.

---

## Where the received answer came from

The assumption: coexistence requires component-level isolation. Wrap each component in a boundary (Shadow DOM, iframes, CSS Modules) so its styles can't leak. At roughly 960 files as of April 2026, spread across the whole monorepo, component-level isolation means touching every file before migration can begin. That's not a migration strategy. That's a rewrite.

Three approaches the team had considered:

- **Manual class prefixing.** Rename every utility class with a namespace prefix. 70+ files of mechanical changes, plus every new component authored with the prefix. Scales linearly with component count.
- **Runtime class modification.** A JavaScript layer that rewrites class names at render time. Adds complexity and latency to every component mount. Fragile when third-party libraries generate their own class names.
- **Shadow DOM.** True encapsulation, but breaks React portals. Dialogs, popovers, tooltips, and dropdown menus all render to `document.body`. Shadow DOM boundaries prevent them from inheriting theme tokens.

All three operate at the component level. The solution was at the config level.

---

## One line of configuration

A PostCSS plugin, `postcss-prefix-selector`, rewrites every generated selector to sit under a scope class as the stylesheet is built:

```css
/* Without scoping */
.flex {
  display: flex;
} /* specificity: 0-1-0 */

/* With scoping */
.ds-scope .flex {
  display: flex;
} /* specificity: 0-2-0 */
```

The scoped selector wins over the unscoped global by specificity, and that is the whole mechanism. There is no `!important`, which matters because it means the win is not guaranteed: a legacy compound selector at the same 0-2-0 specificity ties, and then source order decides. That case is live rather than theoretical. One component in the codebase carries a comment recording exactly it, where a preflight rule ties with a legacy button's generated class. Specificity buys you almost all of the coexistence and you should expect to hand-resolve the ties.

Zero changes to consuming components. A wrapper element (`<DesignSystemProvider>`) adds the `.ds-scope` class, everything inside gets the new design system and everything outside keeps working. The design system's own portal components are the exception, and each needed one edit; that is the section below.

One pipeline handles both, which is why it holds. Five PostCSS plugins run in sequence for the scoped build: Tailwind, a legacy-transform reset, `postcss-prefix-selector`, a layer-removal plugin, and a preflight-scoping plugin. The layer-removal step is the non-obvious one. It strips `@layer` so design-system rules compete at normal cascade priority, because anything inside `@layer base` loses to any unlayered legacy CSS regardless of specificity.

---

## The portal problem

Portals broke it. React portals (Dialog, Popover, Tooltip, DropdownMenu) render to `document.body`, outside the `.ds-scope` wrapper. Portal content inherits no scoped styles. Buttons inside modals lose their styling.

First attempt: a wrapper component that injects `.ds-scope` around every portal. This broke Radix UI's `SlotClone` ref-forwarding. The wrapper intercepted the ref chain, and composed components silently lost their refs.

Fix: a React Context hook that conditionally adds the scope class:

```tsx
function usePortalScopeClass(): string | undefined {
  const isScoped = useDesignSystemScope();
  return isScoped ? "ds-scope" : undefined;
}
```

Portal components use an inline conditional wrapper:

```tsx
const scopeClass = usePortalScopeClass();
const content = (
  <PopoverPrimitive.Content {...props}>{children}</PopoverPrimitive.Content>
);
return (
  <PopoverPrimitive.Portal>
    {scopeClass ? <div className={scopeClass}>{content}</div> : content}
  </PopoverPrimitive.Portal>
);
```

When running inside a `DesignSystemProvider` (the migration case), portals get one extra `<div class="ds-scope">`. When running standalone (Storybook, greenfield apps), no wrapper, no overhead. The conditional check costs nothing at render time. The key design constraint: the wrapper must be an inline conditional, not a component boundary, because Radix's `SlotClone` breaks if a React component intercepts the ref chain between Portal and Content.

This bug was discovered during Drawer implementation, not during planning. Plan for portal scoping from the start if you're running dual CSS systems.

---

## The Tailwind-as-library problem

Tailwind was designed for applications, not libraries. When a design system pre-compiles its CSS and ships it as a package, consuming applications can import the styles. But if those applications use Tailwind utility classes not present in the design system's own source code, those utilities silently go missing. The consuming app expects `gap-3` to work. It doesn't, because the design system's build never scanned for `gap-3`.

The two-tier architecture solves this:

**Tier 1: pre-compiled, shared, about 200 KB uncompressed as of August 2026.** Everything the design system itself uses. Zero-config for consumers: import the CSS file, done. This preserves the "standard npm package" contract: consumers import CSS, no bundler config needed.

**Tier 2: per-bundle, generated (~26 KB each).** Built at each consuming bundle's build time using a shared `createScopedPostcssConfig()` factory. Scans that bundle's source for Tailwind utilities, generates only what it uses, applies identical `.ds-scope` scoping. Opt-in: ~5 file changes per consuming bundle.

The two tiers coexist because they apply the same `.ds-scope` prefix through the same plugin chain, minus the preflight step that only the full tier needs. A utility that exists in both tiers produces an identical selector twice. Browsers do not deduplicate that; both rules parse and both match, and the later one simply wins, so the cost is bytes rather than correctness. Adding Tier 2 to a bundle grew the selector count by 59, which is the net addition rather than a count of duplicates. The overhead: +26 KB per bundle, which is +5% of the bundle's CSS and +1.5% of its JS chunk, plus +2 seconds of build time and roughly 4 to 6 KB gzipped of duplication per opted-in bundle. 59 duplicated selectors against ~1,440 total once both tiers are present.

Most teams either ship all their CSS or none of it. The two-tier split lets the design system ship the predictable base while each consumer generates only what it needs. Framework-aligned, not framework-fighting.

---

## What didn't work

**The initial two-variant strategy.** The design system originally shipped two CSS files: standalone (no scoping) and scoped (with `.ds-scope`). A third consumer (a Shadcn app with its own custom theme) needed neither: it wanted the component utilities without any theme. Added `core.css`, a theme-agnostic variant. This was discovered only through real integration, not planning.

**Assuming portals were covered.** The scoping strategy was tested against static layouts. Portals weren't tested until a specific component (Drawer) exercised the ref-forwarding path. Test your scoping strategy with a portal-heavy component early.

---

## The numbers

| Metric                                                    | Value                                                                                                                   |
| --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| CSS systems coexisting                                    | 4 (emotion, two legacy utility frameworks, Tailwind)                                                                    |
| Selectors: Tier 1 alone                                   | 1,381 as of February 2026; 1,536 in the current build                                                                   |
| Selectors: Tier 1 and Tier 2 together                     | ~1,440 at that same measurement, a net addition of 59                                                                   |
| Code changes in consuming components                      | 0                                                                                                                       |
| Code changes in the design system's own portal components | 11 components; the seven Popper-family ones took a single edit each, the four dialog-family ones needed a second helper |
| Bundle size overhead                                      | +26 KB on the one bundle measured: +5% of its CSS, +1.5% of its JS chunk                                                |
| Build time overhead                                       | +2 seconds                                                                                                              |
| Files still importing the old framework                   | 876                                                                                                                     |
| Files importing the new design system                     | 353                                                                                                                     |
| Packages running both at once, in production              | 6                                                                                                                       |

The last three rows are the result, and they are the reason this was worth doing. Nine months in, the old framework is still imported by 876 files and the new design system by 353, and six packages contain both and ship both. Those are source files only, counted by import statement; a run that includes build output roughly doubles them, which is why the method matters more than the number. Coexistence is not a phase that ended; it is the current operating state at scale, which is what makes the incremental path available at all. Without dual-framework coexistence, the migration is a big-bang rewrite, and big-bang rewrites don't ship.

---

## If you're running dual CSS systems

Solve coexistence at the CSS layer, not the component layer. Specificity-based scoping under a single class selector is simpler than Shadow DOM, more maintainable than manual prefixing, and faster than runtime modification.

Test with portals immediately. Any framework that renders outside the DOM tree (portals, modals, tooltips) will break your scoping strategy. Discover this in week 1, not month 3.

Plan for a third CSS variant. You will discover a consumer that doesn't fit your initial assumptions. Build the variant pipeline so adding a new output is a config change, not an architecture change.

Measure the overhead, and measure it on your worst page rather than a representative one. +26 KB and +2 seconds of build time were acceptable. What was not was style recalculation on a very large DOM: on a page with tens of thousands of nodes, page-load recalc went 2.8x and total recalc over a minute went 4.5x, which was severe enough that a follow-up project removed the scoped stylesheet from that bundle entirely and served it a narrower one. Descendant-scoping every selector is not free at the matching layer, and that cost scales with node count rather than with stylesheet size. Know both budgets before shipping.
