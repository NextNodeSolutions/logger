/**
 * Console Transport for NextNode Logger
 * Default transport implementation for console output
 */

import { formatLogEntry } from '../core/formatters.js'

import type { LogEntry, LogLevel, Environment, Transport } from '../types.js'

// Console methods mapping for type safety
const CONSOLE_METHODS = {
	info: 'log',
	warn: 'warn',
	error: 'error',
} as const

type ConsoleMethod = keyof Pick<Console, 'log' | 'warn' | 'error'>

export interface ConsoleTransportConfig {
	readonly environment?: Environment
	readonly colors?: boolean // Enable/disable colors (auto-detect if not specified)
}

export class ConsoleTransport implements Transport {
	readonly name = 'console'
	private readonly environment: Environment
	private readonly colors: boolean

	constructor(config: ConsoleTransportConfig = {}) {
		this.environment = config.environment ?? 'development'
		this.colors = config.colors ?? this.shouldUseColors()
	}

	private shouldUseColors(): boolean {
		// Disable colors in CI environments or when NO_COLOR is set
		if (process.env['NO_COLOR'] || process.env['CI']) {
			return false
		}

		// Enable colors in development by default
		return this.environment === 'development'
	}

	write(entry: LogEntry): void {
		const method = CONSOLE_METHODS[entry.level as LogLevel] as ConsoleMethod

		// Use custom environment for formatting if colors disabled
		const formatEnvironment = this.colors ? this.environment : 'production'
		const formattedMessage = formatLogEntry(entry, formatEnvironment)

		console[method](formattedMessage)
	}
}
