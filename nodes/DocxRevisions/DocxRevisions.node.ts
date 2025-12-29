import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';

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
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Extract Revisions',
						value: 'extractRevisions',
						description: 'Extract tracked changes (insertions and deletions) from a DOCX file',
						action: 'Extract revisions from DOCX',
					},
					{
						name: 'Extract Comments',
						value: 'extractComments',
						description: 'Extract comments and replies from a DOCX file',
						action: 'Extract comments from DOCX',
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
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const operation = this.getNodeParameter('operation', 0) as string;

		for (let i = 0; i < items.length; i++) {
			try {
				if (operation === 'extractRevisions') {
					// TODO: Implement in extractRevisions.ts
					returnData.push({
						json: {
							revisions: [],
							summary: {
								totalRevisions: 0,
								insertions: 0,
								deletions: 0,
							},
						},
					});
				} else if (operation === 'extractComments') {
					// TODO: Implement in extractComments.ts
					returnData.push({
						json: {
							comments: [],
							summary: {
								totalComments: 0,
								resolvedComments: 0,
								unresolvedComments: 0,
							},
						},
					});
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
