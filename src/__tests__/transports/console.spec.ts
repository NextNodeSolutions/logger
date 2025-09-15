/**
 * Tests for ConsoleTransport
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'

import { ConsoleTransport } from '@/transports/console.js'
import { getCurrentTimestamp } from '@/utils/time.js'

import {
	createConsoleMocks,
	restoreConsoleMocks,
	type ConsoleMocks,
} from '../test-setup.js'

describe('ConsoleTransport', () => {
	let consoleMocks: ConsoleMocks
	let originalEnv: typeof process.env

	beforeEach(() => {
		consoleMocks = createConsoleMocks()
		originalEnv = { ...process.env }
	})

	afterEach(() => {
		restoreConsoleMocks(consoleMocks)
		process.env = originalEnv
	})

	it('should write log entries to console', () => {
		const transport = new ConsoleTransport({ environment: 'development' })

		const logEntry = {
			level: 'info' as const,
			message: 'Test message',
			timestamp: getCurrentTimestamp(),
			location: { function: 'testFunction', file: 'test.ts', line: 42 },
			requestId: 'req_12345',
			scope: 'test',
		}

		transport.write(logEntry)

		expect(consoleMocks.log).toHaveBeenCalledWith(
			expect.stringContaining('Test message'),
		)
	})

	it('should respect NO_COLOR environment variable', () => {
		process.env['NO_COLOR'] = '1'

		const transport = new ConsoleTransport({ environment: 'development' })

		const logEntry = {
			level: 'info' as const,
			message: 'Test message',
			timestamp: getCurrentTimestamp(),
			location: { function: 'testFunction', file: 'test.ts', line: 42 },
			requestId: 'req_12345',
		}

		transport.write(logEntry)

		// Should use production format (no colors) even in development
		const output = consoleMocks.log.mock.calls[0]?.[0] as string
		// eslint-disable-next-line no-control-regex
		expect(output).not.toMatch(/\x1b\[/) // No ANSI color codes
	})

	it('should respect CI environment variable', () => {
		process.env['CI'] = 'true'

		const transport = new ConsoleTransport({ environment: 'development' })

		const logEntry = {
			level: 'warn' as const,
			message: 'Warning message',
			timestamp: getCurrentTimestamp(),
			location: { function: 'testFunction' },
			requestId: 'req_12345',
		}

		transport.write(logEntry)

		// Should use production format in CI
		const output = consoleMocks.warn.mock.calls[0]?.[0] as string
		// eslint-disable-next-line no-control-regex
		expect(output).not.toMatch(/\x1b\[/) // No ANSI color codes
	})

	it('should allow manual color override', () => {
		const transport = new ConsoleTransport({
			environment: 'development',
			colors: false,
		})

		const logEntry = {
			level: 'error' as const,
			message: 'Error message',
			timestamp: getCurrentTimestamp(),
			location: { function: 'testFunction' },
			requestId: 'req_12345',
		}

		transport.write(logEntry)

		const output = consoleMocks.error.mock.calls[0]?.[0] as string
		// eslint-disable-next-line no-control-regex
		expect(output).not.toMatch(/\x1b\[/) // No ANSI color codes
	})

	it('should use different console methods for different levels', () => {
		const transport = new ConsoleTransport({ environment: 'production' })

		const baseEntry = {
			timestamp: getCurrentTimestamp(),
			location: { function: 'test' },
			requestId: 'req_123',
		}

		transport.write({
			...baseEntry,
			level: 'info' as const,
			message: 'Info',
		})
		transport.write({
			...baseEntry,
			level: 'warn' as const,
			message: 'Warning',
		})
		transport.write({
			...baseEntry,
			level: 'error' as const,
			message: 'Error',
		})

		expect(consoleMocks.log).toHaveBeenCalledWith(
			expect.stringContaining('Info'),
		)
		expect(consoleMocks.warn).toHaveBeenCalledWith(
			expect.stringContaining('Warning'),
		)
		expect(consoleMocks.error).toHaveBeenCalledWith(
			expect.stringContaining('Error'),
		)
	})

	it('should have correct transport name', () => {
		const transport = new ConsoleTransport()
		expect(transport.name).toBe('console')
	})

	it('should handle production environment correctly', () => {
		const transport = new ConsoleTransport({ environment: 'production' })

		const logEntry = {
			level: 'info' as const,
			message: 'Production message',
			timestamp: getCurrentTimestamp(),
			location: { function: 'prodFunction' },
			requestId: 'req_prod123',
			object: { status: 200, userId: 'user123' },
		}

		transport.write(logEntry)

		const output = consoleMocks.log.mock.calls[0]?.[0] as string

		// Should be JSON format in production
		expect(() => JSON.parse(output)).not.toThrow()

		const parsed = JSON.parse(output)
		expect(parsed.level).toBe('info')
		expect(parsed.message).toBe('Production message')
		expect(parsed.requestId).toBe('req_prod123')
	})
})
