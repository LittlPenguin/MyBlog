import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const runtimeMdxCompilerPattern = /next-mdx-remote\/rsc/;

test("public detail routes avoid runtime MDX compilation on Cloudflare", async () => {
  const files = [
    "src/lib/posts.ts",
    "src/app/projects/project-detail-content.tsx",
    "src/app/resources/resource-detail-content.tsx",
  ];

  for (const file of files) {
    const source = await readFile(path.join(process.cwd(), file), "utf8");
    assert.equal(
      runtimeMdxCompilerPattern.test(source),
      false,
      `${file} should render bundled content without next-mdx-remote/rsc`,
    );
  }
});
