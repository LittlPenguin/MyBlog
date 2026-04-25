import assert from "node:assert/strict";
import test from "node:test";
import * as detailShellLib from "./detail-shell.ts";
import {
  buildDetailMetaChips,
  buildDetailAttachmentItems,
  normalizeDetailAttachments,
  resolveDetailSummary,
  renderDetailHeroActionAttrs,
} from "./detail-shell.ts";

test("buildDetailMetaChips filters empty values and preserves order", () => {
  assert.deepEqual(
    buildDetailMetaChips(["2026", "", null, "Design Systems", undefined, "5 min read"]),
    ["2026", "Design Systems", "5 min read"],
  );
});

test("buildDetailMetaChips removes duplicate labels while preserving first occurrence", () => {
  assert.deepEqual(
    buildDetailMetaChips(["2026", "Next.js", "TypeScript", "Next.js", "  TypeScript  ", "Charts"]),
    ["2026", "Next.js", "TypeScript", "Charts"],
  );
});

test("renderDetailHeroActionAttrs sets new-tab attrs for all external hero actions", () => {
  assert.deepEqual(
    renderDetailHeroActionAttrs([
      { label: "Website", href: "https://example.com", variant: "primary" },
      { label: "GitHub", href: "https://github.com/example/repo", variant: "secondary" },
    ]),
    [
      {
        label: "Website",
        href: "https://example.com",
        variant: "primary",
        target: "_blank",
        rel: "noreferrer",
      },
      {
        label: "GitHub",
        href: "https://github.com/example/repo",
        variant: "secondary",
        target: "_blank",
        rel: "noreferrer",
      },
    ],
  );
});

test("normalizeDetailAttachments marks only assets with href as linked", () => {
  assert.deepEqual(
    normalizeDetailAttachments([
      { name: "kit.fig", href: "/uploads/resources/kit.fig", meta: "uploads/resources/kit.fig" },
      { name: "notes.pdf", meta: "仅保留元数据引用" },
    ]),
    [
      {
        name: "kit.fig",
        href: "/uploads/resources/kit.fig",
        meta: "uploads/resources/kit.fig",
        isLinked: true,
      },
      {
        name: "notes.pdf",
        meta: "仅保留元数据引用",
        isLinked: false,
      },
    ],
  );
});

test("resolveDetailSummary prefers summary and falls back to description for legacy content", () => {
  assert.equal(resolveDetailSummary("Published summary", "Legacy description"), "Published summary");
  assert.equal(resolveDetailSummary("   ", "Legacy description"), "Legacy description");
  assert.equal(resolveDetailSummary(undefined, "  Legacy description  "), "Legacy description");
  assert.equal(resolveDetailSummary(undefined, undefined), "");
});

test("buildDetailAttachmentItems tolerates missing names and paths while preserving linkability", () => {
  assert.deepEqual(
    buildDetailAttachmentItems(
      ["diagram.png", "notes.pdf"],
      ["/uploads/projects/demo/assets/diagram.png"],
      "仅保留元数据引用",
    ),
    [
      {
        name: "diagram.png",
        href: "/uploads/projects/demo/assets/diagram.png",
        meta: "uploads/projects/demo/assets/diagram.png",
      },
      {
        name: "notes.pdf",
        href: null,
        meta: "仅保留元数据引用",
      },
    ],
  );

  assert.deepEqual(buildDetailAttachmentItems(undefined, undefined, "仅保留元数据引用"), []);
});
