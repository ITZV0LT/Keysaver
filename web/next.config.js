/** @type {import('next').NextConfig} */
const nextConfig = {
  // sharp uses native binaries — exclude from webpack bundling so Node.js loads it natively
  serverExternalPackages: ['sharp'],
};

module.exports = nextConfig;
