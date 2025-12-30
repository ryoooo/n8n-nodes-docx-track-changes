export interface OperationResult {
	xml: string;
	processedIds: string[];
	warningIds: string[];
}

/**
 * Accepts a revision by ID.
 * - For insertions (w:ins): Remove the wrapper element, keep the content
 * - For deletions (w:del): Remove the entire element including content
 */
export function acceptRevision(xml: string, id: string): OperationResult {
	const result: OperationResult = {
		xml,
		processedIds: [],
		warningIds: [],
	};

	// Handle w:ins (insertions) - remove wrapper, keep content
	const insRegex = new RegExp(
		`<w:ins[^>]*\\s+w:id="${escapeRegex(id)}"[^>]*>(.*?)</w:ins>`,
		'gs',
	);
	const insMatch = xml.match(insRegex);
	if (insMatch) {
		result.xml = result.xml.replace(insRegex, '$1');
		result.processedIds.push(id);
		return result;
	}

	// Handle w:del (deletions) - remove entire element
	const delRegex = new RegExp(
		`<w:del[^>]*\\s+w:id="${escapeRegex(id)}"[^>]*>.*?</w:del>`,
		'gs',
	);
	const delMatch = xml.match(delRegex);
	if (delMatch) {
		result.xml = result.xml.replace(delRegex, '');
		result.processedIds.push(id);
		return result;
	}

	// ID not found
	result.warningIds.push(id);
	return result;
}

/**
 * Rejects a revision by ID.
 * - For insertions (w:ins): Remove the entire element including content
 * - For deletions (w:del): Remove the wrapper, convert w:delText to w:t
 */
export function rejectRevision(xml: string, id: string): OperationResult {
	const result: OperationResult = {
		xml,
		processedIds: [],
		warningIds: [],
	};

	// Handle w:ins (insertions) - remove entire element
	const insRegex = new RegExp(
		`<w:ins[^>]*\\s+w:id="${escapeRegex(id)}"[^>]*>.*?</w:ins>`,
		'gs',
	);
	const insMatch = xml.match(insRegex);
	if (insMatch) {
		result.xml = result.xml.replace(insRegex, '');
		result.processedIds.push(id);
		return result;
	}

	// Handle w:del (deletions) - remove wrapper, convert delText to t
	const delRegex = new RegExp(
		`<w:del[^>]*\\s+w:id="${escapeRegex(id)}"[^>]*>(.*?)</w:del>`,
		'gs',
	);
	const delMatch = xml.match(delRegex);
	if (delMatch) {
		result.xml = result.xml.replace(delRegex, (_, content: string) => {
			// Convert w:delText to w:t
			return content.replace(/<w:delText([^>]*)>/g, '<w:t$1>').replace(/<\/w:delText>/g, '</w:t>');
		});
		result.processedIds.push(id);
		return result;
	}

	// ID not found
	result.warningIds.push(id);
	return result;
}

/**
 * Accepts all revisions in the document.
 */
export function acceptAllRevisions(xml: string): OperationResult {
	const result: OperationResult = {
		xml,
		processedIds: [],
		warningIds: [],
	};

	// Collect all revision IDs first
	const insIds = collectRevisionIds(xml, 'w:ins');
	const delIds = collectRevisionIds(xml, 'w:del');

	// Accept all insertions - remove wrapper, keep content
	result.xml = result.xml.replace(
		/<w:ins[^>]*>(.*?)<\/w:ins>/gs,
		'$1',
	);
	result.processedIds.push(...insIds);

	// Accept all deletions - remove entire element
	result.xml = result.xml.replace(
		/<w:del[^>]*>.*?<\/w:del>/gs,
		'',
	);
	result.processedIds.push(...delIds);

	return result;
}

/**
 * Rejects all revisions in the document.
 */
export function rejectAllRevisions(xml: string): OperationResult {
	const result: OperationResult = {
		xml,
		processedIds: [],
		warningIds: [],
	};

	// Collect all revision IDs first
	const insIds = collectRevisionIds(xml, 'w:ins');
	const delIds = collectRevisionIds(xml, 'w:del');

	// Reject all insertions - remove entire element
	result.xml = result.xml.replace(
		/<w:ins[^>]*>.*?<\/w:ins>/gs,
		'',
	);
	result.processedIds.push(...insIds);

	// Reject all deletions - remove wrapper, convert delText to t
	result.xml = result.xml.replace(
		/<w:del[^>]*>(.*?)<\/w:del>/gs,
		(_, content: string) => {
			return content.replace(/<w:delText([^>]*)>/g, '<w:t$1>').replace(/<\/w:delText>/g, '</w:t>');
		},
	);
	result.processedIds.push(...delIds);

	return result;
}

/**
 * Collect revision IDs from the document
 */
function collectRevisionIds(xml: string, tagName: string): string[] {
	const ids: string[] = [];
	const regex = new RegExp(`<${tagName}[^>]*\\s+w:id="([^"]+)"[^>]*>`, 'g');
	let match;
	while ((match = regex.exec(xml)) !== null) {
		ids.push(match[1]);
	}
	return ids;
}

function escapeRegex(str: string): string {
	return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
