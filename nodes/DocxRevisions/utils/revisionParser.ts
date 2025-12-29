import { XMLParser } from 'fast-xml-parser';
import { extractTextFromXml } from './docxParser';

export interface Revision {
	type: 'insert' | 'delete';
	text: string;
	author: string;
	date: string;
	paragraphIndex: number;
	context: {
		before: string;
		after: string;
	} | null;
}

export interface RevisionSummary {
	totalRevisions: number;
	insertions: number;
	deletions: number;
	authors: string[];
}

export interface ParseRevisionOptions {
	includeContext?: boolean;
	contextLength?: number;
}

interface XmlElement {
	':@'?: Record<string, string>;
	[key: string]: unknown;
}

const parser = new XMLParser({
	ignoreAttributes: false,
	attributeNamePrefix: '@_',
	preserveOrder: true,
});

function getElementText(element: unknown): string {
	if (!element) return '';

	if (typeof element === 'string') return element;

	if (Array.isArray(element)) {
		return element.map((e) => getElementText(e)).join('');
	}

	if (typeof element === 'object') {
		const obj = element as Record<string, unknown>;
		let text = '';

		if ('w:t' in obj) {
			const wt = obj['w:t'];
			if (Array.isArray(wt)) {
				for (const item of wt) {
					if (typeof item === 'object' && '#text' in (item as Record<string, unknown>)) {
						text += (item as Record<string, unknown>)['#text'];
					}
				}
			}
		}

		for (const key of Object.keys(obj)) {
			if (key === ':@' || key === '#text') continue;
			text += getElementText(obj[key]);
		}

		return text;
	}

	return '';
}

function extractTextFromElement(element: unknown): string {
	return getElementText(element);
}

function getAttributeValue(element: XmlElement, attrName: string): string {
	const attrs = element[':@'];
	if (!attrs) return '';
	return attrs[`@_w:${attrName}`] || attrs[`@_${attrName}`] || '';
}

export function parseRevisions(documentXml: string, options: ParseRevisionOptions = {}): Revision[] {
	const { includeContext = false, contextLength = 50 } = options;
	const revisions: Revision[] = [];

	const parsed = parser.parse(documentXml);
	const paragraphs = findParagraphs(parsed);

	paragraphs.forEach((paragraph, paragraphIndex) => {
		const paragraphText = includeContext ? extractTextFromXml(serializeElement(paragraph)) : '';
		processElement(paragraph, paragraphIndex, paragraphText, revisions, includeContext, contextLength);
	});

	return revisions;
}

function findParagraphs(parsed: unknown): unknown[] {
	const paragraphs: unknown[] = [];

	function traverse(obj: unknown): void {
		if (!obj) return;

		if (Array.isArray(obj)) {
			for (const item of obj) {
				traverse(item);
			}
			return;
		}

		if (typeof obj === 'object') {
			const element = obj as Record<string, unknown>;
			if ('w:p' in element) {
				paragraphs.push(element['w:p']);
			}
			for (const key of Object.keys(element)) {
				if (key !== ':@') {
					traverse(element[key]);
				}
			}
		}
	}

	traverse(parsed);
	return paragraphs;
}

function serializeElement(element: unknown): string {
	if (!element) return '';
	if (typeof element === 'string') return element;
	if (Array.isArray(element)) {
		return element.map((e) => serializeElement(e)).join('');
	}
	if (typeof element === 'object') {
		const obj = element as Record<string, unknown>;
		let result = '';
		for (const key of Object.keys(obj)) {
			if (key === ':@') continue;
			if (key === '#text') {
				result += obj[key];
				continue;
			}
			if (key === 'w:t') {
				const content = obj[key];
				if (Array.isArray(content)) {
					for (const item of content) {
						if (typeof item === 'object' && '#text' in (item as Record<string, unknown>)) {
							result += `<w:t>${(item as Record<string, unknown>)['#text']}</w:t>`;
						}
					}
				}
			} else {
				result += serializeElement(obj[key]);
			}
		}
		return result;
	}
	return '';
}

function processElement(
	element: unknown,
	paragraphIndex: number,
	paragraphText: string,
	revisions: Revision[],
	includeContext: boolean,
	contextLength: number,
): void {
	if (!element) return;

	if (Array.isArray(element)) {
		for (const item of element) {
			processElement(item, paragraphIndex, paragraphText, revisions, includeContext, contextLength);
		}
		return;
	}

	if (typeof element !== 'object') return;

	const obj = element as Record<string, unknown>;

	if ('w:ins' in obj) {
		const insElement = obj['w:ins'] as XmlElement[];
		const attrs = obj[':@'] as Record<string, string> | undefined;
		const text = extractTextFromElement(insElement);

		if (text) {
			const revision: Revision = {
				type: 'insert',
				text,
				author: attrs?.['@_w:author'] || 'Unknown',
				date: attrs?.['@_w:date'] || '',
				paragraphIndex,
				context: includeContext ? extractContext(paragraphText, text, contextLength) : null,
			};
			revisions.push(revision);
		}
	}

	if ('w:del' in obj) {
		const delElement = obj['w:del'] as XmlElement[];
		const attrs = obj[':@'] as Record<string, string> | undefined;
		const text = extractDeletedText(delElement);

		if (text) {
			const revision: Revision = {
				type: 'delete',
				text,
				author: attrs?.['@_w:author'] || 'Unknown',
				date: attrs?.['@_w:date'] || '',
				paragraphIndex,
				context: includeContext ? extractContext(paragraphText, text, contextLength) : null,
			};
			revisions.push(revision);
		}
	}

	for (const key of Object.keys(obj)) {
		if (key !== ':@' && key !== 'w:ins' && key !== 'w:del') {
			processElement(obj[key], paragraphIndex, paragraphText, revisions, includeContext, contextLength);
		}
	}
}

function extractDeletedText(element: unknown): string {
	if (!element) return '';

	if (Array.isArray(element)) {
		return element.map((e) => extractDeletedText(e)).join('');
	}

	if (typeof element === 'object') {
		const obj = element as Record<string, unknown>;
		let text = '';

		if ('w:delText' in obj) {
			const delText = obj['w:delText'];
			if (Array.isArray(delText)) {
				for (const item of delText) {
					if (typeof item === 'object' && '#text' in (item as Record<string, unknown>)) {
						text += (item as Record<string, unknown>)['#text'];
					}
				}
			}
		}

		for (const key of Object.keys(obj)) {
			if (key !== ':@' && key !== 'w:delText') {
				text += extractDeletedText(obj[key]);
			}
		}

		return text;
	}

	return '';
}

function extractContext(
	paragraphText: string,
	targetText: string,
	contextLength: number,
): { before: string; after: string } {
	const plainText = extractTextFromXml(paragraphText);
	const index = plainText.indexOf(targetText);

	if (index === -1) {
		return { before: '', after: '' };
	}

	const before = plainText.substring(Math.max(0, index - contextLength), index);
	const after = plainText.substring(index + targetText.length, index + targetText.length + contextLength);

	return { before, after };
}

export function generateRevisionSummary(revisions: Revision[]): RevisionSummary {
	const insertions = revisions.filter((r) => r.type === 'insert').length;
	const deletions = revisions.filter((r) => r.type === 'delete').length;
	const authorsSet = new Set(revisions.map((r) => r.author));

	return {
		totalRevisions: revisions.length,
		insertions,
		deletions,
		authors: Array.from(authorsSet),
	};
}
