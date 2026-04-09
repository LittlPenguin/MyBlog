import { cp, access } from "node:fs/promises";
import path from "node:path";

const rootDir = process.cwd();
const devTypesDir = path.join(rootDir, ".next", "dev", "types");
const prodTypesDir = path.join(rootDir, ".next", "types");

async function exists(targetPath) {
  try {
    await access(targetPath);
    return true;
  } catch {
    return false;
  }
}

if (await exists(devTypesDir)) {
  await cp(devTypesDir, prodTypesDir, { recursive: true, force: true });
}
