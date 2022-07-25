const withPWA = require("next-pwa");
const runtimeCaching = require("next-pwa/cache");

/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      "cdn.myanimelist.net", // Anime Poster
      "lh3.googleusercontent.com", // Google
      "avatars.githubusercontent.com", // Github
      "pbs.twimg.com", // Twitter
      "ui-avatars.com", // Avatar Placeholder
    ],
  },
  compiler:
    process.env.NODE_ENV === "production"
      ? {
          reactRemoveProperties: { properties: ["^data-testid$"] },
          removeConsole: { exclude: ["warn", "error"] },
        }
      : undefined,
};

module.exports = withPWA({
  pwa: {
    dest: "public",
    register: true,
    disable: process.env.NODE_ENV === "development",
    runtimeCaching,
    buildExcludes: [/middleware-manifest\.json$/],
  },
  fallbacks: {
    image: "/favicon.ico",
    video: "/NoInternet.gif",
  },
  ...nextConfig,
});
