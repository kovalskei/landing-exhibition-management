import json
import os
from typing import Dict, Any
from google.oauth2.service_account import Credentials
from googleapiclient.discovery import build

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Получение данных из Google Таблицы для секции Экспонент
    Args: event - dict с httpMethod, queryStringParameters (spreadsheetId, range)
          context - объект с request_id
    Returns: HTTP response с данными о ценах и датах
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    if method != 'GET':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    params = event.get('queryStringParameters') or {}
    spreadsheet_id = params.get('spreadsheetId', os.environ.get('GOOGLE_SHEET_ID', ''))
    range_name = params.get('range', 'Экспонент!A1:B10')
    
    if not spreadsheet_id:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'spreadsheetId required'})
        }
    
    creds_json = os.environ.get('GOOGLE_SERVICE_ACCOUNT_KEY', '{}')
    creds_dict = json.loads(creds_json)
    
    credentials = Credentials.from_service_account_info(
        creds_dict,
        scopes=['https://www.googleapis.com/auth/spreadsheets.readonly']
    )
    
    service = build('sheets', 'v4', credentials=credentials)
    sheet = service.spreadsheets()
    
    result = sheet.values().get(
        spreadsheetId=spreadsheet_id,
        range=range_name
    ).execute()
    
    values = result.get('values', [])
    
    data = {
        'price_early': values[0][1] if len(values) > 0 and len(values[0]) > 1 else '180 000 р.',
        'date_early': values[1][1] if len(values) > 1 and len(values[1]) > 1 else 'до 31 октября',
        'price_regular': values[2][1] if len(values) > 2 and len(values[2]) > 1 else '210 000 р.',
        'date_regular': values[3][1] if len(values) > 3 and len(values[3]) > 1 else 'до 14 ноября'
    }
    
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'isBase64Encoded': False,
        'body': json.dumps(data)
    }
