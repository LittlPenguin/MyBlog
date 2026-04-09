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
