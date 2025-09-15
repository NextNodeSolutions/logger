/**
 * HTTP Transport for NextNode Logger
 * Sends logs to HTTP endpoints (DataDog, Splunk, custom endpoints, etc.)
 */

import type { LogEntry, Transport } from '../types.js'

export interface HTTPTransportConfig {
	readonly url: string
	readonly method?: 'POST' | 'PUT' | 'PATCH'
	readonly headers?: Record<string, string>
	readonly timeout?: number
	readonly retries?: number
	readonly batchSize?: number // Number of logs to batch together
	readonly flushInterval?: number // Milliseconds between batch flushes
	readonly transformEntry?: (entry: LogEntry) => unknown // Custom log transformation
}

interface BatchState {
	entries: LogEntry[]
	timer: NodeJS.Timeout | number | null
}

export class HTTPTransport implements Transport {
	readonly name = 'http'
	private readonly config: {
		readonly url: string
		readonly method: 'POST' | 'PUT' | 'PATCH'
		readonly timeout: number
		readonly retries: number
		readonly batchSize: number
		readonly flushInterval: number
		readonly headers?: Record<string, string>
		readonly transformEntry?: (entry: LogEntry) => unknown
	}
	private batchState: BatchState = { entries: [], timer: null }

	constructor(config: HTTPTransportConfig) {
		this.config = {
			url: config.url,
			method: config.method ?? 'POST',
			timeout: config.timeout ?? 30000, // 30 seconds
			retries: config.retries ?? 3,
			batchSize: config.batchSize ?? 10,
			flushInterval: config.flushInterval ?? 5000, // 5 seconds
			...(config.headers && { headers: config.headers }),
			...(config.transformEntry && {
				transformEntry: config.transformEntry,
			}),
		}
	}

	async write(entry: LogEntry): Promise<void> {
		this.batchState.entries.push(entry)

		// Schedule flush if not already scheduled
		if (!this.batchState.timer) {
			this.batchState.timer = setTimeout(() => {
				this.flushBatch().catch(() => {
					// Log transport errors are swallowed to prevent infinite loops
				})
			}, this.config.flushInterval)
		}

		// Flush immediately if batch is full
		if (this.batchState.entries.length >= this.config.batchSize) {
			await this.flushBatch()
		}
	}

	async flush(): Promise<void> {
		if (this.batchState.timer) {
			clearTimeout(this.batchState.timer as NodeJS.Timeout)
			this.batchState.timer = null
		}
		await this.flushBatch()
	}

	async close(): Promise<void> {
		await this.flush()
	}

	private async flushBatch(): Promise<void> {
		if (this.batchState.entries.length === 0) return

		const entries = [...this.batchState.entries]
		this.batchState = { entries: [], timer: null }

		await this.sendLogs(entries)
	}

	private async sendLogs(entries: LogEntry[]): Promise<void> {
		const payload = entries.map(entry =>
			this.config.transformEntry
				? this.config.transformEntry(entry)
				: entry,
		)

		const body = JSON.stringify({
			logs: payload,
			timestamp: new Date().toISOString(),
			count: entries.length,
		})

		const headers: Record<string, string> = {
			'Content-Type': 'application/json',
			'User-Agent': '@nextnode/logger',
			...this.config.headers,
		}

		await this.sendWithRetry({
			method: this.config.method,
			headers,
			body,
		})
	}

	private async sendWithRetry(options: {
		method: string
		headers: Record<string, string>
		body: string
	}): Promise<void> {
		let lastError: Error | null = null

		for (let attempt = 0; attempt <= this.config.retries; attempt++) {
			try {
				const controller = new AbortController()
				const timeoutId = setTimeout(
					() => controller.abort(),
					this.config.timeout,
				)

				const response = await fetch(this.config.url, {
					method: options.method,
					headers: options.headers,
					body: options.body,
					signal: controller.signal,
				})

				clearTimeout(timeoutId)

				if (!response.ok) {
					throw new Error(
						`HTTP ${response.status}: ${response.statusText}`,
					)
				}

				return // Success
			} catch (error) {
				lastError =
					error instanceof Error ? error : new Error(String(error))

				// Wait before retry (exponential backoff)
				if (attempt < this.config.retries) {
					const delay = Math.min(1000 * Math.pow(2, attempt), 30000) // Max 30s
					await new Promise(resolve => setTimeout(resolve, delay))
				}
			}
		}

		// All retries failed
		throw lastError || new Error('HTTP transport failed after retries')
	}
}

// Convenience factory for common services
export const createDataDogTransport = (config: {
	apiKey: string
	service?: string
	environment?: string
	source?: string
	tags?: string[]
}): HTTPTransport =>
	new HTTPTransport({
		url: 'https://http-intake.logs.datadoghq.com/v1/input/' + config.apiKey,
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		transformEntry: entry => ({
			timestamp: entry.timestamp,
			level: entry.level,
			message: entry.message,
			service: config.service ?? 'nextnode-logger',
			ddsource: config.source ?? 'nodejs',
			ddtags: config.tags?.join(','),
			environment: config.environment ?? 'production',
			logger: {
				name: 'nextnode-logger',
				method: entry.location.function,
				thread_name: 'main',
			},
			...entry.object,
		}),
	})
