import { describe, it, expect } from 'vitest';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { parseDocx } from './utils/docxParser';
import { parseRevisions, generateRevisionSummary } from './utils/revisionParser';
import { parseComments, generateCommentSummary } from './utils/commentParser';

describe('Integration Tests with sample docx', () => {
	const samplePath = join(__dirname, '../../sample/nda-meti 2.docx');

	describe('Extract Revisions', () => {
		it('should extract revisions from sample file', async () => {
			let buffer: Buffer;
			try {
				buffer = await readFile(samplePath);
			} catch {
				console.log('Sample file not found, skipping test');
				return;
			}

			const docxFiles = await parseDocx(buffer);
			expect(docxFiles.document).not.toBeNull();

			const revisions = parseRevisions(docxFiles.document!, { includeContext: true });

			// Log for manual verification
			console.log('Revisions found:', revisions.length);
			if (revisions.length > 0) {
				console.log('Sample revision:', JSON.stringify(revisions[0], null, 2));
			}

			const summary = generateRevisionSummary(revisions);
			console.log('Summary:', JSON.stringify(summary, null, 2));

			// Basic assertions
			expect(Array.isArray(revisions)).toBe(true);
			expect(summary.totalRevisions).toBe(revisions.length);
			expect(summary.insertions + summary.deletions).toBe(summary.totalRevisions);
		});
	});

	describe('Extract Comments', () => {
		it('should extract comments from sample file', async () => {
			let buffer: Buffer;
			try {
				buffer = await readFile(samplePath);
			} catch {
				console.log('Sample file not found, skipping test');
				return;
			}

			const docxFiles = await parseDocx(buffer);

			const comments = parseComments(
				docxFiles.comments,
				docxFiles.commentsExtended,
				docxFiles.document,
				{ includeReplies: true, includeResolved: true },
			);

			// Log for manual verification
			console.log('Comments found:', comments.length);
			if (comments.length > 0) {
				console.log('Sample comment:', JSON.stringify(comments[0], null, 2));
			}

			const summary = generateCommentSummary(comments);
			console.log('Summary:', JSON.stringify(summary, null, 2));

			// Basic assertions
			expect(Array.isArray(comments)).toBe(true);
			expect(summary.totalComments).toBe(comments.length);
		});
	});
});
