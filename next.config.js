const withPWA = require("next-pwa");
const runtimeCaching = require("next-pwa/cache");

module.exports = withPWA({
  images: {
    domains: ["cdn.myanimelist.net", "lh3.googleusercontent.com"],
  },
  pwa: {
    dest: "public",
    register: true,
    disable: process.env.NODE_ENV === "development",
    runtimeCaching,
    buildExcludes: [/middleware-manifest\.json$/],
  },
  reactStrictMode: true,
  fallbacks: {
    image: "/favicon.ico",
    video: "/NoInternet.gif",
  },
});
