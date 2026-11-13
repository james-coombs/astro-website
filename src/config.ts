// Place any global data in this file.
// You can import this data from anywhere in your site by using the `import` keyword.

export const SITE_TITLE =
  "James Coombs | Staff UX Engineer & AI Systems Architect";

export const SITE_DESCRIPTION =
  "Staff UX Engineer specializing in AI Governance, Agentic Safety Architecture, Design System Migrations at scale, and Web Performance Engineering.";

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
      "Built and empirically validated an active enforcement engine for AI coding agents across 13 scripts, backed by 219 tests and 1,251 manual approvals. Replaced passive documentation with hook-based runtime gating, achieving 100% compliance in agentic workflows.",
    url: "/resume/#rev",
    repo: "https://github.com/james-coombs",
    badge: "AI Governance",
  },
  {
    id: "migration-cli-bot",
    category: "career",
    title: "Automated Component Migration Engine",
    technologies: [
      "TypeScript",
      "Node.js",
      "CLI Tooling",
      "5-Factor Scoring",
      "Git Automation",
    ],
    overview:
      "A suite of 12 CLI tools and an automated migration bot built to safely transition design system components at scale.",
    description:
      "Engineered an automated migration engine to transition 962 files (cutting legacy Material UI files from 999 to 792 and growing Design System files to 508) across 48 JSON data files, purging 275 files and dropping 18.7 MB unpacked install size.",
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
    technologies: ["React", "TypeScript", "Tailwind CSS", "Radix UI", "Astro"],
    overview:
      "An enterprise design system scaled from ground zero to 60 accessible production components.",
    description:
      "Architected a unified design system discipline across 14 published versions with 100% test coverage (~1,300 Vitest tests), enabling PMs and designers to prototype and ship production code directly to feature branches.",
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
      "Architected an automated dynamic page engine leveraging Algolia search indexing, Cloudinary media processing, and custom Next.js API routes.",
    url: "/resume/#cervello",
    repo: "https://github.com/james-coombs",
    badge: "Architecture",
  },
];

export const PERSONAL_PROJECTS: Project[] = [
  {
    id: "yamba",
    category: "personal",
    title: "Yamba",
    technologies: ["Ember.js", "Ruby on Rails", "PostgreSQL"],
    overview:
      "Create your own boards to host pages made by you or other users! Post text and images to custom boards.",
    description:
      "A custom client built with Ember.js and an API powered by Ruby on Rails and PostgreSQL. Explored routing, views, custom component interactions, and API action handling.",
    url: "https://james-coombs.github.io/yamba-client",
    repo: "https://github.com/james-coombs/yamba-client",
    badge: "Full Stack",
  },
  {
    id: "sweaters-for-turtles",
    category: "personal",
    title: "Sweaters for Turtles",
    technologies: [
      "Node.js",
      "Express.js",
      "MongoDB",
      "Handlebars",
      "Stripe API",
    ],
    overview: "Shop for sweaters and checkout with Stripe payment integration.",
    description:
      "Developed as a team project using Express.js, MongoDB, and custom Handlebars templates. Integrated the Stripe API for handling mock ecommerce checkouts.",
    url: "https://chardeemcdennis.github.io/sweaters-for-turtles-client",
    repo: "https://github.com/chardeemcdennis/sweaters-for-turtles-client",
    badge: "Team Project",
  },
  {
    id: "backlog",
    category: "personal",
    title: "Back\\Log",
    technologies: ["Ruby on Rails", "PostgreSQL", "Handlebars", "JavaScript"],
    overview: "Keep record of your gaming progress and log play history.",
    description:
      "First full-stack pet project built from scratch. Feature-rich CRUD application leveraging Ruby on Rails REST endpoints and a frontend Handlebars client.",
    url: "https://james-coombs.github.io/back-log-client",
    repo: "https://github.com/james-coombs/back-log-client",
    badge: "Pet Project",
  },
  {
    id: "tic-tac-toe",
    category: "personal",
    title: "Tic-Tac-Toe Client",
    technologies: ["JavaScript", "jQuery", "AJAX", "CSS3"],
    overview:
      "Play Tic-Tac-Toe, persist game progress, and track player match stats.",
    description:
      "First frontend web application built during early development training. Features state tracking, API authentication, and dynamic game board rendering.",
    url: "https://james-coombs.github.io/tic-tac-toe",
    repo: "https://github.com/james-coombs/project-1-tic-tac-toe",
    badge: "First Web App",
  },
  {
    id: "biological-samples-csv-api",
    category: "personal",
    title: "Biological Samples CSV API",
    technologies: ["Ruby on Rails", "ERB", "CSV Parsing"],
    overview:
      "API test fixture for importing proprietary sample CSV files and returning structured JSON data.",
    description:
      "Built to parse biological sample data from CSV format into JSON responses. Experimented with server-rendered Rails ERB views alongside API endpoints.",
    url: "https://samples-csv-api.herokuapp.com/samples",
    repo: "https://github.com/james-coombs/rails-csv-api",
    badge: "API Tooling",
  },
];

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
      "Built a dynamic landing page generation engine leveraging Next.js API routes, Algolia, Cloudinary, and GitLab CI/CD. Built a custom Node.js CLI tool to map listing data to image assets.",
    outcome:
      "Replaced the month-long bottleneck by automating the publishing of over 400 location-based landing pages, allowing marketing to deploy data-driven shopping experiences at scale.",
    url: "/resume/#cervello",
  },
  {
    id: "cross-session-favorites",
    title: "Cross-Session State Synchronization (Favorites)",
    problem:
      "Users needed to save properties across tabs and sessions seamlessly without being forced to create an account immediately.",
    architecture:
      "Engineered a complex cross-session favoriting system leveraging the BroadcastChannel API for real-time cross-tab sync, and local storage to handle the anonymous-to-authenticated state merge.",
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
      "Dropped signup LCP p75 from 9.8s to 3.19s (-67%) with render delay reduced from 8.4s to 2.6s. Built 7 RUM observability dashboards and 6 production alerts to ensure performance stayed locked.",
    url: "/resume/#rev",
  },
  {
    id: "design-system-and-migration-engine",
    title: "Design System & Codebase Migration Engine",
    problem:
      "Moving 962 files from Material UI to a custom Radix/Tailwind system without breaking production.",
    architecture:
      "Built a suite of 12 custom CLI tools and 48 JSON data files to automate the codebase transition, alongside a 60-component design system.",
    outcome:
      'Shipped the framework migration cutting legacy Material UI files from 999 down to 792 while Design System imports grew to 508, purging 275 legacy files (-18.7 MB unpacked) under an automated "Design to Production" pipeline.',
    url: "/resume/#rev",
  },
];
