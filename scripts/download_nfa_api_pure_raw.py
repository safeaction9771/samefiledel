import os
import sys
import json
import time
import datetime
import urllib.request
import concurrent.futures
import pandas as pd

API_KEY = '914e4f955580b7da5d5162e769b0f0cd9271bf35caa8772287acae4e9dd900a3'
BASE_URL = 'https://apis.data.go.kr/1661000/FireInformationService/getOcBysidoFireSmrzPcnd'

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'data_export')
os.makedirs(OUTPUT_DIR, exist_ok=True)

def generate_date_range(start_date_str, end_date_str):
    start = datetime.datetime.strptime(start_date_str, '%Y%m%d').date()
    end = datetime.datetime.strptime(end_date_str, '%Y%m%d').date()
    delta = (end - start).days
    return [(start + datetime.timedelta(days=i)).strftime('%Y%m%d') for i in range(delta + 1)]

def fetch_single_date(date_str):
    url = f"{BASE_URL}?serviceKey={API_KEY}&pageNo=1&numOfRows=30&ocrn_ymd={date_str}&resultType=json"
    
    for attempt in range(5):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
            with urllib.request.urlopen(req, timeout=12) as response:
                content = response.read().decode('utf-8')
                data = json.loads(content)
                header = data.get('header', {})
                if header.get('resultCode') == '00':
                    items = data.get('body', {}).get('items', [])
                    return date_str, items if items else []
                elif header.get('resultCode') == '10':
                    return date_str, []
        except Exception as e:
            time.sleep(0.4 * (attempt + 1))
            
    return date_str, []

