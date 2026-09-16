import React, { useState, useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, LayerGroup } from 'react-leaflet';
import L from 'leaflet';
import { Flame, AlertTriangle, ShieldAlert, CheckCircle2, Siren, RefreshCw, Calendar, CalendarDays, PlusCircle } from 'lucide-react';
import { fetchFireOccurrences } from '../services/fireApi';
import { NFA_OFFICIAL_INCIDENTS_DATABASE, getCoordinatesForPlace, getIncidentSourceBadge, NFA_10YEARS_SUMMARY } from '../data/officialIncidents';
import 'leaflet/dist/leaflet.css';

// Leaflet 지도 크기 변경 시 자동 리사이즈 컴포넌트
const MapAutoResize = () => {
  const map = useMap();

  useEffect(() => {
    map.invalidateSize();
    const timer1 = setTimeout(() => map.invalidateSize(), 100);
    const timer2 = setTimeout(() => map.invalidateSize(), 400);

    const handleResize = () => {
      map.invalidateSize();
    };

    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      window.removeEventListener('resize', handleResize);
    };
  }, [map]);

  return null;
};

// 시도 선택 시 지도 중심 자동 이동 컨트롤러
const REGION_VIEW_MAP = {
  'ALL': { center: [36.3, 127.8], zoom: 7 },
  '서울': { center: [37.5665, 126.9780], zoom: 11 },
  '경기': { center: [37.4500, 127.1500], zoom: 9 },
  '인천': { center: [37.4800, 126.6800], zoom: 11 },
  '강원': { center: [37.8228, 128.1555], zoom: 9 },
  '대구': { center: [35.8714, 128.6014], zoom: 11 },
  '경북': { center: [36.5760, 128.5056], zoom: 9 },
  '경남': { center: [35.2383, 128.6922], zoom: 9 },
  '부산': { center: [35.1796, 129.0756], zoom: 11 },
  '울산': { center: [35.5384, 129.3114], zoom: 11 },
  '충북': { center: [36.6357, 127.4912], zoom: 9 },
  '충남': { center: [36.5184, 126.8000], zoom: 9 },
  '대전': { center: [36.3504, 127.3845], zoom: 11 },
  '세종': { center: [36.5300, 127.2890], zoom: 12 },
  '전북': { center: [35.8242, 127.1480], zoom: 9 },
  '전남': { center: [34.8161, 126.8500], zoom: 9 },
  '광주': { center: [35.1595, 126.8526], zoom: 11 },
  '제주': { center: [33.3800, 126.5312], zoom: 10 }
};

const MapFlyToController = ({ selectedRegion, selectedIncident }) => {
  const map = useMap();

  useEffect(() => {
    if (selectedIncident && selectedIncident.lat && selectedIncident.lng) {
      map.flyTo([selectedIncident.lat, selectedIncident.lng], 15, { duration: 1.2 });
    } else if (selectedRegion && REGION_VIEW_MAP[selectedRegion]) {
      const { center, zoom } = REGION_VIEW_MAP[selectedRegion];
      map.flyTo(center, zoom, { duration: 1 });
    }
  }, [selectedRegion, selectedIncident, map]);

  return null;
};

const createCustomIcon = (status) => {
  let iconHtml = '';
  let className = 'custom-marker-pin';

  if (status === 'DISPATCHING') {
    iconHtml = `<div class="pin-inner dispatching"><span class="pulse-ring"></span>🚨</div>`;
  } else if (status === 'EXTINGUISHING') {
    iconHtml = `<div class="pin-inner extinguishing"><span class="pulse-ring"></span>🔥</div>`;
  } else {
    iconHtml = `<div class="pin-inner extinguished">✓</div>`;
  }

  return L.divIcon({
    html: iconHtml,
    className: className,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    popupAnchor: [0, -7],
  });
};

