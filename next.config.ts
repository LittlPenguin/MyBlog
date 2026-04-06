import createMDX from "@next/mdx";
import type { NextConfig } from "next";

const withMDX = createMDX({
  extension: /\.mdx?$/,
});

const nextConfig: NextConfig = {
  cacheComponents: true,
  pageExtensions: ["ts", "tsx", "md", "mdx"],
  reactCompiler: true,
  experimental: {
    instantNavigationDevToolsToggle: true,
  },
};

export default withMDX(nextConfig);
