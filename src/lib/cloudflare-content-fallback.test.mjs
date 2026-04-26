import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { readStaticContentCollection } from "./static-content.ts";
import { isCloudflareRuntime } from "./runtime-environment.ts";

test("static content registry exposes posts for runtime environments without durable fs", async () => {
  const items = await readStaticContentCollection(
    path.join(process.cwd(), "src", "content", "posts"),
  );

  assert.ok(items.length > 0);
  assert.equal(items.some((item) => item.meta.slug === "building-a-calm-interface"), true);
  assert.match(items[0].content, /\S/);
});

test("static content registry exposes projects and resources for Cloudflare runtime reads", async () => {
  const [projects, resources] = await Promise.all([
    readStaticContentCollection(path.join(process.cwd(), "src", "content", "projects")),
    readStaticContentCollection(path.join(process.cwd(), "src", "content", "resources")),
  ]);

  assert.ok(projects.length > 0);
  assert.ok(resources.length > 0);
  assert.equal(projects.some((item) => item.meta.slug === "nebula-core"), true);
  assert.equal(resources.some((item) => item.meta.slug === "framer-motion"), true);
});

test("project Cloudflare runtime marker puts file-backed writes in read-only mode", () => {
  const previous = process.env.MYBLOG_FILE_STORAGE;
  process.env.MYBLOG_FILE_STORAGE = "readonly";

  try {
    assert.equal(isCloudflareRuntime(), true);
  } finally {
    if (previous === undefined) {
      delete process.env.MYBLOG_FILE_STORAGE;
    } else {
      process.env.MYBLOG_FILE_STORAGE = previous;
    }
  }
});
