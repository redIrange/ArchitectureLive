import sharp from "sharp";
import { mkdir } from "node:fs/promises";
const targets = [
  ["src/content/projects/_sample-passivhaus-office", ["hero", "01", "02"], "#5c618c"],
  ["src/content/projects/_sample-listed-country-house", ["hero", "01", "02"], "#4f5387"],
  ["src/content/news/_sample-waverley-award", ["hero"], "#7378d3"],
  ["src/content/news/_sample-passivhaus-approach", ["hero"], "#363636"],
];
for (const [dir, names, color] of targets) {
  await mkdir(dir, { recursive: true });
  for (const n of names) {
    await sharp({ create: { width: 1600, height: 1200, channels: 3, background: color } })
      .jpeg({ quality: 80 }).toFile(`${dir}/${n}.jpg`);
  }
}
console.log("sample images written");
