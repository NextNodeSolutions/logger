/**
 * Tests for NextNode Logger formatters
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import {
	formatForNode,
	__testing__ as nodeTestUtils,
} from '@/formatters/console-node.js'
import {
	formatForBrowser,
	__testing__ as browserTestUtils,
} from '@/formatters/console-browser.js'
import { formatAsJson, formatAsJsonPretty } from '@/formatters/json.js'

import type { LogEntry } from '@/types.js'

describe('formatForNode', () => {
	let mockDate: Date
	let baseEntry: LogEntry

	beforeEach(() => {
		// Use a fixed date for consistent testing
		mockDate = new Date('2024-08-21T10:30:15.123Z')
		vi.setSystemTime(mockDate)

		// Reset scope color cache
		nodeTestUtils.resetScopeCache()

		baseEntry = {
			level: 'info',
			message: 'Test message',
			timestamp: mockDate.toISOString(),
			location: { file: 'test.ts', line: 42, function: 'testFunction' },
			requestId: 'req_abc12345',
		}
	})

	afterEach(() => {
		vi.useRealTimers()
	})

	it('should format basic info log entry', () => {
		const result = formatForNode(baseEntry)

		expect(result).toContain('🔵')
		expect(result).toContain('INFO')
		expect(result).toContain('Test message')
		expect(result).toContain('test.ts:42:testFunction')
		expect(result).toContain('req_abc12345')
		expect(result).toContain('10:30:15')
	})

	it('should format debug log entry', () => {
		const entry: LogEntry = { ...baseEntry, level: 'debug' }
		const result = formatForNode(entry)

		expect(result).toContain('🔍')
		expect(result).toContain('DEBUG')
	})

	it('should format warn log entry', () => {
		const entry: LogEntry = { ...baseEntry, level: 'warn' }
		const result = formatForNode(entry)

		expect(result).toContain('⚠️')
		expect(result).toContain('WARN')
	})

	it('should format error log entry', () => {
		const entry: LogEntry = { ...baseEntry, level: 'error' }
		const result = formatForNode(entry)

		expect(result).toContain('🔴')
		expect(result).toContain('ERROR')
	})

	it('should include scope when present', () => {
		const entry: LogEntry = { ...baseEntry, scope: 'Auth' }
		const result = formatForNode(entry)

		expect(result).toContain('[Auth]')
	})

	it('should include object properties', () => {
		const entry: LogEntry = {
			...baseEntry,
			object: { status: 200, details: 'Simple detail' },
		}
		const result = formatForNode(entry)

		expect(result).toContain('status: 200')
		expect(result).toContain('details: Simple detail')
	})

	it('should handle production location format', () => {
		const entry: LogEntry = {
			...baseEntry,
			location: { function: 'testFunction' },
		}
		const result = formatForNode(entry)

		expect(result).toContain('(testFunction)')
		expect(result).not.toContain(':42:')
	})

	it('should handle invalid timestamp gracefully', () => {
		const entry: LogEntry = {
			...baseEntry,
			timestamp: 'invalid-timestamp',
		}
		const result = formatForNode(entry)

		expect(result).toContain('invalid-timestamp')
	})
})

describe('formatForBrowser', () => {
	let mockDate: Date
	let baseEntry: LogEntry

	beforeEach(() => {
		mockDate = new Date('2024-08-21T10:30:15.123Z')
		vi.setSystemTime(mockDate)

		browserTestUtils.resetScopeCache()

		baseEntry = {
			level: 'info',
			message: 'Test message',
			timestamp: mockDate.toISOString(),
			location: { file: 'test.ts', line: 42, function: 'testFunction' },
			requestId: 'req_abc12345',
		}
	})

	afterEach(() => {
		vi.useRealTimers()
	})

	it('should return format string and styles', () => {
		const result = formatForBrowser(baseEntry)

		expect(result).toHaveProperty('format')
		expect(result).toHaveProperty('styles')
		expect(result).toHaveProperty('objects')
		expect(Array.isArray(result.styles)).toBe(true)
		expect(Array.isArray(result.objects)).toBe(true)
	})

	it('should include emoji in format', () => {
		const result = formatForBrowser(baseEntry)

		expect(result.format).toContain('🔵')
	})

	it('should include message in format', () => {
		const result = formatForBrowser(baseEntry)

		expect(result.format).toContain('Test message')
	})

	it('should include scope in format when present', () => {
		const entry: LogEntry = { ...baseEntry, scope: 'Auth' }
		const result = formatForBrowser(entry)

		expect(result.format).toContain('[Auth]')
	})

	it('should pass objects directly for DevTools inspection', () => {
		const entry: LogEntry = {
			...baseEntry,
			object: { status: 200, details: { userId: 123 } },
		}
		const result = formatForBrowser(entry)

		expect(result.objects).toHaveLength(1)
		expect(result.objects[0]).toEqual({
			status: 200,
			details: { userId: 123 },
		})
	})

	it('should have empty objects array when no object present', () => {
		const result = formatForBrowser(baseEntry)

		expect(result.objects).toHaveLength(0)
	})
})

describe('formatAsJson', () => {
	let mockDate: Date
	let baseEntry: LogEntry

	beforeEach(() => {
		mockDate = new Date('2024-08-21T10:30:15.123Z')
		vi.setSystemTime(mockDate)

		baseEntry = {
			level: 'info',
			message: 'Test message',
			timestamp: mockDate.toISOString(),
			location: { function: 'testFunction' },
			requestId: 'req_abc12345',
		}
	})

	afterEach(() => {
		vi.useRealTimers()
	})

	it('should format basic log entry as JSON', () => {
		const result = formatAsJson(baseEntry)
		const parsed = JSON.parse(result)

		expect(parsed.level).toBe('info')
		expect(parsed.message).toBe('Test message')
		expect(parsed.timestamp).toBe('2024-08-21T10:30:15.123Z')
		expect(parsed.location).toEqual({ function: 'testFunction' })
		expect(parsed.requestId).toBe('req_abc12345')
	})

	it('should include scope when present', () => {
		const entry: LogEntry = { ...baseEntry, scope: 'Auth' }
		const result = formatAsJson(entry)
		const parsed = JSON.parse(result)

		expect(parsed.scope).toBe('Auth')
	})

	it('should flatten object properties into root', () => {
		const entry: LogEntry = {
			...baseEntry,
			object: {
				status: 200,
				details: { userId: 123 },
			},
		}
		const result = formatAsJson(entry)
		const parsed = JSON.parse(result)

		expect(parsed.status).toBe(200)
		expect(parsed.details).toEqual({ userId: 123 })
	})

	it('should not include undefined object properties', () => {
		const entry: LogEntry = {
			...baseEntry,
			object: {
				status: 200,
				details: undefined,
			},
		}
		const result = formatAsJson(entry)
		const parsed = JSON.parse(result)

		expect(parsed.status).toBe(200)
		expect(parsed).not.toHaveProperty('details')
	})

	it.each([
		['debug' as const],
		['info' as const],
		['warn' as const],
		['error' as const],
	])('should produce valid JSON for %s level', level => {
		const entry: LogEntry = { ...baseEntry, level }
		const result = formatAsJson(entry)

		expect(() => JSON.parse(result)).not.toThrow()
		const parsed = JSON.parse(result)
		expect(parsed.level).toBe(level)
	})
})

describe('formatAsJsonPretty', () => {
	let mockDate: Date
	let baseEntry: LogEntry

	beforeEach(() => {
		mockDate = new Date('2024-08-21T10:30:15.123Z')
		vi.setSystemTime(mockDate)

		baseEntry = {
			level: 'info',
			message: 'Test message',
			timestamp: mockDate.toISOString(),
			location: { function: 'testFunction' },
			requestId: 'req_abc12345',
		}
	})

	afterEach(() => {
		vi.useRealTimers()
	})

	it('should produce multi-line JSON', () => {
		const result = formatAsJsonPretty(baseEntry)

		expect(result).toContain('\n')
		expect(result).toContain('  ') // Indentation
	})

	it('should be parseable as JSON', () => {
		const result = formatAsJsonPretty(baseEntry)

		expect(() => JSON.parse(result)).not.toThrow()
	})
})
