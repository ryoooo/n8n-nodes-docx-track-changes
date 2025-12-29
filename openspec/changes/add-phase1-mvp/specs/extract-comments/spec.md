# Extract Comments

## ADDED Requirements

### Requirement: docxファイルからコメントを抽出

システムはdocxファイルからコメントを抽出し、JSON形式で出力しなければならない（SHALL）。

#### Scenario: コメントの抽出
- **WHEN** docxファイルにcomments.xmlが含まれる
- **THEN** コメントが抽出される
- **AND** 各コメントにid、author、date、textが含まれる

#### Scenario: コメント対象テキストの抽出
- **WHEN** document.xmlにcommentRangeStart/Endが存在する
- **THEN** コメントが付けられたテキスト（targetText）が抽出される

#### Scenario: コメントが存在しない場合
- **WHEN** docxファイルにコメントが存在しない
- **THEN** 空の配列を返す（エラーにしない）

### Requirement: 返信コメントの抽出

システムはコメントへの返信を抽出しなければならない（SHALL）。

#### Scenario: 返信を含める（デフォルト）
- **WHEN** Include Repliesオプションがtrue（デフォルト）
- **AND** commentsExtended.xmlに返信情報が存在する
- **THEN** 各コメントのreplies配列に返信が含まれる

#### Scenario: 返信を含めない
- **WHEN** Include Repliesオプションがfalse
- **THEN** replies配列は空となる

### Requirement: 解決状態の取得

システムはコメントの解決状態を取得しなければならない（SHALL）。

#### Scenario: 解決済みコメントを含める（デフォルト）
- **WHEN** Include Resolvedオプションがtrue（デフォルト）
- **THEN** 解決済みコメントも結果に含まれる
- **AND** resolvedフィールドがtrueとなる

#### Scenario: 解決済みコメントを除外
- **WHEN** Include Resolvedオプションがfalse
- **THEN** 解決済みコメントは結果から除外される

### Requirement: サマリー情報の生成

システムは抽出したコメントのサマリー情報を生成しなければならない（SHALL）。

#### Scenario: サマリーの内容
- **WHEN** コメントの抽出が完了した
- **THEN** サマリーに以下が含まれる：
  - totalComments: コメント総数
  - totalReplies: 返信総数
  - resolved: 解決済み数
  - unresolved: 未解決数
  - authors: 作者一覧

### Requirement: 入力パラメータ

システムは以下の入力パラメータを受け付けなければならない（SHALL）。

#### Scenario: Binary Propertyの指定
- **WHEN** Binary Propertyに"data"が指定されている
- **THEN** 該当のbinaryプロパティからdocxファイルを読み込む

#### Scenario: 不正なファイル形式
- **WHEN** docx以外のファイルが入力された
- **THEN** InvalidFileFormatエラーを返す
