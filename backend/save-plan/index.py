'''
Business: Сохранение плана докладов пользователя и обновление статистики
Args: event с httpMethod, body (eventId, userId, sessionIds)
Returns: HTTP response со статусом операции
'''

import json
import os
from typing import Dict, Any, List
import psycopg2
from psycopg2.extras import execute_values

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    body_data = json.loads(event.get('body', '{}'))
    event_id: str = body_data.get('eventId', '')
    user_id: str = body_data.get('userId', '')
    session_ids: List[str] = body_data.get('sessionIds', [])
    
    if not event_id or not user_id or not isinstance(session_ids, list):
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Invalid request data'}),
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
        cur = conn.cursor()
        
        cur.execute('''
            SELECT id FROM t_p73504605_landing_exhibition_m.user_plans 
            WHERE user_id = %s AND event_id = %s
        ''', (user_id, event_id))
        
        existing = cur.fetchone()
        
        if existing:
            cur.execute('''
                SELECT session_ids FROM t_p73504605_landing_exhibition_m.user_plans 
                WHERE user_id = %s AND event_id = %s
            ''', (user_id, event_id))
            old_session_ids = cur.fetchone()[0] or []
            
            cur.execute('''
                UPDATE t_p73504605_landing_exhibition_m.user_plans 
                SET session_ids = %s, updated_at = CURRENT_TIMESTAMP 
                WHERE user_id = %s AND event_id = %s
            ''', (session_ids, user_id, event_id))
        else:
            old_session_ids = []
            cur.execute('''
                INSERT INTO t_p73504605_landing_exhibition_m.user_plans 
                (event_id, user_id, session_ids) 
                VALUES (%s, %s, %s)
            ''', (event_id, user_id, session_ids))
        
        removed_sessions = set(old_session_ids) - set(session_ids)
        for session_id in removed_sessions:
            cur.execute('''
                INSERT INTO t_p73504605_landing_exhibition_m.session_stats 
                (event_id, session_id, interest_count) 
                VALUES (%s, %s, 0) 
                ON CONFLICT (event_id, session_id) 
                DO UPDATE SET 
                    interest_count = GREATEST(0, t_p73504605_landing_exhibition_m.session_stats.interest_count - 1),
                    updated_at = CURRENT_TIMESTAMP
            ''', (event_id, session_id))
        
        added_sessions = set(session_ids) - set(old_session_ids)
        for session_id in added_sessions:
            cur.execute('''
                INSERT INTO t_p73504605_landing_exhibition_m.session_stats 
                (event_id, session_id, interest_count) 
                VALUES (%s, %s, 1) 
                ON CONFLICT (event_id, session_id) 
                DO UPDATE SET 
                    interest_count = t_p73504605_landing_exhibition_m.session_stats.interest_count + 1,
                    updated_at = CURRENT_TIMESTAMP
            ''', (event_id, session_id))
        
        conn.commit()
        cur.close()
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'success': True, 'message': 'Plan saved successfully'}),
            'isBase64Encoded': False
        }
        
    except Exception as e:
        conn.rollback()
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
