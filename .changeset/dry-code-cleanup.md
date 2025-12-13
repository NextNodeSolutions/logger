---
'@nextnode/logger': minor
---

DRY code cleanup and improved type safety

- Extract shared utilities to reduce code duplication across formatters
- Add `formatTimeForDisplay` and `formatLocationForDisplay` shared utilities
- Centralize `extractScope` function for consistent scope handling
- Remove unnecessary type assertions in test utilities
