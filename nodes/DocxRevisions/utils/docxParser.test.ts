import { describe, it, expect } from 'vitest';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { parseDocx, extractTextFromXml, InvalidFileFormatError } from './docxParser';

describe('docxParser', () => {
	describe('extractTextFromXml', () => {
		it('should extract text from simple w:t elements', () => {
			const xml = '<w:p><w:r><w:t>Hello</w:t></w:r><w:r><w:t> World</w:t></w:r></w:p>';
			expect(extractTextFromXml(xml)).toBe('Hello World');
		});

		it('should handle w:t with attributes', () => {
			const xml = '<w:t xml:space="preserve"> spaced </w:t>';
			expect(extractTextFromXml(xml)).toBe(' spaced ');
		});

		it('should return empty string for xml without w:t', () => {
			const xml = '<w:p><w:r><w:rPr></w:rPr></w:r></w:p>';
			expect(extractTextFromXml(xml)).toBe('');
		});

		it('should handle empty input', () => {
			expect(extractTextFromXml('')).toBe('');
		});
	});

	describe('parseDocx', () => {
		it('should throw InvalidFileFormatError for invalid buffer', async () => {
			const invalidBuffer = Buffer.from('not a zip file');
			await expect(parseDocx(invalidBuffer)).rejects.toThrow(InvalidFileFormatError);
			await expect(parseDocx(invalidBuffer)).rejects.toThrow(
				'Failed to parse file as ZIP archive. Please provide a valid .docx file.',
			);
		});

		it('should parse sample docx file with revisions and comments', async () => {
			const samplePath = join(__dirname, '../../../sample/nda-meti 2.docx');
			let buffer: Buffer;

			try {
				buffer = await readFile(samplePath);
			} catch {
				console.log('Sample file not found, skipping integration test');
				return;
			}

			const result = await parseDocx(buffer);

			expect(result.document).not.toBeNull();
			expect(typeof result.document).toBe('string');
			expect(result.document).toContain('w:document');
		});
	});
});
