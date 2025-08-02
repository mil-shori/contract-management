import os
import json
import re
import time
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import hashlib

# OpenAI & LangChain
import openai
from langchain.chat_models import ChatOpenAI
from langchain.schema import HumanMessage, SystemMessage, AIMessage
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.embeddings.openai import OpenAIEmbeddings
from langchain.vectorstores import FAISS
from langchain.chains import ConversationalRetrievalChain
from langchain.memory import ConversationBufferWindowMemory
import tiktoken

# Google Cloud & Firebase
from google.cloud import firestore
from google.cloud import storage
import firebase_admin
from firebase_admin import credentials

# Text Processing
import pandas as pd
import numpy as np
from janome.tokenizer import Tokenizer
import spacy

# Web Framework
import functions_framework
from flask import Request, jsonify

# Firebase Admin初期化
if not firebase_admin._apps:
    firebase_admin.initialize_app()

# クライアント初期化
firestore_client = firestore.Client()
storage_client = storage.Client()
tokenizer = Tokenizer()

# OpenAI設定
openai.api_key = os.getenv('OPENAI_API_KEY')

class AIService:
    def __init__(self):
        self.firestore_client = firestore_client
        self.storage_client = storage_client
        self.openai_client = ChatOpenAI(
            model_name="gpt-4-1106-preview",
            temperature=0.3,
            max_tokens=2000,
            openai_api_key=os.getenv('OPENAI_API_KEY')
        )
        self.embeddings = OpenAIEmbeddings(openai_api_key=os.getenv('OPENAI_API_KEY'))
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            separators=["\n\n", "\n", "。", "．", " ", ""]
        )
        
        # プロンプトテンプレート
        self.prompts = self._load_prompts()
        
        # 使用量追跡
        self.usage_tracker = {}
    
    def _load_prompts(self) -> Dict[str, str]:
        """プロンプトテンプレートを読み込み"""
        return {
            'summarize': """
あなたは法務専門家として、以下の契約書を詳細に分析し、日本語で包括的な要約を作成してください。

【分析対象契約書】
{contract_text}

【要約に含めるべき項目】
1. 契約の種類と目的
2. 契約当事者（甲・乙）の詳細
3. 契約期間と重要な日付
4. 金額・料金体系
5. 主要な権利・義務
6. 重要な条項（責任・保証・解除等）
7. 特記事項・注意点

【出力形式】
- 簡潔でわかりやすい日本語
- 重要度に応じた情報の階層化
- 法的リスクや注意点の明示

要約を作成してください：
""",
            'risk_analysis': """
あなたは法務リスク分析の専門家として、以下の契約書のリスクレベルを総合的に分析してください。

【分析対象契約書】
{contract_text}

【分析観点】
1. 法的リスク（責任・保証・賠償等）
2. 財務リスク（支払条件・金額等）
3. 運用リスク（履行・管理・変更等）
4. 外部リスク（法改正・市場変動等）

【リスクレベル判定】
- 低リスク：標準的な条項で特に問題なし
- 中リスク：注意が必要な条項あり
- 高リスク：重大な問題・不利な条項あり

【出力形式】
```json
{{
  "overall_risk_level": "低/中/高",
  "risk_score": 1-100の数値,
  "risk_factors": [
    {{
      "category": "リスクカテゴリ",
      "severity": "低/中/高",
      "description": "リスクの詳細説明",
      "recommendation": "対処・改善提案"
    }}
  ],
  "summary": "総合的なリスク評価コメント"
}}
```

分析結果をJSON形式で出力してください：
""",
            'chat': """
あなたは契約書の内容に精通した法務アシスタントです。以下の契約書の内容について、ユーザーの質問に正確かつわかりやすく回答してください。

【契約書内容】
{contract_text}

【会話履歴】
{chat_history}

【回答ガイドライン】
- 契約書の内容に基づいて正確に回答
- 法的な解釈や影響について説明
- 不明な点は「契約書に記載がありません」と明記
- 専門用語は分かりやすく説明
- 必要に応じて該当箇所を引用

ユーザーの質問：{question}

回答：
""",
            'extract_key_points': """
あなたは契約分析の専門家として、以下の契約書から重要なポイントを抽出してください。

【分析対象契約書】
{contract_text}

【抽出すべき重要ポイント】
1. 契約の核心となる条項
2. 当事者の主要な権利・義務
3. 金額・期間・条件等の具体的数値
4. リスクとなりうる条項
5. 特殊・特記事項

【出力形式】
```json
{{
  "key_points": [
    {{
      "category": "カテゴリ（権利義務/金額/期間/リスク/特記等）",
      "title": "ポイントのタイトル",
      "content": "具体的な内容",
      "importance": "高/中/低",
      "page_reference": "該当ページ・条項番号（分かる場合）"
    }}
  ],
  "summary": "全体的な重要ポイントの要約"
}}
```

重要ポイントをJSON形式で抽出してください：
"""
        }
    
    def _track_usage(self, operation: str, tokens_used: int, cost: float):
        """使用量を追跡"""
        today = datetime.now().strftime('%Y-%m-%d')
        
        if today not in self.usage_tracker:
            self.usage_tracker[today] = {
                'operations': 0,
                'total_tokens': 0,
                'total_cost': 0.0,
                'operations_detail': {}
            }
        
        self.usage_tracker[today]['operations'] += 1
        self.usage_tracker[today]['total_tokens'] += tokens_used
        self.usage_tracker[today]['total_cost'] += cost
        
        if operation not in self.usage_tracker[today]['operations_detail']:
            self.usage_tracker[today]['operations_detail'][operation] = {
                'count': 0,
                'tokens': 0,
                'cost': 0.0
            }
        
        self.usage_tracker[today]['operations_detail'][operation]['count'] += 1
        self.usage_tracker[today]['operations_detail'][operation]['tokens'] += tokens_used
        self.usage_tracker[today]['operations_detail'][operation]['cost'] += cost
        
        # Firestoreに使用量を保存
        try:
            doc_ref = self.firestore_client.collection('ai_usage').document(today)
            doc_ref.set(self.usage_tracker[today], merge=True)
        except Exception as e:
            print(f"Usage tracking error: {e}")
    
    def _calculate_cost(self, prompt_tokens: int, completion_tokens: int, model: str = "gpt-4") -> float:
        """コスト計算"""
        if model == "gpt-4":
            prompt_cost = prompt_tokens * 0.00003  # $0.03/1K tokens
            completion_cost = completion_tokens * 0.00006  # $0.06/1K tokens
        else:  # gpt-3.5-turbo
            prompt_cost = prompt_tokens * 0.0000015  # $0.0015/1K tokens
            completion_cost = completion_tokens * 0.000002  # $0.002/1K tokens
        
        return prompt_cost + completion_cost
    
    def _count_tokens(self, text: str, model: str = "gpt-4") -> int:
        """トークン数をカウント"""
        try:
            encoding = tiktoken.encoding_for_model(model)
            return len(encoding.encode(text))
        except Exception:
            # フォールバック: 大雑把な計算
            return len(text) // 4
    
    def _validate_rate_limit(self, user_id: str) -> bool:
        """レート制限チェック"""
        try:
            # 1分間に10リクエスト、1日に100リクエストの制限
            now = datetime.now()
            minute_key = now.strftime('%Y-%m-%d-%H-%M')
            day_key = now.strftime('%Y-%m-%d')
            
            user_usage_ref = self.firestore_client.collection('user_ai_usage').document(user_id)
            user_usage = user_usage_ref.get()
            
            if user_usage.exists:
                usage_data = user_usage.to_dict()
                
                # 1分間の制限チェック
                minute_count = usage_data.get(f'minute_{minute_key}', 0)
                if minute_count >= 10:
                    return False
                
                # 1日の制限チェック
                day_count = usage_data.get(f'day_{day_key}', 0)
                if day_count >= 100:
                    return False
            
            # カウンターを更新
            user_usage_ref.set({
                f'minute_{minute_key}': firestore.Increment(1),
                f'day_{day_key}': firestore.Increment(1),
                'last_request': firestore.SERVER_TIMESTAMP
            }, merge=True)
            
            return True
            
        except Exception as e:
            print(f"Rate limit check error: {e}")
            return True  # エラーの場合は通す
    
    def summarize_contract(self, contract_text: str, user_id: str) -> Dict[str, Any]:
        """契約書の要約生成"""
        try:
            # プロンプト準備
            prompt = self.prompts['summarize'].format(contract_text=contract_text)
            
            # トークン数計算
            prompt_tokens = self._count_tokens(prompt)
            
            # OpenAI API呼び出し
            messages = [
                SystemMessage(content="あなたは経験豊富な法務専門家です。契約書の分析と要約を正確に行います。"),
                HumanMessage(content=prompt)
            ]
            
            start_time = time.time()
            response = self.openai_client(messages)
            processing_time = time.time() - start_time
            
            completion_tokens = self._count_tokens(response.content)
            cost = self._calculate_cost(prompt_tokens, completion_tokens)
            
            # 使用量追跡
            self._track_usage('summarize', prompt_tokens + completion_tokens, cost)
            
            # 結果を構造化
            summary_result = {
                'summary': response.content,
                'metadata': {
                    'processing_time': processing_time,
                    'tokens_used': prompt_tokens + completion_tokens,
                    'cost': cost,
                    'model': 'gpt-4',
                    'timestamp': datetime.now().isoformat()
                }
            }
            
            # Firestoreに保存
            doc_ref = self.firestore_client.collection('ai_summaries').document()
            doc_ref.set({
                'user_id': user_id,
                'contract_hash': hashlib.md5(contract_text.encode()).hexdigest(),
                'result': summary_result,
                'created_at': firestore.SERVER_TIMESTAMP
            })
            
            summary_result['result_id'] = doc_ref.id
            return summary_result
            
        except Exception as e:
            print(f"Contract summary error: {e}")
            return {
                'summary': '',
                'metadata': {'error': str(e)},
                'result_id': None
            }
    
    def analyze_risk(self, contract_text: str, user_id: str) -> Dict[str, Any]:
        """契約書のリスク分析"""
        try:
            # プロンプト準備
            prompt = self.prompts['risk_analysis'].format(contract_text=contract_text)
            
            # トークン数計算
            prompt_tokens = self._count_tokens(prompt)
            
            # OpenAI API呼び出し
            messages = [
                SystemMessage(content="あなたは法務リスク分析の専門家です。契約書のリスクを正確に評価し、JSON形式で回答します。"),
                HumanMessage(content=prompt)
            ]
            
            start_time = time.time()
            response = self.openai_client(messages)
            processing_time = time.time() - start_time
            
            completion_tokens = self._count_tokens(response.content)
            cost = self._calculate_cost(prompt_tokens, completion_tokens)
            
            # JSON解析
            try:
                risk_analysis = json.loads(response.content)
            except json.JSONDecodeError:
                # JSONが不正な場合はテキストとして処理
                risk_analysis = {
                    'overall_risk_level': '不明',
                    'risk_score': 0,
                    'risk_factors': [],
                    'summary': response.content
                }
            
            # 使用量追跡
            self._track_usage('risk_analysis', prompt_tokens + completion_tokens, cost)
            
            # 結果を構造化
            analysis_result = {
                'risk_analysis': risk_analysis,
                'metadata': {
                    'processing_time': processing_time,
                    'tokens_used': prompt_tokens + completion_tokens,
                    'cost': cost,
                    'model': 'gpt-4',
                    'timestamp': datetime.now().isoformat()
                }
            }
            
            # Firestoreに保存
            doc_ref = self.firestore_client.collection('ai_risk_analyses').document()
            doc_ref.set({
                'user_id': user_id,
                'contract_hash': hashlib.md5(contract_text.encode()).hexdigest(),
                'result': analysis_result,
                'created_at': firestore.SERVER_TIMESTAMP
            })
            
            analysis_result['result_id'] = doc_ref.id
            return analysis_result
            
        except Exception as e:
            print(f"Risk analysis error: {e}")
            return {
                'risk_analysis': {
                    'overall_risk_level': 'エラー',
                    'risk_score': 0,
                    'risk_factors': [],
                    'summary': f'分析エラー: {str(e)}'
                },
                'metadata': {'error': str(e)},
                'result_id': None
            }
    
    def chat_with_contract(self, contract_text: str, question: str, chat_history: List[Dict], user_id: str) -> Dict[str, Any]:
        """契約書との対話機能"""
        try:
            # チャット履歴を文字列形式に変換
            history_text = ""
            for msg in chat_history[-5:]:  # 直近5件のみ
                role = msg.get('role', 'user')
                content = msg.get('content', '')
                history_text += f"{role}: {content}\n"
            
            # プロンプト準備
            prompt = self.prompts['chat'].format(
                contract_text=contract_text,
                chat_history=history_text,
                question=question
            )
            
            # トークン数計算
            prompt_tokens = self._count_tokens(prompt)
            
            # OpenAI API呼び出し
            messages = [
                SystemMessage(content="あなたは契約書の内容に精通した法務アシスタントです。正確で分かりやすい回答を心がけてください。"),
                HumanMessage(content=prompt)
            ]
            
            start_time = time.time()
            response = self.openai_client(messages)
            processing_time = time.time() - start_time
            
            completion_tokens = self._count_tokens(response.content)
            cost = self._calculate_cost(prompt_tokens, completion_tokens)
            
            # 使用量追跡
            self._track_usage('chat', prompt_tokens + completion_tokens, cost)
            
            # 結果を構造化
            chat_result = {
                'answer': response.content,
                'metadata': {
                    'processing_time': processing_time,
                    'tokens_used': prompt_tokens + completion_tokens,
                    'cost': cost,
                    'model': 'gpt-4',
                    'timestamp': datetime.now().isoformat()
                }
            }
            
            # チャット履歴に追加してFirestoreに保存
            updated_history = chat_history + [
                {'role': 'user', 'content': question, 'timestamp': datetime.now().isoformat()},
                {'role': 'assistant', 'content': response.content, 'timestamp': datetime.now().isoformat()}
            ]
            
            doc_ref = self.firestore_client.collection('ai_chat_sessions').document()
            doc_ref.set({
                'user_id': user_id,
                'contract_hash': hashlib.md5(contract_text.encode()).hexdigest(),
                'chat_history': updated_history,
                'last_updated': firestore.SERVER_TIMESTAMP
            })
            
            chat_result['session_id'] = doc_ref.id
            chat_result['updated_history'] = updated_history
            return chat_result
            
        except Exception as e:
            print(f"Chat error: {e}")
            return {
                'answer': f'申し訳ございませんが、エラーが発生しました: {str(e)}',
                'metadata': {'error': str(e)},
                'session_id': None,
                'updated_history': chat_history
            }
    
    def extract_key_points(self, contract_text: str, user_id: str) -> Dict[str, Any]:
        """重要ポイントの抽出"""
        try:
            # プロンプト準備
            prompt = self.prompts['extract_key_points'].format(contract_text=contract_text)
            
            # トークン数計算
            prompt_tokens = self._count_tokens(prompt)
            
            # OpenAI API呼び出し
            messages = [
                SystemMessage(content="あなたは契約分析の専門家です。重要なポイントを正確に抽出し、JSON形式で回答します。"),
                HumanMessage(content=prompt)
            ]
            
            start_time = time.time()
            response = self.openai_client(messages)
            processing_time = time.time() - start_time
            
            completion_tokens = self._count_tokens(response.content)
            cost = self._calculate_cost(prompt_tokens, completion_tokens)
            
            # JSON解析
            try:
                key_points = json.loads(response.content)
            except json.JSONDecodeError:
                # JSONが不正な場合はテキストとして処理
                key_points = {
                    'key_points': [],
                    'summary': response.content
                }
            
            # 使用量追跡
            self._track_usage('extract_key_points', prompt_tokens + completion_tokens, cost)
            
            # 結果を構造化
            extraction_result = {
                'key_points': key_points,
                'metadata': {
                    'processing_time': processing_time,
                    'tokens_used': prompt_tokens + completion_tokens,
                    'cost': cost,
                    'model': 'gpt-4',
                    'timestamp': datetime.now().isoformat()
                }
            }
            
            # Firestoreに保存
            doc_ref = self.firestore_client.collection('ai_key_points').document()
            doc_ref.set({
                'user_id': user_id,
                'contract_hash': hashlib.md5(contract_text.encode()).hexdigest(),
                'result': extraction_result,
                'created_at': firestore.SERVER_TIMESTAMP
            })
            
            extraction_result['result_id'] = doc_ref.id
            return extraction_result
            
        except Exception as e:
            print(f"Key points extraction error: {e}")
            return {
                'key_points': {
                    'key_points': [],
                    'summary': f'抽出エラー: {str(e)}'
                },
                'metadata': {'error': str(e)},
                'result_id': None
            }

