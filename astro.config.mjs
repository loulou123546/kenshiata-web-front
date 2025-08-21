// @ts-check
import { defineConfig } from "astro/config";

import svelte from "@astrojs/svelte";
import tsconfigPaths from "vite-tsconfig-paths";

import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
	integrations: [svelte()],

	vite: {
		plugins: [tailwindcss(), tsconfigPaths()],
	},
});
