# James Coombs — Personal Website & Technical Essays

A high-performance personal developer website, engineering portfolio, and technical publication engine built with **Astro 7**, **TypeScript**, **Tailwind CSS**, and **DaisyUI**.

Architected for maximum performance and full **SEO (Search Engine Optimization)** and **AEO (Answer Engine Optimization)** visibility across search engines and AI search platforms (ChatGPT, Perplexity, Claude, Gemini). Deploys automatically to **GitHub Pages** via GitHub Actions.

---

## 🔍 SEO & AEO Optimization Architecture

This site is engineered specifically to ensure content is easily indexable, parsable, and authoritative for both traditional search crawlers and modern AI answer engines:

- **JSON-LD & Structured Data:** Implements `schema.org` (`Person`, `BlogPosting`, `WebSite`) microdata so AI agents and search engines understand authorship, entity relationships, and article contexts.
- **Semantic HTML Structure:** Strict heading hierarchy (`h1`-`h3`), explicit landmark tags, and clean semantic markup for LLM content extraction.
- **Rich Meta & Social Cards:** Comprehensive Open Graph (OG) and Twitter Card tags with dynamically configured canonical URLs.
- **AI-Readable Content Pipelines:** Clean frontmatter schemas via Astro Content Collections ensuring structured parsing for indexing tools and RSS/sitemap feeds.

---

## 🎯 Focus Areas & Content

This site hosts writing, projects, and research on:

- **AI Governance & Compliance:** Guidelines, CLAUDE.md compliance, and agentic guardrails.
- **Agentic Safety Architecture:** Patterns for multi-agent validation, boundary enforcement, and execution monitoring.
- **Design System Migrations:** Component engines, design tokens, and framework-agnostic component architectures.
- **Performance Engineering:** Core Web Vitals, static page optimization, and web standards.

---

## 🛠️ Tech Stack & Architecture

| Category              | Technology                                                                                                   |
| :-------------------- | :----------------------------------------------------------------------------------------------------------- |
| **Framework**         | [Astro 7](https://astro.build) (Static Site Generation / Content Collections)                                |
| **Language**          | [TypeScript 5.8](https://www.typescriptlang.org/) (Strict type safety)                                       |
| **Styling**           | [Tailwind CSS v3](https://tailwindcss.com/) + [DaisyUI v4](https://daisyui.com/) + `@tailwindcss/typography` |
| **SEO & AEO Engine**  | JSON-LD (`schema.org`), Open Graph, XML Sitemaps, Semantic HTML for LLM & Search Indexing                    |
| **Asset Pipeline**    | Native [Sharp](https://sharp.pixelplumbing.com/) integration for WebP image optimization                     |
| **Quality & Linting** | ESLint 10, Prettier 3, Husky 9, `lint-staged`, `@astrojs/check`                                              |
| **Package Manager**   | `pnpm` (Workspace mode with native C++ build permissions)                                                    |
| **CI/CD**             | GitHub Actions (`.github/workflows/deploy.yml`) -> GitHub Pages                                              |

---

## 🏗️ Project Structure

```text
.
├── .github/
│   └── workflows/
│       └── deploy.yml            # GitHub Actions CI/CD workflow
├── .husky/
│   └── pre-commit                # Git pre-commit hook (typecheck + lint-staged)
├── public/                       # Static assets, favicons, & robots.txt
├── src/
│   ├── components/               # Reusable Astro & UI components
│   │   ├── HorizontalCard.astro  # Post and project card layout
│   │   ├── Header.astro          # Navigation header
│   │   ├── SideBar.astro         # Profile sidebar & social links
│   │   └── resume/               # Experience timeline components
│   ├── content/                  # Technical essays and blog content (.md/.mdx)
│   ├── content.config.ts         # Astro Content Collections schemas
│   ├── layouts/                  # BaseLayout and PostLayout templates
│   ├── lib/                      # Helper utilities (slug generator, dates)
│   └── pages/                    # File-based routing
│       ├── index.astro           # Main landing page & bio
│       ├── projects.astro        # Featured engineering projects
│       ├── case-studies.astro    # Featured engineering case studies
│       ├── resume.astro          # Career history & skills timeline
│       ├── blog/
│       │   ├── [...page].astro   # Paginated blog index
│       │   ├── [slug].astro      # Individual article view
│       │   └── tag/
│       │       └── [tag]/
│       │           └── [...page].astro # Tag taxonomy filter pages
│       └── rss.xml.js            # RSS feed generator
├── astro.config.mjs              # Astro configuration & integrations
├── pnpm-workspace.yaml           # pnpm build permissions & overrides
└── package.json                  # Dependencies, scripts, & metadata

```

---

## ⚡ Local Development

### 1. Requirements & Setup

Ensure Node.js (v20+) and `pnpm` are installed.

```bash
# Clone repository
git clone [https://github.com/james-coombs/astro-website.git](https://github.com/james-coombs/astro-website.git)
cd astro-website

# Install dependencies
pnpm install

```

### 2. Development Server

Start local development server with hot-module replacement (HMR):

```bash
pnpm dev

```

Navigate to `http://localhost:4321`.

### 3. Code Quality Scripts

```bash
# Run Astro typechecking across entire workspace
pnpm typecheck

# Lint all files with ESLint
pnpm lint

# Auto-fix lint errors
pnpm lint:fix

# Format code with Prettier
pnpm format

```

---

## 🔒 Git Pre-commit Hooks

Husky and `lint-staged` enforce code quality before commits are finalized:

1. **`pnpm typecheck`:** Verifies TypeScript types and Astro component props project-wide.
2. **`lint-staged`:** Automatically runs `eslint --fix` and `prettier --write` on staged `.ts`, `.astro`, `.json`, `.md`, and `.css` files.

To manually bypass pre-commit checks in emergency situations:

```bash
git commit -m "commit message" --no-verify

```

---

## 🚢 CI/CD & Deployment

The site is hosted on **GitHub Pages**.

Every push to the `main` branch triggers `.github/workflows/deploy.yml`:

1. Checkout code & set up Node/pnpm environment.
2. Build static site via `withastro/action@v6` (`pnpm build`).
3. Process image assets with native `sharp` bindings.
4. Upload static artifact and deploy to GitHub Pages.
