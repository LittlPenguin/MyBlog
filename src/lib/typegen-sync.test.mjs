import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";

function runNode(scriptPath, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [scriptPath], {
      cwd,
      stdio: "ignore",
    });

    child.once("error", reject);
    child.once("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`node ${scriptPath} exited with code ${code}`));
    });
  });
}

test("sync-next-typegen creates a cache-life placeholder when Next omits it", async () => {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "myblog-typegen-"));
  const scriptPath = path.resolve("scripts/sync-next-typegen.mjs");
  const devTypesDir = path.join(tempRoot, ".next", "dev", "types");
  const prodTypesDir = path.join(tempRoot, ".next", "types");

  await mkdir(devTypesDir, { recursive: true });
  await mkdir(prodTypesDir, { recursive: true });
  await writeFile(path.join(devTypesDir, "routes.d.ts"), "export {};\n", "utf8");
  await writeFile(path.join(prodTypesDir, "validator.ts"), "export {};\n", "utf8");

  await runNode(scriptPath, tempRoot);

  const placeholder = await readFile(path.join(prodTypesDir, "cache-life.d.ts"), "utf8");
  assert.match(placeholder, /This file is generated as a compatibility shim/);
});
