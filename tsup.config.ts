import { defineConfig } from 'tsup'

export default defineConfig({
	entry: {
		logger: 'src/logger.ts',
		testing: 'src/testing/test-utils.ts',
		'transports/http': 'src/transports/http.ts',
	},
	format: ['esm'],
	dts: true,
	minify: true,
	treeshake: true,
	clean: true,
	sourcemap: false,
	target: 'es2023',
	splitting: true,
	external: [],
	outDir: 'dist',
})
