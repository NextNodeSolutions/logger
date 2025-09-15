/**
 * File Transport for NextNode Logger
 * Writes logs to files with automatic rotation support
 */

import * as fs from 'node:fs/promises'
import * as path from 'node:path'

import { formatLogEntry } from '../core/formatters.js'
import { detectRuntime } from '../utils/environment.js'

import type { LogEntry, Environment, Transport } from '../types.js'

export interface FileTransportConfig {
	readonly filename: string
	readonly environment?: Environment
	readonly maxSize?: number // Max file size in bytes before rotation
	readonly maxFiles?: number // Max number of rotated files to keep
	readonly format?: 'json' | 'text' // Output format
	readonly createDirIfNotExists?: boolean
}

export class FileTransport implements Transport {
	readonly name = 'file'
	private readonly config: Required<FileTransportConfig>
	private writeQueue: Array<() => Promise<void>> = []
	private isWriting = false

	constructor(config: FileTransportConfig) {
		// Validate Node.js environment
		if (detectRuntime() !== 'node') {
			throw new Error(
				'FileTransport is only available in Node.js environment',
			)
		}

		this.config = {
			filename: config.filename,
			environment: config.environment ?? 'production',
			maxSize: config.maxSize ?? 10 * 1024 * 1024, // 10MB default
			maxFiles: config.maxFiles ?? 5,
			format: config.format ?? 'json',
			createDirIfNotExists: config.createDirIfNotExists ?? true,
		}
	}

	async write(entry: LogEntry): Promise<void> {
		const writeOperation = async (): Promise<void> => {
			await this.ensureDirectoryExists()
			await this.checkRotation()
			await this.writeToFile(entry)
		}

		this.writeQueue.push(writeOperation)
		await this.processQueue()
	}

	async flush(): Promise<void> {
		// Process any remaining queued writes
		await this.processQueue()
	}

	async close(): Promise<void> {
		await this.flush()
	}

	private async processQueue(): Promise<void> {
		if (this.isWriting || this.writeQueue.length === 0) {
			return
		}

		this.isWriting = true

		try {
			while (this.writeQueue.length > 0) {
				const operation = this.writeQueue.shift()
				if (operation) {
					await operation()
				}
			}
		} finally {
			this.isWriting = false
		}
	}

	private async ensureDirectoryExists(): Promise<void> {
		if (!this.config.createDirIfNotExists) return

		const dir = path.dirname(this.config.filename)
		try {
			await fs.access(dir)
		} catch {
			await fs.mkdir(dir, { recursive: true })
		}
	}

	private async checkRotation(): Promise<void> {
		try {
			const stats = await fs.stat(this.config.filename)
			if (stats.size >= this.config.maxSize) {
				await this.rotateFile()
			}
		} catch {
			// File doesn't exist yet, no rotation needed
		}
	}

	private async rotateFile(): Promise<void> {
		const { dir, name, ext } = path.parse(this.config.filename)

		// Rotate existing files
		for (let i = this.config.maxFiles - 1; i > 0; i--) {
			const oldFile = path.join(dir, `${name}.${i}${ext}`)
			const newFile = path.join(dir, `${name}.${i + 1}${ext}`)

			try {
				await fs.rename(oldFile, newFile)
			} catch {
				// File might not exist, continue
			}
		}

		// Move current file to .1
		const firstRotated = path.join(dir, `${name}.1${ext}`)
		try {
			await fs.rename(this.config.filename, firstRotated)
		} catch {
			// Original file might not exist
		}

		// Clean up old files beyond maxFiles
		const oldFile = path.join(
			dir,
			`${name}.${this.config.maxFiles + 1}${ext}`,
		)
		try {
			await fs.unlink(oldFile)
		} catch {
			// File might not exist
		}
	}

	private async writeToFile(entry: LogEntry): Promise<void> {
		const content = this.formatEntry(entry)
		const data = content + '\n'

		await fs.appendFile(this.config.filename, data, 'utf-8')
	}

	private formatEntry(entry: LogEntry): string {
		if (this.config.format === 'json') {
			return JSON.stringify(entry)
		}

		// Text format - use the same formatter but force production mode for clean text
		return formatLogEntry(entry, 'production')
	}
}
