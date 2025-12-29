# n8n-nodes-docx-revisions

![n8n.io - Workflow Automation](https://img.shields.io/badge/n8n-community%20node-ff6d5a)
![npm](https://img.shields.io/npm/v/n8n-nodes-docx-revisions)
![License](https://img.shields.io/npm/l/n8n-nodes-docx-revisions)

This is an n8n community node that extracts **revisions (track changes)** and **comments** from Microsoft Word (.docx) documents.

Perfect for automating document review workflows, contract management, and approval processes.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

## Features

- **Extract Revisions** - Get all tracked changes (insertions and deletions) with author and timestamp
- **Extract Comments** - Get all comments with replies, resolution status, and target text
- **Context Support** - Include surrounding text for each revision
- **Summary Statistics** - Get counts by type, author, and status
- **AI Agent Compatible** - Use as a tool in AI workflows (`usableAsTool: true`)

## Installation

### Community Nodes (Recommended)

1. Go to **Settings** > **Community Nodes**
2. Select **Install**
3. Enter `n8n-nodes-docx-revisions`
4. Agree to the risks and select **Install**

### Manual Installation

```bash
# In your n8n installation directory
npm install n8n-nodes-docx-revisions
```

## Operations

### Extract Revisions

Extracts tracked changes (insertions and deletions) from a DOCX file.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| Input Binary Field | string | `data` | Binary property containing the DOCX file |
| Include Context | boolean | `false` | Include surrounding text for each revision |
| Context Length | number | `50` | Characters to include before/after |
| Include Summary | boolean | `true` | Include revision statistics |

**Output Example:**

```json
{
  "revisions": [
    {
      "type": "insert",
      "text": "新しい条項",
      "author": "田中 太郎",
      "date": "2025-01-15T10:30:00Z",
      "paragraphIndex": 5,
      "context": {
        "before": "契約書の",
        "after": "について"
      }
    },
    {
      "type": "delete",
      "text": "旧条項",
      "author": "田中 太郎",
      "date": "2025-01-15T10:31:00Z",
      "paragraphIndex": 5,
      "context": null
    }
  ],
  "summary": {
    "totalRevisions": 15,
    "insertions": 12,
    "deletions": 3,
    "authors": ["田中 太郎", "鈴木 花子"]
  }
}
```

### Extract Comments

Extracts comments and replies from a DOCX file.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| Input Binary Field | string | `data` | Binary property containing the DOCX file |
| Include Resolved | boolean | `true` | Include resolved comments |
| Include Summary | boolean | `true` | Include comment statistics |

**Output Example:**

```json
{
  "comments": [
    {
      "id": "1",
      "author": "田中 太郎",
      "date": "2025-01-15T10:30:00Z",
      "text": "この部分を確認してください",
      "targetText": "契約期間は1年間とする",
      "resolved": false,
      "replies": [
        {
          "id": "2",
          "author": "鈴木 花子",
          "date": "2025-01-15T11:00:00Z",
          "text": "確認しました。問題ありません。"
        }
      ]
    }
  ],
  "summary": {
    "totalComments": 5,
    "totalReplies": 3,
    "resolved": 2,
    "unresolved": 3,
    "authors": ["田中 太郎", "鈴木 花子"]
  }
}
```

## Usage Examples

### Basic Workflow

```
[Read Binary File] → [DOCX Revisions] → [IF] → [Slack/Email]
```

1. **Read Binary File** - Load the DOCX file
2. **DOCX Revisions** - Extract revisions or comments
3. **IF** - Check if there are unresolved items
4. **Slack/Email** - Notify reviewers

### Contract Review Automation

```
[Webhook] → [DOCX Revisions (Extract Revisions)] → [Code] → [Google Sheets]
```

Track all contract changes in a spreadsheet for audit purposes.

### Comment Aggregation

```
[Google Drive Trigger] → [DOCX Revisions (Extract Comments)] → [Filter] → [Notion]
```

Automatically collect unresolved comments from shared documents.

## Compatibility

| Requirement | Version |
|-------------|---------|
| n8n | 2.0.0+ |
| Node.js | 20.19.0 - 24.x |

> **Note:** This node uses external dependencies (`jszip`, `fast-xml-parser`) and is designed for **self-hosted n8n**. It is not compatible with n8n Cloud's strict verification requirements.

## Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Run tests
pnpm test

# Build for production
pnpm build

# Lint code
pnpm lint
```

## Resources

- [n8n Community Nodes Documentation](https://docs.n8n.io/integrations/community-nodes/)
- [Creating n8n Nodes](https://docs.n8n.io/integrations/creating-nodes/)
- [OpenXML Track Changes Specification](https://learn.microsoft.com/en-us/dotnet/api/documentformat.openxml.wordprocessing.insertedrun)

## License

[MIT](LICENSE)

## Author

**ryoooo** - [@maekwnnn](mailto:maekwnnn@gmail.com)

---

Made with ❤️ for the n8n community
