import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	resolve: {
		alias: [
			{
				find: '#',
				replacement: path.resolve('src'),
			},
		],
	},
	oxc: {
		target: 'es2022',
	},
	test: {
		environment: 'node',
		include: ['./test/**/*.test.ts'],
		reporters: 'dot',
		typecheck: {
			enabled: true,
		},
		coverage: {
			reporter: ['html'],
			reportsDirectory: './coverage',
		},
	},
});
