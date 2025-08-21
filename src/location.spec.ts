/**
 * Tests for NextNode Logger location parsing
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import { parseLocation, detectEnvironment } from './location.js'

describe('parseLocation', () => {
	// Mock Error to control stack traces
	const originalError = global.Error

	beforeEach(() => {
		vi.clearAllMocks()
	})

	afterEach(() => {
		global.Error = originalError
	})

	it('should parse location in development mode', () => {
		const mockStack = `Error
    at parseLocation (/path/to/location.ts:45:12)
    at testFunction (/path/to/test.ts:10:5)
    at Object.<anonymous> (/path/to/main.ts:25:8)`

		global.Error = class MockError extends Error {
			override stack = mockStack
		} as ErrorConstructor

		const location = parseLocation(false)

		expect(location).toEqual({
			function: 'testFunction',
			file: 'test.ts',
			line: 10,
		})
	})

	it('should parse location in production mode (function only)', () => {
		const mockStack = `Error
    at parseLocation (/path/to/location.ts:45:12)
    at testFunction (/path/to/test.ts:10:5)
    at Object.<anonymous> (/path/to/main.ts:25:8)`

		global.Error = class MockError extends Error {
			override stack = mockStack
		} as ErrorConstructor

		const location = parseLocation(true)

		expect(location).toEqual({
			function: 'testFunction',
		})
	})

	it('should handle anonymous functions', () => {
		const mockStack = `Error
    at parseLocation (/path/to/location.ts:45:12)
    at <anonymous> (/path/to/test.ts:10:5)`

		global.Error = class MockError extends Error {
			override stack = mockStack
		} as ErrorConstructor

		const location = parseLocation(false)

		expect(location).toEqual({
			function: 'anonymous',
			file: 'test.ts',
			line: 10,
		})
	})

	it('should handle object methods', () => {
		const mockStack = `Error
    at parseLocation (/path/to/location.ts:45:12)
    at Object.methodName (/path/to/test.ts:15:3)`

		global.Error = class MockError extends Error {
			override stack = mockStack
		} as ErrorConstructor

		const location = parseLocation(false)

		expect(location).toEqual({
			function: 'methodName',
			file: 'test.ts',
			line: 15,
		})
	})

	it('should skip internal logger files', () => {
		const mockStack = `Error
    at parseLocation (/path/to/location.ts:45:12)
    at log (/path/to/logger.ts:80:5)
    at info (/path/to/logger.ts:120:8)
    at userFunction (/path/to/app.ts:30:2)`

		global.Error = class MockError extends Error {
			override stack = mockStack
		} as ErrorConstructor

		const location = parseLocation(false)

		expect(location).toEqual({
			function: 'userFunction',
			file: 'app.ts',
			line: 30,
		})
	})

	it('should skip node_modules', () => {
		const mockStack = `Error
    at parseLocation (/path/to/location.ts:45:12)
    at someLibFunction (/path/to/node_modules/lib/index.js:100:5)
    at userFunction (/path/to/app.ts:30:2)`

		global.Error = class MockError extends Error {
			override stack = mockStack
		} as ErrorConstructor

		const location = parseLocation(false)

		expect(location).toEqual({
			function: 'userFunction',
			file: 'app.ts',
			line: 30,
		})
	})

	it('should handle Windows-style paths', () => {
		const mockStack = `Error
    at parseLocation (C:\\path\\to\\location.ts:45:12)
    at testFunction (C:\\path\\to\\test.ts:10:5)`

		global.Error = class MockError extends Error {
			override stack = mockStack
		} as ErrorConstructor

		const location = parseLocation(false)

		// The parser should extract just the filename from the full Windows path
		expect(location).toEqual({
			function: 'testFunction',
			file: 'test.ts',
			line: 10,
		})
	})

	it('should provide fallback when stack parsing fails', () => {
		global.Error = class MockError extends Error {
			override stack = 'Invalid stack trace format'
		} as ErrorConstructor

		const location = parseLocation(false)

		expect(location).toEqual({
			function: 'unknown',
			file: 'unknown',
			line: 0,
		})
	})

	it('should provide fallback in production when stack parsing fails', () => {
		global.Error = class MockError extends Error {
			override stack = 'Invalid stack trace format'
		} as ErrorConstructor

		const location = parseLocation(true)

		expect(location).toEqual({
			function: 'unknown',
		})
	})

	it('should handle missing stack trace', () => {
		global.Error = class MockError extends Error {
			override stack = ''
		} as ErrorConstructor

		const location = parseLocation(false)

		expect(location).toEqual({
			function: 'unknown',
			file: 'unknown',
			line: 0,
		})
	})

	it('should handle Error constructor throwing', () => {
		// Mock Error constructor that throws
		global.Error = vi.fn().mockImplementation(() => {
			throw new originalError('Error constructor failed')
		}) as unknown as ErrorConstructor

		const location = parseLocation(false)

		expect(location).toEqual({
			function: 'unknown',
			file: 'unknown',
			line: 0,
		})
	})
})

describe('detectEnvironment', () => {
	const originalEnv = process.env

	beforeEach(() => {
		process.env = { ...originalEnv }
	})

	afterEach(() => {
		process.env = originalEnv
	})

	it('should detect production from NODE_ENV=production', () => {
		process.env.NODE_ENV = 'production'
		expect(detectEnvironment()).toBe('production')
	})

	it('should detect production from NODE_ENV=prod', () => {
		process.env.NODE_ENV = 'prod'
		expect(detectEnvironment()).toBe('production')
	})

	it('should detect development from NODE_ENV=development', () => {
		process.env.NODE_ENV = 'development'
		expect(detectEnvironment()).toBe('development')
	})

	it('should detect development from NODE_ENV=dev', () => {
		process.env.NODE_ENV = 'dev'
		expect(detectEnvironment()).toBe('development')
	})

	it('should default to development when NODE_ENV is not set', () => {
		delete process.env.NODE_ENV
		expect(detectEnvironment()).toBe('development')
	})

	it('should default to development for unknown NODE_ENV values', () => {
		process.env.NODE_ENV = 'staging'
		expect(detectEnvironment()).toBe('development')
	})

	it('should default to development for empty NODE_ENV', () => {
		process.env.NODE_ENV = ''
		expect(detectEnvironment()).toBe('development')
	})
})
