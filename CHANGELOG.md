# @nextnode/logger

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
