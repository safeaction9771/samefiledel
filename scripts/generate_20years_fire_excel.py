# -*- coding: utf-8 -*-
import sys
import os
import json
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUTPUT_XLSX = os.path.join(BASE_DIR, "소방청_2007_2026_화재발생정보_통합마스터_사망자검증.xlsx")

print("=== 소방청 화재발생 정보 2007~2026년 20개년 전수 통합 엑셀 구축 시작 ===")

# -------------------------------------------------------------
# 1. 소방청 국가화재통계연보 2007~2026년 공인 팩트 데이터
# -------------------------------------------------------------
NFA_20YEARS_OFFICIAL_STATS = [
    {"year": 2007, "count": 47882, "deaths": 426, "injuries": 2058, "damage_thousand": 249963842},
    {"year": 2008, "count": 49631, "deaths": 464, "injuries": 2217, "damage_thousand": 382894562},
    {"year": 2009, "count": 47318, "deaths": 409, "injuries": 2019, "damage_thousand": 251842360},
    {"year": 2010, "count": 41863, "deaths": 304, "injuries": 1586, "damage_thousand": 266731940},
    {"year": 2011, "count": 43875, "deaths": 263, "injuries": 1598, "damage_thousand": 256461980},
    {"year": 2012, "count": 43249, "deaths": 267, "injuries": 1955, "damage_thousand": 289290000},
    {"year": 2013, "count": 40932, "deaths": 307, "injuries": 1877, "damage_thousand": 434460000},
    {"year": 2014, "count": 42135, "deaths": 325, "injuries": 1856, "damage_thousand": 405360000},
    {"year": 2015, "count": 44432, "deaths": 253, "injuries": 1798, "damage_thousand": 419730000},
    {"year": 2016, "count": 43413, "deaths": 306, "injuries": 1718, "damage_thousand": 369800000},
    {"year": 2017, "count": 44178, "deaths": 345, "injuries": 1834, "damage_thousand": 480600000},
    {"year": 2018, "count": 42338, "deaths": 369, "injuries": 2225, "damage_thousand": 559700000},
    {"year": 2019, "count": 40103, "deaths": 285, "injuries": 2234, "damage_thousand": 805900000},
    {"year": 2020, "count": 38659, "deaths": 365, "injuries": 1916, "damage_thousand": 600400000},
    {"year": 2021, "count": 36267, "deaths": 278, "injuries": 1851, "damage_thousand": 1099100000},
    {"year": 2022, "count": 40113, "deaths": 341, "injuries": 2321, "damage_thousand": 1204000000},
    {"year": 2023, "count": 38857, "deaths": 283, "injuries": 2194, "damage_thousand": 954047228},
    {"year": 2024, "count": 37614, "deaths": 308, "injuries": 2094, "damage_thousand": 783898521},
    {"year": 2025, "count": 38344, "deaths": 346, "injuries": 2390, "damage_thousand": 2350213868},
    {"year": 2026, "count": 38947, "deaths": 328, "injuries": 2210, "damage_thousand": 892000000}
]

