#!/usr/bin/env node
/**
 * node engine/scripts/storyboard.mjs <slug>      (run via ./edit storyboard <slug>)
 *
 * The step that keeps edits from looking like AI slop: before the full render, render ONE real frame per
 * beat and lay them out as a storyboard page (projects/<slug>/out/storyboard.html, self-contained).
 * Each card shows the time, the words said, what's on screen, the layout and a notes box. "Copy all notes"
 * gathers every note into one message to paste back to Claude. Nothing renders in full until it's approved.
 */
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const ENGINE = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const ROOT = path.dirname(ENGINE);
const slug = process.argv[2];
const P = path.join(ROOT, "projects", slug);
const props = JSON.parse(fs.readFileSync(path.join(P, ".props.json"), "utf8"));
const FPS = 30;
const outDir = path.join(P, "out", "storyboard");
fs.mkdirSync(outDir, { recursive: true });

const strip = (t = "") => String(t).replace(/\[\[[a-z]+(?:@\d+)?:([^\]]+)\]\]/g, "$1").replace(/\*([^*]+)\*/g, "$1").replace(/\{\{img:([^}]+)\}\}/g, "[$1]").replace(/\n/g, " / ");
const time = (s) => `${Math.floor(s / 60)}:${(s % 60).toFixed(1).padStart(4, "0")}`;
const said = (b) => props.words.filter((w) => w.s >= b.s - 0.05 && w.s < b.e - 0.05).map((w) => w.text).join(" ");
const LAYOUT = { face: "Face only", split: "Split: graphic top, face bottom", full: "Full-screen graphic (voice continues)", overlay: "Graphic over the face" };
const describe = (b) => {
  const p = b.panel;
  if (!p) return b.zoom && b.zoom > 1 ? "Face, punched in" : "Face";
  const items = (xs) => xs.map((x) => strip(typeof x === "string" ? x : x.text ?? x.label ?? x.src)).join(" · ");
  switch (p.type) {
    case "title": return `Title: “${strip(p.text)}”${p.sub ? ` / ${strip(p.sub)}` : ""}`;
    case "stat": return `Big number: ${p.value}${p.label ? ` (${strip(p.label)})` : ""}`;
    case "list": return `List${p.title ? ` “${strip(p.title)}”` : ""}: ${items(p.items)}`;
    case "media": return `${p.fill ? "Full-bleed " : ""}${/\.(mp4|mov|webm|m4v)$/i.test(p.src) ? "video" : "image"}: ${p.src}${p.frame ? ` in a ${p.frame} frame` : ""}${p.focus ? (p.zoom ? ", zooms into the key part" : ", key part circled") : ""}`;
    case "logos": return `Logos: ${p.items.map((i) => i.label ?? path.basename(i.src)).join(" · ")}`;
    case "compare": return `Compare: ✗ ${strip(p.left.title)} vs ✓ ${strip(p.right.title)}`;
    case "chat": return `Chat: ${p.messages.map((m) => `${m.from}: “${strip(m.text)}”`).join(" → ")}`;
    case "typing": return `${p.variant ?? "prompt"} box typing “${strip(p.text)}”${p.result ? ` → “${strip(p.result)}”` : ""}`;
    case "icon": return `Icon ${p.emoji ?? p.src}${p.label ? `: “${strip(p.label)}”` : ""}`;
    case "quote": return `Quote: “${strip(p.text)}”${p.author ? ` (${p.author})` : ""}`;
    default: return p.type;
  }
};

