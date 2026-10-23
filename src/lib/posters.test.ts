import assert from "node:assert/strict";
import test from "node:test";
import { posterExtension } from "./posters.ts";

test("poster validation accepts supported images up to 5 MB and rejects empty, oversized, or unsupported files", () => {
  assert.equal(posterExtension({ type: "image/jpeg", size: 10 }), "jpg");
  assert.equal(posterExtension({ type: "image/png", size: 5 * 1024 * 1024 }), "png");
  assert.equal(posterExtension({ type: "image/webp", size: 1 }), "webp");
  for (const file of [{ type: "image/png", size: 0 }, { type: "image/png", size: 5 * 1024 * 1024 + 1 }, { type: "image/svg+xml", size: 10 }]) {
    assert.equal(posterExtension(file), null);
  }
});
