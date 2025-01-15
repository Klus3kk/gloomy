import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true, // Ensures trailing slashes for directories
  async redirects() {
    return [
      {
        source: "/downloads",
        destination: "/downloads.html",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
