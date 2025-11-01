// generate_books.js
// Usage: node generate_books.js
// Run this from the root of your local clone of policingcs-ethos/Buku-Polisi
//
// What it does:
// - scans "Ebook Booklet" for .pdf files
// - looks for matching cover in "Cover Booklet" with same basename (jpg/png)
// - generates books.json with raw.githubusercontent URLs (owner/repo/branch hardcoded below)

import fs from "fs";
import path from "path";

const OWNER = "policingcs-ethos";
const REPO = "Buku-Polisi";
const BRANCH = "main";

// folders relative to repo root
const EBOOK_DIR = "Ebook Booklet";
const COVER_DIR = "Cover Booklet";

function encodeRawPath(p) {
  // ensure spaces are encoded as %20 and other chars safe
  return p.split("/").map(encodeURIComponent).join("/");
}

function titleFromFilename(name) {
  // remove extension and underscores, replace with spaces, fix casing minimal
  const base = name.replace(/\.[^/.]+$/, "");
  return base.replace(/_/g, " ").replace(/\s+/g, " ").trim();
}

function findCoverFor(basename, coverFiles) {
  // try exact basename with common exts
  const tryNames = [
    basename + ".jpg",
    basename + ".jpeg",
    basename + ".png",
    basename + ".webp",
  ];
  for (const t of tryNames) {
    if (coverFiles.includes(t)) return t;
  }
  // fallback: try case-insensitive match
  const lower = basename.toLowerCase();
  for (const f of coverFiles) {
    if (f.toLowerCase().startsWith(lower)) return f;
  }
  return null;
}

async function main() {
  const repoRoot = process.cwd();
  const ebookDir = path.join(repoRoot, EBOOK_DIR);
  const coverDir = path.join(repoRoot, COVER_DIR);

  if (!fs.existsSync(ebookDir)) {
    console.error("Ebook directory not found:", ebookDir);
    process.exit(1);
  }

  const ebookFiles = fs.readdirSync(ebookDir).filter(f => f.toLowerCase().endsWith(".pdf"));
  const coverFiles = fs.existsSync(coverDir) ? fs.readdirSync(coverDir) : [];

  const books = ebookFiles.map((fname, idx) => {
    const basename = fname.replace(/\.[^/.]+$/, "");
    const title = titleFromFilename(fname);
    const pdfPath = `${EBOOK_DIR}/${fname}`;
    const pdfRaw = `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}/${encodeRawPath(pdfPath)}`;

    const coverFile = findCoverFor(basename, coverFiles);
    const coverRaw = coverFile ? `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}/${encodeRawPath(COVER_DIR + "/" + coverFile)}` : null;

    return {
      id: String(idx + 1),
      title,
      author: "CSP Team",
      pdf: pdfRaw,
      cover: coverRaw,
      filename: fname
    };
  });

  const outPath = path.join(repoRoot, "books.json");
  fs.writeFileSync(outPath, JSON.stringify(books, null, 2), "utf8");
  console.log("Generated books.json with", books.length, "entries ->", outPath);
  console.log("Preview (first 3):", books.slice(0,3));
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
