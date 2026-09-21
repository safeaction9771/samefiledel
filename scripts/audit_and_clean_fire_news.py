# -*- coding: utf-8 -*-
import json
import re

def is_genuine_fire_news(title):
    # 1. 절대적 화재/소방 직접 키워드
    strict_fire_keywords = [
        '화재', '산불', '불길', '전소', '화마', '소방차', '소방관', '소방서', '소방대', '119출동', 
        '방화범', '불 탄', '불탄', '타올라', '타오른', '잔불', '발화', '소방당국', '소방본부'
    ]
    
    # 2. 복합 조건 (진화, 폭발, 불 등이 실제 화재 문맥과 결합된 경우)
    context_combos = [
        r'진화\s*(작업|헬기|완료|인력|작전|총력|율)',
        r'(불|불길|화마|산불|공장|건물|주택|아파트|차량|산|숲)\s*(을|를|이|가)?\s*진화',
        r'(가스|배터리|공장|충전기|보일러|변압기|유증기|폭죽|탱크|전기차)\s*(폭발|발화)',
        r'폭발\s*(사고|화재|음|으로|붕괴)',
        r'불이?\s*(나|붙어|번져|치솟|났|꺼졌|꺼진)'
    ]
    
    has_strict = any(k in title for k in strict_fire_keywords)
    has_combo = any(re.search(p, title) for p in context_combos)
    
    if not (has_strict or has_combo):
        return False, "화재/소방 직접 키워드 부재"
        
    # 3. 비화재/은유적/정치/시사/비유 배제 단어들
    exclude_patterns = [
        r'누리호.*진화', r'AI.*진화', r'기술.*진화', r'진화(하는|론|과정)',
        r'(분통|분노|불만|갈등|논란|사태|청와대|정부|여야|대통령실|트럼프).*(진화|폭발)',
        r'(인기|예능|드라마|주가|매출|수출|성장|반도체).*(폭발)',
        r'불순물', r'불법', r'불안', r'불출마', r'불통', r'불닭', r'불장난', r'마인크래프트', r'게임',
        r'파병', r'선거', r'총선', r'국회', r'의원', r'탄핵', r'검찰', r'특검', r'빚 갚아드려요'
    ]
    
    for ep in exclude_patterns:
        if re.search(ep, title):
            return False, f"은유/비화재 패턴 감지 ({ep})"
            
    return True, "정상 화재 뉴스"

with open('src/data/youtube_fire_news.json', 'r', encoding='utf-8') as f:
    items = json.load(f)

valid_items = []
excluded_items = []

for item in items:
    title = item.get('title', '')
    is_valid, reason = is_genuine_fire_news(title)
    if is_valid:
        valid_items.append(item)
    else:
        excluded_items.append((title, reason))

print(f"전체 뉴스: {len(items)}건 -> 유효 화재 뉴스: {len(valid_items)}건 (자동 제외: {len(excluded_items)}건)")

with open('src/data/youtube_fire_news.json', 'w', encoding='utf-8') as f:
    json.dump(valid_items, f, ensure_ascii=False, indent=2)

print("[+] youtube_fire_news.json 영구 정제 완료!")
