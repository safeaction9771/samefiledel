import pandas as pd
import json
import re

csv_path = "소방청_화재발생 정보_20241231.csv"
print("Reading CSV...")
df = pd.read_csv(csv_path, encoding="cp949", low_memory=False)
df.columns = [c.strip() for c in df.columns]

with open("src/data/officialIncidents.js", "r", encoding="utf-8") as f:
    js_text = f.read()

sido_centers = {
    '서울': {'lat': 37.5665, 'lng': 126.9780, 'fullName': '서울특별시'},
    '부산': {'lat': 35.1796, 'lng': 129.0756, 'fullName': '부산광역시'},
    '대구': {'lat': 35.8714, 'lng': 128.6014, 'fullName': '대구광역시'},
    '인천': {'lat': 37.4563, 'lng': 126.7052, 'fullName': '인천광역시'},
    '광주': {'lat': 35.1595, 'lng': 126.8526, 'fullName': '광주광역시'},
    '대전': {'lat': 36.3504, 'lng': 127.3845, 'fullName': '대전광역시'},
    '울산': {'lat': 35.5384, 'lng': 129.3114, 'fullName': '울산광역시'},
    '세종': {'lat': 36.4800, 'lng': 127.2890, 'fullName': '세종특별자치시'},
    '경기': {'lat': 37.2636, 'lng': 127.0286, 'fullName': '경기도'},
    '강원': {'lat': 37.8854, 'lng': 127.7298, 'fullName': '강원특별자치도'},
    '충북': {'lat': 36.6357, 'lng': 127.4912, 'fullName': '충청북도'},
    '충남': {'lat': 36.5184, 'lng': 126.8000, 'fullName': '충청남도'},
    '전북': {'lat': 35.8242, 'lng': 127.1480, 'fullName': '전북특별자치도'},
    '전남': {'lat': 34.8161, 'lng': 126.4629, 'fullName': '전라남도'},
    '경북': {'lat': 36.5760, 'lng': 128.5056, 'fullName': '경상북도'},
    '경남': {'lat': 35.2383, 'lng': 128.6922, 'fullName': '경상남도'},
    '제주': {'lat': 33.4996, 'lng': 126.5312, 'fullName': '제주특별자치도'}
}

def normalize_sido(name):
    if not name or pd.isna(name): return '서울'
    s = str(name).strip()
    for short, info in sido_centers.items():
        if short in s or info['fullName'] in s:
            return short
    return s[:2]

mun_pattern = re.findall(r"{\s*name:\s*'([^']+)',\s*station:\s*'([^']+)',\s*lat:\s*([0-9.]+),\s*lng:\s*([0-9.]+)\s*}", js_text)
mun_dict = {}
for name, station, lat, lng in mun_pattern:
    clean_name = name.split()[0].strip()
    mun_dict[clean_name] = {'name': name, 'station': station, 'lat': float(lat), 'lng': float(lng)}
    mun_dict[name] = {'name': name, 'station': station, 'lat': float(lat), 'lng': float(lng)}

# Parse datetime
df['dt'] = pd.to_datetime(df['화재발생년원일'], errors='coerce')
df = df.dropna(subset=['dt'])
df = df.sort_values(by='dt', ascending=False).reset_index(drop=True)

# Select 5,000 cases:
# 1. All death cases
fatal_cases = df[df['사망'] > 0]
# 2. Major injury cases
injury_cases = df[(df['사망'] == 0) & (df['부상'] >= 2)]
# 3. High property damage cases (> 5억원)
large_dmg = df[df['재산피해소계'] >= 500000]
# 4. Recent 2024 diverse cases across all regions
recent_2024 = df[df['dt'] >= '2024-01-01'].iloc[::15]
# 5. Background temporal sample
bg_sample = df.iloc[::60]

combined = pd.concat([fatal_cases, injury_cases, large_dmg, recent_2024, bg_sample])
selected_df = combined.drop_duplicates(subset=['화재발생년원일', '시도', '시군구', '발화요인소분류']).sort_values(by='dt', ascending=False).head(5000).reset_index(drop=True)

print(f"Final selected {len(selected_df):,} incidents.")

