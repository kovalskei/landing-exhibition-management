import json
import os
import psycopg2
import urllib.request
from datetime import datetime

def handler(event, context):
    '''
    Business: Синхронизация данных из Google Sheets в БД (парсинг CSV)
    Args: event с body {eventId, sheetGid}
    Returns: HTTP response с результатом синхронизации
    '''
    method = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    body_str = event.get('body') or '{}'
    body = json.loads(body_str) if body_str else {}
    event_id = body.get('eventId')
    sheet_gids = body.get('sheetGids', ['0'])  # Можем синхронизировать несколько листов
    
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
        
        # Получаем URL таблицы
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
        
        synced = []
        errors = []
        
        # Синхронизируем каждый лист
        for gid in sheet_gids:
            try:
                csv_url = f'https://docs.google.com/spreadsheets/d/{sheet_id}/export?format=csv&gid={gid}'
                
                # Загружаем CSV
                req = urllib.request.Request(csv_url, headers={'Accept': 'text/csv'})
                with urllib.request.urlopen(req, timeout=10) as response:
                    csv_content = response.read().decode('utf-8')
                
                # Сохраняем RAW CSV в кеш (парсинг будет на фронте пока)
                # В будущем можно добавить полный парсинг здесь
                cache_data = {
                    'sheetId': sheet_id,
                    'gid': gid,
                    'csvContent': csv_content,
                    'syncedAt': datetime.now().isoformat()
                }
                
                safe_gid = gid.replace("'", "''")
                data_json = json.dumps(cache_data).replace("'", "''")
                
                cur.execute(f"""
                    INSERT INTO program_cache (event_id, sheet_gid, data, last_updated)
                    VALUES ('{safe_event_id}', '{safe_gid}', '{data_json}', CURRENT_TIMESTAMP)
                    ON CONFLICT (event_id, sheet_gid) 
                    DO UPDATE SET data = '{data_json}', last_updated = CURRENT_TIMESTAMP
                """)
                
                synced.append(gid)
            
            except Exception as e:
                errors.append({'gid': gid, 'error': str(e)})
        
        cur.close()
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'success': True,
                'synced': synced,
                'errors': errors,
                'timestamp': datetime.now().isoformat()
            })
        }
    
    finally:
        conn.close()