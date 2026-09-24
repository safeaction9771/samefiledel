import os
import sys
import json
import time
import datetime
import urllib.request
import sqlite3

API_KEY = '914e4f955580b7da5d5162e769b0f0cd9271bf35caa8772287acae4e9dd900a3'
BASE_URL = 'https://apis.data.go.kr/1661000/FireInformationService'

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(ROOT_DIR, 'src', 'data')
EXPORT_DIR = os.path.join(ROOT_DIR, 'data_export')
os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(EXPORT_DIR, exist_ok=True)

DB_PATH = os.path.join(EXPORT_DIR, 'nfa_fire_raw_2007_2026.db')

def fetch_api(op_name, date_str, num_rows=200):
    url = f"{BASE_URL}/{op_name}?serviceKey={API_KEY}&pageNo=1&numOfRows={num_rows}&ocrn_ymd={date_str}&resultType=json"
    for attempt in range(3):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
            with urllib.request.urlopen(req, timeout=10) as resp:
                data = json.loads(resp.read().decode('utf-8'))
                if data.get('header', {}).get('resultCode') == '00':
                    return data.get('body', {}).get('items') or []
                return []
        except Exception:
            time.sleep(0.3)
    return []

def main():
    print("=== 소방청 화재정보 OpenAPI 일일 자동 동기화 시작 ===")
    
    # 최근 14일간의 최신 소방청 데이터 동기화 (소방서 현장 조사 완료 후 등재되는 최신 데이터 반영)
    today = datetime.date.today()
    dates_to_check = [(today - datetime.timedelta(days=i)).strftime('%Y%m%d') for i in range(14)]
    
    conn = sqlite3.connect(DB_PATH) if os.path.exists(DB_PATH) else None
    cursor = conn.cursor() if conn else None
    
    updated_count = 0
    for date_str in dates_to_check:
        print(f"[*] 일자 {date_str} 소방청 OpenAPI 데이터 확인 중...")
        
        # 1. National
        life_items = fetch_api('getOcFirePcnd', date_str, 10)
        prop_items = fetch_api('getOcFirePrcnd', date_str, 10)
        
        # 2. Sido Fire
        sido_items = fetch_api('getOcBysidoFpcnd', date_str, 50)
        
        # 3. Reception
        rec_items = fetch_api('getOcBysidoFireSmrzPcnd', date_str, 50)
        
        if conn and cursor and sido_items:
            # National insert/update
            life_item = life_items[0] if life_items else {}
            prop_item = prop_items[0] if prop_items else {}
            mnb = life_item.get('OCRN_MNB') or prop_item.get('OCRN_MNB') or 0
            vctm = life_item.get('VCTM_PERCNT', 0)
            injrd = life_item.get('INJRDPR_PERCNT', 0)
            life_total = life_item.get('LIFE_DMG_PERCNT', 0)
            perp_dmg = prop_item.get('PERP_DMG_AMT', 0)
            rest_dmg = prop_item.get('REST_DMG_AMT', 0)
            prpt_total = prop_item.get('PRPT_DMG_SBTT_AMT', 0)
            
            cursor.execute('''
            INSERT OR REPLACE INTO national_summary 
            (ocrn_ymd, ocrn_mnb, vctm_percnt, injrdpr_percnt, life_dmg_percnt, perp_dmg_amt, rest_dmg_amt, prpt_dmg_sbtt_amt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (date_str, mnb, vctm, injrd, life_total, perp_dmg, rest_dmg, prpt_total))
            
            cursor.execute('DELETE FROM sido_fire WHERE ocrn_ymd = ?', (date_str,))
            for r in sido_items:
                cursor.execute('''
                INSERT INTO sido_fire (ocrn_ymd, sido_nm, ocrn_mnb, vctm_percnt, injrdpr_percnt, life_dmg_percnt)
                VALUES (?, ?, ?, ?, ?, ?)
                ''', (date_str, r.get('SIDO_NM'), r.get('OCRN_MNB', 0), r.get('VCTM_PERCNT', 0), r.get('INJRDPR_PERCNT', 0), r.get('LIFE_DMG_PERCNT', 0)))
                
            cursor.execute('DELETE FROM sido_reception WHERE ocrn_ymd = ?', (date_str,))
            for r in rec_items:
                cursor.execute('''
                INSERT INTO sido_reception (ocrn_ymd, sido_nm, fire_rcpt_mnb, fire_prog_mnb, stn_end_mnb, slf_extsh_mnb, flsrp_prcs_mnb, fals_dclr_mnb)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ''', (date_str, r.get('SIDO_NM'), r.get('FIRE_RCPT_MNB', 0), r.get('FIRE_PROG_MNB', 0), r.get('STN_END_MNB', 0), r.get('SLF_EXTSH_MNB', 0), r.get('FLSRP_PRCS_MNB', 0), r.get('FALS_DCLR_MNB', 0)))
                
            cursor.execute('INSERT OR REPLACE INTO fetched_dates (ocrn_ymd) VALUES (?)', (date_str,))
            updated_count += 1
            
    if conn:
        conn.commit()
        conn.close()
        
    # Re-export JSON files for React frontend
    export_script = os.path.join(ROOT_DIR, 'scripts', 'export_frontend_json.py')
    if os.path.exists(export_script):
        os.system(f'python "{export_script}"')
        
    print(f"[+] 소방청 화재정보 OpenAPI 일일 동기화 완료! (갱신 일수: {updated_count}일)")

if __name__ == '__main__':
    main()
