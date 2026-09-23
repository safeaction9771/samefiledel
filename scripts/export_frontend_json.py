import sqlite3
import json
import os

db_path = 'data_export/nfa_fire_raw_2007_2026.db'
conn = sqlite3.connect(db_path)
conn.row_factory = sqlite3.Row
cursor = conn.cursor()

data_dir = 'src/data'
os.makedirs(data_dir, exist_ok=True)

# 1. National Summary (전국 일별 종합 7,205행)
cursor.execute('SELECT * FROM national_summary ORDER BY ocrn_ymd DESC')
rows = [dict(r) for r in cursor.fetchall()]
with open(os.path.join(data_dir, 'nfa_national_daily.json'), 'w', encoding='utf-8') as f:
    json.dump(rows, f, ensure_ascii=False)
print(f'1. nfa_national_daily.json: {len(rows):,} rows')

# 2. Sido Daily Fire (시도별 일별 화재 및 인명피해 - 2024~2026 최근 일자 전체)
cursor.execute("SELECT * FROM sido_fire WHERE ocrn_ymd >= '20240101' ORDER BY ocrn_ymd DESC, sido_nm ASC")
rows_sido = [dict(r) for r in cursor.fetchall()]
with open(os.path.join(data_dir, 'nfa_sido_daily_recent.json'), 'w', encoding='utf-8') as f:
    json.dump(rows_sido, f, ensure_ascii=False)
print(f'2. nfa_sido_daily_recent.json: {len(rows_sido):,} rows')

# 3. Sido Reception Status (시도별 접수/진행/완료/오인/허위 60,709행 전수)
cursor.execute('SELECT * FROM sido_reception ORDER BY ocrn_ymd DESC, sido_nm ASC')
rows_rec = [dict(r) for r in cursor.fetchall()]
with open(os.path.join(data_dir, 'nfa_sido_reception.json'), 'w', encoding='utf-8') as f:
    json.dump(rows_rec, f, ensure_ascii=False)
print(f'3. nfa_sido_reception.json: {len(rows_rec):,} rows')

# 4. Ignition Factor Summary (발화요인별 통계)
cursor.execute('''
    SELECT igntn_fctr_lcls_nm, igntn_fctr_sclsf_nm,
           SUM(ocrn_mnb) as total_fires,
           SUM(vctm_percnt) as total_deaths,
           SUM(injrdpr_percnt) as total_injured,
           SUM(life_dmg_percnt) as total_casualties,
           SUM(prpt_dmg_sbtt_amt) as total_damage
    FROM ignition_factor
    GROUP BY igntn_fctr_lcls_nm, igntn_fctr_sclsf_nm
    ORDER BY total_fires DESC
''')
rows_ign = [dict(r) for r in cursor.fetchall()]
with open(os.path.join(data_dir, 'nfa_ignition_summary.json'), 'w', encoding='utf-8') as f:
    json.dump(rows_ign, f, ensure_ascii=False)
print(f'4. nfa_ignition_summary.json: {len(rows_ign):,} rows')

# 5. Building Structure Summary (건물구조별 통계)
cursor.execute('''
    SELECT bldcns_nm,
           SUM(ocrn_mnb) as total_fires,
           SUM(vctm_percnt) as total_deaths,
           SUM(injrdpr_percnt) as total_injured,
           SUM(life_dmg_percnt) as total_casualties,
           SUM(prpt_dmg_sbtt_amt) as total_damage
    FROM building_structure
    GROUP BY bldcns_nm
    ORDER BY total_fires DESC
''')
rows_bld = [dict(r) for r in cursor.fetchall()]
with open(os.path.join(data_dir, 'nfa_building_summary.json'), 'w', encoding='utf-8') as f:
    json.dump(rows_bld, f, ensure_ascii=False)
print(f'5. nfa_building_summary.json: {len(rows_bld):,} rows')

# 6. Yearly Trend (2007~2026 연도별 추이)
cursor.execute('''
    SELECT substr(ocrn_ymd, 1, 4) as year,
           SUM(ocrn_mnb) as total_fires,
           SUM(vctm_percnt) as total_deaths,
           SUM(injrdpr_percnt) as total_injured,
           SUM(life_dmg_percnt) as total_casualties,
           SUM(prpt_dmg_sbtt_amt) as total_damage
    FROM national_summary
    GROUP BY substr(ocrn_ymd, 1, 4)
    ORDER BY year DESC
''')
rows_yr = [dict(r) for r in cursor.fetchall()]
with open(os.path.join(data_dir, 'nfa_yearly_trend.json'), 'w', encoding='utf-8') as f:
    json.dump(rows_yr, f, ensure_ascii=False)
print(f'6. nfa_yearly_trend.json: {len(rows_yr):,} rows')
