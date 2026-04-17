import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizeRoutePathname,
  safelyDecodeRoutePathname,
  stripRouteSearchAndHash,
} from "./route-path.ts";

test("stripRouteSearchAndHash removes query and hash fragments", () => {
  assert.equal(
    stripRouteSearchAndHash("/resources/%E4%BD%A0%E5%A5%BD%E5%95%8A?category=%E5%85%A8%E9%83%A8#hero"),
    "/resources/%E4%BD%A0%E5%A5%BD%E5%95%8A",
  );
  assert.equal(stripRouteSearchAndHash("/projects/测试项目#cover"), "/projects/测试项目");
});

test("normalizeRoutePathname treats encoded and decoded chinese slugs as the same path", () => {
  assert.equal(
    normalizeRoutePathname("/projects/%E6%B5%8B%E8%AF%95%E9%A1%B9%E7%9B%AE"),
    "/projects/测试项目",
  );
  assert.equal(normalizeRoutePathname("/projects/测试项目"), "/projects/测试项目");
  assert.equal(
    normalizeRoutePathname("/resources/%E4%BD%A0%E5%A5%BD%E5%95%8A?category=%E5%85%A8%E9%83%A8#hero"),
    "/resources/你好啊",
  );
});

test("safelyDecodeRoutePathname falls back to the original value for invalid encodings", () => {
  assert.equal(safelyDecodeRoutePathname("/projects/%E6%ZZ"), "/projects/%E6%ZZ");
  assert.equal(normalizeRoutePathname("/projects/%E6%ZZ?tab=preview"), "/projects/%E6%ZZ");
});
