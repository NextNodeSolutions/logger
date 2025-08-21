/**
 * Test setup utilities for NextNode Logger
 * Provides reusable mocking utilities for Vitest tests
 */

import { vi, type MockInstance } from 'vitest'

/**
 * Console mocking utilities
 */
export interface ConsoleMocks {
	log: MockInstance
	warn: MockInstance
	error: MockInstance
}

/**
 * Create console mocks using vi.spyOn()
 */
export const createConsoleMocks = (): ConsoleMocks => ({
	log: vi.spyOn(console, 'log').mockImplementation(() => {}),
	warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
	error: vi.spyOn(console, 'error').mockImplementation(() => {}),
})

/**
 * Restore console mocks
 */
export const restoreConsoleMocks = (mocks: ConsoleMocks): void => {
	mocks.log.mockRestore()
	mocks.warn.mockRestore()
	mocks.error.mockRestore()
}


/**
 * Mock Error class for stack trace testing
 */
export const createMockError = (stack: string): ErrorConstructor => class MockError extends Error {
		override stack = stack
	} as ErrorConstructor

/**
 * Common stack trace patterns for testing
 */
export const MOCK_STACKS = {
	simple: `Error
    at parseLocation (/path/to/location.ts:45:12)
    at testFunction (/path/to/test.ts:10:5)
    at Object.<anonymous> (/path/to/main.ts:25:8)`,
	
	anonymous: `Error
    at parseLocation (/path/to/location.ts:45:12)
    at <anonymous> (/path/to/test.ts:10:5)`,
	
	objectMethod: `Error
    at parseLocation (/path/to/location.ts:45:12)
    at Object.methodName (/path/to/test.ts:15:3)`,
	
	withNodeModules: `Error
    at parseLocation (/path/to/location.ts:45:12)
    at someLibFunction (/path/to/node_modules/lib/index.js:100:5)
    at userFunction (/path/to/app.ts:30:2)`,
	
	windows: `Error
    at parseLocation (C:\\path\\to\\location.ts:45:12)
    at testFunction (C:\\path\\to\\test.ts:10:5)`,
	
	invalid: 'Invalid stack trace format',
	
	empty: ''
}