# AIサービスインスタンス
ai_service = AIService()

@functions_framework.http
def summarize(request: Request):
    """契約書要約エンドポイント"""
    
    # CORS対応
    if request.method == 'OPTIONS':
        headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Max-Age': '3600'
        }
        return ('', 204, headers)
    
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
    
    try:
        # 認証確認
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Unauthorized'}), 401, headers
        
        # リクエストデータ取得
        request_json = request.get_json()
        if not request_json:
            return jsonify({'error': 'Invalid request format'}), 400, headers
        
        contract_text = request_json.get('contract_text')
        user_id = request_json.get('user_id')
        
        if not contract_text or not user_id:
            return jsonify({'error': 'contract_text and user_id are required'}), 400, headers
        
        # レート制限チェック
        if not ai_service._validate_rate_limit(user_id):
            return jsonify({'error': 'Rate limit exceeded'}), 429, headers
        
        # 要約生成
        result = ai_service.summarize_contract(contract_text, user_id)
        
        return jsonify(result), 200, headers
        
    except Exception as e:
        print(f"Summarize endpoint error: {e}")
        return jsonify({
            'error': 'Summary generation failed',
            'message': str(e)
        }), 500, headers

@functions_framework.http
def analyze_risk(request: Request):
    """リスク分析エンドポイント"""
    
    # CORS対応
    if request.method == 'OPTIONS':
        headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Max-Age': '3600'
        }
        return ('', 204, headers)
    
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
    
    try:
        # 認証確認
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Unauthorized'}), 401, headers
        
        # リクエストデータ取得
        request_json = request.get_json()
        if not request_json:
            return jsonify({'error': 'Invalid request format'}), 400, headers
        
        contract_text = request_json.get('contract_text')
        user_id = request_json.get('user_id')
        
        if not contract_text or not user_id:
            return jsonify({'error': 'contract_text and user_id are required'}), 400, headers
        
        # レート制限チェック
        if not ai_service._validate_rate_limit(user_id):
            return jsonify({'error': 'Rate limit exceeded'}), 429, headers
        
        # リスク分析
        result = ai_service.analyze_risk(contract_text, user_id)
        
        return jsonify(result), 200, headers
        
    except Exception as e:
        print(f"Risk analysis endpoint error: {e}")
        return jsonify({
            'error': 'Risk analysis failed',
            'message': str(e)
        }), 500, headers

