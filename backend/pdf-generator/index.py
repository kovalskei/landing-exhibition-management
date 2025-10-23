"""
Business: Генерация PDF программы мероприятия с форматированием
Args: event - dict с httpMethod, body (JSON с halls, sessions, meta, hallIntros)
      context - object с request_id, function_name, memory_limit_in_mb
Returns: HTTP response с base64-encoded PDF или ошибкой
"""

import json
import io
import base64
from typing import Dict, Any, List, Optional
from dataclasses import dataclass
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, HRFlowable, Table, TableStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont


@dataclass
class Session:
    hall: str
    start: str
    end: str
    title: str
    speaker: str
    role: str
    desc: str
    tags_canon: List[str]


@dataclass
class Meta:
    title: str
    subtitle: str
    date: str
    venue: str


def normalize_for_tags(s: str) -> str:
    """Нормализация текста для извлечения тегов"""
    s = s.replace('&lbrace;', '{').replace('&#123;', '{').replace('&#x7B;', '{')
    s = s.replace('&rbrace;', '}').replace('&#125;', '}').replace('&#x7D;', '}')
    s = s.replace('\u00A0', ' ')
    import re
    s = re.sub(r'\s{2,}', ' ', s)
    return s.strip()


def extract_tags_from_text(text: str) -> List[str]:
    """Извлечение тегов из фигурных скобок {...}"""
    import re
    text = normalize_for_tags(text)
    found = []
    for match in re.finditer(r'\{([^}]*)\}', text):
        for tok in re.split(r'[;,|/]+', match.group(1)):
            tok = tok.strip()
            if tok:
                found.append(tok)
    return list(dict.fromkeys(found))


def strip_braces(text: str) -> str:
    """Удаление блоков {...} из текста"""
    import re
    text = normalize_for_tags(text)
    text = re.sub(r'\{[^}]*\}', '', text)
    text = re.sub(r'\s{2,}', ' ', text)
    return text.strip()


def collect_tags_for_session(session_data: Dict[str, Any]) -> List[str]:
    """Собираем теги из всех источников"""
    tags = []
    
    # Из массивов tagsCanon/tags
    if 'tagsCanon' in session_data and isinstance(session_data['tagsCanon'], list):
        tags.extend(session_data['tagsCanon'])
    if 'tags' in session_data and isinstance(session_data['tags'], list):
        tags.extend(session_data['tags'])
    
    # Из фигурных скобок в полях
    for field in ['title', 'speaker', 'role', 'desc']:
        if field in session_data:
            tags.extend(extract_tags_from_text(str(session_data[field])))
    
    return list(dict.fromkeys(tags))


