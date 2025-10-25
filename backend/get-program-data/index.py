import json
import os
import psycopg2
import urllib.request
from datetime import datetime, timedelta

def handler(event, context):
    '''
    Business: Получение данных программы с кешированием в БД
    Args: event с queryStringParameters (eventId, sheetGid, forceRefresh)
    Returns: HTTP response с данными программы
    '''
    method = event.get('httpMethod', 'GET')
    
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
    
    params = event.get('queryStringParameters', {}) or {}
    event_id = params.get('eventId')
    sheet_gid = params.get('sheetGid', '0')
    force_refresh = params.get('forceRefresh') == 'true'
    
    if not event_id:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'eventId is required'})
        }
    
    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'DATABASE_URL not configured'})
        }
    
    conn = psycopg2.connect(dsn)
    conn.autocommit = True
    
    try:
        cur = conn.cursor()
        
        # Проверяем кеш (если не форсируем обновление)
        if not force_refresh:
            safe_event_id = event_id.replace("'", "''")
            safe_gid = sheet_gid.replace("'", "''")
            
            # Кеш действителен 5 минут
            cache_expiry = (datetime.now() - timedelta(minutes=5)).isoformat()
            
            cur.execute(f"""
                SELECT data, last_updated 
                FROM program_cache 
                WHERE event_id = '{safe_event_id}' 
                  AND sheet_gid = '{safe_gid}'
                  AND last_updated > '{cache_expiry}'
            """)
            
            cached = cur.fetchone()
            if cached:
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*',
                        'X-Cache': 'HIT',
                        'X-Cache-Date': cached[1].isoformat()
                    },
                    'body': json.dumps(cached[0])
                }
        
        # Кеша нет или устарел - загружаем из Google Sheets
        # Получаем URL таблицы из program_events
        safe_event_id = event_id.replace("'", "''")
        cur.execute(f"SELECT sheet_url FROM program_events WHERE id = '{safe_event_id}'")
        event_row = cur.fetchone()
        
        if not event_row:
            cur.close()
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Event not found'})
            }
        
        sheet_url = event_row[0]
        sheet_id_match = sheet_url.split('/spreadsheets/d/')
        if len(sheet_id_match) < 2:
            cur.close()
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Invalid sheet URL'})
            }
        
        sheet_id = sheet_id_match[1].split('/')[0]
        csv_url = f'https://docs.google.com/spreadsheets/d/{sheet_id}/export?format=csv&gid={sheet_gid}'
        
        # Загружаем CSV (это нужно будет парсить на фронте, но можно и здесь)
        # Пока возвращаем URL для загрузки клиентом
        response_data = {
            'csvUrl': csv_url,
            'sheetId': sheet_id,
            'gid': sheet_gid,
            'cached': False,
            'timestamp': datetime.now().isoformat()
        }
        
        # Сохраняем в кеш
        safe_gid = sheet_gid.replace("'", "''")
        data_json = json.dumps(response_data).replace("'", "''")
        
        cur.execute(f"""
            INSERT INTO program_cache (event_id, sheet_gid, data, last_updated)
            VALUES ('{safe_event_id}', '{safe_gid}', '{data_json}', CURRENT_TIMESTAMP)
            ON CONFLICT (event_id, sheet_gid) 
            DO UPDATE SET data = '{data_json}', last_updated = CURRENT_TIMESTAMP
        """)
        
        cur.close()
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'X-Cache': 'MISS'
            },
            'body': json.dumps(response_data)
        }
    
    finally:
        conn.close()
