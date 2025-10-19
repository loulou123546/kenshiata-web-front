// @ts-check

import svelte from "@astrojs/svelte";
import faroUploader from "@grafana/faro-rollup-plugin";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import tsconfigPaths from "vite-tsconfig-paths";

// https://astro.build/config
export default defineConfig({
	integrations: [svelte()],

	vite: {
		plugins: [
			faroUploader({
				appName: "Kenshiata front web",
				endpoint: "https://faro-api-prod-eu-central-0.grafana.net/faro/api/v1",
				appId: import.meta.env.FARO_APP_ID,
				stackId: import.meta.env.FARO_STACK_ID,
				// instructions on how to obtain your API key are in the documentation
				// https://grafana.com/docs/grafana-cloud/monitor-applications/frontend-observability/sourcemap-upload-plugins/#obtain-an-api-key
				apiKey: import.meta.env.FARO_API_KEY,
				gzipContents: true,
			}),
			tailwindcss(),
			tsconfigPaths(),
		],
	},
});
