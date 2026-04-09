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
      isHidden: false,
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
      isHidden: false,
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
      isHidden: false,
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
  const project = await getProjectBySlug("project-publish-final");

  assert.ok(project);
  assert.equal(project?.slug, "project-publish-final");
  assert.equal(project?.title, "Project Publish Final");
  assert.equal(project?.draft, false);
  assert.deepEqual(project?.stack, ["final", "project"]);
});

test("published resource metadata is discoverable through the public resource reader", async () => {
  const resource = await getResourceBySlug("resource-publish-final");

  assert.ok(resource);
  assert.equal(resource?.slug, "resource-publish-final");
  assert.equal(resource?.title, "Resource Publish Final");
  assert.equal(resource?.draft, false);
  assert.equal(resource?.url, "/resources/resource-publish-final");
});

test("published project detail exposes body content for the public detail page", async () => {
  const project = await getProjectDetailBySlug("project-publish-final");

  assert.ok(project);
  assert.match(project?.rawContent ?? "", /Project final body\./);
});

test("published resource detail exposes body content for the public detail page", async () => {
  const resource = await getResourceDetailBySlug("resource-publish-final");

  assert.ok(resource);
  assert.match(resource?.rawContent ?? "", /Resource final body\./);
});
