/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  rewrites() {
    return [
      { source: '/ara%C3%B1ita', destination: '/aranita' },
      { source: '/arañita', destination: '/aranita' },
    ];
  },
};
module.exports = nextConfig;
