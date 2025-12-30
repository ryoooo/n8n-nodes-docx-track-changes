import JSZip from 'jszip';

export interface DocxWriteOptions {
	document: string;
	comments?: string | null;
	commentsExtended?: string | null;
}

/**
 * Rebuilds a docx file with modified XML content.
 * Preserves all other files in the original archive.
 */
export async function rebuildDocx(
	originalBuffer: Buffer,
	options: DocxWriteOptions,
): Promise<Buffer> {
	const zip = await JSZip.loadAsync(originalBuffer);

	// Update document.xml with modified content
	zip.file('word/document.xml', options.document);

	// Update comments.xml if provided
	if (options.comments !== undefined) {
		if (options.comments === null) {
			zip.remove('word/comments.xml');
		} else {
			zip.file('word/comments.xml', options.comments);
		}
	}

	// Update commentsExtended.xml if provided
	if (options.commentsExtended !== undefined) {
		if (options.commentsExtended === null) {
			zip.remove('word/commentsExtended.xml');
		} else {
			zip.file('word/commentsExtended.xml', options.commentsExtended);
		}
	}

	const result = await zip.generateAsync({
		type: 'nodebuffer',
		compression: 'DEFLATE',
		compressionOptions: { level: 9 },
	});

	return result;
}
