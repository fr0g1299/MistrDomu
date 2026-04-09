// import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import plugin from "@vitejs/plugin-react";
import { env } from "process";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// Cíl pro proxy
const target = env.ASPNETCORE_URLS
  ? env.ASPNETCORE_URLS
      .split(";")
      .find((url) => url.startsWith("http://")) ?? env.ASPNETCORE_URLS.split(";")[0]
  : "http://localhost:5095";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [plugin(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    // alias: {
    //   "@": fileURLToPath(new URL("./src", import.meta.url)),
    // },
  },
  server: {
    proxy: {
      "^/api": {
        target,
        secure: false,
      },
      "^/weatherforecast": {
        target,
        secure: false,
      },
    },
    port: 5173,
  },
});
