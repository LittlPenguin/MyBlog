import { cp, access, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const rootDir = process.cwd();
const devTypesDir = path.join(rootDir, ".next", "dev", "types");
const prodTypesDir = path.join(rootDir, ".next", "types");
const cacheLifeShimPath = path.join(prodTypesDir, "cache-life.d.ts");
const cacheLifeShimSource = `// This file is generated as a compatibility shim for Next.js typecheck flows.
// Some Next.js 16 builds reference .next/types/cache-life.d.ts even when typegen omits it.
export {};
`;

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

if (!(await exists(cacheLifeShimPath))) {
  await mkdir(prodTypesDir, { recursive: true });
  await writeFile(cacheLifeShimPath, cacheLifeShimSource, "utf8");
}
