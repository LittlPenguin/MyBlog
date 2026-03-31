export const unstable_instant = {
  prefetch: "static",
} as const;

export default function ResourcesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
