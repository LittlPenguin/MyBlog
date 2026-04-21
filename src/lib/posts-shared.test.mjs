import assert from "node:assert/strict";
import test from "node:test";
import {
  ALL_POSTS_CATEGORY,
  buildArchiveHref,
  buildPostDetailHref,
  normalizeArchiveFilters,
  normalizeArchiveFiltersWithCategories,
} from "./posts-shared.ts";

test("normalizeArchiveFilters trims query and defaults invalid categories", () => {
  assert.deepEqual(normalizeArchiveFilters({ q: "  中文  ", category: "不存在" }), {
    q: "中文",
    category: ALL_POSTS_CATEGORY,
  });
});

test("normalizeArchiveFiltersWithCategories preserves supported categories", () => {
  assert.deepEqual(
    normalizeArchiveFiltersWithCategories(
      { q: ["  design systems  "], category: ["技术"] },
      [ALL_POSTS_CATEGORY, "技术", "生活"],
    ),
    {
      q: "design systems",
      category: "技术",
    },
  );
});

test("buildArchiveHref serializes archive filters into shareable URLs", () => {
  assert.equal(buildArchiveHref(), "/archive");
  assert.equal(buildArchiveHref({ q: "mdx" }), "/archive?q=mdx");
  assert.equal(buildArchiveHref({ category: "技术" }), "/archive?category=%E6%8A%80%E6%9C%AF");
  assert.equal(
    buildArchiveHref({ q: "中文 标题", category: "技术" }),
    "/archive?q=%E4%B8%AD%E6%96%87+%E6%A0%87%E9%A2%98&category=%E6%8A%80%E6%9C%AF",
  );
});

test("buildPostDetailHref carries archive filters into the post detail URL", () => {
  assert.equal(buildPostDetailHref("hello-world"), "/posts/hello-world");
  assert.equal(
    buildPostDetailHref("测试文章", { q: "中文", category: "技术" }),
    "/posts/%E6%B5%8B%E8%AF%95%E6%96%87%E7%AB%A0?q=%E4%B8%AD%E6%96%87&category=%E6%8A%80%E6%9C%AF",
  );
});
