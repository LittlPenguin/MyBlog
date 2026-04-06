export type NavItem = {
  href: string;
  label: string;
  eyebrow: string;
  icon: "home" | "archive" | "projects" | "resources" | "about";
  transitionKey: string;
  match?: string[];
};

export type SocialLink = {
  label: string;
  href: string;
};

export type ProjectItem = {
  slug: string;
  title: string;
  year: string;
  summary: string;
  stack: string[];
  href?: string;
  github?: string;
  docs?: string;
  featured?: boolean;
  icon: "grid" | "spark" | "pen" | "layers";
  accent: "primary" | "secondary" | "tertiary";
};

export type ResourceItem = {
  slug: string;
  title: string;
  url: string;
  category: string;
  description: string;
  tags: string[];
  rating: number;
  featured?: boolean;
  accent: "primary" | "secondary" | "tertiary";
  monogram: string;
};

export type TimelineItem = {
  year: string;
  title: string;
  description: string;
};

export const siteConfig = {
  name: "YYsuni",
  role: "Writer / Designer / Frontend",
  description: "把文章、项目、资源与日常观察整理在同一块暖色玻璃画布上的个人博客。",
  heroGreeting: "午后好，YYsuni!",
  heroTitle: "把写作、项目与灵感收拢在一块会呼吸的玻璃画布里。",
  heroLead:
    "这里不是单纯的作品集，也不是只写技术的博客，而是一个把内容、界面与工程感放在同一套节奏里的个人网站。",
  location: "Shanghai / Remote",
  email: "hello@yysuni.me",
  now: "最近在重构站点的统一壳体、共享元素路由过渡，以及一套更接近 Stitch 稿的内容布局。",
  avatar: "/visuals/avatar-orb.svg",
  gallery: [
    "/visuals/studio-grid-01.svg",
    "/visuals/studio-grid-02.svg",
    "/visuals/studio-grid-03.svg",
  ],
  footerNote: "Built as a calm editorial system for writing, making, and collecting.",
} as const;

export const navItems: NavItem[] = [
  {
    href: "/",
    label: "首页",
    eyebrow: "Home",
    icon: "home",
    transitionKey: "nav-home",
    match: ["/"],
  },
  {
    href: "/about",
    label: "关于",
    eyebrow: "About",
    icon: "about",
    transitionKey: "nav-about",
    match: ["/about"],
  },
  {
    href: "/projects",
    label: "项目",
    eyebrow: "Projects",
    icon: "projects",
    transitionKey: "nav-projects",
    match: ["/projects"],
  },
  {
    href: "/resources",
    label: "资源",
    eyebrow: "Resources",
    icon: "resources",
    transitionKey: "nav-resources",
    match: ["/resources"],
  },
  {
    href: "/archive",
    label: "归档",
    eyebrow: "Archive",
    icon: "archive",
    transitionKey: "nav-archive",
    match: ["/archive", "/posts"],
  },
];

export const socialLinks: SocialLink[] = [
  { label: "GitHub", href: "https://github.com/" },
  { label: "掘金", href: "https://juejin.cn/" },
  { label: "邮箱", href: "mailto:hello@yysuni.me" },
  { label: "RSS", href: "/rss.xml" },
];

export const projects: ProjectItem[] = [
  {
    slug: "nebula-core",
    title: "Nebula Core",
    year: "2026",
    summary: "面向内容团队的数据驾驶舱实验，把高密度信息做得更轻、更柔和，也更容易持续阅读。",
    stack: ["Next.js", "TypeScript", "Charts"],
    href: "https://example.com/nebula-core",
    github: "https://github.com/",
    docs: "https://example.com/nebula-core/docs",
    featured: true,
    icon: "grid",
    accent: "primary",
  },
  {
    slug: "aether-ui",
    title: "Aether UI",
    year: "2025",
    summary: "围绕暖色玻璃、编辑感排版与克制动效建立的一套前端设计语言与组件系统。",
    stack: ["React", "Tailwind", "Motion"],
    href: "https://example.com/aether-ui",
    github: "https://github.com/",
    featured: true,
    icon: "spark",
    accent: "tertiary",
  },
  {
    slug: "studio-notes",
    title: "Studio Notes",
    year: "2025",
    summary: "把写作草稿、项目复盘与收藏资源放在同一工作流中的个人知识花园原型。",
    stack: ["MDX", "Search", "Content"],
    href: "https://example.com/studio-notes",
    github: "https://github.com/",
    icon: "pen",
    accent: "secondary",
  },
  {
    slug: "calm-editor",
    title: "Calm Editor",
    year: "2024",
    summary: "为长文写作而做的 Markdown 编辑器概念稿，用更安静的布局与更短的反馈减轻压迫感。",
    stack: ["Editor", "Markdown", "UX"],
    href: "https://example.com/calm-editor",
    github: "https://github.com/",
    docs: "https://example.com/calm-editor/spec",
    icon: "layers",
    accent: "primary",
  },
];

