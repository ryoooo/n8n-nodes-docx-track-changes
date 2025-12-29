import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { parseDocx, InvalidFileFormatError } from '../utils/docxParser';
import { parseRevisions, generateRevisionSummary } from '../utils/revisionParser';

export async function extractRevisions(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData> {
	const binaryPropertyName = this.getNodeParameter('binaryPropertyName', itemIndex) as string;
	const options = this.getNodeParameter('options', itemIndex, {}) as {
		includeContext?: boolean;
		contextLength?: number;
		includeSummary?: boolean;
	};

	const includeContext = options.includeContext ?? false;
	const contextLength = options.contextLength ?? 50;
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

	if (!docxFiles.document) {
		throw new NodeOperationError(
			this.getNode(),
			'Invalid .docx file: missing document.xml',
			{ itemIndex },
		);
	}

	const revisions = parseRevisions(docxFiles.document, {
		includeContext,
		contextLength,
	});

	return {
		json: {
			revisions,
			summary: includeSummary ? generateRevisionSummary(revisions) : null,
		},
		pairedItem: { item: itemIndex },
	};
}
