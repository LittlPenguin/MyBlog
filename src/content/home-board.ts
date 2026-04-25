type CalendarDay = {
  day: number;
  muted?: boolean;
  active?: boolean;
};

export const homeBoard = {
  greeting: "午后好，WuLong!",
  lead: "Good Afternoon. 记录学习、开发实践和日常思考。",
  archiveLabel: "查看归档 View Archive",
  projectsLabel: "我的项目 Projects",
  currentTimeLabel: "Current Time",
  calendarLabel: "Live Calendar",
  footerNote: "Designed for personal learning notes and project records",
  footerVersion: "V1.0 Proposal Board",
  about: {
    title: "关于 About",
    role: "学生 / 开发者",
    description: "记录学习、项目与代码实践。",
  },
  projects: {
    title: "项目 Projects",
    name: "Personal Blog System",
    progress: "75%",
  },
  resources: {
    title: "资源 Resources",
    tags: ["Typography", "Icons", "Plugins"],
  },
  editor: {
    title: "编辑器 Editor",
    lines: [
      "# Heading 1",
      "> Stay hungry, stay foolish.",
      "Today was a beautiful sunset...",
    ],
  },
  floatingNote: '"Moments captured"',
  calendarDays: [
    { day: 29, muted: true },
    { day: 30, muted: true },
    { day: 1 },
    { day: 2 },
    { day: 3 },
    { day: 4 },
    { day: 5 },
    { day: 6 },
    { day: 7 },
    { day: 8 },
    { day: 9, active: true },
    { day: 10 },
    { day: 11 },
    { day: 12 },
    { day: 13 },
    { day: 14 },
    { day: 15 },
    { day: 16 },
    { day: 17 },
    { day: 18 },
    { day: 19 },
    { day: 20 },
    { day: 21 },
    { day: 22 },
    { day: 23 },
    { day: 24 },
    { day: 25 },
    { day: 26 },
    { day: 27 },
    { day: 28 },
    { day: 29 },
    { day: 30 },
  ] satisfies CalendarDay[],
} as const;
