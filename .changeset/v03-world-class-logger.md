---
"@nextnode/logger": minor
---

## World-Class Logger Refactor (v0.3)

### Breaking Changes
- Removed barrel file (`index.ts`) - use direct imports
- New module structure with package.json exports map
- Moved `location.ts` from `core/` to `utils/`

### New Features
- **Log Level Filtering**: `minLevel` config to filter logs below threshold
- **Debug Level**: Added `debug` log level (lowest priority)
- **Silent Mode**: `silent: true` config for tests
- **Browser Formatting**: CSS styling for DevTools instead of ANSI codes
- **Pluggable Transports**: Transport interface for custom log destinations
- **HTTP Transport**: Built-in HTTP transport with batching and retry
- **Testing Utilities**: `createSpyLogger`, `createNoopLogger`, `createMockLogger`

### Import Changes
```typescript
// Main logger (unchanged)
import { logger, createLogger } from '@nextnode/logger'

// Testing utilities (new)
import { createSpyLogger } from '@nextnode/logger/testing'

// HTTP transport (new)
import { HttpTransport } from '@nextnode/logger/transports/http'
```
