---
"@nextnode/logger": patch
---

Fixed browser compatibility issues with TypeScript strict mode by replacing globalThis usage with direct global access (window, document, crypto, importScripts). Updated environment detection to use proper typeof checks and added DOM/WebWorker library types to TypeScript configuration.