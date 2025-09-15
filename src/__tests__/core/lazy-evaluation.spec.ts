/**
 * Tests for lazy evaluation functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

import { createLogger } from '@/core/logger.js'

import {
	createConsoleMocks,
	restoreConsoleMocks,
	type ConsoleMocks,
} from '../test-setup.js'

describe('Lazy Evaluation', () => {
	let consoleMocks: ConsoleMocks

	beforeEach(() => {
		consoleMocks = createConsoleMocks()
	})

	afterEach(() => {
		restoreConsoleMocks(consoleMocks)
	})

	it('should evaluate lazy messages only when needed', () => {
		const logger = createLogger({ environment: 'development' })
		const expensiveComputation = vi.fn(() => 'expensive result')

		logger.info(expensiveComputation)

		expect(expensiveComputation).toHaveBeenCalledOnce()
		expect(consoleMocks.log).toHaveBeenCalledWith(
			expect.stringContaining('expensive result'),
		)
	})

	it('should not evaluate lazy messages when logging is disabled/mocked', () => {
		// Mock console to throw to simulate disabled logging
		const originalLog = console.log
		console.log = vi.fn(() => {
			throw new Error('Logging disabled')
		})

		try {
			const logger = createLogger({ environment: 'development' })
			const expensiveComputation = vi.fn(() => 'expensive result')

			// Should still call the function but handle errors gracefully
			logger.info(expensiveComputation)

			expect(expensiveComputation).toHaveBeenCalledOnce()
		} finally {
			console.log = originalLog
		}
	})

	it('should work with regular string messages', () => {
		const logger = createLogger({ environment: 'development' })

		logger.info('regular string message')

		expect(consoleMocks.log).toHaveBeenCalledWith(
			expect.stringContaining('regular string message'),
		)
	})

	it('should handle lazy messages with prefixes', () => {
		const logger = createLogger({
			prefix: '[TEST]',
			environment: 'development',
		})
		const lazyMessage = vi.fn(() => 'lazy content')

		logger.info(lazyMessage)

		expect(lazyMessage).toHaveBeenCalledOnce()
		expect(consoleMocks.log).toHaveBeenCalledWith(
			expect.stringMatching(/\[TEST\].*lazy content/),
		)
	})

	it('should handle lazy messages that throw errors', () => {
		const logger = createLogger({ environment: 'development' })
		const faultyFunction = (): string => {
			throw new Error('Computation failed')
		}

		// Logger itself should not crash, but the lazy function will throw
		try {
			logger.info(faultyFunction)
		} catch (error) {
			// Expected - lazy function throws during evaluation
			expect(error).toBeInstanceOf(Error)
		}

		// Should still attempt to log something
		expect(consoleMocks.log).toHaveBeenCalled()
	})

	it('should work with complex lazy computations', () => {
		const logger = createLogger({ environment: 'development' })

		const complexObject = {
			users: Array.from({ length: 1000 }, (_, i) => ({
				id: i,
				name: `User ${i}`,
				active: i % 2 === 0,
			})),
		}

		const lazySerialize = vi.fn(
			(): string =>
				`Found ${complexObject.users.length} users, ${
					complexObject.users.filter(u => u.active).length
				} active`,
		)

		logger.info(lazySerialize, { scope: 'performance-test' })

		expect(lazySerialize).toHaveBeenCalledOnce()
		expect(consoleMocks.log).toHaveBeenCalledWith(
			expect.stringContaining('Found 1000 users, 500 active'),
		)
	})
})
