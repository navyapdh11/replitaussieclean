import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks: {
          // Split heavy vendor libs into separate chunks
          "react-vendor": ["react", "react-dom", "wouter"],
          "ui-vendor": ["framer-motion", "lucide-react", "class-variance-authority"],
          "chart-vendor": ["recharts"],
          "map-vendor": ["leaflet", "react-leaflet"],
          "date-vendor": ["date-fns"],
          "query-vendor": ["@tanstack/react-query"],
        },
      },
    },
  },
});