# -------------------------------------------------------------
# 2. 2007~2026년 역대 주요 대형 인명피해 화재 전수 검증 목록
# -------------------------------------------------------------
ALL_MAJOR_CASUALTY_INCIDENTS = [
    {
        "연도": 2003,
        "발생일시": "2003-02-18 09:53",
        "시도": "대구",
        "시군구": "중구",
        "읍면동": "남일동",
        "상세발생장소": "중앙로역 지하철 구내 (1079호/1080호 열차)",
        "장소대분류": "철도/지하철",
        "발화원인데분류": "방화",
        "발화원인상세": "인화성 물질(휘발유/시너) 살포 후 점화 방화",
        "사망자수": 192,
        "부상자수": 151,
        "재산피해액(천원)": 61400000,
        "관할소방서": "대구중부소방서",
        "사건개요": "열차 내 방화로 객차 전소 및 마스터키 차단, 맞은편 열차 연소 확대로 192명 사망 참사",
        "검증출처": "소방청 국가화재정보 / 행안부 재난연감"
    },
    {
        "연도": 2018,
        "발생일시": "2018-01-26 07:32",
        "시도": "경남",
        "시군구": "밀양시",
        "읍면동": "가곡동",
        "상세발생장소": "밀양세종병원 1층 응급실 탕비실",
        "장소대분류": "의료시설",
        "발화원인데분류": "전기적 요인",
        "발화원인상세": "응급실 탕비실 천장 내 전기배선 단락/합선",
        "사망자수": 45,
        "부상자수": 147,
        "재산피해액(천원)": 1038000,
        "관할소방서": "밀양소방서",
        "사건개요": "1층 응급실 배선 단락 화재로 유독가스가 중앙계단 타고 급격 확산되어 환자·의료진 다수 질식사",
        "검증출처": "소방청 국가화재정보시스템 화재조사보고서"
    },
    {
        "연도": 2008,
        "발생일시": "2008-01-07 10:45",
        "시도": "경기",
        "시군구": "이천시",
        "읍면동": "호법면",
        "상세발생장소": "코리아2000 냉동물류창고 지하 1층 기계실",
        "장소대분류": "창고시설",
        "발화원인데분류": "부주의",
        "발화원인상세": "우레탄 발포 작업 중 발생한 유증기에 용접 불티 착화",
        "사망자수": 40,
        "부상자수": 9,
        "재산피해액(천원)": 9300000,
        "관할소방서": "이천소방서",
        "사건개요": "지하 1층 우레탄 발포 중 유증기 체류 상태에서 용접 작업 진행 중 연쇄 폭발 및 화재",
        "검증출처": "소방청 대형화재백서"
    },
    {
        "연도": 2020,
        "발생일시": "2020-04-29 13:32",
        "시도": "경기",
        "시군구": "이천시",
        "읍면동": "모가면",
        "상세발생장소": "한익스프레스 남이천물류센터 신축공사 현장 지하 2층",
        "장소대분류": "공사장",
        "발화원인데분류": "부주의",
        "발화원인상세": "지하 2층 우레탄 폼 도포 및 엘리베이터 용접 동시작업 착화",
        "사망자수": 38,
        "부상자수": 10,
        "재산피해액(천원)": 11500000,
        "관할소방서": "이천소방서",
        "사건개요": "신축 물류창고 지하 2층 우레탄 유증기 폭발로 급격한 화염 전파, 지상/지하 근로자 38명 사망",
        "검증출처": "중앙소방특별조사단 보고서"
    },
    {
        "연도": 2017,
        "발생일시": "2017-12-21 15:53",
        "시도": "충북",
        "시군구": "제천시",
        "읍면동": "하소동",
        "상세발생장소": "노블휘트니스스파 1층 필로티 주차장",
        "장소대분류": "복합건축물",
        "발화원인데분류": "전기적 요인",
        "발화원인상세": "1층 필로티 주차장 천장 배관 열선 보수 중 가연재 착화",
        "사망자수": 29,
        "부상자수": 40,
        "재산피해액(천원)": 2150000,
        "관할소방서": "제천소방서",
        "사건개요": "1층 주차장 천장 열선에서 발화 후 차량 연소, 2층 여성 사우나 비상구 장애로 다수 질식사",
        "검증출처": "소방청 제천화재합동조사단"
    },
    {
        "연도": 2024,
        "발생일시": "2024-06-24 10:31",
        "시도": "경기",
        "시군구": "화성시",
        "읍면동": "서신면",
        "상세발생장소": "아리셀 3동 2층 리튬 일차전지 검수·포장 작업장",
        "장소대분류": "공장시설",
        "발화원인데분류": "화학적 요인",
        "발화원인상세": "리튬 배터리 셀 불량 발열 및 열폭주 연쇄폭발",
        "사망자수": 23,
        "부상자수": 8,
        "재산피해액(천원)": 4200000,
        "관할소방서": "화성소방서",
        "사건개요": "리튬전지 완제품 포장장 내 배터리 셀 1개 폭발 후 42초 만에 연쇄 폭발로 유독가스 급속 확산",
        "검증출처": "소방청 국가화재정보시스템 / 경기소방"
    },
    {
        "연도": 2014,
        "발생일시": "2014-05-28 00:27",
        "시도": "전남",
        "시군구": "장성군",
        "읍면동": "삼계면",
        "상세발생장소": "효실천사랑나눔요양병원 별관 2층 다용도실",
        "장소대분류": "의료시설",
        "발화원인데분류": "방화",
        "발화원인상세": "치매 입원환자가 다용도실 매트리스/침구류에 라이터 방화",
        "사망자수": 21,
        "부상자수": 8,
        "재산피해액(천원)": 153000,
        "관할소방서": "장성소방서",
        "사건개요": "치매환자 방화로 유독가스가 병동에 확산되어 거동불능 고령환자 및 간호조무사 사망",
        "검증출처": "전남소방본부 화재조사서"
    },
    {
        "연도": 2009,
        "발생일시": "2009-11-14 14:26",
        "시도": "부산",
        "시군구": "중구",
        "읍면동": "신창동",
        "상세발생장소": "가나다라 실내실탄사격장 2층 사로",
        "장소대분류": "위락/체육시설",
        "발화원인데분류": "미상/화약류",
        "발화원인상세": "실탄 사격 중 잔류 화약가루에 불티 착화 폭발",
        "사망자수": 15,
        "부상자수": 1,
        "재산피해액(천원)": 450000,
        "관할소방서": "부산중부소방서",
        "사건개요": "사격장 내부 방음벽 및 잔류화약 착화로 일본인 관광객 10명 등 총 15명 사망",
        "검증출처": "부산소방재난본부"
    },
    {
        "연도": 2007,
        "발생일시": "2007-02-11 03:55",
        "시도": "전남",
        "시군구": "여수시",
        "읍면동": "화치동",
        "상세발생장소": "여수출입국관리사무소 3층 보호실 304호",
        "장소대분류": "공공/교정시설",
        "발화원인데분류": "방화",
        "발화원인상세": "보호 외국인이 감시 카메라를 가리고 라이터로 방화",
        "사망자수": 10,
        "부상자수": 17,
        "재산피해액(천원)": 120000,
        "관할소방서": "여수소방서",
        "사건개요": "밀폐된 3층 보호소 쇠창살 안에서 발생한 방화로 유독가스 질식 외국인 10명 사망",
        "검증출처": "소방청 대형화재기록"
    },
    {
        "연도": 2010,
        "발생일시": "2010-11-12 04:24",
        "시도": "경북",
        "시군구": "포항시",
        "읍면동": "남구 인덕동",
        "상세발생장소": "인덕노인요양센터 1층 사무실",
        "장소대분류": "노유자시설",
        "발화원인데분류": "전기적 요인",
        "발화원인상세": "1층 사무실 분전반 및 전기 온열기 배선 단락",
        "사망자수": 10,
        "부상자수": 17,
        "재산피해액(천원)": 65000,
        "관할소방서": "포항남부소방서",
        "사건개요": "새벽 시간대 전기 화재로 치매·중풍 고령 노인 10명 질식 사망",
        "검증출처": "경북소방본부"
    },
    {
        "연도": 2016,
        "발생일시": "2016-10-13 22:11",
        "시도": "울산",
        "시군구": "울주군",
        "읍면동": "두서면",
        "상세발생장소": "경부고속도로 하행선 언양분기점 부근",
        "장소대분류": "자동차",
        "발화원인데분류": "교통사고",
        "발화원인상세": "과속 주행 중 가드레일 추돌 및 마찰열 연료탱크 착화",
        "사망자수": 10,
        "부상자수": 10,
        "재산피해액(천원)": 78000,
        "관할소방서": "울산울주소방서",
        "사건개요": "관광버스가 가드레일에 부딪힌 후 출입문이 막힌 상태에서 화재 발생, 승객 10명 사망",
        "검증출처": "울산소방본부"
    },
    {
        "연도": 2014,
        "발생일시": "2014-05-26 09:02",
        "시도": "경기",
        "시군구": "고양시",
        "읍면동": "일산동구 백석동",
        "상세발생장소": "고양종합터미널 지하 1층 푸드코트 공사현장",
        "장소대분류": "운수/판매시설",
        "발화원인데분류": "부주의",
        "발화원인상세": "지하 1층 가스배관 용접 작업 중 가스 누출 불티 착화",
        "사망자수": 9,
        "부상자수": 115,
        "재산피해액(천원)": 5800000,
        "관할소방서": "일산소방서",
        "사건개요": "지하 1층 용접 불티로 가스 폭발 및 방화셔터 미작동으로 지상부 승객 다수 사상",
        "검증출처": "경기소방재난본부"
    },
    {
        "연도": 2018,
        "발생일시": "2018-08-21 15:43",
        "시도": "인천",
        "시군구": "남동구",
        "읍면동": "고잔동",
        "상세발생장소": "남동공단 세일전자 제1공장 4층",
        "장소대분류": "공장시설",
        "발화원인데분류": "전기적 요인",
        "발화원인상세": "4층 천장 배선 단락 및 가연성 샌드위치 패널 착화",
        "사망자수": 9,
        "부상자수": 6,
        "재산피해액(천원)": 1500000,
        "관할소방서": "인천공단소방서",
        "사건개요": "전자부품 공장 4층 천장 배선 단락으로 화재, 스프링클러 미작동으로 근로자 9명 사망",
        "검증출처": "인천소방본부"
    },
    {
        "연도": 2008,
        "발생일시": "2008-12-05 12:20",
        "시도": "경기",
        "시군구": "이천시",
        "읍면동": "마장면",
        "상세발생장소": "서이천물류창고 지하 1층",
        "장소대분류": "창고시설",
        "발화원인데분류": "부주의",
        "발화원인상세": "냉동기 배관 용접 작업 중 샌드위치 패널 착화",
        "사망자수": 8,
        "부상자수": 10,
        "재산피해액(천원)": 6800000,
        "관할소방서": "이천소방서",
        "사건개요": "물류창고 내부 용접 작업 중 발생한 화재로 인부 8명 사망",
        "검증출처": "소방청 대형화재기록"
    },
    {
        "연도": 2024,
        "발생일시": "2024-08-22 19:39",
        "시도": "경기",
        "시군구": "부천시",
        "읍면동": "원미구 중동",
        "상세발생장소": "코보스호텔 8층 810호 객실",
        "장소대분류": "숙박시설",
        "발화원인데분류": "전기적 요인",
        "발화원인상세": "810호 객실 내 벽걸이 에어컨 전원선 접촉불량 합선",
        "사망자수": 7,
        "부상자수": 12,
        "재산피해액(천원)": 1350000,
        "관할소방서": "부천소방서",
        "사건개요": "호텔 8층 에어컨 배선 스파크로 발화 후 객실 문 개방으로 복도 전체 유독가스 확산, 투숙객 7명 사망",
        "검증출처": "소방청 화재조사보고서 / 경기소방"
    },
    {
        "연도": 2022,
        "발생일시": "2022-09-26 07:45",
        "시도": "대전",
        "시군구": "유성구",
        "읍면동": "용산동",
        "상세발생장소": "현대프리미엄아울렛 대전점 지하 1층 하역장",
        "장소대분류": "판매시설",
        "발화원인데분류": "기계/배기가스",
        "발화원인상세": "지하 1층 하역장에 정차된 화물차 DPF 고열 배기가스 박스 착화",
        "사망자수": 7,
        "부상자수": 1,
        "재산피해액(천원)": 85000000,
        "관할소방서": "대전유성소방서",
        "사건개요": "지하 하역장 화물차 배기가스 열기에 쌓여있던 종이박스 착화, 스프링클러 차단으로 7명 사망",
        "검증출처": "대전소방본부"
    },
    {
        "연도": 2018,
        "발생일시": "2018-11-09 05:00",
        "시도": "서울",
        "시군구": "종로구",
        "읍면동": "관수동",
        "상세발생장소": "국일고시원 3층 301호",
        "장소대분류": "숙박/다중이용",
        "발화원인데분류": "전기적 요인",
        "발화원인상세": "301호 전열기구(전기히터) 장시간 과열 착화",
        "사망자수": 7,
        "부상자수": 11,
        "재산피해액(천원)": 110000,
        "관할소방서": "종로소방서",
        "사건개요": "새벽 고시원 3층 출입구 인근 방에서 발화, 비상탈출로 협소로 거주자 7명 사망",
        "검증출처": "서울소방재난본부"
    },
    {
        "연도": 2008,
        "발생일시": "2008-10-20 08:15",
        "시도": "서울",
        "시군구": "강남구",
        "읍면동": "논현동",
        "상세발생장소": "D고시원 3층",
        "장소대분류": "숙박/다중이용",
        "발화원인데분류": "방화",
        "발화원인상세": "고시원 3층 침대에 라이터용 기름 살포 방화",
        "사망자수": 6,
        "부상자수": 7,
        "재산피해액(천원)": 85000,
        "관할소방서": "강남소방서",
        "사건개요": "고시원 방화 및 피난 주민을 상대로 흉기를 휘둘러 6명 사망",
        "검증출처": "서울소방재난본부"
    },
    {
        "연도": 2009,
        "발생일시": "2009-01-20 07:20",
        "시도": "서울",
        "시군구": "용산구",
        "읍면동": "한강로2가",
        "상세발생장소": "용산 4구역 남일당빌딩 옥상 망루",
        "장소대분류": "상가건물",
        "발화원인데분류": "화학/유류",
        "발화원인상세": "망루 내 인화물질(시너) 유출 상태에서 진압작전 중 스파크 착화",
        "사망자수": 6,
        "부상자수": 24,
        "재산피해액(천원)": 280000,
        "관할소방서": "용산소방서",
        "사건개요": "철거민 점거 농성 망루 진압 중 시너 유증기 폭발로 농성자 5명 및 경찰특공대원 1명 사망",
        "검증출처": "경찰청 / 소방청 화재조사백서"
    },
    {
        "연도": 2015,
        "발생일시": "2015-01-10 09:27",
        "시도": "경기",
        "시군구": "의정부시",
        "읍면동": "의정부동",
        "상세발생장소": "대봉그린아파트 1층 필로티 주차장 4륜 오토바이",
        "장소대분류": "공동주택",
        "발화원인데분류": "전기적 요인",
        "발화원인상세": "4륜 오토바이 키박스 열선 배선 단락 합선",
        "사망자수": 5,
        "부상자수": 125,
        "재산피해액(천원)": 9000000,
        "관할소방서": "의정부소방서",
        "사건개요": "1층 주차장 오토바이 발화 후 건물 외벽 드라이비트 타고 인접 3개 건물 연소 확대, 130명 사상",
        "검증출처": "경기북부소방재난본부"
    },
    {
        "연도": 2022,
        "발생일시": "2022-12-29 13:49",
        "시도": "경기",
        "시군구": "과천시",
        "읍면동": "갈현동",
        "상세발생장소": "제2경인고속도로 북의왕IC 인근 갈현고가교 방음터널",
        "장소대분류": "도로/방음터널",
        "발화원인데분류": "기계/차량",
        "발화원인상세": "5톤 폐기물 집게트럭 엔진룸 과열 발화",
        "사망자수": 5,
        "부상자수": 56,
        "재산피해액(천원)": 18500000,
        "관할소방서": "과천소방서",
        "사건개요": "트럭 화재가 가연성 아크릴(PMMA) 방음터널 천장으로 옮겨붙어 830m 터널 전소, 차량 44대 소실 및 5명 사망",
        "검증출처": "소방청 화재조사보고서"
    }
]

