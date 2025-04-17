import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const target = import.meta.env.VITE_API_URL+"/api"; //  backend server URL


export default defineConfig({
	plugins: [react()],
	server: {
		proxy: {
			"/api": {
				target,
				changeOrigin: true,
				secure: true,
				rewrite: (path) => path.replace(/^\/api/, ""),
			},
		},
	},
});
