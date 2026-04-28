import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import type { Plugin } from 'vite';

// Tailwind v4 consumes @import directives internally before Vite can register
// lmodulo-theme.css in its module graph. This plugin explicitly watches the
// file and forces a full reload whenever it changes.
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
			// Windows bind mounts don't emit inotify events into the container.
			// Polling ensures file changes are detected reliably.
			usePolling: true,
			interval: 300
		}
	}
});
