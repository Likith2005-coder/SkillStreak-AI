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
  // shiki is ESM-only; Next's default server-external list tries to
  // require() it, which Turbopack rejects ("resolves to an EcmaScript
  // module"). Transpiling it into the bundle overrides that default and
  // makes dashboard routes (ChatWidget → shiki) compile under --turbo.
  transpilePackages: ["shiki"],
};

module.exports = nextConfig;
