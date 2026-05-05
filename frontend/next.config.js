/** @type {import('next').NextConfig} */
const nextConfig = {
  // Strict mode double-invokes effects in dev which inflates the dev error
  // counter and makes some framer-motion/RHF interactions noisy. Production
  // is unaffected (strict mode is a dev-only check).
  reactStrictMode: false,
  poweredByHeader: false,
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
};

module.exports = nextConfig;
