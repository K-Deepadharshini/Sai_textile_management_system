import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173, // frontend runs here
    proxy: {
      "/api": {
        target: "http://localhost:5000", // backend runs here
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
