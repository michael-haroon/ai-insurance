/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // allow pdf-parse and mammoth to be pulled into server code
    serverComponentsExternalPackages: [
      "pdf-parse",
      "mammoth"
    ],
  },

};


module.exports = nextConfig;