import assert from "node:assert/strict";
import test from "node:test";
import {
  buildGitHubEditorDeletePlan,
  buildGitHubEditorPublishPlan,
  readGitHubPublishConfig,
} from "./github-publishing.ts";

function createPayload(overrides = {}) {
  return {
    title: "Hello World",
    slug: "hello-world",
    summary: "A short summary.",
    content: "# Hello World\n\nBody.",
    category: "archive",
    tags: ["Next.js"],
    scheduleAt: "2026-04-26T10:30",
    featured: true,
    projectMeta: {
      href: "",
      github: "",
      docs: "",
      year: "",
      stack: [],
      icon: "grid",
      accent: "primary",
    },
    resourceMeta: {
      url: "",
      rating: 4,
      monogram: "",
      accent: "primary",
      topic: "",
    },
    archiveMeta: {
      topic: "Notes",
    },
    cover: null,
    assets: [],
    source: null,
    ...overrides,
  };
}

test("readGitHubPublishConfig requires a repository and token", () => {
  assert.equal(readGitHubPublishConfig({}), null);
  assert.equal(
    readGitHubPublishConfig({
      MYBLOG_GITHUB_REPOSITORY: "LittlPenguin/MyBlog",
    }),
    null,
  );

  assert.deepEqual(
    readGitHubPublishConfig({
      MYBLOG_GITHUB_REPOSITORY: "LittlPenguin/MyBlog",
      MYBLOG_GITHUB_TOKEN: "ghp_example",
    }),
    {
      owner: "LittlPenguin",
      repo: "MyBlog",
      branch: "main",
      token: "ghp_example",
      committerName: null,
      committerEmail: null,
    },
  );
});

test("buildGitHubEditorPublishPlan prepares content and uploaded assets for one commit", () => {
  const payload = createPayload({
    assets: [
      {
        id: "design-notes",
        name: "Design Notes.PDF",
        type: "application/pdf",
        size: 2,
        previewUrl: null,
      },
    ],
  });
  const plan = buildGitHubEditorPublishPlan({
    payload,
    coverUpload: {
      name: "Cover.JPG",
      type: "image/jpeg",
      size: 3,
      buffer: new Uint8Array([1, 2, 3]),
    },
    assetUploads: [
      {
        name: "Design Notes.PDF",
        type: "application/pdf",
        size: 2,
        buffer: new Uint8Array([4, 5]),
      },
    ],
    now: () => "2026-04-26T12:00:00.000Z",
  });

  assert.equal(plan.contentPath, "src/content/posts/hello-world.mdx");
  assert.deepEqual(plan.filesToDelete, []);
  assert.equal(plan.result.ok, true);

  const contentFile = plan.filesToPut.find((file) => file.path === "src/content/posts/hello-world.mdx");
  assert.equal(typeof contentFile?.content, "string");
  assert.match(String(contentFile?.content), /cover: \/uploads\/posts\/hello-world\/cover\.jpg/);
  assert.match(String(contentFile?.content), /\/uploads\/posts\/hello-world\/assets\/design-notes\.pdf/);

  assert.equal(plan.filesToPut.some((file) => file.path === "public/uploads/posts/hello-world/cover.jpg"), true);
  assert.equal(
    plan.filesToPut.some((file) => file.path === "public/uploads/posts/hello-world/assets/design-notes.pdf"),
    true,
  );
});

test("buildGitHubEditorPublishPlan deletes the old content file when a source moves", () => {
  const plan = buildGitHubEditorPublishPlan({
    payload: createPayload({
      slug: "new-slug",
      source: {
        originalCategory: "archive",
        originalSlug: "old-slug",
      },
    }),
    existingSource: `---
title: Old Note
slug: old-slug
summary: Summary
date: '2026-04-26'
category: Notes
tags: []
cover: /uploads/posts/old-slug/cover.jpg
featured: false
assetNames:
  - old.pdf
assetPaths:
  - /uploads/posts/old-slug/assets/old.pdf
---

Body.
`,
  });

  assert.deepEqual(plan.filesToDelete.sort(), [
    "public/uploads/posts/old-slug/assets/old.pdf",
    "public/uploads/posts/old-slug/cover.jpg",
    "src/content/posts/old-slug.mdx",
  ]);
  assert.equal(plan.contentPath, "src/content/posts/new-slug.mdx");
});

test("buildGitHubEditorDeletePlan removes known persisted content and asset paths", () => {
  const plan = buildGitHubEditorDeletePlan({
    source: {
      originalCategory: "resource",
      originalSlug: "saved-resource",
    },
    existingSource: `---
title: Saved Resource
slug: saved-resource
summary: Summary
date: '2026-04-26'
category: Notes
tags: []
cover: /uploads/resources/saved-resource/cover.jpg
featured: false
assetNames:
  - notes.pdf
assetPaths:
  - /uploads/resources/saved-resource/assets/notes.pdf
---

Body.
`,
  });

  assert.equal(plan.result.ok, true);
  assert.equal(plan.result.redirectHref, "/resources");
  assert.deepEqual(plan.filesToDelete.sort(), [
    "public/uploads/resources/saved-resource/assets/notes.pdf",
    "public/uploads/resources/saved-resource/cover.jpg",
    "src/content/resources/saved-resource.mdx",
  ]);
});
