const withPWA = require("next-pwa");

module.exports = withPWA({
  images: {
    domains: ["cdn.myanimelist.net"],
  },
  pwa: {
    dest: "public",
    register: true,
    disable: process.env.NODE_ENV === "development",
  },
  reactStrictMode: true,
  fallbacks: {
    image: "/favicon.ico",
    // document: "/pages/...",
  },
});
