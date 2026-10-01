import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { gunzipSync } from "node:zlib";
import { REVISION } from "three";

test("both studio assets match Three.js and contain complete finite half-float texels", async () => {
  for (const size of [64, 256]) {
    const compressed = await readFile(
      new URL(
        `../public/environment/studio-r${REVISION}-${size}.bin.gz`,
        import.meta.url,
      ),
    );
    const pixels = gunzipSync(compressed);
    assert.equal(pixels.length, 3 * Math.max(size, 112) * 4 * size * 8);
    let illuminated = 0;
    for (let offset = 0; offset < pixels.length; offset += 2) {
      const value = pixels.readUInt16LE(offset);
      assert.notEqual(
        value & 0x7c00,
        0x7c00,
        "No NaN or infinity in the environment",
      );
      if (value) illuminated++;
    }
    assert.ok(illuminated > pixels.length / 8, "The studio must not be blank");
  }
});
