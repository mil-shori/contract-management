#!/usr/bin/env python3
"""
OCRサービスのテスト用スクリプト
ローカル環境でのOCR機能テスト用
"""

import os
import sys
import json
import tempfile
import requests
from pathlib import Path

# ローカル環境でのテスト用設定
TEST_SERVER_URL = "http://localhost:8080"
TEST_FILES_DIR = "test_files"

def create_test_files():
    """テスト用ファイルディレクトリを作成"""
    os.makedirs(TEST_FILES_DIR, exist_ok=True)
    
    # テスト用PDFの作成（サンプル契約書）
    sample_contract_text = """
契約書

甲：株式会社サンプル
乙：テスト株式会社

本契約は、2024年1月15日に締結された業務委託契約です。

第1条（目的）
本契約は、甲が乙に対して、システム開発業務を委託することを目的とする。

第2条（業務内容）
乙は甲に対し、以下の業務を提供する：
- Webアプリケーション開発
- システム設計・構築
- 保守・運用サポート

第3条（報酬）
甲は乙に対し、月額500,000円（税別）の報酬を支払う。

第4条（契約期間）
本契約の有効期間は、2024年1月15日から2024年12月31日までとする。

第5条（責任・保証）
乙は業務遂行において善管注意義務を負う。

第6条（秘密保持）
両当事者は、本契約に関連して知り得た秘密情報を厳重に管理する。

以上

署名日：2024年1月15日
甲：株式会社サンプル　代表取締役　田中太郎
乙：テスト株式会社　代表取締役　山田花子
    """
    
    # テスト用テキストファイル作成
    with open(f"{TEST_FILES_DIR}/sample_contract.txt", "w", encoding="utf-8") as f:
        f.write(sample_contract_text)
    
    print(f"テストファイルを作成しました: {TEST_FILES_DIR}/")

def test_extract_text():
    """OCRテキスト抽出APIのテスト"""
    print("=== OCRテキスト抽出テスト ===")
    
    # テスト用データ
    test_data = {
        "file_url": "gs://test-bucket/sample.pdf",
        "file_type": "pdf",
        "user_id": "test_user_123"
    }
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": "Bearer test_token"
    }
    
    try:
        response = requests.post(
            f"{TEST_SERVER_URL}/extract-text",
            json=test_data,
            headers=headers,
            timeout=30
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
        
        if response.status_code == 200:
            print("✅ OCRテスト成功")
        else:
            print("❌ OCRテスト失敗")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ リクエストエラー: {e}")
    except Exception as e:
        print(f"❌ テストエラー: {e}")

def test_contract_parsing():
    """契約書解析機能のテスト"""
    print("\n=== 契約書解析テスト ===")
    
    # サンプルテキストファイルを読み込み
    sample_file = f"{TEST_FILES_DIR}/sample_contract.txt"
    if not os.path.exists(sample_file):
        print("❌ サンプルファイルが見つかりません")
        return
    
    with open(sample_file, "r", encoding="utf-8") as f:
        contract_text = f.read()
    
    # main.pyからOCRServiceをインポートしてテスト
    try:
        sys.path.append(os.path.dirname(__file__))
        from main import OCRService
        
        ocr_service = OCRService()
        result = ocr_service.extract_contract_information(contract_text)
        
        print("契約書解析結果:")
        print(json.dumps(result, indent=2, ensure_ascii=False))
        
        # 結果検証
        if result.get('parties'):
            print("✅ 当事者抽出: 成功")
        else:
            print("❌ 当事者抽出: 失敗")
        
        if result.get('dates'):
            print("✅ 日付抽出: 成功")
        else:
            print("❌ 日付抽出: 失敗")
        
        if result.get('amounts'):
            print("✅ 金額抽出: 成功")
        else:
            print("❌ 金額抽出: 失敗")
            
    except ImportError as e:
        print(f"❌ モジュールインポートエラー: {e}")
        print("注意: Google Cloud環境での動作が必要な機能があります")
    except Exception as e:
        print(f"❌ 解析エラー: {e}")

def test_server_health():
    """サーバーヘルスチェック"""
    print("\n=== サーバーヘルスチェック ===")
    
    try:
        response = requests.get(f"{TEST_SERVER_URL}/", timeout=10)
        if response.status_code == 200:
            print("✅ サーバー稼働中")
        else:
            print(f"⚠️ サーバー応答異常: {response.status_code}")
    except requests.exceptions.ConnectionError:
        print("❌ サーバーに接続できません")
        print("ヒント: python main.py でローカルサーバーを起動してください")
    except Exception as e:
        print(f"❌ ヘルスチェックエラー: {e}")

def main():
    """メインテスト実行"""
    print("OCRサービステスト開始")
    print("=" * 50)
    
    # テストファイル作成
    create_test_files()
    
    # サーバーヘルスチェック
    test_server_health()
    
    # 契約書解析テスト（ローカル実行可能）
    test_contract_parsing()
    
    # OCR APIテスト（サーバーが起動している場合）
    test_extract_text()
    
    print("\n" + "=" * 50)
    print("テスト完了")

if __name__ == "__main__":
    main()