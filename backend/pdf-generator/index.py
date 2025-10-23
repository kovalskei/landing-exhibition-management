"""
Business: Генерация PDF программы мероприятия с форматированием
Args: event - dict с httpMethod, body (JSON с halls, sessions, meta, hallIntros)
      context - object с request_id, function_name, memory_limit_in_mb
Returns: HTTP response с base64-encoded PDF или ошибкой
"""

import json
import io
import base64
import os
import urllib.request
from typing import Dict, Any, List, Optional
from dataclasses import dataclass
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, HRFlowable, Image
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

LOGO_FILE_ID = '1Od5EAbR38Nu53sswxwRUrBVYTCdSSivq'
COVER_IMAGE_ID = '1Lam16DwG622LGqp0DrHwgY4xKWV3WLvU'


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
    logo_id: str
    cover_id: str


def setup_fonts():
    """Регистрация шрифтов для поддержки кириллицы"""
    from reportlab.pdfbase.pdfmetrics import registerFontFamily
    
    font_dir = '/tmp/fonts'
    os.makedirs(font_dir, exist_ok=True)
    
    fonts_to_download = [
        ('DejaVuSans', 'https://cdn.jsdelivr.net/npm/dejavu-fonts-ttf@2.37.3/ttf/DejaVuSans.ttf'),
        ('DejaVuSans-Bold', 'https://cdn.jsdelivr.net/npm/dejavu-fonts-ttf@2.37.3/ttf/DejaVuSans-Bold.ttf'),
        ('DejaVuSans-Oblique', 'https://cdn.jsdelivr.net/npm/dejavu-fonts-ttf@2.37.3/ttf/DejaVuSans-Oblique.ttf'),
        ('DejaVuSans-BoldOblique', 'https://cdn.jsdelivr.net/npm/dejavu-fonts-ttf@2.37.3/ttf/DejaVuSans-BoldOblique.ttf'),
        ('DejaVuSansCondensed', 'https://cdn.jsdelivr.net/npm/dejavu-fonts-ttf@2.37.3/ttf/DejaVuSansCondensed.ttf'),
        ('DejaVuSansCondensed-Bold', 'https://cdn.jsdelivr.net/npm/dejavu-fonts-ttf@2.37.3/ttf/DejaVuSansCondensed-Bold.ttf'),
        ('DejaVuSansCondensed-Oblique', 'https://cdn.jsdelivr.net/npm/dejavu-fonts-ttf@2.37.3/ttf/DejaVuSansCondensed-Oblique.ttf'),
        ('DejaVuSansCondensed-BoldOblique', 'https://cdn.jsdelivr.net/npm/dejavu-fonts-ttf@2.37.3/ttf/DejaVuSansCondensed-BoldOblique.ttf'),
    ]
    
    registered = []
    for font_name, url in fonts_to_download:
        font_path = os.path.join(font_dir, f'{font_name}.ttf')
        
        if not os.path.exists(font_path):
            print(f'Загружаю шрифт {font_name}...')
            try:
                urllib.request.urlretrieve(url, font_path)
                print(f'Шрифт {font_name} загружен')
            except Exception as e:
                print(f'❌ Ошибка загрузки {font_name}: {e}')
                raise Exception(f'Не удалось загрузить шрифт {font_name}: {e}')
        
        try:
            pdfmetrics.registerFont(TTFont(font_name, font_path))
            registered.append(font_name)
            print(f'Шрифт {font_name} зарегистрирован')
        except Exception as e:
            print(f'❌ Ошибка регистрации {font_name}: {e}')
            raise Exception(f'Не удалось зарегистрировать шрифт {font_name}: {e}')
    
    if len(registered) != 8:
        raise Exception(f'Зарегистрировано только {len(registered)} из 8 шрифтов')
    
    try:
        registerFontFamily(
            'DejaVuSans',
            normal='DejaVuSans',
            bold='DejaVuSans-Bold',
            italic='DejaVuSans-Oblique',
            boldItalic='DejaVuSans-BoldOblique'
        )
        registerFontFamily(
            'DejaVuSansCondensed',
            normal='DejaVuSansCondensed',
            bold='DejaVuSansCondensed-Bold',
            italic='DejaVuSansCondensed-Oblique',
            boldItalic='DejaVuSansCondensed-BoldOblique'
        )
        print('Семейства DejaVuSans и DejaVuSansCondensed зарегистрированы')
    except Exception as e:
        print(f'❌ Ошибка регистрации семейства: {e}')
        raise Exception(f'Не удалось зарегистрировать семейство шрифтов: {e}')


def download_image(file_id: str) -> Optional[io.BytesIO]:
    """Загрузка изображения из Google Drive"""
    if not file_id:
        return None
    
    try:
        url = f'https://drive.google.com/uc?export=download&id={file_id}'
        response = urllib.request.urlopen(url)
        data = response.read()
        return io.BytesIO(data)
    except Exception as e:
        print(f'Ошибка загрузки изображения {file_id}: {e}')
        return None


