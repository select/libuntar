import { describe, it, expect } from 'vitest';
import { tarGetEntries, tarGetEntryData } from './libuntar.js';

describe('libuntar', () => {
	describe('tarGetEntries', () => {
		it('should return empty array for empty buffer', () => {
			const buffer = new ArrayBuffer(512);
			const entries = tarGetEntries(buffer);
			expect(entries).toEqual([]);
		});

		it('should extract single file entry from tar buffer', () => {
			const buffer = createTarBuffer([
				{
					name: 'test.txt',
					size: 11,
					type: 0, // file
					content: 'hello world',
				},
			]);

			const entries = tarGetEntries(buffer);
			expect(entries).toHaveLength(1);
			expect(entries[0].name).toBe('test.txt');
			expect(entries[0].size).toBe(11);
			expect(entries[0].is_file).toBe(true);
		});

		it('should extract directory entry from tar buffer', () => {
			const buffer = createTarBuffer([
				{
					name: 'mydir/',
					size: 0,
					type: 5, // directory
					content: '',
				},
			]);

			const entries = tarGetEntries(buffer);
			expect(entries).toHaveLength(1);
			expect(entries[0].name).toBe('mydir/');
			expect(entries[0].size).toBe(0);
			expect(entries[0].is_file).toBe(false);
		});

		it('should extract multiple entries from tar buffer', () => {
			const buffer = createTarBuffer([
				{
					name: 'file1.txt',
					size: 5,
					type: 0,
					content: 'hello',
				},
				{
					name: 'dir/',
					size: 0,
					type: 5,
					content: '',
				},
				{
					name: 'file2.txt',
					size: 5,
					type: 0,
					content: 'world',
				},
			]);

			const entries = tarGetEntries(buffer);
			expect(entries).toHaveLength(3);
			expect(entries[0].name).toBe('file1.txt');
			expect(entries[1].name).toBe('dir/');
			expect(entries[2].name).toBe('file2.txt');
		});

		it('should handle files with long content requiring multiple blocks', () => {
			const longContent = 'a'.repeat(1000);
			const buffer = createTarBuffer([
				{
					name: 'large.txt',
					size: 1000,
					type: 0,
					content: longContent,
				},
			]);

			const entries = tarGetEntries(buffer);
			expect(entries).toHaveLength(1);
			expect(entries[0].size).toBe(1000);
		});

		it('should skip unknown entry types', () => {
			const buffer = createTarBuffer([
				{
					name: 'file.txt',
					size: 5,
					type: 0,
					content: 'hello',
				},
				{
					name: 'symlink',
					size: 0,
					type: 2, // symlink - should be skipped
					content: '',
				},
				{
					name: 'file2.txt',
					size: 5,
					type: 0,
					content: 'world',
				},
			]);

			const entries = tarGetEntries(buffer);
			expect(entries).toHaveLength(2);
			expect(entries[0].name).toBe('file.txt');
			expect(entries[1].name).toBe('file2.txt');
		});

		it('should handle file names with null padding', () => {
			const buffer = new ArrayBuffer(1024);
			const view = new Uint8Array(buffer);

			// Write name with explicit null padding
			const name = 'test.txt';
			for (let i = 0; i < name.length; i++) {
				view[i] = name.charCodeAt(i);
			}
			// Fill rest with nulls (already zero-initialized)

			// Write size in octal
			const sizeOctal = '00000000005';
			for (let i = 0; i < sizeOctal.length; i++) {
				view[124 + i] = sizeOctal.charCodeAt(i);
			}

			// Write type
			view[156] = '0'.charCodeAt(0);

			const entries = tarGetEntries(buffer);
			expect(entries).toHaveLength(1);
			expect(entries[0].name).toBe('test.txt');
		});
	});

	describe('tarGetEntryData', () => {
		it('should extract file content from tar buffer', () => {
			const content = 'hello world';
			const buffer = createTarBuffer([
				{
					name: 'test.txt',
					size: content.length,
					type: 0,
					content: content,
				},
			]);

			const entries = tarGetEntries(buffer);
			const data = tarGetEntryData(entries[0], buffer);
			const text = new TextDecoder().decode(data);

			expect(text).toBe(content);
		});

		it('should extract correct data for multiple files', () => {
			const content1 = 'first file';
			const content2 = 'second file';
			const buffer = createTarBuffer([
				{
					name: 'file1.txt',
					size: content1.length,
					type: 0,
					content: content1,
				},
				{
					name: 'file2.txt',
					size: content2.length,
					type: 0,
					content: content2,
				},
			]);

			const entries = tarGetEntries(buffer);
			const data1 = tarGetEntryData(entries[0], buffer);
			const data2 = tarGetEntryData(entries[1], buffer);

			expect(new TextDecoder().decode(data1)).toBe(content1);
			expect(new TextDecoder().decode(data2)).toBe(content2);
		});

		it('should handle empty files', () => {
			const buffer = createTarBuffer([
				{
					name: 'empty.txt',
					size: 0,
					type: 0,
					content: '',
				},
			]);

			const entries = tarGetEntries(buffer);
			const data = tarGetEntryData(entries[0], buffer);

			expect(data.length).toBe(0);
		});

		it('should extract large file content correctly', () => {
			const content = 'x'.repeat(2000);
			const buffer = createTarBuffer([
				{
					name: 'large.txt',
					size: content.length,
					type: 0,
					content: content,
				},
			]);

			const entries = tarGetEntries(buffer);
			const data = tarGetEntryData(entries[0], buffer);
			const text = new TextDecoder().decode(data);

			expect(text).toBe(content);
			expect(text.length).toBe(2000);
		});
	});
});

