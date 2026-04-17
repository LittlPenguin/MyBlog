import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import test from "node:test";

test("legacy project frontmatter without assetNames can be normalized to an empty array", async () => {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "myblog-legacy-project-"));
  const projectPath = path.join(tempRoot, "legacy-project.mdx");

  await writeFile(
    projectPath,
    `---
title: "Legacy Project"
slug: "legacy-project"
summary: "Legacy summary"
date: "2026-04-01"
category: "椤圭洰"
tags:
  - Legacy
featured: false
draft: false
hidden: false
year: "2026"
stack:
  - Legacy
icon: "grid"
accent: "primary"
---

# Legacy Project
`,
    "utf8",
  );

  const source = await readFile(projectPath, "utf8");
  const { default: matter } = await import("gray-matter");
  const { data } = matter(source);

  const normalized = {
    ...(data ?? {}),
    description: data.description ?? data.summary,
    year: data.year ?? data.date.slice(0, 4),
    stack: data.stack ?? (data.tags.length > 0 ? data.tags : ["Notes"]),
    icon: data.icon ?? "grid",
    accent: data.accent ?? "primary",
    assetNames: data.assetNames ?? [],
    assetPaths: data.assetPaths ?? [],
  };

  assert.deepEqual(normalized.assetNames, []);
  assert.deepEqual(normalized.assetPaths, []);
});

test("legacy resource frontmatter without assetNames can be normalized to an empty array", async () => {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "myblog-legacy-resource-"));
  const resourcePath = path.join(tempRoot, "legacy-resource.mdx");

  await writeFile(
    resourcePath,
    `---
title: "Legacy Resource"
slug: "legacy-resource"
summary: "Legacy summary"
date: "2026-04-01"
category: "璧勬簮"
tags:
  - Legacy
featured: false
draft: false
hidden: false
url: "https://example.com"
rating: 4
accent: "primary"
monogram: "LR"
---

# Legacy Resource
`,
    "utf8",
  );

  const source = await readFile(resourcePath, "utf8");
  const { default: matter } = await import("gray-matter");
  const { data } = matter(source);

  const normalized = {
    ...(data ?? {}),
    description: data.description ?? data.summary,
    url: data.url ?? `/resources/${data.slug}`,
    rating: data.rating ?? 4,
    accent: data.accent ?? "primary",
    monogram: data.monogram ?? "LR",
    assetNames: data.assetNames ?? [],
    assetPaths: data.assetPaths ?? [],
  };

  assert.deepEqual(normalized.assetNames, []);
  assert.deepEqual(normalized.assetPaths, []);
});
