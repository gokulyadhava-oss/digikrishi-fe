import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), "");
    const apiUrl = env.VITE_APP_URL ?? env.VITE_API_URL ?? "http://127.0.0.1:3001";
    return {
        plugins: [tailwindcss(), react()],
        resolve: {
            alias: {
                "@": path.resolve(__dirname, "./src"),
            },
        },
        server: {
            port: 5173,
            proxy: {
                "/api": {
                    target: apiUrl,
                    changeOrigin: true,
                },
            },
        },
    };
});
