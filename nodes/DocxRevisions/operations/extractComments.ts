import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { parseDocx, InvalidFileFormatError } from '../utils/docxParser';
import { parseComments, generateCommentSummary } from '../utils/commentParser';

export async function extractComments(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData> {
	const binaryPropertyName = this.getNodeParameter('binaryPropertyName', itemIndex) as string;
	const options = this.getNodeParameter('options', itemIndex, {}) as {
		includeResolved?: boolean;
		includeSummary?: boolean;
	};

	const includeResolved = options.includeResolved ?? true;
	const includeSummary = options.includeSummary ?? true;

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

	const comments = parseComments(
		docxFiles.comments,
		docxFiles.commentsExtended,
		docxFiles.document,
		{
			includeReplies: true,
			includeResolved,
		},
	);

	return {
		json: {
			comments,
			summary: includeSummary ? generateCommentSummary(comments) : null,
		},
		pairedItem: { item: itemIndex },
	};
}