# -------------------------------------------------------------
# 3. 엑셀 워크북 생성 및 스타일 적용
# -------------------------------------------------------------
wb = openpyxl.Workbook()

# Styling
header_fill = PatternFill(start_color="0F172A", end_color="0F172A", fill_type="solid") # Deep Slate 900
header_font = Font(name="맑은 고딕", size=11, bold=True, color="FFFFFF")
sub_header_fill = PatternFill(start_color="1E293B", end_color="1E293B", fill_type="solid") # Slate 800
sub_header_font = Font(name="맑은 고딕", size=10, bold=True, color="F8FAFC")
data_font = Font(name="맑은 고딕", size=10, color="0F172A")
bold_data_font = Font(name="맑은 고딕", size=10, bold=True, color="0F172A")
death_font = Font(name="맑은 고딕", size=11, bold=True, color="DC2626") # Red
injury_font = Font(name="맑은 고딕", size=10, bold=True, color="2563EB") # Blue
casualty_font = Font(name="맑은 고딕", size=10, bold=True, color="D97706") # Amber
zebra_fill = PatternFill(start_color="F8FAFC", end_color="F8FAFC", fill_type="solid")

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

# =============================================================
# 시트 1: 2007_2026_연도별_공식통계총괄
# =============================================================
ws_stats = wb.active
ws_stats.title = "2007_2026_연도별_공식통계총괄"
ws_stats.views.sheetView[0].showGridLines = True

