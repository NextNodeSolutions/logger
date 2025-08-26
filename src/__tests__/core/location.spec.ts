/**
 * Tests for NextNode Logger location parsing
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import { parseLocation, detectEnvironment } from '@/core/location.js'

import { createMockError, MOCK_STACKS } from '../test-setup.js'

describe('parseLocation', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	afterEach(() => {
		vi.unstubAllGlobals()
	})

	it('should parse location in development mode', () => {
		const mockStack = `Error
    at parseLocation (/path/to/location.ts:45:12)
    at testFunction (/path/to/test.ts:10:5)
    at Object.<anonymous> (/path/to/main.ts:25:8)`

		vi.stubGlobal(
			'Error',
			class MockError extends Error {
				override stack = mockStack
			} as ErrorConstructor,
		)

		const location = parseLocation(false)

		expect(location).toEqual({
			function: 'testFunction',
			file: 'test.ts',
			line: 10,
		})
	})

	it('should parse location in production mode (function only)', () => {
		vi.stubGlobal('Error', createMockError(MOCK_STACKS.simple))

		const location = parseLocation(true)

		expect(location).toEqual({
			function: 'testFunction',
		})
	})

	it('should handle anonymous functions', () => {
		vi.stubGlobal('Error', createMockError(MOCK_STACKS.anonymous))

		const location = parseLocation(false)

		expect(location).toEqual({
			function: 'anonymous',
			file: 'test.ts',
			line: 10,
		})
	})

	it('should handle object methods', () => {
		vi.stubGlobal('Error', createMockError(MOCK_STACKS.objectMethod))

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

		vi.stubGlobal('Error', createMockError(mockStack))

		const location = parseLocation(false)

		expect(location).toEqual({
			function: 'userFunction',
			file: 'app.ts',
			line: 30,
		})
	})

	it('should skip node_modules', () => {
		vi.stubGlobal('Error', createMockError(MOCK_STACKS.withNodeModules))

		const location = parseLocation(false)

		expect(location).toEqual({
			function: 'userFunction',
			file: 'app.ts',
			line: 30,
		})
	})

	it('should handle Windows-style paths', () => {
		vi.stubGlobal('Error', createMockError(MOCK_STACKS.windows))

		const location = parseLocation(false)

		// The parser should extract just the filename from the full Windows path
		expect(location).toEqual({
			function: 'testFunction',
			file: 'test.ts',
			line: 10,
		})
	})

	it('should provide fallback when stack parsing fails', () => {
		vi.stubGlobal('Error', createMockError(MOCK_STACKS.invalid))

		const location = parseLocation(false)

		expect(location).toEqual({
			function: 'unknown',
			file: 'unknown',
			line: 0,
		})
	})

	it('should provide fallback in production when stack parsing fails', () => {
		vi.stubGlobal('Error', createMockError(MOCK_STACKS.invalid))

		const location = parseLocation(true)

		expect(location).toEqual({
			function: 'unknown',
		})
	})

	it('should handle missing stack trace', () => {
		vi.stubGlobal('Error', createMockError(MOCK_STACKS.empty))

		const location = parseLocation(false)

		expect(location).toEqual({
			function: 'unknown',
			file: 'unknown',
			line: 0,
		})
	})

	it('should handle Error constructor throwing', () => {
		// Mock Error constructor that throws
		vi.stubGlobal(
			'Error',
			vi.fn().mockImplementation(() => {
				throw new Error('Error constructor failed')
			}),
		)

		const location = parseLocation(false)

		expect(location).toEqual({
			function: 'unknown',
			file: 'unknown',
			line: 0,
		})
	})

	it('should handle file path with no separators', () => {
		const mockStack = `Error
    at parseLocation (/path/to/location.ts:45:12)
    at testFunction (simplefilename:10:5)
    at Object.<anonymous> (/path/to/main.ts:25:8)`

		vi.stubGlobal('Error', createMockError(mockStack))

		const location = parseLocation(false)

		// When there are no path separators, should use the full path as filename
		expect(location).toEqual({
			function: 'testFunction',
			file: 'simplefilename',
			line: 10,
		})
	})

	it('should handle production fallback when parsing fails', () => {
		// Mock Error constructor to throw when called
		vi.stubGlobal(
			'Error',
			vi.fn().mockImplementation(() => {
				throw new Error('Stack parsing failed')
			}),
		)

		const location = parseLocation(true) // production mode

		expect(location).toEqual({
			function: 'unknown',
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
