import { XMLParser } from 'fast-xml-parser';

export interface Comment {
	id: string;
	author: string;
	date: string;
	text: string;
	targetText: string | null;
	resolved: boolean;
	replies: Reply[];
}

export interface Reply {
	id: string;
	author: string;
	date: string;
	text: string;
}

export interface CommentSummary {
	totalComments: number;
	totalReplies: number;
	resolved: number;
	unresolved: number;
	authors: string[];
}

export interface ParseCommentOptions {
	includeReplies?: boolean;
	includeResolved?: boolean;
}

const parser = new XMLParser({
	ignoreAttributes: false,
	attributeNamePrefix: '@_',
	preserveOrder: true,
});

function getTextContent(element: unknown): string {
	if (!element) return '';

	if (typeof element === 'string') return element;

	if (Array.isArray(element)) {
		return element.map((e) => getTextContent(e)).join('');
	}

	if (typeof element === 'object') {
		const obj = element as Record<string, unknown>;
		let text = '';

		if ('#text' in obj) {
			text += obj['#text'];
		}

		for (const key of Object.keys(obj)) {
			if (key === ':@' || key === '#text') continue;
			text += getTextContent(obj[key]);
		}

		return text;
	}

	return '';
}

export function parseComments(
	commentsXml: string | null,
	commentsExtendedXml: string | null,
	documentXml: string | null,
	options: ParseCommentOptions = {},
): Comment[] {
	const { includeReplies = true, includeResolved = true } = options;

	if (!commentsXml) {
		return [];
	}

	const parsed = parser.parse(commentsXml);
	const comments: Comment[] = [];
	const commentMap = new Map<string, Comment>();

	const resolvedIds = commentsExtendedXml ? parseResolvedComments(commentsExtendedXml) : new Set<string>();
	const parentMap = commentsExtendedXml ? parseParentRelations(commentsExtendedXml) : new Map<string, string>();
	const commentRanges = documentXml ? parseCommentRanges(documentXml) : new Map<string, string>();

	traverseComments(parsed, (commentElement, attrs) => {
		const id = attrs?.['@_w:id'] || '';
		const author = attrs?.['@_w:author'] || 'Unknown';
		const date = attrs?.['@_w:date'] || '';
		const text = getTextContent(commentElement);
		const resolved = resolvedIds.has(id);

		const comment: Comment = {
			id,
			author,
			date,
			text,
			targetText: commentRanges.get(id) || null,
			resolved,
			replies: [],
		};

		commentMap.set(id, comment);
	});

	for (const [childId, parentId] of parentMap) {
		const child = commentMap.get(childId);
		const parent = commentMap.get(parentId);

		if (child && parent && includeReplies) {
			const reply: Reply = {
				id: child.id,
				author: child.author,
				date: child.date,
				text: child.text,
			};
			parent.replies.push(reply);
			commentMap.delete(childId);
		}
	}

	for (const comment of commentMap.values()) {
		if (!includeResolved && comment.resolved) {
			continue;
		}
		comments.push(comment);
	}

	return comments;
}

function traverseComments(
	obj: unknown,
	callback: (element: unknown, attrs: Record<string, string> | undefined) => void,
): void {
	if (!obj) return;

	if (Array.isArray(obj)) {
		for (const item of obj) {
			traverseComments(item, callback);
		}
		return;
	}

	if (typeof obj === 'object') {
		const element = obj as Record<string, unknown>;

		if ('w:comment' in element) {
			const commentElement = element['w:comment'];
			const attrs = element[':@'] as Record<string, string> | undefined;
			callback(commentElement, attrs);
		}

		for (const key of Object.keys(element)) {
			if (key !== ':@') {
				traverseComments(element[key], callback);
			}
		}
	}
}

function parseResolvedComments(commentsExtendedXml: string): Set<string> {
	const resolvedIds = new Set<string>();
	const parsed = parser.parse(commentsExtendedXml);

	traverseCommentsEx(parsed, (attrs) => {
		const done = attrs?.['@_w15:done'];
		const paraId = attrs?.['@_w15:paraId'];

		if (done === '1' && paraId) {
			resolvedIds.add(paraId);
		}
	});

	return resolvedIds;
}

function parseParentRelations(commentsExtendedXml: string): Map<string, string> {
	const parentMap = new Map<string, string>();
	const parsed = parser.parse(commentsExtendedXml);

	traverseCommentsEx(parsed, (attrs) => {
		const paraId = attrs?.['@_w15:paraId'];
		const parentParaId = attrs?.['@_w15:paraIdParent'];

		if (paraId && parentParaId) {
			parentMap.set(paraId, parentParaId);
		}
	});

	return parentMap;
}

function traverseCommentsEx(
	obj: unknown,
	callback: (attrs: Record<string, string> | undefined) => void,
): void {
	if (!obj) return;

	if (Array.isArray(obj)) {
		for (const item of obj) {
			traverseCommentsEx(item, callback);
		}
		return;
	}

	if (typeof obj === 'object') {
		const element = obj as Record<string, unknown>;

		if ('w15:commentEx' in element) {
			const attrs = element[':@'] as Record<string, string> | undefined;
			callback(attrs);
		}

		for (const key of Object.keys(element)) {
			if (key !== ':@') {
				traverseCommentsEx(element[key], callback);
			}
		}
	}
}

function parseCommentRanges(documentXml: string): Map<string, string> {
	const ranges = new Map<string, string>();
	const rangeStarts = new Map<string, number>();
	const rangeEnds = new Map<string, number>();

	let currentOffset = 0;
	let fullText = '';

	const regex = /<(w:commentRangeStart|w:commentRangeEnd|w:t)[^>]*(?:\/>|>([^<]*)<\/w:t>)/g;
	let match;

	while ((match = regex.exec(documentXml)) !== null) {
		const tag = match[1];
		const content = match[2] || '';

		if (tag === 'w:t') {
			fullText += content;
			currentOffset = fullText.length;
		} else if (tag === 'w:commentRangeStart') {
			const idMatch = match[0].match(/w:id="(\d+)"/);
			if (idMatch) {
				rangeStarts.set(idMatch[1], currentOffset);
			}
		} else if (tag === 'w:commentRangeEnd') {
			const idMatch = match[0].match(/w:id="(\d+)"/);
			if (idMatch) {
				rangeEnds.set(idMatch[1], currentOffset);
			}
		}
	}

	for (const [id, startOffset] of rangeStarts) {
		const endOffset = rangeEnds.get(id);
		if (endOffset !== undefined) {
			const targetText = fullText.substring(startOffset, endOffset);
			ranges.set(id, targetText);
		}
	}

	return ranges;
}

export function generateCommentSummary(comments: Comment[]): CommentSummary {
	const totalReplies = comments.reduce((sum, c) => sum + c.replies.length, 0);
	const resolved = comments.filter((c) => c.resolved).length;

	const authorsSet = new Set<string>();
	for (const comment of comments) {
		authorsSet.add(comment.author);
		for (const reply of comment.replies) {
			authorsSet.add(reply.author);
		}
	}

	return {
		totalComments: comments.length,
		totalReplies,
		resolved,
		unresolved: comments.length - resolved,
		authors: Array.from(authorsSet),
	};
}
