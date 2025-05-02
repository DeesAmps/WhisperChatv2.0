// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Remove `domains` entirely...

    // And add a remotePattern for chart.googleapis.com:
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'chart.googleapis.com',
        port: '',        // no port
        pathname: '/chart', // match the /chart path
      },
    ]
  }
};

module.exports = nextConfig;