/**
 * Utility functions for NextNode Logger
 * Zero dependencies, using only Node.js built-in modules
 */

import { randomUUID } from 'node:crypto'

export const generateRequestId = (): string => {
	try {
		// Use Node.js built-in crypto.randomUUID for maximum compatibility
		const uuid = randomUUID()
		// Create a shorter, more readable request ID
		return `req_${uuid.slice(0, 8)}`
	} catch {
		// Fallback if crypto.randomUUID is not available (very unlikely in modern Node.js)
		const timestamp = Date.now().toString(36)
		const random = Math.random().toString(36).substring(2, 8)
		return `req_${timestamp}${random}`
	}
}

// Centralized string conversion for special types
const typeToString = (value: unknown): string | undefined => {
	if (value === null) return 'null'
	if (value === undefined) return 'undefined'
	if (typeof value === 'function')
		return `[Function: ${value.name || 'anonymous'}]`
	if (typeof value === 'symbol') return value.toString()
	if (typeof value === 'bigint') return value.toString()
	return undefined
}

export const safeStringify = (value: unknown): string => {
	try {
		// Fast path for primitives
		const primitiveString = typeToString(value)
		if (primitiveString !== undefined) return primitiveString

		// Direct string conversion for simple types
		if (typeof value === 'string') return value
		if (typeof value === 'number' || typeof value === 'boolean') {
			return String(value)
		}

		// Complex object serialization with circular reference protection
		const seen = new WeakSet<object>()

		const replacer = (_key: string, val: unknown): unknown => {
			// Early return for non-objects
			if (typeof val !== 'object' || val === null) {
				const specialString = typeToString(val)
				return specialString !== undefined ? specialString : val
			}

			// Circular reference check
			if (seen.has(val)) return '[Circular Reference]'
			seen.add(val)

			return val
		}

		return JSON.stringify(value, replacer, 2)
	} catch (error) {
		// Last resort fallback
		return `[Serialization Error: ${error instanceof Error ? error.message : 'Unknown error'}]`
	}
}

export const getCurrentTimestamp = (): string => new Date().toISOString()
