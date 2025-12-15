---
'@nextnode/logger': patch
---

Migrate to tsup bundler for 71% bundle size reduction

- Replace tsc + tsc-alias with tsup (esbuild-based bundler)
- Add `sideEffects: false` for optimal tree-shaking by consumers
- Minify production output (39KB -> 11KB JavaScript)
- Exclude source maps from npm publish to reduce package size
- Add `pnpm size` command for bundle size tracking
