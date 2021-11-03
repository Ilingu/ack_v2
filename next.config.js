const withPWA = require("next-pwa");

module.exports = withPWA({
  target: "serverless",
  pwa: {
    dest: "public",
    register: true,
    skipWaiting: true,
    // disable: process.env.NODE_ENV === "development",
  },
  fallbacks: {
    image: "/favicon.ico",
    // document: "/pages/...",
  },
});