/**
 * Helper function to create a TAR buffer for testing
 * @param {Array<{name: string, size: number, type: number, content: string}>} entries
 * @returns {ArrayBuffer}
 */
function createTarBuffer(entries) {
	const blocks = [];

	for (const entry of entries) {
		// Create header block (512 bytes)
		const header = new Uint8Array(512);

		// Write name (offset 0, size 100)
		for (let i = 0; i < Math.min(entry.name.length, 100); i++) {
			header[i] = entry.name.charCodeAt(i);
		}

		// Write size in octal (offset 124, size 12)
		const sizeOctal = entry.size.toString(8).padStart(11, '0') + ' ';
		for (let i = 0; i < sizeOctal.length; i++) {
			header[124 + i] = sizeOctal.charCodeAt(i);
		}

		// Write type (offset 156, size 1)
		header[156] = String.fromCharCode(48 + entry.type).charCodeAt(0);

		// Calculate and write checksum (offset 148, size 8)
		// Initialize checksum field with spaces
		for (let i = 148; i < 156; i++) {
			header[i] = 32; // space
		}
		let checksum = 0;
		for (let i = 0; i < 512; i++) {
			checksum += header[i];
		}
		const checksumOctal = checksum.toString(8).padStart(6, '0') + '\0 ';
		for (let i = 0; i < checksumOctal.length; i++) {
			header[148 + i] = checksumOctal.charCodeAt(i);
		}

		blocks.push(header);

		// Write content blocks (512 byte aligned)
		if (entry.content.length > 0) {
			const contentBytes = new TextEncoder().encode(entry.content);
			const contentBlockCount = Math.ceil(contentBytes.length / 512);
			const contentBuffer = new Uint8Array(contentBlockCount * 512);
			contentBuffer.set(contentBytes);
			blocks.push(contentBuffer);
		}
	}

	// Add two empty blocks at the end (TAR EOF marker)
	blocks.push(new Uint8Array(512));
	blocks.push(new Uint8Array(512));

	// Combine all blocks
	const totalSize = blocks.reduce((sum, block) => sum + block.length, 0);
	const buffer = new Uint8Array(totalSize);
	let offset = 0;
	for (const block of blocks) {
		buffer.set(block, offset);
		offset += block.length;
	}

	return buffer.buffer;
}
