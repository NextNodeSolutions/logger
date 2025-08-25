/**
 * Tests for NextNode Logger formatters
 */

import { describe, it, expect } from 'vitest'

import {
	formatForDevelopment,
	formatForProduction,
	formatLogEntry,
} from '@/core/formatters.js'

import type { LogEntry } from '@/types.js'

describe('formatForDevelopment', () => {
	const baseEntry: LogEntry = {
		level: 'info',
		message: 'Test message',
		timestamp: '2024-08-21T10:30:15.123Z',
		location: { file: 'test.ts', line: 42, function: 'testFunction' },
		requestId: 'req_abc12345',
	}

	it('should format basic info log entry', () => {
		const result = formatForDevelopment(baseEntry)

		expect(result).toContain('🔵')
		expect(result).toContain('INFO')
		expect(result).toContain('Test message')
		expect(result).toContain('test.ts:42:testFunction')
		expect(result).toContain('req_abc12345')
		expect(result).toContain('10:30:15')
	})

	it('should format warn log entry', () => {
		const entry: LogEntry = { ...baseEntry, level: 'warn' }
		const result = formatForDevelopment(entry)

		expect(result).toContain('⚠️')
		expect(result).toContain('WARN')
	})

	it('should format error log entry', () => {
		const entry: LogEntry = { ...baseEntry, level: 'error' }
		const result = formatForDevelopment(entry)

		expect(result).toContain('🔴')
		expect(result).toContain('ERROR')
	})

	it('should include scope when present', () => {
		const entry: LogEntry = { ...baseEntry, scope: 'Auth' }
		const result = formatForDevelopment(entry)

		expect(result).toContain('[Auth]')
	})

	it('should include status when present', () => {
		const entry: LogEntry = {
			...baseEntry,
			object: { status: 200 },
		}
		const result = formatForDevelopment(entry)

		expect(result).toContain('└─ status: 200')
	})

	it('should include single-line details', () => {
		const entry: LogEntry = {
			...baseEntry,
			object: { details: 'Simple string detail' },
		}
		const result = formatForDevelopment(entry)

		expect(result).toContain('└─ details: Simple string detail')
	})

	it('should include multi-line details', () => {
		const entry: LogEntry = {
			...baseEntry,
			object: { details: { userId: 123, email: 'test@example.com' } },
		}
		const result = formatForDevelopment(entry)

		expect(result).toContain('└─ details:')
		expect(result).toContain('userId')
		expect(result).toContain('email')
	})

	it('should include both status and details', () => {
		const entry: LogEntry = {
			...baseEntry,
			object: {
				status: 400,
				details: { error: 'Validation failed' },
			},
		}
		const result = formatForDevelopment(entry)

		expect(result).toContain('└─ status: 400')
		expect(result).toContain('└─ details:')
		expect(result).toContain('error')
	})

	it('should handle production location format', () => {
		const entry: LogEntry = {
			...baseEntry,
			location: { function: 'testFunction' },
		}
		const result = formatForDevelopment(entry)

		expect(result).toContain('(testFunction)')
		expect(result).not.toContain(':42:')
	})

	it('should format timestamp correctly', () => {
		const entry: LogEntry = {
			...baseEntry,
			timestamp: '2024-12-25T14:30:45.678Z',
		}
		const result = formatForDevelopment(entry)

		expect(result).toContain('14:30:45')
	})

	it('should handle invalid timestamp gracefully', () => {
		const entry: LogEntry = {
			...baseEntry,
			timestamp: 'invalid-timestamp',
		}
		const result = formatForDevelopment(entry)

		expect(result).toContain('invalid-timestamp')
	})
})

