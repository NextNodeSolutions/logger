# @nextnode/logger

A lightweight, zero-dependency TypeScript logging library for NextNode projects with scope-based organization and environment-aware formatting.

## Features

✨ **Zero Dependencies** - No external dependencies, minimal runtime overhead  
🎯 **Scoped Logging** - Organize logs by module/component with color-coded scopes  
🌍 **Environment Aware** - Human-readable dev output, structured JSON for production  
📍 **Location Tracking** - Automatic call site detection (file, function, line)  
🔍 **Request Tracing** - Auto-generated request IDs for distributed tracing  
💪 **TypeScript First** - Full type safety with strict TypeScript support  
🎨 **Beautiful Output** - Colorized console output with emoji indicators  
⚡ **High Performance** - Optimized for production with minimal allocations  

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
import { logger } from '@nextnode/logger'

// Simple logging
logger.info('Application started')
logger.warn('Configuration missing', { key: 'DATABASE_URL' })
logger.error('Connection failed', { error: new Error('Timeout') })
```

## Usage

### Basic Logging

```typescript
import { logger } from '@nextnode/logger'

// Default logger - ready to use
logger.info('Hello world')
logger.warn('Something might be wrong', { userId: 123 })
logger.error('Something went wrong', { error: new Error('Failed'), userId: 123 })
```

### Scoped Loggers

Create loggers with specific scopes to organize your logs:

```typescript
import { createLogger } from '@nextnode/logger'

// Create scoped loggers
const apiLogger = createLogger({ prefix: 'API' })
const dbLogger = createLogger({ prefix: 'DB' })
const authLogger = createLogger({ prefix: 'AUTH' })

// Each logger has its own color and prefix
apiLogger.info('Request received', { method: 'POST', path: '/users' })
dbLogger.info('Query executed', { query: 'SELECT * FROM users', duration: '12ms' })
authLogger.warn('Invalid token', { token: 'abc...', userId: 123 })
```

### Advanced Configuration

```typescript
import { createLogger } from '@nextnode/logger'

const logger = createLogger({
  prefix: 'MyApp',
  environment: 'production',  // 'development' or 'production'
  includeLocation: false      // Disable call site tracking
})
```

### Structured Logging

Use the optional object parameter for structured data:

```typescript
logger.info('User login successful', {
  scope: 'auth',        // Optional: scope per log message
  details: {
    userId: 'user_123',
    method: 'oauth',
    provider: 'google'
  },
  status: 200
})
```

## Output Examples

### Development Environment
Beautiful, human-readable output with colors and emojis:

```
🔵 INFO [API] [14:32:15] Request received (server.ts:45:handleRequest) [req_a1b2c3d4]
   └─ details: {"method":"POST","path":"/users","ip":"192.168.1.1"}

⚠️  WARN [DB] [14:32:16] Slow query detected (database.ts:123:executeQuery) [req_a1b2c3d4]
   └─ status: 200
   └─ details: {"query":"SELECT * FROM users","duration":"1.2s"}

🔴 ERROR [AUTH] [14:32:17] Authentication failed (auth.ts:67:validateToken) [req_a1b2c3d4]
   └─ details: {"error":"Invalid JWT token","userId":"user_123"}
