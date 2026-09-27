import pandas as pd
import json
import os

csv_path = "소방청_화재발생 정보_20241231.csv"
print("Reading CSV...")
df = pd.read_csv(csv_path, encoding="cp949", low_memory=False)

# Clean column names
df.columns = [c.strip() for c in df.columns]
print("Columns:", list(df.columns))

# Parse datetime
# Format: '2020-01-01 0:03'
df['datetime'] = pd.to_datetime(df['화재발생년원일'], errors='coerce')
df['year'] = df['datetime'].dt.year
df['month'] = df['datetime'].dt.month
df['year_month'] = df['datetime'].dt.strftime('%Y-%m')

# Ensure numeric columns
df['인명피해(명)소계'] = pd.to_numeric(df['인명피해(명)소계'], errors='coerce').fillna(0).astype(int)
df['사망'] = pd.to_numeric(df['사망'], errors='coerce').fillna(0).astype(int)
df['부상'] = pd.to_numeric(df['부상'], errors='coerce').fillna(0).astype(int)
df['재산피해소계'] = pd.to_numeric(df['재산피해소계'], errors='coerce').fillna(0) # in 1,000 KRW
df['부동산'] = pd.to_numeric(df['부동산'], errors='coerce').fillna(0)
df['동산'] = pd.to_numeric(df['동산'], errors='coerce').fillna(0)

print(f"Total Rows: {len(df):,}")
print(f"Total Deaths: {df['사망'].sum():,}")
print(f"Total Injured: {df['부상'].sum():,}")
print(f"Total Casualties: {df['인명피해(명)소계'].sum():,}")
print(f"Total Property Damage (천원): {df['재산피해소계'].sum():,}")
print(f"Total Property Damage (억원): {df['재산피해소계'].sum() / 100000:,.1f}억원")

# Yearly summary
yearly_stats = {}
for y, group in df.groupby('year'):
    if pd.isna(y): continue
    y_int = int(y)
    yearly_stats[str(y_int)] = {
        'year': y_int,
        'count': int(len(group)),
        'deaths': int(group['사망'].sum()),
        'injured': int(group['부상'].sum()),
        'casualties': int(group['인명피해(명)소계'].sum()),
        'damage_thousand_krw': float(group['재산피해소계'].sum()),
        'damage_eok_krw': round(float(group['재산피해소계'].sum()) / 100000, 1),
        'sido_counts': {k: int(v) for k, v in group['시도'].value_counts().items()},
        'cause_counts': {k: int(v) for k, v in group['발화요인대분류'].value_counts().items()},
        'place_counts': {k: int(v) for k, v in group['장소대분류'].value_counts().items()}
    }

print("\nYearly Breakdown:")
for y, s in yearly_stats.items():
    print(f"  {y}년: {s['count']:,}건, 사망 {s['deaths']}명, 부상 {s['injured']}명, 재산피해 {s['damage_eok_krw']:,}억원")

# Save detailed statistics JSON for StatsDashboard and RegionalAnalysis
stats_payload = {
    'dataset_name': '소방청_화재발생 정보 (2020~2024)',
    'total_count': len(df),
    'date_range': {'start': '2020-01-01', 'end': '2024-12-31'},
    'total_deaths': int(df['사망'].sum()),
    'total_injured': int(df['부상'].sum()),
    'total_casualties': int(df['인명피해(명)소계'].sum()),
    'total_damage_eok': round(float(df['재산피해소계'].sum()) / 100000, 1),
    'yearly': yearly_stats,
    'by_sido': {},
    'by_cause': {k: int(v) for k, v in df['발화요인대분류'].value_counts().items()},
    'by_cause_sub': {k: int(v) for k, v in df['발화요인소분류'].value_counts().head(20).items()},
    'by_place': {k: int(v) for k, v in df['장소대분류'].value_counts().items()},
    'by_place_mid': {k: int(v) for k, v in df['장소중분류'].value_counts().head(20).items()},
    'by_fire_type': {k: int(v) for k, v in df['화재유형'].value_counts().items()},
    'deaths_by_place': {},
    'monthly_trend': {k: int(v) for k, v in df['year_month'].value_counts().sort_index().items()}
}

# SIDO stats with top causes and casualty breakdown
for sido, group in df.groupby('시도'):
    top_cause = group['발화요인대분류'].value_counts().index[0] if len(group) > 0 else '부주의'
    top_cause_sub = group['발화요인소분류'].value_counts().index[0] if len(group) > 0 else ''
    stats_payload['by_sido'][sido] = {
        'sido': sido,
        'count': int(len(group)),
        'deaths': int(group['사망'].sum()),
        'injured': int(group['부상'].sum()),
        'casualties': int(group['인명피해(명)소계'].sum()),
        'damage_eok': round(float(group['재산피해소계'].sum()) / 100000, 1),
        'top_cause': f"{top_cause} ({top_cause_sub})",
        'ratio': round((len(group) / len(df)) * 100, 1),
        'muni_counts': {k: int(v) for k, v in group['시군구'].value_counts().head(15).items()}
    }

# Deaths by place category
place_deaths = df.groupby('장소대분류')['사망'].sum().sort_values(ascending=False)
total_deaths = df['사망'].sum()
for p, d in place_deaths.items():
    stats_payload['deaths_by_place'][p] = {
        'deaths': int(d),
        'ratio': round((d / total_deaths) * 100, 1) if total_deaths > 0 else 0
    }

with open("src/data/nfa_csv_stats.json", "w", encoding="utf-8") as f:
    json.dump(stats_payload, f, ensure_ascii=False, indent=2)

print("\nSaved src/data/nfa_csv_stats.json successfully!")
