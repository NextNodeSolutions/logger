---
'@nextnode/logger': patch
---

fix: add files field to package.json to ensure dist folder is published to npm

Previously, the package was publishing source TypeScript files instead of the built JavaScript files in the dist directory. This caused issues when consuming the package as the TypeScript files were present in node_modules instead of the compiled JavaScript.
