// scripts/migrate/lib/taxonomy.mjs
import { rowObjects } from "./sql.mjs";

export const SECTOR_BY_SLUG = {
  "6th-form-centre-newbury-west-berkshire": "Education",
  "secondary-school-newbury-west-berkshire": "Education",
  "replacement-sports-pavilion-newbury-berkshire": "Education",
  "new-build-conference-centre-newbury-berkshire": "Commercial",
  "restaurant-duke-of-york-square-london": "Commercial",
  "new-build-retirement-house-fareham-hampshire": "New Build",
  "eco-friendly-retirement-house-liss-hampshire": "New Build",
  "retirement-property-duncton-west-sussex": "New Build",
  "housing-development-crawley-west-sussex": "New Build",
  "housing-development-midhurst-west-sussex": "New Build",
  "near-passivhaus-office-extension": "Extensions",
  "1960s-bungalow-haslemere-surrey": "Extensions",
  "1920s-country-house-haslemere-surrey": "Extensions",
  "1930s-country-house-mole-valley-surrey": "Extensions",
  "1950s-house-lodsworth-west-sussex": "Extensions",
  "1960s-detached-house-haslemere-surrey": "Extensions",
  "1960s-house-fernhurst-west-sussex": "Extensions",
  "1960s-house-haslemere-surrey": "Extensions",
  "1960s-house-lodsworth-west-sussex": "Extensions",
  "arts-crafts-home-haslemere-surrey": "Extensions",
  "country-house-cranleigh-surrey": "New Build",
  "country-house-lodsworth-west-sussex": "Extensions",
  "listed-country-house-chiddingfold-surrey": "Extensions",
  "period-house-haslemere-surrey": "Extensions",
  "period-property-haslemere-surrey": "Extensions",
  "period-property-hindhead-surrey": "Extensions",
  "workers-cottage-south-downs-national-park": "Extensions",
};

const CATEGORY_ALIAS = {
  extensions: "Extensions",
  "new-build": "New Build",
  education: "Education",
  commercial: "Commercial",
  uncategorised: "General",
};

let _cache = null;
function categoryIndex(sql) {
  if (_cache) return _cache;
  const terms = new Map(rowObjects(sql, "SERVMASK_PREFIX_terms").map((t) => [t.term_id, t]));
  const tax = rowObjects(sql, "SERVMASK_PREFIX_term_taxonomy").filter((t) => t.taxonomy === "category");
  const ttById = new Map(tax.map((t) => [t.term_taxonomy_id, t]));
  const rel = new Map(); // post_id -> [term_taxonomy_id]
  for (const r of rowObjects(sql, "SERVMASK_PREFIX_term_relationships")) {
    if (!rel.has(r.object_id)) rel.set(r.object_id, []);
    rel.get(r.object_id).push(r.term_taxonomy_id);
  }
  _cache = { terms, ttById, rel };
  return _cache;
}

export function newsCategory(sql, postId) {
  const { terms, ttById, rel } = categoryIndex(sql);
  let result = "General";
  for (const ttId of rel.get(postId) ?? []) {
    const tt = ttById.get(ttId);
    if (!tt) continue;
    const slug = (terms.get(tt.term_id)?.slug || "").toLowerCase();
    const mapped = CATEGORY_ALIAS[slug];
    if (mapped && mapped !== "General") return mapped; // specific category wins immediately
    if (mapped === "General") result = "General";      // record fallback but keep scanning
  }
  return result;
}
