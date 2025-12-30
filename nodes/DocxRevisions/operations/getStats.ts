import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { parseDocx, InvalidFileFormatError } from '../utils/docxParser';
import { parseRevisions, generateRevisionSummary } from '../utils/revisionParser';
import { parseComments, generateCommentSummary } from '../utils/commentParser';

export interface AuthorBreakdown {
	author: string;
	insertions: number;
	deletions: number;
	comments: number;
}

export interface DocumentStats {
	revisions: {
		total: number;
		insertions: number;
		deletions: number;
		authors: string[];
	};
	comments: {
		total: number;
		replies: number;
		resolved: number;
		unresolved: number;
		authors: string[];
	};
	authorBreakdown?: AuthorBreakdown[];
}

export async function getStatsOperation(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData> {
	const binaryPropertyName = this.getNodeParameter('binaryPropertyName', itemIndex) as string;
	const includeAuthorBreakdown = this.getNodeParameter('includeAuthorBreakdown', itemIndex, false) as boolean;

	const item = this.getInputData()[itemIndex];

	if (!item.binary || !item.binary[binaryPropertyName]) {
		throw new NodeOperationError(
			this.getNode(),
			`No binary data found in property "${binaryPropertyName}"`,
			{ itemIndex },
		);
	}

	const buffer = await this.helpers.getBinaryDataBuffer(itemIndex, binaryPropertyName);

	let docxFiles;
	try {
		docxFiles = await parseDocx(buffer);
	} catch (error) {
		if (error instanceof InvalidFileFormatError) {
			throw new NodeOperationError(this.getNode(), error.message, { itemIndex });
		}
		throw error;
	}

	if (!docxFiles.document) {
		throw new NodeOperationError(
			this.getNode(),
			'Invalid .docx file: missing document.xml',
			{ itemIndex },
		);
	}

	const revisions = parseRevisions(docxFiles.document);
	const revisionSummary = generateRevisionSummary(revisions);

	const comments = parseComments(
		docxFiles.comments,
		docxFiles.commentsExtended,
		docxFiles.document,
	);
	const commentSummary = generateCommentSummary(comments);

	const stats: DocumentStats = {
		revisions: {
			total: revisionSummary.totalRevisions,
			insertions: revisionSummary.insertions,
			deletions: revisionSummary.deletions,
			authors: revisionSummary.authors,
		},
		comments: {
			total: commentSummary.totalComments,
			replies: commentSummary.totalReplies,
			resolved: commentSummary.resolved,
			unresolved: commentSummary.unresolved,
			authors: commentSummary.authors,
		},
	};

	if (includeAuthorBreakdown) {
		const authorMap = new Map<string, AuthorBreakdown>();

		// Count revisions by author
		for (const revision of revisions) {
			const author = revision.author;
			if (!authorMap.has(author)) {
				authorMap.set(author, { author, insertions: 0, deletions: 0, comments: 0 });
			}
			const breakdown = authorMap.get(author)!;
			if (revision.type === 'insert') {
				breakdown.insertions++;
			} else {
				breakdown.deletions++;
			}
		}

		// Count comments by author
		for (const comment of comments) {
			const author = comment.author;
			if (!authorMap.has(author)) {
				authorMap.set(author, { author, insertions: 0, deletions: 0, comments: 0 });
			}
			authorMap.get(author)!.comments++;

			// Count replies
			for (const reply of comment.replies) {
				const replyAuthor = reply.author;
				if (!authorMap.has(replyAuthor)) {
					authorMap.set(replyAuthor, { author: replyAuthor, insertions: 0, deletions: 0, comments: 0 });
				}
				authorMap.get(replyAuthor)!.comments++;
			}
		}

		stats.authorBreakdown = Array.from(authorMap.values());
	}

	return {
		json: {
			revisions: stats.revisions,
			comments: stats.comments,
			...(stats.authorBreakdown && { authorBreakdown: stats.authorBreakdown }),
		},
		pairedItem: { item: itemIndex },
	};
}
