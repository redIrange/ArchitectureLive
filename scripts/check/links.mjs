// scripts/check/links.mjs — crawl the sitemap and HEAD every URL, report non-200s.
// Usage: node scripts/check/links.mjs [base-url]   (default: the *.pages.dev preview)
const base = (process.argv[2] || "https://architecturelive.pages.dev").replace(/\/$/, "");

const smRes = await fetch(`${base}/sitemap-0.xml`);
if (!smRes.ok) {
  console.error(`sitemap fetch failed: ${smRes.status} ${base}/sitemap-0.xml`);
  process.exit(1);
}
const sm = await smRes.text();
const urls = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

let bad = 0;
for (const u of urls) {
  let r;
  try {
    r = await fetch(u, { method: "HEAD", redirect: "follow" });
  } catch (e) {
    bad++;
    console.log("ERR", u, e.message);
    continue;
  }
  if (!r.ok) {
    bad++;
    console.log(r.status, u);
  }
}
console.log(`checked ${urls.length}, bad ${bad}`);
process.exit(bad ? 1 : 0);
