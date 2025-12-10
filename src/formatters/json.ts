/**
 * JSON formatter for NextNode Logger
 * Produces structured JSON output for production/log aggregation systems
 */

import type { LogEntry } from '../types.js'

export interface JsonLogOutput {
	level: string
	message: string
	timestamp: string
	location: {
		function: string
		file?: string
		line?: number
	}
	requestId: string
	scope?: string
	[key: string]: unknown
}

/**
 * Formats a log entry as structured JSON.
 * - Omits undefined/null optional fields for cleaner output
 * - Flattens object properties into root level for easier querying
 * - Produces single-line JSON optimized for log aggregation
 */
export const formatAsJson = (entry: LogEntry): string => {
	const { level, message, timestamp, location, requestId, scope, object } =
		entry

	const output: JsonLogOutput = {
		level,
		message,
		timestamp,
		location,
		requestId,
	}

	// Only add scope if present
	if (scope) {
		output.scope = scope
	}

	// Flatten object properties into root for easier querying
	if (object) {
		for (const [key, value] of Object.entries(object)) {
			if (value !== undefined) {
				output[key] = value
			}
		}
	}

	return JSON.stringify(output)
}

/**
 * Formats a log entry as pretty-printed JSON.
 * Useful for debugging and development with structured output.
 */
export const formatAsJsonPretty = (entry: LogEntry): string => {
	const { level, message, timestamp, location, requestId, scope, object } =
		entry

	const output: JsonLogOutput = {
		level,
		message,
		timestamp,
		location,
		requestId,
	}

	if (scope) {
		output.scope = scope
	}

	if (object) {
		for (const [key, value] of Object.entries(object)) {
			if (value !== undefined) {
				output[key] = value
			}
		}
	}

	return JSON.stringify(output, null, 2)
}
