/**
 * Core Logger class for NextNode Logger
 * Zero dependencies, strict TypeScript, production-ready logging with scope support
 */

import { parseLocation, detectEnvironment } from './location.js'
import { generateRequestId } from '../utils/crypto.js'
import { getCurrentTimestamp } from '../utils/time.js'
import { formatLogEntry } from './formatters.js'
import { isLazyMessage } from '../types.js'

import type {
	Logger,
	LogObject,
	LogEntry,
	LogLevel,
	LoggerConfig,
	LazyMessage,
	BatchConfig,
	Environment,
} from '../types.js'

// Console methods mapping for type safety
const CONSOLE_METHODS = {
	info: 'log',
	warn: 'warn',
	error: 'error',
} as const

type ConsoleMethod = keyof Pick<Console, 'log' | 'warn' | 'error'>

// Batch state management
interface BatchState {
	readonly buffer: LogEntry[]
	readonly timer: NodeJS.Timeout | number | null
	readonly firstEntryTime: number | null
}

export class NextNodeLogger implements Logger {
	private readonly environment: Environment
	private readonly prefix?: string | undefined
	private readonly includeLocation: boolean
	private readonly batchConfig: BatchConfig
	private batchState: BatchState

	constructor(config: LoggerConfig = {}) {
		this.environment = config.environment ?? detectEnvironment()
		this.prefix = config.prefix
		this.includeLocation = config.includeLocation ?? true

		// Default batch configuration
		this.batchConfig = {
			enabled: config.batch?.enabled ?? false,
			maxSize: config.batch?.maxSize ?? 100,
			flushInterval: config.batch?.flushInterval ?? 1000, // 1 second
			maxDelay: config.batch?.maxDelay ?? 5000, // 5 seconds max
		}

		this.batchState = {
			buffer: [],
			timer: null,
			firstEntryTime: null,
		}
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

	private resolveMessage(message: string | LazyMessage): string {
		return isLazyMessage(message) ? message() : message
	}

	private createLogEntry(
		level: LogLevel,
		message: string | LazyMessage,
		object?: LogObject,
	): LogEntry {
		const { scope, cleanObject } = this.extractScope(object)

		// Resolve lazy message and add prefix if configured
		const resolvedMessage = this.resolveMessage(message)
		const finalMessage = this.prefix
			? `${this.prefix} ${resolvedMessage}`
			: resolvedMessage

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

	private flushBatch(): void {
		if (this.batchState.buffer.length === 0) return

		// Process all buffered entries
		for (const entry of this.batchState.buffer) {
			const formattedMessage = formatLogEntry(entry, this.environment)
			this.output(entry.level, formattedMessage)
		}

		// Reset batch state
		this.batchState = {
			buffer: [],
			timer: null,
			firstEntryTime: null,
		}
	}

	private scheduleBatchFlush(): void {
		if (this.batchState.timer) return // Already scheduled

		const timer = setTimeout(() => {
			this.flushBatch()
		}, this.batchConfig.flushInterval)

		this.batchState = {
			...this.batchState,
			timer,
		}
	}

	private shouldFlushBatch(): boolean {
		const now = Date.now()

		// Flush if buffer is at max size
		if (this.batchState.buffer.length >= this.batchConfig.maxSize) {
			return true
		}

		// Flush if max delay exceeded
		if (
			this.batchState.firstEntryTime &&
			now - this.batchState.firstEntryTime >= this.batchConfig.maxDelay
		) {
			return true
		}

		return false
	}

	private log(
		level: LogLevel,
		message: string | LazyMessage,
		object?: LogObject,
	): void {
		const entry = this.createLogEntry(level, message, object)

		if (!this.batchConfig.enabled) {
			// Immediate logging (current behavior)
			const formattedMessage = formatLogEntry(entry, this.environment)
			this.output(level, formattedMessage)
			return
		}

		// Batch logging
		const now = Date.now()

		// Update batch state with new entry
		this.batchState = {
			buffer: [...this.batchState.buffer, entry],
			timer: this.batchState.timer,
			firstEntryTime: this.batchState.firstEntryTime ?? now,
		}

		// Check if we should flush immediately
		if (this.shouldFlushBatch()) {
			// Clear any pending timer
			if (this.batchState.timer) {
				clearTimeout(this.batchState.timer as NodeJS.Timeout)
			}
			this.flushBatch()
		} else {
			// Schedule flush if not already scheduled
			this.scheduleBatchFlush()
		}
	}

	info(message: string | LazyMessage, object?: LogObject): void {
		this.log('info', message, object)
	}

	warn(message: string | LazyMessage, object?: LogObject): void {
		this.log('warn', message, object)
	}

	error(message: string | LazyMessage, object?: LogObject): void {
		this.log('error', message, object)
	}

	flush(): void {
		if (this.batchState.timer) {
			clearTimeout(this.batchState.timer as NodeJS.Timeout)
		}
		this.flushBatch()
	}
}

// Factory function for creating logger instances
export const createLogger = (config?: LoggerConfig): Logger =>
	new NextNodeLogger(config)

// Default logger instance for immediate use
export const logger = createLogger()
