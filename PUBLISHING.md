# GitHub で共有する手順

この手順では、プロジェクトを GitHub に登録し、同梱の GitHub Actions で GitHub Pages に公開します。アプリは静的ファイルだけで動き、オンライン対戦や端末間のデータ同期はありません。

## 先に確認すること

GitHub Pages で公開したサイトは、URL を知っている人だけに限定されず、インターネット上で誰でも見られます。リポジトリを非公開にしても、公開サイトへのアクセス制限にはなりません。身内だけに限定する必要があれば Pages は使わず、VPN またはアクセス認証を設定した CPU サーバーで配信してください。

## 1. GitHub に空のリポジトリを作る

ブラウザーで [github.com/new](https://github.com/new) を開き、リポジトリ名を決めて作成します。既存のファイルをあとから push するため、作成時に **Add a README file**、**Add .gitignore**、**Choose a license** は選ばず、空のリポジトリにしてください。リポジトリの公開・非公開を選ぶときは、上の公開範囲を確認してください。

## 2. プロジェクトを登録して push する

以下はプロジェクトのルートディレクトリで実行します。`OWNER` は GitHub のユーザー名または組織名、`REPO` は作成したリポジトリ名に置き換えてください。

```bash
cd /path/to/nh7
git --version
git init
git branch -M main
git add .gitignore .github README.md PUBLISHING.md IMPLEMENTATION.md TODO.md package.json scripts tests dist demo idea_a.md idea_b.md idea_c.md idea_d.md
git status --short
git diff --cached --stat
git commit -m "Prepare Kindred for team playtesting"
git remote add origin https://github.com/OWNER/REPO.git
git remote -v
git push -u origin main
```

`git status --short` に表示されたファイルを確認してから commit してください。上の `git add` はアプリ、説明書、活動案、デモ動画を明示して登録し、`.aws`、`.agents`、`.codex` などの環境用ディレクトリを含めない指定です。認証を求められたら GitHub のブラウザー認証または Git Credential Manager を使い、アクセストークンをコマンドやファイルに貼り付けないでください。

## 3. Pages を有効にする

GitHub リポジトリの **Settings → Pages → Build and deployment → Source** で **GitHub Actions** を選びます。`main` への push で `.github/workflows/pages.yml` が静的チェックとテストを実行し、成功すると `dist/` を公開します。進行状況は **Actions** タブで確認できます。

公開 URL は通常 `https://OWNER.github.io/REPO/` です。Actions のデプロイが完了したら、その URL をチームメイトに共有します。GitHub Pages のリポジトリ設定と公開動作は [GitHub Pages の公式ガイド](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site) と [GitHub Actions で公開する公式手順](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages) にあります。

## 変更を公開する

アプリや説明を変更したら、変更したファイルを add して commit、push します。たとえば `dist/` を変更した場合:

```bash
git add dist
git status --short
git commit -m "Update Kindred activities"
git push
```

push のたびに Pages の workflow が再実行されます。各利用者の履歴やポイントは各ブラウザー内だけに保存され、リンクを共有しても同期されません。実際の2人で遊ぶときは、同じ端末の画面を一緒に使ってください。
