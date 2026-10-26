import { defineConfig } from "vitepress";
export default defineConfig({
  title: "Lipat",
  srcExclude: ["public/**"],
  description: "Agent-friendly slide creation and independent PPTX parsing",
  base: process.env.LIPAT_DOCS_BASE ?? "/",
  vite: { build: { target: "esnext" } },
  markdown: { theme: { light: "github-light", dark: "github-dark" } },
  themeConfig: {
    nav: [
      { text: "Create", link: "/creation" },
      { text: "Architecture", link: "/architecture" },
      { text: "Agents", link: "/agents" },
    ],
    sidebar: [
      {
        text: "Lipat",
        items: [
          { text: "Introduction", link: "/" },
          { text: "Create slides", link: "/creation" },
          { text: "30 presentation templates", link: "/templates" },
          { text: "Charts", link: "/charts" },
          { text: "Architecture", link: "/architecture" },
          { text: "API", link: "/api" },
          { text: "Playground", link: "/playground" },
          { text: "Agent authoring", link: "/agents" },
          { text: "React", link: "/react" },
          { text: "Built-in editor", link: "/editor" },
          { text: "React Native", link: "/react-native" },
          { text: "Animations", link: "/animations" },
          { text: "Images and URLs", link: "/images" },
          { text: "PPTX import/export", link: "/pptx" },
          { text: "WASM and native", link: "/wasm" },
          { text: "Resource limits", link: "/limits" },
          { text: "Layout diagnostics", link: "/diagnostics" },
          { text: "Support & parity", link: "/support" },
          { text: "Verification", link: "/verification" },
        ],
      },
    ],
    search: { provider: "local" },
  },
});
