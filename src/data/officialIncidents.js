import nationalDaily from './nfa_national_daily.json';
import sidoDaily from './nfa_sido_daily_recent.json';
import sidoReception from './nfa_sido_reception.json';
import ignitionSummary from './nfa_ignition_summary.json';
import buildingSummary from './nfa_building_summary.json';
import yearlyTrend from './nfa_yearly_trend.json';

// 전국 17개 시도 리스트
export const REGIONS = [
  '전국 (전체)', '서울', '경기', '부산', '인천', '대구', '대전', '광주',
  '울산', '세종', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'
];

export const NFA_NATIONAL_DAILY = nationalDaily;
export const NFA_SIDO_DAILY = sidoDaily;
export const NFA_SIDO_RECEPTION = sidoReception;
export const NFA_IGNITION_SUMMARY = ignitionSummary;
export const NFA_BUILDING_SUMMARY = buildingSummary;
export const NFA_YEARLY_TREND = yearlyTrend;
export const NFA_10YEARS_SUMMARY = yearlyTrend;

// 시도별 중심 위경도 매핑
export const SIDO_CENTERS = {
  '서울': { lat: 37.5665, lng: 126.9780, fullName: '서울특별시' },
  '부산': { lat: 35.1796, lng: 129.0756, fullName: '부산광역시' },
  '대구': { lat: 35.8714, lng: 128.6014, fullName: '대구광역시' },
  '인천': { lat: 37.4563, lng: 126.7052, fullName: '인천광역시' },
  '광주': { lat: 35.1595, lng: 126.8526, fullName: '광주광역시' },
  '대전': { lat: 36.3504, lng: 127.3845, fullName: '대전광역시' },
  '울산': { lat: 35.5384, lng: 129.3114, fullName: '울산광역시' },
  '세종': { lat: 36.4800, lng: 127.2890, fullName: '세종특별자치시' },
  '경기': { lat: 37.2636, lng: 127.0286, fullName: '경기도' },
  '강원': { lat: 37.8854, lng: 127.7298, fullName: '강원특별자치도' },
  '충북': { lat: 36.6357, lng: 127.4912, fullName: '충청북도' },
  '충남': { lat: 36.5184, lng: 126.8000, fullName: '충청남도' },
  '전북': { lat: 35.8242, lng: 127.1480, fullName: '전북특별자치도' },
  '전남': { lat: 34.8161, lng: 126.4629, fullName: '전라남도' },
  '경북': { lat: 36.5760, lng: 128.5056, fullName: '경상북도' },
  '경남': { lat: 35.2383, lng: 128.6922, fullName: '경상남도' },
  '제주': { lat: 33.4996, lng: 126.5312, fullName: '제주특별자치도' }
};

export const normalizeSido = (name = '') => {
  const str = String(name).trim();
  for (const [short, info] of Object.entries(SIDO_CENTERS)) {
    if (str.includes(short) || str.includes(info.fullName)) {
      return short;
    }
  }
  return str.substring(0, 2);
};

export const getCoordinatesForPlace = (placeStr = '', regionStr = '') => {
  const short = normalizeSido(regionStr || placeStr);
  return SIDO_CENTERS[short] || { lat: 36.5, lng: 127.5 };
};

// 🏛️ 공공데이터포털 소방청 OpenAPI 원본 기반 마스터 데이터 풀 구축
const formatRawIncidents = () => {
  const list = [];
  
  // 1. 시도별 화재 인명피해 원본 (2024~2026 최근 일자 전수)
  for (const row of sidoDaily) {
    const ymd = String(row.ocrn_ymd);
    const dateStr = `${ymd.substring(0, 4)}-${ymd.substring(4, 6)}-${ymd.substring(6, 8)}`;
    const sido = normalizeSido(row.sido_nm);
    const geo = SIDO_CENTERS[sido] || { lat: 36.5, lng: 127.5 };
    const mnb = parseInt(row.ocrn_mnb || 0);
    const deaths = parseInt(row.vctm_percnt || 0);
    const injured = parseInt(row.injrdpr_percnt || 0);
    const casualties = parseInt(row.life_dmg_percnt || 0);

    list.push({
      id: `NFA-RAW-${ymd}-${sido}`,
      occurId: `NFA-RAW-${ymd}-${sido}`,
      occurDate: dateStr,
      occurTime: dateStr,
      datetime: dateStr,
      region: sido,
      sidoName: row.sido_nm || sido,
      occurPlace: `${row.sido_nm || sido} 소방관할구역`,
      location: `${row.sido_nm || sido} 전역`,
      title: `${row.sido_nm || sido} 화재 발생 현황 (공식 통계)`,
      fireCount: mnb,
      deathCount: deaths,
      injuryCount: injured,
      casualtyCount: casualties,
      casualtyText: casualties > 0 ? `사망 ${deaths}명 / 부상 ${injured}명 (총 ${casualties}명)` : '인명피해 0명',
      fireCause: '소방청 통계 원장 집계',
      cause: '소방청 통계 원장 집계',
      damageAmount: '공공데이터포털 소방청 원장',
      jurisStation: `${sido}소방본부 관할`,
      lat: geo.lat,
      lng: geo.lng,
      status: 'EXTINGUISHED',
      statusText: '소방청 공식집계',
      isVerified: true,
      source: '공공데이터포털 소방청 화재정보 OpenAPI 원본 (getOcBysidoFpcnd)',
      description: `${dateStr} ${row.sido_nm || sido} 전역에서 총 ${mnb.toLocaleString()}건의 화재가 발생하였으며, 인명피해는 사망 ${deaths}명, 부상 ${injured}명(총 ${casualties}명)으로 공식 집계되었습니다.`
    });
  }

  return list;
};

export const NFA_OFFICIAL_INCIDENTS_DATABASE = formatRawIncidents();

// 데이터 출처 배지 정보
export const getIncidentSourceBadge = (incident = {}) => {
  return {
    label: '공공데이터포털 100% OpenAPI 원본',
    color: '#38bdf8',
    bg: 'rgba(56, 189, 248, 0.15)',
    border: '1px solid rgba(56, 189, 248, 0.4)',
    desc: '대한민국 소방청 / 행정안전부 공공데이터포털(apis.data.go.kr) 공식 OpenAPI 실시간 및 전수 원본'
  };
};
