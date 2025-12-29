# Change: Phase 1 MVP - Extract Revisions & Comments

## Why

docxの編集履歴（Track Changes）とコメントを抽出するn8nノードが存在しない。契約書レビューや文書監査のワークフローを自動化するために、基本的な抽出機能が必要。

## What Changes

- **ADDED** Extract Revisions機能：docxから挿入・削除の履歴を抽出
- **ADDED** Extract Comments機能：docxからコメントと返信を抽出
- **ADDED** 共通ユーティリティ：docxパース、XMLハンドリング

## Impact

- Affected specs: `extract-revisions`, `extract-comments`（新規）
- Affected code:
  - `nodes/DocxRevisions/DocxRevisions.node.ts`
  - `nodes/DocxRevisions/operations/extractRevisions.ts`
  - `nodes/DocxRevisions/operations/extractComments.ts`
  - `nodes/DocxRevisions/utils/docxParser.ts`
  - `nodes/DocxRevisions/utils/revisionParser.ts`
  - `nodes/DocxRevisions/utils/commentParser.ts`
