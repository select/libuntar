import { describe, it, expect } from 'vitest';
import { untgz } from '../untgz';
import { untar } from '../libuntar';
import { readFileSync } from 'fs';

describe('untgz', () => {
	it('should decompress and extract entries from a tar.gz file', async () => {
		// Load the test tar.gz file as a Blob
		const fileBuffer = readFileSync('./test-fixtures/sample.tar.gz');
		const blob = new Blob([fileBuffer]);

		// Call untgz
		const result = await untgz(blob);

		// Should have arrayBuffer and nodes
		expect(result.arrayBuffer).toBeDefined();
		expect(result.arrayBuffer instanceof ArrayBuffer).toBe(true);
		expect(result.nodes).toBeDefined();
		expect(Array.isArray(result.nodes)).toBe(true);

		// Should have multiple entries
		expect(result.nodes.length).toBeGreaterThan(0);
	});

	it('should filter out MacOS garbage files', async () => {
		const fileBuffer = readFileSync('./test-fixtures/sample.tar.gz');
		const blob = new Blob([fileBuffer]);

		const result = await untgz(blob);

		// Check that no entries contain ._ or PaxHeader
		result.nodes.forEach((node) => {
			expect(node.name).not.toContain('._');
			expect(node.name).not.toContain('PaxHeader');
		});
	});

	it('should extract correct file entries', async () => {
		const fileBuffer = readFileSync('./test-fixtures/sample.tar.gz');
		const blob = new Blob([fileBuffer]);

		const result = await untgz(blob);

		// Verify we have expected files
		const fileNames = result.nodes.map((n) => n.name);
		expect(fileNames).toContain('sample-data/file1.txt');
		expect(fileNames).toContain('sample-data/file2.txt');
		expect(fileNames).toContain('sample-data/README.md');
		expect(fileNames).toContain('sample-data/nested/deep.txt');
		expect(fileNames).toContain('sample-data/xkcd-1168-tar.png');
	});

	it('should provide valid arrayBuffer for extracting file data', async () => {
		const fileBuffer = readFileSync('./test-fixtures/sample.tar.gz');
		const blob = new Blob([fileBuffer]);

		const result = await untgz(blob);

		// Find a file entry
		const file1 = result.nodes.find((n) => n.name === 'sample-data/file1.txt');
		expect(file1).toBeDefined();

		// Extract the file data using the arrayBuffer
		const data = untar(file1!, result.arrayBuffer);
		const content = new TextDecoder().decode(data);

		expect(content).toContain('Hello World!');
		expect(content).toContain('This is the first test file.');
	});

	it('should handle all files in the tar.gz correctly', async () => {
		const fileBuffer = readFileSync('./test-fixtures/sample.tar.gz');
		const blob = new Blob([fileBuffer]);

		const result = await untgz(blob);

		// Extract and verify all text files
		const files = result.nodes.filter((n) => n.isFile);

		files.forEach((file) => {
			const data = untar(file, result.arrayBuffer);
			expect(data).toBeDefined();

			if (file.size > 0) {
				expect(data.length).toBe(file.size);
			}
		});
	});

	it('should include both files and directories in nodes', async () => {
		const fileBuffer = readFileSync('./test-fixtures/sample.tar.gz');
		const blob = new Blob([fileBuffer]);

		const result = await untgz(blob);

		const files = result.nodes.filter((n) => n.isFile);
		const directories = result.nodes.filter((n) => !n.isFile);

		expect(files.length).toBeGreaterThan(0);
		expect(directories.length).toBeGreaterThan(0);
	});

	it('should properly structure the return object', async () => {
		const fileBuffer = readFileSync('./test-fixtures/sample.tar.gz');
		const blob = new Blob([fileBuffer]);

		const result = await untgz(blob);

		// Check structure
		expect(result).toHaveProperty('arrayBuffer');
		expect(result).toHaveProperty('nodes');

		// Verify nodes have proper structure
		result.nodes.forEach((node) => {
			expect(node).toHaveProperty('name');
			expect(node).toHaveProperty('size');
			expect(node).toHaveProperty('isFile');
			expect(node).toHaveProperty('offset');

			expect(typeof node.name).toBe('string');
			expect(typeof node.size).toBe('number');
			expect(typeof node.isFile).toBe('boolean');
			expect(typeof node.offset).toBe('number');
		});
	});

	it('should extract binary image files correctly', async () => {
		const fileBuffer = readFileSync('./test-fixtures/sample.tar.gz');
		const blob = new Blob([fileBuffer]);

		const result = await untgz(blob);

		// Find the image file
		const imageFile = result.nodes.find(
			(n) => n.name === 'sample-data/xkcd-1168-tar.png',
		);
		expect(imageFile).toBeDefined();
		expect(imageFile!.isFile).toBe(true);

		// Extract the image data
		const data = untar(imageFile!, result.arrayBuffer);

		// Verify PNG magic bytes
		expect(data[0]).toBe(0x89);
		expect(data[1]).toBe(0x50); // 'P'
		expect(data[2]).toBe(0x4e); // 'N'
		expect(data[3]).toBe(0x47); // 'G'

		// Verify size matches
		expect(data.length).toBe(imageFile!.size);
		expect(data.length).toBeGreaterThan(10000); // Reasonable image size
	});
});
