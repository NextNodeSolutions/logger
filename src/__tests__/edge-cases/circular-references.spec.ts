/**
 * Tests for edge cases: circular references, large objects, etc.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'

import { createLogger } from '@/core/logger.js'
import { safeStringify } from '@/utils/serialization.js'

import {
	createConsoleMocks,
	restoreConsoleMocks,
	type ConsoleMocks,
} from '../test-setup.js'

describe('Edge Cases', () => {
	let consoleMocks: ConsoleMocks

	beforeEach(() => {
		consoleMocks = createConsoleMocks()
	})

	afterEach(() => {
		restoreConsoleMocks(consoleMocks)
	})

	describe('Circular References', () => {
		it('should handle circular references in log objects', () => {
			const logger = createLogger({ environment: 'production' })

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const circular: any = { name: 'test' }
			circular.self = circular
			circular.nested = { parent: circular }

			expect(() => {
				logger.info('Testing circular reference', { details: circular })
			}).not.toThrow()

			// Transport might fail silently with circular refs to avoid infinite loops
			// The important part is that the logger itself doesn't crash
		})

		it('should handle deeply nested circular references', () => {
			const logger = createLogger({ environment: 'development' })

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const obj: any = {
				level1: {
					level2: {
						level3: {
							level4: {},
						},
					},
				},
			}
			obj.level1.level2.level3.level4.backToRoot = obj

			expect(() => {
				logger.warn('Deep circular reference', { details: obj })
			}).not.toThrow()

			expect(consoleMocks.warn).toHaveBeenCalled()
		})

		it('should handle mutual circular references', () => {
			const logger = createLogger({ environment: 'production' })

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const obj1: any = { name: 'obj1' }
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const obj2: any = { name: 'obj2' }
			obj1.ref = obj2
			obj2.ref = obj1

			expect(() => {
				logger.error('Mutual circular reference', {
					details: { obj1, obj2 },
				})
			}).not.toThrow()

			// Transport might fail silently with circular refs
			// Main goal is ensuring no application crash
		})
	})

	describe('Large Objects', () => {
		it('should handle very large objects', () => {
			const logger = createLogger({ environment: 'production' })

			const largeObject = {
				users: Array.from({ length: 10000 }, (_, i) => ({
					id: i,
					name: `User ${i}`,
					email: `user${i}@example.com`,
					data: 'x'.repeat(100), // 100 chars per user
					nested: {
						preferences: {
							theme: 'dark',
							notifications: true,
							metadata: Array.from({ length: 10 }, () =>
								Math.random(),
							),
						},
					},
				})),
			}

			expect(() => {
				logger.info('Large object test', { details: largeObject })
			}).not.toThrow()

			expect(consoleMocks.log).toHaveBeenCalled()
		})

		it('should handle objects with very deep nesting', () => {
			const logger = createLogger({ environment: 'development' })

			// Create deeply nested object (50 levels)
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const deepObject: any = { level: 0, value: 'start' }
			let current = deepObject

			for (let i = 1; i < 50; i++) {
				current.next = { level: i, value: `level-${i}` }
				current = current.next
			}

			expect(() => {
				logger.info('Deep nesting test', { details: deepObject })
			}).not.toThrow()

			expect(consoleMocks.log).toHaveBeenCalled()
		})
	})

	describe('Special Values', () => {
		it('should handle undefined and null values', () => {
			const logger = createLogger({ environment: 'production' })

			const testObject = {
				nullValue: null,
				undefinedValue: undefined,
				emptyString: '',
				zero: 0,
				false: false,
			}

			expect(() => {
				logger.info('Special values test', { details: testObject })
			}).not.toThrow()

			expect(consoleMocks.log).toHaveBeenCalled()

			const output = consoleMocks.log.mock.calls[0]?.[0] as string
			const parsed = JSON.parse(output)

			expect(parsed.object.details.nullValue).toBe(null)
			expect(parsed.object.details.emptyString).toBe('')
			expect(parsed.object.details.zero).toBe(0)
			expect(parsed.object.details.false).toBe(false)
			// undefined should be excluded from JSON
			expect('undefinedValue' in parsed.object.details).toBe(false)
		})

		it('should handle functions and symbols', () => {
			const logger = createLogger({ environment: 'production' })

			const sym = Symbol('test')
			const testObject = {
				func: (): string => 'test',
				symbol: sym,
				date: new Date('2024-01-01T00:00:00.000Z'),
				regex: /test/g,
				map: new Map([['key', 'value']]),
				set: new Set([1, 2, 3]),
			}

			expect(() => {
				logger.info('Complex types test', { details: testObject })
			}).not.toThrow()

			expect(consoleMocks.log).toHaveBeenCalled()
		})

		it('should handle Error objects', () => {
			const logger = createLogger({ environment: 'production' })

			const error = new Error('Test error')
			error.stack = 'Error: Test error\n    at test (test.js:1:1)'

			const customError = new Error('Custom error')
			// @ts-expect-error - Adding custom properties to Error
			customError.code = 'CUSTOM_ERROR'
			// @ts-expect-error - Adding custom properties to Error
			customError.metadata = { userId: '123', action: 'test' }

			expect(() => {
				logger.error('Error handling test', {
					details: { error, customError },
				})
			}).not.toThrow()

			expect(consoleMocks.error).toHaveBeenCalled()
		})
	})

	describe('Safe Stringify Utility', () => {
		it('should handle circular references in safeStringify', () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const circular: any = { name: 'test' }
			circular.self = circular

			const result = safeStringify(circular)

			expect(() => JSON.parse(result)).not.toThrow()
			expect(result).toContain('"name"')
			expect(result).toContain('"test"')
		})

		it('should handle very deep objects in safeStringify', () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const deepObject: any = { level: 0 }
			let current = deepObject

			// Create 100 levels deep
			for (let i = 1; i < 100; i++) {
				current.next = { level: i }
				current = current.next
			}

			expect(() => {
				const result = safeStringify(deepObject)
				JSON.parse(result)
			}).not.toThrow()
		})

		it('should preserve order of object keys', () => {
			const orderedObject = {
				z: 'last',
				a: 'first',
				m: 'middle',
			}

			const result = safeStringify(orderedObject)

			// The order should be preserved in the JSON string
			expect(result.indexOf('"z"')).toBeLessThan(result.indexOf('"a"'))
			expect(result.indexOf('"a"')).toBeLessThan(result.indexOf('"m"'))
		})
	})
})
