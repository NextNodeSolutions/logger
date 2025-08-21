import { defineConfig } from 'vitest/config'
import { resolve } from 'node:path'

export default defineConfig({
	resolve: {
		alias: {
			'@': resolve(__dirname, './src'),
		},
	},
	test: {
		globals: true,
		environment: 'node',
		include: ['src/**/*.{test,spec}.ts'],
		exclude: ['src/**/*test-setup.ts'],
		// Global test setup for consistent mocking
		setupFiles: ['src/__tests__/test-setup.ts'],
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html'],
			exclude: [
				'node_modules/**',
				'dist/**',
				'**/*.d.ts',
				'**/*.test.ts',
				'**/*.spec.ts',
				'**/*.config.ts',
				'**/types.ts',
				'**/test-setup.ts',
			],
		},
	},
})
