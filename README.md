# @nextnode/logger

A lightweight, zero-dependency TypeScript logging library for NextNode projects with scope-based organization, environment-aware formatting, and pluggable transports.

## Features

- Zero runtime dependencies
- TypeScript-first with strict types
- Environment-aware formatting (development vs production)
- Works in Node.js, browser, and WebWorkers
- Log level filtering (`debug`, `info`, `warn`, `error`)
- Scoped logging for organized output
- Pluggable transport system
- Built-in testing utilities for Vitest/Jest
- Request ID generation for tracing
- Location tracking (file, line, function)

## Installation

```bash
pnpm add @nextnode/logger
```

Or with npm:

```bash
npm install @nextnode/logger
```

## Quick Start

```typescript
import { logger, createLogger } from '@nextnode/logger'

// Use the default logger
logger.info('Application started')
logger.warn('Something might be wrong', { details: { code: 123 } })
logger.error('Something went wrong', { scope: 'api', details: error })

// Create a custom logger
const apiLogger = createLogger({ prefix: '[API]' })
apiLogger.info('Request received', {
	scope: 'users',
	details: { method: 'POST' },
})
```

## Configuration

```typescript
import { createLogger } from '@nextnode/logger'

const logger = createLogger({
	// Filter logs below this level (default: 'debug')
	minLevel: 'info',

	// Force environment (auto-detected from NODE_ENV by default)
	environment: 'production',

	// Add prefix to all messages
	prefix: '[MyApp]',

	// Include file/line location info (default: true)
	includeLocation: false,

	// Disable all output (useful for tests)
	silent: false,

	// Custom transports (default: ConsoleTransport)
	transports: [new ConsoleTransport()],
})
```

## Log Levels

Four log levels are available, in order of priority:

| Level   | Method           | Use Case                      |
| ------- | ---------------- | ----------------------------- |
| `debug` | `logger.debug()` | Verbose debugging information |
| `info`  | `logger.info()`  | General information           |
| `warn`  | `logger.warn()`  | Warning conditions            |
| `error` | `logger.error()` | Error conditions              |

### Level Filtering

Use `minLevel` to filter out lower-priority logs:

```typescript
const logger = createLogger({ minLevel: 'warn' })

logger.debug('Debug') // Not logged
logger.info('Info') // Not logged
logger.warn('Warn') // Logged
logger.error('Error') // Logged
```

## Scoped Logging

Add a `scope` property to organize logs by module/feature:

```typescript
logger.info('User created', {
	scope: 'auth',
	details: { userId: '123' },
})

// Development output:
// 🔵 INFO  [auth] [10:30:15] User created (auth.ts:42:createUser) [req_abc12345]
//    └─ details: { "userId": "123" }

// Production output (JSON):
// {"level":"info","message":"User created","scope":"auth","details":{"userId":"123"},...}
```

## Environment-Aware Output

### Development (default)

Human-readable output with colors and emojis:

```
🔵 INFO  [api] [10:30:15] Request received (handler.ts:42:handleRequest) [req_abc12345]
   └─ method: POST
   └─ path: /users
```

### Production

Structured JSON for log aggregation systems:

```json
{
	"level": "info",
	"message": "Request received",
	"timestamp": "2024-12-11T10:30:15.123Z",
	"location": { "function": "handleRequest" },
	"requestId": "req_abc12345",
	"scope": "api",
	"method": "POST",
	"path": "/users"
}
```

## Browser Support

In browsers, the logger automatically uses CSS styling instead of ANSI codes:

```typescript
import { createLogger } from '@nextnode/logger'

const logger = createLogger()
logger.info('Hello from browser', { details: { data: 'value' } })
// Uses console.groupCollapsed for expandable details in DevTools
```

## Testing Utilities

### Spy Logger

Track all log calls in your tests:

```typescript
import { createSpyLogger } from '@nextnode/logger/testing'

describe('MyService', () => {
	it('logs when creating a user', () => {
		const spy = createSpyLogger()
		const service = new MyService(spy)

		service.createUser({ name: 'John' })

		expect(spy.wasCalledWith('User created')).toBe(true)
		expect(spy.calls).toHaveLength(1)
		expect(spy.calls[0].level).toBe('info')
	})

	afterEach(() => {
		spy.clear() // Reset between tests
	})
})
```

### Silent Mode

Disable all logging in tests:

```typescript
import { createLogger } from '@nextnode/logger'

const logger = createLogger({ silent: true })
// No output, but logger works normally
```

### Spy Logger API

```typescript
interface SpyLogger extends Logger {
	calls: LogEntry[] // All recorded entries
	getCallsByLevel(level: LogLevel): LogEntry[] // Filter by level
	getLastCall(): LogEntry | undefined // Most recent entry
	wasCalledWith(message: string): boolean // Check if message logged
	wasCalledWithLevel(level, message): boolean // Check level + message
	clear(): void // Reset tracked calls
}
```

## Custom Transports

### HTTP Transport

Send logs to a remote endpoint:

```typescript
import { createLogger } from '@nextnode/logger'
import { HttpTransport } from '@nextnode/logger/transports/http'

const logger = createLogger({
	transports: [
		new HttpTransport({
			endpoint: 'https://logs.example.com/ingest',
			headers: {
				Authorization: 'Bearer token',
			},
			batchSize: 10, // Send every 10 logs (default)
			flushInterval: 5000, // Or every 5 seconds (default)
			onError: (error, entries) => {
				console.error('Failed to send logs:', error)
			},
		}),
	],
})
```

### Multiple Transports

```typescript
import { createLogger, ConsoleTransport } from '@nextnode/logger'
import { HttpTransport } from '@nextnode/logger/transports/http'

const logger = createLogger({
	transports: [
		new ConsoleTransport(),
		new HttpTransport({ endpoint: 'https://logs.example.com' }),
	],
})
```

### Graceful Shutdown

Flush pending logs before shutdown:

```typescript
process.on('SIGTERM', async () => {
	await logger.dispose()
	process.exit(0)
})
```

## API Reference

### Main Exports

```typescript
import {
	// Logger class and factory
	NextNodeLogger,
	createLogger,
	logger, // Default instance

	// Types
	Logger,
	LoggerConfig,
	LogEntry,
	LogLevel,
	LogObject,
	Transport,

	// Transports
	ConsoleTransport,
	createConsoleTransport,

	// Formatters
	formatForNode,
	formatForBrowser,
	formatAsJson,

	// Utilities
	generateRequestId,
	safeStringify,
	getCurrentTimestamp,
	detectEnvironment,
	parseLocation,
	detectRuntime,
} from '@nextnode/logger'
```

### Testing Exports

```typescript
import {
	createSpyLogger,
	createNoopLogger,
	createMockLogger,
} from '@nextnode/logger/testing'
```

### HTTP Transport Export

```typescript
import {
	HttpTransport,
	createHttpTransport,
} from '@nextnode/logger/transports/http'
```

## TypeScript

Full TypeScript support with strict types:

```typescript
import type {
	Logger,
	LoggerConfig,
	LogEntry,
	LogLevel,
	LogObject,
	SpyLogger,
	Transport,
	Environment,
	RuntimeEnvironment,
} from '@nextnode/logger'
```

## Requirements

- Node.js 20.0.0+ (for Web Crypto API)
- ESM-only (no CommonJS support)

## License

MIT
