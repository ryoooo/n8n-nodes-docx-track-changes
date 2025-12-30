import { describe, it, expect } from 'vitest';
import {
	acceptRevision,
	rejectRevision,
	acceptAllRevisions,
	rejectAllRevisions,
} from './revisionOperator';

describe('revisionOperator', () => {
	describe('acceptRevision', () => {
		it('should accept an insertion by removing wrapper and keeping content', () => {
			const xml = `<w:p><w:ins w:id="1" w:author="Test"><w:r><w:t>inserted text</w:t></w:r></w:ins></w:p>`;
			const result = acceptRevision(xml, '1');

			expect(result.xml).toBe('<w:p><w:r><w:t>inserted text</w:t></w:r></w:p>');
			expect(result.processedIds).toContain('1');
			expect(result.warningIds).toHaveLength(0);
		});

		it('should accept a deletion by removing the entire element', () => {
			const xml = `<w:p><w:r><w:t>keep</w:t></w:r><w:del w:id="2" w:author="Test"><w:r><w:delText>deleted</w:delText></w:r></w:del></w:p>`;
			const result = acceptRevision(xml, '2');

			expect(result.xml).toBe('<w:p><w:r><w:t>keep</w:t></w:r></w:p>');
			expect(result.processedIds).toContain('2');
			expect(result.warningIds).toHaveLength(0);
		});

		it('should add to warningIds when ID is not found', () => {
			const xml = `<w:p><w:r><w:t>text</w:t></w:r></w:p>`;
			const result = acceptRevision(xml, '999');

			expect(result.xml).toBe(xml);
			expect(result.processedIds).toHaveLength(0);
			expect(result.warningIds).toContain('999');
		});
	});

	describe('rejectRevision', () => {
		it('should reject an insertion by removing the entire element', () => {
			const xml = `<w:p><w:r><w:t>before</w:t></w:r><w:ins w:id="1" w:author="Test"><w:r><w:t>inserted</w:t></w:r></w:ins><w:r><w:t>after</w:t></w:r></w:p>`;
			const result = rejectRevision(xml, '1');

			expect(result.xml).toBe('<w:p><w:r><w:t>before</w:t></w:r><w:r><w:t>after</w:t></w:r></w:p>');
			expect(result.processedIds).toContain('1');
			expect(result.warningIds).toHaveLength(0);
		});

		it('should reject a deletion by removing wrapper and converting delText to t', () => {
			const xml = `<w:p><w:del w:id="2" w:author="Test"><w:r><w:delText>restored text</w:delText></w:r></w:del></w:p>`;
			const result = rejectRevision(xml, '2');

			expect(result.xml).toBe('<w:p><w:r><w:t>restored text</w:t></w:r></w:p>');
			expect(result.processedIds).toContain('2');
			expect(result.warningIds).toHaveLength(0);
		});

		it('should add to warningIds when ID is not found', () => {
			const xml = `<w:p><w:r><w:t>text</w:t></w:r></w:p>`;
			const result = rejectRevision(xml, '999');

			expect(result.xml).toBe(xml);
			expect(result.processedIds).toHaveLength(0);
			expect(result.warningIds).toContain('999');
		});
	});

	describe('acceptAllRevisions', () => {
		it('should accept all revisions in document', () => {
			const xml = `<w:p>
				<w:ins w:id="1" w:author="A"><w:r><w:t>added1</w:t></w:r></w:ins>
				<w:del w:id="2" w:author="B"><w:r><w:delText>removed</w:delText></w:r></w:del>
				<w:ins w:id="3" w:author="A"><w:r><w:t>added2</w:t></w:r></w:ins>
			</w:p>`;

			const result = acceptAllRevisions(xml);

			expect(result.xml).toContain('<w:r><w:t>added1</w:t></w:r>');
			expect(result.xml).toContain('<w:r><w:t>added2</w:t></w:r>');
			expect(result.xml).not.toContain('w:ins');
			expect(result.xml).not.toContain('w:del');
			expect(result.xml).not.toContain('removed');
			expect(result.processedIds).toContain('1');
			expect(result.processedIds).toContain('2');
			expect(result.processedIds).toContain('3');
		});

		it('should handle document with no revisions', () => {
			const xml = `<w:p><w:r><w:t>no revisions</w:t></w:r></w:p>`;
			const result = acceptAllRevisions(xml);

			expect(result.xml).toBe(xml);
			expect(result.processedIds).toHaveLength(0);
		});
	});

	describe('rejectAllRevisions', () => {
		it('should reject all revisions in document', () => {
			const xml = `<w:p>
				<w:ins w:id="1" w:author="A"><w:r><w:t>will be removed</w:t></w:r></w:ins>
				<w:del w:id="2" w:author="B"><w:r><w:delText>will be restored</w:delText></w:r></w:del>
			</w:p>`;

			const result = rejectAllRevisions(xml);

			expect(result.xml).not.toContain('will be removed');
			expect(result.xml).not.toContain('w:ins');
			expect(result.xml).not.toContain('w:del');
			expect(result.xml).toContain('<w:t>will be restored</w:t>');
			expect(result.processedIds).toContain('1');
			expect(result.processedIds).toContain('2');
		});

		it('should handle document with no revisions', () => {
			const xml = `<w:p><w:r><w:t>no revisions</w:t></w:r></w:p>`;
			const result = rejectAllRevisions(xml);

			expect(result.xml).toBe(xml);
			expect(result.processedIds).toHaveLength(0);
		});
	});

	describe('edge cases', () => {
		it('should handle multiline revisions', () => {
			const xml = `<w:ins w:id="1" w:author="Test">
				<w:r>
					<w:t>multiline</w:t>
				</w:r>
			</w:ins>`;

			const result = acceptRevision(xml, '1');
			expect(result.xml).toContain('<w:r>');
			expect(result.xml).not.toContain('w:ins');
			expect(result.processedIds).toContain('1');
		});

		it('should handle revisions with special characters in ID', () => {
			const xml = `<w:ins w:id="123.456" w:author="Test"><w:r><w:t>text</w:t></w:r></w:ins>`;
			const result = acceptRevision(xml, '123.456');

			expect(result.processedIds).toContain('123.456');
		});

		it('should preserve delText attributes when rejecting deletion', () => {
			const xml = `<w:del w:id="1" w:author="Test"><w:r><w:delText xml:space="preserve"> text with spaces </w:delText></w:r></w:del>`;
			const result = rejectRevision(xml, '1');

			expect(result.xml).toContain('<w:t xml:space="preserve">');
			expect(result.xml).toContain(' text with spaces ');
		});
	});
});
