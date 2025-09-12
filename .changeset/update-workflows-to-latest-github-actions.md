---
"@nextnode/logger": patch
---

Update CI/CD workflows to use latest NextNodeSolutions/github-actions

- Modernized test.yml to use shared quality-checks workflow with comprehensive lint, typecheck, tests, build and coverage checks
- Replaced release.yml with version.yml using shared version-management workflow for better separation of concerns  
- Added auto-publish.yml for automated publishing after version merges with provenance attestation
- Added manual-publish.yml recovery workflow with dry-run option
- Updated to Node.js 22 and maintained pnpm 10.11.0 across all workflows
- All workflows now leverage centralized shared actions for consistency and maintainability