incidents_list = []
for idx, row in selected_df.iterrows():
    sido_short = normalize_sido(row['시도'])
    sido_info = sido_centers.get(sido_short, sido_centers['서울'])
    sido_full = sido_info['fullName']
    sigungu = str(row['시군구']).strip() if pd.notna(row['시군구']) else ''
    
    coord = None
    if sigungu in mun_dict:
        coord = mun_dict[sigungu]
    else:
        for k, v in mun_dict.items():
            if k in sigungu or sigungu in k:
                coord = v
                break
    
    if not coord:
        coord = {'lat': sido_info['lat'], 'lng': sido_info['lng'], 'station': f"{sido_full}소방본부"}

    dt_str = row['dt'].strftime('%Y-%m-%d %H:%M')
    date_str = row['dt'].strftime('%Y-%m-%d')
    time_str = row['dt'].strftime('%H:%M')
    
    deaths = int(row['사망']) if pd.notna(row['사망']) else 0
    injuries = int(row['부상']) if pd.notna(row['부상']) else 0
    casualties = int(row['인명피해(명)소계']) if pd.notna(row['인명피해(명)소계']) else 0
    dmg_thousand = float(row['재산피해소계']) if pd.notna(row['재산피해소계']) else 0
    
    dmg_text = f"{dmg_thousand:,.0f}천원"
    if dmg_thousand >= 100000:
        dmg_text = f"약 {dmg_thousand/100000:,.1f}억원"
    elif dmg_thousand >= 10000:
        dmg_text = f"약 {dmg_thousand/10000:,.1f}천만원"
    elif dmg_thousand >= 10:
        dmg_text = f"약 {dmg_thousand/10:,.0f}만원"

    fire_type = str(row['화재유형']) if pd.notna(row['화재유형']) else '건축,구조물'
    cause_main = str(row['발화요인대분류']) if pd.notna(row['발화요인대분류']) else '원인미상'
    cause_sub = str(row['발화요인소분류']) if pd.notna(row['발화요인소분류']) else ''
    place_main = str(row['장소대분류']) if pd.notna(row['장소대분류']) else '기타'
    place_mid = str(row['장소중분류']) if pd.notna(row['장소중분류']) else ''
    place_sub = str(row['장소소분류']) if pd.notna(row['장소소분류']) else ''

    place_full = f"{place_main}"
    if place_mid and place_mid != place_main: place_full += f" > {place_mid}"
    if place_sub and place_sub != place_mid: place_full += f" ({place_sub})"

    location_str = f"{sido_full} {sigungu}".strip()
    title_str = f"[소방청] {sido_short} {sigungu} {place_mid or place_main} 화재 ({cause_main})"

    incidents_list.append({
        'id': f"NFA-CSV-{row['dt'].strftime('%Y%m%d%H%M')}-{idx}",
        'occurId': f"NFA-CSV-{row['dt'].strftime('%Y%m%d%H%M')}-{idx}",
        'occurDate': date_str,
        'occurTime': time_str,
        'datetime': dt_str,
        'region': sido_short,
        'sidoName': sido_full,
        'sigungu': sigungu,
        'occurPlace': f"{location_str} {place_sub or place_mid}".strip(),
        'location': location_str,
        'title': title_str,
        'placeCategory': place_full,
        'fireType': fire_type,
        'fireCause': f"{cause_main} ({cause_sub})" if cause_sub else cause_main,
        'cause': cause_main,
        'causeSub': cause_sub,
        'fireCount': 1,
        'deathCount': deaths,
        'injuryCount': injuries,
        'casualtyCount': casualties,
        'casualtyText': f"사망 {deaths}명 / 부상 {injuries}명 (총 {casualties}명)" if casualties > 0 else '인명피해 0명',
        'damageAmount': dmg_text,
        'damageThousand': dmg_thousand,
        'jurisStation': coord.get('station', f"{sigungu}소방서" if sigungu else f"{sido_full}소방본부"),
        'lat': coord['lat'],
        'lng': coord['lng'],
        'status': 'EXTINGUISHED',
        'statusText': '소방청 진화완료',
        'isVerified': True,
        'source': '공공데이터포털 소방청_화재발생 정보 공식 CSV 원본 (15044003)',
        'description': f"{dt_str} {location_str} {place_full}에서 {fire_type} 화재 발생. 발화원인: {cause_main}({cause_sub}). 피해규모: 재산피해 {dmg_text}, 인명피해 사망 {deaths}명/부상 {injuries}명."
    })

with open("src/data/nfa_csv_incidents.json", "w", encoding="utf-8") as f:
    json.dump(incidents_list, f, ensure_ascii=False)

import os
print(f"Generated src/data/nfa_csv_incidents.json ({os.path.getsize('src/data/nfa_csv_incidents.json'):,} bytes)")
