#!/usr/bin/env node

/**
 * Lightweight Canonical Link and SEO Auditor
 * Zero-dependency verification for Astro production output (dist/).
 * Enforces:
 * - Zero-internal-redirect policy (no links targeting 301 refresh stubs)
 * - Strict trailing slash enforcement on pages and directories
 * - Anchor hash pre-slash formatting (/page/#hash)
 * - Elimination of double slashes
 * - Exact case-sensitive disk resolution for internal links, JSON-LD, and llms.txt
 * - Canonical tag consistency and page-route alignment
 * - Dynamic sitemap index traversal and robots.txt integrity
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..");
const DIST_DIR = path.join(ROOT_DIR, "dist");
const SITE_DOMAIN = "https://james-coombs.com";
const SITE_ORIGIN = new URL(SITE_DOMAIN).origin;
const SITE_HOSTNAME = new URL(SITE_DOMAIN).hostname;

// Comprehensive asset extensions that do not receive trailing slashes
const ASSET_EXTENSIONS = new Set([
  // Documents & Data
  ".html",
  ".htm",
  ".xml",
  ".txt",
  ".json",
  ".pdf",
  ".csv",
  ".tsv",
  // Scripts & Styles
  ".css",
  ".js",
  ".mjs",
  ".cjs",
  ".wasm",
  ".webmanifest",
  ".map",
  // Images
  ".svg",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".avif",
  ".gif",
  ".ico",
  ".bmp",
  ".tiff",
  // Media (Audio / Video)
  ".mp4",
  ".webm",
  ".ogv",
  ".mp3",
  ".wav",
  ".ogg",
  ".m4a",
  ".aac",
  ".flac",
  // Fonts
  ".woff",
  ".woff2",
  ".ttf",
  ".otf",
  ".eot",
  // Archives
  ".zip",
  ".tar",
  ".gz",
  ".tgz",
  ".bz2",
  ".7z",
  ".rar",
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

// Cache file contents to avoid redundant disk reads
const fileContentCache = new Map();
function getCachedFileContent(filePath) {
  if (fileContentCache.has(filePath)) {
    return fileContentCache.get(filePath);
  }
  try {
    const content = fs.readFileSync(filePath, "utf8");
    fileContentCache.set(filePath, content);
    return content;
  } catch {
    return null;
  }
}

/**
 * Case-sensitive file existence check that works uniformly on macOS and Linux.
 */
