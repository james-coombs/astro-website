---
title: "7,798 Components. Import One, Ship One."
description: "T7,798 generated components in one package. The real cost of the barrel file is not bundle size (it tree-shakes fine), it is build-time parse, plus a dual type-resolution trap that runs but will not type-check."
pubDate: "Aug 19 2026"
heroImage: "../../assets/blog/import-one-ship-one/hero.webp"
tags: ["javascript", "typescript", "webdev", "npm"]
slug: "import-one-ship-one"
---

_James Coombs is a design engineer who maintains the icon package a frontend org installs across roughly twenty apps. Its largest icon set alone is 7,798 generated React components, and the whole design of the build exists so that importing one of them pulls in exactly one file._

That 7,798 is the small version (counted 2026-08-19; regenerate with `ls src/material/rounded-400/*.tsx | wc -l`, because this number grows most weeks and a count frozen in prose is the failure this piece's sibling article is about). It's one icon style at one weight, both fill states: about 3,900 icons times two. The config that generates them can multiply that across every weight, optical size, and grade Google's Material Symbols publish (optical size and grade being the axes that tune an icon for small displays and for contrast), into the tens of thousands. So the first design question was never how to generate them. It was how to keep a consumer who imports one icon from paying for the other 7,797.

This isn't a tour of how bundlers eliminate unused code. It's about the two decisions that make their job trivial instead of contingent, and the one that will ship you a package that runs and won't type-check.

## The barrel, and why it's a build-time problem, not a bundle one

The default way to publish a component library is a barrel file: one `index.ts` that re-exports everything, so consumers write `import { HomeFilled } from "@acme/icons"`. It's the friendly API, and I want to be fair to it, because the usual argument against it is wrong. A modern bundler will tree-shake a barrel, dropping the code you don't import from the final build, as long as every module is free of import-time side effects and the whole graph is ES modules (the `import`/`export` format a bundler can analyze statically, rather than the older `require` style it can't). This package sets `sideEffects: false`, which is exactly that promise. The bundle your users download is fine either way.

The cost of the barrel at this scale isn't the bundle. It's everything upstream of it. A 7,798-export `index.ts` is a module the bundler has to read and build a dependency graph across on every cold build and every hot reload, just to work out which handful of exports you actually used. Some frameworks make it worse: Next.js pulls the whole barrel into the dev module graph unless you name the package in a special `optimizePackageImports` list. At fifty components none of this registers. At 7,798 it's the difference between a fast dev loop and a slow one, paid on every build forever, for an ergonomic import you can get another way.

So there is no barrel. Each glyph is generated as its own module: one file, one named export, roughly 900 bytes. The consumer imports the file directly, and nothing has to reason about the other 7,797.

## Import one, ship one

The deep import is made clean by the package's `exports` map, the part of package.json that controls which internal paths a consumer can reach and how they resolve. One wildcard entry covers a whole icon set:

```json
"./material/*": {
  "types": "./dist/material/*.d.ts",
  "default": "./dist/material/*.js"
}
```

That wildcard means `import { HomeFilled } from "@acme/icons/material/rounded-400/HomeFilled"` resolves to exactly one file on disk. The style and weight segment is not optional; the wildcard spans it. The import path names the module. The bundler pulls in that file and has no reason to look at any other, because it was never handed the set as a unit.

## The map that resolves at runtime but not in the type-checker

Look again at that `exports` entry. It has two conditions: `default` for the code, and `types` for the declaration file, the `.d.ts` that tells TypeScript the shape of a module. The `types` condition is the part people leave off, and leaving it off is a bug you don't see until someone else does.

Here is the trap. Two separate systems tell TypeScript where a subpath's types live, and which one runs depends on the consumer's setup. A modern `moduleResolution` setting (`node16`, `nodenext`, or `bundler`) reads the `types` condition straight out of the `exports` map, the way the one above is written. An older resolver ignores `exports` entirely and looks instead at `typesVersions`, an older package.json field that maps import paths to their declaration files. Support both kinds of consumer and you are maintaining two parallel maps of the same wildcards by hand. This package does exactly that: the `types` condition in `exports` for modern resolvers, and a `typesVersions` block mirroring it for old ones.

The failure mode is the quiet kind. Add a new export path, update `exports`, forget its `typesVersions` twin, and your own build stays green while every consumer on the older resolver gets a red "cannot find module" on an import that runs perfectly at runtime. Runtime and types disagree, the two maps have drifted, and nobody thinks to diff them because they don't look related. If you can drop support for the older resolver, delete `typesVersions` and keep one source of truth. If you can't, the two maps move together, in the same commit, every time.

## The parts that never reach the bundle

Two build decisions that aren't about packaging but paid for themselves.

Source resolution routes by what it is asked for. Material's npm packages ship only the largest optical size, so the moment you want the size this package actually builds at, which is a smaller one, the SVGs come from Google's icon repository over HTTP instead, cached locally and fetched in small batches to stay under the CDN's rate limits. The first full download lands in about thirty seconds; every build after reads the cache and hits the network zero times.

Generation is atomic. The transform writes all the components to a temporary directory, then swaps it into place with a pair of renames: the previous build moves aside, the new one moves in, and the old copy is deleted only once the new one is fully in position. A crash mid-run leaves the last good output standing instead of a half-written folder.

## The mirror of the barrel

The layout has a cost, and it is the exact inverse of the barrel's. The barrel makes the bundler chew through one enormous module at build time; one file per glyph makes the published package 23,694 files, three per glyph once you count the JavaScript, the declaration and its source map: a slower publish, a tarball full of tiny entries, a `dist` folder your file browser stalls on, a manifest just over a megabyte. The difference is where the bill lands. The barrel bills every consumer's build, on every build, forever. The file-per-glyph layout bills my publish step, once. Deep imports are what make that trade pay off, because they turn thousands of files from dead weight into the thing that makes "import one, ship one" true. Ship this layout and a barrel beside it, and you have paid my tax and kept theirs.

So before you generate thousands of modules, settle the import shape first: one file per unit, reached by its own path. That, not a bundler flag, is what makes importing one cost one. And the day you expose types through a wildcard subpath, write down both of the maps that resolve them, or you will publish a package that runs, doesn't type-check, and says so in someone else's editor.
