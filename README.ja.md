# n8n-nodes-docx-track-changes

![n8n.io - Workflow Automation](https://img.shields.io/badge/n8n-community%20node-ff6d5a)
![npm](https://img.shields.io/npm/v/n8n-nodes-docx-track-changes)
![License](https://img.shields.io/npm/l/n8n-nodes-docx-track-changes)

Microsoft Word (.docx) ドキュメントから**変更履歴（リビジョン）**と**コメント**を抽出するn8nコミュニティノードです。

ドキュメントレビューワークフロー、契約管理、承認プロセスの自動化に最適です。

[n8n](https://n8n.io/) は [fair-code ライセンス](https://docs.n8n.io/reference/license/) のワークフロー自動化プラットフォームです。

## 機能

- **変更履歴の抽出** - 追加・削除の変更を作成者とタイムスタンプ付きで取得
- **コメントの抽出** - 返信、解決状態、対象テキスト付きでコメントを取得
- **コンテキスト対応** - 各変更の前後テキストを含める
- **サマリー統計** - タイプ別、作成者別、状態別のカウントを取得
- **AIエージェント対応** - AIワークフローでツールとして使用可能（`usableAsTool: true`）

## 互換性

| 要件 | バージョン |
|------|-----------|
| n8n | 1.0.0+ (2.2.0でテスト済み) |
| Node.js | 18.17.0+ |

> **注意:** このノードは外部依存関係（`jszip`、`fast-xml-parser`）を使用しており、**セルフホスト版n8n**向けに設計されています。n8n Cloudでは[認証済みコミュニティノード](https://docs.n8n.io/integrations/community-nodes/installation/verified-install/)のみサポートされます。

## インストール

### オプション1: GUIインストール（推奨）

セルフホスト版n8nへの最も簡単なインストール方法：

1. **Settings** > **Community Nodes** に移動
2. **Install** を選択
3. `n8n-nodes-docx-track-changes` を入力
4. 「I understand the risks of installing unverified code from a public source」にチェック
5. **Install** を選択

> **Owner** と **Admin** ユーザーのみがコミュニティノードをインストールできます。

### オプション2: 手動インストール（npm）

キューモードで動作しているn8nインスタンスやプライベートパッケージのインストール時：

```bash
# n8nコンテナにアクセス
docker exec -it n8n sh

# nodesディレクトリを作成してインストール
mkdir -p ~/.n8n/nodes
cd ~/.n8n/nodes
npm install n8n-nodes-docx-track-changes

# n8nを再起動してノードを読み込み
```

### オプション3: Docker（Dockerfile）

Docker環境での永続的なインストールには、カスタムDockerfileを作成：

```dockerfile
FROM n8nio/n8n:latest

USER root
RUN cd /usr/local/lib/node_modules/n8n && \
    npm install n8n-nodes-docx-track-changes
USER node
```

`docker-compose.yml` を更新：

```yaml
services:
  n8n:
    build:
      context: .
      dockerfile: Dockerfile
    # ... 残りの設定
```

リビルドして再起動：

```bash
docker compose down
docker compose up -d --build
```

### AIエージェントツールとしての使用を有効化

このノードをAIエージェントツールとして使用するには、環境変数を設定：

```bash
N8N_COMMUNITY_PACKAGES_ALLOW_TOOL_USAGE=true
```

## オペレーション

### 変更履歴の抽出（Extract Revisions）

DOCXファイルから変更履歴（追加・削除）を抽出します。

| パラメータ | 型 | デフォルト | 説明 |
|-----------|-----|-----------|------|
| Input Binary Field | string | `data` | DOCXファイルを含むバイナリプロパティ |
| Include Context | boolean | `false` | 各変更の前後テキストを含める |
| Context Length | number | `50` | 前後に含める文字数 |
| Include Summary | boolean | `true` | 変更統計を含める |

**出力例:**

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

### コメントの抽出（Extract Comments）

DOCXファイルからコメントと返信を抽出します。

| パラメータ | 型 | デフォルト | 説明 |
|-----------|-----|-----------|------|
| Input Binary Field | string | `data` | DOCXファイルを含むバイナリプロパティ |
| Include Resolved | boolean | `true` | 解決済みコメントを含める |
| Include Summary | boolean | `true` | コメント統計を含める |

**出力例:**

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

## 使用例

### 基本ワークフロー

```
[Read Binary File] → [DOCX Revisions] → [IF] → [Slack/Email]
```

1. **Read Binary File** - DOCXファイルを読み込み
2. **DOCX Revisions** - 変更履歴またはコメントを抽出
3. **IF** - 未解決項目があるか確認
4. **Slack/Email** - レビュアーに通知

### 契約レビュー自動化

```
[Webhook] → [DOCX Revisions (Extract Revisions)] → [Code] → [Google Sheets]
```

監査目的でスプレッドシートに全ての契約変更を記録。

### コメント集約

```
[Google Drive Trigger] → [DOCX Revisions (Extract Comments)] → [Filter] → [Notion]
```

共有ドキュメントから未解決コメントを自動収集。

## 開発

```bash
# 依存関係のインストール
pnpm install

# 開発サーバーの起動
pnpm dev

# テストの実行
pnpm test

# 本番用ビルド
pnpm build

# コードのLint
pnpm lint
```

## リソース

- [n8n コミュニティノード ドキュメント](https://docs.n8n.io/integrations/community-nodes/)
- [n8n ノードの作成](https://docs.n8n.io/integrations/creating-nodes/)
- [OpenXML 変更履歴仕様](https://learn.microsoft.com/en-us/dotnet/api/documentformat.openxml.wordprocessing.insertedrun)

## ライセンス

[MIT](LICENSE)

## 作者

**ryoooo**

---

n8nコミュニティのために作成
