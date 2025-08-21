/**
 * Formatters for NextNode Logger
 * Environment-aware formatting with colorized development output and structured JSON for production
 */

import { safeStringify } from './utils.js'
import { isDevelopmentLocation } from './types.js'

import type { LogEntry, LogLevel, Environment } from './types.js'

const COLORS = {
	reset: '\x1b[0m',
	red: '\x1b[31m',
	green: '\x1b[32m',
	yellow: '\x1b[33m',
	blue: '\x1b[34m',
	magenta: '\x1b[35m',
	cyan: '\x1b[36m',
	white: '\x1b[37m',
	gray: '\x1b[90m',
} as const

const LOG_LEVEL_COLORS: Record<LogLevel, string> = {
	info: COLORS.blue,
	warning: COLORS.yellow,
	error: COLORS.red,
} as const

const LOG_LEVEL_ICONS: Record<LogLevel, string> = {
	info: '🔵',
	warning: '⚠️ ',
	error: '🔴',
} as const

const SCOPE_COLORS = [
	COLORS.green,
	COLORS.magenta,
	COLORS.cyan,
	COLORS.yellow,
	COLORS.blue,
] as const

// Use LRU-like cache with max size to prevent memory leaks
const MAX_SCOPE_CACHE_SIZE = 100
let scopeColorIndex = 0
const scopeColorMap = new Map<string, string>()

const getScopeColor = (scope: string): string => {
	let color = scopeColorMap.get(scope)

	if (!color) {
		// Implement cache eviction when size limit reached
		if (scopeColorMap.size >= MAX_SCOPE_CACHE_SIZE) {
			// Remove oldest entry (first in map)
			const firstKey = scopeColorMap.keys().next().value
			if (firstKey) scopeColorMap.delete(firstKey)
		}

		color =
			SCOPE_COLORS[scopeColorIndex % SCOPE_COLORS.length] ?? COLORS.white
		scopeColorMap.set(scope, color)
		scopeColorIndex = (scopeColorIndex + 1) % SCOPE_COLORS.length
	}

	return color
}

const formatTime = (timestamp: string): string => {
	try {
		const date = new Date(timestamp)
		if (Number.isNaN(date.getTime())) {
			return timestamp
		}
		// Use UTC time and format as HH:MM:SS
		const hours = date.getUTCHours().toString().padStart(2, '0')
		const minutes = date.getUTCMinutes().toString().padStart(2, '0')
		const seconds = date.getUTCSeconds().toString().padStart(2, '0')
		return `${hours}:${minutes}:${seconds}`
	} catch {
		return timestamp
	}
}

const formatLocation = (location: LogEntry['location']): string => {
	if (isDevelopmentLocation(location)) {
		return `${location.file}:${location.line}:${location.function}`
	}
	return location.function
}

// Helper to build colored string segments
const colorize = (text: string, color: string): string =>
	`${color}${text}${COLORS.reset}`

// Helper to format object details with proper indentation
const formatObjectDetails = (object: LogEntry['object']): string[] => {
	const lines: string[] = []

	if (!object) return lines

	if (object.status !== undefined) {
		lines.push(`   └─ status: ${object.status}`)
	}

	if (object.details !== undefined) {
		const detailsStr = safeStringify(object.details)
		if (detailsStr.includes('\n')) {
			// Multi-line details
			lines.push(`   └─ details:`)
			detailsStr.split('\n').forEach(line => {
				lines.push(`      ${line}`)
			})
		} else {
			// Single line details
			lines.push(`   └─ details: ${detailsStr}`)
		}
	}

	return lines
}

export const formatForDevelopment = (entry: LogEntry): string => {
	const { level, message, timestamp, location, requestId, scope, object } =
		entry

	// Build log components using string builder pattern for better performance
	const components: string[] = []

	// Icon and level
	components.push(LOG_LEVEL_ICONS[level])
	components.push(colorize(level.toUpperCase(), LOG_LEVEL_COLORS[level]))

	// Scope if present
	if (scope) {
		components.push(colorize(`[${scope}]`, getScopeColor(scope)))
	}

	// Timestamp
	components.push(colorize(`[${formatTime(timestamp)}]`, COLORS.gray))

	// Message
	components.push(message)

	// Location and request ID
	components.push(
		colorize(`(${formatLocation(location)}) [${requestId}]`, COLORS.gray),
	)

	// Combine main line
	const lines = [components.join(' ')]

	// Add object details if present
	lines.push(...formatObjectDetails(object))

	return lines.join('\n')
}

export const formatForProduction = (entry: LogEntry): string => {
	const { level, message, timestamp, location, requestId, scope, object } =
		entry

	// Build production entry object conditionally to avoid undefined values
	const productionEntry: Record<string, unknown> = {
		level,
		message,
		timestamp,
		location,
		requestId,
	}

	// Only add optional fields if they have values
	if (scope) productionEntry.scope = scope
	if (object) productionEntry.object = object

	return JSON.stringify(productionEntry)
}

export const formatLogEntry = (
	entry: LogEntry,
	environment: Environment,
): string =>
	environment === 'development'
		? formatForDevelopment(entry)
		: formatForProduction(entry)
