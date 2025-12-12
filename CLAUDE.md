# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is `@nextnode/logger`, a lightweight, zero-dependency TypeScript logging library for NextNode projects with scope-based organization and environment-aware formatting. The library provides comprehensive logging functionality with structured logging, location tracking, and production-optimized output.

## Development Commands

### Primary Workflow
```bash
pnpm build           # Build library (TypeScript compilation)
pnpm lint            # ESLint with @nextnode/eslint-plugin
pnpm type-check      # TypeScript validation without build
pnpm test            # Run tests with Vitest
pnpm test:coverage   # Run tests with coverage report
pnpm format          # Format code with Biome
```

### Development & Testing
```bash
pnpm test:watch      # Watch mode for tests during development
pnpm test:ui         # Interactive test UI
pnpm clean           # Remove dist directory
```

### Publishing Workflow
```bash
pnpm changeset       # Create changeset for version bump
pnpm changeset:version  # Apply changesets to update version
pnpm changeset:publish  # Publish to npm registry
```

## Architecture

### Library Structure
- **Entry Point**: `src/logger.ts` - exports all public API
- **Formatters**:
  - `src/formatters/console-node.ts` - Node.js console formatting
  - `src/formatters/console-browser.ts` - Browser console formatting
  - `src/formatters/json.ts` - JSON output formatting
- **Transports**:
  - `src/transports/console.ts` - Console transport
  - `src/transports/http.ts` - HTTP transport for remote logging
  - `src/transports/transport.ts` - Base transport interface
- **Utilities**:
  - `src/utils/crypto.ts` - Request ID generation
  - `src/utils/serialization.ts` - Safe JSON stringification
  - `src/utils/time.ts` - Timestamp utilities
  - `src/utils/location.ts` - Call location tracking and parsing
  - `src/utils/environment.ts` - Runtime environment detection
- **Testing**: `src/testing/test-utils.ts` - Spy, noop, and mock loggers
- **Types**: `src/types.ts` - Complete TypeScript type definitions
- **Build Output**: ESM-only distribution to `dist/`

### TypeScript Configuration
- **Strict Mode**: Maximum type safety enabled with `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`
- **Module System**: ESNext with bundler resolution for modern library distribution
- **Build**: Separate `tsconfig.build.json` for production builds (enables emit)
- **Development**: Main `tsconfig.json` with `noEmit: true` for validation only
- **Module Resolution**: ESM-only with `.js` extensions for imports

### Testing Strategy
- **Framework**: Vitest with Node.js environment
- **Coverage**: V8 provider with HTML/JSON/text reporting
- **Location**: Test files alongside source (`*.test.ts`, `*.spec.ts`)

### Code Quality Tools
- **ESLint**: Uses `@nextnode/eslint-plugin/base` configuration
- **Formatting**: Biome for code formatting
- **Commits**: Conventional commits with commitlint validation
- **Pre-commit**: Husky + lint-staged setup

## Library Features

### Core Logging Functionality
- **Multiple Log Levels**: `debug`, `info`, `warn`, `error` with environment-aware filtering
- **Scoped Logging**: Organize logs by scope/module for better debugging
- **Request Tracking**: Automatic request ID generation for distributed tracing
- **Location Tracking**: Automatic call site detection (file, function, line)
- **Environment Detection**: Auto-detect development/production environments

### Output Formatting
- **Development**: Human-readable console output with colors and formatting
- **Production**: Structured JSON logs optimized for log aggregation systems
- **Safe Serialization**: Handles circular references and complex objects
- **Performance**: Zero-dependency with minimal runtime overhead

### API Design
```typescript
import { logger, createLogger } from '@nextnode/logger'

// Default logger
logger.info('Hello world')
logger.warn('Something might be wrong', { details: { userId } })
logger.error('Something went wrong', { scope: 'api', details: { error, userId } })

// Custom logger with prefix
const apiLogger = createLogger({ prefix: '[API]', minLevel: 'info' })
apiLogger.info('Request received', { scope: 'users', details: { method: 'POST', path: '/users' } })
```