@functions_framework.http
def chat(request: Request):
    """チャット機能エンドポイント"""
    
    # CORS対応
    if request.method == 'OPTIONS':
        headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Max-Age': '3600'
        }
        return ('', 204, headers)
    
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
    
    try:
        # 認証確認
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Unauthorized'}), 401, headers
        
        # リクエストデータ取得
        request_json = request.get_json()
        if not request_json:
            return jsonify({'error': 'Invalid request format'}), 400, headers
        
        contract_text = request_json.get('contract_text')
        question = request_json.get('question')
        chat_history = request_json.get('chat_history', [])
        user_id = request_json.get('user_id')
        
        if not contract_text or not question or not user_id:
            return jsonify({'error': 'contract_text, question, and user_id are required'}), 400, headers
        
        # レート制限チェック
        if not ai_service._validate_rate_limit(user_id):
            return jsonify({'error': 'Rate limit exceeded'}), 429, headers
        
        # チャット応答生成
        result = ai_service.chat_with_contract(contract_text, question, chat_history, user_id)
        
        return jsonify(result), 200, headers
        
    except Exception as e:
        print(f"Chat endpoint error: {e}")
        return jsonify({
            'error': 'Chat processing failed',
            'message': str(e)
        }), 500, headers

@functions_framework.http
def extract_key_points(request: Request):
    """重要ポイント抽出エンドポイント"""
    
    # CORS対応
    if request.method == 'OPTIONS':
        headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Max-Age': '3600'
        }
        return ('', 204, headers)
    
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
    
    try:
        # 認証確認
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Unauthorized'}), 401, headers
        
        # リクエストデータ取得
        request_json = request.get_json()
        if not request_json:
            return jsonify({'error': 'Invalid request format'}), 400, headers
        
        contract_text = request_json.get('contract_text')
        user_id = request_json.get('user_id')
        
        if not contract_text or not user_id:
            return jsonify({'error': 'contract_text and user_id are required'}), 400, headers
        
        # レート制限チェック
        if not ai_service._validate_rate_limit(user_id):
            return jsonify({'error': 'Rate limit exceeded'}), 429, headers
        
        # 重要ポイント抽出
        result = ai_service.extract_key_points(contract_text, user_id)
        
        return jsonify(result), 200, headers
        
    except Exception as e:
        print(f"Key points extraction endpoint error: {e}")
        return jsonify({
            'error': 'Key points extraction failed',
            'message': str(e)
        }), 500, headers

if __name__ == '__main__':
    # ローカル開発用
    from flask import Flask
    app = Flask(__name__)
    app.add_url_rule('/summarize', 'summarize', summarize, methods=['POST', 'OPTIONS'])
    app.add_url_rule('/analyze-risk', 'analyze_risk', analyze_risk, methods=['POST', 'OPTIONS'])
    app.add_url_rule('/chat', 'chat', chat, methods=['POST', 'OPTIONS'])
    app.add_url_rule('/extract-key-points', 'extract_key_points', extract_key_points, methods=['POST', 'OPTIONS'])
    app.run(debug=True, host='0.0.0.0', port=8081)