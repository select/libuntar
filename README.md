# libuntar(.gz)

Extract files from .tar and tar.gz archives in the browser (or node) using native APIs. Zero dependencies, lightweight, fast.

[![npm version](https://img.shields.io/npm/v/libuntar.svg)](https://www.npmjs.com/package/libuntar)
[![Bundle size](https://img.shields.io/bundlephobia/minzip/libuntar)](https://bundlephobia.com/package/libuntar)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)


## Installation

This lib is so small you may just want to copy the source files directly into your project.
- [libuntar.ts](./libuntar.ts) / [libuntar.js](./dist/libuntar.js)
- [untgz.ts](./untgz.ts) / [untgz.js](./dist/untgz.js)

Alternatively, you can install via pnpm, npm, or yarn:

```bash
pnpm add libuntar
```

```bash
npm install libuntar
```

```bash
yarn add libuntar
```

## Quick Start

### Extract .tar.gz files

```typescript
import { untgz, untar } from 'libuntar/untgz';

// Fetch and extract a tar.gz file
const response = await fetch('archive.tar.gz');
const blob = await response.blob();

// Decompress and extract entries in one step
const { arrayBuffer, entries } = await untgz(blob);

// List all files
entries.forEach((entry) => {
	console.log(`${entry.name} (${entry.size} bytes)`);
});

// Extract a specific file
const textFile = entries.find((e) => e.name === 'readme.txt');
if (textFile) {
	const data = untar(textFile, arrayBuffer);
	const text = new TextDecoder().decode(data);
	console.log(text);
}
```

### Extract .tar files

```typescript
import { getEntries, untar } from 'libuntar';

// Fetch a raw tar file (not gzipped)
const response = await fetch('archive.tar');
const arrayBuffer = await response.arrayBuffer();

// Extract entries from the tar
const entries = getEntries(arrayBuffer);

// List all files
entries.forEach((entry) => {
	console.log(`${entry.name} (${entry.size} bytes)`);
});

// Extract a specific file
const textFile = entries.find((e) => e.name === 'readme.txt');
if (textFile) {
	const data = untar(textFile, arrayBuffer);
	const text = new TextDecoder().decode(data);
	console.log(text);
}
```


## API Reference

```ts
async function untgz(blob: Blob): Promise<{ arrayBuffer: ArrayBuffer; entries: TarEntry[]; }>
function getEntries(arrayBuffer: ArrayBuffer): TarEntry[]
function untar(entry: TarEntry, arrayBuffer: ArrayBuffer): Uint8Array

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