```

### Production Environment
Structured JSON for log aggregation systems:

```json
{"level":"info","message":"Request received","timestamp":"2024-01-15T14:32:15.123Z","location":{"function":"handleRequest"},"requestId":"req_a1b2c3d4","scope":"api","object":{"details":{"method":"POST","path":"/users"}}}
{"level":"warn","message":"Slow query detected","timestamp":"2024-01-15T14:32:16.456Z","location":{"function":"executeQuery"},"requestId":"req_a1b2c3d4","scope":"db","object":{"status":200,"details":{"query":"SELECT * FROM users","duration":"1.2s"}}}
{"level":"error","message":"Authentication failed","timestamp":"2024-01-15T14:32:17.789Z","location":{"function":"validateToken"},"requestId":"req_a1b2c3d4","scope":"auth","object":{"details":{"error":"Invalid JWT token","userId":"user_123"}}}
```

## Environment Detection

The logger automatically detects your environment:

- **Development**: `NODE_ENV=development` or `NODE_ENV=dev` (default)
- **Production**: `NODE_ENV=production` or `NODE_ENV=prod`

You can also explicitly set the environment:

```typescript
const logger = createLogger({ environment: 'production' })
```

## API Reference

### `logger`

Default logger instance ready to use.

```typescript
logger.info(message: string, object?: LogObject): void
logger.warn(message: string, object?: LogObject): void
logger.error(message: string, object?: LogObject): void
```

### `createLogger(config?)`

Factory function to create logger instances.

```typescript
const logger = createLogger(config?: LoggerConfig)
```

### Types

#### `LoggerConfig`

```typescript
interface LoggerConfig {
  prefix?: string           // Prefix for all log messages
  environment?: Environment // 'development' | 'production'
  includeLocation?: boolean // Include call site info (default: true)
}
```

#### `LogObject`

```typescript
interface LogObject {
  scope?: string     // Optional scope override per message
  details?: unknown  // Any additional data to log
  status?: number    // HTTP status or custom status code
}
```

#### `LogLevel`

```typescript
type LogLevel = 'info' | 'warn' | 'error'
```

## Advanced Features

### Request IDs

Every log entry automatically gets a unique request ID for tracing:

```typescript
logger.info('Processing request')
// Output includes: [req_a1b2c3d4]
```

### Call Site Tracking

In development, logs include file, line number, and function name:

```typescript
// In file: src/api/users.ts, line 45, function: createUser
logger.info('Creating user')
// Output: (users.ts:45:createUser)
```

### Safe Serialization

Objects are safely serialized, handling circular references:

```typescript
const obj = { name: 'test' }
obj.self = obj  // Circular reference

logger.info('Object with circular ref', { details: obj })
// Won't crash, handles circular references gracefully
```

## Utility Functions

For advanced usage, you can import utility functions:

```typescript
import { 
  generateRequestId,
  safeStringify,
  getCurrentTimestamp,
  detectEnvironment,
  parseLocation 
} from '@nextnode/logger'

const reqId = generateRequestId()      // Generate unique request ID
const json = safeStringify(obj)        // Safe JSON stringify
const now = getCurrentTimestamp()      // Current ISO timestamp
const env = detectEnvironment()        // 'development' | 'production'
const location = parseLocation(false)  // Parse call site info
```

## Best Practices

### 1. Use Scoped Loggers

```typescript
// ✅ Good - Clear separation by module
const apiLogger = createLogger({ prefix: 'API' })
const dbLogger = createLogger({ prefix: 'DB' })

// ❌ Avoid - All logs mixed together
logger.info('API: Request received')
logger.info('DB: Query executed')
```

### 2. Structure Your Data

```typescript
// ✅ Good - Structured logging
logger.info('User action', {
  details: { action: 'login', userId: 123, method: 'oauth' },
  status: 200
})

// ❌ Avoid - Unstructured strings
logger.info('User 123 logged in via oauth - status 200')
```

### 3. Use Appropriate Log Levels

```typescript
logger.info('Normal operations')        // General information
logger.warn('Recoverable issues')       // Warnings that don't break flow
logger.error('Serious problems')        // Errors that need attention
```

### 4. Include Context

```typescript
logger.error('Database connection failed', {
  details: {
    host: 'db.example.com',
    port: 5432,
    database: 'myapp',
    error: error.message,
    retryCount: 3
  }
})
```

## Requirements

- Node.js 20+
- TypeScript 5.0+ (for TypeScript projects)
- Modern browser with Web Crypto API support (for browser usage)

## License

MIT

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for contribution guidelines.