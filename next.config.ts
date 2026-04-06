import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    AUTH_SECRET: process.env.AUTH_SECRET || "sunstreet-default-secret-change-me-in-production-2024",
  },
};

export default nextConfig;
