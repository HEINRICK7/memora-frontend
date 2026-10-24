import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import pngjs from "pngjs";

const { PNG } = pngjs;
const width = 1600;
const height = 1600;
const colors = [
  [0xe9, 0x4b, 0x35],
  [0x2d, 0x7d, 0xd2],
  [0x97, 0xcc, 0x04],
  [0xf2, 0xc1, 0x4e],
];
const png = new PNG({ width, height });

for (let y = 0; y < height; y += 1) {
  for (let x = 0; x < width; x += 1) {
    const quadrant = (y < height / 2 ? 0 : 2) + (x < width / 2 ? 0 : 1);
    const [red, green, blue] = colors[quadrant];
    const offset = (width * y + x) * 4;
    png.data[offset] = red;
    png.data[offset + 1] = green;
    png.data[offset + 2] = blue;
    png.data[offset + 3] = 255;
  }
}

const output = resolve("tests/fixtures/MEM-007-export-pattern.png");
await mkdir(dirname(output), { recursive: true });
await writeFile(output, PNG.sync.write(png));
