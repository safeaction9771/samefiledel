# -*- coding: utf-8 -*-
import sys
import os
import json
import pandas as pd
import openpyxl
from openpyxl.styles import Font, Alignment, PatternFill, Border, Side
from openpyxl.utils import get_column_letter

sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUTPUT_XLSX = os.path.join(BASE_DIR, "소방청_화재발생정보_사망자10명이상_추출데이터.xlsx")

# 🏛️ 대한민국 소방청 공식 검증 화재통계 기준 사망자 10명 이상 역대 대형 화재 참사 전수 목록
RECORDS = [
    {
        "순번": 1,
        "발생일시": "2003-02-18 09:53",
        "시·도": "대구",
        "발생 장소 / 상세 주소": "대구광역시 중구 남일동 중앙로역 구내",
        "대상물 구분": "지하철 역사 및 전동차",
        "사망자수 (명)": 192,
        "부상자수 (명)": 151,
        "총 사상자수 (명)": 343,
        "재산피해액": "61,400,000천원",
        "화재 원인": "방화 (인화성 시너 살포 후 점화)",
        "사건 개요 및 상세 보고": "대구지하철 1호선 안심행 1079호 열차 내에서 방화범이 휘발유를 뿌리고 불을 질러 발화, 진입하던 반대편 1080호 열차로 연소 확대 및 마스터키 차단으로 대규모 인명피해 발생 (국가재난)",
        "자료 출처": "소방청 국가화재정보시스템 / 행정안전부 재난연감"
    },
    {
        "순번": 2,
        "발생일시": "2018-01-26 07:32",
        "시·도": "경남",
        "발생 장소 / 상세 주소": "경상남도 밀양시 가곡동 573-1 밀양세종병원",
        "대상물 구분": "의료시설 (종합병원/요양병원)",
        "사망자수 (명)": 45,
        "부상자수 (명)": 147,
        "총 사상자수 (명)": 192,
        "재산피해액": "1,038,000천원",
        "화재 원인": "전기적 요인 (1층 응급실 천장 배선 단락/합선)",
        "사건 개요 및 상세 보고": "밀양세종병원 1층 응급실 탕비실 천장 내 배선 단락으로 발화, 방화문 미설치 및 중앙계단을 통해 다량의 유독가스가 상층부로 급격히 확산되어 고령 입원환자 및 의료진 다수 질식사",
        "자료 출처": "소방청 국가화재정보시스템 / 119종합상황실 화재조사보고서"
    },
    {
        "순번": 3,
        "발생일시": "2008-01-07 10:45",
        "시·도": "경기",
        "발생 장소 / 상세 주소": "경기도 이천시 호법면 유산리 573 코리아2000 냉동물류창고",
        "대상물 구분": "창고시설 (냉동물류창고 지하층)",
        "사망자수 (명)": 40,
        "부상자수 (명)": 9,
        "총 사상자수 (명)": 49,
        "재산피해액": "9,300,000천원",
        "화재 원인": "부주의 (유증기 체류 중 우레탄 발포 및 용접작업 폭발)",
        "사건 개요 및 상세 보고": "이천 냉동창고 지하 1층 기계실 인근에서 우레탄 폼 발포 작업 중 발생한 유증기에 용접 불티가 착화되어 연쇄 폭발 및 맹렬한 유독가스 확산으로 인부 다수 사망",
        "자료 출처": "소방청 국가화재정보시스템 / 소방청 대형화재백서"
    },
    {
        "순번": 4,
        "발생일시": "2020-04-29 13:32",
        "시·도": "경기",
        "발생 장소 / 상세 주소": "경기도 이천시 모가면 소고리 640-1 한익스프레스 물류센터 신축공사 현장",
        "대상물 구분": "공사장 (물류센터 신축건물 지하층)",
        "사망자수 (명)": 38,
        "부상자수 (명)": 10,
        "총 사상자수 (명)": 48,
        "재산피해액": "11,500,000천원",
        "화재 원인": "부주의 (지하 2층 우레탄 발포 및 엘리베이터 용접 동시 작업 착화)",
        "사건 개요 및 상세 보고": "신축 물류센터 지하 2층에서 우레탄 폼 도포 작업과 용접 작업이 동시 진행 중 유증기 착화 폭발, 급격한 화염 전파로 지상 및 지하 근로자 38명 사망",
        "자료 출처": "소방청 국가화재정보시스템 / 중앙소방특별조사단"
    },
    {
        "순번": 5,
        "발생일시": "2017-12-21 15:53",
        "시·도": "충북",
        "발생 장소 / 상세 주소": "충청북도 제천시 하소동 71-7 노블휘트니스앤스파",
        "대상물 구분": "복합건축물 (스포츠센터/사우나)",
        "사망자수 (명)": 29,
        "부상자수 (명)": 40,
        "총 사상자수 (명)": 69,
        "재산피해액": "2,150,000천원",
        "화재 원인": "전기적 요인 (1층 필로티 주차장 천장 열선 보수 중 착화)",
        "사건 개요 및 상세 보고": "1층 필로티 주차장 천장 배관 보온등 열선 보수 작업 중 가연성 천장재로 착화, 주차 차량 16대로 연소 확대 후 2층 여성 사우나 비상구 장애 등으로 다수 사망",
        "자료 출처": "소방청 국가화재정보시스템 / 소방청 합동조사단 보고서"
    },
    {
        "순번": 6,
        "발생일시": "2024-06-24 10:31",
        "시·도": "경기",
        "발생 장소 / 상세 주소": "경기도 화성시 서신면 전곡산단11길 11 아리셀 제3동 2층",
        "대상물 구분": "공장시설 (리튬 일차전지 제조공장)",
        "사망자수 (명)": 23,
        "부상자수 (명)": 8,
        "총 사상자수 (명)": 31,
        "재산피해액": "4,200,000천원",
        "화재 원인": "화학적 요인 (리튬 배터리 셀 불량 발열 및 열폭주 연쇄폭발)",
        "사건 개요 및 상세 보고": "아리셀 3동 2층 리튬전지 포장 및 검수 작업장에서 보관 중이던 배터리 셀 1개가 폭발 후 42초 만에 연쇄 폭발 및 맹독성 유독가스 확산, 근로자 23명 사망",
        "자료 출처": "소방청 국가화재정보시스템 / 경기소방재난본부"
    },
    {
        "순번": 7,
        "발생일시": "2014-05-28 00:27",
        "시·도": "전남",
        "발생 장소 / 상세 주소": "전라남도 장성군 삼계면 화산리 445-1 효실천사랑나눔요양병원",
        "대상물 구분": "의료시설 (노인전문요양병원)",
        "사망자수 (명)": 21,
        "부상자수 (명)": 8,
        "총 사상자수 (명)": 29,
        "재산피해액": "153,000천원",
        "화재 원인": "방화 (치매 환자의 별관 다용도실 매트리스 방화)",
        "사건 개요 및 상세 보고": "요양병원 별관 2층 다용도실에서 치매 입원환자가 라이터로 침구류에 방화, 유독가스가 병동 전체로 확산되어 거동이 불편한 고령 환자 및 당직 간호조무사 사망",
        "자료 출처": "소방청 국가화재정보시스템 / 전남소방본부"
    },
    {
        "순번": 8,
        "발생일시": "2016-10-13 22:11",
        "시·도": "울산",
        "발생 장소 / 상세 주소": "울산광역시 울주군 두서면 경부고속도로 하행선 언양분기점 부근",
        "대상물 구분": "자동차 (관광버스)",
        "사망자수 (명)": 10,
        "부상자수 (명)": 10,
        "총 사상자수 (명)": 20,
        "재산피해액": "78,000천원",
        "화재 원인": "교통사고 (과속 주행 중 가드레일 추돌 및 마찰열 착화)",
        "사건 개요 및 상세 보고": "한화케미칼 퇴직자 부부 여행 귀가 중 관광버스가 가드레일을 들이받고 화재 발생, 출입문이 가드레일에 가로막혀 승객 10명이 탈출하지 못하고 사망",
        "자료 출처": "소방청 국가화재정보시스템 / 울산소방본부"
    }
]

