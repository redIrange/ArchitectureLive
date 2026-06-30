import { test } from "node:test";
import assert from "node:assert/strict";
import { splitBlocks, parseProjectBody, groupProse } from "./project-body.mjs";

// Real shape: inline testimonial (###) + title echo (##) + prose, no frontmatter testimonial.
const LODSWORTH = `### _"This has been an amazing project which ArchitectureLIVE delivered with calm and confidence."_

### _\\- Rebecca & Dom, Lodsworth, West Sussex_

## Country House

## Remodelling & Extension, Lodsworth, West Sussex

The brief, to update an 18C cottage and its numerous extensions.

This historic country home is located in the SDNP and has been subject to numerous extensions.

Our design remodelled the entire interior and added extensions.`;

// Same inline testimonial present, but ALSO in frontmatter (Plan B) → body copy is a duplicate.
const PERIOD_HOUSE = `### _"..... we're finding, pretty much daily, we catch ourselves in the space."_

### _\\- Rebecca and Jim, Haslemere_

## Period House

## Extension and Alterations, Haslemere, Surrey

The brief, to reconfigure the existing ground floor.

The property is a detached two storey house from the inter-war period.`;

// No testimonial, just the title echo.
const OFFICE = `## 1960s House

## Near Passivhaus Office Extension

This 1960 family home was first remodelled by ArchitectureLIVE 8 years ago.

The final phase of our design is a near Passivhaus single storey annex.

Externally, the design falls inline with the remodelled character of the house.`;

test("splitBlocks splits on blank lines and trims", () => {
  assert.deepEqual(splitBlocks("a\n\n  b  \n\n\n c"), ["a", "b", "c"]);
});

test("lifts the inline testimonial when there is no frontmatter one", () => {
  const { testimonial, prose } = parseProjectBody(LODSWORTH, { hasFrontmatterTestimonial: false });
  assert.ok(testimonial, "testimonial should be lifted");
  assert.match(testimonial.quote, /^This has been an amazing project/);
  assert.equal(testimonial.author, "Rebecca & Dom, Lodsworth, West Sussex");
  // title echo + testimonial removed; only the 3 prose paragraphs remain
  assert.equal(prose.length, 3);
  assert.match(prose[0], /^The brief/);
  assert.ok(!prose.some((p) => /^#/.test(p)), "no heading blocks left in prose");
});

test("drops the body testimonial as a duplicate when frontmatter has one", () => {
  const { testimonial, prose } = parseProjectBody(PERIOD_HOUSE, { hasFrontmatterTestimonial: true });
  assert.equal(testimonial, null, "body testimonial dropped (frontmatter wins)");
  assert.equal(prose.length, 2);
  assert.match(prose[0], /^The brief/);
});

test("strips the title/sector echo even with no testimonial", () => {
  const { testimonial, prose } = parseProjectBody(OFFICE, { hasFrontmatterTestimonial: false });
  assert.equal(testimonial, null);
  assert.equal(prose.length, 3);
  assert.match(prose[0], /^This 1960 family home/);
  assert.ok(!prose.some((p) => /^#/.test(p)), "no heading blocks left in prose");
});

test("a plain body with no headings passes through untouched", () => {
  const { testimonial, prose } = parseProjectBody("Para one.\n\nPara two.", {});
  assert.equal(testimonial, null);
  assert.deepEqual(prose, ["Para one.", "Para two."]);
});

test("groupProse chunks paragraphs into pairs", () => {
  assert.deepEqual(groupProse(["a", "b", "c", "d", "e"], 2), ["a\n\nb", "c\n\nd", "e"]);
});
