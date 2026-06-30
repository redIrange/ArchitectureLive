import { test } from "node:test";
import assert from "node:assert/strict";
import { splitBlocks, bodySegments } from "./project-body.mjs";

const LODSWORTH = `### _"This has been an amazing project delivered with calm and confidence."_

### _\\- Rebecca & Dom, Lodsworth, West Sussex_

## Country House

## Remodelling & Extension, Lodsworth, West Sussex

The brief, to update an 18C cottage and its numerous extensions to deliver a contemporary home.

This historic country home is located in the SDNP and has been subject to numerous extensions over time.

Our design remodelled the entire interior and added extensions to form a new open-plan family room.

architect & lighting & interior design

ArchitectureLIVE`;

test("splitBlocks splits on blank lines and trims", () => {
  assert.deepEqual(splitBlocks("a\n\n  b  \n\n\n c"), ["a", "b", "c"]);
});

test("leading headings stay with the first paragraph; nothing is removed", () => {
  const segs = bodySegments(LODSWORTH);
  // every original block is still present, in order, when segments are rejoined
  const rejoined = segs.join("\n\n");
  assert.ok(rejoined.includes("## Country House"), "title heading kept");
  assert.ok(rejoined.includes("amazing project"), "testimonial kept");
  // segment 1 carries the headings + the first paragraph (no break among headings)
  assert.match(segs[0], /^### /);
  assert.ok(segs[0].includes("The brief, to update"), "first paragraph joins the headings");
  assert.ok(!segs[0].includes("This historic"), "second paragraph starts a new segment");
});

test("short trailing lines (credits) attach to the previous prose, not their own segment", () => {
  const segs = bodySegments(LODSWORTH);
  const last = segs[segs.length - 1];
  assert.ok(last.includes("architect & lighting"), "credit attaches");
  assert.ok(last.includes("ArchitectureLIVE"), "sign-off attaches");
  assert.ok(last.includes("Our design remodelled"), "to the last substantial paragraph");
});

test("produces one break per substantial paragraph after the first", () => {
  // 3 substantial paragraphs → segment1 (headings+para1), para2, para3+credits = 3 segments
  const segs = bodySegments(LODSWORTH);
  assert.equal(segs.length, 3);
});

test("a plain body with no headings still segments by paragraph", () => {
  const md = "First long paragraph that is clearly over the fifty character threshold here.\n\nSecond long paragraph that is also clearly over the fifty character threshold.";
  const segs = bodySegments(md);
  assert.equal(segs.length, 2);
});
