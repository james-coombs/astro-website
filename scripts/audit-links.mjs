#!/usr/bin/env node

/**
 * Lightweight Canonical Link and SEO Auditor
 * Zero-dependency verification for Astro production output (dist/).
 * Enforces zero-internal-redirect policy, canonical tags, trailing slashes,
 * and valid destinations across HTML, JSON-LD, llms.txt, and sitemaps.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..");
const DIST_DIR = path.join(ROOT_DIR, "dist");
const SITE_DOMAIN = "https://james-coombs.com";

const ASSET_EXTENSIONS = new Set([
  ".svg",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".avif",
  ".gif",
  ".ico",
  ".css",
  ".js",
  ".mjs",
  ".xml",
  ".txt",
  ".json",
  ".pdf",
  ".woff",
  ".woff2",
  ".ttf",
  ".eot",
]);

if (!fs.existsSync(DIST_DIR)) {
  console.error(
    `\x1b[31m[ERROR]\x1b[0m Build directory not found: ${DIST_DIR}\nRun 'pnpm build' before auditing.`,
  );
  process.exit(1);
}

const startTime = performance.now();
const errors = [];
let scannedCount = 0;

function walk(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(full));
    } else {
      files.push(full);
    }
  }
  return files;
}

const allFiles = walk(DIST_DIR);
const htmlFiles = allFiles.filter((f) => f.endsWith(".html"));

// ---------------------------------------------------------------------------
// 1. Audit HTML Pages: Canonical Tags, Links, and JSON-LD
// ---------------------------------------------------------------------------
for (const file of htmlFiles) {
  const content = fs.readFileSync(file, "utf8");
  const relPath = path.relative(DIST_DIR, file);
  const is404 = relPath === "404.html";
  const isRedirect = content.includes('http-equiv="refresh"');

  // Verify Canonical Tag
  const canonicalMatch = content.match(
    /<link\s+[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i,
  );

  if (!is404 && !isRedirect) {
    if (!canonicalMatch) {
      errors.push({ file: relPath, issue: "Missing <link rel='canonical'>" });
    } else {
      const canonical = canonicalMatch[1];
      if (!canonical.startsWith(SITE_DOMAIN)) {
        errors.push({
          file: relPath,
          issue: `Canonical domain mismatch: ${canonical}`,
        });
      }
      if (
        !canonical.endsWith("/") &&
        !canonical.split("/").pop().includes(".")
      ) {
        errors.push({
          file: relPath,
          issue: `Canonical missing trailing slash: ${canonical}`,
        });
      }
    }
  }

  // Verify HTML Links (<a href>, <link href>, <area href>)
  const hrefMatches = content.matchAll(
    /<(?:a|link|area)\s+[^>]*href=["']([^"']+)["']/gi,
  );
  for (const match of hrefMatches) {
    const rawHref = match[1].trim();
    scannedCount++;

    if (
      !rawHref ||
      rawHref.startsWith("#") ||
      rawHref.startsWith("mailto:") ||
      rawHref.startsWith("tel:") ||
      rawHref.startsWith("javascript:")
    ) {
      continue;
    }

    // Skip external links
    if (rawHref.startsWith("http://") || rawHref.startsWith("https://")) {
      if (!rawHref.startsWith(SITE_DOMAIN)) {
        continue;
      }
    }

    // Flag protocol-relative links or double leading slashes
    if (rawHref.startsWith("//")) {
      errors.push({
        file: relPath,
        issue: `Disallowed protocol-relative or double leading slash: ${rawHref}`,
      });
      continue;
    }

    // Normalize to root-relative path
    const normalized = rawHref.startsWith(SITE_DOMAIN)
      ? rawHref.slice(SITE_DOMAIN.length)
      : rawHref;

    const [pathAndQuery, hash] = normalized.split("#");
    const [cleanPath] = pathAndQuery.split("?");

    // Guard: Double slashes in path
    if (cleanPath.includes("//")) {
      errors.push({
        file: relPath,
        issue: `Double slash in link path: ${rawHref}`,
      });
    }

    const ext = path.extname(cleanPath).toLowerCase();
    const isAsset = ASSET_EXTENSIONS.has(ext);

    // Guard: Trailing slash rule for directory/page routes
    if (!isAsset && cleanPath !== "" && !cleanPath.endsWith("/")) {
      errors.push({
        file: relPath,
        issue: `Internal link missing trailing slash: ${rawHref}`,
      });
    }

    // Guard: Pre-hash trailing slash rule (/resume/#rev, not /resume#rev)
    if (
      hash !== undefined &&
      cleanPath !== "" &&
      !isAsset &&
      !cleanPath.endsWith("/")
    ) {
      errors.push({
        file: relPath,
        issue: `Missing trailing slash before anchor hash: ${rawHref}`,
      });
    }

    // Guard: Target must exist on disk
    if (
      cleanPath !== "" &&
      !rawHref.startsWith("http://") &&
      !rawHref.startsWith("https://")
    ) {
      const targetOnDisk = cleanPath.endsWith("/")
        ? path.join(DIST_DIR, cleanPath, "index.html")
        : path.join(DIST_DIR, cleanPath);

      if (!fs.existsSync(targetOnDisk)) {
        // Fallback check for root files like /favicon.svg or /404.html
        const altOnDisk = path.join(DIST_DIR, `${cleanPath}.html`);
        if (!fs.existsSync(altOnDisk)) {
          errors.push({
            file: relPath,
            issue: `Broken internal target (not found on disk): ${rawHref}`,
          });
        }
      }
    }
  }

  // Verify JSON-LD Structured Data
  const jsonLdMatches = content.matchAll(
    /<script\s+[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  );
  for (const match of jsonLdMatches) {
    try {
      const parsed = JSON.parse(match[1]);
      validateJsonLdUrls(parsed, relPath);
    } catch {
      errors.push({ file: relPath, issue: "Malformed JSON-LD block" });
    }
  }
}

function validateJsonLdUrls(obj, relPath) {
  if (!obj || typeof obj !== "object") return;

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      if (
        (key === "url" || key === "item" || key === "@id") &&
        (value.startsWith(SITE_DOMAIN) || value.startsWith("/"))
      ) {
        scannedCount++;
        const normalized = value.startsWith(SITE_DOMAIN)
          ? value.slice(SITE_DOMAIN.length)
          : value;

        const [cleanPath, hash] = normalized.split("#");
        const ext = path.extname(cleanPath).toLowerCase();

        if (cleanPath.includes("//")) {
          errors.push({
            file: relPath,
            issue: `Double slash in JSON-LD (${key}): ${value}`,
          });
        }
        if (
          !ASSET_EXTENSIONS.has(ext) &&
          cleanPath !== "" &&
          !cleanPath.endsWith("/")
        ) {
          errors.push({
            file: relPath,
            issue: `Missing trailing slash in JSON-LD (${key}): ${value}`,
          });
        }
        if (
          hash !== undefined &&
          cleanPath !== "" &&
          !ASSET_EXTENSIONS.has(ext) &&
          !cleanPath.endsWith("/")
        ) {
          errors.push({
            file: relPath,
            issue: `Missing trailing slash before hash in JSON-LD (${key}): ${value}`,
          });
        }
      }
    } else if (typeof value === "object") {
      validateJsonLdUrls(value, relPath);
    }
  }
}

// ---------------------------------------------------------------------------
// 2. Audit Taxonomy & Tag Casing
// ---------------------------------------------------------------------------
const tagDir = path.join(DIST_DIR, "blog/tag");
if (fs.existsSync(tagDir)) {
  for (const tag of fs.readdirSync(tagDir)) {
    if (tag === "index.html") continue;
    if (tag !== tag.toLowerCase()) {
      errors.push({
        file: `blog/tag/${tag}`,
        issue: `Uppercase tag directory detected: ${tag}`,
      });
    }
  }
}

// ---------------------------------------------------------------------------
// 3. Audit Non-HTML Surfaces (llms.txt, robots.txt, sitemap)
// ---------------------------------------------------------------------------
// llms.txt
const llmsPath = path.join(DIST_DIR, "llms.txt");
if (fs.existsSync(llmsPath)) {
  const llms = fs.readFileSync(llmsPath, "utf8");
  const linkMatches = llms.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g);
  for (const match of linkMatches) {
    const href = match[2].trim();
    scannedCount++;
    if (href.startsWith(SITE_DOMAIN)) {
      const clean = href.slice(SITE_DOMAIN.length).split("#")[0];
      const ext = path.extname(clean).toLowerCase();
      if (!ASSET_EXTENSIONS.has(ext) && clean !== "" && !clean.endsWith("/")) {
        errors.push({
          file: "llms.txt",
          issue: `Missing trailing slash in llms.txt link: ${href}`,
        });
      }
      if (href.includes("#")) {
        const [basePath] = href.slice(SITE_DOMAIN.length).split("#");
        if (
          !ASSET_EXTENSIONS.has(ext) &&
          basePath !== "" &&
          !basePath.endsWith("/")
        ) {
          errors.push({
            file: "llms.txt",
            issue: `Missing trailing slash before hash in llms.txt link: ${href}`,
          });
        }
      }
    }
  }
}

// robots.txt
const robotsPath = path.join(DIST_DIR, "robots.txt");
if (fs.existsSync(robotsPath)) {
  const robots = fs.readFileSync(robotsPath, "utf8");
  const sitemapMatch = robots.match(/Sitemap:\s*(https?:\/\/[^\s]+)/i);
  if (!sitemapMatch) {
    errors.push({ file: "robots.txt", issue: "Missing Sitemap directive" });
  } else if (sitemapMatch[1] !== `${SITE_DOMAIN}/sitemap-index.xml`) {
    errors.push({
      file: "robots.txt",
      issue: `Unexpected Sitemap directive URL: ${sitemapMatch[1]}`,
    });
  }
}

// sitemap-0.xml
const sitemapPath = path.join(DIST_DIR, "sitemap-0.xml");
if (fs.existsSync(sitemapPath)) {
  const sitemap = fs.readFileSync(sitemapPath, "utf8");
  const locMatches = sitemap.matchAll(/<loc>([^<]+)<\/loc>/g);
  for (const match of locMatches) {
    const loc = match[1];
    scannedCount++;
    if (!loc.startsWith(SITE_DOMAIN)) {
      errors.push({
        file: "sitemap-0.xml",
        issue: `Sitemap URL domain mismatch: ${loc}`,
      });
    }
    const clean = loc.slice(SITE_DOMAIN.length);
    const ext = path.extname(clean).toLowerCase();
    if (!ASSET_EXTENSIONS.has(ext) && clean !== "" && !clean.endsWith("/")) {
      errors.push({
        file: "sitemap-0.xml",
        issue: `Sitemap URL missing trailing slash: ${loc}`,
      });
    }

    // Check disk target
    const targetPath = clean.endsWith("/")
      ? path.join(DIST_DIR, clean, "index.html")
      : path.join(DIST_DIR, clean);

    if (!fs.existsSync(targetPath)) {
      errors.push({
        file: "sitemap-0.xml",
        issue: `Sitemap URL targets missing file on disk: ${loc}`,
      });
    }
  }
}

// ---------------------------------------------------------------------------
// 4. Output Results
// ---------------------------------------------------------------------------
const duration = (performance.now() - startTime).toFixed(1);

if (errors.length === 0) {
  console.log(
    `\x1b[32m[PASS]\x1b[0m Canonical Link & SEO Audit: Scanned ${scannedCount} links across ${htmlFiles.length} pages in ${duration}ms (0 errors).`,
  );
  process.exit(0);
} else {
  console.error(
    `\n\x1b[31m[FAIL]\x1b[0m Canonical Link & SEO Audit: Found ${errors.length} issue(s) across ${htmlFiles.length} pages (${duration}ms):\n`,
  );
  errors.forEach((err) => {
    console.error(`  \x1b[33m${err.file}\x1b[0m: ${err.issue}`);
  });
  console.error("");
  process.exit(1);
}
