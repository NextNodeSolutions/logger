/**
 * Serialization utilities for NextNode Logger
 * Zero dependencies, using only Node.js built-in modules
 */

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
