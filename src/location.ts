/**
 * Location parsing utilities for NextNode Logger
 * Extracts file, line, and function information from stack traces
 */

import type {
	LocationInfo,
	ProductionLocationInfo,
	Environment,
} from './types.js'

// Constants for better performance and maintainability
const STACK_TRACE_PATTERNS = {
	function: [
		/at\s+([^(\s]+)\s+\(/, // at functionName (file:line:col)
		/at\s+(.+?)\s+\(/, // at Object.functionName (file:line:col)
		/at\s+([^(\s]+)$/, // at functionName
		/at\s+(.+)$/, // fallback: everything after 'at '
	],
	file: [
		/\(([^)]+):(\d+):\d+\)/, // (file:line:col)
		/at\s+[^(]*\s+([^:\s]+(?:[:\\\\][^:\s]+)*):(\d+):\d+$/, // at function file:line:col
		/([^:\s]+(?:[:\\\\][^:\s]+)*):(\d+):\d+$/, // file:line:col at end
	],
} as const

const INTERNAL_FILES = ['logger.ts', 'location.ts', 'formatters.ts'] as const

const isValidStackLine = (line: string): boolean =>
	typeof line === 'string' &&
	line.includes('at ') &&
	!line.includes('node_modules')

const isInternalFile = (line: string): boolean =>
	INTERNAL_FILES.some(file => line.includes(file))

const extractFunctionName = (stackLine: string): string => {
	for (const pattern of STACK_TRACE_PATTERNS.function) {
		const match = pattern.exec(stackLine)
		if (match?.[1]) {
			const functionName = match[1].trim()

			// Clean up common patterns
			if (functionName.includes('<anonymous>')) return 'anonymous'

			// Extract last part if it's a method call
			const lastDotIndex = functionName.lastIndexOf('.')
			if (lastDotIndex !== -1) {
				return functionName.slice(lastDotIndex + 1) || functionName
			}

			return functionName
		}
	}

	return 'unknown'
}

const extractFileInfo = (stackLine: string): { file: string; line: number } => {
	for (const pattern of STACK_TRACE_PATTERNS.file) {
		const match = pattern.exec(stackLine)
		if (match?.[1] && match[2]) {
			const fullPath = match[1]
			const line = Number(match[2])

			// Extract filename from path efficiently
			const lastSeparatorIndex = Math.max(
				fullPath.lastIndexOf('/'),
				fullPath.lastIndexOf('\\'),
			)
			const file =
				lastSeparatorIndex !== -1
					? fullPath.slice(lastSeparatorIndex + 1)
					: fullPath

			return { file, line }
		}
	}

	return { file: 'unknown', line: 0 }
}

const getCallerStackLine = (stack: string): string => {
	const lines = stack.split('\n')

	// Find first non-internal stack line (skip Error line)
	for (let i = 1; i < lines.length; i++) {
		const line = lines[i]
		if (line && isValidStackLine(line) && !isInternalFile(line)) {
			return line
		}
	}

	// Fallback to first line after Error if no valid line found
	return lines[1] || ''
}

export const parseLocation = (
	isProduction: boolean,
): LocationInfo | ProductionLocationInfo => {
	try {
		const stack = new Error().stack || ''
		const stackLine = getCallerStackLine(stack)

		const functionName = extractFunctionName(stackLine)

		if (isProduction) {
			return { function: functionName }
		}

		const { file, line } = extractFileInfo(stackLine)

		return {
			function: functionName,
			file,
			line,
		}
	} catch {
		// Fallback if stack trace parsing fails
		return isProduction
			? { function: 'unknown' }
			: { function: 'unknown', file: 'unknown', line: 0 }
	}
}

export const detectEnvironment = (): Environment => {
	// Check NODE_ENV first
	const nodeEnv = process.env['NODE_ENV']
	if (nodeEnv === 'production' || nodeEnv === 'prod') {
		return 'production'
	}

	if (nodeEnv === 'development' || nodeEnv === 'dev') {
		return 'development'
	}

	// Default to development for safety (more verbose logging)
	return 'development'
}
