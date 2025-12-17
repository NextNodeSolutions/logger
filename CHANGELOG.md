# @nextnode/logger

## 0.3.4

### Patch Changes

- [#26](https://github.com/NextNodeSolutions/logger/pull/26) [`c1a9719`](https://github.com/NextNodeSolutions/logger/commit/c1a9719cf45446a6fd9c0379251c94827338a9bb) Thanks [@walid-mos](https://github.com/walid-mos)! - Add main and types fields for bundlephobia compatibility

    Bundlephobia (and some legacy tools) require the `main` and `types` fields at the root level of package.json to detect entry points. The `exports` field alone is not sufficient for these older tools.

    This change adds:
    - `main`: Points to the ESM entry point for legacy tool compatibility
    - `types`: Points to the TypeScript declarations for tools that don't read `exports`

    No functional change for modern consumers who use the `exports` field.

## 0.3.3

### Patch Changes

- [#24](https://github.com/NextNodeSolutions/logger/pull/24) [`38c7163`](https://github.com/NextNodeSolutions/logger/commit/38c7163b6dad6f698e2eaf4c8e55982da8938884) Thanks [@walid-mos](https://github.com/walid-mos)! - Migrate to tsup bundler for 71% bundle size reduction
    - Replace tsc + tsc-alias with tsup (esbuild-based bundler)
    - Add `sideEffects: false` for optimal tree-shaking by consumers
    - Minify production output (39KB -> 11KB JavaScript)
    - Exclude source maps from npm publish to reduce package size
    - Add `pnpm size` command for bundle size tracking

## 0.3.2

### Patch Changes

- [#20](https://github.com/NextNodeSolutions/logger/pull/20) [`ef01b4b`](https://github.com/NextNodeSolutions/logger/commit/ef01b4b1792852b7bab6d7b47b3a781194ac5cb0) Thanks [@walid-mos](https://github.com/walid-mos)! - DRY code cleanup and improved type safety
    - Extract shared utilities to reduce code duplication across formatters
    - Add `formatTimeForDisplay` and `formatLocationForDisplay` shared utilities
    - Centralize `extractScope` function for consistent scope handling
    - Remove unnecessary type assertions in test utilities

- [#20](https://github.com/NextNodeSolutions/logger/pull/20) [`ef01b4b`](https://github.com/NextNodeSolutions/logger/commit/ef01b4b1792852b7bab6d7b47b3a781194ac5cb0) Thanks [@walid-mos](https://github.com/walid-mos)! - chore: migrate development tooling to @nextnode/standards
    - Replace ESLint with Biome for linting
    - Use Prettier config from @nextnode/standards
    - Simplify configuration files by extending @nextnode/standards

## 0.3.1

### Patch Changes

- [#18](https://github.com/NextNodeSolutions/logger/pull/18) [`3a9b0f0`](https://github.com/NextNodeSolutions/logger/commit/3a9b0f091bb55dd34f6b8b9eb21497af25d6b24a) Thanks [@walid-mos](https://github.com/walid-mos)! - DRY code cleanup and improved type safety
    - Extract shared utilities to reduce code duplication across formatters
    - Add `formatTimeForDisplay` and `formatLocationForDisplay` shared utilities
    - Centralize `extractScope` function for consistent scope handling
    - Remove unnecessary type assertions in test utilities

## 0.3.0

### Minor Changes

- [#13](https://github.com/NextNodeSolutions/logger/pull/13) [`53137ad`](https://github.com/NextNodeSolutions/logger/commit/53137ad7992fcc86dc5472a8141663dba68b6748) Thanks [@walid-mos](https://github.com/walid-mos)! - ## World-Class Logger Refactor (v0.3)

    ### Breaking Changes
    - Removed barrel file (`index.ts`) - use direct imports
    - New module structure with package.json exports map
    - Moved `location.ts` from `core/` to `utils/`

    ### New Features
    - **Log Level Filtering**: `minLevel` config to filter logs below threshold
    - **Debug Level**: Added `debug` log level (lowest priority)
    - **Silent Mode**: `silent: true` config for tests
    - **Browser Formatting**: CSS styling for DevTools instead of ANSI codes
    - **Pluggable Transports**: Transport interface for custom log destinations
    - **HTTP Transport**: Built-in HTTP transport with batching and retry
    - **Testing Utilities**: `createSpyLogger`, `createNoopLogger`, `createMockLogger`

    ### Import Changes

    ```typescript
    // Main logger (unchanged)
    import { logger, createLogger } from '@nextnode/logger'

    // Testing utilities (new)
    import { createSpyLogger } from '@nextnode/logger/testing'

    // HTTP transport (new)
    import { HttpTransport } from '@nextnode/logger/transports/http'
    ```

## 0.2.4

### Patch Changes

- [#10](https://github.com/NextNodeSolutions/logger/pull/10) [`8cf2cec`](https://github.com/NextNodeSolutions/logger/commit/8cf2cec26c296f5755796a0f8df1c70e40eb0999) Thanks [@walid-mos](https://github.com/walid-mos)! - Update CI/CD workflows to use latest NextNodeSolutions/github-actions
    - Modernized test.yml to use shared quality-checks workflow with comprehensive lint, typecheck, tests, build and coverage checks
    - Replaced release.yml with version.yml using shared version-management workflow for better separation of concerns
    - Added auto-publish.yml for automated publishing after version merges with provenance attestation
    - Added manual-publish.yml recovery workflow with dry-run option
    - Updated to Node.js 22 and maintained pnpm 10.11.0 across all workflows
    - All workflows now leverage centralized shared actions for consistency and maintainability

## 0.2.3

### Patch Changes

- [#8](https://github.com/NextNodeSolutions/logger/pull/8) [`a71b105`](https://github.com/NextNodeSolutions/logger/commit/a71b105237215b8d3032e3dacd5150f74f08a223) Thanks [@walid-mos](https://github.com/walid-mos)! - Fixed browser compatibility issues with TypeScript strict mode by replacing globalThis usage with direct global access (window, document, crypto, importScripts). Updated environment detection to use proper typeof checks and added DOM/WebWorker library types to TypeScript configuration.

## 0.2.2

### Patch Changes

- [#6](https://github.com/NextNodeSolutions/logger/pull/6) [`0823977`](https://github.com/NextNodeSolutions/logger/commit/08239770866614d267a37015cba3691e17336253) Thanks [@walid-mos](https://github.com/walid-mos)! - Fix TypeScript path resolution in build output
    - Add tsc-alias dependency to resolve @/ paths during build process
    - Update build script to run tsc-alias after TypeScript compilation
    - Fix module resolution issue where @/ paths in tests weren't resolved properly
    - Ensure built package can be imported correctly from external projects
    - All existing functionality preserved with improved build reliability

## 0.2.1

### Patch Changes

- [#4](https://github.com/NextNodeSolutions/logger/pull/4) [`cbc752f`](https://github.com/NextNodeSolutions/logger/commit/cbc752feaee53a7fd92629c86f197a08c816153b) Thanks [@walid-mos](https://github.com/walid-mos)! - fix: add files field to package.json to ensure dist folder is published to npm

    Previously, the package was publishing source TypeScript files instead of the built JavaScript files in the dist directory. This caused issues when consuming the package as the TypeScript files were present in node_modules instead of the compiled JavaScript.

## 0.2.0

### Minor Changes

- [#1](https://github.com/NextNodeSolutions/logger/pull/1) [`a02f95e`](https://github.com/NextNodeSolutions/logger/commit/a02f95e9206719c9fab44e888e5b1bf37784eaf4) Thanks [@walid-mos](https://github.com/walid-mos)! - feat: implement comprehensive NextNode logger with structured logging capabilities
    - Add core logging functionality with log levels (debug, info, warn, error)
    - Implement location-aware logging with file path and line number tracking
    - Add structured message formatting with consistent timestamp and metadata
    - Include cryptographic utilities for log integrity (hashing, signature verification)
    - Add serialization utilities for complex data types
    - Reorganize project structure with dedicated core, utils, and types modules
    - Remove CommonJS support, ES6 modules only
    - Modernize test suite with Vitest best practices
