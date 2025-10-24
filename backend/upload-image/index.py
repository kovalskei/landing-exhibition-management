import json
import os
import base64
import urllib.request
import urllib.parse

def handler(event, context):
    '''
    Business: Загрузка изображений через imgbb API
    Args: event с httpMethod, body (base64 изображения)
          context с request_id
    Returns: HTTP response с URL загруженного изображения
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
    
    api_key = os.environ.get('IMGBB_API_KEY')
    if not api_key:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'IMGBB_API_KEY not configured'})
        }
    
    body = json.loads(event.get('body', '{}'))
    image_base64 = body.get('image')
    
    if not image_base64:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Missing image field (base64)'})
        }
    
    try:
        # Убираем data:image prefix если есть
        if ',' in image_base64:
            image_base64 = image_base64.split(',')[1]
        
        # Загружаем на imgbb
        data = urllib.parse.urlencode({
            'key': api_key,
            'image': image_base64
        }).encode('utf-8')
        
        req = urllib.request.Request('https://api.imgbb.com/1/upload', data=data)
        response = urllib.request.urlopen(req)
        result = json.loads(response.read().decode('utf-8'))
        
        if result.get('success'):
            image_url = result['data']['url']
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': True,
                    'url': image_url,
                    'deleteUrl': result['data'].get('delete_url')
                })
            }
        else:
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Upload failed', 'details': result})
            }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)})
        }
