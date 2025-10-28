import { describe, it, expect, beforeAll } from 'vitest';
import { getEntries, untar } from '../libuntar';
import { readFileSync } from 'fs';

describe('libuntar with real tar.gz file', () => {
	let tarBuffer;

	// Load and decompress the real tar.gz file before tests
	beforeAll(async () => {
		const gzipData = readFileSync('./test-fixtures/sample.tar.gz');
		const blob = new Blob([gzipData]);
		const decompressedStream = blob
			.stream()
			.pipeThrough(new DecompressionStream('gzip'));
		tarBuffer = await new Response(decompressedStream).arrayBuffer();
	});

	describe('getEntries', () => {
		it('should extract all entries from real tar file', () => {
			const entries = getEntries(tarBuffer);

			// Should have directory + 5 files (including image) + nested directory
			expect(entries.length).toBeGreaterThanOrEqual(5);

			// Verify we have expected files
			const fileNames = entries.map((e) => e.name);
			expect(fileNames).toContain('sample-data/file1.txt');
			expect(fileNames).toContain('sample-data/file2.txt');
			expect(fileNames).toContain('sample-data/README.md');
			expect(fileNames).toContain('sample-data/nested/deep.txt');
			expect(fileNames).toContain('sample-data/xkcd-1168-tar.png');
		});

		it('should correctly identify files vs directories', () => {
			const entries = getEntries(tarBuffer);

			const directories = entries.filter((e) => !e.isFile);
			const files = entries.filter((e) => e.isFile);

			expect(directories.length).toBeGreaterThanOrEqual(2); // sample-data/ and nested/
			expect(files.length).toBeGreaterThanOrEqual(5); // 4 text files + 1 image

			// Check that directory names end with /
			directories.forEach((dir) => {
				expect(dir.name).toMatch(/\/$/);
			});
		});

		it('should have correct sizes for files', () => {
			const entries = getEntries(tarBuffer);

			const file1 = entries.find((e) => e.name === 'sample-data/file1.txt');
			const file2 = entries.find((e) => e.name === 'sample-data/file2.txt');
			const readme = entries.find((e) => e.name === 'sample-data/README.md');

			expect(file1).toBeDefined();
			expect(file1.size).toBeGreaterThan(0);

			expect(file2).toBeDefined();
			expect(file2.size).toBeGreaterThan(0);

			expect(readme).toBeDefined();
			expect(readme.size).toBeGreaterThan(0);
		});

		it('should include offset information for each entry', () => {
			const entries = getEntries(tarBuffer);

			entries.forEach((entry) => {
				expect(entry.offset).toBeDefined();
				expect(typeof entry.offset).toBe('number');
				expect(entry.offset).toBeGreaterThanOrEqual(0);
			});
		});
	});

	describe('untar', () => {
		it('should extract file1.txt content correctly', () => {
			const entries = getEntries(tarBuffer);
			const file1 = entries.find((e) => e.name === 'sample-data/file1.txt');

			expect(file1).toBeDefined();

			const data = untar(file1, tarBuffer);
			const content = new TextDecoder().decode(data);

			expect(content).toContain('Hello World!');
			expect(content).toContain('This is the first test file.');
			expect(content).toContain('It contains multiple lines of text.');
		});

		it('should extract file2.txt content correctly', () => {
			const entries = getEntries(tarBuffer);
			const file2 = entries.find((e) => e.name === 'sample-data/file2.txt');

			expect(file2).toBeDefined();

			const data = untar(file2, tarBuffer);
			const content = new TextDecoder().decode(data);

			expect(content).toContain('Second file content here.');
			expect(content).toContain('Testing tar extraction with real files.');
		});

		it('should extract nested file content correctly', () => {
			const entries = getEntries(tarBuffer);
			const deepFile = entries.find(
				(e) => e.name === 'sample-data/nested/deep.txt',
			);

			expect(deepFile).toBeDefined();

			const data = untar(deepFile, tarBuffer);
			const content = new TextDecoder().decode(data);

			expect(content).toContain('This file is in a nested directory.');
			expect(content).toContain('Testing directory structure preservation.');
		});

		it('should extract README.md content correctly', () => {
			const entries = getEntries(tarBuffer);
			const readme = entries.find((e) => e.name === 'sample-data/README.md');

			expect(readme).toBeDefined();

			const data = untar(readme, tarBuffer);
			const content = new TextDecoder().decode(data);

			expect(content).toContain('# Test Data');
			expect(content).toContain('This directory contains test files');
			expect(content).toContain('## Files');
		});

		it('should extract all files without corruption', () => {
			const entries = getEntries(tarBuffer);
			const files = entries.filter((e) => e.isFile);

			files.forEach((file) => {
				const data = untar(file, tarBuffer);
				const content = new TextDecoder().decode(data);

				// Content should not be empty for non-zero sized files
				if (file.size > 0) {
					expect(content.length).toBeGreaterThan(0);
				}

				// Content should match the reported size
				expect(data.length).toBe(file.size);
			});
		});

		it('should handle directory entries (zero size)', () => {
			const entries = getEntries(tarBuffer);
			const directories = entries.filter((e) => !e.isFile);

			directories.forEach((dir) => {
				expect(dir.size).toBe(0);
				const data = untar(dir, tarBuffer);
				expect(data.length).toBe(0);
			});
		});

		it('should extract binary image file correctly', () => {
			const entries = getEntries(tarBuffer);
			const imageFile = entries.find(
				(e) => e.name === 'sample-data/xkcd-1168-tar.png',
			);

			expect(imageFile).toBeDefined();
			expect(imageFile.isFile).toBe(true);
			expect(imageFile.size).toBeGreaterThan(0);

			// Extract the image data
			const data = untar(imageFile, tarBuffer);

			// Verify it's a PNG file by checking the PNG magic bytes
			// PNG files start with: 0x89 0x50 0x4E 0x47 0x0D 0x0A 0x1A 0x0A
			expect(data[0]).toBe(0x89);
			expect(data[1]).toBe(0x50); // 'P'
			expect(data[2]).toBe(0x4e); // 'N'
			expect(data[3]).toBe(0x47); // 'G'

			// Verify the extracted size matches the reported size
			expect(data.length).toBe(imageFile.size);
		});
	});

	describe('integration tests', () => {
		it('should be able to extract and reconstruct all files', () => {
			const entries = getEntries(tarBuffer);
			const extractedFiles = {};

			// Extract all files
			entries
				.filter((e) => e.isFile)
				.forEach((entry) => {
					const data = untar(entry, tarBuffer);
					extractedFiles[entry.name] = data;
				});

			// Verify we got all expected files (including the image)
			expect(Object.keys(extractedFiles).length).toBeGreaterThanOrEqual(5);
			expect(extractedFiles['sample-data/file1.txt']).toBeDefined();
			expect(extractedFiles['sample-data/file2.txt']).toBeDefined();
			expect(extractedFiles['sample-data/README.md']).toBeDefined();
			expect(extractedFiles['sample-data/nested/deep.txt']).toBeDefined();
			expect(extractedFiles['sample-data/xkcd-1168-tar.png']).toBeDefined();

			// Verify text files can be decoded
			const textContent = new TextDecoder().decode(
				extractedFiles['sample-data/file1.txt'],
			);
			expect(textContent).toContain('Hello World!');

			// Verify binary file is extracted correctly
			const imageData = extractedFiles['sample-data/xkcd-1168-tar.png'];
			expect(imageData[0]).toBe(0x89); // PNG signature
		});

		it('should maintain data integrity across multiple extractions', () => {
			const entries = getEntries(tarBuffer);
			const file1 = entries.find((e) => e.name === 'sample-data/file1.txt');

			// Extract the same file multiple times
			const data1 = untar(file1, tarBuffer);
			const data2 = untar(file1, tarBuffer);
			const data3 = untar(file1, tarBuffer);

			const content1 = new TextDecoder().decode(data1);
			const content2 = new TextDecoder().decode(data2);
			const content3 = new TextDecoder().decode(data3);

			// All extractions should be identical
			expect(content1).toBe(content2);
			expect(content2).toBe(content3);
		});
	});
});
