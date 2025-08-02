#!/usr/bin/env python3
"""
AIサービスのテスト用スクリプト
ローカル環境でのAI機能テスト用
"""

import os
import sys
import json
import time
import requests
from datetime import datetime

# テスト設定
TEST_SERVER_URL = "http://localhost:8081"
TEST_FILES_DIR = "test_files"

# テスト用サンプル契約書
SAMPLE_CONTRACT = """
業務委託契約書

契約日：2024年1月15日

甲：株式会社テックソリューション
代表取締役　田中太郎
東京都渋谷区渋谷1-1-1

乙：フリーランス開発者　山田花子
東京都新宿区新宿2-2-2

第1条（目的）
本契約は、甲が乙に対して、Webアプリケーション開発業務を委託することを目的とする。

第2条（業務内容）
乙は甲に対し、以下の業務を提供する：
1. React.jsを使用したフロントエンド開発
2. Node.jsを使用したバックエンドAPI開発
3. データベース設計・実装
4. テスト・デバッグ作業
5. ドキュメント作成

第3条（報酬）
甲は乙に対し、以下の報酬を支払う：
- 基本報酬：月額800,000円（税別）
- 成果報酬：プロジェクト完了時に200,000円（税別）

第4条（契約期間）
本契約の有効期間は、2024年1月15日から2024年6月30日までとする。
ただし、双方の合意により延長することができる。

第5条（責任・保証）
乙は以下の責任を負う：
1. 善管注意義務に基づく業務遂行
2. 成果物の品質保証（契約終了後6ヶ月間）
3. 機密情報の保護義務

第6条（解除条件）
以下の場合、契約を解除することができる：
1. 重大な契約違反があった場合
2. 30日前の書面による通知
3. 双方の合意による場合

第7条（秘密保持）
両当事者は、本契約に関連して知り得た秘密情報を、
契約期間中および契約終了後2年間にわたって厳重に管理する。

第8条（知的財産権）
本契約により作成された成果物の著作権は甲に帰属する。
ただし、乙が既に保有していた技術・ノウハウは除く。

第9条（準拠法・管轄）
本契約は日本法に準拠し、東京地方裁判所を専属管轄とする。

以上

甲：株式会社テックソリューション
代表取締役　田中太郎　　印

乙：山田花子　　印
"""

def create_test_files():
    """テスト用ファイルディレクトリを作成"""
    os.makedirs(TEST_FILES_DIR, exist_ok=True)
    
    # テスト用契約書ファイル作成
    with open(f"{TEST_FILES_DIR}/sample_contract.txt", "w", encoding="utf-8") as f:
        f.write(SAMPLE_CONTRACT)
    
    print(f"テストファイルを作成しました: {TEST_FILES_DIR}/")

def test_server_health():
    """サーバーヘルスチェック"""
    print("=== AIサーバーヘルスチェック ===")
    
    try:
        response = requests.get(f"{TEST_SERVER_URL}/", timeout=10)
        if response.status_code == 200:
            print("✅ AIサーバー稼働中")
            return True
        else:
            print(f"⚠️ AIサーバー応答異常: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ AIサーバーに接続できません")
        print("ヒント: python main.py でローカルサーバーを起動してください")
        return False
    except Exception as e:
        print(f"❌ ヘルスチェックエラー: {e}")
        return False

def test_summarize():
    """契約書要約APIのテスト"""
    print("\n=== 契約書要約テスト ===")
    
    test_data = {
        "contract_text": SAMPLE_CONTRACT,
        "user_id": "test_user_123"
    }
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": "Bearer test_token"
    }
    
    try:
        print("要約生成中...")
        start_time = time.time()
        
        response = requests.post(
            f"{TEST_SERVER_URL}/summarize",
            json=test_data,
            headers=headers,
            timeout=60
        )
        
        end_time = time.time()
        processing_time = end_time - start_time
        
        print(f"処理時間: {processing_time:.2f}秒")
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ 要約生成テスト成功")
            print(f"要約内容:")
            print("-" * 50)
            print(result.get('summary', 'N/A'))
            print("-" * 50)
            
            metadata = result.get('metadata', {})
            print(f"トークン使用量: {metadata.get('tokens_used', 'N/A')}")
            print(f"推定コスト: ${metadata.get('cost', 'N/A'):.4f}")
            
        else:
            print("❌ 要約生成テスト失敗")
            print(f"エラー: {response.text}")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ リクエストエラー: {e}")
    except Exception as e:
        print(f"❌ テストエラー: {e}")

