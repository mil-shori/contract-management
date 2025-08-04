#!/bin/bash

# 新しいブランチを作成するスクリプト
# 使用方法: ./scripts/new-branch.sh <branch-type> <branch-name>
# 例: ./scripts/new-branch.sh feature user-authentication

set -e

# 引数チェック
if [ $# -ne 2 ]; then
    echo "使用方法: $0 <branch-type> <branch-name>"
    echo "branch-type: feature, fix, refactor"
    echo "例: $0 feature user-authentication"
    exit 1
fi

BRANCH_TYPE=$1
BRANCH_NAME=$2
FULL_BRANCH_NAME="${BRANCH_TYPE}/${BRANCH_NAME}"

# ブランチタイプの検証
if [[ ! "$BRANCH_TYPE" =~ ^(feature|fix|refactor)$ ]]; then
    echo "エラー: ブランチタイプは feature, fix, refactor のいずれかである必要があります"
    exit 1
fi

# 現在のブランチを確認
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "現在のブランチ: $CURRENT_BRANCH"

# mainブランチに切り替え
echo "mainブランチに切り替え中..."
git checkout main

# 最新の状態を取得
echo "最新の状態を取得中..."
git pull origin main

# 新しいブランチを作成
echo "新しいブランチ '$FULL_BRANCH_NAME' を作成中..."
git checkout -b "$FULL_BRANCH_NAME"

echo "✅ ブランチ '$FULL_BRANCH_NAME' が作成されました"
echo "📝 開発を開始してください！"