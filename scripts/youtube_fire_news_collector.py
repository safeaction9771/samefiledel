# -*- coding: utf-8 -*-
import sys
import os
import json
import re
import urllib.request
import urllib.parse
from datetime import datetime, timedelta

sys.stdout.reconfigure(encoding='utf-8')

OUTPUT_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'src', 'data', 'youtube_fire_news.json')

REGIONS = ['전국', '서울', '경기', '부산', '인천', '대구', '대전', '광주', '울산', '세종', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주']

REGION_ALIASES = {
    '서울특별시': '서울', '서울시': '서울', '수도권': '서울', '강남': '서울', '종로': '서울', '마포': '서울', '송파': '서울', '영등포': '서울', '구로': '서울', '은평': '서울', '노원': '서울', '관악': '서울', '도봉': '서울', '중구': '서울', '용산': '서울', '성동': '서울', '광진': '서울', '동대문': '서울', '중랑': '서울', '성북': '서울', '강북': '서울', '서대문': '서울', '양천': '서울', '강서': '서울', '금천': '서울', '동작': '서울', '서초': '서울', '강동': '서울',
    '경기도': '경기', '수원': '경기', '성남': '경기', '고양': '경기', '용인': '경기', '부천': '경기', '안산': '경기', '남양주': '경기', '안양': '경기', '화성': '경기', '평택': '경기', '의정부': '경기', '파주': '경기', '시흥': '경기', '김포': '경기', '광명': '경기', '광주(경기)': '경기', '군포': '경기', '이천': '경기', '오산': '경기', '하남': '경기', '양주': '경기', '구리': '경기', '안성': '경기', '포천': '경기', '의왕': '경기', '여주': '경기', '양평': '경기', '동두천': '경기', '가평': '경기', '연천': '경기',
    '부산광역시': '부산', '부산시': '부산', '해운대': '부산', '사하': '부산', '부산진': '부산', '동래': '부산', '남구(부산)': '부산', '북구(부산)': '부산', '강서구(부산)': '부산', '금정': '부산', '사상': '부산', '기장': '부산',
    '인천광역시': '인천', '인천시': '인천', '송도': '인천', '청라': '인천', '영종': '인천', '부평': '인천', '서구': '인천', '남동구': '인천', '계양': '인천', '미추홀': '인천', '연수': '인천', '강화': '인천', '옹진': '인천',
    '대구광역시': '대구', '대구시': '대구', '달서': '대구', '수성': '대구', '달성': '대구',
    '대전광역시': '대전', '대전시': '대전', '유성': '대전', '대덕': '대전', '서구(대전)': '대전',
    '광주광역시': '광주', '광주시': '광주', '광산': '광주',
    '울산광역시': '울산', '울산시': '울산', '울주': '울산', '남구(울산)': '울산', '동구(울산)': '울산', '북구(울산)': '울산',
    '세종특별자치시': '세종', '세종시': '세종',
    '강원특별자치도': '강원', '강원도': '강원', '춘천': '강원', '원주': '강원', '강릉': '강원', '동해': '강원', '태백': '강원', '속초': '강원', '삼척': '강원', '홍천': '강원', '횡성': '강원', '영월': '강원', '평창': '강원', '정선': '강원', '철원': '강원', '화천': '강원', '양구': '강원', '인제': '강원', '고성': '강원', '양양': '강원',
    '충청북도': '충북', '충북': '충북', '청주': '충북', '충주': '충북', '제천': '충북', '보은': '충북', '옥천': '충북', '영동': '충북', '증평': '충북', '진천': '충북', '괴산': '충북', '음성': '충북', '단양': '충북',
    '충청남도': '충남', '충남': '충남', '천안': '충남', '공주': '충남', '보령': '충남', '아산': '충남', '서산': '충남', '논산': '충남', '계룡': '충남', '당진': '충남', '금산': '충남', '부여': '충남', '서천': '충남', '청양': '충남', '홍성': '충남', '예산': '충남', '태안': '충남',
    '전라북도': '전북', '전북특별자치도': '전북', '전북': '전북', '전주': '전북', '군산': '전북', '익산': '전북', '정읍': '전북', '남원': '전북', '김제': '전북', '완주': '전북', '진안': '전북', '무주': '전북', '장수': '전북', '임실': '전북', '순창': '전북', '고창': '전북', '부안': '전북',
    '전라남도': '전남', '전남': '전남', '목포': '전남', '여수': '전남', '순천': '전남', '나주': '전남', '광양': '전남', '담양': '전남', '곡성': '전남', '구례': '전남', '고흥': '전남', '보성': '전남', '화순': '전남', '장흥': '전남', '강진': '전남', '해남': '전남', '영암': '전남', '무안': '전남', '함평': '전남', '영광': '전남', '장성': '전남', '완도': '전남', '진도': '전남', '신안': '전남',
    '경상북도': '경북', '경북': '경북', '포항': '경북', '경주': '경북', '김천': '경북', '안동': '경북', '구미': '경북', '영주': '경북', '영천': '경북', '상주': '경북', '문경': '경북', '경산': '경북', '군위': '경북', '의성': '경북', '청송': '경북', '영양': '경북', '영덕': '경북', '청도': '경북', '고령': '경북', '성주': '경북', '칠곡': '경북', '예천': '경북', '봉화': '경북', '울진': '경북', '울릉': '경북',
    '경상남도': '경남', '경남': '경남', '창원': '경남', '진주': '경남', '통영': '경남', '사천': '경남', '김해': '경남', '밀양': '경남', '거제': '경남', '양산': '경남', '의령': '경남', '함안': '경남', '창녕': '경남', '고성(경남)': '경남', '남해': '경남', '하동': '경남', '산청': '경남', '함양': '경남', '거창': '경남', '합천': '경남',
    '제주특별자치도': '제주', '제주도': '제주', '제주시': '제주', '서귀포': '제주'
}

def extract_region(text):
    for alias, reg in REGION_ALIASES.items():
        if alias in text:
            return reg
    return '전국'

def extract_cause(text):
    if '전기' in text or '누전' in text or '합선' in text or '배터리' in text:
        return '전기적 요인 / 배터리 발화'
    if '부주의' in text or '담배' in text or '촛불' in text or '용접' in text or '음식물' in text:
        return '부주의 / 작업 중 발화'
    if '기계' in text or '엔진' in text or '과열' in text:
        return '기계적 요인 / 과열'
    if '방화' in text:
        return '방화 의심 / 조사'
    if '가스' in text or '폭발' in text:
        return '가스 누출 및 폭발'
    if '산불' in text:
        return '산불 / 자연 요인'
    return '원인 정밀 조사 중'

def extract_status(text):
    if '완진' in text or '진화 완료' in text or '꺼져' in text or '잡혀' in text or '진화' in text or '불 꺼져' in text:
        return '완진'
    if '대응' in text or '진화중' in text or '불길' in text or '출동' in text or '번져' in text:
        return '진화 중'
    return '상황 수습'

def parse_published_to_datetime(pub_text, title_text=""):
    now = datetime(2026, 9, 19, 5, 15)
    
    # Check title for explicit dates e.g. 2026.09.18 or 2026.09.17
    m_title_date = re.search(r'(202[0-9])[\.\-/]([0-1]?[0-9])[\.\-/]([0-3]?[0-9])', title_text)
    if m_title_date:
        y, m, d = m_title_date.groups()
        dt_str = f"{y}-{int(m):02d}-{int(d):02d}"
        return f"{dt_str} 18:00", dt_str, "18:00"

    if not pub_text:
        return now.strftime('%Y-%m-%d %H:%M'), now.strftime('%Y-%m-%d'), now.strftime('%H:%M')
    
    # 2026.09.18 or 2026-09-18
    m_date = re.search(r'(202[0-9])[\.\-/]([0-1]?[0-9])[\.\-/]([0-3]?[0-9])', pub_text)
    if m_date:
        y, m, d = m_date.groups()
        dt_str = f"{y}-{int(m):02d}-{int(d):02d}"
        return f"{dt_str} 12:00", dt_str, "12:00"

    # '1시간 전', '3시간 전', '1일 전', '3일 전'
    m_min = re.search(r'([0-9]+)\s*분\s*전', pub_text)
    if m_min:
        mins = int(m_min.group(1))
        target_dt = now - timedelta(minutes=mins)
        return target_dt.strftime('%Y-%m-%d %H:%M'), target_dt.strftime('%Y-%m-%d'), target_dt.strftime('%H:%M')

    m_hour = re.search(r'([0-9]+)\s*시간\s*전', pub_text)
    if m_hour:
        hours = int(m_hour.group(1))
        target_dt = now - timedelta(hours=hours)
        return target_dt.strftime('%Y-%m-%d %H:%M'), target_dt.strftime('%Y-%m-%d'), target_dt.strftime('%H:%M')

    m_day = re.search(r'([0-9]+)\s*일\s*전', pub_text)
    if m_day:
        days = int(m_day.group(1))
        target_dt = now - timedelta(days=days)
        return target_dt.strftime('%Y-%m-%d %H:%M'), target_dt.strftime('%Y-%m-%d'), target_dt.strftime('%H:%M')

    m_week = re.search(r'([0-9]+)\s*주\s*전', pub_text)
    if m_week:
        weeks = int(m_week.group(1))
        target_dt = now - timedelta(days=weeks*7)
        return target_dt.strftime('%Y-%m-%d %H:%M'), target_dt.strftime('%Y-%m-%d'), target_dt.strftime('%H:%M')

    m_month = re.search(r'([0-9]+)\s*개월\s*전', pub_text)
    if m_month:
        months = int(m_month.group(1))
        target_dt = now - timedelta(days=months*30)
        return target_dt.strftime('%Y-%m-%d %H:%M'), target_dt.strftime('%Y-%m-%d'), target_dt.strftime('%H:%M')

    return now.strftime('%Y-%m-%d %H:%M'), now.strftime('%Y-%m-%d'), now.strftime('%H:%M')

def search_youtube_query(query):
    print(f"[*] Searching YouTube for: {query}")
    encoded_query = urllib.parse.quote(query)
    url = f"https://www.youtube.com/results?search_query={encoded_query}&sp=CAI%253D"
    req = urllib.request.Request(
        url,
        headers={
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept-Language': 'ko-KR,ko;q=0.9'
        }
    )
    items = []
    try:
        with urllib.request.urlopen(req, timeout=12) as response:
            html = response.read().decode('utf-8', errors='ignore')
            m = re.search(r'var ytInitialData = ({.*?});</script>', html)
            if not m:
                return items
            data = json.loads(m.group(1))
            sections = data.get('contents', {}).get('twoColumnSearchResultsRenderer', {}).get('primaryContents', {}).get('sectionListRenderer', {}).get('contents', [])
            for section in sections:
                item_section = section.get('itemSectionRenderer', {})
                for content in item_section.get('contents', []):
                    vr = content.get('videoRenderer')
                    if not vr:
                        continue
                    vid = vr.get('videoId')
                    if not vid:
                        continue
                    
                    title = vr.get('title', {}).get('runs', [{}])[0].get('text', '')
                    owner = vr.get('ownerText', {}).get('runs', [{}])[0].get('text', '')
                    pub_text = vr.get('publishedTimeText', {}).get('simpleText', '')
                    view_text = vr.get('viewCountText', {}).get('simpleText', '조회수 정보 없음')
                    length_text = vr.get('lengthText', {}).get('simpleText', '00:00')
                    
                    desc_snippets = vr.get('detailedMetadataSnippets', [{}])
                    desc = ""
                    if desc_snippets:
                        desc_runs = desc_snippets[0].get('snippetText', {}).get('runs', [])
                        desc = "".join([r.get('text', '') for r in desc_runs])
                    
                    fire_keywords = ['화재', '불', '소방', '진화', '전소', '산불', '폭발', '발화', '구조', '소방청', '소방서', '소방관']
                    if not any(k in title for k in fire_keywords):
                        continue

                    exclude_keywords = ['불닭', '불장난', '캠핑 불멍', '마인크래프트', '게임']
                    if any(ek in title for ek in exclude_keywords):
                        continue

                    items.append({
                        'videoId': vid,
                        'title': title,
                        'owner': owner,
                        'publishedText': pub_text,
                        'viewText': view_text,
                        'lengthText': length_text,
                        'description': desc
                    })
    except Exception as e:
        print(f"[-] Search error for {query}: {e}")
    return items

def fetch_channel_rss(channel_name, channel_id):
    print(f"[*] Fetching RSS for {channel_name}...")
    url = f"https://www.youtube.com/feeds/videos.xml?channel_id={channel_id}"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    items = []
    try:
        import xml.etree.ElementTree as ET
        with urllib.request.urlopen(req, timeout=10) as response:
            content = response.read()
            root = ET.fromstring(content)
            for entry in root.findall('{http://www.w3.org/2005/Atom}entry'):
                vid_el = entry.find('{http://www.youtube.com/xml/schemas/2015}videoId')
                title_el = entry.find('{http://www.w3.org/2005/Atom}title')
                pub_el = entry.find('{http://www.w3.org/2005/Atom}published')
                
                vid = vid_el.text if vid_el is not None else ''
                title = title_el.text if title_el is not None else ''
                pub = pub_el.text if pub_el is not None else ''
                
                if not vid or not title:
                    continue
                
                fire_keywords = ['화재', '불', '소방', '진화', '전소', '산불', '폭발', '발화', '구조', '소방서']
                if not any(k in title for k in fire_keywords):
                    continue
                
                items.append({
                    'videoId': vid,
                    'title': title,
                    'owner': channel_name,
                    'publishedText': pub,
                    'viewText': '최신 영상',
                    'lengthText': '02:00',
                    'description': f"[{channel_name}] {title}"
                })
    except Exception as e:
        print(f"[-] RSS error for {channel_name}: {e}")
    return items

def main():
    print("=== YouTube 실시간 화재 뉴스 수집 시작 ===")
    
    all_raw_items = []
    
    rss_channels = {
        'YTN': 'UChlgI3UHCOnwUGzWzbJ3H5w',
        'KBS 뉴스': 'UCcQTRi69dsVYHN3exePtZ1A',
        'SBS 뉴스': 'UCkinYTS9IHqOEwR1Sze2JTw',
        '연합뉴스TV': 'UCTHCOPwqNfZ0uiKOvFyhGwg',
        'MBN 뉴스': 'UCG9aFJTZ-lMCHAiO1KJsirg'
    }
    for cname, cid in rss_channels.items():
        all_raw_items.extend(fetch_channel_rss(cname, cid))
        
    queries = [
        '화재 뉴스',
        '화재 속보',
        '소방 화재 출동',
        '공장 화재 속보',
        '아파트 화재 뉴스',
        '소방청 화재 진화',
        '강원 화재 뉴스',
        '인천 화재 뉴스',
        '경기 화재 뉴스',
        '서울 화재 뉴스',
        '부산 화재 뉴스',
        '대구 화재 뉴스',
        '충남 화재 뉴스',
        '전북 화재 뉴스',
        '전남 화재 뉴스',
        '경북 화재 뉴스',
        '경남 화재 뉴스',
        '제주 화재 뉴스',
        '산불 진화 소방',
        '전기차 화재 진압'
    ]
    for q in queries:
        all_raw_items.extend(search_youtube_query(q))
        
    seen_vids = set()
    processed_news = []
    
    for item in all_raw_items:
        vid = item['videoId']
        if vid in seen_vids:
            continue
        seen_vids.add(vid)
        
        title = item['title']
        owner = item['owner']
        pub_text = item['publishedText']
        desc = item.get('description', '')
        
        channel_name = owner.replace(' News', ' 뉴스').replace('NEWS', ' 뉴스').replace('OFFICIAL', '').strip()
        if not channel_name:
            channel_name = '화재뉴스'
            
        datetime_str, date_str, time_str = parse_published_to_datetime(pub_text, title)
        
        # 3개월 (90일) 이내의 자료만 필터링
        cutoff_dt = datetime.now() - timedelta(days=90)
        cutoff_str = cutoff_dt.strftime('%Y-%m-%d')
        if date_str and date_str < cutoff_str:
            continue

        region = extract_region(title + " " + desc)
        cause = extract_cause(title + " " + desc)
        status = extract_status(title + " " + desc)
        
        clean_title = re.sub(r'\[.*?\]|\(.*?\)|/.*?$', '', title).strip()
        if clean_title:
            location = f"{region} {clean_title[:32]}"
        else:
            location = f"{region} 화재 현장"
            
        record = {
            'id': f"YT-{vid}",
            'videoId': vid,
            'title': title,
            'channel': channel_name,
            'date': date_str,
            'time': time_str,
            'datetime': datetime_str,
            'occurDate': datetime_str,
            'occurTime': datetime_str,
            'publishedText': pub_text or f"{date_str} {time_str}",
            'region': region,
            'location': location,
            'address': location,
            'occurPlace': location,
            'cause': cause,
            'fireCause': cause,
            'statusText': status,
            'status': status,
            'views': item.get('viewText', '조회수 정보'),
            'duration': item.get('lengthText', '01:45'),
            'thumbnail': f"https://img.youtube.com/vi/{vid}/hqdefault.jpg",
            'videoUrl': f"https://www.youtube.com/watch?v={vid}",
            'embedUrl': f"https://www.youtube-nocookie.com/embed/{vid}?autoplay=1",
            'description': desc or title,
            'jurisStation': f"{region} 관할 소방서 출동",
            'casualtyText': '인명피해 및 피해 규모 조사 중',
            'deathCount': 0,
            'injuryCount': 0,
            'damageAmount': '조사 중',
            'sourceType': 'YOUTUBE_NEWS',
            'badgeLabel': f"🎥 {channel_name}"
        }
        processed_news.append(record)
        
    processed_news.sort(key=lambda x: x['datetime'], reverse=True)
    
    print(f"[+] Total collected unique YouTube fire news: {len(processed_news)} items")
    
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(processed_news, f, ensure_ascii=False, indent=2)
        
    print(f"[+] Saved successfully to {OUTPUT_FILE}")

if __name__ == '__main__':
    main()
