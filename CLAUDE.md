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
- **Entry Point**: `src/index.ts` - exports all public API
- **Core Modules**: 
  - `core/logger.ts` - Main logger implementation and factory
  - `core/formatters.ts` - Environment-specific log formatting
  - `core/location.ts` - Call location tracking and parsing
- **Utilities**: 
  - `utils/crypto.ts` - Request ID generation
  - `utils/serialization.ts` - Safe JSON stringification
  - `utils/time.ts` - Timestamp utilities
- **Types**: `types.ts` - Complete TypeScript type definitions
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
logger.error('Something went wrong', { error, userId })

// Scoped logger
const apiLogger = createLogger('api')
apiLogger.info('Request received', { method: 'POST', path: '/users' })
```