def test_risk_analysis():
    """リスク分析APIのテスト"""
    print("\n=== リスク分析テスト ===")
    
    test_data = {
        "contract_text": SAMPLE_CONTRACT,
        "user_id": "test_user_123"
    }
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": "Bearer test_token"
    }
    
    try:
        print("リスク分析中...")
        start_time = time.time()
        
        response = requests.post(
            f"{TEST_SERVER_URL}/analyze-risk",
            json=test_data,
            headers=headers,
            timeout=60
        )
        
        end_time = time.time()
        processing_time = end_time - start_time
        
        print(f"処理時間: {processing_time:.2f}秒")
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ リスク分析テスト成功")
            
            risk_analysis = result.get('risk_analysis', {})
            print(f"総合リスクレベル: {risk_analysis.get('overall_risk_level', 'N/A')}")
            print(f"リスクスコア: {risk_analysis.get('risk_score', 'N/A')}")
            
            risk_factors = risk_analysis.get('risk_factors', [])
            if risk_factors:
                print("リスク要因:")
                for factor in risk_factors:
                    print(f"  - {factor.get('category', 'N/A')} ({factor.get('severity', 'N/A')})")
                    print(f"    説明: {factor.get('description', 'N/A')}")
                    print(f"    提案: {factor.get('recommendation', 'N/A')}")
            
            metadata = result.get('metadata', {})
            print(f"トークン使用量: {metadata.get('tokens_used', 'N/A')}")
            print(f"推定コスト: ${metadata.get('cost', 'N/A'):.4f}")
            
        else:
            print("❌ リスク分析テスト失敗")
            print(f"エラー: {response.text}")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ リクエストエラー: {e}")
    except Exception as e:
        print(f"❌ テストエラー: {e}")

def test_chat():
    """チャット機能APIのテスト"""
    print("\n=== チャット機能テスト ===")
    
    test_questions = [
        "この契約の報酬はいくらですか？",
        "契約期間はいつまでですか？",
        "解除条件について教えてください",
        "秘密保持の義務期間は？"
    ]
    
    chat_history = []
    
    for question in test_questions:
        print(f"\n質問: {question}")
        
        test_data = {
            "contract_text": SAMPLE_CONTRACT,
            "question": question,
            "chat_history": chat_history,
            "user_id": "test_user_123"
        }
        
        headers = {
            "Content-Type": "application/json",
            "Authorization": "Bearer test_token"
        }
        
        try:
            start_time = time.time()
            
            response = requests.post(
                f"{TEST_SERVER_URL}/chat",
                json=test_data,
                headers=headers,
                timeout=60
            )
            
            end_time = time.time()
            processing_time = end_time - start_time
            
            print(f"処理時間: {processing_time:.2f}秒")
            
            if response.status_code == 200:
                result = response.json()
                answer = result.get('answer', 'N/A')
                print(f"回答: {answer}")
                
                # チャット履歴更新
                chat_history = result.get('updated_history', chat_history)
                
                metadata = result.get('metadata', {})
                print(f"トークン使用量: {metadata.get('tokens_used', 'N/A')}")
                print(f"推定コスト: ${metadata.get('cost', 'N/A'):.4f}")
                
            else:
                print("❌ チャット応答失敗")
                print(f"エラー: {response.text}")
                
        except requests.exceptions.RequestException as e:
            print(f"❌ リクエストエラー: {e}")
        except Exception as e:
            print(f"❌ テストエラー: {e}")
        
        time.sleep(1)  # レート制限対策
    
    if chat_history:
        print("✅ チャット機能テスト成功")
    else:
        print("❌ チャット機能テスト失敗")

def test_extract_key_points():
    """重要ポイント抽出APIのテスト"""
    print("\n=== 重要ポイント抽出テスト ===")
    
    test_data = {
        "contract_text": SAMPLE_CONTRACT,
        "user_id": "test_user_123"
    }
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": "Bearer test_token"
    }
    
    try:
        print("重要ポイント抽出中...")
        start_time = time.time()
        
        response = requests.post(
            f"{TEST_SERVER_URL}/extract-key-points",
            json=test_data,
            headers=headers,
            timeout=60
        )
        
        end_time = time.time()
        processing_time = end_time - start_time
        
        print(f"処理時間: {processing_time:.2f}秒")
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ 重要ポイント抽出テスト成功")
            
            key_points_data = result.get('key_points', {})
            key_points = key_points_data.get('key_points', [])
            
            if key_points:
                print("抽出された重要ポイント:")
                for i, point in enumerate(key_points, 1):
                    print(f"{i}. {point.get('title', 'N/A')} ({point.get('importance', 'N/A')})")
                    print(f"   カテゴリ: {point.get('category', 'N/A')}")
                    print(f"   内容: {point.get('content', 'N/A')[:100]}...")
                    print()
            
            summary = key_points_data.get('summary', '')
            if summary:
                print(f"要約: {summary}")
            
            metadata = result.get('metadata', {})
            print(f"トークン使用量: {metadata.get('tokens_used', 'N/A')}")
            print(f"推定コスト: ${metadata.get('cost', 'N/A'):.4f}")
            
        else:
            print("❌ 重要ポイント抽出テスト失敗")
            print(f"エラー: {response.text}")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ リクエストエラー: {e}")
    except Exception as e:
        print(f"❌ テストエラー: {e}")

