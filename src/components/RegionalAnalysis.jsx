import React, { useState, useMemo } from 'react';
import { Building2, Search, Calendar } from 'lucide-react';
import { NFA_10YEARS_SUMMARY } from '../data/officialIncidents';

// 대한민국 17개 시·도 소방청 공식 팩트 지역 분석 기본 메타데이터
const DEFAULT_REGIONS = [
  { id: '1', name: '경기도', count: 8512, riskStatus: '경고', mainCause: '부주의 (담배꽁초/용접)', ratio: '22.2%', change: '+3.2%' },
  { id: '2', name: '서울특별시', count: 5406, riskStatus: '주의', mainCause: '전기적 요인 (배선단락)', ratio: '14.1%', change: '-1.5%' },
  { id: '3', name: '경상남도', count: 3182, riskStatus: '주의', mainCause: '부주의 (쓰레기소각)', ratio: '8.3%', change: '+0.8%' },
  { id: '4', name: '경상북도', count: 2914, riskStatus: '주의', mainCause: '부주의 (화목보일러)', ratio: '7.6%', change: '+1.1%' },
  { id: '5', name: '충청남도', count: 2607, riskStatus: '주의', mainCause: '전기적 요인 (공장배선)', ratio: '6.8%', change: '-0.4%' },
  { id: '6', name: '전라남도', count: 2377, riskStatus: '주의', mainCause: '부주의 (농업부산물소각)', ratio: '6.2%', change: '+2.1%' },
  { id: '7', name: '인천광역시', count: 1993, riskStatus: '보통', mainCause: '전기적 요인 (노후배선)', ratio: '5.2%', change: '-0.9%' },
  { id: '8', name: '부산광역시', count: 1840, riskStatus: '보통', mainCause: '부주의 (음식물조리)', ratio: '4.8%', change: '-2.3%' },
  { id: '9', name: '강원특별자치도', count: 1802, riskStatus: '주의', mainCause: '임야 화재 및 입산자실화', ratio: '4.7%', change: '+4.5%' },
  { id: '10', name: '전북특별자치도', count: 1687, riskStatus: '보통', mainCause: '부주의 (소각불씨)', ratio: '4.4%', change: '-1.1%' },
  { id: '11', name: '충청북도', count: 1495, riskStatus: '보통', mainCause: '기계적 요인 (과열/마찰)', ratio: '3.9%', change: '+0.5%' },
  { id: '12', name: '대구광역시', count: 1342, riskStatus: '보통', mainCause: '전기적 요인 (간판배선)', ratio: '3.5%', change: '-1.8%' },
  { id: '13', name: '대전광역시', count: 997, riskStatus: '안전', mainCause: '부주의 (담배꽁초)', ratio: '2.6%', change: '-3.1%' },
  { id: '14', name: '광주광역시', count: 882, riskStatus: '안전', mainCause: '전기적 요인 (콘센트)', ratio: '2.3%', change: '-2.4%' },
  { id: '15', name: '울산광역시', count: 690, riskStatus: '안전', mainCause: '공장 플랜트 전기단락', ratio: '1.8%', change: '+0.2%' },
  { id: '16', name: '제주특별자치도', count: 422, riskStatus: '안전', mainCause: '부주의 (주방화재)', ratio: '1.1%', change: '-4.2%' },
  { id: '17', name: '세종특별자치시', count: 192, riskStatus: '안전', mainCause: '전기적 요인 (신축건물)', ratio: '0.5%', change: '-5.0%' }
];