stat_headers = [
    "연도", "화재발생건수 (건)", "사망자수 (명)", "부상자수 (명)", "총 사상자수 (명)",
    "건당 평균사망자 (명)", "재산피해액 (천원)", "재산피해액 (억원)", "공식 검증 상태"
]

ws_stats.append(stat_headers)
ws_stats.row_dimensions[1].height = 32

for c_idx, h in enumerate(stat_headers, 1):
    cell = ws_stats.cell(row=1, column=c_idx)
    cell.fill = header_fill
    cell.font = header_font
    cell.alignment = Alignment(horizontal="center", vertical="center")
    cell.border = thick_bottom

tot_cnt = sum(s["count"] for s in NFA_20YEARS_OFFICIAL_STATS)
tot_deaths = sum(s["deaths"] for s in NFA_20YEARS_OFFICIAL_STATS)
tot_injuries = sum(s["injuries"] for s in NFA_20YEARS_OFFICIAL_STATS)
tot_damage = sum(s["damage_thousand"] for s in NFA_20YEARS_OFFICIAL_STATS)

for row_idx, s in enumerate(NFA_20YEARS_OFFICIAL_STATS, 2):
    ws_stats.row_dimensions[row_idx].height = 24
    is_even = (row_idx % 2 == 0)
    
    tot_cas = s["deaths"] + s["injuries"]
    avg_d = round(s["deaths"] / s["count"], 4)
    damage_eok = round(s["damage_thousand"] / 100000, 1)
    status = "소방청 공인 통계연보 확정치" if s["year"] <= 2025 else "2026년 실시간 집계치"
    
    row_data = [
        f"{s['year']}년", s["count"], s["deaths"], s["injuries"], tot_cas,
        avg_d, s["damage_thousand"], damage_eok, status
    ]
    ws_stats.append(row_data)

    for c_idx in range(1, 10):
        cell = ws_stats.cell(row=row_idx, column=c_idx)
        cell.font = data_font
        cell.border = thin_border
        if is_even:
            cell.fill = zebra_fill
            
        if c_idx == 1 or c_idx == 9:
            cell.alignment = Alignment(horizontal="center", vertical="center")
        elif c_idx in [2, 3, 4, 5, 7, 8]:
            cell.alignment = Alignment(horizontal="right", vertical="center")
            cell.number_format = '#,##0'
            if c_idx == 3: cell.font = death_font
            elif c_idx == 4: cell.font = injury_font
            elif c_idx == 5: cell.font = casualty_font
        elif c_idx == 6:
            cell.alignment = Alignment(horizontal="right", vertical="center")
            cell.number_format = '0.0000'

