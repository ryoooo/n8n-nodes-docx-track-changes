# Extract Revisions

## ADDED Requirements

### Requirement: docxファイルから編集履歴を抽出

システムはdocxファイルから編集履歴（Track Changes）を抽出し、JSON形式で出力しなければならない（SHALL）。

#### Scenario: 挿入履歴の抽出
- **WHEN** docxファイルに`<w:ins>`要素が含まれる
- **THEN** type: "insert"として抽出される
- **AND** テキスト、作者、日時、段落インデックスが含まれる

#### Scenario: 削除履歴の抽出
- **WHEN** docxファイルに`<w:del>`要素が含まれる
- **THEN** type: "delete"として抽出される
- **AND** 削除されたテキスト、作者、日時、段落インデックスが含まれる

#### Scenario: 履歴が存在しない場合
- **WHEN** docxファイルに編集履歴が存在しない
- **THEN** 空の配列を返す（エラーにしない）

### Requirement: コンテキスト（前後テキスト）オプション

システムは変更箇所の前後テキストを含めるオプションを提供しなければならない（SHALL）。

#### Scenario: コンテキストを含める
- **WHEN** Include Contextオプションがtrue
- **AND** Context Lengthが50に設定されている
- **THEN** 各履歴にcontext.beforeとcontext.afterが含まれる
- **AND** 前後それぞれ最大50文字が含まれる

#### Scenario: コンテキストを含めない
- **WHEN** Include Contextオプションがfalse（デフォルト）
- **THEN** contextフィールドはnullとなる

### Requirement: サマリー情報の生成

システムは抽出した履歴のサマリー情報を生成しなければならない（SHALL）。

#### Scenario: サマリーの内容
- **WHEN** 履歴の抽出が完了した
- **THEN** サマリーに以下が含まれる：
  - totalRevisions: 総数
  - insertions: 挿入数
  - deletions: 削除数
  - authors: 作者一覧

### Requirement: 入力パラメータ

システムは以下の入力パラメータを受け付けなければならない（SHALL）。

#### Scenario: Binary Propertyの指定
- **WHEN** Binary Propertyに"data"が指定されている
- **THEN** 該当のbinaryプロパティからdocxファイルを読み込む

#### Scenario: 不正なファイル形式
- **WHEN** docx以外のファイルが入力された
- **THEN** InvalidFileFormatエラーを返す