def create_pdf(data: Dict[str, Any]) -> bytes:
    """Создание PDF документа"""
    buffer = io.BytesIO()
    
    # Метаданные
    meta_data = data.get('meta', {})
    meta = Meta(
        title=meta_data.get('title', 'Программа мероприятия'),
        subtitle=meta_data.get('subtitle', ''),
        date=meta_data.get('date', ''),
        venue=meta_data.get('venue', '')
    )
    
    # Документ
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=20*mm,
        leftMargin=20*mm,
        topMargin=20*mm,
        bottomMargin=20*mm,
        title=meta.title
    )
    
    # Стили
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#000000'),
        spaceAfter=12,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    )
    
    subtitle_style = ParagraphStyle(
        'CustomSubtitle',
        parent=styles['Normal'],
        fontSize=14,
        textColor=colors.HexColor('#666666'),
        spaceAfter=20,
        alignment=TA_CENTER,
        fontName='Helvetica-Oblique'
    )
    
    hall_style = ParagraphStyle(
        'HallHeading',
        parent=styles['Heading1'],
        fontSize=20,
        textColor=colors.HexColor('#000000'),
        spaceAfter=10,
        fontName='Helvetica-Bold'
    )
    
    time_style = ParagraphStyle(
        'TimeStyle',
        parent=styles['Normal'],
        fontSize=14,
        textColor=colors.HexColor('#000000'),
        spaceAfter=4,
        fontName='Helvetica-Bold'
    )
    
    speaker_style = ParagraphStyle(
        'SpeakerStyle',
        parent=styles['Normal'],
        fontSize=12,
        textColor=colors.HexColor('#000000'),
        spaceAfter=2,
        fontName='Helvetica-Bold'
    )
    
    role_style = ParagraphStyle(
        'RoleStyle',
        parent=styles['Normal'],
        fontSize=11,
        textColor=colors.HexColor('#1a1a1a'),
        spaceAfter=6,
        fontName='Helvetica'
    )
    
    session_title_style = ParagraphStyle(
        'SessionTitle',
        parent=styles['Normal'],
        fontSize=12,
        textColor=colors.HexColor('#000000'),
        spaceAfter=4,
        fontName='Helvetica-Bold'
    )
    
    desc_style = ParagraphStyle(
        'DescStyle',
        parent=styles['Normal'],
        fontSize=11,
        textColor=colors.HexColor('#000000'),
        spaceAfter=2,
        fontName='Helvetica'
    )
    
    tags_style = ParagraphStyle(
        'TagsStyle',
        parent=styles['Normal'],
        fontSize=11,
        textColor=colors.HexColor('#6B6B6B'),
        spaceAfter=6,
        fontName='Helvetica-Oblique'
    )
    
    # Контент
    story = []
    
    # Титульная страница
    story.append(Spacer(1, 40*mm))
    story.append(Paragraph(meta.title, title_style))
    if meta.subtitle:
        story.append(Paragraph(meta.subtitle, subtitle_style))
    story.append(Spacer(1, 20*mm))
    
    meta_info = []
    if meta.date:
        meta_info.append(f"Дата проведения: {meta.date}")
    if meta.venue:
        meta_info.append(meta.venue)
    
    if meta_info:
        meta_text = '<br/>'.join(meta_info)
        story.append(Paragraph(meta_text, subtitle_style))
    
    story.append(PageBreak())
    
    # Залы и сессии
    halls = data.get('halls', [])
    sessions_data = data.get('sessions', [])
    hall_intros = data.get('hallIntros', {})
    
    # Группировка по залам
    by_hall: Dict[str, List[Session]] = {hall: [] for hall in halls}
    
    for s_data in sessions_data:
        hall_name = s_data.get('hall', '')
        if hall_name not in by_hall:
            continue
        
        # Очистка от тегов {...}
        title = strip_braces(s_data.get('title', ''))
        speaker = strip_braces(s_data.get('speaker', ''))
        role = strip_braces(s_data.get('role', ''))
        desc = strip_braces(s_data.get('desc', ''))
        
        tags = collect_tags_for_session(s_data)
        
        session = Session(
            hall=hall_name,
            start=s_data.get('start', ''),
            end=s_data.get('end', ''),
            title=title,
            speaker=speaker,
            role=role,
            desc=desc,
            tags_canon=tags
        )
        by_hall[hall_name].append(session)
    
    # Сортировка сессий
    for hall in by_hall:
        by_hall[hall].sort(key=lambda s: s.start)
    
    # Рендер залов
    first_hall = True
    for hall_name in halls:
        sessions_list = by_hall.get(hall_name, [])
        bullets = hall_intros.get(hall_name, [])
        
        if not sessions_list and not bullets:
            continue
        
        if not first_hall:
            story.append(PageBreak())
        first_hall = False
        
        # Заголовок зала
        story.append(Paragraph(hall_name.upper(), hall_style))
        
        # Интро-буллеты
        if bullets:
            for bullet in bullets:
                story.append(Paragraph(f"• {bullet}", desc_style))
            story.append(Spacer(1, 8))
        
        # Сессии
        for i, session in enumerate(sessions_list):
            # Время
            time_text = f"{session.start}"
            if session.end:
                time_text += f" — {session.end}"
            story.append(Paragraph(time_text, time_style))
            
            # Теги
            if session.tags_canon:
                tags_text = f"Теги: {', '.join(session.tags_canon)}"
                story.append(Paragraph(tags_text, tags_style))
            
            # Спикер
            if session.speaker:
                story.append(Paragraph(session.speaker, speaker_style))
            
            # Роль
            if session.role:
                story.append(Paragraph(session.role, role_style))
            
            # Заголовок доклада
            if session.title:
                story.append(Paragraph(session.title, session_title_style))
            
            # Описание
            if session.desc:
                desc_lines = session.desc.split('\n')
                for line in desc_lines:
                    line = line.strip()
                    if line.startswith('- '):
                        line = '• ' + line[2:]
                    if line:
                        story.append(Paragraph(line, desc_style))
            
            # Разделитель между сессиями
            if i < len(sessions_list) - 1:
                story.append(Spacer(1, 8))
                story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#CCCCCC')))
                story.append(Spacer(1, 10))
    
    # Генерация PDF
    doc.build(story)
    
    pdf_bytes = buffer.getvalue()
    buffer.close()
    
    return pdf_bytes


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'POST')
    
    # CORS
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
    
    try:
        body_str = event.get('body', '{}')
        data = json.loads(body_str)
        
        pdf_bytes = create_pdf(data)
        b64 = base64.b64encode(pdf_bytes).decode('utf-8')
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'ok': True, 'b64': b64}),
            'isBase64Encoded': False
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'ok': False, 'error': str(e)}),
            'isBase64Encoded': False
        }