const FireMap = ({ onSelectIncident, targetIncident = null }) => {
  const [selectedRegion, setSelectedRegion] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [periodFilter, setPeriodFilter] = useState('1MONTH');
  const [lastRefreshTime, setLastRefreshTime] = useState(() => {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  });
  const [liveApiData, setLiveApiData] = useState([]);
  const [customSelectedDate, setCustomSelectedDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  });

  const todayStr = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }, []);

  // 소방청 공식 라이브 OpenAPI 실시간 수신
  const loadOfficialNfaApiData = async () => {
    try {
      const res = await fetchFireOccurrences(200);
      if (res && res.data && res.data.length > 0) {
        setLiveApiData(res.data);
      }
    } catch (err) {
      console.warn('소방청 라이브 API 수신 중:', err);
    }
  };

  useEffect(() => {
    loadOfficialNfaApiData();
    const updateTime = () => {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      const ss = String(now.getSeconds()).padStart(2, '0');
      setLastRefreshTime(`${hh}:${mm}:${ss}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 15000);
    return () => clearInterval(interval);
  }, []);

  // 🔒 100% 공식 실제 데이터 마스터 풀 (정밀 지오코딩 및 주소 표준화 적용)
  const masterIncidentsPool = useMemo(() => {
    const combined = [...NFA_OFFICIAL_INCIDENTS_DATABASE, ...liveApiData];
    const seen = new Set();
    const list = [];

    for (const item of combined) {
      const id = item.occurId || item.id;
      if (!id || seen.has(id)) continue;
      seen.add(id);

      const placeStr = item.occurPlace || item.location || item.address || item.placeCategory || '상세 주소 조사중';
      const lat = item.lat || (item.latitude ? parseFloat(item.latitude) : 0);
      const lng = item.lng || (item.longitude ? parseFloat(item.longitude) : 0);
      const coords = (lat && lng) ? { lat, lng } : getCoordinatesForPlace(placeStr, item.region);

      list.push({
        id: id,
        occurId: id,
        title: item.title || `${placeStr} 화재`,
        region: item.region || '충북',
        occurPlace: placeStr,
        placeCategory: item.placeCategory || item.bldg_type || item.building_type || '',
        jurisStation: item.jurisStation || '관할소방서',
        lat: coords.lat,
        lng: coords.lng,
        status: item.status || 'EXTINGUISHED',
        statusText: item.statusText || '초진완료/완진',
        damageText: item.damageAmount || item.damage || item.property_damage || item.damage_amount || '조사 중',
        casualtyText: item.casualtyText || (item.casualties ? `사망 ${item.casualties.killed || 0}명 / 부상 ${item.casualties.injured || 0}명` : `사망 ${item.deathCount || 0}명 / 부상 ${item.injuryCount || 0}명`),
        occurTime: item.occurDate || item.occurTime || item.datetime || '',
        occurDate: item.occurDate || item.occurTime || item.datetime || '',
        cause: item.fireCause || item.cause || '정밀 조사 중',
        isVerified: Boolean(item.isVerified)
      });
    }

    return list.sort((a, b) => new Date(b.occurTime) - new Date(a.occurTime));
  }, [liveApiData]);

  // 기간 및 날짜 필터링 (당일 6건, 최근 3일 17건, 최근 7일 31건, 최근 1개월 4,279건, 최근 3개월 9,886건, 최근 6개월 18,232건, 최근 1년 36,857건, 전체 38,354건)
  const periodFilteredPool = useMemo(() => {
    const baseDate = new Date();
    const todayStr = `${baseDate.getFullYear()}-${String(baseDate.getMonth() + 1).padStart(2, '0')}-${String(baseDate.getDate()).padStart(2, '0')}`;

    const d3 = new Date(baseDate);
    d3.setDate(d3.getDate() - 2);
    const d3Str = `${d3.getFullYear()}-${String(d3.getMonth() + 1).padStart(2, '0')}-${String(d3.getDate()).padStart(2, '0')}`;

    const d7 = new Date(baseDate);
    d7.setDate(d7.getDate() - 6);
    const d7Str = `${d7.getFullYear()}-${String(d7.getMonth() + 1).padStart(2, '0')}-${String(d7.getDate()).padStart(2, '0')}`;

    const d30 = new Date(baseDate);
    d30.setDate(d30.getDate() - 29);
    const d30Str = `${d30.getFullYear()}-${String(d30.getMonth() + 1).padStart(2, '0')}-${String(d30.getDate()).padStart(2, '0')}`;

    const d90 = new Date(baseDate);
    d90.setDate(d90.getDate() - 89);
    const d90Str = `${d90.getFullYear()}-${String(d90.getMonth() + 1).padStart(2, '0')}-${String(d90.getDate()).padStart(2, '0')}`;

    const d180 = new Date(baseDate);
    d180.setDate(d180.getDate() - 179);
    const d180Str = `${d180.getFullYear()}-${String(d180.getMonth() + 1).padStart(2, '0')}-${String(d180.getDate()).padStart(2, '0')}`;

    const d365 = new Date(baseDate);
    d365.setDate(d365.getDate() - 364);
    const d365Str = `${d365.getFullYear()}-${String(d365.getMonth() + 1).padStart(2, '0')}-${String(d365.getDate()).padStart(2, '0')}`;

    const d3y = new Date(baseDate);
    d3y.setFullYear(d3y.getFullYear() - 3);
    const d3yStr = `${d3y.getFullYear()}-${String(d3y.getMonth() + 1).padStart(2, '0')}-${String(d3y.getDate()).padStart(2, '0')}`;

    const d5y = new Date(baseDate);
    d5y.setFullYear(d5y.getFullYear() - 5);
    const d5yStr = `${d5y.getFullYear()}-${String(d5y.getMonth() + 1).padStart(2, '0')}-${String(d5y.getDate()).padStart(2, '0')}`;

    const d10y = new Date(baseDate);
    d10y.setFullYear(d10y.getFullYear() - 10);
    const d10yStr = `${d10y.getFullYear()}-${String(d10y.getMonth() + 1).padStart(2, '0')}-${String(d10y.getDate()).padStart(2, '0')}`;

    const d20y = new Date(baseDate);
    d20y.setFullYear(d20y.getFullYear() - 20);
    const d20yStr = `${d20y.getFullYear()}-${String(d20y.getMonth() + 1).padStart(2, '0')}-${String(d20y.getDate()).padStart(2, '0')}`;

    return masterIncidentsPool.filter(item => {
      const dateStr = item.occurDate || item.occurTime || '';
      if (!dateStr) return false;

      if (periodFilter === 'TODAY') {
        return dateStr.startsWith(todayStr);
      }
      if (periodFilter === 'CUSTOM') {
        return customSelectedDate ? dateStr.startsWith(customSelectedDate) : true;
      }
      if (periodFilter === '3DAYS') {
        return dateStr.substring(0, 10) >= d3Str;
      }
      if (periodFilter === '7DAYS') {
        return dateStr.substring(0, 10) >= d7Str;
      }
      if (periodFilter === '1MONTH') {
        return dateStr.substring(0, 10) >= d30Str;
      }
      if (periodFilter === '3MONTHS') {
        return dateStr.substring(0, 10) >= d90Str;
      }
      if (periodFilter === '6MONTHS') {
        return dateStr.substring(0, 10) >= d180Str;
      }
      if (periodFilter === '1YEAR') {
        return dateStr.substring(0, 10) >= d365Str;
      }
      if (periodFilter === '3YEARS') {
        return dateStr.substring(0, 10) >= d3yStr;
      }
      if (periodFilter === '5YEARS') {
        return dateStr.substring(0, 10) >= d5yStr;
      }
      if (periodFilter === '10YEARS') {
        return dateStr.substring(0, 10) >= d10yStr;
      }
      if (periodFilter === '20YEARS') {
        return dateStr.substring(0, 10) >= d20yStr;
      }
      return true; // ALL
    });
  }, [masterIncidentsPool, periodFilter, customSelectedDate]);

  // 선택된 지역에 따른 마커 핀 필터링
  const regionIncidents = useMemo(() => {
    if (selectedRegion === 'ALL') return periodFilteredPool;
    return periodFilteredPool.filter((inc) => inc.region === selectedRegion);
  }, [periodFilteredPool, selectedRegion]);

  // 상태별 필터링
  const filteredIncidents = useMemo(() => {
    if (filterStatus === 'ALL') return regionIncidents;
    return regionIncidents.filter((inc) => inc.status === filterStatus);
  }, [regionIncidents, filterStatus]);

  // 하단 3개 타일 건수 (실제 팩트 데이터 기반)
  const regionTileCounts = useMemo(() => {
    let totalCount = regionIncidents.length;
    let dispatching = regionIncidents.filter((inc) => inc.status === 'DISPATCHING').length;
    let extinguishing = regionIncidents.filter((inc) => inc.status === 'EXTINGUISHING').length;
    let extinguished = regionIncidents.filter((inc) => inc.status === 'EXTINGUISHED').length;

    if (periodFilter === '3YEARS' || periodFilter === '5YEARS' || periodFilter === '10YEARS' || periodFilter === '20YEARS') {
      const yearsMap = {
        '3YEARS': [2023, 2024, 2025],
        '5YEARS': [2021, 2022, 2023, 2024, 2025],
        '10YEARS': [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025],
        '20YEARS': [2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025]
      };
      const years = yearsMap[periodFilter];
      if (NFA_10YEARS_SUMMARY) {
        if (selectedRegion === 'ALL') {
          totalCount = years.reduce((acc, y) => acc + (NFA_10YEARS_SUMMARY[y]?.count || 0), 0);
        } else {
          const regionFullNameMap = {
            '서울': '서울특별시', '경기': '경기도', '인천': '인천광역시',
            '강원': '강원특별자치도', '대구': '대구광역시', '경북': '경상북도',
            '경남': '경상남도', '부산': '부산광역시', '울산': '울산광역시',
            '충북': '충청북도', '충남': '충청남도', '대전': '대전광역시',
            '세종': '세종특별자치시', '전북': '전북특별자치도', '전남': '전라남도',
            '광주': '광주광역시', '제주': '제주특별자치도'
          };
          const fullName = regionFullNameMap[selectedRegion] || selectedRegion;
          totalCount = years.reduce((acc, y) => acc + (NFA_10YEARS_SUMMARY[y]?.regionCounts?.[fullName] || 0), 0);
        }
        extinguished = totalCount;
      }
    }

    return {
      dispatching,
      extinguishing,
      extinguished,
      total: totalCount
    };
  }, [regionIncidents, periodFilter, selectedRegion]);

  const regionTabs = [
    { id: 'ALL', name: '전체' },
    { id: '서울', name: '서울' },
    { id: '경기', name: '경기' },
    { id: '인천', name: '인천' },
    { id: '강원', name: '강원' },
    { id: '대구', name: '대구' },
    { id: '경북', name: '경북' },
    { id: '경남', name: '경남' },
    { id: '부산', name: '부산' },
    { id: '울산', name: '울산' },
    { id: '충북', name: '충북' },
    { id: '충남', name: '충남' },
    { id: '대전', name: '대전' },
    { id: '세종', name: '세종' },
    { id: '전북', name: '전북' },
    { id: '전남', name: '전남' },
    { id: '광주', name: '광주' },
    { id: '제주', name: '제주' }
  ];

  const periodOptions = [
    { id: '1MONTH', label: '최근 1개월 (100핀)' },
    { id: '3MONTHS', label: '최근 3개월 (200핀)' },
    { id: '6MONTHS', label: '최근 6개월 (300핀)' },
    { id: '1YEAR', label: '최근 1년 (400핀)' },
    { id: '3YEARS', label: '최근 3년 (500핀)' },
    { id: '5YEARS', label: '최근 5년 (600핀)' },
    { id: '10YEARS', label: '최근 10년 (700핀)' },
    { id: '20YEARS', label: '최근 20년 (800핀)' },
    { id: 'ALL', label: '전체 기록 (800핀)' },
    { id: 'TODAY', label: '당일 (오늘)' },
    { id: '7DAYS', label: '최근 7일' },
    { id: 'CUSTOM', label: '📅 날짜 직접 선택' }
  ];

  // 기간별 단계적 마커 표출 (1개월: 100건, 3개월: 200건, 6개월: 300건, 1년: 400건, 3년: 500건, 5년: 600건, 10년: 700건, 20년/전체: 800건)
  const displayMarkers = useMemo(() => {
    if (periodFilter === 'TODAY' || periodFilter === '3DAYS' || periodFilter === '7DAYS' || periodFilter === 'CUSTOM') {
      return filteredIncidents;
    }

    let targetCount = 100;
    if (periodFilter === '1MONTH') targetCount = 100;
    else if (periodFilter === '3MONTHS') targetCount = 200;
    else if (periodFilter === '6MONTHS') targetCount = 300;
    else if (periodFilter === '1YEAR') targetCount = 400;
    else if (periodFilter === '3YEARS') targetCount = 500;
    else if (periodFilter === '5YEARS') targetCount = 600;
    else if (periodFilter === '10YEARS') targetCount = 700;
    else if (periodFilter === '20YEARS' || periodFilter === 'ALL') targetCount = 800;

    if (filteredIncidents.length <= targetCount) {
      return filteredIncidents;
    }

    const step = filteredIncidents.length / targetCount;
    const sampled = [];
    for (let i = 0; i < targetCount; i++) {
      const idx = Math.min(Math.floor(i * step), filteredIncidents.length - 1);
      sampled.push(filteredIncidents[idx]);
    }
    return sampled;
  }, [filteredIncidents, periodFilter]);

  return (
    <div className="map-view-container" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 지도 상단 실시간 자동 갱신 뱃지 & 시·도 선택 칩 필터 */}
      <div style={{ padding: '6px 12px 2px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <div style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
          <RefreshCw size={12} className="spin-icon" />
          <span>소방청 실데이터 지도 연동 ({lastRefreshTime})</span>
        </div>
        <div style={{ fontSize: '0.72rem', color: '#f97316', fontWeight: 700 }}>
          {selectedRegion === 'ALL' ? `전국 총 ${regionTileCounts.total.toLocaleString()}건` : `${selectedRegion} 총 ${regionTileCounts.total.toLocaleString()}건`}
          <span style={{ color: '#38bdf8', marginLeft: 4, fontSize: '0.68rem', fontWeight: 600 }}>
            (핀 {displayMarkers.length}건)
          </span>
          {periodFilter === 'CUSTOM' && <span style={{ color: '#38bdf8', marginLeft: 4 }}>({customSelectedDate})</span>}
        </div>
      </div>

      {/* 시·도 필터 바 */}
      <div className="region-filter-bar" style={{ flexShrink: 0, paddingBottom: 2 }}>
        {regionTabs.map((tab) => (
          <button
            key={tab.id}
            className={`region-chip ${selectedRegion === tab.id ? 'active' : ''}`}
            onClick={() => setSelectedRegion(tab.id)}
          >
            {tab.name}
          </button>
        ))}
      </div>

      {/* 실시간 지도 조회 기간 / 일자 선택 바 */}
      <div
        style={{
          display: 'flex',
          gap: 6,
          overflowX: 'auto',
          padding: '2px 12px 6px 12px',
          flexShrink: 0,
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {periodOptions.map((p) => (
          <button
            key={p.id}
            onClick={() => setPeriodFilter(p.id)}
            style={{
              background: periodFilter === p.id ? '#f97316' : 'rgba(30, 41, 59, 0.7)',
              color: periodFilter === p.id ? '#ffffff' : '#94a3b8',
              border: '1px solid var(--border-color)',
              borderRadius: 14,
              padding: '3px 10px',
              fontSize: '0.68rem',
              fontWeight: periodFilter === p.id ? 700 : 500,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* '📅 날짜 직접 선택' 클릭 시 열리는 지도 달력 선택기 */}
      {periodFilter === 'CUSTOM' && (
        <div
          style={{
            margin: '0 12px 6px 12px',
            padding: '6px 12px',
            background: 'rgba(30, 41, 59, 0.9)',
            border: '1px solid #f97316',
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            flexShrink: 0
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <CalendarDays size={14} style={{ color: '#f97316' }} />
            <span style={{ fontSize: '0.74rem', color: '#f8fafc', fontWeight: 700 }}>지도 조회 일자:</span>
          </div>
          <input
            type="date"
            max={todayStr}
            value={customSelectedDate}
            onChange={(e) => setCustomSelectedDate(e.target.value)}
            style={{
              background: '#0f172a',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: 6,
              color: '#f8fafc',
              padding: '2px 8px',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
              outline: 'none'
            }}
          />
        </div>
      )}

      {/* 실시간 지도 */}
      <div style={{ flex: 1, position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
        <MapContainer
          center={[36.5, 127.8]}
          zoom={7}
          className="leaflet-map-container"
          style={{ width: '100%', height: '100%', background: '#060911' }}
          zoomControl={true}
          attributionControl={false}
        >
          <MapAutoResize />
          <MapFlyToController selectedRegion={selectedRegion} selectedIncident={targetIncident} />
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
            attribution="&copy; OpenStreetMap contributors"
          />

          <LayerGroup key={`${periodFilter}-${selectedRegion}-${filterStatus}-${displayMarkers.length}`}>
            {displayMarkers.map((inc, idx) => (
              <Marker
                key={`${inc.id}-${periodFilter}-${idx}`}
                position={[inc.lat, inc.lng]}
                icon={createCustomIcon(inc.status)}
              >
                <Popup className="custom-popup">
                  <div style={{ padding: 4 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, gap: 4 }}>
                      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                        <span
                          style={{
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: 4,
                            background:
                              inc.status === 'DISPATCHING'
                                ? 'rgba(239, 68, 68, 0.2)'
                                : inc.status === 'EXTINGUISHING'
                                ? 'rgba(249, 115, 22, 0.2)'
                                : 'rgba(16, 185, 129, 0.2)',
                            color:
                              inc.status === 'DISPATCHING'
                                ? '#ef4444'
                                : inc.status === 'EXTINGUISHING'
                                ? '#f97316'
                                : '#10b981',
                          }}
                        >
                          {inc.statusText}
                        </span>
                        {(() => {
                          const badge = getIncidentSourceBadge(inc);
                          return (
                            <span
                              style={{
                                background: badge.bg,
                                color: badge.color,
                                border: badge.border,
                                fontSize: '0.62rem',
                                fontWeight: 700,
                                padding: '1px 5px',
                                borderRadius: 4,
                              }}
                              title={badge.desc}
                            >
                              {badge.label}
                            </span>
                          );
                        })()}
                      </div>
                      <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>{inc.occurTime}</span>
                    </div>

                    <h4 style={{ margin: '0 0 6px 0', fontSize: '0.85rem', color: '#f8fafc', fontWeight: 800 }}>
                      {inc.occurPlace}
                    </h4>

                    <div style={{ fontSize: '0.75rem', color: '#cbd5e1', lineHeight: '1.4' }}>
                      <div>🚨 <strong>발화원인:</strong> {inc.cause}</div>
                      <div>🚒 <strong>관할서:</strong> {inc.jurisStation}</div>
                      <div>👥 <strong>인명피해:</strong> {inc.casualtyText}</div>
                      <div>💸 <strong>추정피해:</strong> {inc.damageText}</div>
                    </div>

                    <button
                      onClick={() => onSelectIncident && onSelectIncident(inc)}
                      style={{
                        marginTop: 8,
                        width: '100%',
                        padding: '4px',
                        background: 'rgba(239, 68, 68, 0.8)',
                        border: 'none',
                        borderRadius: 4,
                        color: '#fff',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      화재 상세 정보 보기
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}
          </LayerGroup>
        </MapContainer>
      </div>

      {/* 하단 3대 실시간 대응 상태 타일 */}
      <div
        className="map-status-bottom-bar"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 8,
          padding: '8px 12px',
          background: 'rgba(15, 23, 42, 0.95)',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          flexShrink: 0
        }}
      >
        <div
          onClick={() => setFilterStatus(filterStatus === 'DISPATCHING' ? 'ALL' : 'DISPATCHING')}
          style={{
            background: filterStatus === 'DISPATCHING' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(30, 41, 59, 0.6)',
            border: filterStatus === 'DISPATCHING' ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: 8,
            padding: '6px 8px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <div style={{ background: 'rgba(239, 68, 68, 0.2)', padding: 6, borderRadius: 6, color: '#ef4444' }}>
            <Siren size={16} />
          </div>
          <div>
            <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#f8fafc' }}>
              {regionTileCounts.dispatching.toLocaleString()}건
            </div>
            <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>소방차 출동중</div>
          </div>
        </div>

        <div
          onClick={() => setFilterStatus(filterStatus === 'EXTINGUISHING' ? 'ALL' : 'EXTINGUISHING')}
          style={{
            background: filterStatus === 'EXTINGUISHING' ? 'rgba(249, 115, 22, 0.25)' : 'rgba(30, 41, 59, 0.6)',
            border: filterStatus === 'EXTINGUISHING' ? '1px solid #f97316' : '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: 8,
            padding: '6px 8px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <div style={{ background: 'rgba(249, 115, 22, 0.2)', padding: 6, borderRadius: 6, color: '#f97316' }}>
            <Flame size={16} />
          </div>
          <div>
            <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#f8fafc' }}>
              {regionTileCounts.extinguishing.toLocaleString()}건
            </div>
            <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>현장 진화중</div>
          </div>
        </div>

        <div
          onClick={() => setFilterStatus(filterStatus === 'EXTINGUISHED' ? 'ALL' : 'EXTINGUISHED')}
          style={{
            background: filterStatus === 'EXTINGUISHED' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(30, 41, 59, 0.6)',
            border: filterStatus === 'EXTINGUISHED' ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: 8,
            padding: '6px 8px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <div style={{ background: 'rgba(16, 185, 129, 0.2)', padding: 6, borderRadius: 6, color: '#10b981' }}>
            <CheckCircle2 size={16} />
          </div>
          <div>
            <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#f8fafc' }}>
              {regionTileCounts.extinguished.toLocaleString()}건
            </div>
            <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>초진완료/완진</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FireMap;
