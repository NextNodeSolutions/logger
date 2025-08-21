/**
 * Integration tests for NextNode Logger
 * Testing the public API and end-to-end functionality
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import {
	logger,
	createLogger,
	generateRequestId,
	safeStringify,
	getCurrentTimestamp,
	detectEnvironment,
	parseLocation,
} from './index.js'

describe('NextNode Logger Integration', () => {
	// Mock console methods
	const originalConsole = { ...console }
	const mockConsoleLog = vi.fn()
	const mockConsoleWarn = vi.fn()
	const mockConsoleError = vi.fn()

	beforeEach(() => {
		console.log = mockConsoleLog
		console.warn = mockConsoleWarn
		console.error = mockConsoleError
		vi.clearAllMocks()
	})

	afterEach(() => {
		console.log = originalConsole.log
		console.warn = originalConsole.warn
		console.error = originalConsole.error
	})

	describe('Public API exports', () => {
		it('should export logger instance', () => {
			expect(logger).toBeDefined()
			expect(typeof logger.info).toBe('function')
			expect(typeof logger.warning).toBe('function')
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
			authLogger.warning('Login failed', {
				scope: 'Auth',
				status: 401,
				details: {
					email: 'user@example.com',
					reason: 'Invalid password',
				},
			})

			expect(mockConsoleLog).toHaveBeenCalledTimes(2)
			expect(mockConsoleWarn).toHaveBeenCalledTimes(1)

			const loginAttempt = mockConsoleLog.mock.calls[0]?.[0]
			const loginSuccess = mockConsoleLog.mock.calls[1]?.[0]
			const loginFailed = mockConsoleWarn.mock.calls[0]?.[0]

			expect(loginAttempt).toContain('[AUTH] Login attempt')
			expect(loginAttempt).toContain('[Auth]')
			expect(loginAttempt).toContain('user@example.com')

			expect(loginSuccess).toContain('[AUTH] Login successful')
			expect(loginSuccess).toContain('200')
			expect(loginSuccess).toContain('123')

			expect(loginFailed).toContain('[AUTH] Login failed')
			expect(loginFailed).toContain('401')
			expect(loginFailed).toContain('Invalid password')
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
			dbLogger.warning('Slow query detected', {
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

			expect(mockConsoleLog).toHaveBeenCalledTimes(1)
			expect(mockConsoleWarn).toHaveBeenCalledTimes(1)
			expect(mockConsoleError).toHaveBeenCalledTimes(1)

			const queryLog = mockConsoleLog.mock.calls[0]?.[0]
			const slowQueryLog = mockConsoleWarn.mock.calls[0]?.[0]
			const errorLog = mockConsoleError.mock.calls[0]?.[0]

			expect(queryLog).toContain('[Database]')
			expect(queryLog).toContain('45')
			expect(queryLog).toContain('150')

			expect(slowQueryLog).toContain('Slow query')
			expect(slowQueryLog).toContain('2500')

			expect(errorLog).toContain('Connection timeout')
			expect(errorLog).toContain('500')
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

			expect(mockConsoleLog).toHaveBeenCalledTimes(2)
			expect(mockConsoleError).toHaveBeenCalledTimes(1)

			const requestLog = mockConsoleLog.mock.calls[0]?.[0]
			const responseLog = mockConsoleLog.mock.calls[1]?.[0]
			const validationLog = mockConsoleError.mock.calls[0]?.[0]

			expect(requestLog).toContain('POST')
			expect(requestLog).toContain('/api/users')

			expect(validationLog).toContain('Email is required')
			expect(validationLog).toContain('400')

			expect(responseLog).toContain('201')
			expect(responseLog).toContain('456')
			expect(responseLog).toContain('120')
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

			expect(mockConsoleLog).toHaveBeenCalledOnce()
			const loggedMessage = mockConsoleLog.mock.calls[0]?.[0]
			expect(loggedMessage).toContain('John Doe')
			expect(loggedMessage).toContain('New York')
			expect(loggedMessage).toContain('notifications')
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

			expect(mockConsoleLog).toHaveBeenCalledOnce()
			// Should not throw and should handle all types
			const loggedMessage = mockConsoleLog.mock.calls[0]?.[0]
			expect(loggedMessage).toContain('test string')
			expect(loggedMessage).toContain('42')
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

			expect(mockConsoleLog).toHaveBeenCalledOnce()
			const loggedMessage = mockConsoleLog.mock.calls[0]?.[0]
			expect(loggedMessage).toContain('Function')
			expect(loggedMessage).toContain('test')
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

			expect(mockConsoleLog).toHaveBeenCalledTimes(4)

			const emptyLog = mockConsoleLog.mock.calls[0]?.[0]
			const scopeLog = mockConsoleLog.mock.calls[1]?.[0]
			const statusLog = mockConsoleLog.mock.calls[2]?.[0]
			const detailsLog = mockConsoleLog.mock.calls[3]?.[0]

			expect(emptyLog).toContain('Empty object')
			expect(scopeLog).toContain('[MinimalTest]')
			expect(statusLog).toContain('200')
			expect(detailsLog).toContain('simple string')
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

			expect(mockConsoleLog).toHaveBeenCalledTimes(2)

			const devMessage = mockConsoleLog.mock.calls[0]?.[0]
			const prodMessage = mockConsoleLog.mock.calls[1]?.[0]

			// Development should have emojis and colors
			expect(devMessage).toContain('🔵')
			expect(devMessage).toContain('[Environment]')

			// Production should be valid JSON
			expect(() => JSON.parse(prodMessage)).not.toThrow()
			const parsed = JSON.parse(prodMessage)
			expect(parsed.scope).toBe('Environment')
			expect(parsed.message).toBe('Production test')
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

			expect(mockConsoleLog).toHaveBeenCalledTimes(1000)
			expect(duration).toBeLessThan(5000) // Should complete within 5 seconds
		})

		it('should maintain unique request IDs under load', () => {
			const requestIds = new Set<string>()

			// Generate 100 logs and extract request IDs
			for (let i = 0; i < 100; i++) {
				logger.info(`Load test ${i}`)
			}

			expect(mockConsoleLog).toHaveBeenCalledTimes(100)

			// Extract request IDs from logs
			mockConsoleLog.mock.calls.forEach(call => {
				const message = call[0]
				if (typeof message === 'string') {
					const match = message.match(/req_[a-f0-9]{8}/)
					if (match?.[0]) {
						requestIds.add(match[0])
					}
				}
			})

			// All request IDs should be unique
			expect(requestIds.size).toBe(100)
		})
	})
})
