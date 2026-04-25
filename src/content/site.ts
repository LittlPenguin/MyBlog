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

export type TimelineItem = {
  year: string;
  title: string;
  description: string;
};

export const siteConfig = {
  name: "WuLong",
  role: "学生 / 开发者",
  description: "记录学习、前端实践、项目整理与日常思考的个人博客。",
  heroGreeting: "午后好，WuLong!",
  heroTitle: "把学习记录、项目实践与日常思考整理在自己的博客里。",
  heroLead:
    "这里用于沉淀学习笔记、开发过程、项目复盘和有价值的资源，让内容可以被持续整理和更新。",
  location: "Guangdong",
  email: "xiaowulonely23@gmail.com",
  now: "正在持续整理前端学习记录、个人项目和技术资源，让这个博客成为稳定更新的学习空间。",
  avatar: "/visuals/avatar-wulong.jpg",
  gallery: [
    "/visuals/studio-grid-01.svg",
    "/visuals/studio-grid-02.svg",
    "/visuals/studio-grid-03.svg",
  ],
  footerNote: "Built as a personal space for learning, building, and writing.",
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
  { label: "GitHub", href: "https://github.com/LittlPenguin" },
  { label: "掘金", href: "https://juejin.cn/user/327030668540793" },
  { label: "邮箱", href: "mailto:xiaowulonely23@gmail.com" },
];

export const timeline: TimelineItem[] = [
  {
    year: "2026",
    title: "持续整理个人博客与学习内容",
    description: "把文章、项目和资源放进统一的站点结构里，方便长期记录和复盘。",
  },
  {
    year: "2025",
    title: "积累前端学习与项目实践",
    description: "围绕 React、Next.js 和页面实现持续练习，把阶段性收获整理成可回看的内容。",
  },
  {
    year: "2024",
    title: "开始记录学习过程",
    description: "把技术笔记、资源链接和项目想法逐步沉淀下来，形成自己的知识索引。",
  },
];

export const aboutHighlights = [
  "关注前端开发、页面交互和内容型网站的长期维护。",
  "喜欢把学习笔记、项目实践和资源整理放在同一个清晰的工作流里。",
  "希望个人博客既能记录技术成长，也能留下真实的思考和复盘。",
];

export const aboutSkills = [
  "学习记录",
  "前端开发",
  "React / Next.js",
  "内容写作",
  "项目实践",
];

export const homeSignals = [
  "正在持续整理前端学习笔记和个人项目记录。",
  "用 MDX 管理文章、项目和资源收藏，让内容更容易维护。",
  "把这个站点作为学习、实践和复盘的长期空间。",
];
