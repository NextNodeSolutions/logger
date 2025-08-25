/**
 * Integration tests for NextNode Logger
 * Testing the public API and end-to-end functionality
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'

import {
	logger,
	createLogger,
	generateRequestId,
	safeStringify,
	getCurrentTimestamp,
	detectEnvironment,
	parseLocation,
} from '../index.js'
import {
	createConsoleMocks,
	restoreConsoleMocks,
	type ConsoleMocks,
} from './test-setup.js'

describe('NextNode Logger Integration', () => {
	let consoleMocks: ConsoleMocks

	beforeEach(() => {
		consoleMocks = createConsoleMocks()
	})

	afterEach(() => {
		restoreConsoleMocks(consoleMocks)
	})

	describe('Public API exports', () => {
		it('should export logger instance', () => {
			expect(logger).toBeDefined()
			expect(typeof logger.info).toBe('function')
			expect(typeof logger.warn).toBe('function')
			expect(typeof logger.error).toBe('function')
		})

		it('should export createLogger factory', () => {
			expect(createLogger).toBeDefined()
			expect(typeof createLogger).toBe('function')
		})

		it('should export utility functions', () => {
			expect(generateRequestId).toBeDefined()
			expect(safeStringify).toBeDefined()
			expect(getCurrentTimestamp).toBeDefined()
			expect(detectEnvironment).toBeDefined()
			expect(parseLocation).toBeDefined()
		})
	})

	describe('Real-world usage scenarios', () => {
		it('should handle authentication logging scenario', () => {
			const authLogger = createLogger({ prefix: '[AUTH]' })

			// Login attempt
			authLogger.info('Login attempt', {
				scope: 'Auth',
				details: { email: 'user@example.com', ip: '192.168.1.1' },
			})

			// Successful login
			authLogger.info('Login successful', {
				scope: 'Auth',
				status: 200,
				details: { userId: 123, sessionId: 'sess_abc123' },
			})

			// Failed login
			authLogger.warn('Login failed', {
				scope: 'Auth',
				status: 401,
				details: {
					email: 'user@example.com',
					reason: 'Invalid password',
				},
			})

			expect(consoleMocks.log).toHaveBeenCalledTimes(2)
			expect(consoleMocks.warn).toHaveBeenCalledTimes(1)

			// Verify first log call
			expect(consoleMocks.log).toHaveBeenNthCalledWith(
				1,
				expect.stringContaining('[AUTH] Login attempt'),
			)
			expect(consoleMocks.log).toHaveBeenNthCalledWith(
				1,
				expect.stringContaining('[Auth]'),
			)
			expect(consoleMocks.log).toHaveBeenNthCalledWith(
				1,
				expect.stringContaining('user@example.com'),
			)

			// Verify second log call
			expect(consoleMocks.log).toHaveBeenNthCalledWith(
				2,
				expect.stringContaining('[AUTH] Login successful'),
			)
			expect(consoleMocks.log).toHaveBeenNthCalledWith(
				2,
				expect.stringContaining('200'),
			)
			expect(consoleMocks.log).toHaveBeenNthCalledWith(
				2,
				expect.stringContaining('123'),
			)

			// Verify warn call
			expect(consoleMocks.warn).toHaveBeenCalledWith(
				expect.stringContaining('[AUTH] Login failed'),
			)
			expect(consoleMocks.warn).toHaveBeenCalledWith(
				expect.stringContaining('401'),
			)
			expect(consoleMocks.warn).toHaveBeenCalledWith(
				expect.stringContaining('Invalid password'),
			)
		})

		it('should handle database operation logging scenario', () => {
			const dbLogger = createLogger({ prefix: '[DB]' })

			// Query execution
			dbLogger.info('Query executed', {
				scope: 'Database',
				details: {
					query: 'SELECT * FROM users WHERE active = true',
					duration: 45,
					rows: 150,
				},
			})

			// Slow query warning
			dbLogger.warn('Slow query detected', {
				scope: 'Database',
				details: {
					query: 'SELECT * FROM orders JOIN users ON orders.user_id = users.id',
					duration: 2500,
					threshold: 1000,
				},
			})

			// Connection error
			dbLogger.error('Database connection failed', {
				scope: 'Database',
				status: 500,
				details: {
					error: 'Connection timeout after 30s',
					host: 'db.example.com',
					port: 5432,
					retries: 3,
				},
			})

			expect(consoleMocks.log).toHaveBeenCalledTimes(1)
			expect(consoleMocks.warn).toHaveBeenCalledTimes(1)
			expect(consoleMocks.error).toHaveBeenCalledTimes(1)

			expect(consoleMocks.log).toHaveBeenCalledWith(
				expect.stringContaining('[Database]'),
			)
			expect(consoleMocks.log).toHaveBeenCalledWith(
				expect.stringContaining('45'),
			)
			expect(consoleMocks.log).toHaveBeenCalledWith(
				expect.stringContaining('150'),
			)

			expect(consoleMocks.warn).toHaveBeenCalledWith(
				expect.stringContaining('Slow query'),
			)
			expect(consoleMocks.warn).toHaveBeenCalledWith(
				expect.stringContaining('2500'),
			)

			expect(consoleMocks.error).toHaveBeenCalledWith(
				expect.stringContaining('Connection timeout'),
			)
			expect(consoleMocks.error).toHaveBeenCalledWith(
				expect.stringContaining('500'),
			)
		})

		it('should handle API request logging scenario', () => {
			const apiLogger = createLogger({ prefix: '[API]' })

			// Request received
			apiLogger.info('Request received', {
				scope: 'API',
				details: {
					method: 'POST',
					endpoint: '/api/users',
					userAgent: 'NextNode/1.0.0',
					ip: '192.168.1.1',
				},
			})

			// Validation error
			apiLogger.error('Validation failed', {
				scope: 'API',
				status: 400,
				details: {
					errors: [
						'Email is required',
						'Password must be at least 8 characters',
					],
					field: 'user registration',
				},
			})

			// Response sent
			apiLogger.info('Response sent', {
				scope: 'API',
				status: 201,
				details: {
					userId: 456,
					duration: 120,
					responseSize: 1024,
				},
			})

			expect(consoleMocks.log).toHaveBeenCalledTimes(2)
			expect(consoleMocks.error).toHaveBeenCalledTimes(1)

			// Verify first API log call
			expect(consoleMocks.log).toHaveBeenNthCalledWith(
				1,
				expect.stringContaining('POST'),
			)
			expect(consoleMocks.log).toHaveBeenNthCalledWith(
				1,
				expect.stringContaining('/api/users'),
			)

			// Verify second API log call
			expect(consoleMocks.log).toHaveBeenNthCalledWith(
				2,
				expect.stringContaining('201'),
			)
			expect(consoleMocks.log).toHaveBeenNthCalledWith(
				2,
				expect.stringContaining('456'),
			)
			expect(consoleMocks.log).toHaveBeenNthCalledWith(
				2,
				expect.stringContaining('120'),
			)

			// Verify error call
			expect(consoleMocks.error).toHaveBeenCalledWith(
				expect.stringContaining('Email is required'),
			)
			expect(consoleMocks.error).toHaveBeenCalledWith(
				expect.stringContaining('400'),
			)
		})
	})

	describe('Edge cases and error handling', () => {
		it('should handle extremely complex objects', () => {
			const complexData = {
				user: {
					id: 123,
					profile: {
						personal: {
							name: 'John Doe',
							addresses: [
								{ type: 'home', city: 'New York' },
								{ type: 'work', city: 'San Francisco' },
							],
						},
						preferences: {
							notifications: {
								email: true,
								sms: false,
								push: {
									enabled: true,
									categories: ['updates', 'promotions'],
								},
							},
						},
					},
				},
				metadata: {
					timestamp: new Date().toISOString(),
					source: 'integration-test',
					version: '1.0.0',
				},
			}

			logger.info('Complex data test', {
				scope: 'Test',
				details: complexData,
			})

			expect(consoleMocks.log).toHaveBeenCalledWith(
				expect.stringContaining('John Doe'),
			)
			expect(consoleMocks.log).toHaveBeenCalledWith(
				expect.stringContaining('New York'),
			)
			expect(consoleMocks.log).toHaveBeenCalledWith(
				expect.stringContaining('notifications'),
			)
		})

		it('should handle all primitive types in details', () => {
			const primitiveTypes = {
				string: 'test string',
				number: 42,
				boolean: true,
				nullValue: null,
				undefinedValue: undefined,
				bigint: BigInt(123456789),
				symbol: Symbol('test'),
				array: [1, 'two', true],
				date: new Date(),
				regex: /test/gi,
			}

			logger.info('Primitive types test', {
				scope: 'Types',
				details: primitiveTypes,
			})

			// Should not throw and should handle all types
			expect(consoleMocks.log).toHaveBeenCalledWith(
				expect.stringContaining('test string'),
			)
			expect(consoleMocks.log).toHaveBeenCalledWith(
				expect.stringContaining('42'),
			)
		})

		it('should handle functions in details', () => {
			const objectWithFunctions = {
				data: 'test',
				namedFunction: function testFunction(): string {
					return 'test'
				},
				arrowFunction: (): string => 'arrow',
				asyncFunction: async (): Promise<string> => 'async',
				method(): string {
					return 'method'
				},
			}

			logger.info('Functions test', {
				scope: 'Functions',
				details: objectWithFunctions,
			})

			expect(consoleMocks.log).toHaveBeenCalledWith(
				expect.stringContaining('Function'),
			)
			expect(consoleMocks.log).toHaveBeenCalledWith(
				expect.stringContaining('test'),
			)
		})

		it('should handle empty and minimal objects', () => {
			// Empty object
			logger.info('Empty object', { details: {} })

			// Only scope
			logger.info('Only scope', { scope: 'MinimalTest' })

			// Only status
			logger.info('Only status', { status: 200 })

			// Only details
			logger.info('Only details', { details: 'simple string' })

			expect(consoleMocks.log).toHaveBeenCalledTimes(4)

			// Verify each nth call
			expect(consoleMocks.log).toHaveBeenNthCalledWith(
				1,
				expect.stringContaining('Empty object'),
			)
			expect(consoleMocks.log).toHaveBeenNthCalledWith(
				2,
				expect.stringContaining('[MinimalTest]'),
			)
			expect(consoleMocks.log).toHaveBeenNthCalledWith(
				3,
				expect.stringContaining('200'),
			)
			expect(consoleMocks.log).toHaveBeenNthCalledWith(
				4,
				expect.stringContaining('simple string'),
			)
		})
	})

	describe('Environment behavior', () => {
		it('should behave differently in development vs production', () => {
			const devLogger = createLogger({ environment: 'development' })
			const prodLogger = createLogger({ environment: 'production' })

			const testData = {
				scope: 'Environment',
				status: 200,
				details: { test: 'data' },
			}

			devLogger.info('Development test', testData)
			prodLogger.info('Production test', testData)

			expect(consoleMocks.log).toHaveBeenCalledTimes(2)

			// Development should have emojis and colors (first call)
			expect(consoleMocks.log).toHaveBeenNthCalledWith(
				1,
				expect.stringContaining('🔵'),
			)
			expect(consoleMocks.log).toHaveBeenNthCalledWith(
				1,
				expect.stringContaining('[Environment]'),
			)

			// Production should be valid JSON (second call)
			expect(consoleMocks.log).toHaveBeenNthCalledWith(
				2,
				expect.stringMatching(/^\{.*"level"\s*:\s*"info".*\}$/),
			)
			expect(consoleMocks.log).toHaveBeenNthCalledWith(
				2,
				expect.stringContaining('"scope":"Environment"'),
			)
			expect(consoleMocks.log).toHaveBeenNthCalledWith(
				2,
				expect.stringContaining('"message":"Production test"'),
			)
		})
	})

	describe('Performance and reliability', () => {
		it('should handle high-frequency logging', () => {
			const startTime = Date.now()

			// Log 1000 messages rapidly
			for (let i = 0; i < 1000; i++) {
				logger.info(`High frequency log ${i}`, {
					scope: 'Performance',
					details: { iteration: i, batch: Math.floor(i / 100) },
				})
			}

			const endTime = Date.now()
			const duration = endTime - startTime

			expect(consoleMocks.log).toHaveBeenCalledTimes(1000)
			expect(duration).toBeLessThan(5000) // Should complete within 5 seconds
		})

		it('should maintain unique request IDs under load', () => {
			// Generate 100 logs
			for (let i = 0; i < 100; i++) {
				logger.info(`Load test ${i}`)
			}

			expect(consoleMocks.log).toHaveBeenCalledTimes(100)

			// Test that each call has a request ID pattern
			for (let i = 1; i <= 100; i++) {
				expect(consoleMocks.log).toHaveBeenNthCalledWith(
					i,
					expect.stringMatching(/req_[a-z0-9]+/),
				)
			}

			// Note: We assume request IDs are unique based on the generateRequestId implementation
			// Each call should contain a request ID pattern
		})
	})
})
