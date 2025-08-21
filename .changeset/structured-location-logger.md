---
"@nextnode/logger": minor
---

feat: implement comprehensive NextNode logger with structured logging capabilities

- Add core logging functionality with log levels (debug, info, warn, error)
- Implement location-aware logging with file path and line number tracking
- Add structured message formatting with consistent timestamp and metadata
- Include cryptographic utilities for log integrity (hashing, signature verification)
- Add serialization utilities for complex data types
- Reorganize project structure with dedicated core, utils, and types modules
- Remove CommonJS support, ES6 modules only
- Modernize test suite with Vitest best practices