import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";

test("D1 content export emits remote-compatible insert statements", () => {
  const result = spawnSync(process.execPath, ["scripts/export-content-for-d1.mjs"], {
    cwd: process.cwd(),
    encoding: "utf8",
  });

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /INSERT INTO content_items/);
  assert.doesNotMatch(result.stdout, /\bBEGIN\s+TRANSACTION\b/i);
  assert.doesNotMatch(result.stdout, /\bCOMMIT\b/i);
});
