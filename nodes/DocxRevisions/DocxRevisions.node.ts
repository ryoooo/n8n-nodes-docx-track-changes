import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { extractRevisions } from './operations/extractRevisions';
import { extractComments } from './operations/extractComments';
import { acceptRevisionsOperation } from './operations/acceptRevisions';
import { rejectRevisionsOperation } from './operations/rejectRevisions';
import { getStatsOperation } from './operations/getStats';

export class DocxRevisions implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'DOCX Revisions',
		name: 'docxRevisions',
		icon: 'file:docxRevisions.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Extract revisions (track changes) and comments from DOCX documents',
		defaults: {
			name: 'DOCX Revisions',
		},
		inputs: ['main'],
		outputs: ['main'],
		usableAsTool: true,
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Accept Revisions',
						value: 'acceptRevisions',
						description: 'Accept tracked changes by ID or accept all',
						action: 'Accept revisions in DOCX',
					},
					{
						name: 'Extract Comments',
						value: 'extractComments',
						description: 'Extract comments and replies from a DOCX file',
						action: 'Extract comments from DOCX',
					},
					{
						name: 'Extract Revisions',
						value: 'extractRevisions',
						description: 'Extract tracked changes (insertions and deletions) from a DOCX file',
						action: 'Extract revisions from DOCX',
					},
					{
						name: 'Get Stats',
						value: 'getStats',
						description: 'Get revision and comment statistics from a DOCX file',
						action: 'Get stats from DOCX',
					},
					{
						name: 'Reject Revisions',
						value: 'rejectRevisions',
						description: 'Reject tracked changes by ID or reject all',
						action: 'Reject revisions in DOCX',
					},
				],
				default: 'extractRevisions',
			},
			{
				displayName: 'Input Binary Field',
				name: 'binaryPropertyName',
				type: 'string',
				default: 'data',
				required: true,
				description: 'Name of the binary property containing the DOCX file',
			},
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				displayOptions: {
					show: {
						operation: ['extractRevisions'],
					},
				},
				options: [
					{
						displayName: 'Include Context',
						name: 'includeContext',
						type: 'boolean',
						default: false,
						description: 'Whether to include surrounding text for each revision',
					},
					{
						displayName: 'Context Length',
						name: 'contextLength',
						type: 'number',
						default: 50,
						description: 'Number of characters to include before and after each revision',
						displayOptions: {
							show: {
								includeContext: [true],
							},
						},
					},
					{
						displayName: 'Include Summary',
						name: 'includeSummary',
						type: 'boolean',
						default: true,
						description: 'Whether to include revision statistics summary',
					},
				],
			},
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				displayOptions: {
					show: {
						operation: ['extractComments'],
					},
				},
				options: [
					{
						displayName: 'Include Resolved',
						name: 'includeResolved',
						type: 'boolean',
						default: true,
						description: 'Whether to include resolved comments',
					},
					{
						displayName: 'Include Summary',
						name: 'includeSummary',
						type: 'boolean',
						default: true,
						description: 'Whether to include comment statistics summary',
					},
				],
			},
			// Accept Revisions parameters
			{
				displayName: 'Accept All',
				name: 'acceptAll',
				type: 'boolean',
				default: false,
				description: 'Whether to accept all revisions instead of specific IDs',
				displayOptions: {
					show: {
						operation: ['acceptRevisions'],
					},
				},
			},
			{
				displayName: 'Revision IDs',
				name: 'revisionIds',
				type: 'string',
				typeOptions: {
					multipleValues: true,
				},
				default: [],
				description: 'IDs of revisions to accept (from Extract Revisions output)',
				displayOptions: {
					show: {
						operation: ['acceptRevisions'],
						acceptAll: [false],
					},
				},
			},
			{
				displayName: 'Output Binary Field',
				name: 'outputPropertyName',
				type: 'string',
				default: 'data',
				description: 'Name of the binary property for the modified DOCX file',
				displayOptions: {
					show: {
						operation: ['acceptRevisions'],
					},
				},
			},
			// Reject Revisions parameters
			{
				displayName: 'Reject All',
				name: 'rejectAll',
				type: 'boolean',
				default: false,
				description: 'Whether to reject all revisions instead of specific IDs',
				displayOptions: {
					show: {
						operation: ['rejectRevisions'],
					},
				},
			},
			{
				displayName: 'Revision IDs',
				name: 'revisionIds',
				type: 'string',
				typeOptions: {
					multipleValues: true,
				},
				default: [],
				description: 'IDs of revisions to reject (from Extract Revisions output)',
				displayOptions: {
					show: {
						operation: ['rejectRevisions'],
						rejectAll: [false],
					},
				},
			},
			{
				displayName: 'Output Binary Field',
				name: 'outputPropertyName',
				type: 'string',
				default: 'data',
				description: 'Name of the binary property for the modified DOCX file',
				displayOptions: {
					show: {
						operation: ['rejectRevisions'],
					},
				},
			},
			// Get Stats parameters
			{
				displayName: 'Include Author Breakdown',
				name: 'includeAuthorBreakdown',
				type: 'boolean',
				default: false,
				description: 'Whether to include per-author statistics breakdown',
				displayOptions: {
					show: {
						operation: ['getStats'],
					},
				},
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const operation = this.getNodeParameter('operation', 0) as string;

		for (let i = 0; i < items.length; i++) {
			try {
				if (operation === 'extractRevisions') {
					const result = await extractRevisions.call(this, i);
					returnData.push(result);
				} else if (operation === 'extractComments') {
					const result = await extractComments.call(this, i);
					returnData.push(result);
				} else if (operation === 'acceptRevisions') {
					const result = await acceptRevisionsOperation.call(this, i);
					returnData.push(result);
				} else if (operation === 'rejectRevisions') {
					const result = await rejectRevisionsOperation.call(this, i);
					returnData.push(result);
				} else if (operation === 'getStats') {
					const result = await getStatsOperation.call(this, i);
					returnData.push(result);
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: (error as Error).message },
						pairedItem: { item: i },
					});
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
