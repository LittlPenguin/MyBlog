import type { Metadata } from "next";
import { Epilogue, Plus_Jakarta_Sans, Space_Grotesk } from "next/font/google";
import { AppFrame } from "@/components/site/frame";
import "./globals.css";

const heading = Epilogue({
  variable: "--font-heading",
  subsets: ["latin"],
  display: "swap",
});

const body = Plus_Jakarta_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

const label = Space_Grotesk({
  variable: "--font-label",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://example.com"),
  title: {
    default: "YYsuni | Sunset Glass Blog",
    template: "%s | YYsuni",
  },
  description:
    "一个用 React、Next.js 与 Tailwind 构建的现代个人博客，聚合写作、项目、资源与温和的共享元素路由过渡。",
  openGraph: {
    title: "YYsuni | Sunset Glass Blog",
    description:
      "一个用 React、Next.js 与 Tailwind 构建的现代个人博客，聚合写作、项目、资源与温和的共享元素路由过渡。",
    type: "website",
    locale: "zh_CN",
    siteName: "YYsuni",
  },
  twitter: {
    card: "summary_large_image",
    title: "YYsuni | Sunset Glass Blog",
    description:
      "一个用 React、Next.js 与 Tailwind 构建的现代个人博客，聚合写作、项目、资源与温和的共享元素路由过渡。",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${heading.variable} ${body.variable} ${label.variable} min-h-full antialiased`}
    >
      <body className="min-h-screen text-foreground">
        <AppFrame>{children}</AppFrame>
      </body>
    </html>
  );
}
