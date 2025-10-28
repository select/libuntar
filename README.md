# libuntar

Extract files from tar.gz archives in the browser using native APIs. Zero dependencies, lightweight, and fast.

[![npm version](https://img.shields.io/npm/v/libuntar.svg)](https://www.npmjs.com/package/libuntar)
[![Bundle size](https://img.shields.io/bundlephobia/minzip/libuntar)](https://bundlephobia.com/package/libuntar)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- 🌐 **Browser-native**: Uses native `DecompressionStream` API for gzip decompression
- 📦 **Lightweight**: ~1KB minified + gzipped
- 🚀 **Zero dependencies**: No external libraries required
- 💪 **TypeScript**: Full type definitions included
- 🎯 **Dual format**: ESM and CommonJS builds
- 🧹 **Auto-filtering**: Automatically filters out MacOS metadata files
- 🔧 **Binary safe**: Handles both text and binary files correctly

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

// If you already have a decompressed tar ArrayBuffer
const tarBuffer = /* your tar ArrayBuffer */;

const entries = tarGetEntries(tarBuffer);

entries.forEach(entry => {
  const data = tarGetEntryData(entry, tarBuffer);

  if (entry.isFile) {
    // Handle file data
    const content = new TextDecoder().decode(data);
    console.log(content);
  }
});
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

## Usage Examples

### Extract an Image from tar.gz

```typescript
import { untgz } from 'libuntar/untgz';
import { tarGetEntryData } from 'libuntar';

const response = await fetch('images.tar.gz');
const blob = await response.blob();
const { arrayBuffer, nodes } = await untgz(blob);

// Find the image
const imageEntry = nodes.find((e) => e.name.endsWith('.png'));
if (imageEntry) {
	const data = tarGetEntryData(imageEntry, arrayBuffer);
	const imageBlob = new Blob([data], { type: 'image/png' });
	const url = URL.createObjectURL(imageBlob);

	// Use the image
	document.getElementById('img').src = url;
}
```

### Extract All Text Files

```typescript
import { untgz } from 'libuntar/untgz';
import { tarGetEntryData } from 'libuntar';

const { arrayBuffer, nodes } = await untgz(tarGzBlob);

const textFiles = nodes
	.filter((e) => e.isFile && e.name.endsWith('.txt'))
	.map((entry) => {
		const data = tarGetEntryData(entry, arrayBuffer);
		const content = new TextDecoder().decode(data);
		return { name: entry.name, content };
	});

console.log(`Extracted ${textFiles.length} text files`);
```

### File Upload Handler

```typescript
import { untgz } from 'libuntar/untgz';
import { tarGetEntryData } from 'libuntar';

document.getElementById('fileInput').addEventListener('change', async (e) => {
	const file = e.target.files[0];

	if (!file.name.endsWith('.tar.gz')) {
		alert('Please select a .tar.gz file');
		return;
	}

	try {
		const { arrayBuffer, nodes } = await untgz(file);

		console.log('Archive contents:');
		nodes.forEach((entry) => {
			console.log(`- ${entry.name} (${entry.size} bytes)`);
		});
	} catch (error) {
		console.error('Failed to extract archive:', error);
	}
});
```

### Working with Directory Structure

```typescript
import { untgz } from 'libuntar/untgz';

const { nodes } = await untgz(blob);

// Separate files and directories
const files = nodes.filter((e) => e.isFile);
const directories = nodes.filter((e) => !e.isFile);

console.log(`Files: ${files.length}`);
console.log(`Directories: ${directories.length}`);

// Build a file tree
const tree = {};
files.forEach((file) => {
	const parts = file.name.split('/');
	let current = tree;

	parts.forEach((part, i) => {
		if (i === parts.length - 1) {
			current[part] = file;
		} else {
			current[part] = current[part] || {};
			current = current[part];
		}
	});
});
```

## Browser Compatibility

This library uses the native `DecompressionStream` API which is supported in:

- Chrome/Edge 80+
- Firefox 113+
- Safari 16.4+

For older browsers, you may need a polyfill or use a different decompression library.

## Module Exports

The package provides two entry points:

### Main export (`libuntar`)

```typescript
import { tarGetEntries, tarGetEntryData, TarEntry } from 'libuntar';
```

### untgz module (`libuntar/untgz`)

```typescript
import { untgz, getEntries } from 'libuntar/untgz';
```

## TypeScript Support

Full TypeScript definitions are included. The library is written in TypeScript and provides complete type safety.

```typescript
import type { TarEntry } from 'libuntar';

function processEntry(entry: TarEntry, buffer: ArrayBuffer): void {
	// TypeScript knows the shape of TarEntry
	console.log(entry.name, entry.size, entry.isFile);
}
```

## Performance

- **Small bundle size**: ~1KB minified + gzipped
- **Fast extraction**: Uses native browser APIs
- **Memory efficient**: Streams data when possible
- **No blocking**: Async operations don't freeze the UI

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

## Demo

A live demo is included in the `demo/` folder. To run it:

```bash
python -m http.server 8000
# Visit http://localhost:8000/demo/
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
