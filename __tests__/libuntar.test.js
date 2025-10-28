import { describe, it, expect } from 'vitest';
import { tarGetEntries, tarGetEntryData } from '../libuntar.js';
import { readFileSync } from 'fs';
import { inflate } from 'pako';

describe('libuntar with real tar.gz file', () => {
	let tarBuffer;

	// Load and decompress the real tar.gz file before tests
	const gzipData = readFileSync('./test-fixtures/sample.tar.gz');
	const decompressed = inflate(gzipData);
	tarBuffer = decompressed.buffer;

	describe('tarGetEntries', () => {
		it('should extract all entries from real tar file', () => {
			const entries = tarGetEntries(tarBuffer);

			// Should have directory + 4 files + nested directory
			expect(entries.length).toBeGreaterThanOrEqual(4);

			// Verify we have expected files
			const fileNames = entries.map((e) => e.name);
			expect(fileNames).toContain('sample-data/file1.txt');
			expect(fileNames).toContain('sample-data/file2.txt');
			expect(fileNames).toContain('sample-data/README.md');
			expect(fileNames).toContain('sample-data/nested/deep.txt');
		});

		it('should correctly identify files vs directories', () => {
			const entries = tarGetEntries(tarBuffer);

			const directories = entries.filter((e) => !e.is_file);
			const files = entries.filter((e) => e.is_file);

			expect(directories.length).toBeGreaterThanOrEqual(2); // sample-data/ and nested/
			expect(files.length).toBeGreaterThanOrEqual(4); // 4 text files

			// Check that directory names end with /
			directories.forEach((dir) => {
				expect(dir.name).toMatch(/\/$/);
			});
		});

		it('should have correct sizes for files', () => {
			const entries = tarGetEntries(tarBuffer);

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
			const entries = tarGetEntries(tarBuffer);

			entries.forEach((entry) => {
				expect(entry.offset).toBeDefined();
				expect(typeof entry.offset).toBe('number');
				expect(entry.offset).toBeGreaterThanOrEqual(0);
			});
		});
	});

	describe('tarGetEntryData', () => {
		it('should extract file1.txt content correctly', () => {
			const entries = tarGetEntries(tarBuffer);
			const file1 = entries.find((e) => e.name === 'sample-data/file1.txt');

			expect(file1).toBeDefined();

			const data = tarGetEntryData(file1, tarBuffer);
			const content = new TextDecoder().decode(data);

			expect(content).toContain('Hello World!');
			expect(content).toContain('This is the first test file.');
			expect(content).toContain('It contains multiple lines of text.');
		});

		it('should extract file2.txt content correctly', () => {
			const entries = tarGetEntries(tarBuffer);
			const file2 = entries.find((e) => e.name === 'sample-data/file2.txt');

			expect(file2).toBeDefined();

			const data = tarGetEntryData(file2, tarBuffer);
			const content = new TextDecoder().decode(data);

			expect(content).toContain('Second file content here.');
			expect(content).toContain('Testing tar extraction with real files.');
		});

		it('should extract nested file content correctly', () => {
			const entries = tarGetEntries(tarBuffer);
			const deepFile = entries.find(
				(e) => e.name === 'sample-data/nested/deep.txt',
			);

			expect(deepFile).toBeDefined();

			const data = tarGetEntryData(deepFile, tarBuffer);
			const content = new TextDecoder().decode(data);

			expect(content).toContain('This file is in a nested directory.');
			expect(content).toContain('Testing directory structure preservation.');
		});

		it('should extract README.md content correctly', () => {
			const entries = tarGetEntries(tarBuffer);
			const readme = entries.find((e) => e.name === 'sample-data/README.md');

			expect(readme).toBeDefined();

			const data = tarGetEntryData(readme, tarBuffer);
			const content = new TextDecoder().decode(data);

			expect(content).toContain('# Test Data');
			expect(content).toContain('This directory contains test files');
			expect(content).toContain('## Files');
		});

		it('should extract all files without corruption', () => {
			const entries = tarGetEntries(tarBuffer);
			const files = entries.filter((e) => e.is_file);

			files.forEach((file) => {
				const data = tarGetEntryData(file, tarBuffer);
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
			const entries = tarGetEntries(tarBuffer);
			const directories = entries.filter((e) => !e.is_file);

			directories.forEach((dir) => {
				expect(dir.size).toBe(0);
				const data = tarGetEntryData(dir, tarBuffer);
				expect(data.length).toBe(0);
			});
		});
	});

	describe('integration tests', () => {
		it('should be able to extract and reconstruct all files', () => {
			const entries = tarGetEntries(tarBuffer);
			const extractedFiles = {};

			// Extract all files
			entries
				.filter((e) => e.is_file)
				.forEach((entry) => {
					const data = tarGetEntryData(entry, tarBuffer);
					const content = new TextDecoder().decode(data);
					extractedFiles[entry.name] = content;
				});

			// Verify we got all expected files
			expect(Object.keys(extractedFiles).length).toBeGreaterThanOrEqual(4);
			expect(extractedFiles['sample-data/file1.txt']).toBeDefined();
			expect(extractedFiles['sample-data/file2.txt']).toBeDefined();
			expect(extractedFiles['sample-data/README.md']).toBeDefined();
			expect(extractedFiles['sample-data/nested/deep.txt']).toBeDefined();
		});

		it('should maintain data integrity across multiple extractions', () => {
			const entries = tarGetEntries(tarBuffer);
			const file1 = entries.find((e) => e.name === 'sample-data/file1.txt');

			// Extract the same file multiple times
			const data1 = tarGetEntryData(file1, tarBuffer);
			const data2 = tarGetEntryData(file1, tarBuffer);
			const data3 = tarGetEntryData(file1, tarBuffer);

			const content1 = new TextDecoder().decode(data1);
			const content2 = new TextDecoder().decode(data2);
			const content3 = new TextDecoder().decode(data3);

			// All extractions should be identical
			expect(content1).toBe(content2);
			expect(content2).toBe(content3);
		});
	});
});
