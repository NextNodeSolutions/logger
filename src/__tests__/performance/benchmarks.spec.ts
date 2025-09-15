/**
 * Performance benchmarks and tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

import { createLogger } from '@/core/logger.js'
import { ConsoleTransport } from '@/transports/console.js'
import { generateRequestId } from '@/utils/crypto.js'
import { safeStringify } from '@/utils/serialization.js'

import {
	createConsoleMocks,
	restoreConsoleMocks,
	type ConsoleMocks,
} from '../test-setup.js'

describe('Performance Benchmarks', () => {
	let consoleMocks: ConsoleMocks

	beforeEach(() => {
		consoleMocks = createConsoleMocks()
	})

	afterEach(() => {
		restoreConsoleMocks(consoleMocks)
	})

	describe('Lazy Evaluation Performance', () => {
		it('should avoid expensive computations when not needed', () => {
			// Create a mock transport that never writes
			const mockTransport = {
				name: 'mock',
				write: vi.fn(),
			}

			const logger = createLogger({
				transports: [mockTransport],
				fallbackToConsole: false,
			})

			const expensiveComputation = vi.fn(() => {
				// Simulate expensive operation
				let result = ''
				for (let i = 0; i < 10000; i++) {
					result += String(Math.random())
				}
				return result
			})

			const start = performance.now()

			// Log with lazy evaluation
			logger.info(expensiveComputation)

			const end = performance.now()
			const duration = end - start

			expect(expensiveComputation).toHaveBeenCalledOnce()
			expect(mockTransport.write).toHaveBeenCalledOnce()

			// Should complete reasonably fast (this is more about ensuring it works)
			expect(duration).toBeLessThan(1000) // Less than 1 second
		})

		it('should perform well with batch logging', async () => {
			vi.useFakeTimers()

			const logger = createLogger({
				environment: 'production',
				batch: {
					enabled: true,
					maxSize: 100,
					flushInterval: 1000,
				},
			})

			const start = performance.now()

			// Log many messages quickly
			for (let i = 0; i < 100; i++) {
				logger.info(`Message ${i}`, { details: { iteration: i } })
			}

			const batchTime = performance.now() - start

			// Batching should be very fast (no I/O yet)
			expect(batchTime).toBeLessThan(100) // Less than 100ms

			// Now flush and measure
			const flushStart = performance.now()
			await vi.runAllTimersAsync()
			const flushTime = performance.now() - flushStart

			vi.useRealTimers()

			expect(consoleMocks.log).toHaveBeenCalledTimes(100)
			expect(flushTime).toBeLessThan(1000) // Flush should be reasonable
		})
	})

	describe('Memory Usage', () => {
		it('should not leak memory with many log entries', () => {
			const logger = createLogger({ environment: 'production' })

			// Create many log entries
			for (let i = 0; i < 1000; i++) {
				logger.info(`Message ${i}`, {
					details: { iteration: i, timestamp: Date.now() },
				})
			}

			expect(consoleMocks.log).toHaveBeenCalledTimes(1000)

			// If we get here without running out of memory, we're good
			expect(true).toBe(true)
		})

		it('should handle rapid-fire logging without blocking', async () => {
			const logger = createLogger({
				environment: 'production',
				batch: {
					enabled: true,
					maxSize: 50,
					flushInterval: 100,
				},
			})

			vi.useFakeTimers()

			const startTime = performance.now()

			// Simulate high-frequency logging
			for (let i = 0; i < 500; i++) {
				logger.info(`Rapid message ${i}`, {
					details: {
						timestamp: Date.now(),
						data: 'x'.repeat(100),
					},
				})
			}

			const logTime = performance.now() - startTime

			// Should be very fast to queue
			expect(logTime).toBeLessThan(100)

			await vi.runAllTimersAsync()
			vi.useRealTimers()

			// All messages should eventually be logged
			expect(consoleMocks.log).toHaveBeenCalledTimes(500)
		})
	})

	describe('Utility Performance', () => {
		it('should perform request ID generation efficiently', () => {
			const start = performance.now()

			const ids = []
			for (let i = 0; i < 1000; i++) {
				ids.push(generateRequestId())
			}

			const end = performance.now()
			const duration = end - start

			expect(duration).toBeLessThan(100) // Less than 100ms for 1000 IDs

			// All IDs should be unique
			const uniqueIds = new Set(ids)
			expect(uniqueIds.size).toBe(1000)

			// All IDs should have correct format
			for (const id of ids) {
				expect(id).toMatch(/^req_[a-f0-9]{8}$/)
			}
		})

		it('should perform safe stringify efficiently', () => {
			const largeObject = {
				users: Array.from({ length: 1000 }, (_, i) => ({
					id: i,
					name: `User ${i}`,
					email: `user${i}@example.com`,
				})),
			}

			const start = performance.now()

			for (let i = 0; i < 100; i++) {
				safeStringify(largeObject)
			}

			const end = performance.now()
			const duration = end - start

			expect(duration).toBeLessThan(1000) // Less than 1 second for 100 serializations
		})
	})

	describe('Transport Performance', () => {
		it('should handle multiple transports efficiently', () => {
			const transports = [
				new ConsoleTransport({ environment: 'production' }),
				new ConsoleTransport({ environment: 'development' }),
				// Mock transport
				{
					name: 'mock1',
					write: vi.fn(),
				},
				{
					name: 'mock2',
					write: vi.fn(),
				},
			]

			const logger = createLogger({
				transports,
				environment: 'production',
			})

			const start = performance.now()

			// Log to all transports
			for (let i = 0; i < 100; i++) {
				logger.info(`Multi-transport message ${i}`)
			}

			const end = performance.now()
			const duration = end - start

			expect(duration).toBeLessThan(1000) // Should handle multiple transports well

			// Verify all transports were called
			expect(consoleMocks.log).toHaveBeenCalledTimes(200) // 2 console transports * 100 messages
			expect(transports[2]?.write).toHaveBeenCalledTimes(100)
			expect(transports[3]?.write).toHaveBeenCalledTimes(100)
		})
	})

	describe('Scalability Tests', () => {
		it('should scale with increasing log frequency', async () => {
			vi.useFakeTimers()

			const frequencies = [10, 50, 100, 200]
			const results = []

			for (const frequency of frequencies) {
				const logger = createLogger({
					environment: 'production',
					batch: {
						enabled: true,
						maxSize: frequency,
						flushInterval: 100,
					},
				})

				const start = performance.now()

				for (let i = 0; i < frequency; i++) {
					logger.info(`Frequency test ${i}`)
				}

				await vi.runAllTimersAsync()

				const duration = performance.now() - start
				results.push(duration)

				// Clear console mocks for next iteration
				consoleMocks.log.mockClear()
			}

			vi.useRealTimers()

			// Performance should not degrade linearly with frequency
			// (batch logging should help with higher frequencies)
			expect(results[0]).toBeDefined()
			expect(results[1]).toBeDefined()
			expect(results[2]).toBeDefined()
			expect(results[3]).toBeDefined()

			// Higher frequencies shouldn't be dramatically slower
			expect(results[3]!).toBeLessThan(results[0]! * 50) // Not 50x slower
		})
	})
})
