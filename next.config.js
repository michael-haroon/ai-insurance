/** @type {import('next').NextConfig} */
const nextConfig = {
  // env should be at the top level, not inside experimental
  env: {
    HUGGINGFACE_API_KEY: process.env.HUGGINGFACE_API_KEY
  },
  reactStrictMode: true,
  experimental: {
    // allow pdf-parse and mammoth to be pulled into server code
    serverComponentsExternalPackages: [
      "pdf-parse",
      "mammoth"
    ],
    workerThreads: true,
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      child_process: false
    };
    return config;
  }
};

module.exports = nextConfig;