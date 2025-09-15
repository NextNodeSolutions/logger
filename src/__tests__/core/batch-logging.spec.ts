/**
 * Tests for batch logging functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

import { createLogger } from '@/core/logger.js'

import {
	createConsoleMocks,
	restoreConsoleMocks,
	type ConsoleMocks,
} from '../test-setup.js'

describe('Batch Logging', () => {
	let consoleMocks: ConsoleMocks

	beforeEach(() => {
		consoleMocks = createConsoleMocks()
		vi.useFakeTimers()
	})

	afterEach(() => {
		restoreConsoleMocks(consoleMocks)
		vi.useRealTimers()
	})

	it('should batch logs when batch.enabled is true', async () => {
		const logger = createLogger({
			environment: 'development',
			batch: {
				enabled: true,
				maxSize: 3,
				flushInterval: 1000,
			},
		})

		logger.info('Message 1')
		logger.info('Message 2')

		// Should not have logged yet (batching)
		expect(consoleMocks.log).not.toHaveBeenCalled()

		logger.info('Message 3') // Should trigger flush (maxSize reached)

		// Allow microtasks to complete
		await vi.runAllTimersAsync()

		expect(consoleMocks.log).toHaveBeenCalledTimes(3)
	})

	it('should flush batch after flushInterval', async () => {
		const logger = createLogger({
			environment: 'development',
			batch: {
				enabled: true,
				maxSize: 10,
				flushInterval: 500,
			},
		})

		logger.info('Message 1')
		logger.info('Message 2')

		// Should not have logged yet
		expect(consoleMocks.log).not.toHaveBeenCalled()

		// Advance time to trigger flush
		await vi.advanceTimersByTimeAsync(500)

		expect(consoleMocks.log).toHaveBeenCalledTimes(2)
	})

	it('should flush batch when maxDelay is exceeded', async () => {
		const logger = createLogger({
			environment: 'development',
			batch: {
				enabled: true,
				maxSize: 100,
				flushInterval: 1000,
				maxDelay: 300,
			},
		})

		logger.info('Message 1')

		// Advance time beyond maxDelay
		await vi.advanceTimersByTimeAsync(350)

		logger.info('Message 2') // Should trigger immediate flush due to maxDelay

		await vi.runAllTimersAsync()

		expect(consoleMocks.log).toHaveBeenCalledTimes(2)
	})

	it('should not batch when batch.enabled is false', () => {
		const logger = createLogger({
			environment: 'development',
			batch: {
				enabled: false,
				maxSize: 10,
				flushInterval: 1000,
			},
		})

		logger.info('Message 1')
		logger.info('Message 2')

		// Should log immediately
		expect(consoleMocks.log).toHaveBeenCalledTimes(2)
	})

	it('should handle manual flush()', async () => {
		const logger = createLogger({
			environment: 'development',
			batch: {
				enabled: true,
				maxSize: 10,
				flushInterval: 1000,
			},
		})

		logger.info('Message 1')
		logger.info('Message 2')

		// Should not have logged yet
		expect(consoleMocks.log).not.toHaveBeenCalled()

		logger.flush()
		await vi.runAllTimersAsync()

		expect(consoleMocks.log).toHaveBeenCalledTimes(2)
	})

	it('should maintain log order in batch', async () => {
		const logger = createLogger({
			environment: 'production', // Use JSON format for easier parsing
			batch: {
				enabled: true,
				maxSize: 3,
				flushInterval: 1000,
			},
		})

		logger.info('First message')
		logger.warn('Second message')
		logger.error('Third message')

		await vi.runAllTimersAsync()

		expect(consoleMocks.log).toHaveBeenCalledWith(
			expect.stringContaining('First message'),
		)
		expect(consoleMocks.warn).toHaveBeenCalledWith(
			expect.stringContaining('Second message'),
		)
		expect(consoleMocks.error).toHaveBeenCalledWith(
			expect.stringContaining('Third message'),
		)

		// Verify order by call sequence
		const logCall = consoleMocks.log.mock.calls[0]
		const warnCall = consoleMocks.warn.mock.calls[0]
		const errorCall = consoleMocks.error.mock.calls[0]

		expect(logCall).toBeDefined()
		expect(warnCall).toBeDefined()
		expect(errorCall).toBeDefined()
	})

	it('should clear timer on manual flush', async () => {
		const logger = createLogger({
			environment: 'development',
			batch: {
				enabled: true,
				maxSize: 10,
				flushInterval: 1000,
			},
		})

		logger.info('Message 1')

		// Manually flush before timer
		logger.flush()
		await vi.runAllTimersAsync()

		expect(consoleMocks.log).toHaveBeenCalledTimes(1)

		// Add more messages after flush
		logger.info('Message 2')

		// Should not double-flush when original timer fires
		await vi.advanceTimersByTimeAsync(1000)

		expect(consoleMocks.log).toHaveBeenCalledTimes(2)
	})
})
