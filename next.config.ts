import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    'playwright',
    'playwright-extra',
    'puppeteer-extra-plugin-stealth',
    'puppeteer-extra'
  ],
  // Prevent Turbopack from tracing the entire project via config.ts fs operations
  outputFileTracingExcludes: {
    '*': ['./lib/ranking/config.ts']
  }
};

export default nextConfig;
