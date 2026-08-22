// Place any global data in this file.
// You can import this data from anywhere in your site by using the `import` keyword.

export const SITE_TITLE =
  "James Coombs | Senior Design Engineer & AI Governance";

export const SITE_DESCRIPTION =
  "Senior Design Engineer specializing in AI Governance, Agentic Safety Architecture, Design System Migrations at scale, and Web Performance Engineering.";

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
      "A 1,766-line governance system for AI agents that enforces active safety hooks and coding standards across production repositories.",
    description:
      "Built and empirically validated (82 runs) an active enforcement engine for AI coding agents. Replaced passive documentation with hook-based runtime gating, achieving 100% compliance in agentic workflows.",
    url: "/resume#rev",
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
      "Engineered a 15-state machine with 5-factor confidence scoring to automate the migration of 962+ files across 44 asset bundles with ratcheted state enforcement.",
    url: "/resume#rev",
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
      "Achieved a 94% reduction in rendering overhead and reduced scripting execution by 57%, bringing Interaction to Next Paint (INP) down from 3,297ms to 112ms.",
    url: "/resume#rev",
    repo: "https://github.com/james-coombs",
    badge: "Performance Engineering",
  },
  {
    id: "radix-tailwind-design-system",
    category: "career",
    title: "Scalable Radix & Tailwind Component System",
    technologies: ["React", "TypeScript", "Tailwind CSS", "Radix UI", "Astro"],
    overview:
      "An enterprise design system scaled from ground zero to 62+ accessible production components.",
    description:
      "Architected a unified design system discipline and created the 'Claude Design Production' pipeline, enabling PMs and designers to prototype and ship production code directly to feature branches.",
    url: "/resume#rev",
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
    url: "/resume#cervello",
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
    title: "SEO Landing Page Engine",
    problem:
      "Marketing needed to launch high-converting, SEO-optimized landing pages instantly, but engineering was a bottleneck.",
    architecture:
      "Built a dynamic landing page generation engine leveraging Next.js API routes, Algolia, Cloudinary, and GitLab CI/CD.",
    outcome:
      "Empowered the business to deploy data-driven shopping experiences at scale without manual engineering intervention.",
    url: "/resume#cervello",
  },
  {
    id: "signup-performance-overhaul",
    title: "Signup Performance Overhaul (LCP 9.8s to 3.3s)",
    problem:
      "Interaction lag and slow page loads were hurting conversion on critical web funnels.",
    architecture:
      "Split the signup webpack bundle, removed blocking dependencies, and established a frozen performance baseline.",
    outcome:
      "Cut interaction lag (INP) by 94% and dropped signup LCP by 66%, exceeding the business goal. Built RUM regression alerting to ensure the fix stayed fixed.",
    url: "/resume#rev",
  },
  {
    id: "design-system-and-migration-engine",
    title: "Design System and Migration Engine",
    problem:
      "Moving 962 files across 44 bundles from Material UI to a custom Radix/Tailwind system without breaking production.",
    architecture:
      "Built a suite of 12 custom CLI tools to automate the codebase transition, alongside a 60-component design system.",
    outcome:
      'Shipped the migration with 100% accuracy, creating a "Design to Production" pipeline that let PMs prototype directly into feature branches.',
    url: "/resume#rev",
  },
];