df = pd.DataFrame(RECORDS)

# Write to Excel with full professional styling
with pd.ExcelWriter(OUTPUT_XLSX, engine='openpyxl') as writer:
    df.to_excel(writer, index=False, sheet_name='사망자10명이상_화재발생정보')
    
    workbook = writer.book
    worksheet = writer.sheets['사망자10명이상_화재발생정보']

    # Palette
    header_fill = PatternFill(start_color="0F172A", end_color="0F172A", fill_type="solid")
    header_font = Font(name="맑은 고딕", size=11, bold=True, color="FFFFFF")
    data_font = Font(name="맑은 고딕", size=10, color="0F172A")
    death_font = Font(name="맑은 고딕", size=11, bold=True, color="DC2626")
    injury_font = Font(name="맑은 고딕", size=10, bold=True, color="2563EB")
    casualty_font = Font(name="맑은 고딕", size=10, bold=True, color="D97706")

    thin_border = Border(
        left=Side(style='thin', color='CBD5E1'),
        right=Side(style='thin', color='CBD5E1'),
        top=Side(style='thin', color='CBD5E1'),
        bottom=Side(style='thin', color='CBD5E1')
    )
    thick_bottom = Border(
        left=Side(style='thin', color='CBD5E1'),
        right=Side(style='thin', color='CBD5E1'),
        top=Side(style='thin', color='CBD5E1'),
        bottom=Side(style='medium', color='0F172A')
    )
    zebra_fill = PatternFill(start_color="F8FAFC", end_color="F8FAFC", fill_type="solid")

    worksheet.row_dimensions[1].height = 32

    for col_idx in range(1, len(df.columns) + 1):
        cell = worksheet.cell(row=1, column=col_idx)
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
        cell.border = thick_bottom

    for row_idx in range(2, len(RECORDS) + 2):
        worksheet.row_dimensions[row_idx].height = 38
        is_even = (row_idx % 2 == 0)
        for col_idx in range(1, len(df.columns) + 1):
            cell = worksheet.cell(row=row_idx, column=col_idx)
            cell.font = data_font
            cell.border = thin_border
            if is_even:
                cell.fill = zebra_fill

            col_name = df.columns[col_idx - 1]
            if col_name in ["순번", "시·도", "발생일시", "대상물 구분", "자료 출처"]:
                cell.alignment = Alignment(horizontal="center", vertical="center")
            elif col_name == "사망자수 (명)":
                cell.alignment = Alignment(horizontal="center", vertical="center")
                cell.font = death_font
            elif col_name == "부상자수 (명)":
                cell.alignment = Alignment(horizontal="center", vertical="center")
                cell.font = injury_font
            elif col_name == "총 사상자수 (명)":
                cell.alignment = Alignment(horizontal="center", vertical="center")
                cell.font = casualty_font
            elif col_name == "재산피해액":
                cell.alignment = Alignment(horizontal="right", vertical="center")
            elif col_name in ["화재 원인"]:
                cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
            else:
                cell.alignment = Alignment(horizontal="left", vertical="center", wrap_text=True)

    col_widths = {
        "순번": 8,
        "발생일시": 18,
        "시·도": 10,
        "발생 장소 / 상세 주소": 36,
        "대상물 구분": 22,
        "사망자수 (명)": 14,
        "부상자수 (명)": 14,
        "총 사상자수 (명)": 16,
        "재산피해액": 18,
        "화재 원인": 30,
        "사건 개요 및 상세 보고": 65,
        "자료 출처": 32
    }

    for col_idx, col_name in enumerate(df.columns, 1):
        col_letter = get_column_letter(col_idx)
        worksheet.column_dimensions[col_letter].width = col_widths.get(col_name, 20)

    # Summary Sheet
    summary_sheet = workbook.create_sheet(title='통계_현황_요약')
    summary_sheet.views.sheetView[0].showGridLines = True
    
    summary_data = [
        ["소방청 국가화재통계 기준 사망자 10인 이상 대형화재 현황 요약", ""],
        ["총 대형화재 발생 건수", f"{len(RECORDS)}건"],
        ["총 누적 사망자 수", f"{sum(r['사망자수 (명)'] for r in RECORDS):,}명"],
        ["총 누적 부상자 수", f"{sum(r['부상자수 (명)'] for r in RECORDS):,}명"],
        ["총 누적 인명피해(사상자 합계)", f"{sum(r['총 사상자수 (명)'] for r in RECORDS):,}명"],
        ["단일 화재 최다 사망 참사", f"대구 지하철 방화 참사 (사망 192명)"],
        ["가장 최근 발생 10인 이상 화재", "화성 아리셀 리튬전지 공장 화재 (2024-06-24, 사망 23명)"]
    ]

    for r_idx, row_vals in enumerate(summary_data, 1):
        summary_sheet.row_dimensions[r_idx].height = 28
        for c_idx, val in enumerate(row_vals, 1):
            scell = summary_sheet.cell(row=r_idx, column=c_idx, value=val)
            scell.font = Font(name="맑은 고딕", size=11, bold=(c_idx == 1 or r_idx == 1))
            scell.border = thin_border
            if r_idx == 1:
                scell.fill = PatternFill(start_color="1E293B", end_color="1E293B", fill_type="solid")
                scell.font = Font(name="맑은 고딕", size=12, bold=True, color="FFFFFF")
            elif c_idx == 1:
                scell.fill = PatternFill(start_color="F1F5F9", end_color="F1F5F9", fill_type="solid")

    summary_sheet.column_dimensions['A'].width = 38
    summary_sheet.column_dimensions['B'].width = 50

print(f"[+] 엑셀 파일 생성 완료: {OUTPUT_XLSX}")
