import { defineConfig } from "umi";

export default defineConfig({
  routes: [
    { path: "/", component: "index" },
    { path: "/docs", component: "docs" },
  ],
  npmClient: "npm",
  jsMinifier: "esbuild",
  jsMinifierOptions: {
    target: "es2020",
  },
});
