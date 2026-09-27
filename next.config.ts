import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    outputFileTracingIncludes: {
      '/api/**/*': ['./data/**/*'],
    },
  },
};

export default nextConfig;
