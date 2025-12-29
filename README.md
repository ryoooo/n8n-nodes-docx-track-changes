# n8n-nodes-docx-revisions

n8n community node for extracting revisions (track changes) and comments from Microsoft Word (.docx) documents.

## Features

- **Extract Revisions**: Extract tracked changes (insertions and deletions) from DOCX files
- **Extract Comments**: Extract comments and replies from DOCX files
- Support for multiple authors
- Context extraction for revisions
- Summary statistics

## Installation

### Community Nodes (Recommended)

1. Go to **Settings > Community Nodes**
2. Select **Install**
3. Enter `n8n-nodes-docx-revisions`
4. Agree to the risks and select **Install**

### Manual Installation

```bash
npm install n8n-nodes-docx-revisions
```

## Operations

### Extract Revisions

Extracts tracked changes from a DOCX file.

**Options:**
- **Include Context**: Include surrounding text for each revision
- **Context Length**: Number of characters to include before/after
- **Include Summary**: Include revision statistics

**Output:**
```json
{
  "revisions": [
    {
      "type": "insert",
      "text": "added text",
      "author": "John Doe",
      "date": "2024-01-15T10:30:00Z",
      "paragraphIndex": 5,
      "context": {
        "before": "text before",
        "after": "text after"
      }
    }
  ],
  "summary": {
    "totalRevisions": 10,
    "insertions": 7,
    "deletions": 3,
    "authors": ["John Doe", "Jane Smith"]
  }
}
```

### Extract Comments

Extracts comments and replies from a DOCX file.

**Options:**
- **Include Resolved**: Include resolved comments
- **Include Summary**: Include comment statistics

**Output:**
```json
{
  "comments": [
    {
      "id": "1",
      "author": "John Doe",
      "date": "2024-01-15T10:30:00Z",
      "text": "Please review this section",
      "targetText": "The commented text",
      "resolved": false,
      "replies": [
        {
          "id": "2",
          "author": "Jane Smith",
          "date": "2024-01-15T11:00:00Z",
          "text": "Looks good to me"
        }
      ]
    }
  ],
  "summary": {
    "totalComments": 5,
    "totalReplies": 3,
    "resolved": 2,
    "unresolved": 3,
    "authors": ["John Doe", "Jane Smith"]
  }
}
```

## Usage Example

1. Add a **Read Binary File** node or any node that outputs binary data
2. Connect to the **DOCX Revisions** node
3. Select the operation (Extract Revisions or Extract Comments)
4. Configure options as needed
5. Execute the workflow

## Compatibility

- n8n version: 1.0.0+
- Node.js: 20.x or later

## License

[MIT](LICENSE)

## Author

Your Name

## Links

- [n8n Community Nodes Documentation](https://docs.n8n.io/integrations/community-nodes/)
- [GitHub Repository](https://github.com/your-org/n8n-nodes-docx-revisions)