def normalize_text(s: str) -> str:
    """Нормализация текста"""
    s = s.replace('&lbrace;', '{').replace('&#123;', '{')
    s = s.replace('&rbrace;', '}').replace('&#125;', '}')
    s = s.replace('\u00A0', ' ')
    import re
    return re.sub(r'\s{2,}', ' ', s).strip()


def extract_tags(text: str) -> List[str]:
    """Извлечение тегов из {...}"""
    import re
    text = normalize_text(text)
    found = []
    for match in re.finditer(r'\{([^}]*)\}', text):
        for tok in re.split(r'[;,|/]+', match.group(1)):
            tok = tok.strip()
            if tok:
                found.append(tok)
    return list(dict.fromkeys(found))


def strip_tags(text: str) -> str:
    """Удаление {...} из текста"""
    import re
    text = normalize_text(text)
    return re.sub(r'\{[^}]*\}', '', text).strip()


def collect_tags(session_data: Dict[str, Any]) -> List[str]:
    """Сбор всех тегов сессии"""
    tags = []
    
    if 'tagsCanon' in session_data and isinstance(session_data['tagsCanon'], list):
        tags.extend(session_data['tagsCanon'])
    if 'tags' in session_data and isinstance(session_data['tags'], list):
        tags.extend(session_data['tags'])
    
    for field in ['title', 'speaker', 'role', 'desc']:
        if field in session_data:
            tags.extend(extract_tags(str(session_data[field])))
    
    return list(dict.fromkeys(tags))


class FooterCanvas:
    """Футер с логотипом"""
    def __init__(self, logo_buffer: Optional[io.BytesIO], meta: Meta):
        self.logo_buffer = logo_buffer
        self.meta = meta
    
    def draw_footer(self, canvas, doc):
        canvas.saveState()
        
        y = 15 * mm
        
        # Мета слева
        meta_parts = []
        if self.meta.date:
            meta_parts.append(f'Дата проведения: {self.meta.date}')
        if self.meta.venue:
            meta_parts.append(self.meta.venue)
        
        if meta_parts:
            try:
                canvas.setFont('DejaVuSansCondensed', 9)
            except:
                try:
                    canvas.setFont('DejaVuSans', 9)
                except:
                    canvas.setFont('Helvetica', 9)
            canvas.setFillColor(colors.HexColor('#333333'))
            canvas.drawString(20 * mm, y, ' • '.join(meta_parts))
        
        # Логотип справа
        if self.logo_buffer:
            try:
                self.logo_buffer.seek(0)
                x = A4[0] - 20 * mm - 30 * mm
                canvas.drawImage(self.logo_buffer, x, y - 3*mm, 
                               width=30*mm, height=10*mm, 
                               preserveAspectRatio=True, mask='auto')
            except Exception as e:
                print(f'Ошибка отрисовки логотипа: {e}')
        
        canvas.restoreState()


