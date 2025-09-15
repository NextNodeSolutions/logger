/**
 * Core types for NextNode Logger
 * Zero dependencies, strict TypeScript, production-ready logging
 */

// Literal union types for better type inference
export type LogLevel = 'info' | 'warn' | 'error'
export type Environment = 'development' | 'production'
export type RuntimeEnvironment = 'node' | 'browser' | 'webworker' | 'unknown'

// Location information types with discriminated union
export interface DevelopmentLocationInfo {
	readonly file: string
	readonly line: number
	readonly function: string
}

export interface ProductionLocationInfo {
	readonly function: string
}

// Backward compatibility alias
export type LocationInfo = DevelopmentLocationInfo

// Log object with optional fields
export interface LogObject {
	readonly scope?: string
	readonly details?: unknown
	readonly status?: number
}

// Log entry with conditional types for better type safety
export interface LogEntry {
	readonly level: LogLevel
	readonly message: string
	readonly timestamp: string
	readonly location: DevelopmentLocationInfo | ProductionLocationInfo
	readonly requestId: string
	readonly scope?: string | undefined
	readonly object?: Omit<LogObject, 'scope'> | undefined
}

// Batch logging configuration
export interface BatchConfig {
	readonly enabled: boolean
	readonly maxSize: number // Maximum number of logs to batch
	readonly flushInterval: number // Milliseconds to wait before auto-flush
	readonly maxDelay: number // Maximum delay before forced flush
}

// Logger configuration with strict typing
export interface LoggerConfig {
	readonly prefix?: string
	readonly environment?: Environment
	readonly includeLocation?: boolean
	readonly batch?: Partial<BatchConfig>
}

// Lazy evaluation support for expensive message computation
export type LazyMessage = () => string

// Logger interface with method signatures supporting lazy evaluation
export interface Logger {
	info(message: string | LazyMessage, object?: LogObject): void
	warn(message: string | LazyMessage, object?: LogObject): void
	error(message: string | LazyMessage, object?: LogObject): void
	flush(): void // Force flush any batched logs
}

// Type guards for runtime type checking
export const isLogLevel = (value: unknown): value is LogLevel =>
	typeof value === 'string' && ['info', 'warn', 'error'].includes(value)

export const isEnvironment = (value: unknown): value is Environment =>
	typeof value === 'string' && ['development', 'production'].includes(value)

export const isDevelopmentLocation = (
	location: DevelopmentLocationInfo | ProductionLocationInfo,
): location is DevelopmentLocationInfo =>
	'file' in location && 'line' in location

export const isRuntimeEnvironment = (
	value: unknown,
): value is RuntimeEnvironment =>
	typeof value === 'string' &&
	['node', 'browser', 'webworker', 'unknown'].includes(value)

export const isLazyMessage = (message: unknown): message is LazyMessage =>
	typeof message === 'function'
