/**
 * @nextnode/logger
 * A lightweight, zero-dependency TypeScript logging library for NextNode projects
 */

// Export the main logger and factory
export { logger, createLogger } from './core/logger.js'

// Export types for TypeScript users
export type {
	Logger,
	LogObject,
	LogEntry,
	LogLevel,
	LoggerConfig,
	LocationInfo,
	ProductionLocationInfo,
	Environment,
} from './types.js'

// Export utilities for advanced usage
export { generateRequestId } from './utils/crypto.js'
export { safeStringify } from './utils/serialization.js'
export { getCurrentTimestamp } from './utils/time.js'
export { detectEnvironment, parseLocation } from './core/location.js'
