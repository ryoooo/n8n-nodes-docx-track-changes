# Project Context

## Purpose

Microsoft Word文書（.docx）の編集履歴（Track Changes）とコメントを操作するn8nコミュニティノード。既存ノードがカバーしていない領域に特化。

主なユースケース：
- 契約書レビュー：AIで修正提案 → 履歴付きで差分確認
- 文書監査：誰がいつ何を変更したか抽出
- 承認ワークフロー：レビュー完了後に履歴を一括承認
- コメント集約：複数レビュアーのコメントをJSON化してSlack通知など

## Tech Stack

- TypeScript
- Node.js 22（n8n要件: 20.19 ~ 24.x）
- pnpm 10.2+（corepack経由）
- n8n 2.2.0（ワークフロー自動化プラットフォーム）
- jszip ^3.10.1（ZIP解凍）
- fast-xml-parser ^4.3.0（XMLパース）

## Project Conventions

### Code Style

- n8nノード開発規約に準拠
- TypeScript strict mode

### Architecture Patterns

```
nodes/
└── DocxRevisions/
    ├── DocxRevisions.node.ts      # メインノード定義
    ├── DocxRevisions.node.json    # ノードメタデータ
    ├── operations/                # 各オペレーションの実装
    │   ├── extractRevisions.ts
    │   ├── extractComments.ts
    │   ├── acceptAllRevisions.ts
    │   ├── rejectAllRevisions.ts
    │   └── getStats.ts
    └── utils/                     # 共通ユーティリティ
        ├── docxParser.ts          # ZIP解凍・XML取得
        ├── revisionParser.ts      # 履歴パース
        ├── commentParser.ts       # コメントパース
        └── docxWriter.ts          # docx再構築
```

### Testing Strategy

- 実際のdocxファイルを使用したE2Eテスト
- 各オペレーションのユニットテスト

### Git Workflow

- Conventional Commits

## Domain Context

### docx構造

```
docx (ZIP)
├── [Content_Types].xml
├── word/
│   ├── document.xml        # 本文（履歴マークアップ含む）
│   ├── comments.xml        # コメント
│   ├── commentsExtended.xml # 返信・解決状態（Office 2013+）
│   └── settings.xml        # trackRevisionsフラグ
└── docProps/
```

### OpenXML履歴関連要素

| 要素 | 説明 |
|------|------|
| `<w:ins>` | 挿入 |
| `<w:del>` | 削除 |
| `<w:rPrChange>` | 文字書式変更 |
| `<w:pPrChange>` | 段落書式変更 |

### OpenXML名前空間

```javascript
const NAMESPACES = {
  w: 'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
  w14: 'http://schemas.microsoft.com/office/word/2010/wordml',
  w15: 'http://schemas.microsoft.com/office/word/2012/wordml'
};
```

## Important Constraints

- docx以外のファイル形式は非対応
- 履歴なし・コメントなしの場合は空配列を返す（エラーにしない）
- Office 2013+のcommentsExtended.xml対応が必要

### n8n 2.0 破壊的変更（2025-12-05）

本プロジェクトはn8n 2.x系を対象とする。1.x系との互換性は保証しない。

主な変更点：
- Startノード廃止 → Manual Trigger等に置き換え
- Code nodeからの環境変数アクセスがデフォルトでブロック
- Task runnersがデフォルトで有効
- MySQL/MariaDBサポート廃止（PostgreSQL推奨）

参考: [n8n v2.0 breaking changes](https://docs.n8n.io/2-0-breaking-changes/)

## External Dependencies

- [ECMA-376 (Office Open XML)](https://www.ecma-international.org/publications-and-standards/standards/ecma-376/)
- [n8n Creating Nodes](https://docs.n8n.io/integrations/creating-nodes/)
- [fast-xml-parser](https://github.com/NaturalIntelligence/fast-xml-parser)
- [jszip](https://stuk.github.io/jszip/)

## Development Phases

### Phase 1（MVP）
- Extract Revisions（基本：insert/delete）
- Extract Comments（基本）
- npm公開 

### Phase 2
- Accept All Revisions
- Reject All Revisions
- Get Stats

### Phase 3（拡張）
- 書式変更の詳細対応
- 特定作者の履歴のみ承認/却下
- コメント範囲のテキスト抽出精度向上