export const resources: ResourceItem[] = [
  {
    slug: "framer-motion",
    title: "Framer Motion",
    url: "https://www.framer.com/motion/",
    category: "动画",
    description: "React 端最顺手的声明式动画方案，适合构建层级感、进入节奏和页面过渡。",
    tags: ["Motion", "React", "Animation"],
    rating: 5,
    featured: true,
    accent: "primary",
    monogram: "FM",
  },
  {
    slug: "lucide",
    title: "Lucide",
    url: "https://lucide.dev/",
    category: "图标",
    description: "风格稳定、线条克制，适合和暖色玻璃界面搭配的图标库。",
    tags: ["Icons", "SVG", "UI"],
    rating: 5,
    featured: true,
    accent: "tertiary",
    monogram: "LU",
  },
  {
    slug: "refero",
    title: "Refero",
    url: "https://refero.design/",
    category: "参考",
    description: "需要研究真实产品页面的结构与流程时，非常高效的案例库。",
    tags: ["Patterns", "Product", "Research"],
    rating: 4,
    featured: true,
    accent: "secondary",
    monogram: "RE",
  },
  {
    slug: "tailwindcss",
    title: "Tailwind CSS",
    url: "https://tailwindcss.com/",
    category: "CSS",
    description: "快速搭建一致视觉系统的基础工具，尤其适合控制页面节奏与比例。",
    tags: ["CSS", "Utility", "Frontend"],
    rating: 5,
    accent: "tertiary",
    monogram: "TW",
  },
  {
    slug: "rauno-notes",
    title: "Rauno Notes",
    url: "https://rauno.me/",
    category: "写作",
    description: "把技术写作、个人审美和产品感结合得非常自然的长期参考对象。",
    tags: ["Writing", "Editorial", "Blog"],
    rating: 5,
    accent: "secondary",
    monogram: "RN",
  },
  {
    slug: "linear-guidelines",
    title: "Linear UI Notes",
    url: "https://linear.app/design",
    category: "参考",
    description: "观察现代产品如何组织信息密度、边距和交互反馈的一组长期样本。",
    tags: ["Product", "Layout", "Systems"],
    rating: 4,
    accent: "primary",
    monogram: "LN",
  },
];

export const timeline: TimelineItem[] = [
  {
    year: "2026",
    title: "把个人博客重构成真正可持续更新的内容系统",
    description: "从单屏展示转向多页面组织，让文章、项目、资源与关于页共享一套稳定的体验语言。",
  },
  {
    year: "2025",
    title: "开始系统整理设计与前端之间的共享语法",
    description: "把动效、排版、组件与文案放进同一个工程语境里处理，而不是各自为战。",
  },
  {
    year: "2024",
    title: "形成长期写作与持续创作的工作流",
    description: "稳定输出界面拆解、项目复盘与资源记录，也逐渐明确自己的视觉偏好。",
  },
];

export const aboutHighlights = [
  "偏爱温暖、克制、带一点 editorial 气质的网页设计。",
  "喜欢把写作、设计和前端实现放进同一个工作流里，一起推到成品。",
  "更关注页面的呼吸感、滚动层级和无感切换，而不是堆很多组件。",
];

export const aboutSkills = [
  "UI / UX Design",
  "React / Next.js",
  "Tailwind CSS",
  "Content Writing",
  "Motion System",
];

export const homeSignals = [
  "正在把 App Router 切换改成更连续的共享元素过渡。",
  "统一 MDX 写作、项目展示与资源收藏的数据结构。",
  "重建首页与内页的关系，让全站在统一壳体下仍保留各自的版式个性。",
];
