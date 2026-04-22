import assert from "node:assert/strict";
import test from "node:test";
import * as detailShellLib from "./detail-shell.ts";
import { renderDetailHeroActionAttrs } from "./detail-shell.ts";

test("detail shell library exposes public CTA guard helper", () => {
  assert.equal(typeof detailShellLib.isRenderableExternalHref, "function");
  assert.equal(detailShellLib.isRenderableExternalHref("https://example.com/project"), true);
  assert.equal(detailShellLib.isRenderableExternalHref("https://github.com/"), false);
  assert.equal(detailShellLib.isRenderableExternalHref("/resources/framer-motion"), false);
});

test("renderDetailHeroActionAttrs filters non-renderable public CTAs", () => {
  assert.deepEqual(
    renderDetailHeroActionAttrs([
      { label: "Website", href: "https://example.com", variant: "primary" },
      { label: "GitHub", href: "https://github.com/", variant: "secondary" },
      { label: "Docs", href: "/resources/framer-motion", variant: "secondary" },
    ]),
    [
      {
        label: "Website",
        href: "https://example.com",
        variant: "primary",
        target: "_blank",
        rel: "noreferrer",
      },
    ],
  );
});
