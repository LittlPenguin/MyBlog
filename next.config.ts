import createMDX from "@next/mdx";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
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

initOpenNextCloudflareForDev();

export default withMDX(nextConfig);