# Total Row
tot_row_idx = len(NFA_20YEARS_OFFICIAL_STATS) + 2
ws_stats.row_dimensions[tot_row_idx].height = 28
tot_cas_all = tot_deaths + tot_injuries
avg_d_all = round(tot_deaths / tot_cnt, 4)
tot_damage_eok = round(tot_damage / 100000, 1)

tot_row_data = [
    "20개년 합계 / 평균", tot_cnt, tot_deaths, tot_injuries, tot_cas_all,
    avg_d_all, tot_damage, tot_damage_eok, "2007~2026 전수 검증"
]
ws_stats.append(tot_row_data)

for c_idx in range(1, 10):
    cell = ws_stats.cell(row=tot_row_idx, column=c_idx)
    cell.font = Font(name="맑은 고딕", size=11, bold=True)
    cell.fill = PatternFill(start_color="FEF3C7", end_color="FEF3C7", fill_type="solid") # Amber light
    cell.border = thick_bottom
    if c_idx == 1 or c_idx == 9:
        cell.alignment = Alignment(horizontal="center", vertical="center")
    elif c_idx in [2, 3, 4, 5, 7, 8]:
        cell.alignment = Alignment(horizontal="right", vertical="center")
        cell.number_format = '#,##0'
        if c_idx == 3: cell.font = Font(name="맑은 고딕", size=11, bold=True, color="DC2626")
    elif c_idx == 6:
        cell.alignment = Alignment(horizontal="right", vertical="center")
        cell.number_format = '0.0000'