def test_local_ai_functions():
    """ローカルAI機能のテスト"""
    print("\n=== ローカルAI機能テスト ===")
    
    try:
        sys.path.append(os.path.dirname(__file__))
        from main import AIService
        
        # テスト用のモックOpenAI設定
        os.environ['OPENAI_API_KEY'] = 'test-key'
        
        ai_service = AIService()
        
        # トークンカウント機能テスト
        text = "これはテスト用のテキストです。"
        token_count = ai_service._count_tokens(text)
        print(f"✅ トークンカウント機能: {token_count} tokens")
        
        # コスト計算機能テスト
        cost = ai_service._calculate_cost(100, 50)
        print(f"✅ コスト計算機能: ${cost:.6f}")
        
        # 使用量追跡機能テスト
        ai_service._track_usage('test', 150, cost)
        print("✅ 使用量追跡機能: OK")
        
        print("✅ ローカルAI機能テスト完了")
        
    except ImportError as e:
        print(f"❌ モジュールインポートエラー: {e}")
        print("注意: OpenAI APIキーとGoogle Cloud環境での動作が必要な機能があります")
    except Exception as e:
        print(f"❌ ローカル機能テストエラー: {e}")

def run_performance_test():
    """パフォーマンステスト"""
    print("\n=== パフォーマンステスト ===")
    
    if not test_server_health():
        print("サーバーが起動していないため、パフォーマンステストをスキップします")
        return
    
    test_cases = [
        ("要約生成", "/summarize"),
        ("リスク分析", "/analyze-risk"),
        ("重要ポイント抽出", "/extract-key-points")
    ]
    
    results = []
    
    for test_name, endpoint in test_cases:
        print(f"\n{test_name}のパフォーマンステスト中...")
        
        test_data = {
            "contract_text": SAMPLE_CONTRACT,
            "user_id": "performance_test_user"
        }
        
        headers = {
            "Content-Type": "application/json",
            "Authorization": "Bearer test_token"
        }
        
        times = []
        
        for i in range(3):  # 3回実行して平均を取る
            try:
                start_time = time.time()
                
                response = requests.post(
                    f"{TEST_SERVER_URL}{endpoint}",
                    json=test_data,
                    headers=headers,
                    timeout=120
                )
                
                end_time = time.time()
                processing_time = end_time - start_time
                
                if response.status_code == 200:
                    times.append(processing_time)
                    print(f"  試行{i+1}: {processing_time:.2f}秒")
                else:
                    print(f"  試行{i+1}: エラー ({response.status_code})")
                
            except Exception as e:
                print(f"  試行{i+1}: 例外 ({e})")
            
            time.sleep(2)  # レート制限対策
        
        if times:
            avg_time = sum(times) / len(times)
            min_time = min(times)
            max_time = max(times)
            
            results.append({
                'test_name': test_name,
                'avg_time': avg_time,
                'min_time': min_time,
                'max_time': max_time
            })
            
            print(f"  平均: {avg_time:.2f}秒, 最小: {min_time:.2f}秒, 最大: {max_time:.2f}秒")
    
    print("\n=== パフォーマンステスト結果 ===")
    for result in results:
        print(f"{result['test_name']}: 平均 {result['avg_time']:.2f}秒")

def main():
    """メインテスト実行"""
    print("AIサービステスト開始")
    print("=" * 60)
    
    # テストファイル作成
    create_test_files()
    
    # サーバーヘルスチェック
    server_running = test_server_health()
    
    # ローカル機能テスト（サーバー不要）
    test_local_ai_functions()
    
    if server_running:
        # API統合テスト
        test_summarize()
        test_risk_analysis()
        test_chat()
        test_extract_key_points()
        
        # パフォーマンステスト
        run_performance_test()
    else:
        print("\n注意: サーバーが起動していないため、API統合テストをスキップしました")
        print("サーバーを起動するには: python main.py")
    
    print("\n" + "=" * 60)
    print("AIサービステスト完了")

if __name__ == "__main__":
    main()