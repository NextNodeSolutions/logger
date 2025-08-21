/**
 * @nextnode/logger
 * A lightweight, zero-dependency TypeScript logging library for NextNode projects
 */

// Export the main logger and factory
export { logger, createLogger } from './logger.js'

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
export {
	generateRequestId,
	safeStringify,
	getCurrentTimestamp,
} from './utils.js'
export { detectEnvironment, parseLocation } from './location.js'
