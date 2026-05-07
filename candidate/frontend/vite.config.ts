import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import type { Plugin } from 'vite';

function themeHotReload(): Plugin {
	return {
		name: 'theme-hot-reload',
		configureServer(server) {
			server.watcher.add('lmodulo-theme.css');
			server.watcher.on('change', (file) => {
				if (file.endsWith('lmodulo-theme.css')) {
					server.ws.send({ type: 'full-reload' });
				}
			});
		}
	};
}

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit(),
		themeHotReload()
	],
	server: {
		proxy: {
			'/notifications/ws': {
				target:      'ws://api:4000',
				ws:          true,
				changeOrigin: true,
			},
		},
		watch: {
			usePolling: true,
			interval: 300
		}
	}
});