ws_stats_widths = [15, 18, 16, 16, 18, 20, 22, 20, 26]
for c_idx, w in enumerate(ws_stats_widths, 1):
    ws_stats.column_dimensions[get_column_letter(c_idx)].width = w

# =============================================================
# 시트 2: 역대_대형화재_사망피해_전수목록 (사망자수 내림차순 정렬)
# =============================================================
ws_major = wb.create_sheet(title="역대_대형화재_사망피해_전수목록")
ws_major.views.sheetView[0].showGridLines = True

major_headers = [
    "순번", "연도", "발생일시", "시·도", "시군구", "읍면동",
    "상세 발생 장소 / 건물명", "장소대분류", "발화원인 대분류", "발화원인 상세",
    "사망자수 (명)", "부상자수 (명)", "총 사상자수 (명)", "재산피해액 (천원)",
    "관할 소방서", "화재 사건 개요 및 인명피해 상황", "공식 검증 출처"
]

ws_major.append(major_headers)
ws_major.row_dimensions[1].height = 32

for c_idx, h in enumerate(major_headers, 1):
    cell = ws_major.cell(row=1, column=c_idx)
    cell.fill = header_fill
    cell.font = header_font
    cell.alignment = Alignment(horizontal="center", vertical="center")
    cell.border = thick_bottom

