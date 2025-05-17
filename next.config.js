/** @type {import('next').NextConfig} */
const nextConfig = {
  // env should be at the top level, not inside experimental
  env: {
    HUGGINGFACE_API_KEY: process.env.HUGGINGFACE_API_KEY
  },
  experimental: {
    reactStrictMode: true,
    // allow pdf-parse and mammoth to be pulled into server code
    serverComponentsExternalPackages: [
      "pdf-parse",
      "mammoth"
    ],
  },
};

module.exports = nextConfig;