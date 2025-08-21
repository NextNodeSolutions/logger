/**
 * Core Logger class for NextNode Logger
 * Zero dependencies, strict TypeScript, production-ready logging with scope support
 */

import { parseLocation, detectEnvironment } from './location.js'
import { generateRequestId, getCurrentTimestamp } from './utils.js'
import { formatLogEntry } from './formatters.js'

import type {
	Logger,
	LogObject,
	LogEntry,
	LogLevel,
	LoggerConfig,
	Environment,
} from './types.js'

// Console methods mapping for type safety
const CONSOLE_METHODS = {
	info: 'log',
	warning: 'warn',
	error: 'error',
} as const

type ConsoleMethod = keyof Pick<Console, 'log' | 'warn' | 'error'>

export class NextNodeLogger implements Logger {
	private readonly environment: Environment
	private readonly prefix?: string | undefined
	private readonly includeLocation: boolean

	constructor(config: LoggerConfig = {}) {
		this.environment = config.environment ?? detectEnvironment()
		this.prefix = config.prefix
		this.includeLocation = config.includeLocation ?? true
	}

	private extractScope(object?: LogObject): {
		scope: string | undefined
		cleanObject: Omit<LogObject, 'scope'> | undefined
	} {
		if (!object) {
			return { scope: undefined, cleanObject: undefined }
		}

		const { scope, ...rest } = object

		// Only return cleanObject if there are properties other than scope
		const hasOtherProperties = Object.keys(rest).length > 0

		return {
			scope: scope ?? undefined,
			cleanObject: hasOtherProperties ? rest : undefined,
		}
	}

	private createLogEntry(
		level: LogLevel,
		message: string,
		object?: LogObject,
	): LogEntry {
		const { scope, cleanObject } = this.extractScope(object)

		// Add prefix to message if configured
		const finalMessage = this.prefix ? `${this.prefix} ${message}` : message

		return {
			level,
			message: finalMessage,
			timestamp: getCurrentTimestamp(),
			location: this.includeLocation
				? parseLocation(this.environment === 'production')
				: { function: 'disabled' },
			requestId: generateRequestId(),
			scope,
			object: cleanObject,
		}
	}

	private output(level: LogLevel, formattedMessage: string): void {
		const method = CONSOLE_METHODS[level] as ConsoleMethod
		console[method](formattedMessage)
	}

	private log(level: LogLevel, message: string, object?: LogObject): void {
		const entry = this.createLogEntry(level, message, object)
		const formattedMessage = formatLogEntry(entry, this.environment)
		this.output(level, formattedMessage)
	}

	info(message: string, object?: LogObject): void {
		this.log('info', message, object)
	}

	warning(message: string, object?: LogObject): void {
		this.log('warning', message, object)
	}

	error(message: string, object?: LogObject): void {
		this.log('error', message, object)
	}
}

// Factory function for creating logger instances
export const createLogger = (config?: LoggerConfig): Logger =>
	new NextNodeLogger(config)

// Default logger instance for immediate use
export const logger = createLogger()