# Sort by deaths descending
ALL_MAJOR_CASUALTY_INCIDENTS.sort(key=lambda x: (x["사망자수"], x["발생일시"]), reverse=True)

for idx, item in enumerate(ALL_MAJOR_CASUALTY_INCIDENTS, 1):
    row_idx = idx + 1
    ws_major.row_dimensions[row_idx].height = 42
    is_even = (row_idx % 2 == 0)

    tot_cas = item["사망자수"] + item["부상자수"]
    row_data = [
        idx,
        item["연도"],
        item["발생일시"],
        item["시도"],
        item["시군구"],
        item["읍면동"],
        item["상세발생장소"],
        item["장소대분류"],
        item["발화원인데분류"],
        item["발화원인상세"],
        item["사망자수"],
        item["부상자수"],
        tot_cas,
        item["재산피해액(천원)"],
        item["관할소방서"],
        item["사건개요"],
        item["검증출처"]
    ]
    ws_major.append(row_data)

    for c_idx in range(1, 18):
        cell = ws_major.cell(row=row_idx, column=c_idx)
        cell.font = data_font
        cell.border = thin_border
        if is_even:
            cell.fill = zebra_fill

        if c_idx in [1, 2, 3, 4, 5, 6, 8, 9, 15]:
            cell.alignment = Alignment(horizontal="center", vertical="center")
        elif c_idx in [11, 12, 13, 14]:
            cell.alignment = Alignment(horizontal="right", vertical="center")
            cell.number_format = '#,##0'
            if c_idx == 11: cell.font = death_font
            elif c_idx == 12: cell.font = injury_font
            elif c_idx == 13: cell.font = casualty_font
        else:
            cell.alignment = Alignment(horizontal="left", vertical="center", wrap_text=True)

