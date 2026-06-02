import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Phone photos routinely exceed the 1MB default; allow larger uploads.
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
