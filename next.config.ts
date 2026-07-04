import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  typedRoutes: false,
  devIndicators: false
};

export default nextConfig;
