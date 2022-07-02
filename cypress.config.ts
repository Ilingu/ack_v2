import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    video: false,
    defaultCommandTimeout: 10000,
    baseUrl: "http://localhost:3000",
  },
});
