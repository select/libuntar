import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
	build: {
		lib: {
			entry: {
				libuntar: resolve(__dirname, 'libuntar.ts'),
				untgz: resolve(__dirname, 'untgz.ts'),
			},
			formats: ['es', 'cjs'],
			fileName: (format, entryName) => {
				const ext = format === 'es' ? 'js' : 'cjs';
				return `${entryName}.${ext}`;
			},
		},
		rollupOptions: {
			external: [],
			output: {
				exports: 'named',
			},
		},
		sourcemap: true,
		target: 'es2022',
		minify: 'esbuild',
	},
});
