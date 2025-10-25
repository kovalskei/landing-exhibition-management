'''
Business: Получение статистики интереса к докладам для организаторов
Args: event с httpMethod, queryStringParameters (eventId)
Returns: HTTP response со статистикой по сессиям
'''

import json
import os
from typing import Dict, Any
import psycopg2
import psycopg2.extras

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
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
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'GET':
        return {
            'statusCode': 405,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    params = event.get('queryStringParameters') or {}
    event_id: str = params.get('eventId', '')
    
    if not event_id:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'eventId is required'}),
            'isBase64Encoded': False
        }
    
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Database configuration missing'}),
            'isBase64Encoded': False
        }
    
    conn = psycopg2.connect(database_url)
    
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        cur.execute('''
            SELECT session_id, interest_count 
            FROM t_p73504605_landing_exhibition_m.session_stats 
            WHERE event_id = %s 
            ORDER BY interest_count DESC
        ''', (event_id,))
        
        stats = cur.fetchall()
        
        cur.execute('''
            SELECT COUNT(DISTINCT user_id) as total_users 
            FROM t_p73504605_landing_exhibition_m.user_plans 
            WHERE event_id = %s
        ''', (event_id,))
        
        total_users = cur.fetchone()['total_users']
        
        cur.close()
        
        result = {
            'totalUsers': total_users,
            'sessions': [dict(row) for row in stats]
        }
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps(result),
            'isBase64Encoded': False
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
    finally:
        conn.close()
