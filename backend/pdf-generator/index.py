"""
Business: Генерация PDF программы мероприятия с современным форматированием
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


def download_image(url_or_id: str) -> Optional[io.BytesIO]:
    """Загрузка изображения из URL или Google Drive ID"""
    if not url_or_id:
        print('⚠️ url_or_id пустой, изображение не загружено')
        return None
    
    try:
        # Проверяем, это URL или Drive ID
        if url_or_id.startswith('http://') or url_or_id.startswith('https://'):
            url = url_or_id
            print(f'📥 Загружаю изображение по URL: {url[:80]}...')
        else:
            # Это Google Drive ID
            url = f'https://drive.google.com/uc?export=download&id={url_or_id}&confirm=t'
            print(f'📥 Загружаю изображение из Google Drive: {url_or_id}')
        
        request = urllib.request.Request(url)
        request.add_header('User-Agent', 'Mozilla/5.0')
        
        response = urllib.request.urlopen(request, timeout=15)
        data = response.read()
        
        # Проверяем, что это действительно изображение
        if data.startswith(b'<!DOCTYPE') or data.startswith(b'<html'):
            print(f'❌ Получен HTML вместо изображения для {url_or_id}')
            return None
        
        print(f'✅ Изображение загружено: {len(data)} байт')
        img_buffer = io.BytesIO(data)
        img_buffer.seek(0)
        return img_buffer
    except Exception as e:
        print(f'❌ Ошибка загрузки изображения {url_or_id}: {e}')
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
            canvas.setFillColor(colors.HexColor('#94a3b8'))
            canvas.drawString(20 * mm, y, ' • '.join(meta_parts))
        
        # Логотип справа
        if self.logo_buffer:
            try:
                from reportlab.lib.utils import ImageReader
                self.logo_buffer.seek(0)
                img_reader = ImageReader(self.logo_buffer)
                x = A4[0] - 20 * mm - 30 * mm
                canvas.drawImage(img_reader, x, y - 3*mm, 
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
    print(f'📋 Meta data: {meta_data}')
    
    meta = Meta(
        title=meta_data.get('title', 'Программа'),
        subtitle=meta_data.get('subtitle', ''),
        date=meta_data.get('date', ''),
        venue=meta_data.get('venue', ''),
        logo_id=meta_data.get('logoId', LOGO_FILE_ID),
        cover_id=meta_data.get('coverId', COVER_IMAGE_ID)
    )
    
    print(f'🖼️ Cover ID: {meta.cover_id}')
    print(f'🏢 Logo ID: {meta.logo_id}')
    
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
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#1a1a1a'),
        spaceAfter=14
    )
    
    time_style = ParagraphStyle(
        'Time',
        fontName=font_bold,
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#475569'),
        spaceAfter=6
    )
    
    speaker_style = ParagraphStyle(
        'Speaker',
        fontName=font_bold,
        fontSize=13,
        leading=18,
        textColor=colors.HexColor('#1a1a1a'),
        spaceAfter=3
    )
    
    role_style = ParagraphStyle(
        'Role',
        fontName=font_name,
        fontSize=11,
        leading=16,
        textColor=colors.HexColor('#64748b'),
        spaceAfter=6
    )
    
    session_title_style = ParagraphStyle(
        'SessionTitle',
        fontName=font_bold,
        fontSize=14,
        leading=20,
        textColor=colors.HexColor('#0f172a'),
        spaceAfter=6
    )
    
    desc_style = ParagraphStyle(
        'Desc',
        fontName=font_name,
        fontSize=11,
        leading=18,
        textColor=colors.HexColor('#334155'),
        spaceAfter=4
    )
    
    bullet_style = ParagraphStyle(
        'Bullet',
        fontName=font_name,
        fontSize=11,
        leading=18,
        leftIndent=16,
        textColor=colors.HexColor('#334155'),
        spaceAfter=4
    )
    
    tags_style = ParagraphStyle(
        'Tags',
        fontName=font_italic,
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#64748b'),
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
            story.append(img)
            story.append(PageBreak())
            print('✅ Обложка добавлена в PDF')
        except Exception as e:
            print(f'❌ Ошибка обложки: {e}')
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
                story.append(Spacer(1, 8))
                story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#e2e8f0')))
                story.append(Spacer(1, 12))
    
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