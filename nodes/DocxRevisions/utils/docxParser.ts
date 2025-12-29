import JSZip from 'jszip';

export interface DocxFiles {
	document: string | null;
	comments: string | null;
	commentsExtended: string | null;
}

export class InvalidFileFormatError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'InvalidFileFormatError';
	}
}

export async function parseDocx(buffer: Buffer): Promise<DocxFiles> {
	let zip: JSZip;

	try {
		zip = await JSZip.loadAsync(buffer);
	} catch {
		throw new InvalidFileFormatError('Failed to parse file as ZIP archive. Please provide a valid .docx file.');
	}

	const contentTypesFile = zip.file('[Content_Types].xml');
	if (!contentTypesFile) {
		throw new InvalidFileFormatError('Invalid .docx file: missing [Content_Types].xml');
	}

	const documentFile = zip.file('word/document.xml');
	const commentsFile = zip.file('word/comments.xml');
	const commentsExtendedFile = zip.file('word/commentsExtended.xml');

	const document = documentFile ? await documentFile.async('string') : null;
	const comments = commentsFile ? await commentsFile.async('string') : null;
	const commentsExtended = commentsExtendedFile ? await commentsExtendedFile.async('string') : null;

	return {
		document,
		comments,
		commentsExtended,
	};
}

export function extractTextFromXml(xml: string): string {
	const textMatches = xml.match(/<w:t[^>]*>([^<]*)<\/w:t>/g) || [];
	return textMatches
		.map((match) => {
			const textMatch = match.match(/<w:t[^>]*>([^<]*)<\/w:t>/);
			return textMatch ? textMatch[1] : '';
		})
		.join('');
}
