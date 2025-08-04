#!/bin/bash

# マージ後のブランチクリーンアップスクリプト
# 使用方法: ./scripts/cleanup-branch.sh [branch-name]
# 引数なしの場合は現在のブランチを削除

set -e

# 現在のブランチを取得
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)

# 削除するブランチを決定
if [ $# -eq 0 ]; then
    BRANCH_TO_DELETE=$CURRENT_BRANCH
else
    BRANCH_TO_DELETE=$1
fi

# mainブランチの削除を防ぐ
if [ "$BRANCH_TO_DELETE" = "main" ]; then
    echo "❌ エラー: mainブランチは削除できません"
    exit 1
fi

echo "削除対象ブランチ: $BRANCH_TO_DELETE"

# 現在のブランチが削除対象の場合、mainに切り替え
if [ "$CURRENT_BRANCH" = "$BRANCH_TO_DELETE" ]; then
    echo "mainブランチに切り替え中..."
    git checkout main
fi

# 最新の状態を取得
echo "最新の状態を取得中..."
git pull origin main

# ローカルブランチの存在確認と削除
if git branch | grep -q "$BRANCH_TO_DELETE"; then
    echo "ローカルブランチ '$BRANCH_TO_DELETE' を削除中..."
    git branch -d "$BRANCH_TO_DELETE" 2>/dev/null || {
        echo "⚠️  ブランチがまだマージされていない可能性があります"
        read -p "強制削除しますか？ (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            git branch -D "$BRANCH_TO_DELETE"
        else
            echo "ブランチ削除をキャンセルしました"
            exit 1
        fi
    }
else
    echo "ローカルブランチ '$BRANCH_TO_DELETE' は見つかりません"
fi

# リモートブランチの存在確認と削除
if git branch -r | grep -q "origin/$BRANCH_TO_DELETE"; then
    echo "リモートブランチ 'origin/$BRANCH_TO_DELETE' を削除中..."
    git push origin --delete "$BRANCH_TO_DELETE" 2>/dev/null || {
        echo "⚠️  リモートブランチの削除に失敗しました（既に削除済みの可能性があります）"
    }
else
    echo "リモートブランチ 'origin/$BRANCH_TO_DELETE' は見つかりません"
fi

# リモート追跡ブランチの整理
echo "リモート追跡ブランチを整理中..."
git remote prune origin

echo "✅ ブランチ '$BRANCH_TO_DELETE' のクリーンアップが完了しました"
echo "📋 現在のブランチ一覧:"
git branch -a