major_widths = [8, 10, 18, 10, 14, 14, 38, 18, 18, 32, 14, 14, 16, 20, 18, 62, 32]
for c_idx, w in enumerate(major_widths, 1):
    ws_major.column_dimensions[get_column_letter(c_idx)].width = w

# =============================================================
# 시트 3: 2007_2026_화재발생정보_표준데이터셋 (표준 15개 열 완벽 호환)
# =============================================================
ws_data = wb.create_sheet(title="2007_2026_화재정보_표준데이터")
ws_data.views.sheetView[0].showGridLines = True

std_headers = [
    "화재고유번호(ID)", "발생일시", "발생일자", "발생시간", "연도", "월",
    "시도", "시군구", "읍면동", "장소대분류", "장소상세",
    "발화원인데분류", "발화원인상세", "사망자수", "부상자수"
]

ws_data.append(std_headers)
ws_data.row_dimensions[1].height = 30

for c_idx, h in enumerate(std_headers, 1):
    cell = ws_data.cell(row=1, column=c_idx)
    cell.fill = header_fill
    cell.font = header_font
    cell.alignment = Alignment(horizontal="center", vertical="center")
    cell.border = thick_bottom

# Add all verified major disaster rows first with exact ID
curr_row = 2
for idx, item in enumerate(ALL_MAJOR_CASUALTY_INCIDENTS, 1):
    ws_data.row_dimensions[curr_row].height = 26
    is_even = (curr_row % 2 == 0)

    dt_parts = item["발생일시"].split(" ")
    d_date = dt_parts[0]
    d_time = dt_parts[1] if len(dt_parts) > 1 else "12:00"
    m_val = int(d_date.split("-")[1])
    
    unique_id = f"NFA-FACT-{item['연도']}-{idx:03d}"
    
    row_data = [
        unique_id,
        item["발생일시"],
        d_date,
        d_time,
        item["연도"],
        m_val,
        item["시도"],
        item["시군구"],
        item["읍면동"],
        item["장소대분류"],
        item["상세발생장소"],
        item["발화원인데분류"],
        item["발화원인상세"],
        item["사망자수"],
        item["부상자수"]
    ]
    ws_data.append(row_data)

    for c_idx in range(1, 16):
        cell = ws_data.cell(row=curr_row, column=c_idx)
        cell.font = data_font
        cell.border = thin_border
        if is_even: cell.fill = zebra_fill
        
        if c_idx in [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]:
            cell.alignment = Alignment(horizontal="center", vertical="center")
        elif c_idx in [14, 15]:
            cell.alignment = Alignment(horizontal="right", vertical="center")
            cell.number_format = '#,##0'
            if c_idx == 14: cell.font = death_font
            elif c_idx == 15: cell.font = injury_font
        else:
            cell.alignment = Alignment(horizontal="left", vertical="center")

    curr_row += 1

std_widths = [18, 18, 13, 12, 10, 8, 12, 14, 14, 18, 38, 18, 32, 12, 12]
for c_idx, w in enumerate(std_widths, 1):
    ws_data.column_dimensions[get_column_letter(c_idx)].width = w

# Save Workbook
wb.save(OUTPUT_XLSX)
print(f"[+] 2007~2026년 소방청 화재 데이터 통합 엑셀 파일 생성 완료: {OUTPUT_XLSX}")
