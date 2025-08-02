import os
import json
import tempfile
import io
from typing import Dict, List, Any, Optional
from datetime import datetime
import re

# Google Cloud
from google.cloud import vision
from google.cloud import storage
from google.cloud import firestore
import firebase_admin
from firebase_admin import credentials

# PDF/画像処理
import PyPDF2
import pdfplumber
from PIL import Image
import cv2
import numpy as np

# 日本語処理
from janome.tokenizer import Tokenizer

# Firebase Functions Framework
import functions_framework
from flask import Request, jsonify

# Firebase Admin初期化
if not firebase_admin._apps:
    firebase_admin.initialize_app()

# クライアント初期化
vision_client = vision.ImageAnnotatorClient()
storage_client = storage.Client()
firestore_client = firestore.Client()
tokenizer = Tokenizer()

class OCRService:
    def __init__(self):
        self.vision_client = vision_client
        self.storage_client = storage_client
        self.firestore_client = firestore_client
        
    def extract_text_from_pdf(self, file_path: str) -> Dict[str, Any]:
        """PDFからテキストを抽出"""
        try:
            extracted_data = {
                'text': '',
                'pages': [],
                'metadata': {},
                'confidence': 0.0
            }
            
            # PyPDF2でテキスト抽出を試行
            try:
                with open(file_path, 'rb') as file:
                    pdf_reader = PyPDF2.PdfReader(file)
                    text_content = ""
                    
                    for page_num, page in enumerate(pdf_reader.pages):
                        page_text = page.extract_text()
                        if page_text.strip():
                            text_content += f"\n--- Page {page_num + 1} ---\n{page_text}"
                            extracted_data['pages'].append({
                                'page_number': page_num + 1,
                                'text': page_text,
                                'method': 'PyPDF2'
                            })
                    
                    if text_content.strip():
                        extracted_data['text'] = text_content
                        extracted_data['confidence'] = 0.9
                        return extracted_data
            except Exception as e:
                print(f"PyPDF2 extraction failed: {e}")
            
            # pdfplumberで再試行
            try:
                with pdfplumber.open(file_path) as pdf:
                    text_content = ""
                    
                    for page_num, page in enumerate(pdf.pages):
                        page_text = page.extract_text()
                        if page_text:
                            text_content += f"\n--- Page {page_num + 1} ---\n{page_text}"
                            extracted_data['pages'].append({
                                'page_number': page_num + 1,
                                'text': page_text,
                                'method': 'pdfplumber'
                            })
                    
                    if text_content.strip():
                        extracted_data['text'] = text_content
                        extracted_data['confidence'] = 0.85
                        return extracted_data
            except Exception as e:
                print(f"pdfplumber extraction failed: {e}")
            
            # Vision APIでOCR実行（最後の手段）
            return self.extract_text_with_vision_api(file_path, 'application/pdf')
            
        except Exception as e:
            print(f"PDF text extraction error: {e}")
            return {
                'text': '',
                'pages': [],
                'metadata': {'error': str(e)},
                'confidence': 0.0
            }
    
    def extract_text_from_image(self, file_path: str) -> Dict[str, Any]:
        """画像からテキストを抽出"""
        try:
            # 画像前処理
            processed_image_path = self.preprocess_image(file_path)
            
            # Vision APIでOCR実行
            return self.extract_text_with_vision_api(processed_image_path, 'image/jpeg')
            
        except Exception as e:
            print(f"Image text extraction error: {e}")
            return {
                'text': '',
                'pages': [],
                'metadata': {'error': str(e)},
                'confidence': 0.0
            }
    
    def preprocess_image(self, file_path: str) -> str:
        """画像前処理（ノイズ除去、コントラスト調整等）"""
        try:
            # OpenCVで画像読み込み
            image = cv2.imread(file_path)
            
            # グレースケール変換
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            
            # ノイズ除去
            denoised = cv2.medianBlur(gray, 3)
            
            # コントラスト強化
            clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
            enhanced = clahe.apply(denoised)
            
            # 二値化
            _, binary = cv2.threshold(enhanced, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
            
            # 処理済み画像を保存
            processed_path = file_path.replace('.', '_processed.')
            cv2.imwrite(processed_path, binary)
            
            return processed_path
            
        except Exception as e:
            print(f"Image preprocessing error: {e}")
            return file_path  # 前処理に失敗した場合は元の画像を返す
    
    def extract_text_with_vision_api(self, file_path: str, mime_type: str) -> Dict[str, Any]:
        """Google Cloud Vision APIでテキスト抽出"""
        try:
            with io.open(file_path, 'rb') as image_file:
                content = image_file.read()
            
            image = vision.Image(content=content)
            
            # 日本語と英語を指定
            image_context = vision.ImageContext(
                language_hints=['ja', 'en']
            )
            
            # OCR実行
            response = self.vision_client.document_text_detection(
                image=image,
                image_context=image_context
            )
            
            if response.error.message:
                raise Exception(f'Vision API error: {response.error.message}')
            
            # 結果解析
            document = response.full_text_annotation
            
            extracted_data = {
                'text': document.text if document else '',
                'pages': [],
                'metadata': {
                    'method': 'Vision API',
                    'language_hints': ['ja', 'en']
                },
                'confidence': 0.0
            }
            
            if document:
                # 信頼度計算
                total_confidence = 0
                word_count = 0
                
                for page in document.pages:
                    page_data = {
                        'page_number': len(extracted_data['pages']) + 1,
                        'text': '',
                        'blocks': []
                    }
                    
                    for block in page.blocks:
                        block_text = ''
                        block_confidence = 0
                        paragraph_count = 0
                        
                        for paragraph in block.paragraphs:
                            paragraph_text = ''
                            for word in paragraph.words:
                                word_text = ''.join([symbol.text for symbol in word.symbols])
                                paragraph_text += word_text + ' '
                                
                                # 信頼度集計
                                total_confidence += word.confidence
                                word_count += 1
                            
                            block_text += paragraph_text + '\n'
                            paragraph_count += 1
                        
                        page_data['text'] += block_text
                        page_data['blocks'].append({
                            'text': block_text.strip(),
                            'confidence': block_confidence / max(paragraph_count, 1)
                        })
                    
                    extracted_data['pages'].append(page_data)
                
                # 全体の信頼度
                extracted_data['confidence'] = total_confidence / max(word_count, 1)
            
            return extracted_data
            
        except Exception as e:
            print(f"Vision API extraction error: {e}")
            return {
                'text': '',
                'pages': [],
                'metadata': {'error': str(e)},
                'confidence': 0.0
            }
    
    def extract_contract_information(self, text: str) -> Dict[str, Any]:
        """契約書から主要情報を抽出"""
        try:
            extracted_info = {
                'parties': [],
                'dates': {},
                'amounts': [],
                'key_terms': [],
                'clauses': []
            }
            
            # 当事者名抽出
            parties = self.extract_parties(text)
            extracted_info['parties'] = parties
            
            # 日付抽出
            dates = self.extract_dates(text)
            extracted_info['dates'] = dates
            
            # 金額抽出
            amounts = self.extract_amounts(text)
            extracted_info['amounts'] = amounts
            
            # 重要条項抽出
            key_terms = self.extract_key_terms(text)
            extracted_info['key_terms'] = key_terms
            
            # 条項分類
            clauses = self.classify_clauses(text)
            extracted_info['clauses'] = clauses
            
            return extracted_info
            
        except Exception as e:
            print(f"Contract information extraction error: {e}")
            return {
                'parties': [],
                'dates': {},
                'amounts': [],
                'key_terms': [],
                'clauses': [],
                'error': str(e)
            }
    
    def extract_parties(self, text: str) -> List[Dict[str, Any]]:
        """当事者名の抽出"""
        parties = []
        
        # 会社名のパターン
        company_patterns = [
            r'([株式会社|有限会社|合同会社|合資会社|合名会社|一般社団法人|公益社団法人|学校法人|医療法人][\w\s]+)',
            r'([\w\s]+[株式会社|有限会社|合同会社|合資会社|合名会社|一般社団法人|公益社団法人|学校法人|医療法人])',
            r'([A-Z][a-z]+ [A-Z][a-z]+ (?:Inc\.|Corp\.|Ltd\.|LLC|Co\.))',
        ]
        
        for pattern in company_patterns:
            matches = re.finditer(pattern, text)
            for match in matches:
                party_name = match.group(1).strip()
                if party_name and len(party_name) > 2:
                    parties.append({
                        'name': party_name,
                        'type': 'company',
                        'position': match.start()
                    })
        
        # 重複除去
        unique_parties = []
        seen_names = set()
        for party in parties:
            if party['name'] not in seen_names:
                unique_parties.append(party)
                seen_names.add(party['name'])
        
        return unique_parties[:10]  # 最大10件
    
    def extract_dates(self, text: str) -> Dict[str, Any]:
        """日付の抽出"""
        dates = {}
        
        # 日付パターン
        date_patterns = [
            (r'(\d{4})年(\d{1,2})月(\d{1,2})日', 'japanese'),
            (r'(\d{4})/(\d{1,2})/(\d{1,2})', 'slash'),
            (r'(\d{4})-(\d{1,2})-(\d{1,2})', 'hyphen'),
            (r'(\d{1,2})/(\d{1,2})/(\d{4})', 'us_format'),
        ]
        
        all_dates = []
        
        for pattern, format_type in date_patterns:
            matches = re.finditer(pattern, text)
            for match in matches:
                try:
                    if format_type == 'japanese':
                        year, month, day = match.groups()
                    elif format_type == 'us_format':
                        month, day, year = match.groups()
                    else:
                        year, month, day = match.groups()
                    
                    date_obj = datetime(int(year), int(month), int(day))
                    all_dates.append({
                        'date': date_obj.isoformat(),
                        'original_text': match.group(0),
                        'position': match.start()
                    })
                except ValueError:
                    continue
        
        # 日付を種類別に分類
        if all_dates:
            sorted_dates = sorted(all_dates, key=lambda x: x['position'])
            dates['contract_date'] = sorted_dates[0] if sorted_dates else None
            dates['effective_date'] = sorted_dates[1] if len(sorted_dates) > 1 else None
            dates['expiration_date'] = sorted_dates[-1] if len(sorted_dates) > 2 else None
            dates['all_dates'] = sorted_dates
        
        return dates
    
    def extract_amounts(self, text: str) -> List[Dict[str, Any]]:
        """金額の抽出"""
        amounts = []
        
        # 金額パターン
        amount_patterns = [
            r'(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)(?:円|万円|億円)',
            r'¥(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)',
            r'\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)',
            r'(\d{1,3}(?:,\d{3})*(?:\.\d{2})?) *(?:USD|JPY|EUR)',
        ]
        
        for pattern in amount_patterns:
            matches = re.finditer(pattern, text)
            for match in matches:
                amount_text = match.group(0)
                amount_value = re.sub(r'[^\d.]', '', match.group(1))
                
                try:
                    value = float(amount_value)
                    amounts.append({
                        'value': value,
                        'original_text': amount_text,
                        'currency': self.detect_currency(amount_text),
                        'position': match.start()
                    })
                except ValueError:
                    continue
        
        return amounts[:5]  # 最大5件
    
    def detect_currency(self, text: str) -> str:
        """通貨の検出"""
        if '円' in text or '¥' in text or 'JPY' in text:
            return 'JPY'
        elif '$' in text or 'USD' in text:
            return 'USD'
        elif 'EUR' in text or '€' in text:
            return 'EUR'
        else:
            return 'UNKNOWN'
    
    def extract_key_terms(self, text: str) -> List[Dict[str, Any]]:
        """重要条項の抽出"""
        key_terms = []
        
        # 重要キーワード
        important_keywords = [
            '責任', '義務', '権利', '保証', '補償', '違約金', '解除', '終了',
            '更新', '延長', '変更', '修正', '通知', '承諾', '合意', '協議',
            '支払', '料金', '費用', '手数料', '税金', '消費税'
        ]
        
        for keyword in important_keywords:
            # キーワードを含む文を抽出
            sentences = re.split(r'[。．\n]', text)
            for sentence in sentences:
                if keyword in sentence and len(sentence.strip()) > 10:
                    key_terms.append({
                        'keyword': keyword,
                        'text': sentence.strip(),
                        'importance': 'high' if keyword in ['責任', '義務', '違約金', '解除'] else 'medium'
                    })
        
        return key_terms[:20]  # 最大20件
    
    def classify_clauses(self, text: str) -> List[Dict[str, Any]]:
        """条項の分類"""
        clauses = []
        
        clause_types = {
            'payment': ['支払', '料金', '費用', '代金', '報酬'],
            'termination': ['解除', '終了', '破棄', '無効'],
            'liability': ['責任', '損害', '補償', '賠償'],
            'confidentiality': ['秘密', '機密', '守秘', '開示'],
            'intellectual_property': ['知的財産', '著作権', '特許', '商標'],
            'general': ['一般', '雑則', '準拠法', '管轄']
        }
        
        for clause_type, keywords in clause_types.items():
            for keyword in keywords:
                if keyword in text:
                    # キーワードを含む段落を抽出
                    paragraphs = re.split(r'\n\s*\n', text)
                    for paragraph in paragraphs:
                        if keyword in paragraph and len(paragraph.strip()) > 20:
                            clauses.append({
                                'type': clause_type,
                                'content': paragraph.strip()[:500],  # 最大500文字
                                'keyword': keyword
                            })
                            break  # 各タイプにつき1つずつ
        
        return clauses

# OCRサービスインスタンス
ocr_service = OCRService()

@functions_framework.http
def extract_text(request: Request):
    """HTTPエンドポイント: テキスト抽出"""
    
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
        # 認証確認（簡易版）
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Unauthorized'}), 401, headers
        
        # リクエストデータ取得
        request_json = request.get_json()
        if not request_json:
            return jsonify({'error': 'Invalid request format'}), 400, headers
        
        file_url = request_json.get('file_url')
        file_type = request_json.get('file_type', 'pdf')
        
        if not file_url:
            return jsonify({'error': 'file_url is required'}), 400, headers
        
        # 一時ファイルダウンロード
        with tempfile.NamedTemporaryFile(delete=False, suffix=f'.{file_type}') as temp_file:
            # Google Cloud Storageからファイルダウンロード
            bucket_name = file_url.split('/')[2]  # gs://bucket-name/path/file
            file_path = '/'.join(file_url.split('/')[3:])
            
            bucket = storage_client.bucket(bucket_name)
            blob = bucket.blob(file_path)
            blob.download_to_filename(temp_file.name)
            
            # OCR実行
            if file_type.lower() == 'pdf':
                result = ocr_service.extract_text_from_pdf(temp_file.name)
            else:
                result = ocr_service.extract_text_from_image(temp_file.name)
            
            # 契約情報抽出
            if result['text']:
                contract_info = ocr_service.extract_contract_information(result['text'])
                result['contract_info'] = contract_info
            
            # 結果をFirestoreに保存
            doc_ref = firestore_client.collection('ocr_results').document()
            doc_ref.set({
                'file_url': file_url,
                'file_type': file_type,
                'result': result,
                'created_at': firestore.SERVER_TIMESTAMP,
                'user_id': request_json.get('user_id')
            })
            
            result['result_id'] = doc_ref.id
            
        # 一時ファイル削除
        os.unlink(temp_file.name)
        
        return jsonify(result), 200, headers
        
    except Exception as e:
        print(f"OCR processing error: {e}")
        return jsonify({
            'error': 'OCR processing failed',
            'message': str(e)
        }), 500, headers

if __name__ == '__main__':
    # ローカル開発用
    from flask import Flask
    app = Flask(__name__)
    app.add_url_rule('/extract-text', 'extract_text', extract_text, methods=['POST', 'OPTIONS'])
    app.run(debug=True, host='0.0.0.0', port=8080)