import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { parseDocx, InvalidFileFormatError } from '../utils/docxParser';
import { rebuildDocx } from '../utils/docxWriter';
import { rejectRevision, rejectAllRevisions } from '../utils/revisionOperator';

export interface RejectRevisionsResult {
	rejectedCount: number;
	rejectedIds: string[];
	warningIds: string[];
}

export async function rejectRevisionsOperation(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData> {
	const binaryPropertyName = this.getNodeParameter('binaryPropertyName', itemIndex) as string;
	const outputPropertyName = this.getNodeParameter('outputPropertyName', itemIndex, 'data') as string;
	const rejectAll = this.getNodeParameter('rejectAll', itemIndex, false) as boolean;
	const revisionIds = this.getNodeParameter('revisionIds', itemIndex, []) as string[];

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

	let modifiedXml = docxFiles.document;
	const result: RejectRevisionsResult = {
		rejectedCount: 0,
		rejectedIds: [],
		warningIds: [],
	};

	if (rejectAll) {
		const opResult = rejectAllRevisions(modifiedXml);
		modifiedXml = opResult.xml;
		result.rejectedIds = opResult.processedIds;
		result.rejectedCount = opResult.processedIds.length;
	} else {
		for (const id of revisionIds) {
			const opResult = rejectRevision(modifiedXml, id);
			modifiedXml = opResult.xml;
			result.rejectedIds.push(...opResult.processedIds);
			result.warningIds.push(...opResult.warningIds);
		}
		result.rejectedCount = result.rejectedIds.length;
	}

	const modifiedBuffer = await rebuildDocx(buffer, {
		document: modifiedXml,
	});

	const binaryData = await this.helpers.prepareBinaryData(
		modifiedBuffer,
		item.binary[binaryPropertyName].fileName ?? 'document.docx',
		'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
	);

	return {
		json: {
			rejectedCount: result.rejectedCount,
			rejectedIds: result.rejectedIds,
			warningIds: result.warningIds,
		},
		binary: {
			[outputPropertyName]: binaryData,
		},
		pairedItem: { item: itemIndex },
	};
}
