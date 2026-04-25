import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { homeBoard } from "../content/home-board.ts";
import { aboutSkills, siteConfig, socialLinks } from "../content/site.ts";

test("site profile config uses WuLong public identity and links", () => {
  assert.equal(siteConfig.name, "WuLong");
  assert.equal(siteConfig.role, "学生 / 开发者");
  assert.equal(siteConfig.location, "Guangdong");
  assert.equal(siteConfig.email, "xiaowulonely23@gmail.com");
  assert.equal(siteConfig.avatar, "/visuals/avatar-wulong.jpg");

  assert.deepEqual(socialLinks, [
    { label: "GitHub", href: "https://github.com/LittlPenguin" },
    { label: "掘金", href: "https://juejin.cn/user/327030668540793" },
    { label: "邮箱", href: "mailto:xiaowulonely23@gmail.com" },
  ]);
  assert.equal(socialLinks.some((item) => item.label === "RSS"), false);

  assert.deepEqual(aboutSkills, ["学习记录", "前端开发", "React / Next.js", "内容写作", "项目实践"]);
});

test("home and page chrome use WuLong identity", () => {
  const layoutSource = readFileSync(join(process.cwd(), "src/app/layout.tsx"), "utf8");
  const aboutSource = readFileSync(join(process.cwd(), "src/app/about/page.tsx"), "utf8");
  const frameSource = readFileSync(join(process.cwd(), "src/components/site/frame.tsx"), "utf8");

  assert.equal(homeBoard.greeting, "午后好，WuLong!");
  assert.equal(homeBoard.about.role, "学生 / 开发者");
  assert.match(layoutSource, /WuLong \| Personal Blog/);
  assert.match(layoutSource, /template:\s*"%s \| WuLong"/);
  assert.match(layoutSource, /siteName:\s*"WuLong"/);
  assert.match(aboutSource, /WuLong avatar/);
  assert.match(aboutSource, /学生 \/ 开发者/);
  assert.match(aboutSource, /学生/);
  assert.match(aboutSource, /开发者/);
  assert.match(aboutSource, /博客作者/);
  assert.match(frameSource, /shell-mobile-nav-brand-mark">WL</);
});