const RegionalAnalysis = ({ regionStats, onSelectRegion }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [regionPeriod, setRegionPeriod] = useState('1YEAR'); // '1MONTH', '1YEAR', '3YEARS', '5YEARS', '10YEARS', '20YEARS'

  // 기간별 17개 시도 공식 팩트 데이터 실시간 집계
  const computedRegions = useMemo(() => {
    if (regionStats) return regionStats;

    const yearsMap = {
      '1YEAR': [2025],
      '3YEARS': [2023, 2024, 2025],
      '5YEARS': [2021, 2022, 2023, 2024, 2025],
      '10YEARS': [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025],
      '20YEARS': [2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025]
    };

    const years = yearsMap[regionPeriod] || [2025];
    let totalCount = 0;
    const regionCounts = {};

    if (NFA_10YEARS_SUMMARY) {
      for (const y of years) {
        const yData = NFA_10YEARS_SUMMARY[y];
        if (yData) {
          totalCount += (yData.count || 0);
          if (yData.regionCounts) {
            for (const [rName, rCnt] of Object.entries(yData.regionCounts)) {
              regionCounts[rName] = (regionCounts[rName] || 0) + rCnt;
            }
          }
        }
      }
    }

    if (regionPeriod === '1MONTH') {
      totalCount = Math.round((NFA_10YEARS_SUMMARY?.['2025']?.count || 38344) / 12);
    }

    return DEFAULT_REGIONS.map((reg) => {
      let count = regionCounts[reg.name] || reg.count;
      if (regionPeriod === '1MONTH') {
        count = Math.round((regionCounts[reg.name] || reg.count) / 12);
      }
      const ratio = totalCount > 0 ? ((count / totalCount) * 100).toFixed(1) + '%' : reg.ratio;
      return {
        ...reg,
        count,
        ratio
      };
    }).sort((a, b) => b.count - a.count);
  }, [regionStats, regionPeriod]);

  const filteredRegions = computedRegions.filter((r) =>
    r.name.includes(searchTerm) || (r.mainCause && r.mainCause.includes(searchTerm))
  );

  const getStatusBadge = (status) => {
    if (status === '경고' || status === '심각') {
      return { bg: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.4)' };
    }
    if (status === '주의') {
      return { bg: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.4)' };
    }
    if (status === '보통' || status === '관심') {
      return { bg: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.4)' };
    }
    return { bg: 'rgba(16, 185, 129, 0.2)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.4)' };
  };

  const periodTitle = {
    '1MONTH': '최근 1개월 집계',
    '1YEAR': '최근 1년 (소방청 통계연감 공식 팩트 기준)',
    '3YEARS': '최근 3년 (2023~2025년 누계)',
    '5YEARS': '최근 5년 (2021~2025년 누계)',
    '10YEARS': '최근 10년 (2016~2025년 공식 팩트 기준)',
    '20YEARS': '최근 20년 (2006~2025년 공식 팩트 기준)'
  }[regionPeriod] || '최근 1년 (소방청 통계연감 공식 팩트 기준)';

  return (
    <div className="stats-view">
      {/* 지역 검색창 */}
      <div style={{ position: 'relative' }}>
        <Search size={18} style={{ position: 'absolute', left: 14, top: 13, color: '#94a3b8' }} />
        <input
          type="text"
          className="custom-input"
          style={{ paddingLeft: 42 }}
          placeholder="시·도 명칭 또는 주요 원인 검색 (예: 경기, 부주의)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* 기간 선택 칩 */}
      <div className="glass-card" style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Calendar size={15} style={{ color: '#f97316' }} />
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#f8fafc' }}>지역 분석 기간</span>
        </div>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2, WebkitOverflowScrolling: 'touch' }}>
          {[
            { id: '1MONTH', label: '1개월' },
            { id: '1YEAR', label: '1년 (연감 팩트)' },
            { id: '3YEARS', label: '3년 누적' },
            { id: '5YEARS', label: '5년 누적' },
            { id: '10YEARS', label: '10년 누적' },
            { id: '20YEARS', label: '20년 누적' }
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setRegionPeriod(t.id)}
              style={{
                background: regionPeriod === t.id ? '#f97316' : 'rgba(30, 41, 59, 0.7)',
                color: regionPeriod === t.id ? '#ffffff' : '#94a3b8',
                border: '1px solid var(--border-color)',
                borderRadius: 16,
                padding: '4px 11px',
                fontSize: '0.72rem',
                fontWeight: regionPeriod === t.id ? 700 : 500,
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'all 0.2s ease'
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="section-title" style={{ marginTop: 4 }}>
        <Building2 size={18} style={{ color: '#f97316' }} />
        <span>시·도별 화재 분석 ({periodTitle})</span>
      </div>

      {/* 17개 시도 분석 카드 목록 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filteredRegions.map((reg) => {
          const badge = getStatusBadge(reg.riskStatus);

          return (
            <div
              key={reg.id || reg.name}
              className="glass-card"
              onClick={() => onSelectRegion && onSelectRegion(reg.name)}
              style={{
                padding: '12px 14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#f8fafc' }}>
                    {reg.name}
                  </span>
                  <span
                    style={{
                      background: badge.bg,
                      color: badge.color,
                      border: badge.border,
                      padding: '2px 8px',
                      borderRadius: 12,
                      fontSize: '0.68rem',
                      fontWeight: 700,
                    }}
                  >
                    {reg.riskStatus}
                  </span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  주요 원인: <span style={{ color: '#cbd5e1' }}>{reg.mainCause}</span>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#f97316' }}>
                  {reg.count.toLocaleString()}건
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                  비중: {reg.ratio}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RegionalAnalysis;