def create_pdf(data: Dict[str, Any]) -> bytes:
    """Создание PDF"""
    setup_fonts()
    
    buffer = io.BytesIO()
    
    meta_data = data.get('meta', {})
    meta = Meta(
        title=meta_data.get('title', 'Программа'),
        subtitle=meta_data.get('subtitle', ''),
        date=meta_data.get('date', ''),
        venue=meta_data.get('venue', ''),
        logo_id=meta_data.get('logoId', LOGO_FILE_ID),
        cover_id=meta_data.get('coverId', COVER_IMAGE_ID)
    )
    
    cover_img = download_image(meta.cover_id or COVER_IMAGE_ID)
    logo_img = download_image(meta.logo_id or LOGO_FILE_ID)
    
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=20*mm,
        leftMargin=20*mm,
        topMargin=20*mm,
        bottomMargin=25*mm,
        title=meta.title
    )
    
    # Используем DejaVuSansCondensed для компактности (как Calibri)
    try:
        test_font = pdfmetrics.getFont('DejaVuSansCondensed')
        font_name = 'DejaVuSansCondensed'
        font_bold = 'DejaVuSansCondensed-Bold'
        font_italic = 'DejaVuSansCondensed-Oblique'
        print('✅ Шрифт DejaVuSansCondensed доступен')
    except Exception as e:
        print(f'⚠️ DejaVuSansCondensed недоступен: {e}')
        # Fallback на обычный DejaVuSans
        try:
            test_font = pdfmetrics.getFont('DejaVuSans')
            font_name = 'DejaVuSans'
            font_bold = 'DejaVuSans-Bold'
            font_italic = 'DejaVuSans-Oblique'
            print('✅ Используем DejaVuSans')
        except Exception as e2:
            print(f'❌ DejaVuSans недоступен: {e2}')
            raise Exception('Шрифт DejaVuSans не загружен. PDF не будет поддерживать кириллицу.')
    
    title_style = ParagraphStyle(
        'Title',
        fontName=font_bold,
        fontSize=24,
        textColor=colors.black,
        spaceAfter=12,
        alignment=TA_CENTER
    )
    
    subtitle_style = ParagraphStyle(
        'Subtitle',
        fontName=font_italic,
        fontSize=14,
        textColor=colors.HexColor('#666666'),
        spaceAfter=20,
        alignment=TA_CENTER
    )
    
    hall_style = ParagraphStyle(
        'Hall',
        fontName=font_bold,
        fontSize=18,
        spaceAfter=10
    )
    
    time_style = ParagraphStyle(
        'Time',
        fontName=font_bold,
        fontSize=11,
        leading=12.65,
        textColor=colors.HexColor('#111111'),
        spaceAfter=6
    )
    
    speaker_style = ParagraphStyle(
        'Speaker',
        fontName=font_bold,
        fontSize=12,
        leading=12.65,
        textColor=colors.HexColor('#111111'),
        spaceAfter=2
    )
    
    role_style = ParagraphStyle(
        'Role',
        fontName=font_name,
        fontSize=11,
        leading=12.65,
        textColor=colors.HexColor('#555555'),
        spaceAfter=4
    )
    
    session_title_style = ParagraphStyle(
        'SessionTitle',
        fontName=font_bold,
        fontSize=13,
        leading=12.65,
        textColor=colors.HexColor('#111111'),
        spaceAfter=4
    )
    
    desc_style = ParagraphStyle(
        'Desc',
        fontName=font_name,
        fontSize=11,
        leading=12.65,
        textColor=colors.HexColor('#111111'),
        spaceAfter=8
    )
    
    bullet_style = ParagraphStyle(
        'Bullet',
        fontName=font_name,
        fontSize=11,
        leading=12.65,
        leftIndent=12,
        textColor=colors.HexColor('#111111'),
        spaceAfter=8
    )
    
    tags_style = ParagraphStyle(
        'Tags',
        fontName=font_italic,
        fontSize=11,
        leading=12.65,
        textColor=colors.HexColor('#555555'),
        spaceAfter=4
    )
    
    story = []
    
    # Обложка
    if cover_img:
        try:
            cover_img.seek(0)
            img = Image(cover_img)
            img_width = A4[0] - 40*mm
            aspect = img.imageHeight / img.imageWidth
            img.drawWidth = img_width
            img.drawHeight = img_width * aspect
            story.append(Spacer(1, 20*mm))
            story.append(img)
            story.append(PageBreak())
        except Exception as e:
            print(f'Ошибка обложки: {e}')
            cover_img = None
    
    # Текстовый заголовок если нет обложки
    if not cover_img:
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
            story.append(Paragraph('<br/>'.join(meta_info), subtitle_style))
        
        story.append(PageBreak())
    
    # Контент
    halls = data.get('halls', [])
    sessions_data = data.get('sessions', [])
    hall_intros = data.get('hallIntros', {})
    
    by_hall: Dict[str, List[Session]] = {hall: [] for hall in halls}
    
    for s in sessions_data:
        hall_name = s.get('hall', '')
        if hall_name not in by_hall:
            continue
        
        session = Session(
            hall=hall_name,
            start=s.get('start', ''),
            end=s.get('end', ''),
            title=strip_tags(s.get('title', '')),
            speaker=strip_tags(s.get('speaker', '')),
            role=strip_tags(s.get('role', '')),
            desc=strip_tags(s.get('desc', '')),
            tags_canon=collect_tags(s)
        )
        by_hall[hall_name].append(session)
    
    for hall in by_hall:
        by_hall[hall].sort(key=lambda x: x.start)
    
    first = True
    for hall_name in halls:
        sessions = by_hall.get(hall_name, [])
        bullets = hall_intros.get(hall_name, [])
        
        if not sessions and not bullets:
            continue
        
        if not first:
            story.append(PageBreak())
        first = False
        
        story.append(Paragraph(hall_name.upper(), hall_style))
        
        if bullets:
            for b in bullets:
                story.append(Paragraph(f"• {b}", desc_style))
            story.append(Spacer(1, 8))
        
        for i, session in enumerate(sessions):
            time_text = session.start
            if session.end:
                time_text += f" — {session.end}"
            story.append(Paragraph(time_text, time_style))
            
            if session.tags_canon:
                story.append(Paragraph(f"Теги: {', '.join(session.tags_canon)}", tags_style))
            
            if session.speaker:
                story.append(Paragraph(session.speaker, speaker_style))
            
            if session.role:
                story.append(Paragraph(session.role, role_style))
            
            if session.title:
                story.append(Paragraph(session.title, session_title_style))
            
            if session.desc:
                for line in session.desc.split('\n'):
                    line = line.strip()
                    if line.startswith('- '):
                        bullet_text = line[2:].strip()
                        story.append(Paragraph(f'• {bullet_text}', bullet_style))
                    elif line:
                        story.append(Paragraph(line, desc_style))
            
            if i < len(sessions) - 1:
                story.append(Spacer(1, 4))
                story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#CCCCCC')))
                story.append(Spacer(1, 8))
    
    # Сборка
    footer = FooterCanvas(logo_img, meta)
    doc.build(story, onFirstPage=footer.draw_footer, onLaterPages=footer.draw_footer)
    
    return buffer.getvalue()


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
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
        data = json.loads(event.get('body', '{}'))
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
        import traceback
        print(traceback.format_exc())
        
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'ok': False, 'error': str(e)}),
            'isBase64Encoded': False
        }