type CalendarDay = {
  day: number;
  muted?: boolean;
  active?: boolean;
};

export const homeBoard = {
  greeting: "下午好，YYsuni!",
  lead: "Good Afternoon. 愿温暖的夕阳光芒带给你创作的灵感。",
  archiveLabel: "查看归档 View Archive",
  projectsLabel: "我的项目 Projects",
  currentTimeLabel: "Current Time",
  currentTimeValue: "16:45",
  currentTimeSeconds: ":28",
  currentTimeZone: "Beijing, China · UTC+8",
  calendarLabel: "November 2023",
  today: 9,
  footerNote: "Designed for high-end personal editorial experiences",
  footerVersion: "V1.0 Proposal Board",
  about: {
    title: "关于 About",
    role: "UI Designer & Writer",
    description: "热爱摄影、猫与代码。",
  },
  projects: {
    title: "项目 Projects",
    name: "SunsetOS Interface",
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
  heroImage:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuBSfheOddN_In4QknVgw-A4u2g7JQ39oyK7YvzyRqj_Qvh_Eh2UxZMLShsecwO7EfAI7wpi-VyWrHYQfGEHVvQi4nL08IQfoCWvLM2tDZ8zYqdMCwmEAjaq9pwntuOJHiuJtkQFJSCfauVxK8z0pqRn52xYXuNEDWTux2ybRUJZG4EypvG_YcJLpJLZr4p1eYJXKBBAy1gub4OXdTT4OJ9OMwC-2U16z5GYmD6UqJsQZ7uiOBIwV2qqL56wGQgd0fpNVg-S-SwwmzUK",
  floatingImage:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuDu71PmEa1qSqnAguRXAW4oTRZf8O2b6MClPN4r7ENSEvGlYoBIiLzCm4iS5AUoOf0-k0Q69VFZId454kRx9yvTLdnB_HNZtcgvd8yVDg_YyyuLZSUDU_rz3a6wLO0uOYpjLoEC-CI6zOyG_QgaMOCIWTg3W27v0qjdbPWwcHNOejQsA20qjKdWt9cKHK_9-KdJmRCkzTtdX5OWulTBH3YrIokIMWvwEtOwwjV-hgR4UP0vOo2fPNO5TcGvIuzpIKYAVtAWpUoIsS-l",
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
