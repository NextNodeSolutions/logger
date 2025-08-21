/**
 * Time utilities for NextNode Logger
 * Zero dependencies, using only Node.js built-in modules
 */

export const getCurrentTimestamp = (): string => new Date().toISOString()
