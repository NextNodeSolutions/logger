# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is `@nextnode/logger`, a TypeScript logging library for NextNode projects. Despite the name "logger" and the current description, the codebase currently contains only date formatting utilities. The package is set up as a library with standard NextNode toolchain configuration.

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
- **Modules**: Organized by feature area (currently only `formatting/`)
- **Build Output**: CommonJS/ESM compatible via TypeScript compilation to `dist/`

### TypeScript Configuration
- **Strict Mode**: Maximum type safety enabled with `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`
- **Module System**: ESNext with bundler resolution for modern library distribution
- **Build**: Separate `tsconfig.build.json` for production builds (enables emit)
- **Development**: Main `tsconfig.json` with `noEmit: true` for validation only

### Testing Strategy
- **Framework**: Vitest with Node.js environment
- **Coverage**: V8 provider with HTML/JSON/text reporting
- **Location**: Test files alongside source (`*.test.ts`, `*.spec.ts`)

### Code Quality Tools
- **ESLint**: Uses `@nextnode/eslint-plugin/base` configuration
- **Formatting**: Biome for code formatting
- **Commits**: Conventional commits with commitlint validation
- **Pre-commit**: Husky + lint-staged setup

## Current State vs. Intent

**Current Implementation**: Only contains date formatting utilities (`formatDate`)
**Package Metadata**: Describes a logging library
**Architecture**: Set up for comprehensive logging functionality

This suggests the library is in early development and the actual logging functionality is yet to be implemented.