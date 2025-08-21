/**
 * Core types for NextNode Logger
 * Zero dependencies, strict TypeScript, production-ready logging
 */

// Literal union types for better type inference
export type LogLevel = 'info' | 'warning' | 'error'
export type Environment = 'development' | 'production'

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

// Logger configuration with strict typing
export interface LoggerConfig {
	readonly prefix?: string
	readonly environment?: Environment
	readonly includeLocation?: boolean
}

// Logger interface with method signatures
export interface Logger {
	info(message: string, object?: LogObject): void
	warning(message: string, object?: LogObject): void
	error(message: string, object?: LogObject): void
}

// Type guards for runtime type checking
export const isLogLevel = (value: unknown): value is LogLevel =>
	typeof value === 'string' && ['info', 'warning', 'error'].includes(value)

export const isEnvironment = (value: unknown): value is Environment =>
	typeof value === 'string' && ['development', 'production'].includes(value)

export const isDevelopmentLocation = (
	location: DevelopmentLocationInfo | ProductionLocationInfo,
): location is DevelopmentLocationInfo =>
	'file' in location && 'line' in location
