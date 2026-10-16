#!/usr/bin/env node
/**
 * node tools/build_props.mjs <slug>
 *
 * Puts the pieces together for a render:
 *   projects/<slug>/edit.json + words.json + my-style/style.json  ->  projects/<slug>/.props.json
 * and stages cut.mp4 + assets/ into engine/public/<slug>/ (Remotion can only read files from there).
 *
 * It also checks the edit before anything renders and stops with a plain-English list of problems:
 * beats out of order or overlapping, beats past the end, gaps, missing asset files, unknown panel types.
 */
import fs from "fs";
import path from "path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const slug = process.argv[2];
if (!slug) { console.error("usage: node tools/build_props.mjs <slug>"); process.exit(2); }
const P = path.join(ROOT, "projects", slug);
const read = (f, fallback) => {
  const p = path.join(P, f);
  if (!fs.existsSync(p)) { if (fallback !== undefined) return fallback; console.error(`missing ${path.relative(ROOT, p)}`); process.exit(2); }
  try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch (e) { console.error(`${path.relative(ROOT, p)} isn't valid JSON: ${e.message}`); process.exit(2); }
};

const edit = read("edit.json");
const words = read("words.json").words;
const stylePath = path.join(ROOT, "my-style", "style.json");
const style = fs.existsSync(stylePath) ? JSON.parse(fs.readFileSync(stylePath, "utf8")) : {};
const cut = path.join(P, "cut.mp4");
if (!fs.existsSync(cut)) { console.error(`no cut.mp4 in projects/${slug} yet`); process.exit(2); }
const duration = read("words.json").duration;

// ---- check the edit ----
const PANELS = new Set(["title", "stat", "list", "media", "logos", "compare", "chat", "typing", "icon", "quote"]);
const LAYOUTS = new Set(["face", "split", "full", "overlay"]);
const problems = [];
const warnings = [];
const beats = edit.beats ?? [];
const assetsOf = (p) => {
  if (!p) return [];
  const out = [];
  if (p.src) out.push(p.src);
  for (const it of p.items ?? []) if (it && typeof it === "object" && it.src) out.push(it.src);
  for (const t of [p.text, p.sub, p.title, p.label, p.caption].filter(Boolean)) for (const m of String(t).matchAll(/\{\{img:([^}]+)\}\}/g)) out.push(m[1]);
  return out.filter((s) => !/^(https?:|data:)/.test(s));
};
beats.forEach((b, i) => {
  const n = `beat ${i + 1} (${b.s}s)`;
  if (!(b.e > b.s)) problems.push(`${n}: end must be after start`);
  if (b.e > duration + 0.05) problems.push(`${n}: ends at ${b.e}s but the video is ${duration}s`);
  if (i && b.s < beats[i - 1].e - 0.01) problems.push(`${n}: overlaps the beat before it (starts ${b.s}s, previous ends ${beats[i - 1].e}s)`);
  if (i && b.s - beats[i - 1].e > 0.05) warnings.push(`gap from ${beats[i - 1].e}s to ${b.s}s (shows plain face there)`);
  if (!LAYOUTS.has(b.layout)) problems.push(`${n}: layout "${b.layout}" isn't one of ${[...LAYOUTS].join(", ")}`);
  if ((b.layout === "split" || b.layout === "full" || b.layout === "overlay") && !b.panel) problems.push(`${n}: "${b.layout}" layout needs a panel`);
  if (b.panel && !PANELS.has(b.panel.type)) problems.push(`${n}: panel type "${b.panel.type}" doesn't exist (${[...PANELS].join(", ")})`);
  for (const a of assetsOf(b.panel)) if (!fs.existsSync(path.join(P, "assets", a.replace(/^assets\//, "")))) problems.push(`${n}: can't find assets/${a.replace(/^assets\//, "")}`);
  if (b.e - b.s > 4.5 && b.panel && !["list", "logos", "chat", "typing", "media"].includes(b.panel.type)) warnings.push(`${n}: ${(b.e - b.s).toFixed(1)}s on one static ${b.panel.type}. Split it or add something that changes.`);
  if (b.e - b.s < 0.4) warnings.push(`${n}: only ${(b.e - b.s).toFixed(2)}s long, hard to read`);
});
if (beats.length && beats[0].s > 0.05) warnings.push(`nothing planned for the first ${beats[0].s}s (the hook!)`);
if (beats.length && beats.at(-1).e < duration - 0.3) warnings.push(`nothing planned after ${beats.at(-1).e}s (video is ${duration}s)`);

for (const w of warnings) console.log(`  note: ${w}`);
if (problems.length) {
  console.error(`\nThe edit has ${problems.length} problem(s) to fix in projects/${slug}/edit.json:`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}

// ---- stage files for Remotion (copy only what changed) ----
const pub = path.join(ROOT, "engine", "public", slug);
fs.mkdirSync(path.join(pub, "assets"), { recursive: true });
const sync = (from, to) => {
  const a = fs.statSync(from);
  if (fs.existsSync(to)) { const b = fs.statSync(to); if (b.size === a.size && b.mtimeMs >= a.mtimeMs) return; }
  fs.copyFileSync(from, to);
};
sync(cut, path.join(pub, "cut.mp4"));
const assetDir = path.join(P, "assets");
if (fs.existsSync(assetDir)) {
  const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).forEach((d) => {
    const f = path.join(dir, d.name);
    const rel = path.relative(assetDir, f);
    if (d.isDirectory()) { fs.mkdirSync(path.join(pub, "assets", rel), { recursive: true }); walk(f); }
    else if (!d.name.startsWith(".")) sync(f, path.join(pub, "assets", rel));
  });
  walk(assetDir);
}

const props = {
  video: `${slug}/cut.mp4`,
  assets: `${slug}/assets/`,
  duration,
  faceCenter: edit.faceCenter ?? 0.42,
  words,
  beats,
  style,
};
fs.writeFileSync(path.join(P, ".props.json"), JSON.stringify(props));
console.log(`edit checks out: ${beats.length} beats over ${duration}s`);
