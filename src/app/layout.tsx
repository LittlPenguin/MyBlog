import type { Metadata } from "next";
import { Epilogue, Plus_Jakarta_Sans, Space_Grotesk } from "next/font/google";
import { AppFrame } from "@/components/site/frame";
import { createThemeInitScript } from "@/lib/theme";
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

const siteDescription =
  "WuLong 的个人博客，用于记录学习、前端实践、项目整理与技术资源。";

export const metadata: Metadata = {
  metadataBase: new URL("https://example.com"),
  title: {
    default: "WuLong | Personal Blog",
    template: "%s | WuLong",
  },
  description: siteDescription,
  openGraph: {
    title: "WuLong | Personal Blog",
    description: siteDescription,
    type: "website",
    locale: "zh_CN",
    siteName: "WuLong",
  },
  twitter: {
    card: "summary_large_image",
    title: "WuLong | Personal Blog",
    description: siteDescription,
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
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        <script
          id="theme-init"
          dangerouslySetInnerHTML={{
            __html: createThemeInitScript(),
          }}
        />
      </head>
      <body className="min-h-screen text-foreground">
        <AppFrame>{children}</AppFrame>
      </body>
    </html>
  );
}
