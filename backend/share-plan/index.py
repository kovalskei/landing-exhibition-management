'''
Business: Генерирует короткую ссылку для шаринга плана мероприятия
Args: event с httpMethod, body (plan - массив ID сессий)
Returns: HTTP response с коротким кодом или данными плана
'''

import json
import uuid
import os
from typing import Dict, Any
import psycopg2
from psycopg2.extras import execute_values

def get_db_connection():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method == 'POST':
        body_data = json.loads(event.get('body', '{}'))
        plan_data = body_data.get('plan', [])
        
        if not plan_data:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Plan is empty'}),
                'isBase64Encoded': False
            }
        
        plan_id = str(uuid.uuid4())[:8]
        
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO shared_plans (plan_id, session_ids) VALUES (%s, %s)",
            (plan_id, plan_data)
        )
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'planId': plan_id}),
            'isBase64Encoded': False
        }
    
    if method == 'GET':
        params = event.get('queryStringParameters', {})
        plan_id = params.get('id', '')
        
        if not plan_id:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Plan ID is required'}),
                'isBase64Encoded': False
            }
        
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute(
            "SELECT session_ids FROM shared_plans WHERE plan_id = %s",
            (plan_id,)
        )
        row = cur.fetchone()
        cur.close()
        conn.close()
        
        if not row:
            return {
                'statusCode': 404,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Plan not found'}),
                'isBase64Encoded': False
            }
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'plan': row[0]}),
            'isBase64Encoded': False
        }
    
    return {
        'statusCode': 405,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({'error': 'Method not allowed'}),
        'isBase64Encoded': False
    }