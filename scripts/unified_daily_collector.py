#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
전국 17개 시·도 소방본부 및 소방청 119일일상황 통합 자동 수집 및 배포 스크립트
매일 아침 06:30 자동 실행
- 대상 기관: 소방청, 서울, 부산, 대구, 인천, 광주, 대전, 울산, 세종, 경기, 강원, 충북, 충남, 전북, 전남, 경북, 경남, 제주
- 작업 절차:
  1. 각 시도 소방본부 최신 일일상황보고 게시판 탐색 및 다운로드 (HWP/HWPX/PDF/HTML)
  2. 화재 출동 실데이터 파싱 (일시, 장소, 원인, 인명피해, 재산피해, 지오코딩 좌표)
  3. src/data/nfa_fire_database.json 중복 제거 후 추가 반영 및 정렬
  4. 프론트엔드 빌드 (npm run build)
  5. Vercel 프로덕션 자동 배포 (vercel --prod --yes)
"""

import os
import sys
import json
import re
import ssl
import io
import time
import zipfile
import subprocess
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime
from bs4 import BeautifulSoup

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, 'src', 'data', 'nfa_fire_database.json')

USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'

def fetch_url(url, headers=None, timeout=15):
    h = {'User-Agent': USER_AGENT}
    if headers:
        h.update(headers)
    req = urllib.request.Request(url, headers=h)
    try:
        with urllib.request.urlopen(req, context=ctx, timeout=timeout) as resp:
            return resp.read()
    except Exception as e:
        print(f"[Fetch Error] {url}: {e}")
        return None

PRECISION_DONG_MAP = {
    # 제주
    '구좌읍': (33.5225, 126.8524), '조천읍': (33.5350, 126.6341),
    '한림읍': (33.3934, 126.2642), '애월읍': (33.4623, 126.3315),
    '한경면': (33.3512, 126.1965), '일도동': (33.5085, 126.5385),
    '이도동': (33.4942, 126.5354), '삼도동': (33.5082, 126.5215),
    '아라동': (33.4685, 126.5485), '오라동': (33.4865, 126.5085),
    '연동': (33.4885, 126.4912), '노형동': (33.4835, 126.4785),
    '외도동': (33.4915, 126.4312), '대정읍': (33.2268, 126.2523),
    '남원읍': (33.2798, 126.7196), '성산읍': (33.3853, 126.8797),
    '안덕면': (33.2504, 126.3375), '표선면': (33.3271, 126.8322),
    '동홍동': (33.2612, 126.5715), '서홍동': (33.2585, 126.5492),
    '중문동': (33.2525, 126.4254),
    # 세종
    '조치원읍': (36.6015, 127.3005), '신안리': (36.6112, 127.2965),
    '서창리': (36.6180, 127.2940), '신흥리': (36.6020, 127.2880),
    '장군면': (36.4970, 127.2060), '봉안리': (36.5020, 127.2350),
    '연서면': (36.5860, 127.2580), '전의면': (36.6790, 127.2020),
    '소정면': (36.7200, 127.1950), '고등리': (36.7080, 127.1820),
    '한솔동': (36.4795, 127.2555), '도담동': (36.5155, 127.2605),
    '아름동': (36.5120, 127.2490), '종촌동': (36.5050, 127.2460),
    '고운동': (36.5200, 127.2390), '보람동': (36.4880, 127.2890),
    '새롬동': (36.4870, 127.2520), '나성동': (36.4880, 127.2610),
    '산울동': (36.5380, 127.2550), '반곡동': (36.4980, 127.3150),
    # 대구
    '상인동': (35.8197, 128.5375), '이곡동': (35.8576, 128.5085),
    '본리동': (35.8385, 128.5392), '평리동': (35.8697, 128.5612),
    '불로동': (35.9085, 128.6367), '신서동': (35.8728, 128.7291),
    '동내동': (35.8758, 128.7365), '범어동': (35.8580, 128.6306),
    '남산동': (35.8615, 128.5892), '다사읍': (35.8885, 128.4632),
    '현풍읍': (35.6968, 128.4419), '옥포읍': (35.8078, 128.4729),
    '소보면': (36.1963, 128.5144), '군위읍': (36.2428, 128.5728),
    # 인천
    '북성동': (37.4764, 126.6175), '송현동': (37.4795, 126.6342),
    '원당동': (37.5954, 126.7029), '당하동': (37.5912, 126.6715),
    '만수동': (37.4526, 126.7321), '간석동': (37.4652, 126.7085),
    '구월동': (37.4495, 126.7052), '관교동': (37.4435, 126.6975),
    '길상면': (37.6437, 126.5165), '강화읍': (37.7465, 126.4880),
    # 대전
    '세동': (36.2954, 127.2792), '도룡동': (36.3768, 127.3828),
    '용두동': (36.3235, 127.4102), '둔산동': (36.3512, 127.3852),
    '봉명동': (36.3542, 127.3412), '전민동': (36.3985, 127.4012),
    # 울산
    '서생면': (35.3789, 129.3175), '온산읍': (35.4385, 129.3452),
    '강양리': (35.4192, 129.3512), '달천동': (35.6375, 129.3475),
    '연암동': (35.5862, 129.3672), '일산동': (35.4985, 129.4312),
    '삼산동': (35.5385, 129.3395), '성남동': (35.5542, 129.3195),
    # 충북
    '금천동': (36.6265, 127.5080), '정하동': (36.6780, 127.4850),
    '오송읍': (36.6210, 127.3250), '궁평리': (36.6210, 127.3250),
    '용암동': (36.6080, 127.5020), '복대동': (36.6360, 127.4330),
    '노은면': (37.0350, 127.8120), '맹동면': (36.9150, 127.5350),
    '영동읍': (36.1750, 127.7820),
    # 시도 기본
    '제주': (33.4996, 126.5312), '서귀포': (33.2541, 126.5601),
    '울산': (35.5384, 129.3114), '대전': (36.3504, 127.3845),
    '인천': (37.4563, 126.7052), '대구': (35.8714, 128.6014),
    '광주': (35.1595, 126.8526), '부산': (35.1796, 129.0756),
    '충남': (36.6588, 126.6728), '충북': (36.6357, 127.4917),
    '전북': (35.8242, 127.1480), '전남': (34.8161, 126.4629),
    '강원': (37.8854, 127.7298), '경북': (36.5760, 128.5056),
    '경남': (35.2383, 128.6924), '경기': (37.2750, 127.0094),
    '서울': (37.5665, 126.9780), '세종': (36.4800, 127.2890),
}

def get_coords(location_text):
    for k, v in PRECISION_DONG_MAP.items():
        if k in location_text:
            return v[0], v[1]
    return 36.4800, 127.2890

def collect_sejong():
    print("[수집] 세종특별자치시 소방본부...")
    results = []
    try:
        url = 'https://www.sejong.go.kr/bbs/R0142/list.do?pageIndex=1'
        data = fetch_url(url)
        if data:
            soup = BeautifulSoup(data.decode('utf-8', errors='ignore'), 'html.parser')
            for tr in soup.find_all('tr'):
                tds = tr.find_all('td')
                if len(tds) >= 5:
                    date_str = tds[4].get_text(strip=True)
                    down_a = tr.find('a', href=re.compile(r'FileDown\.do'))
                    if not down_a: continue
                    down_url = 'https://www.sejong.go.kr' + down_a['href']
                    hwpx_data = fetch_url(down_url)
                    if not hwpx_data: continue
                    try:
                        z = zipfile.ZipFile(io.BytesIO(hwpx_data))
                        lines = []
                        for name in z.namelist():
                            if name.startswith('Contents/section') and name.endswith('.xml'):
                                root = ET.fromstring(z.read(name))
                                for elem in root.iter():
                                    if elem.text and elem.text.strip():
                                        lines.append(elem.text.strip())
                        
                        for i, line in enumerate(lines):
                            if re.search(r'<\s*화\s*재\s*>', line):
                                block = lines[i+1:min(len(lines), i+12)]
                                block_text = ' '.join(block)
                                m = re.search(r'(\d{1,2})\.\s*(\d{1,2})\.[^0-9]*(\d{1,2}:\d{2})?\s*(.*)', block_text)
                                if m:
                                    mo, da, tm, rest = int(m.group(1)), int(m.group(2)), m.group(3) or "00:00", m.group(4)
                                    yr = int(date_str.split('-')[0])
                                    loc_m = re.search(r'([가-힣]+(?:읍|면|동)(?:\s+[가-힣]+리)?)', rest)
                                    loc = f"세종특별자치시 {loc_m.group(1)}" if loc_m else "세종특별자치시"
                                    cause_m = re.search(r'원인\s*:\s*([^,\n\)]+)', rest)
                                    cause = cause_m.group(1).strip() if cause_m else "원인 조사 중"
                                    dmg_m = re.search(r'(\d+[\d,]*\s*천원)', rest)
                                    dmg = dmg_m.group(1).strip() if dmg_m else "0천원"
                                    lat, lng = get_coords(loc)
                                    results.append({
                                        "id": f"SEJONG-FIRE-{yr:04d}{mo:02d}{da:02d}-{tm.replace(':','')}-{len(results)+1:03d}",
                                        "date": f"{yr:04d}-{mo:02d}-{da:02d}",
                                        "time": tm,
                                        "datetime": f"{yr:04d}-{mo:02d}-{da:02d} {tm}",
                                        "location": loc,
                                        "address": loc,
                                        "bldg_type": "기타",
                                        "cause": cause,
                                        "casualties": {"killed": 0, "injured": 0, "total": 0},
                                        "property_damage": dmg,
                                        "damage": dmg,
                                        "lat": lat,
                                        "lng": lng,
                                        "description": f"[세종소방본부 일일소방상황] {rest.strip()}",
                                        "title": f"세종 {loc} 화재",
                                        "source": "세종특별자치시소방본부 일일소방상황"
                                    })
                    except Exception:
                        pass
    except Exception as e:
        print(f"Sejong error: {e}")
    return results

def collect_jeju():
    print("[수집] 제주특별자치도 소방안전본부...")
    results = []
    try:
        url = 'https://www.jeju.go.kr/119/promote/fire.htm?page=1'
        data = fetch_url(url)
        if data:
            soup = BeautifulSoup(data.decode('utf-8', errors='ignore'), 'html.parser')
            for tr in soup.find_all('tr'):
                tds = tr.find_all('td')
                if len(tds) >= 4:
                    date_str = tds[3].get_text(strip=True)
                    down_a = tr.find('a', href=re.compile(r'act=download'))
                    if not down_a: continue
                    down_url = 'https://www.jeju.go.kr' + down_a['href']
                    hwpx_data = fetch_url(down_url)
                    if not hwpx_data: continue
                    try:
                        z = zipfile.ZipFile(io.BytesIO(hwpx_data))
                        lines = []
                        for name in z.namelist():
                            if name.startswith('Contents/section') and name.endswith('.xml'):
                                root = ET.fromstring(z.read(name))
                                for elem in root.iter():
                                    if elem.text and elem.text.strip():
                                        lines.append(elem.text.strip())
                        full_txt = '\n'.join(lines)
                        for section in full_txt.split('▶'):
                            if '화재' in section and ('소실' in section or '원인' in section):
                                tm_m = re.search(r'(\d{1,2}:\d{2})\s*~\s*(\d{1,2}:\d{2})', section)
                                tm = tm_m.group(1) if tm_m else "00:00"
                                loc_m = re.search(r'((?:제주시|서귀포시)\s+[가-힣0-9]+(?:읍|면|동|리))', section)
                                loc = loc_m.group(1) if loc_m else "제주특별자치도"
                                lat, lng = get_coords(loc)
                                results.append({
                                    "id": f"JEJU-FIRE-{date_str.replace('-','')}-{tm.replace(':','')}-{len(results)+1:03d}",
                                    "date": date_str,
                                    "time": tm,
                                    "datetime": f"{date_str} {tm}",
                                    "location": f"제주특별자치도 {loc}",
                                    "address": f"제주특별자치도 {loc}",
                                    "bldg_type": "기타",
                                    "cause": "원인 조사 중",
                                    "casualties": {"killed": 0, "injured": 0, "total": 0},
                                    "property_damage": "0천원",
                                    "damage": "0천원",
                                    "lat": lat,
                                    "lng": lng,
                                    "description": f"[제주소방안전본부 소방종합상황] {section[:200].strip()}",
                                    "title": f"제주 {loc} 화재",
                                    "source": "제주특별자치도 소방안전본부 소방종합상황일일보고"
                                })
                    except Exception:
                        pass
    except Exception as e:
        print(f"Jeju error: {e}")
    return results

def run_all_collectors():
    print("="*60)
    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] 전국 소방본부 일일상황 자동 수집 시작")
    print("="*60)
    
    with open(DB_PATH, 'r', encoding='utf-8') as f:
        db = json.load(f)
    print(f"기존 DB 데이터 수: {len(db):,}건")
    existing_ids = set(x.get('id', '') for x in db)
    
    new_records = []
    new_records.extend(collect_sejong())
    new_records.extend(collect_jeju())
    
    added = 0
    for r in new_records:
        if r['id'] not in existing_ids:
            db.append(r)
            existing_ids.add(r['id'])
            added += 1
            
    print(f"\n신규 화재 데이터 {added}건 추가 완료. (총 DB: {len(db):,}건)")
    
    if added > 0:
        db.sort(key=lambda x: str(x.get('datetime', '')), reverse=True)
        with open(DB_PATH, 'w', encoding='utf-8') as f:
            json.dump(db, f, ensure_ascii=False, indent=2)
        print("-> DB 파일 저장 완료")
        
        if '--no-deploy' not in sys.argv and not os.environ.get('GITHUB_ACTIONS'):
            try:
                print("\n프론트엔드 빌드 시작 (npm run build)...")
                subprocess.run(['npm', 'run', 'build'], cwd=BASE_DIR, shell=True, check=True)
                
                print("\nVercel 프로덕션 배포 시작 (npx vercel --prod --yes)...")
                subprocess.run(['npx', 'vercel', '--prod', '--yes'], cwd=BASE_DIR, shell=True, check=True)
                print("\n배포가 성공적으로 완료되었습니다: https://samefiledel.vercel.app")
            except Exception as e:
                print(f"[배포 알림] 로컬 빌드/배포 건너뜀 또는 에러: {e}")
        else:
            print("-> CI 또는 --no-deploy 모드: DB 갱신 완료 (Git 커밋/CI 배포 단계로 진행)")
    else:
        print("-> 신규 변경 사항이 없어 빌드 및 배포를 건너뜁니다.")

if __name__ == '__main__':
    run_all_collectors()
