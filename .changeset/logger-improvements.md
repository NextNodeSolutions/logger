---
"@nextnode/logger": minor
---

Add comprehensive logger improvements: lazy evaluation, batch logging, and pluggable transport system

- **Lazy Evaluation**: Added support for lazy message evaluation using functions to avoid expensive computations when logging is disabled
- **Batch Logging**: Implemented configurable batch logging with maxSize, flushInterval, and maxDelay options for high-throughput scenarios  
- **Transport System**: Created pluggable transport architecture with Console, File, and HTTP transport implementations
- **Performance**: Enhanced performance with batching, lazy evaluation, and optimized serialization
- **Testing**: Added comprehensive test coverage (157 tests) including performance benchmarks and edge cases
- **Documentation**: Completely rewrote README with proper API documentation and usage examples