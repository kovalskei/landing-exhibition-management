import json
import os
import psycopg2

def handler(event, context):
    '''
    Business: Управление программами событий (CRUD)
    Args: event с httpMethod, body, queryStringParameters
          context с request_id
    Returns: HTTP response dict
    '''
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
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
        if method == 'GET':
            event_id = event.get('queryStringParameters', {}).get('id')
            
            if event_id:
                cur = conn.cursor()
                safe_id = event_id.replace("'", "''")
                cur.execute(f"SELECT id, name, sheet_url, logo_url, cover_url, day_sheets, created_at FROM program_events WHERE id = '{safe_id}'")
                row = cur.fetchone()
                cur.close()
                
                if not row:
                    return {
                        'statusCode': 404,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Event not found'})
                    }
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'id': row[0],
                        'name': row[1],
                        'sheetUrl': row[2],
                        'logoUrl': row[3],
                        'coverUrl': row[4],
                        'daySheets': row[5],
                        'createdAt': row[6].isoformat() if row[6] else None
                    })
                }
            else:
                cur = conn.cursor()
                cur.execute("SELECT id, name, sheet_url, logo_url, cover_url, day_sheets, created_at FROM program_events ORDER BY created_at DESC")
                rows = cur.fetchall()
                cur.close()
                
                events = [
                    {
                        'id': row[0],
                        'name': row[1],
                        'sheetUrl': row[2],
                        'logoUrl': row[3],
                        'coverUrl': row[4],
                        'daySheets': row[5],
                        'createdAt': row[6].isoformat() if row[6] else None
                    }
                    for row in rows
                ]
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'events': events})
                }
        
        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            event_id = body.get('id')
            name = body.get('name')
            sheet_url = body.get('sheetUrl')
            logo_url = body.get('logoUrl', '')
            cover_url = body.get('coverUrl', '')
            day_sheets = body.get('daySheets', '')
            
            if not event_id or not name or not sheet_url:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Missing required fields: id, name, sheetUrl'})
                }
            
            cur = conn.cursor()
            safe_id = event_id.replace("'", "''")
            safe_name = name.replace("'", "''")
            safe_url = sheet_url.replace("'", "''")
            safe_logo = logo_url.replace("'", "''") if logo_url else ''
            safe_cover = cover_url.replace("'", "''") if cover_url else ''
            safe_days = day_sheets.replace("'", "''") if day_sheets else ''
            cur.execute(f"INSERT INTO program_events (id, name, sheet_url, logo_url, cover_url, day_sheets) VALUES ('{safe_id}', '{safe_name}', '{safe_url}', '{safe_logo}', '{safe_cover}', '{safe_days}')")
            cur.close()
            
            return {
                'statusCode': 201,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'id': event_id})
            }
        
        elif method == 'PUT':
            body = json.loads(event.get('body', '{}'))
            event_id = body.get('id')
            name = body.get('name')
            sheet_url = body.get('sheetUrl')
            logo_url = body.get('logoUrl', '')
            cover_url = body.get('coverUrl', '')
            day_sheets = body.get('daySheets', '')
            
            if not event_id or not name or not sheet_url:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Missing required fields: id, name, sheetUrl'})
                }
            
            cur = conn.cursor()
            safe_id = event_id.replace("'", "''")
            safe_name = name.replace("'", "''")
            safe_url = sheet_url.replace("'", "''")
            safe_logo = logo_url.replace("'", "''") if logo_url else ''
            safe_cover = cover_url.replace("'", "''") if cover_url else ''
            safe_days = day_sheets.replace("'", "''") if day_sheets else ''
            cur.execute(f"UPDATE program_events SET name = '{safe_name}', sheet_url = '{safe_url}', logo_url = '{safe_logo}', cover_url = '{safe_cover}', day_sheets = '{safe_days}' WHERE id = '{safe_id}'")
            cur.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True})
            }
        
        elif method == 'DELETE':
            event_id = event.get('queryStringParameters', {}).get('id')
            
            if not event_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Missing id parameter'})
                }
            
            cur = conn.cursor()
            safe_id = event_id.replace("'", "''")
            cur.execute(f"DELETE FROM program_events WHERE id = '{safe_id}'")
            cur.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True})
            }
        
        else:
            return {
                'statusCode': 405,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Method not allowed'})
            }
    
    finally:
        conn.close()