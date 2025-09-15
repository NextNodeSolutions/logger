/**
 * Transport system types for NextNode Logger
 * Pluggable architecture for different log outputs (console, file, HTTP, etc.)
 */

import type { LogEntry, Transport } from '../types.js'

// Transport configuration for logger
export interface TransportConfig {
	readonly transports: Transport[]
	readonly fallbackToConsole?: boolean // Fallback to console if all transports fail
}

// Transport error information
export interface TransportError {
	readonly transport: string
	readonly error: Error
	readonly entry?: LogEntry
}
