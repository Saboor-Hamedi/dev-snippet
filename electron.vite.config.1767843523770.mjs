// electron.vite.config.mjs
import { resolve } from "path";
import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";
var electron_vite_config_default = defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        // Letting externalizeDepsPlugin handle it exclusively to avoid property-access crashes
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    resolve: {
      alias: {
        "@renderer": resolve("src/renderer/src")
      }
    },
    plugins: [
      react(),
      visualizer({
        open: true,
        filename: "stats.html",
        gzipSize: true,
        brotliSize: true
      })
    ],
    css: {
      postcss: "./postcss.config.js"
    },
    build: {
      minify: "esbuild",
      rollupOptions: {
        output: {
          manualChunks: {
            "react-vendor": ["react", "react-dom"],
            "codemirror-vendor": ["@uiw/react-codemirror", "@codemirror/state", "@codemirror/view"],
            "ui-vendor": ["lucide-react"]
          }
        }
      },
      chunkSizeWarningLimit: 1e3
    }
  },
  test: {
    environment: "happy-dom",
    setupFiles: ["./src/test/setup.js"]
  }
});
export {
  electron_vite_config_default as default
};
