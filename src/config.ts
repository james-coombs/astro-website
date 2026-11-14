// Place any global data in this file.
// You can import this data from anywhere in your site by using the `import` keyword.

export const SITE_TITLE =
  "James Coombs | Staff UX Engineer & Product Architect";

export const SITE_DESCRIPTION =
  "Staff UX Engineer specializing in Product Architecture, Design Systems at scale, Web Performance Engineering, and AI Execution Governance.";

export const SITE_URL = "https://james-coombs.com";
export const SITE_AUTHOR = "James Coombs";

export const GENERATE_SLUG_FROM_TITLE = true;

export const SOCIAL_LINKS = {
  github: "https://github.com/james-coombs",
  linkedin: "https://www.linkedin.com/in/james-coombs",
  rss: "/rss.xml",
  llms: "/llms.txt",
};

export interface Project {
  id: string;
  title: string;
  technologies: string[];
  overview?: string;
  description: string;
  url?: string;
  repo?: string;
  badge?: string;
  category: "career" | "personal";
}

export const CAREER_PROJECTS: Project[] = [
  {
    id: "ai-governance-engine",
    category: "career",
    title: "Agentic AI Governance Layer",
    technologies: [
      "TypeScript",
      "Node.js",
      "AST Parsing",
      "Hook Architecture",
      "Claude API",
    ],
    overview:
      "A 1,802-line governance system for AI agents that enforces active safety hooks and coding standards across production repositories.",
    description:
      "Built and empirically validated an active enforcement engine for AI coding agents across 13 scripts, backed by 219 tests and 1,251 manual approvals after an n=9 ablation study proved 0% compliance on passive rules. Added a 42-run control-arm benchmark to govern org skill authoring.",
    url: "/resume/#rev",
    repo: "https://github.com/james-coombs",
    badge: "AI Governance",
  },
  {
    id: "internal-ai-marketplace",
    category: "career",
    title: "Internal AI Developer Marketplace & Full-Stack Workflows",
    technologies: [
      "TypeScript",
      "C#",
      "GraphQL",
      "React",
      "Claude Code Plugins",
    ],
    overview:
      "Org-wide AI developer platform and foundational plugin architecture auto-installed across engineering environments.",
    description:
      "Served as #1 human contributor (219 commits, 33 PRs authored, 26 merged) to the org-wide Claude Code platform, shipping 2 foundation plugins depended on by 3 other teams' plugins and a 4-stage full-stack C#/GraphQL/React workflow calibrated across 12 runs (11 merged PRs).",
    url: "/resume/#rev",
    repo: "https://github.com/james-coombs",
    badge: "AI Platform",
  },
  {
    id: "ux-review-blast-radius-ci",
    category: "career",
    title: "Automated PR Review & Dependency Blast-Radius CI",
    technologies: [
      "TypeScript",
      "Nx",
      "AST Analysis",
      "GitHub Actions",
      "Playwright",
    ],
    overview:
      "Automated frontend monorepo PR review pipeline with reverse-dependency blast-radius scoring.",
    description:
      "Built an automated TypeScript UX Review CI pipeline with Nx reverse-dependency blast-radius scoring running on every frontend monorepo PR (evaluating 43 PRs across 11+ authors with 2,036 findings in its first 14-day window and 21 PRs with 844 findings in the second), driving false-positive rates from 9% to near zero.",
    url: "/resume/#rev",
    repo: "https://github.com/james-coombs",
    badge: "CI Architecture",
  },
  {
    id: "migration-cli-bot",
    category: "career",
    title: "Automated Component Migration & Icon Build Engine",
    technologies: [
      "TypeScript",
      "Node.js",
      "CLI Tooling",
      "AST Codemods",
      "Git Automation",
    ],
    overview:
      "A suite of 12 CLI tools, 48 JSON data files, and a zero-barrel icon compilation platform built to transition design system components at scale.",
    description:
      "Shipped 12 custom CLI tools, 48 JSON data files (as of 2026-11-05), and a 594-line playbook driving a 962-file Material UI migration (cutting legacy MUI files from 999 to 792 and growing Design System files to 508, with 24 of 34 migration PRs authored by 4 peer engineers). Owned the shared icon platform across 30 releases (7,798 generated React components across 23,694 files consumed by 20 packages), purging 275 legacy files (-18.7 MB unpacked).",
    url: "/resume/#rev",
    repo: "https://github.com/james-coombs",
    badge: "DS Migration",
  },
  {
    id: "transcript-editor-performance",
    category: "career",
    title: "High-Performance Transcript Rendering Engine",
    technologies: [
      "React",
      "TypeScript",
      "Performance Profiling",
      "DOM Optimization",
    ],
    overview:
      "An architectural overhaul of a complex web transcript editor focused on drastically reducing rendering time and interaction latency.",
    description:
      "Cut interaction latency (INP p98) from 2,169ms down to 112ms (-95%) on 4.5-hour files, reducing style recalculations from 57,000 to 9,500 elements.",
    url: "/resume/#rev",
    repo: "https://github.com/james-coombs",
    badge: "Performance Engineering",
  },
  {
    id: "radix-tailwind-design-system",
    category: "career",
    title: "Scalable Radix & Tailwind Component System",
    technologies: ["React", "TypeScript", "Tailwind CSS", "Radix UI", "Vitest"],
    overview:
      "An enterprise design system scaled from ground zero to 60 accessible production components.",
    description:
      "Architected a 60-component accessible design system across 14 published versions with 100% test coverage (~1,300 Vitest tests). Built AI design-to-code cleanup workflows enabling 4 Product Managers to ship working feature branches in 8 hours and mentored a UX designer to merge 67 pull requests across 3 repositories.",
    url: "/resume/#rev",
    repo: "https://github.com/james-coombs",
    badge: "Design Systems",
  },
  {
    id: "dynamic-landing-page-generator",
    category: "career",
    title: "Algolia & Next.js Dynamic Page Architecture",
    technologies: [
      "Next.js",
      "Algolia",
      "Cloudinary",
      "GitLab CI",
      "REST APIs",
    ],
    overview:
      "Automated dynamic landing page creation pipeline for multi-channel marketing campaigns.",
    description:
      "Architected an automated dynamic page engine using Algolia search indexing, Cloudinary media processing, GitLab CI/CD, and Next.js API routes to automatically publish over 400 location-based landing pages with interactive enterprise chart and graph visualizations.",
    url: "/resume/#cervello",
    repo: "https://github.com/james-coombs",
    badge: "Architecture",
  },
];

