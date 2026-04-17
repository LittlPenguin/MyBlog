import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import test from "node:test";
import { findContentFileBySlug, normalizeContentSlug } from "./content-slug.ts";

test("normalizeContentSlug decodes encoded slugs and keeps plain values stable", () => {
  assert.equal(normalizeContentSlug("%E6%B5%8B%E8%AF%95%E9%A1%B9%E7%9B%AE"), "测试项目");
  assert.equal(normalizeContentSlug("测试项目"), "测试项目");
  assert.equal(normalizeContentSlug("%E6%ZZ"), "%E6%ZZ");
});

test("findContentFileBySlug resolves encoded chinese slugs by filename", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "myblog-content-slug-"));
  await mkdir(root, { recursive: true });
  const filePath = path.join(root, "测试项目.mdx");

  await writeFile(
    filePath,
    `---
title: "测试项目"
slug: "测试项目"
summary: "summary"
date: "2026-04-17"
category: "项目"
tags:
  - Test
featured: false
draft: false
hidden: false
assetNames: []
---

# 测试项目
`,
    "utf8",
  );

  const result = await findContentFileBySlug(root, "%E6%B5%8B%E8%AF%95%E9%A1%B9%E7%9B%AE");

  assert.equal(result?.filePath, filePath);
  assert.equal(result?.slug, "测试项目");
});

test("findContentFileBySlug falls back to matching frontmatter slug when filename differs", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "myblog-content-slug-"));
  await mkdir(root, { recursive: true });
  const filePath = path.join(root, "custom-file-name.mdx");

  await writeFile(
    filePath,
    `---
title: "Custom File"
slug: "测试资源"
summary: "summary"
date: "2026-04-17"
category: "资源"
tags:
  - Test
featured: false
draft: false
hidden: false
assetNames: []
---

# Custom File
`,
    "utf8",
  );

  const result = await findContentFileBySlug(root, "%E6%B5%8B%E8%AF%95%E8%B5%84%E6%BA%90");

  assert.equal(result?.filePath, filePath);
  assert.equal(result?.slug, "测试资源");
});
