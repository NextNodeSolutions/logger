/**
 * Tests for NextNode Logger core functionality
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import { NextNodeLogger, createLogger, logger } from './logger.js'

import type { LoggerConfig } from './types.js'

describe('NextNodeLogger', () => {
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

	describe('constructor', () => {
		it('should create logger with default config', () => {
			const testLogger = new NextNodeLogger()
			expect(testLogger).toBeDefined()
		})

		it('should create logger with custom config', () => {
			const config: LoggerConfig = {
				prefix: '[TEST]',
				environment: 'production',
				includeLocation: false,
			}
			const testLogger = new NextNodeLogger(config)
			expect(testLogger).toBeDefined()
		})
	})

	describe('info logging', () => {
		it('should log info message', () => {
			const testLogger = new NextNodeLogger()
			testLogger.info('Test info message')

			expect(mockConsoleLog).toHaveBeenCalledOnce()
			const loggedMessage = mockConsoleLog.mock.calls[0]?.[0]
			expect(loggedMessage).toContain('Test info message')
		})

		it('should log info message with object', () => {
			const testLogger = new NextNodeLogger()
			testLogger.info('Test info', {
				status: 200,
				details: { userId: 123 },
			})

			expect(mockConsoleLog).toHaveBeenCalledOnce()
			const loggedMessage = mockConsoleLog.mock.calls[0]?.[0]
			expect(loggedMessage).toContain('Test info')
			expect(loggedMessage).toContain('200')
			expect(loggedMessage).toContain('123')
		})

		it('should log info message with scope', () => {
			const testLogger = new NextNodeLogger()
			testLogger.info('User logged in', {
				scope: 'Auth',
				details: { userId: 123 },
			})

			expect(mockConsoleLog).toHaveBeenCalledOnce()
			const loggedMessage = mockConsoleLog.mock.calls[0]?.[0]
			expect(loggedMessage).toContain('User logged in')
			expect(loggedMessage).toContain('Auth')
			expect(loggedMessage).toContain('123')
		})
	})

	describe('warning logging', () => {
		it('should log warning message', () => {
			const testLogger = new NextNodeLogger()
			testLogger.warning('Test warning message')

			expect(mockConsoleWarn).toHaveBeenCalledOnce()
			const loggedMessage = mockConsoleWarn.mock.calls[0]?.[0]
			expect(loggedMessage).toContain('Test warning message')
		})

		it('should log warning message with object', () => {
			const testLogger = new NextNodeLogger()
			testLogger.warning('Rate limit warning', {
				scope: 'API',
				status: 429,
				details: { limit: 1000, current: 1001 },
			})

			expect(mockConsoleWarn).toHaveBeenCalledOnce()
			const loggedMessage = mockConsoleWarn.mock.calls[0]?.[0]
			expect(loggedMessage).toContain('Rate limit warning')
			expect(loggedMessage).toContain('API')
			expect(loggedMessage).toContain('429')
		})
	})

	describe('error logging', () => {
		it('should log error message', () => {
			const testLogger = new NextNodeLogger()
			testLogger.error('Test error message')

			expect(mockConsoleError).toHaveBeenCalledOnce()
			const loggedMessage = mockConsoleError.mock.calls[0]?.[0]
			expect(loggedMessage).toContain('Test error message')
		})

		it('should log error message with object', () => {
			const testLogger = new NextNodeLogger()
			testLogger.error('Database error', {
				scope: 'Database',
				status: 500,
				details: {
					error: 'Connection timeout',
					host: 'localhost',
					retries: 3,
				},
			})

			expect(mockConsoleError).toHaveBeenCalledOnce()
			const loggedMessage = mockConsoleError.mock.calls[0]?.[0]
			expect(loggedMessage).toContain('Database error')
			expect(loggedMessage).toContain('Database')
			expect(loggedMessage).toContain('500')
			expect(loggedMessage).toContain('Connection timeout')
		})
	})

	describe('scope extraction', () => {
		it('should extract scope and clean object', () => {
			const testLogger = new NextNodeLogger()
			testLogger.info('Test message', {
				scope: 'TestScope',
				status: 200,
				details: { data: 'test' },
			})

			expect(mockConsoleLog).toHaveBeenCalledOnce()
			const loggedMessage = mockConsoleLog.mock.calls[0]?.[0]
			expect(loggedMessage).toContain('TestScope')
			expect(loggedMessage).toContain('200')
			expect(loggedMessage).toContain('test')
		})

		it('should handle object with only scope', () => {
			const testLogger = new NextNodeLogger()
			testLogger.info('Test message', { scope: 'OnlyScope' })

			expect(mockConsoleLog).toHaveBeenCalledOnce()
			const loggedMessage = mockConsoleLog.mock.calls[0]?.[0]
			expect(loggedMessage).toContain('OnlyScope')
		})

		it('should handle object without scope', () => {
			const testLogger = new NextNodeLogger()
			testLogger.info('Test message', {
				status: 200,
				details: { data: 'test' },
			})

			expect(mockConsoleLog).toHaveBeenCalledOnce()
			const loggedMessage = mockConsoleLog.mock.calls[0]?.[0]
			expect(loggedMessage).toContain('200')
			expect(loggedMessage).toContain('test')
		})
	})

	describe('prefix functionality', () => {
		it('should add prefix to messages', () => {
			const testLogger = new NextNodeLogger({ prefix: '[TEST]' })
			testLogger.info('Test message')

			expect(mockConsoleLog).toHaveBeenCalledOnce()
			const loggedMessage = mockConsoleLog.mock.calls[0]?.[0]
			expect(loggedMessage).toContain('[TEST] Test message')
		})

		it('should add prefix to all log levels', () => {
			const testLogger = new NextNodeLogger({ prefix: '[PREFIX]' })

			testLogger.info('Info message')
			testLogger.warning('Warning message')
			testLogger.error('Error message')

			expect(mockConsoleLog).toHaveBeenCalledOnce()
			expect(mockConsoleWarn).toHaveBeenCalledOnce()
			expect(mockConsoleError).toHaveBeenCalledOnce()

			const infoMessage = mockConsoleLog.mock.calls[0]?.[0]
			const warnMessage = mockConsoleWarn.mock.calls[0]?.[0]
			const errorMessage = mockConsoleError.mock.calls[0]?.[0]

			expect(infoMessage).toContain('[PREFIX] Info message')
			expect(warnMessage).toContain('[PREFIX] Warning message')
			expect(errorMessage).toContain('[PREFIX] Error message')
		})
	})

	describe('environment-specific behavior', () => {
		it('should format for development environment', () => {
			const testLogger = new NextNodeLogger({
				environment: 'development',
			})
			testLogger.info('Dev message')

			expect(mockConsoleLog).toHaveBeenCalledOnce()
			const loggedMessage = mockConsoleLog.mock.calls[0]?.[0]

			// Development format should include emojis
			expect(loggedMessage).toContain('🔵')
			expect(loggedMessage).toContain('INFO')
		})

		it('should format for production environment', () => {
			const testLogger = new NextNodeLogger({ environment: 'production' })
			testLogger.info('Prod message')

			expect(mockConsoleLog).toHaveBeenCalledOnce()
			const loggedMessage = mockConsoleLog.mock.calls[0]?.[0]

			// Production format should be JSON
			expect(() => JSON.parse(loggedMessage)).not.toThrow()
			const parsed = JSON.parse(loggedMessage)
			expect(parsed.level).toBe('info')
			expect(parsed.message).toBe('Prod message')
		})
	})

	describe('location handling', () => {
		it('should include location by default', () => {
			const testLogger = new NextNodeLogger()
			testLogger.info('Test message')

			expect(mockConsoleLog).toHaveBeenCalledOnce()
			const loggedMessage = mockConsoleLog.mock.calls[0]?.[0]

			// Should contain location information
			expect(loggedMessage).toMatch(/\([^)]+\)/)
		})

		it('should disable location when configured', () => {
			const testLogger = new NextNodeLogger({ includeLocation: false })
			testLogger.info('Test message')

			expect(mockConsoleLog).toHaveBeenCalledOnce()
			const loggedMessage = mockConsoleLog.mock.calls[0]?.[0]

			// Should contain disabled location
			expect(loggedMessage).toContain('disabled')
		})
	})

	describe('complex object handling', () => {
		it('should handle complex nested objects', () => {
			const testLogger = new NextNodeLogger()
			const complexObject = {
				scope: 'Complex',
				status: 200,
				details: {
					user: {
						id: 123,
						name: 'Test User',
						preferences: ['dark-mode', 'notifications'],
					},
					metadata: {
						timestamp: new Date().toISOString(),
						version: '1.0.0',
					},
				},
			}

			testLogger.info('Complex object test', complexObject)

			expect(mockConsoleLog).toHaveBeenCalledOnce()
			const loggedMessage = mockConsoleLog.mock.calls[0]?.[0]
			expect(loggedMessage).toContain('Complex')
			expect(loggedMessage).toContain('Test User')
			expect(loggedMessage).toContain('dark-mode')
		})

		it('should handle circular references', () => {
			const testLogger = new NextNodeLogger()
			const circularObj: Record<string, unknown> = { name: 'test' }
			circularObj.self = circularObj

			testLogger.info('Circular test', {
				scope: 'Test',
				details: circularObj,
			})

			expect(mockConsoleLog).toHaveBeenCalledOnce()
			// Should not throw and should handle circular reference
			const loggedMessage = mockConsoleLog.mock.calls[0]?.[0]
			expect(loggedMessage).toContain('Test')
		})
	})

	describe('request ID generation', () => {
		it('should include unique request IDs', () => {
			const testLogger = new NextNodeLogger()

			testLogger.info('First message')
			testLogger.info('Second message')

			expect(mockConsoleLog).toHaveBeenCalledTimes(2)

			const firstMessage = mockConsoleLog.mock.calls[0]?.[0]
			const secondMessage = mockConsoleLog.mock.calls[1]?.[0]

			// Both should have request IDs
			expect(firstMessage).toMatch(/req_[a-f0-9]{8}/)
			expect(secondMessage).toMatch(/req_[a-f0-9]{8}/)

			// Request IDs should be different
			const firstId = firstMessage.match(/req_[a-f0-9]{8}/)?.[0]
			const secondId = secondMessage.match(/req_[a-f0-9]{8}/)?.[0]
			expect(firstId).not.toBe(secondId)
		})
	})
})

describe('createLogger', () => {
	it('should create a new logger instance', () => {
		const testLogger = createLogger()
		expect(testLogger).toBeDefined()
		expect(typeof testLogger.info).toBe('function')
		expect(typeof testLogger.warning).toBe('function')
		expect(typeof testLogger.error).toBe('function')
	})

	it('should create logger with custom config', () => {
		const testLogger = createLogger({
			prefix: '[CUSTOM]',
			environment: 'production',
		})
		expect(testLogger).toBeDefined()
	})

	it('should create independent logger instances', () => {
		const logger1 = createLogger({ prefix: '[LOGGER1]' })
		const logger2 = createLogger({ prefix: '[LOGGER2]' })

		expect(logger1).not.toBe(logger2)
	})
})

describe('default logger', () => {
	it('should export a default logger instance', () => {
		expect(logger).toBeDefined()
		expect(typeof logger.info).toBe('function')
		expect(typeof logger.warning).toBe('function')
		expect(typeof logger.error).toBe('function')
	})

	it('should be usable immediately', () => {
		const mockConsoleLog = vi.fn()
		console.log = mockConsoleLog

		logger.info('Default logger test')

		expect(mockConsoleLog).toHaveBeenCalledOnce()
		const loggedMessage = mockConsoleLog.mock.calls[0]?.[0]
		expect(loggedMessage).toContain('Default logger test')
	})
})