const dirEntriesCache = new Map();
function existsCaseSensitive(targetPath) {
  const relative = path.relative(DIST_DIR, targetPath);
  if (!relative) return true;
  if (relative.startsWith("..") || path.isAbsolute(relative)) return false;

  const segments = relative.split(path.sep);
  let current = DIST_DIR;

  for (const segment of segments) {
    let entries = dirEntriesCache.get(current);
    if (!entries) {
      try {
        entries = new Set(fs.readdirSync(current));
        dirEntriesCache.set(current, entries);
      } catch {
        return false;
      }
    }
    if (!entries.has(segment)) {
      return false;
    }
    current = path.join(current, segment);
  }

  return true;
}

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
  const rawContent = getCachedFileContent(file) || "";
  const relPath = path.relative(DIST_DIR, file);
  const is404 = relPath === "404.html";
  const isRedirect = rawContent.includes('http-equiv="refresh"');

  // Verify Canonical Tag (Order-independent attribute matching)
  const canonicalMatch = rawContent.match(
    /<link\b(?=[^>]*\brel=["']canonical["'])(?=[^>]*\bhref=["']([^"']+)["'])[^>]*>/i,
  );

  if (!is404 && !isRedirect) {
    if (!canonicalMatch) {
      errors.push({ file: relPath, issue: "Missing <link rel='canonical'>" });
    } else {
      const canonical = canonicalMatch[1].trim();
      let canonicalUrl;
      try {
        canonicalUrl = new URL(canonical);
      } catch {
        errors.push({
          file: relPath,
          issue: `Malformed canonical URL: ${canonical}`,
        });
      }

      if (canonicalUrl) {
        if (canonicalUrl.origin !== SITE_ORIGIN) {
          errors.push({
            file: relPath,
            issue: `Canonical domain mismatch (expected ${SITE_ORIGIN}): ${canonical}`,
          });
        }
        if (
          !canonicalUrl.pathname.endsWith("/") &&
          !path.extname(canonicalUrl.pathname)
        ) {
          errors.push({
            file: relPath,
            issue: `Canonical missing trailing slash: ${canonical}`,
          });
        }

        // Verify canonical matches this document route on disk
        let expectedPath =
          relPath === "index.html"
            ? "/"
            : relPath.endsWith("/index.html")
              ? `/${relPath.slice(0, -10)}`
              : `/${relPath}`;

        if (!expectedPath.endsWith("/") && !path.extname(expectedPath)) {
          expectedPath = `${expectedPath}/`;
        }

        if (canonicalUrl.pathname !== expectedPath) {
          errors.push({
            file: relPath,
            issue: `Canonical path mismatch: expected '${expectedPath}' but found '${canonicalUrl.pathname}'`,
          });
        }
      }
    }
  }

  // Strip HTML comments, script tags, and style blocks to avoid false positives
  const sanitizedContent = rawContent
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "");

  // Verify HTML Links (<a href>, <link href>, <area href>)
  const hrefMatches = sanitizedContent.matchAll(
    /<(?:a|link|area)\s+[^>]*href=["']([^"']+)["']/gi,
  );

  for (const match of hrefMatches) {
    const rawHref = match[1].trim();
    scannedCount++;

    if (!rawHref || rawHref.startsWith("#")) {
      continue;
    }

    // Skip non-HTTP protocols (mailto, tel, sms, javascript, data, webcal, etc.)
    if (
      /^[a-z][a-z0-9+.-]*:/i.test(rawHref) &&
      !rawHref.startsWith("http://") &&
      !rawHref.startsWith("https://")
    ) {
      continue;
    }

    // Flag insecure HTTP internal links
    if (rawHref.startsWith("http://")) {
      try {
        if (new URL(rawHref).hostname === SITE_HOSTNAME) {
          errors.push({
            file: relPath,
            issue: `Insecure HTTP internal link: ${rawHref}`,
          });
          continue;
        }
      } catch {
        // Fall through
      }
    }

    // Skip external domains with strict hostname equality
    if (rawHref.startsWith("http://") || rawHref.startsWith("https://")) {
      try {
        const parsed = new URL(rawHref);
        if (parsed.hostname !== SITE_HOSTNAME) {
          continue;
        }
      } catch {
        errors.push({
          file: relPath,
          issue: `Malformed URL: ${rawHref}`,
        });
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

    // Normalize path from full site URL or relative link
    let pathnameString = rawHref;
    if (rawHref.startsWith("http://") || rawHref.startsWith("https://")) {
      try {
        pathnameString = new URL(rawHref).pathname;
      } catch {
        continue;
      }
    }

    const [pathAndQuery, hash] = pathnameString.split("#");
    const [cleanPath] = pathAndQuery.split("?");

    // Guard: Double slashes in path
    if (cleanPath.includes("//")) {
      errors.push({
        file: relPath,
        issue: `Double slash in link path: ${rawHref}`,
      });
    }

    let decodedPath = cleanPath;
    try {
      decodedPath = decodeURIComponent(cleanPath);
    } catch {
      errors.push({
        file: relPath,
        issue: `Malformed percent-encoding in path: ${rawHref}`,
      });
    }

    const ext = path.extname(decodedPath).toLowerCase();
    const isAsset = ASSET_EXTENSIONS.has(ext);

    // Guard: Trailing slash rule for directory/page routes
    if (!isAsset && decodedPath !== "" && !decodedPath.endsWith("/")) {
      errors.push({
        file: relPath,
        issue: `Internal link missing trailing slash: ${rawHref}`,
      });
    }

    // Guard: Pre-hash trailing slash rule (/resume/#rev, not /resume#rev)
    if (
      hash !== undefined &&
      decodedPath !== "" &&
      !isAsset &&
      !decodedPath.endsWith("/")
    ) {
      errors.push({
        file: relPath,
        issue: `Missing trailing slash before anchor hash: ${rawHref}`,
      });
    }

    // Resolve target on disk with document-relative support & traversal guard
    if (decodedPath !== "") {
      const docDir = path.dirname(file);
      const resolvedTarget = decodedPath.startsWith("/")
        ? path.join(DIST_DIR, decodedPath)
        : path.resolve(docDir, decodedPath);

      if (!resolvedTarget.startsWith(DIST_DIR)) {
        errors.push({
          file: relPath,
          issue: `Directory traversal link out of build root: ${rawHref}`,
        });
        continue;
      }

      const targetFile = decodedPath.endsWith("/")
        ? path.join(resolvedTarget, "index.html")
        : resolvedTarget;

      let effectiveTarget = null;
      if (existsCaseSensitive(targetFile)) {
        effectiveTarget = targetFile;
      } else {
        const cleanPathStripped = decodedPath.replace(/\/+$/, "");
        const altFile = cleanPathStripped
          ? decodedPath.startsWith("/")
            ? path.join(DIST_DIR, `${cleanPathStripped}.html`)
            : path.resolve(docDir, `${cleanPathStripped}.html`)
          : null;
        if (altFile && existsCaseSensitive(altFile)) {
          effectiveTarget = altFile;
        }
      }

      if (!effectiveTarget) {
        errors.push({
          file: relPath,
          issue: `Broken internal target (not found on disk): ${rawHref}`,
        });
        continue;
      }

      // Guard: Zero-Internal-Redirect Policy (Check if target is a redirect stub)
      if (effectiveTarget.endsWith(".html")) {
        const targetContent = getCachedFileContent(effectiveTarget) || "";
        if (
          /http-equiv=["']?refresh["']?/i.test(targetContent) &&
          effectiveTarget !== file
        ) {
          errors.push({
            file: relPath,
            issue: `Internal link targets a redirect stub (violates Zero Internal Redirect policy): ${rawHref}`,
          });
        }
      }
    }
  }

  // Verify JSON-LD Structured Data
  const jsonLdMatches = rawContent.matchAll(
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
      let isSiteTarget = false;
      let rawPath = value;

      if (value.startsWith("/")) {
        isSiteTarget = true;
      } else if (value.startsWith("http://") || value.startsWith("https://")) {
        try {
          const parsed = new URL(value);
          if (parsed.hostname === SITE_HOSTNAME) {
            isSiteTarget = true;
            rawPath = parsed.pathname + parsed.search + parsed.hash;
          }
        } catch {
          // Skip malformed string
        }
      }

      if (isSiteTarget && (key === "url" || key === "item" || key === "@id")) {
        scannedCount++;
        const [pathAndQuery, hash] = rawPath.split("#");
        const [cleanPath] = pathAndQuery.split("?");

        let decodedPath = cleanPath;
        try {
          decodedPath = decodeURIComponent(cleanPath);
        } catch {
          // ignore
        }

        const ext = path.extname(decodedPath).toLowerCase();

        if (decodedPath.includes("//")) {
          errors.push({
            file: relPath,
            issue: `Double slash in JSON-LD (${key}): ${value}`,
          });
        }
        if (
          !ASSET_EXTENSIONS.has(ext) &&
          decodedPath !== "" &&
          !decodedPath.endsWith("/")
        ) {
          errors.push({
            file: relPath,
            issue: `Missing trailing slash in JSON-LD (${key}): ${value}`,
          });
        }
        if (
          hash !== undefined &&
          decodedPath !== "" &&
          !ASSET_EXTENSIONS.has(ext) &&
          !decodedPath.endsWith("/")
        ) {
          errors.push({
            file: relPath,
            issue: `Missing trailing slash before hash in JSON-LD (${key}): ${value}`,
          });
        }

        // Verify disk existence for JSON-LD URLs
        if (decodedPath !== "") {
          const targetFile = decodedPath.endsWith("/")
            ? path.join(DIST_DIR, decodedPath, "index.html")
            : path.join(DIST_DIR, decodedPath);

          let found = existsCaseSensitive(targetFile);
          if (!found) {
            const cleanPathStripped = decodedPath.replace(/\/+$/, "");
            const altFile = cleanPathStripped
              ? path.join(DIST_DIR, `${cleanPathStripped}.html`)
              : null;
            if (altFile && existsCaseSensitive(altFile)) {
              found = true;
            }
          }

          if (!found) {
            errors.push({
              file: relPath,
              issue: `JSON-LD (${key}) targets missing file on disk: ${value}`,
            });
          }
        }
      }
    } else if (typeof value === "object") {
      validateJsonLdUrls(value, relPath);
    }
  }
}

// ---------------------------------------------------------------------------
// 2. Audit Taxonomy & Tag Casing (Dotfile & Directory Guard)
// ---------------------------------------------------------------------------
const tagDir = path.join(DIST_DIR, "blog/tag");
if (fs.existsSync(tagDir)) {
  for (const entry of fs.readdirSync(tagDir, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name.startsWith(".")) continue;
    if (entry.name !== entry.name.toLowerCase()) {
      errors.push({
        file: `blog/tag/${entry.name}`,
        issue: `Uppercase tag directory detected: ${entry.name}`,
      });
    }
  }
}

// ---------------------------------------------------------------------------
// 3. Audit Non-HTML Surfaces (llms.txt, robots.txt, dynamic sitemaps)
// ---------------------------------------------------------------------------

// Assert presence of required production files
for (const req of ["robots.txt", "sitemap-index.xml"]) {
  if (!fs.existsSync(path.join(DIST_DIR, req))) {
    errors.push({
      file: req,
      issue: `Required production file missing from build output: ${req}`,
    });
  }
}

// llms.txt validation
const llmsPath = path.join(DIST_DIR, "llms.txt");
if (fs.existsSync(llmsPath)) {
  const llms = fs.readFileSync(llmsPath, "utf8");
  const linkMatches = llms.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g);
  for (const match of linkMatches) {
    const rawHref = match[2].trim();
    scannedCount++;

    let isInternal = false;
    let pathString = rawHref;

    if (rawHref.startsWith("/")) {
      isInternal = true;
    } else if (
      rawHref.startsWith("http://") ||
      rawHref.startsWith("https://")
    ) {
      try {
        const parsed = new URL(rawHref);
        if (parsed.hostname === SITE_HOSTNAME) {
          isInternal = true;
          pathString = parsed.pathname + parsed.search + parsed.hash;
        }
      } catch {
        // Skip
      }
    }

    if (isInternal) {
      const [pathAndQuery, hash] = pathString.split("#");
      const [cleanPath] = pathAndQuery.split("?");

      let decodedPath = cleanPath;
      try {
        decodedPath = decodeURIComponent(cleanPath);
      } catch {
        // ignore
      }

      const ext = path.extname(decodedPath).toLowerCase();

      if (
        !ASSET_EXTENSIONS.has(ext) &&
        decodedPath !== "" &&
        !decodedPath.endsWith("/")
      ) {
        errors.push({
          file: "llms.txt",
          issue: `Missing trailing slash in llms.txt link: ${rawHref}`,
        });
      }
      if (
        hash !== undefined &&
        decodedPath !== "" &&
        !ASSET_EXTENSIONS.has(ext) &&
        !decodedPath.endsWith("/")
      ) {
        errors.push({
          file: "llms.txt",
          issue: `Missing trailing slash before hash in llms.txt link: ${rawHref}`,
        });
      }

      // Check disk target
      if (decodedPath !== "") {
        const targetFile = decodedPath.endsWith("/")
          ? path.join(DIST_DIR, decodedPath, "index.html")
          : path.join(DIST_DIR, decodedPath);

        let found = existsCaseSensitive(targetFile);
        if (!found) {
          const cleanPathStripped = decodedPath.replace(/\/+$/, "");
          const altFile = cleanPathStripped
            ? path.join(DIST_DIR, `${cleanPathStripped}.html`)
            : null;
          if (altFile && existsCaseSensitive(altFile)) {
            found = true;
          }
        }

        if (!found) {
          errors.push({
            file: "llms.txt",
            issue: `llms.txt link targets missing file on disk: ${rawHref}`,
          });
        }
      }
    }
  }
}

// robots.txt validation
const robotsPath = path.join(DIST_DIR, "robots.txt");
if (fs.existsSync(robotsPath)) {
  const robots = fs.readFileSync(robotsPath, "utf8");
  const sitemapMatch = robots.match(/Sitemap:\s*(https?:\/\/[^\s]+)/i);
  if (!sitemapMatch) {
    errors.push({ file: "robots.txt", issue: "Missing Sitemap directive" });
  } else if (sitemapMatch[1].trim() !== `${SITE_DOMAIN}/sitemap-index.xml`) {
    errors.push({
      file: "robots.txt",
      issue: `Unexpected Sitemap directive URL: ${sitemapMatch[1]}`,
    });
  }
}

// sitemap-index.xml and child sitemaps validation
const sitemapIndexPath = path.join(DIST_DIR, "sitemap-index.xml");
if (fs.existsSync(sitemapIndexPath)) {
  const sitemapIndex = fs.readFileSync(sitemapIndexPath, "utf8");
  const sitemapMatches = sitemapIndex.matchAll(/<loc>([^<]+)<\/loc>/g);
  const discoveredSitemaps = [];

  for (const match of sitemapMatches) {
    const sitemapUrl = match[1].trim();
    try {
      const parsed = new URL(sitemapUrl);
      if (parsed.hostname === SITE_HOSTNAME) {
        discoveredSitemaps.push(
          path.join(DIST_DIR, path.basename(parsed.pathname)),
        );
      }
    } catch {
      errors.push({
        file: "sitemap-index.xml",
        issue: `Malformed sitemap URL in index: ${sitemapUrl}`,
      });
    }
  }

  // Iterate over all discovered sitemap files
  for (const sitemapFile of discoveredSitemaps) {
    const sitemapRel = path.relative(DIST_DIR, sitemapFile);
    if (!fs.existsSync(sitemapFile)) {
      errors.push({
        file: "sitemap-index.xml",
        issue: `Referenced sitemap not found on disk: ${sitemapRel}`,
      });
      continue;
    }

    const sitemapContent = fs.readFileSync(sitemapFile, "utf8");
    const locMatches = sitemapContent.matchAll(/<loc>([^<]+)<\/loc>/g);

    for (const match of locMatches) {
      const loc = match[1].trim();
      scannedCount++;

      let parsedLoc;
      try {
        parsedLoc = new URL(loc);
      } catch {
        errors.push({
          file: sitemapRel,
          issue: `Malformed sitemap URL: ${loc}`,
        });
        continue;
      }

      if (parsedLoc.origin !== SITE_ORIGIN) {
        errors.push({
          file: sitemapRel,
          issue: `Sitemap URL domain mismatch: ${loc}`,
        });
      }

      let decodedPath = parsedLoc.pathname;
      try {
        decodedPath = decodeURIComponent(parsedLoc.pathname);
      } catch {
        // ignore
      }

      const ext = path.extname(decodedPath).toLowerCase();
      if (
        !ASSET_EXTENSIONS.has(ext) &&
        decodedPath !== "" &&
        !decodedPath.endsWith("/")
      ) {
        errors.push({
          file: sitemapRel,
          issue: `Sitemap URL missing trailing slash: ${loc}`,
        });
      }

      // Check disk target
      const targetPath = decodedPath.endsWith("/")
        ? path.join(DIST_DIR, decodedPath, "index.html")
        : path.join(DIST_DIR, decodedPath);

      let effectiveTarget = null;
      if (existsCaseSensitive(targetPath)) {
        effectiveTarget = targetPath;
      } else {
        const cleanPathStripped = decodedPath.replace(/\/+$/, "");
        const altFile = cleanPathStripped
          ? path.join(DIST_DIR, `${cleanPathStripped}.html`)
          : null;
        if (altFile && existsCaseSensitive(altFile)) {
          effectiveTarget = altFile;
        }
      }

      if (!effectiveTarget) {
        errors.push({
          file: sitemapRel,
          issue: `Sitemap URL targets missing file on disk: ${loc}`,
        });
      } else if (effectiveTarget.endsWith(".html")) {
        // Verify sitemap does not advertise a noindex redirect page
        const content = getCachedFileContent(effectiveTarget) || "";
        if (
          /<meta\s+[^>]*name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(
            content,
          )
        ) {
          errors.push({
            file: sitemapRel,
            issue: `Sitemap advertises page marked with noindex: ${loc}`,
          });
        }
      }
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
