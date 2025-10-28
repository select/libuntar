# libuntar

Extract files from tar.gz archives in the browser using native APIs. Zero dependencies, lightweight, and fast.

[![npm version](https://img.shields.io/npm/v/libuntar.svg)](https://www.npmjs.com/package/libuntar)
[![Bundle size](https://img.shields.io/bundlephobia/minzip/libuntar)](https://bundlephobia.com/package/libuntar)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- 🌐 **Browser-native**: Uses native `DecompressionStream` API for gzip decompression
- 📦 **Lightweight**: ~1KB minified
- 🚀 **Zero dependencies**: No external libraries required
- 💪 **TypeScript**: Full type definitions included

## Installation

```bash
npm install libuntar
```

```bash
pnpm add libuntar
```

```bash
yarn add libuntar
```

## Quick Start

### Extract tar.gz files (Recommended)

```typescript
import { untgz, getEntries } from 'libuntar/untgz';
import { tarGetEntryData } from 'libuntar';

// Fetch and extract a tar.gz file
const response = await fetch('archive.tar.gz');
const blob = await response.blob();

// Decompress and extract entries in one step
const { arrayBuffer, nodes } = await untgz(blob);

// List all files
nodes.forEach((entry) => {
	console.log(`${entry.name} (${entry.size} bytes)`);
});

// Extract a specific file
const textFile = nodes.find((e) => e.name === 'readme.txt');
if (textFile) {
	const data = tarGetEntryData(textFile, arrayBuffer);
	const text = new TextDecoder().decode(data);
	console.log(text);
}
```

### Working with raw tar files

```typescript
import { tarGetEntries, tarGetEntryData } from 'libuntar';

// Fetch a raw tar file (not gzipped)
const response = await fetch('archive.tar');
const arrayBuffer = await response.arrayBuffer();

// Extract entries from the tar
const entries = tarGetEntries(arrayBuffer);

// List all files
entries.forEach((entry) => {
	console.log(`${entry.name} (${entry.size} bytes)`);
});

// Extract a specific file
const textFile = entries.find((e) => e.name === 'readme.txt');
if (textFile) {
	const data = tarGetEntryData(textFile, arrayBuffer);
	const text = new TextDecoder().decode(data);
	console.log(text);
}
```

## API Reference

### `untgz(blob: Blob)`

High-level function that decompresses a gzip-compressed tar archive and extracts entries.

**Parameters:**

- `blob`: A `Blob` object containing the tar.gz data

**Returns:** `Promise<{ arrayBuffer: ArrayBuffer, nodes: TarEntry[] }>`

- `arrayBuffer`: The decompressed tar data
- `nodes`: Array of entries (automatically filtered to remove MacOS metadata)

**Example:**

```typescript
const file = document.querySelector('input[type="file"]').files[0];
const { arrayBuffer, nodes } = await untgz(file);
```

### `getEntries(arrayBuffer: ArrayBuffer)`

Alias for `tarGetEntries`. Extracts entries from a raw tar ArrayBuffer.

**Parameters:**

- `arrayBuffer`: Raw tar data

**Returns:** `TarEntry[]` - Array of tar entries

### `tarGetEntries(arrayBuffer: ArrayBuffer)`

Extracts entries from a raw tar ArrayBuffer.

**Parameters:**

- `arrayBuffer`: Raw tar data (not gzipped)

**Returns:** `TarEntry[]` - Array of tar entries

**Example:**

```typescript
import { tarGetEntries } from 'libuntar';

const entries = tarGetEntries(tarBuffer);
console.log(`Found ${entries.length} entries`);
```

### `tarGetEntryData(entry: TarEntry, arrayBuffer: ArrayBuffer)`

Extracts the raw data for a specific entry.

**Parameters:**

- `entry`: A `TarEntry` object from `tarGetEntries` or `untgz`
- `arrayBuffer`: The tar ArrayBuffer

**Returns:** `Uint8Array` - The raw file data

**Example:**

```typescript
const data = tarGetEntryData(entry, arrayBuffer);

// For text files
const text = new TextDecoder().decode(data);

// For binary files (images, etc.)
const blob = new Blob([data], { type: 'image/png' });
const url = URL.createObjectURL(blob);
```

### `TarEntry` Interface

```typescript
interface TarEntry {
	name: string; // File/directory path
	size: number; // File size in bytes
	isFile: boolean; // true for files, false for directories
	offset: number; // Internal offset in tar archive
}
```

## Browser Compatibility

This library uses the native `DecompressionStream` API which is supported in:

- Chrome/Edge 80+
- Firefox 113+
- Safari 16.4+

For older browsers, you may need a polyfill or use a different decompression library.

## Development

```bash
# Install dependencies
pnpm install

# Run tests
pnpm test

# Build
pnpm build

# Lint
pnpm lint

# Format code
pnpm format
```

## Credits

Based on [uncompress.js](https://github.com/workhorsy/uncompress.js) by Matthew Brennan Jones.

## License

MIT License - see LICENSE file for details

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Changelog

### 1.0.0

- Initial release
- TypeScript support
- Dual format (ESM/CJS) builds
- Native DecompressionStream support
- Auto-filtering of MacOS metadata files
- Comprehensive test suite