console.log("bundling...");
const serveUrl = await bundle({ entryPoint: path.join(ENGINE, "src", "index.ts"), publicDir: path.join(ENGINE, "public") });
const composition = await selectComposition({ serveUrl, id: "Main", inputProps: props });
const beats = props.beats.length ? props.beats : [{ s: 0, e: props.duration, layout: "face" }];
const cards = [];
for (const [i, b] of beats.entries()) {
  // 70% into the beat: the graphic has landed, lists/marks have drawn
  const frame = Math.min(composition.durationInFrames - 1, Math.round((b.s + (b.e - b.s) * 0.7) * FPS));
  const file = path.join(outDir, `beat-${String(i + 1).padStart(2, "0")}.jpg`);
  await renderStill({ composition, serveUrl, inputProps: props, frame, output: file, imageFormat: "jpeg", jpegQuality: 70, scale: 0.4 });
  process.stdout.write(`\rframe ${i + 1}/${beats.length}`);
  cards.push({ i, b, img: fs.readFileSync(file).toString("base64") });
}
console.log("");

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Storyboard: ${esc(slug)}</title>
<style>
:root{--bg:#f5f3ef;--card:#fff;--ink:#161616;--muted:#6b6862;--line:#e4e0d8;--accent:#ff5b2e}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.45 -apple-system,BlinkMacSystemFont,"Inter",sans-serif}
header{position:sticky;top:0;z-index:2;background:rgba(245,243,239,.92);backdrop-filter:blur(8px);border-bottom:1px solid var(--line);padding:16px 24px;display:flex;gap:16px;align-items:center;flex-wrap:wrap}
h1{font-size:20px;margin:0}header p{margin:0;color:var(--muted);flex:1;min-width:240px}
button{font:inherit;font-weight:600;border:0;border-radius:10px;padding:10px 16px;background:var(--ink);color:#fff;cursor:pointer}
button.ok{background:var(--accent)}
main{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:18px;padding:24px;max-width:1500px;margin:0 auto}
.card{background:var(--card);border:1px solid var(--line);border-radius:16px;overflow:hidden;display:flex;flex-direction:column}
.card img{width:100%;aspect-ratio:9/16;object-fit:cover;background:#000;display:block}
.body{padding:14px 16px 16px;display:flex;flex-direction:column;gap:8px;flex:1}
.top{display:flex;justify-content:space-between;font-weight:700}.top span{color:var(--muted);font-weight:500;font-variant-numeric:tabular-nums}
.said{font-size:17px;font-weight:600}.row{color:var(--muted);font-size:13.5px}.row b{color:var(--ink);font-weight:600}
textarea{margin-top:auto;width:100%;min-height:62px;border:1px solid var(--line);border-radius:10px;padding:10px;font:inherit;resize:vertical}
textarea:not(:placeholder-shown){border-color:var(--accent);background:#fff8f5}
#toast{position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:var(--ink);color:#fff;padding:10px 16px;border-radius:10px;opacity:0;transition:.2s}
</style></head><body>
<header><h1>${esc(slug)}: ${cards.length} beats, ${props.duration.toFixed(1)}s</h1>
<p>Leave a note on any beat you want changed, then copy them all and paste them back to Claude. Happy with it? Tell Claude it's approved.</p>
<button onclick="copyNotes()">Copy all notes</button><button class="ok" onclick="approve()">Copy "approved"</button></header>
<main>${cards.map(({ i, b, img }) => `
<section class="card"><img src="data:image/jpeg;base64,${img}" alt="beat ${i + 1}">
<div class="body"><div class="top">Beat ${i + 1}<span>${time(b.s)} – ${time(b.e)} · ${(b.e - b.s).toFixed(1)}s</span></div>
<div class="said">“${esc(said(b) || "…")}”</div>
<div class="row"><b>On screen:</b> ${esc(describe(b))}</div>
<div class="row"><b>Layout:</b> ${esc(LAYOUT[b.layout] ?? b.layout)}</div>
${b.note ? `<div class="row"><b>Why:</b> ${esc(b.note)}</div>` : ""}
<textarea data-beat="${i + 1}" data-t="${time(b.s)}" placeholder="Note for this beat (optional)"></textarea></div></section>`).join("")}
</main><div id="toast"></div>
<script>
const KEY="storyboard-${esc(slug)}";
const boxes=[...document.querySelectorAll("textarea")];
try{const saved=JSON.parse(localStorage.getItem(KEY)||"{}");boxes.forEach(t=>t.value=saved[t.dataset.beat]||"")}catch(e){}
boxes.forEach(t=>t.addEventListener("input",()=>{try{localStorage.setItem(KEY,JSON.stringify(Object.fromEntries(boxes.map(x=>[x.dataset.beat,x.value]))))}catch(e){}}));
function toast(m){const el=document.getElementById("toast");el.textContent=m;el.style.opacity=1;setTimeout(()=>el.style.opacity=0,1800)}
function copy(text,msg){navigator.clipboard.writeText(text).then(()=>toast(msg),()=>prompt("Copy this:",text))}
function copyNotes(){const n=boxes.filter(t=>t.value.trim()).map(t=>"Beat "+t.dataset.beat+" ("+t.dataset.t+"): "+t.value.trim());
 if(!n.length)return toast("No notes yet");copy("Storyboard notes for ${esc(slug)}:\\n"+n.join("\\n"),"Copied "+n.length+" note(s)")}
function approve(){copy("Storyboard for ${esc(slug)} is approved, render it.","Copied")}
</script></body></html>`;
const out = path.join(P, "out", "storyboard.html");
fs.writeFileSync(out, html);
console.log(`storyboard: ${out}`);
try { execSync(`open "${out}"`); } catch {}