describe('formatForProduction', () => {
	const baseEntry: LogEntry = {
		level: 'info',
		message: 'Test message',
		timestamp: '2024-08-21T10:30:15.123Z',
		location: { function: 'testFunction' },
		requestId: 'req_abc12345',
	}

	it('should format basic log entry as JSON', () => {
		const result = formatForProduction(baseEntry)
		const parsed = JSON.parse(result)

		expect(parsed.level).toBe('info')
		expect(parsed.message).toBe('Test message')
		expect(parsed.timestamp).toBe('2024-08-21T10:30:15.123Z')
		expect(parsed.location).toEqual({ function: 'testFunction' })
		expect(parsed.requestId).toBe('req_abc12345')
	})

	it('should include scope when present', () => {
		const entry: LogEntry = { ...baseEntry, scope: 'Auth' }
		const result = formatForProduction(entry)
		const parsed = JSON.parse(result)

		expect(parsed.scope).toBe('Auth')
	})

	it('should include object when present', () => {
		const entry: LogEntry = {
			...baseEntry,
			object: {
				status: 200,
				details: { userId: 123 },
			},
		}
		const result = formatForProduction(entry)
		const parsed = JSON.parse(result)

		expect(parsed.object).toEqual({
			status: 200,
			details: { userId: 123 },
		})
	})

	it('should not include scope field when not present', () => {
		const result = formatForProduction(baseEntry)
		const parsed = JSON.parse(result)

		expect(parsed).not.toHaveProperty('scope')
	})

	it('should not include object field when not present', () => {
		const result = formatForProduction(baseEntry)
		const parsed = JSON.parse(result)

		expect(parsed).not.toHaveProperty('object')
	})

	it('should handle complex location object', () => {
		const entry: LogEntry = {
			...baseEntry,
			location: { file: 'test.ts', line: 42, function: 'testFunction' },
		}
		const result = formatForProduction(entry)
		const parsed = JSON.parse(result)

		expect(parsed.location).toEqual({
			file: 'test.ts',
			line: 42,
			function: 'testFunction',
		})
	})

	it('should produce valid JSON for all log levels', () => {
		const levels = ['info', 'warn', 'error'] as const

		levels.forEach(level => {
			const entry: LogEntry = { ...baseEntry, level }
			const result = formatForProduction(entry)

			expect(() => JSON.parse(result)).not.toThrow()
			const parsed = JSON.parse(result)
			expect(parsed.level).toBe(level)
		})
	})
})

describe('formatLogEntry', () => {
	const baseEntry: LogEntry = {
		level: 'info',
		message: 'Test message',
		timestamp: '2024-08-21T10:30:15.123Z',
		location: { function: 'testFunction' },
		requestId: 'req_abc12345',
	}

	it('should use development formatter for development environment', () => {
		const result = formatLogEntry(baseEntry, 'development')

		// Development format should include emojis and colors
		expect(result).toContain('🔵')
		expect(result).toContain('INFO')
		expect(result).not.toMatch(/^\{.*\}$/) // Should not be JSON
	})

	it('should use production formatter for production environment', () => {
		const result = formatLogEntry(baseEntry, 'production')

		// Production format should be valid JSON
		expect(() => JSON.parse(result)).not.toThrow()
		const parsed = JSON.parse(result)
		expect(parsed.level).toBe('info')
	})

	it('should handle complex entries in both environments', () => {
		const complexEntry: LogEntry = {
			...baseEntry,
			scope: 'Database',
			object: {
				status: 500,
				details: {
					error: 'Connection timeout',
					retries: 3,
					host: 'localhost',
				},
			},
		}

		// Development format
		const devResult = formatLogEntry(complexEntry, 'development')
		expect(devResult).toContain('[Database]')
		expect(devResult).toContain('status: 500')
		expect(devResult).toContain('Connection timeout')

		// Production format
		const prodResult = formatLogEntry(complexEntry, 'production')
		const parsed = JSON.parse(prodResult)
		expect(parsed.scope).toBe('Database')
		expect(parsed.object.status).toBe(500)
		expect(parsed.object.details.error).toBe('Connection timeout')
	})
})
