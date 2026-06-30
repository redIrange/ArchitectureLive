// scripts/migrate/lib/sql.mjs
const UNESCAPE = { n: "\n", t: "\t", r: "\r", "0": "\0", "\\": "\\", "'": "'", '"': '"' };

export function columnsOf(sql, table) {
  const start = sql.indexOf("CREATE TABLE `" + table + "`");
  if (start < 0) throw new Error("no CREATE TABLE for " + table);
  const cols = [];
  for (const line of sql.slice(start).split("\n").slice(1)) {
    const m = line.match(/^\s*`([A-Za-z0-9_]+)`\s/);
    if (m) cols.push(m[1]);
    if (line.trim().startsWith(")")) break;
  }
  return cols;
}

function* tuples(sql, table) {
  const needle = "INSERT INTO `" + table + "` VALUES ";
  let i = 0;
  while ((i = sql.indexOf(needle, i)) >= 0) {
    i += needle.length;
    const n = sql.length;
    while (i < n && sql[i] === "(") {
      i++;
      const fields = [];
      let cur = "", inStr = false, isNull = true;
      while (i < n) {
        const c = sql[i];
        if (inStr) {
          if (c === "\\") { const nx = sql[i + 1]; cur += UNESCAPE[nx] ?? nx; i += 2; continue; }
          if (c === "'") { inStr = false; i++; continue; }
          cur += c; i++; continue;
        }
        if (c === "'") { inStr = true; isNull = false; i++; continue; }
        if (c === ",") { fields.push(isNull && cur === "NULL" ? null : cur); cur = ""; isNull = true; i++; continue; }
        if (c === ")") { fields.push(isNull && cur === "NULL" ? null : cur); i++; break; }
        cur += c; i++;
      }
      yield fields;
      if (i < n && sql[i] === ",") { i++; continue; }
      break;
    }
  }
}

export function rowObjects(sql, table) {
  const cols = columnsOf(sql, table);
  const out = [];
  for (const f of tuples(sql, table)) {
    if (f.length !== cols.length) continue;
    const o = {};
    cols.forEach((c, k) => (o[c] = f[k]));
    out.push(o);
  }
  return out;
}
