# Tasks: Phase 1 MVP

## 1. プロジェクトセットアップ

- [x] 1.1 n8nノードプロジェクトを初期化（Node.js 22, pnpm, n8n 2.2.0対応）
- [x] 1.2 依存パッケージをインストール（jszip, fast-xml-parser）
- [x] 1.3 ノードメタデータを作成（DocxRevisions.node.json）

## 2. 共通ユーティリティ

- [ ] 2.1 docxParser.ts: ZIP解凍・XMLファイル取得
- [ ] 2.2 revisionParser.ts: `<w:ins>`, `<w:del>`要素のパース
- [ ] 2.3 commentParser.ts: comments.xml, commentsExtended.xmlのパース

## 3. Extract Revisions実装

- [ ] 3.1 extractRevisions.ts: オペレーション実装
- [ ] 3.2 挿入（insert）履歴の抽出
- [ ] 3.3 削除（delete）履歴の抽出
- [ ] 3.4 コンテキスト（前後テキスト）オプション対応
- [ ] 3.5 サマリー（統計情報）の生成

## 4. Extract Comments実装

- [ ] 4.1 extractComments.ts: オペレーション実装
- [ ] 4.2 コメント本体の抽出
- [ ] 4.3 返信コメントの抽出（commentsExtended.xml）
- [ ] 4.4 解決状態の取得
- [ ] 4.5 サマリーの生成

## 5. メインノード統合

- [ ] 5.1 DocxRevisions.node.ts: ノード定義とUI
- [ ] 5.2 オペレーション切り替えロジック
- [ ] 5.3 バイナリデータハンドリング

## 6. テスト・検証

- [ ] 6.1 テスト用docxファイルの作成（履歴・コメント付き）
- [ ] 6.2 Extract Revisionsのユニットテスト
- [ ] 6.3 Extract Commentsのユニットテスト
- [ ] 6.4 n8n上での動作確認

## 7. npm公開準備

- [ ] 7.1 README.md作成
- [ ] 7.2 LICENSE追加
- [ ] 7.3 npm publish
