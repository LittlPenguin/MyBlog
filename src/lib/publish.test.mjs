import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import { mkdtemp, readFile } from "node:fs/promises";
import test from "node:test";
import { writeEditorContentFile } from "./content.ts";
import { getProjectBySlug, getProjectDetailBySlug } from "./projects.ts";
import { getResourceBySlug, getResourceDetailBySlug } from "./resources.ts";

test("writeEditorContentFile writes archive content into posts directory", async () => {
  const rootDir = await mkdtemp(path.join(os.tmpdir(), "myblog-publish-"));

  const result = await writeEditorContentFile({
    rootDir,
    payload: {
      title: "Fresh Note",
      slug: "fresh-note",
      summary: "Summary",
      content: "# Fresh Note\n\nBody",
      category: "archive",
      tags: ["note"],
      scheduleAt: null,
      cover: null,
      assets: [],
    },
    now: () => "2026-04-09T12:00:00.000Z",
  });

  assert.equal(result.ok, true);
  if (!result.ok) {
    return;
  }

  const persisted = await readFile(path.join(rootDir, "posts", "fresh-note.mdx"), "utf8");
  assert.match(persisted, /title: Fresh Note/);
  assert.match(persisted, /slug: fresh-note/);
  assert.match(persisted, /# Fresh Note/);
});

test("writeEditorContentFile refuses to overwrite an existing slug", async () => {
  const rootDir = await mkdtemp(path.join(os.tmpdir(), "myblog-publish-"));

  await writeEditorContentFile({
    rootDir,
    payload: {
      title: "First Note",
      slug: "same-slug",
      summary: "Summary",
      content: "# First",
      category: "archive",
      tags: [],
      scheduleAt: null,
      cover: null,
      assets: [],
    },
  });

  const second = await writeEditorContentFile({
    rootDir,
    payload: {
      title: "Second Note",
      slug: "same-slug",
      summary: "Summary",
      content: "# Second",
      category: "archive",
      tags: [],
      scheduleAt: null,
      cover: null,
      assets: [],
    },
  });

  assert.equal(second.ok, false);
  if (second.ok) {
    return;
  }

  assert.equal(typeof second.errors?.slug, "string");
});

test("published project metadata is discoverable through the public project reader", async () => {
  const project = await getProjectBySlug("nebula-core");

  assert.ok(project);
  assert.equal(project?.slug, "nebula-core");
  assert.equal(project?.title, "Nebula Core");
  assert.deepEqual(project?.stack, ["Next.js", "TypeScript", "Charts"]);
});

test("published resource metadata is discoverable through the public resource reader", async () => {
  const resource = await getResourceBySlug("framer-motion");

  assert.ok(resource);
  assert.equal(resource?.slug, "framer-motion");
  assert.equal(resource?.title, "Framer Motion");
  assert.equal(resource?.url, "https://www.framer.com/motion/");
});

test("published project detail exposes body content for the public detail page", async () => {
  const project = await getProjectDetailBySlug("nebula-core");

  assert.ok(project);
  assert.match(project?.rawContent ?? "", /Nebula Core 是一个偏内容运营视角的数据面板实验/i);
});

test("published resource detail exposes body content for the public detail page", async () => {
  const resource = await getResourceDetailBySlug("framer-motion");

  assert.ok(resource);
  assert.match(resource?.rawContent ?? "", /Framer Motion 仍然是这个站点里最适合做页面层级过渡和组件入场的动画工具/i);
});