def main():
    # 2017-01-01 (소방청 OpenAPI 전자 집계 개시일) ~ 2026-09-22 (현재 최신일)
    start_date = '20170101'
    end_date = '20260922'
    
    date_list = generate_date_range(start_date, end_date)
    total_dates = len(date_list)
    print(f"[*] 공공데이터포털 소방청 OpenAPI 100% 무가공 원본 수집 시작")
    print(f"    - 대상 API: 소방청_화재정보서비스 (getOcBysidoFireSmrzPcnd)")
    print(f"    - 수집 기간: {start_date} ~ {end_date} (총 {total_dates}일)")
    print(f"    - 동시 작업자 수: 6개 스레드 (안정적 전송 대역폭 유지)")
    
    all_raw_items = []
    success_days = 0
    empty_days = 0
    start_time = time.time()
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as executor:
        futures = {executor.submit(fetch_single_date, d): d for d in date_list}
        done_count = 0
        
        for future in concurrent.futures.as_completed(futures):
            date_str, items = future.result()
            done_count += 1
            if items:
                all_raw_items.extend(items)
                success_days += 1
            else:
                empty_days += 1
                
            if done_count % 200 == 0 or done_count == total_dates:
                elapsed = time.time() - start_time
                percent = (done_count / total_dates) * 100
                print(f"    [수집 진행] {done_count}/{total_dates}일 ({percent:.1f}%) | 수집 레코드: {len(all_raw_items):,}건 | 유효일수: {success_days}일 | 경과: {elapsed:.1f}초")

    # 발생일자 및 시도명 기준 정렬
    all_raw_items.sort(key=lambda x: (str(x.get('OCRN_YMD', '')), str(x.get('SIDO_NM', ''))))
    
    total_records = len(all_raw_items)
    print(f"\n[+] 수집 완료: 총 {total_records:,}건 원본 레코드 확보 (데이터 유효일: {success_days}일, 미제공일: {empty_days}일)")
    
    # 1. JSON 파일 저장
    json_path = os.path.join(OUTPUT_DIR, '소방청_화재발생_OpenAPI_100%_순수_원본전체.json')
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump({
            "api_name": "소방청 화재정보서비스 (시도별 화재발생현황 조회)",
            "api_endpoint": BASE_URL,
            "provider": "대한민국 소방청 / 공공데이터포털(data.go.kr)",
            "collection_timestamp": datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            "date_range": f"{start_date} ~ {end_date}",
            "total_records": total_records,
            "valid_days_count": success_days,
            "field_descriptions": {
                "OCRN_YMD": "발생일자 (YYYYMMDD)",
                "SIDO_NM": "시도명 (전국 17개 광역시도)",
                "FIRE_RCPT_MNB": "화재 119 접수 건수",
                "FIRE_PROG_MNB": "화재 진화 진행 건수",
                "STN_END_MNB": "화재 진화 상황 종료(완진) 건수",
                "SLF_EXTSH_MNB": "자체 진화 완료 건수",
                "FLSRP_PRCS_MNB": "오인 출동 처리 건수",
                "FALS_DCLR_MNB": "허위 신고 출동 건수"
            },
            "raw_data": all_raw_items
        }, f, ensure_ascii=False, indent=2)
    print(f"    [저장 1] JSON 파일 완료: {json_path}")
    
    # 2. DataFrame 변환 및 순수 CSV 저장
    df = pd.DataFrame(all_raw_items)
    column_order = ['OCRN_YMD', 'SIDO_NM', 'FIRE_RCPT_MNB', 'FIRE_PROG_MNB', 'STN_END_MNB', 'SLF_EXTSH_MNB', 'FLSRP_PRCS_MNB', 'FALS_DCLR_MNB']
    for col in column_order:
        if col not in df.columns:
            df[col] = None
    df = df[column_order]
    
    csv_path = os.path.join(OUTPUT_DIR, '소방청_화재발생_OpenAPI_100%_순수_원본전체.csv')
    df.to_csv(csv_path, index=False, encoding='utf-8-sig')
    print(f"    [저장 2] CSV 파일 완료: {csv_path}")
    
    # 3. Excel 파일 저장
    xlsx_path = os.path.join(OUTPUT_DIR, '소방청_화재발생_OpenAPI_100%_순수_원본전체.xlsx')
    with pd.ExcelWriter(xlsx_path, engine='openpyxl') as writer:
        df.to_excel(writer, sheet_name='OpenAPI_순수원본_영문필드', index=False)
        
        df_kor = df.copy()
        df_kor.columns = [
            '발생일자(OCRN_YMD)', '시도명(SIDO_NM)', '화재접수건수(FIRE_RCPT_MNB)',
            '화재진행건수(FIRE_PROG_MNB)', '상황종료건수(STN_END_MNB)', '자체진화건수(SLF_EXTSH_MNB)',
            '오인출동처리건수(FLSRP_PRCS_MNB)', '허위신고건수(FALS_DCLR_MNB)'
        ]
        df_kor.to_excel(writer, sheet_name='OpenAPI_순수원본_한글필드', index=False)
        
        desc_df = pd.DataFrame([
            {"항목명": "제공기관", "내용": "대한민국 소방청 (공공데이터포털 apis.data.go.kr)"},
            {"항목명": "서비스명", "내용": "소방청 화재정보서비스 (FireInformationService)"},
            {"항목명": "오퍼레이션명", "내용": "시도별 화재발생현황 조회 (getOcBysidoFireSmrzPcnd)"},
            {"항목명": "데이터 성격", "내용": "100% 무가공 공공데이터포털 원본 (가상/모의 데이터 0%)"},
            {"항목명": "수집 기간", "내용": f"{start_date} ~ {end_date} (총 {total_dates}일)"},
            {"항목명": "총 레코드 수", "내용": f"{total_records:,}건"},
            {"항목명": "OCRN_YMD", "내용": "발생일자 (형식: YYYYMMDD)"},
            {"항목명": "SIDO_NM", "내용": "전국 17개 광역시도 명칭"},
            {"항목명": "FIRE_RCPT_MNB", "내용": "화재 119 접수 건수"},
            {"항목명": "FIRE_PROG_MNB", "내용": "화재 진화 진행 건수"},
            {"항목명": "STN_END_MNB", "내용": "화재 진화 상황 종료(완진) 건수"},
            {"항목명": "SLF_EXTSH_MNB", "내용": "자체 진화 완료 건수"},
            {"항목명": "FLSRP_PRCS_MNB", "내용": "오인 출동 처리 건수"},
            {"항목명": "FALS_DCLR_MNB", "내용": "허위 신고 출동 건수"}
        ])
        desc_df.to_excel(writer, sheet_name='API_데이터_안내', index=False)
        
    print(f"    [저장 3] Excel 파일 완료: {xlsx_path}")
    print("\n[SUCCESS] 모든 원본 파일 저장이 성공적으로 완료되었습니다.")

if __name__ == '__main__':
    main()