export const PERSONAL_PROJECTS: Project[] = [];

export interface Skill {
  name: string;
}

export const SKILLS_DATA: Skill[] = [
  { name: "AI Governance (LLM Engineering)" },
  { name: "Performance Engineering" },
  { name: "Design Systems & Architecture" },
  { name: "TypeScript" },
  { name: "JavaScript" },
  { name: "React & Next.js" },
  { name: "Tailwind CSS & Radix UI" },
  { name: "Node.js & CLI Tooling" },
  { name: "Algolia & Search Integration" },
  { name: "Cloudinary Asset Pipelines" },
  { name: "Sitecore & WordPress CMS" },
  { name: "Redux State Management" },
  { name: "Cross-functional Leadership" },
  { name: "Developer Experience (DX)" },
  { name: "REST APIs & Microservices" },
  { name: "SEO & Web Metadata" },
];

export interface CASE_STUDY {
  id: string;
  title: string;
  problem: string;
  architecture: string;
  outcome: string;
  url: string;
}

export const CASE_STUDIES: CASE_STUDY[] = [
  {
    id: "seo-landing-page-engine",
    title: "Enterprise SEO Landing Page Engine",
    problem:
      "Marketing needed to launch high-converting, SEO-optimized landing pages instantly, but a manual engineering process took over a month to execute.",
    architecture:
      "Built a dynamic landing page generation engine using Next.js API routes, Algolia, Cloudinary, and GitLab CI/CD. Built a custom Node.js CLI tool to map listing data to image assets.",
    outcome:
      "Replaced the month-long bottleneck by automating the publishing of over 400 location-based landing pages with enterprise chart and graph visualizations, allowing marketing to deploy data-driven experiences at scale.",
    url: "/resume/#cervello",
  },
  {
    id: "cross-session-favorites",
    title: "Cross-Session State Synchronization (Favorites)",
    problem:
      "Users needed to save properties across tabs and sessions without being forced to create an account immediately.",
    architecture:
      "Engineered a complex cross-session favoriting system using the BroadcastChannel API for real-time cross-tab sync, and local storage to handle the anonymous-to-authenticated state merge.",
    outcome:
      "Drove over 3,000 new user signups and 6,000 saved items within the first two months of launch.",
    url: "/resume/#cervello",
  },
  {
    id: "signup-performance-overhaul",
    title: "Signup Performance Overhaul (LCP 9.8s to 3.19s)",
    problem:
      "Interaction lag and slow page loads were hurting conversion on critical web funnels.",
    architecture:
      "Split the signup webpack bundle, removed blocking dependencies, and established a frozen performance baseline.",
    outcome:
      "Dropped signup LCP p75 from 9.8s to 3.19s (-67%) with render delay reduced from 8.4s to 2.6s. Built 7 RUM observability dashboards managed as code and 6 production alerts to ensure performance stayed locked.",
    url: "/resume/#rev",
  },
  {
    id: "design-system-and-migration-engine",
    title: "Design System & Codebase Migration Engine",
    problem:
      "Moving 962 files from Material UI to a custom Radix/Tailwind system without breaking production.",
    architecture:
      "Built a suite of 12 custom CLI tools, 48 JSON data files, and a 594-line playbook to automate the codebase transition, alongside a 60-component design system across 14 versions.",
    outcome:
      "Shipped the framework migration cutting legacy Material UI files from 999 down to 792 while Design System imports grew to 508 (with 24 of 34 migration PRs authored by 4 peer engineers), purging 275 legacy files (-18.7 MB unpacked) and enabling 4 Product Managers to ship working feature branches in 8 hours.",
    url: "/resume/#rev",
  },
];
