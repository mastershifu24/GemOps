import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  transpilePackages: ["@splinetool/react-spline"],
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@splinetool/react-spline": path.resolve(
        process.cwd(),
        "node_modules/@splinetool/react-spline/dist/react-spline.js"
      ),
    };
    return config;
  },
};

export default nextConfig;
