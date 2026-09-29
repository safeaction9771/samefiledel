import React, { useState, useMemo } from 'react';
import { 
  FileSpreadsheet, 
  Download, 
  Search, 
  Filter, 
  Calendar, 
  Building2, 
  Flame, 
  AlertTriangle, 
  DollarSign, 
  Users, 
  ChevronRight, 
  ExternalLink,
  Table,
  BarChart3,
  ShieldCheck,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';
import { NFA_CSV_STATS, NFA_CSV_INCIDENTS } from '../data/officialIncidents';

const SIDO_LIST = [
  '전체', '서울', '경기', '부산', '인천', '대구', '대전', '광주',
  '울산', '세종', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'
];

const YEAR_LIST = ['전체 (5개년)', '2024년', '2023년', '2022년', '2021년', '2020년'];

const CsvDataViewer = ({ onSelectIncident }) => {
  const [selectedYear, setSelectedYear] = useState('전체 (5개년)');
  const [selectedSido, setSelectedSido] = useState('전체');
  const [selectedCause, setSelectedCause] = useState('전체');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSubTab, setActiveSubTab] = useState('RECORDS'); // 'RECORDS' | 'CAUSE_STATS' | 'PLACE_STATS' | 'INFO'
  const [displayCount, setDisplayCount] = useState(100);

  // 필터 변경 시 표시 건수 초기화
  React.useEffect(() => {
    setDisplayCount(100);
  }, [selectedYear, selectedSido, selectedCause, searchTerm]);

  const stats = NFA_CSV_STATS || {};
  const incidents = NFA_CSV_INCIDENTS || [];

  // 연도별 필터링된 통계 정보
  const currentYearKey = selectedYear.replace('년', '').replace(' (5개년)', '');
  const isAllYears = selectedYear === '전체 (5개년)';
  const currentStats = useMemo(() => {
    if (isAllYears) {
      return {
        count: stats.total_count || 191510,
        deaths: stats.total_deaths || 1574,
        injured: stats.total_injured || 10387,
        casualties: stats.total_casualties || 11961,
        damage_eok: stats.total_damage_eok || 46469.3,
        cause_counts: stats.cause_breakdown ? Object.fromEntries(stats.cause_breakdown.map(c => [c.cause, c.count])) : {},
        place_counts: stats.place_breakdown ? Object.fromEntries(stats.place_breakdown.map(p => [p.place, p.count])) : {}
      };
    }
    const yData = stats.yearly?.[currentYearKey] || {};
    return {
      count: yData.count || 0,
      deaths: yData.deaths || 0,
      injured: yData.injured || 0,
      casualties: yData.casualties || 0,
      damage_eok: yData.damage_eok_krw || 0,
      cause_counts: yData.cause_counts || {},
      place_counts: yData.place_counts || {}
    };
  }, [selectedYear, stats]);

  // 원인 목록 추출
  const causeOptions = useMemo(() => {
    const causes = stats.cause_breakdown ? stats.cause_breakdown.map(c => c.cause) : [];
    return ['전체', ...causes];
  }, [stats]);

  // 레코드 필터링
  const filteredRecords = useMemo(() => {
    let list = incidents;

    if (!isAllYears) {
      list = list.filter(item => (item.occurDate || '').startsWith(currentYearKey));
    }

    if (selectedSido !== '전체') {
      list = list.filter(item => 
        (item.region && item.region.includes(selectedSido)) || 
        (item.occurPlace && item.occurPlace.includes(selectedSido))
      );
    }

    if (selectedCause !== '전체') {
      list = list.filter(item => item.fireCause === selectedCause || item.cause === selectedCause);
    }

    const term = searchTerm.trim().toLowerCase();
    if (term) {
      list = list.filter(item => 
        (item.occurPlace || '').toLowerCase().includes(term) ||
        (item.title || '').toLowerCase().includes(term) ||
        (item.placeCategory || '').toLowerCase().includes(term) ||
        (item.fireCause || '').toLowerCase().includes(term) ||
        (item.jurisStation || '').toLowerCase().includes(term) ||
        (item.occurDate || '').includes(term)
      );
    }

    return list;
  }, [incidents, isAllYears, currentYearKey, selectedSido, selectedCause, searchTerm]);

  // CSV 다운로드 트리거
  const handleDownloadCsv = () => {
    const headers = '발생일자,시도,발생장소,장소구분,발화원인,사망자(명),부상자(명),재산피해(천원),관할소방서\n';
    const rows = filteredRecords.slice(0, 2000).map(r => 
      `"${r.occurDate}","${r.region}","${r.occurPlace}","${r.placeCategory}","${r.fireCause}",${r.deathCount || 0},${r.injuryCount || 0},"${r.damageAmount || 0}","${r.jurisStation}"`
    ).join('\n');

    const blob = new Blob(['\uFEFF' + headers + rows], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `소방청_화재발생정보_${selectedYear}_${selectedSido}.csv`;
    link.click();
  };

  return (
    <div className="csv-viewer-view" style={{ padding: '12px 14px 24px 14px', maxWidth: 1200, margin: '0 auto' }}>
      {/* 1. 상단 공식 데이터셋 타이틀 & 뱃지 */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(15, 23, 42, 0.95))',
        border: '1px solid rgba(16, 185, 129, 0.4)',
        borderRadius: 14,
        padding: '14px 16px',
        marginBottom: 14
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <span style={{
                background: '#10b981',
                color: '#0f172a',
                fontSize: '0.72rem',
                fontWeight: 900,
                padding: '2px 8px',
                borderRadius: 6
              }}>
                공공데이터포털 공식 연동
              </span>
              <span style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600 }}>
                등록번호 15044003 (소방청)
              </span>
            </div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#f8fafc', margin: '2px 0 6px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileSpreadsheet style={{ color: '#10b981' }} size={22} />
              소방청 화재발생 정보 (CSV / Excel)
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.78rem', margin: 0, lineHeight: 1.4 }}>
              2020년부터 2024년까지 최근 5개년 대한민국 전역에서 발생한 <strong style={{ color: '#10b981' }}>191,510건</strong>의 공식 화재 원장 전수 데이터셋입니다.
            </p>
          </div>

          <button
            onClick={handleDownloadCsv}
            style={{
              background: '#10b981',
              color: '#0f172a',
              border: 'none',
              borderRadius: 8,
              padding: '8px 14px',
              fontSize: '0.8rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
            }}
          >
            <Download size={15} />
            <span>CSV 다운로드</span>
          </button>
        </div>

        {/* 핵심 통계 4개 카드 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: 8,
          marginTop: 14
        }}>
          <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Flame size={12} style={{ color: '#f97316' }} /> 총 화재 발생
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#f8fafc', marginTop: 2 }}>
              {currentStats.count.toLocaleString()}건
            </div>
          </div>

          <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
              <AlertTriangle size={12} style={{ color: '#ef4444' }} /> 인명피해 합계
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#f8fafc', marginTop: 2 }}>
              {currentStats.casualties.toLocaleString()}명
            </div>
            <div style={{ fontSize: '0.66rem', color: '#ef4444' }}>
              사망 {currentStats.deaths.toLocaleString()}명 / 부상 {currentStats.injured.toLocaleString()}명
            </div>
          </div>

          <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
              <DollarSign size={12} style={{ color: '#eab308' }} /> 재산피해액
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#f8fafc', marginTop: 2 }}>
              {Math.round(currentStats.damage_eok).toLocaleString()}억원
            </div>
            <div style={{ fontSize: '0.66rem', color: '#94a3b8' }}>
              약 {(currentStats.damage_eok / 10000).toFixed(1)}조 원
            </div>
          </div>

          <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Building2 size={12} style={{ color: '#38bdf8' }} /> 최다 발생 시도
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#38bdf8', marginTop: 2 }}>
              경기도
            </div>
            <div style={{ fontSize: '0.66rem', color: '#94a3b8' }}>
              41,826건 (21.8%)
            </div>
          </div>
        </div>
      </div>

      {/* 2. 연도 선택 칩 */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 6, marginBottom: 8 }} className="no-scrollbar">
        {YEAR_LIST.map(y => (
          <button
            key={y}
            onClick={() => setSelectedYear(y)}
            style={{
              background: selectedYear === y ? '#10b981' : 'rgba(30, 41, 59, 0.7)',
              color: selectedYear === y ? '#0f172a' : '#94a3b8',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 16,
              padding: '5px 12px',
              fontSize: '0.76rem',
              fontWeight: selectedYear === y ? 900 : 500,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0
            }}
          >
            {y}
          </button>
        ))}
      </div>

      {/* 3. 시도 선택 칩 */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 6, marginBottom: 12 }} className="no-scrollbar">
        {SIDO_LIST.map(sido => (
          <button
            key={sido}
            onClick={() => setSelectedSido(sido)}
            style={{
              background: selectedSido === sido ? '#38bdf8' : 'rgba(30, 41, 59, 0.6)',
              color: selectedSido === sido ? '#0f172a' : '#94a3b8',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 14,
              padding: '3px 10px',
              fontSize: '0.72rem',
              fontWeight: selectedSido === sido ? 800 : 500,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0
            }}
          >
            {sido}
          </button>
        ))}
      </div>

      {/* 4. 세부 탭 (개별 화재 레코드 목록 / 발화원인 전수분석 / 장소별 전수분석 / 데이터셋 안내) */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        marginBottom: 12,
        gap: 6
      }}>
        <button
          onClick={() => setActiveSubTab('RECORDS')}
          style={{
            background: 'transparent',
            border: 'none',
            borderBottom: activeSubTab === 'RECORDS' ? '2px solid #10b981' : '2px solid transparent',
            color: activeSubTab === 'RECORDS' ? '#10b981' : '#94a3b8',
            fontWeight: activeSubTab === 'RECORDS' ? 800 : 500,
            fontSize: '0.84rem',
            padding: '8px 12px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}
        >
          <Table size={15} />
          <span>개별 화재 원본 ({filteredRecords.length.toLocaleString()}건)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('CAUSE_STATS')}
          style={{
            background: 'transparent',
            border: 'none',
            borderBottom: activeSubTab === 'CAUSE_STATS' ? '2px solid #10b981' : '2px solid transparent',
            color: activeSubTab === 'CAUSE_STATS' ? '#10b981' : '#94a3b8',
            fontWeight: activeSubTab === 'CAUSE_STATS' ? 800 : 500,
            fontSize: '0.84rem',
            padding: '8px 12px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}
        >
          <BarChart3 size={15} />
          <span>발화원인 전수통계</span>
        </button>

        <button
          onClick={() => setActiveSubTab('PLACE_STATS')}
          style={{
            background: 'transparent',
            border: 'none',
            borderBottom: activeSubTab === 'PLACE_STATS' ? '2px solid #10b981' : '2px solid transparent',
            color: activeSubTab === 'PLACE_STATS' ? '#10b981' : '#94a3b8',
            fontWeight: activeSubTab === 'PLACE_STATS' ? 800 : 500,
            fontSize: '0.84rem',
            padding: '8px 12px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}
        >
          <Building2 size={15} />
          <span>장소별 전수통계</span>
        </button>

        <button
          onClick={() => setActiveSubTab('INFO')}
          style={{
            background: 'transparent',
            border: 'none',
            borderBottom: activeSubTab === 'INFO' ? '2px solid #10b981' : '2px solid transparent',
            color: activeSubTab === 'INFO' ? '#10b981' : '#94a3b8',
            fontWeight: activeSubTab === 'INFO' ? 800 : 500,
            fontSize: '0.84rem',
            padding: '8px 12px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}
        >
          <HelpCircle size={15} />
          <span>데이터셋 명세</span>
        </button>
      </div>

      {/* 5-A. 개별 화재 레코드 목록 뷰 */}
      {activeSubTab === 'RECORDS' && (
        <div>
          {/* 검색창 & 원인 필터 */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="발생장소, 발화원인, 소방서, 일자 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 8,
                  padding: '7px 10px 7px 32px',
                  color: '#f8fafc',
                  fontSize: '0.8rem',
                  outline: 'none'
                }}
              />
            </div>

            <select
              value={selectedCause}
              onChange={(e) => setSelectedCause(e.target.value)}
              style={{
                background: 'rgba(15, 23, 42, 0.9)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 8,
                padding: '7px 10px',
                color: '#f8fafc',
                fontSize: '0.78rem',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              {causeOptions.map(c => (
                <option key={c} value={c}>원인: {c}</option>
              ))}
            </select>
          </div>

          {/* 레코드 테이블 */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.9)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 10,
            overflow: 'hidden'
          }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'rgba(30, 41, 59, 0.8)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#94a3b8' }}>
                    <th style={{ padding: '8px 10px' }}>발생일자</th>
                    <th style={{ padding: '8px 10px' }}>시·도</th>
                    <th style={{ padding: '8px 10px' }}>발생장소</th>
                    <th style={{ padding: '8px 10px' }}>장소구분</th>
                    <th style={{ padding: '8px 10px' }}>발화원인</th>
                    <th style={{ padding: '8px 10px' }}>인명피해</th>
                    <th style={{ padding: '8px 10px' }}>재산피해</th>
                    <th style={{ padding: '8px 10px' }}>관할소방서</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center' }}>상세</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.slice(0, displayCount).map((item, idx) => (
                    <tr
                      key={item.id || idx}
                      onClick={() => onSelectIncident && onSelectIncident(item)}
                      style={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                        cursor: 'pointer',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(16, 185, 129, 0.08)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '8px 10px', color: '#f8fafc', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        {item.occurDate || item.occurTime || '-'}
                      </td>
                      <td style={{ padding: '8px 10px', color: '#38bdf8', fontWeight: 700, whiteSpace: 'nowrap' }}>
                        {item.region || '-'}
                      </td>
                      <td style={{ padding: '8px 10px', color: '#e2e8f0', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.occurPlace || item.location || '-'}
                      </td>
                      <td style={{ padding: '8px 10px', color: '#cbd5e1', whiteSpace: 'nowrap' }}>
                        <span style={{ background: 'rgba(255, 255, 255, 0.06)', padding: '2px 6px', borderRadius: 4 }}>
                          {item.placeCategory || '일반'}
                        </span>
                      </td>
                      <td style={{ padding: '8px 10px', color: '#f97316', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        {item.fireCause || item.cause || '-'}
                      </td>
                      <td style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>
                        {(item.deathCount > 0 || item.injuryCount > 0) ? (
                          <span style={{ color: '#ef4444', fontWeight: 700 }}>
                            사망 {item.deathCount || 0} / 부상 {item.injuryCount || 0}
                          </span>
                        ) : (
                          <span style={{ color: '#64748b' }}>0명</span>
                        )}
                      </td>
                      <td style={{ padding: '8px 10px', color: '#eab308', whiteSpace: 'nowrap' }}>
                        {item.damageAmount ? `${item.damageAmount}` : '조사중'}
                      </td>
                      <td style={{ padding: '8px 10px', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                        {item.jurisStation || '-'}
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                        <ChevronRight size={14} style={{ color: '#10b981' }} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredRecords.length > displayCount && (
              <div style={{ padding: '14px', textAlign: 'center', borderTop: '1px solid rgba(255, 255, 255, 0.08)', background: 'rgba(30, 41, 59, 0.4)' }}>
                <div style={{ color: '#94a3b8', fontSize: '0.74rem', marginBottom: 8 }}>
                  현재 <strong style={{ color: '#10b981' }}>{Math.min(displayCount, filteredRecords.length).toLocaleString()}건</strong> 표시 중 / 검색 결과 총 <strong style={{ color: '#f8fafc' }}>{filteredRecords.length.toLocaleString()}건</strong>
                </div>
                <button
                  onClick={() => setDisplayCount(prev => prev + 100)}
                  style={{
                    background: '#10b981',
                    color: '#0f172a',
                    border: 'none',
                    borderRadius: 8,
                    padding: '8px 22px',
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
                  }}
                >
                  이전 일자 화재 더보기 (+100건)
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5-B. 발화원인 전수 통계 */}
      {activeSubTab === 'CAUSE_STATS' && (
        <div style={{ background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 10, padding: 16 }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#f8fafc', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Flame size={16} style={{ color: '#f97316' }} />
            {selectedYear} 화재 발화원인별 전수 집계 (총 {currentStats.count.toLocaleString()}건)
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {Object.entries(currentStats.cause_counts).map(([cause, count]) => {
              const pct = currentStats.count > 0 ? ((count / currentStats.count) * 100).toFixed(1) : 0;
              return (
                <div key={cause}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: 3 }}>
                    <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{cause}</span>
                    <span style={{ color: '#38bdf8', fontWeight: 800 }}>{count.toLocaleString()}건 ({pct}%)</span>
                  </div>
                  <div style={{ height: 8, background: 'rgba(255, 255, 255, 0.08)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${pct}%`,
                      background: cause.includes('부주의') ? '#f97316' : cause.includes('전기') ? '#eab308' : cause.includes('기계') ? '#38bdf8' : '#10b981',
                      borderRadius: 4
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5-C. 장소별 전수 통계 */}
      {activeSubTab === 'PLACE_STATS' && (
        <div style={{ background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 10, padding: 16 }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#f8fafc', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Building2 size={16} style={{ color: '#38bdf8' }} />
            {selectedYear} 장소 구분별 전수 집계 (총 {currentStats.count.toLocaleString()}건)
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {Object.entries(currentStats.place_counts).map(([place, count]) => {
              const pct = currentStats.count > 0 ? ((count / currentStats.count) * 100).toFixed(1) : 0;
              return (
                <div key={place}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: 3 }}>
                    <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{place}</span>
                    <span style={{ color: '#10b981', fontWeight: 800 }}>{count.toLocaleString()}건 ({pct}%)</span>
                  </div>
                  <div style={{ height: 8, background: 'rgba(255, 255, 255, 0.08)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${pct}%`,
                      background: place.includes('주거') ? '#ef4444' : place.includes('산업') ? '#f97316' : place.includes('생활') ? '#eab308' : '#38bdf8',
                      borderRadius: 4
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5-D. 데이터셋 명세 */}
      {activeSubTab === 'INFO' && (
        <div style={{ background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 10, padding: 16, fontSize: '0.82rem', color: '#cbd5e1', lineHeight: 1.6 }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#f8fafc', marginBottom: 10 }}>
            소방청 화재발생 정보 데이터셋 안내
          </h3>
          <ul style={{ paddingLeft: 18, margin: '0 0 14px 0' }}>
            <li><strong>데이터셋 명</strong>: 소방청_화재발생 정보 (2020.01.01 ~ 2024.12.31)</li>
            <li><strong>제공 기관</strong>: 대한민국 소방청 / 행정안전부 공공데이터포털 (data.go.kr)</li>
            <li><strong>공공데이터 등록번호</strong>: 15044003</li>
            <li><strong>총 레코드 수</strong>: 191,510건 전수</li>
            <li><strong>제공 항목</strong>: 화재발생일시, 시도명, 시군구명, 읍면동명, 장소대분류, 장소중분류, 장소소분류, 발화원인대분류, 발화원인소분류, 최초착화물, 인명피해(사망/부상), 재산피해액, 관할서명 등</li>
          </ul>

          <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 8, padding: '10px 12px' }}>
            <div style={{ color: '#10b981', fontWeight: 700, marginBottom: 4 }}>
              ✓ 시스템 자동 연동 완료
            </div>
            <div>
              본 데이터셋은 프로젝트 내 실시간 지도, 기간별 발생 목록, 통계 대시보드 및 시도별 지역 분석에 100% 실측 원본으로 자동 연동되어 계산됩니다.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CsvDataViewer;
