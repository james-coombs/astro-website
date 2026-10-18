# ADR 0001: Defer TypeScript 7 Upgrade

- **Status:** Accepted (Deferred)
- **Date:** 2026-10-18
- **Context Area:** Tooling & Typechecking Infrastructure

---

## Context

Running `pnpm outdated` indicates that TypeScript `7.0.2` is available as a major upgrade over the current `5.9.3` installation.

An isolated spike was executed on 2026-10-18 to evaluate upgrading the repository to TypeScript `7.0.2`. The upgrade resulted in immediate failures across two core tools in our static site quality gate:

1. **`astro check` incompatibility:**
   The Astro CLI diagnostics runner halted immediately with:
   ```text
   [ERROR] [check] astro check does not currently support TypeScript 7.0.
   To continue using astro check, install TypeScript 6 instead.
   ```
2. **`@typescript-eslint/parser` AST breakage:**
   `eslint .` failed across all `.astro` components during frontmatter parsing:
   ```text
   typescript-eslint does not support TS 7.0.
   Parsing error: Unexpected token interface
   Parsing error: Unexpected token CollectionEntry
   ```
   TypeScript 7 restructured internal compiler APIs and dropped legacy AST structures that `@typescript-eslint` v8 relies upon for `.astro` virtual file parsing.

---

## Decision

We will **hold TypeScript on `^5.9.3`** and defer upgrading to TypeScript 7 until the surrounding Astro and ESLint ecosystem reaches stable GA support for the new compiler architecture.

---

## Consequences

### Positive

- `pnpm typecheck` (`astro check`) continues to report 0 errors and 0 warnings with full diagnostics across all 31 workspace files.
- `pnpm lint` (`eslint .`) passes cleanly without parser crashes on `.astro` frontmatters.
- CI/CD builds on GitHub Pages deploy predictably without experimental flags or unstable shims.

### Negative / Trade-offs

- `pnpm outdated` will continue to show TypeScript `7.x` in the outdated list until upstream support matures.

---

## Unblocking Criteria / Future Path Forward

We will revisit and execute the TypeScript 7 upgrade once all three conditions are satisfied:

1. **Astro Language Tools Transition:**
   Astro deprecates `astro check` in favor of `@astrojs/ts-content-mapper` (or integrates native TS 7+ support into the language server).
2. **`typescript-eslint` Support:**
   `typescript-eslint` closes tracking issue [#10940](https://github.com/typescript-eslint/typescript-eslint/issues/10940) and ships native TypeScript 7+ support in a stable release.
3. **Workspace Validation:**
   `pnpm typecheck`, `pnpm lint`, and `pnpm build` all execute cleanly with zero parser or compiler compatibility warnings.
