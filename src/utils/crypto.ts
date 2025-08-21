/**
 * Cryptographic utilities for NextNode Logger
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
