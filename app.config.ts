import { defineConfig } from "@solidjs/start/config";
import unocss from "unocss/vite"

export default defineConfig({
  ssr: false,
  server: {
    esbuild: {
      options: {
        target: "esnext",
      }
    }
  },
  vite: {
    plugins: [
      unocss()
    ],
    build: {
      target: "esnext",
    }
  }
});
