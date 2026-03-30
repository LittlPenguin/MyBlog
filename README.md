# MyBlog

一个基于 Next.js 16、React 19 与 Tailwind CSS 4 构建的现代博客原型站点，当前版本聚焦于视觉叙事、内容展示和带动画的页面切换体验。

## Tech Stack

- Next.js 16
- React 19
- Tailwind CSS 4
- Framer Motion
- MDX content posts

## Scripts

```bash
npm run dev
npm run lint
npm run typecheck
npm run build
```

## Current Status

- 已完成第一版页面实现与基础路由动画。
- `npm run lint` 与 `npm run typecheck` 通过。
- `npm run build` 在当前本地环境下曾受到 `.next/trace` 文件锁影响，需要在释放占用后再次验证。

## Notes

- 设计参考素材与废案目录未纳入版本库。
- 下一阶段将继续针对 Stitch 设计稿做 1:1 还原，并强化无感路由切换与共享元素过渡。
