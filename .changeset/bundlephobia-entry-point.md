---
"@nextnode/logger": patch
---

Add main and types fields for bundlephobia compatibility

Bundlephobia (and some legacy tools) require the `main` and `types` fields at the root level of package.json to detect entry points. The `exports` field alone is not sufficient for these older tools.

This change adds:
- `main`: Points to the ESM entry point for legacy tool compatibility
- `types`: Points to the TypeScript declarations for tools that don't read `exports`

No functional change for modern consumers who use the `exports` field.
