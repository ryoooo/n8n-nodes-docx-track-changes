import { describe, it, expect } from 'vitest';
import { parseComments, generateCommentSummary, type Comment } from './commentParser';

describe('commentParser', () => {
	describe('parseComments', () => {
		it('should return empty array when commentsXml is null', () => {
			const comments = parseComments(null, null, null);
			expect(comments).toEqual([]);
		});

		it('should extract basic comment', () => {
			const commentsXml = `<?xml version="1.0" encoding="UTF-8"?>
				<w:comments xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
					<w:comment w:id="1" w:author="John Doe" w:date="2024-01-15T10:30:00Z">
						<w:p>
							<w:r>
								<w:t>This is a comment</w:t>
							</w:r>
						</w:p>
					</w:comment>
				</w:comments>`;

			const comments = parseComments(commentsXml, null, null);
			expect(comments).toHaveLength(1);
			expect(comments[0].id).toBe('1');
			expect(comments[0].author).toBe('John Doe');
			expect(comments[0].date).toBe('2024-01-15T10:30:00Z');
			expect(comments[0].text).toBe('This is a comment');
			expect(comments[0].resolved).toBe(false);
			expect(comments[0].replies).toEqual([]);
		});

		it('should extract multiple comments', () => {
			const commentsXml = `<?xml version="1.0" encoding="UTF-8"?>
				<w:comments xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
					<w:comment w:id="1" w:author="Author1" w:date="2024-01-01T00:00:00Z">
						<w:p><w:r><w:t>First comment</w:t></w:r></w:p>
					</w:comment>
					<w:comment w:id="2" w:author="Author2" w:date="2024-01-02T00:00:00Z">
						<w:p><w:r><w:t>Second comment</w:t></w:r></w:p>
					</w:comment>
				</w:comments>`;

			const comments = parseComments(commentsXml, null, null);
			expect(comments).toHaveLength(2);
			expect(comments[0].text).toBe('First comment');
			expect(comments[1].text).toBe('Second comment');
		});

		it('should handle missing author with default "Unknown"', () => {
			const commentsXml = `<?xml version="1.0" encoding="UTF-8"?>
				<w:comments xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
					<w:comment w:id="1">
						<w:p><w:r><w:t>Anonymous comment</w:t></w:r></w:p>
					</w:comment>
				</w:comments>`;

			const comments = parseComments(commentsXml, null, null);
			expect(comments[0].author).toBe('Unknown');
		});

		it('should identify resolved comments from commentsExtended', () => {
			const commentsXml = `<?xml version="1.0" encoding="UTF-8"?>
				<w:comments xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
					<w:comment w:id="1" w:author="Test" w:date="2024-01-01T00:00:00Z">
						<w:p><w:r><w:t>Resolved comment</w:t></w:r></w:p>
					</w:comment>
				</w:comments>`;

			const commentsExtendedXml = `<?xml version="1.0" encoding="UTF-8"?>
				<w15:commentsEx xmlns:w15="http://schemas.microsoft.com/office/word/2012/wordml">
					<w15:commentEx w15:paraId="1" w15:done="1"/>
				</w15:commentsEx>`;

			const comments = parseComments(commentsXml, commentsExtendedXml, null);
			expect(comments[0].resolved).toBe(true);
		});

		it('should handle replies from commentsExtended', () => {
			const commentsXml = `<?xml version="1.0" encoding="UTF-8"?>
				<w:comments xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
					<w:comment w:id="1" w:author="Author1" w:date="2024-01-01T00:00:00Z">
						<w:p><w:r><w:t>Parent comment</w:t></w:r></w:p>
					</w:comment>
					<w:comment w:id="2" w:author="Author2" w:date="2024-01-02T00:00:00Z">
						<w:p><w:r><w:t>Reply to parent</w:t></w:r></w:p>
					</w:comment>
				</w:comments>`;

			const commentsExtendedXml = `<?xml version="1.0" encoding="UTF-8"?>
				<w15:commentsEx xmlns:w15="http://schemas.microsoft.com/office/word/2012/wordml">
					<w15:commentEx w15:paraId="1" w15:done="0"/>
					<w15:commentEx w15:paraId="2" w15:paraIdParent="1" w15:done="0"/>
				</w15:commentsEx>`;

			const comments = parseComments(commentsXml, commentsExtendedXml, null);
			expect(comments).toHaveLength(1);
			expect(comments[0].text).toBe('Parent comment');
			expect(comments[0].replies).toHaveLength(1);
			expect(comments[0].replies[0].text).toBe('Reply to parent');
			expect(comments[0].replies[0].author).toBe('Author2');
		});

		it('should filter out resolved comments when includeResolved is false', () => {
			const commentsXml = `<?xml version="1.0" encoding="UTF-8"?>
				<w:comments xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
					<w:comment w:id="1" w:author="Test" w:date="2024-01-01T00:00:00Z">
						<w:p><w:r><w:t>Resolved</w:t></w:r></w:p>
					</w:comment>
					<w:comment w:id="2" w:author="Test" w:date="2024-01-02T00:00:00Z">
						<w:p><w:r><w:t>Unresolved</w:t></w:r></w:p>
					</w:comment>
				</w:comments>`;

			const commentsExtendedXml = `<?xml version="1.0" encoding="UTF-8"?>
				<w15:commentsEx xmlns:w15="http://schemas.microsoft.com/office/word/2012/wordml">
					<w15:commentEx w15:paraId="1" w15:done="1"/>
					<w15:commentEx w15:paraId="2" w15:done="0"/>
				</w15:commentsEx>`;

			const comments = parseComments(commentsXml, commentsExtendedXml, null, { includeResolved: false });
			expect(comments).toHaveLength(1);
			expect(comments[0].text).toBe('Unresolved');
		});

		it('should extract target text from document', () => {
			const commentsXml = `<?xml version="1.0" encoding="UTF-8"?>
				<w:comments xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
					<w:comment w:id="0" w:author="Test" w:date="2024-01-01T00:00:00Z">
						<w:p><w:r><w:t>Comment on text</w:t></w:r></w:p>
					</w:comment>
				</w:comments>`;

			const documentXml = `<?xml version="1.0" encoding="UTF-8"?>
				<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
					<w:body>
						<w:p>
							<w:r><w:t>Before </w:t></w:r>
							<w:commentRangeStart w:id="0"/>
							<w:r><w:t>highlighted text</w:t></w:r>
							<w:commentRangeEnd w:id="0"/>
							<w:r><w:t> after</w:t></w:r>
						</w:p>
					</w:body>
				</w:document>`;

			const comments = parseComments(commentsXml, null, documentXml);
			expect(comments[0].targetText).toBe('highlighted text');
		});
	});

	describe('generateCommentSummary', () => {
		it('should generate correct summary for empty comments', () => {
			const summary = generateCommentSummary([]);
			expect(summary).toEqual({
				totalComments: 0,
				totalReplies: 0,
				resolved: 0,
				unresolved: 0,
				authors: [],
			});
		});

		it('should count comments and replies correctly', () => {
			const comments: Comment[] = [
				{
					id: '1',
					author: 'Alice',
					date: '',
					text: 'Comment 1',
					targetText: null,
					resolved: false,
					replies: [
						{ id: '2', author: 'Bob', date: '', text: 'Reply 1' },
						{ id: '3', author: 'Charlie', date: '', text: 'Reply 2' },
					],
				},
				{
					id: '4',
					author: 'Alice',
					date: '',
					text: 'Comment 2',
					targetText: null,
					resolved: true,
					replies: [],
				},
			];

			const summary = generateCommentSummary(comments);
			expect(summary.totalComments).toBe(2);
			expect(summary.totalReplies).toBe(2);
			expect(summary.resolved).toBe(1);
			expect(summary.unresolved).toBe(1);
		});

		it('should collect unique authors from comments and replies', () => {
			const comments: Comment[] = [
				{
					id: '1',
					author: 'Alice',
					date: '',
					text: 'Comment',
					targetText: null,
					resolved: false,
					replies: [
						{ id: '2', author: 'Bob', date: '', text: 'Reply' },
						{ id: '3', author: 'Alice', date: '', text: 'Reply' },
					],
				},
			];

			const summary = generateCommentSummary(comments);
			expect(summary.authors).toHaveLength(2);
			expect(summary.authors).toContain('Alice');
			expect(summary.authors).toContain('Bob');
		});
	});
});
