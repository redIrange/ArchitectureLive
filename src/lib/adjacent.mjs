// src/lib/adjacent.mjs
export function adjacent(items, current) {
  const i = items.indexOf(current);
  const n = items.length;
  return { prev: items[(i - 1 + n) % n], next: items[(i + 1) % n] };
}
