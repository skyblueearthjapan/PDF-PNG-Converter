# PDF ⇔ PNG 変換ツール

ブラウザから簡単に利用できる PDF と PNG 画像の相互変換 Web アプリケーションです。

## 機能

### 📄 PDF → PNG 変換
- PDFファイルの各ページをPNG画像に変換
- 複数PDFファイルの一括処理に対応
- 100〜200ページの大容量PDFにも対応
- すべての画像をZIPファイルにまとめてダウンロード
- ドラッグ＆ドロップとファイル選択の両方に対応

### 🖼️ PNG → PDF 結合
- 複数のPNG/JPG画像を1つのPDFファイルに結合
- 100〜200枚の大量の画像にも対応
- ファイル名順で自動ソート
- ドラッグ＆ドロップとファイル選択の両方に対応

## 技術スタック

- **バックエンド**: Python 3.8+
  - FastAPI: 高速なWebフレームワーク
  - PyMuPDF (fitz): PDF処理
  - Pillow: 画像処理
  - Uvicorn: ASGIサーバー

- **フロントエンド**:
  - シンプルなHTML/CSS/JavaScript
  - モダンでレスポンシブなデザイン

## セットアップ

### 必要要件
- Python 3.8 以上
- pip（Pythonパッケージマネージャー）

### インストール手順

1. **リポジトリのクローン**
```bash
git clone https://github.com/skyblueearthjapan/PDF-PNG-Converter.git
cd PDF-PNG-Converter
```

2. **仮想環境の作成（推奨）**
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS / Linux
python3 -m venv venv
source venv/bin/activate
```

3. **依存関係のインストール**
```bash
pip install -r requirements.txt
```

## 起動方法

### 開発サーバーの起動
```bash
uvicorn main:app --reload
```

または

```bash
python main.py
```

### アクセス
ブラウザで以下のURLにアクセスしてください：
```
http://localhost:8000
```

## クラウドデプロイ（Render）

このアプリケーションをインターネット上に公開するには、Renderを使用すると簡単です。

### Renderへのデプロイ手順

#### 方法1：Blueprint（ワンクリックデプロイ）

1. **Renderアカウント作成**
   - https://render.com にアクセス
   - GitHubアカウントでサインアップ（無料）

2. **Blueprintからデプロイ**
   - Renderダッシュボードで「New」→「Blueprint」を選択
   - GitHubリポジトリを接続
   - `render.yaml`が自動検出されます
   - 「Apply」をクリック

3. **デプロイ完了**
   - 自動的にビルド・デプロイが開始
   - 5-10分でデプロイ完了
   - 生成されたURLでアクセス可能

#### 方法2：手動デプロイ

1. Renderダッシュボードで「New」→「Web Service」
2. GitHubリポジトリを選択
3. 以下の設定を入力：
   - **Name**: pdf-png-converter
   - **Environment**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. 「Create Web Service」をクリック

### 料金
- **完全無料**: クレジットカード不要
- ⚠️ 15分間アクセスがないと自動スリープ
- 起動に30秒-1分程度かかる
- 個人利用・テストには十分

### デプロイ設定ファイル
- `render.yaml`: Render Blueprint設定（自動デプロイ用）

## 使用方法

### PDF → PNG 変換
1. 「PDF → PNG 変換」セクションのアップロードエリアをクリック、またはPDFファイルをドラッグ&ドロップ
2. 複数のPDFファイルを選択可能
3. 「PNG画像に変換（ZIPダウンロード）」ボタンをクリック
4. 変換が完了すると、ZIPファイルが自動的にダウンロードされます
5. ZIPファイルには `元ファイル名_001.png`, `元ファイル名_002.png` といった形式で画像が保存されています

### PNG → PDF 結合
1. 「PNG → PDF 変換」セクションのアップロードエリアをクリック、またはPNG/JPG画像をドラッグ&ドロップ
2. 複数の画像ファイルを選択可能
3. ファイル名順に自動的にソートされます
4. 「PDFファイルに結合」ボタンをクリック
5. 結合が完了すると、PDFファイルが自動的にダウンロードされます

## プロジェクト構造

```
PDF-PNG-Converter/
├── main.py                 # FastAPIアプリケーション（メイン）
├── requirements.txt        # Python依存関係
├── README.md              # このファイル
├── render.yaml            # Render Blueprint設定
├── templates/
│   └── index.html         # メインページのHTML
├── static/
│   ├── style.css          # スタイルシート
│   └── app.js             # フロントエンドJavaScript
└── uploads/               # 一時アップロードディレクトリ（自動生成）
```

## 注意事項

- 大容量ファイルの処理には時間がかかる場合があります
- サーバーのメモリ容量に応じて、処理できるファイルサイズに制限があります
- 一時ファイルは処理後に自動的に削除されます
- 本番環境で使用する場合は、適切なセキュリティ設定を行ってください

## トラブルシューティング

### ポート8000が既に使用されている場合
```bash
uvicorn main:app --reload --port 8001
```

### 依存関係のインストールに失敗する場合
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### PyMuPDFのインストールに失敗する場合
システムに必要な依存関係がない可能性があります：

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install python3-dev
```

**macOS:**
```bash
brew install python3
```

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。

## 貢献

プルリクエストを歓迎します。大きな変更の場合は、まずissueを開いて変更内容を議論してください。

## サポート

問題が発生した場合は、GitHubのIssueページで報告してください。
