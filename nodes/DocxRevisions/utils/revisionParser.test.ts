import { describe, it, expect } from 'vitest';
import { parseRevisions, generateRevisionSummary, type Revision } from './revisionParser';

describe('revisionParser', () => {
	describe('parseRevisions', () => {
		it('should return empty array for document without revisions', () => {
			const xml = `<?xml version="1.0" encoding="UTF-8"?>
				<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
					<w:body>
						<w:p>
							<w:r>
								<w:t>Normal text</w:t>
							</w:r>
						</w:p>
					</w:body>
				</w:document>`;

			const revisions = parseRevisions(xml);
			expect(revisions).toEqual([]);
		});

		it('should extract insert revisions', () => {
			const xml = `<?xml version="1.0" encoding="UTF-8"?>
				<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
					<w:body>
						<w:p>
							<w:ins w:id="1" w:author="John Doe" w:date="2024-01-15T10:30:00Z">
								<w:r>
									<w:t>inserted text</w:t>
								</w:r>
							</w:ins>
						</w:p>
					</w:body>
				</w:document>`;

			const revisions = parseRevisions(xml);
			expect(revisions).toHaveLength(1);
			expect(revisions[0].id).toBe('1');
			expect(revisions[0].type).toBe('insert');
			expect(revisions[0].text).toBe('inserted text');
			expect(revisions[0].author).toBe('John Doe');
			expect(revisions[0].date).toBe('2024-01-15T10:30:00Z');
		});

		it('should extract delete revisions', () => {
			const xml = `<?xml version="1.0" encoding="UTF-8"?>
				<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
					<w:body>
						<w:p>
							<w:del w:id="2" w:author="Jane Smith" w:date="2024-01-16T14:00:00Z">
								<w:r>
									<w:delText>deleted text</w:delText>
								</w:r>
							</w:del>
						</w:p>
					</w:body>
				</w:document>`;

			const revisions = parseRevisions(xml);
			expect(revisions).toHaveLength(1);
			expect(revisions[0].id).toBe('2');
			expect(revisions[0].type).toBe('delete');
			expect(revisions[0].text).toBe('deleted text');
			expect(revisions[0].author).toBe('Jane Smith');
			expect(revisions[0].date).toBe('2024-01-16T14:00:00Z');
		});

		it('should extract multiple revisions from different paragraphs', () => {
			const xml = `<?xml version="1.0" encoding="UTF-8"?>
				<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
					<w:body>
						<w:p>
							<w:ins w:id="10" w:author="Author1" w:date="2024-01-01T00:00:00Z">
								<w:r><w:t>first insert</w:t></w:r>
							</w:ins>
						</w:p>
						<w:p>
							<w:del w:id="11" w:author="Author2" w:date="2024-01-02T00:00:00Z">
								<w:r><w:delText>first delete</w:delText></w:r>
							</w:del>
						</w:p>
						<w:p>
							<w:ins w:id="12" w:author="Author1" w:date="2024-01-03T00:00:00Z">
								<w:r><w:t>second insert</w:t></w:r>
							</w:ins>
						</w:p>
					</w:body>
				</w:document>`;

			const revisions = parseRevisions(xml);
			expect(revisions).toHaveLength(3);

			expect(revisions[0].id).toBe('10');
			expect(revisions[0].type).toBe('insert');
			expect(revisions[0].text).toBe('first insert');
			expect(revisions[0].paragraphIndex).toBe(0);

			expect(revisions[1].id).toBe('11');
			expect(revisions[1].type).toBe('delete');
			expect(revisions[1].text).toBe('first delete');
			expect(revisions[1].paragraphIndex).toBe(1);

			expect(revisions[2].id).toBe('12');
			expect(revisions[2].type).toBe('insert');
			expect(revisions[2].text).toBe('second insert');
			expect(revisions[2].paragraphIndex).toBe(2);
		});

		it('should handle missing author with default "Unknown"', () => {
			const xml = `<?xml version="1.0" encoding="UTF-8"?>
				<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
					<w:body>
						<w:p>
							<w:ins>
								<w:r><w:t>anonymous insert</w:t></w:r>
							</w:ins>
						</w:p>
					</w:body>
				</w:document>`;

			const revisions = parseRevisions(xml);
			expect(revisions[0].author).toBe('Unknown');
		});

		it('should skip empty revisions', () => {
			const xml = `<?xml version="1.0" encoding="UTF-8"?>
				<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
					<w:body>
						<w:p>
							<w:ins w:author="Test" w:date="2024-01-01T00:00:00Z">
								<w:r></w:r>
							</w:ins>
						</w:p>
					</w:body>
				</w:document>`;

			const revisions = parseRevisions(xml);
			expect(revisions).toHaveLength(0);
		});

		it('should extract context when includeContext is true', () => {
			const xml = `<?xml version="1.0" encoding="UTF-8"?>
				<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
					<w:body>
						<w:p>
							<w:r><w:t>Before text </w:t></w:r>
							<w:ins w:author="Test" w:date="2024-01-01T00:00:00Z">
								<w:r><w:t>inserted</w:t></w:r>
							</w:ins>
							<w:r><w:t> after text</w:t></w:r>
						</w:p>
					</w:body>
				</w:document>`;

			const revisions = parseRevisions(xml, { includeContext: true, contextLength: 20 });
			expect(revisions).toHaveLength(1);
			expect(revisions[0].context).not.toBeNull();
		});

		it('should not include context when includeContext is false', () => {
			const xml = `<?xml version="1.0" encoding="UTF-8"?>
				<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
					<w:body>
						<w:p>
							<w:r><w:t>Before </w:t></w:r>
							<w:ins w:author="Test" w:date="2024-01-01T00:00:00Z">
								<w:r><w:t>inserted</w:t></w:r>
							</w:ins>
							<w:r><w:t> after</w:t></w:r>
						</w:p>
					</w:body>
				</w:document>`;

			const revisions = parseRevisions(xml, { includeContext: false });
			expect(revisions[0].context).toBeNull();
		});
	});

	describe('generateRevisionSummary', () => {
		it('should generate correct summary for empty revisions', () => {
			const summary = generateRevisionSummary([]);
			expect(summary).toEqual({
				totalRevisions: 0,
				insertions: 0,
				deletions: 0,
				authors: [],
			});
		});

		it('should count insertions and deletions correctly', () => {
			const revisions: Revision[] = [
				{ id: '1', type: 'insert', text: 'a', author: 'A', date: '', paragraphIndex: 0, context: null },
				{ id: '2', type: 'insert', text: 'b', author: 'A', date: '', paragraphIndex: 0, context: null },
				{ id: '3', type: 'delete', text: 'c', author: 'B', date: '', paragraphIndex: 0, context: null },
			];

			const summary = generateRevisionSummary(revisions);
			expect(summary.totalRevisions).toBe(3);
			expect(summary.insertions).toBe(2);
			expect(summary.deletions).toBe(1);
		});

		it('should collect unique authors', () => {
			const revisions: Revision[] = [
				{ id: '1', type: 'insert', text: 'a', author: 'Alice', date: '', paragraphIndex: 0, context: null },
				{ id: '2', type: 'insert', text: 'b', author: 'Bob', date: '', paragraphIndex: 0, context: null },
				{ id: '3', type: 'delete', text: 'c', author: 'Alice', date: '', paragraphIndex: 0, context: null },
			];

			const summary = generateRevisionSummary(revisions);
			expect(summary.authors).toHaveLength(2);
			expect(summary.authors).toContain('Alice');
			expect(summary.authors).toContain('Bob');
		});
	});
});
