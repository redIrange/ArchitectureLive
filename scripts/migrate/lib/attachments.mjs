// scripts/migrate/lib/attachments.mjs
import { rowObjects } from "./sql.mjs";

function metaMap(sql, key) {
  const m = new Map();
  for (const r of rowObjects(sql, "SERVMASK_PREFIX_postmeta")) {
    if (r.meta_key === key) m.set(r.post_id, r.meta_value);
  }
  return m;
}
export const attachmentMap = (sql) => metaMap(sql, "_wp_attached_file");
export const thumbnailMap = (sql) => metaMap(sql, "_thumbnail_id");
export const uploadPath = (rel) => "uploads/" + rel;
