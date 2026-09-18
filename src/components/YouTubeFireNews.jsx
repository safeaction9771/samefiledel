import React, { useState, useMemo } from 'react';
import {
  Flame,
  Search,
  Calendar,
  Clock,
  AlertTriangle,
  Building,
  Users,
  Video,
  Play,
  X,
  ExternalLink,
  Eye,
  CalendarDays,
  Radio,
  Tv,
  RotateCcw
} from 'lucide-react';
import youtubeNewsData from '../data/youtube_fire_news.json';
import { REGIONS } from '../data/officialIncidents';

// 주요 방송사 및 채널 필터 칩 목록
const BROADCASTERS = [
  '전체 방송사',
  'YTN',
  'KBS 뉴스',
  'SBS 뉴스',
  'MBC 뉴스',
  '연합뉴스TV',
  'JTBC 뉴스',
  'MBN 뉴스',
  '채널A 뉴스',
  '소방청TV'
];

const PERIOD_OPTIONS = [
  { id: '7DAYS', label: '7일간 (최근 일주일)' },
  { id: 'TODAY', label: '당일 (오늘)' },
  { id: '3DAYS', label: '3일간' },
  { id: '1MONTH', label: '1개월간' },
  { id: 'CUSTOM', label: '📅 날짜 직접 선택' },
  { id: 'ALL', label: '전체 영상' }
];

const YouTubeFireNews = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('전국 (전체)');
  const [selectedBroadcaster, setSelectedBroadcaster] = useState('전체 방송사');
  const [periodFilter, setPeriodFilter] = useState('7DAYS'); // 기본값: 최근 일주일간
  const [displayLimit, setDisplayLimit] = useState(30);
  const [playingVideo, setPlayingVideo] = useState(null);

  // 오늘 날짜 계산 (2026-09-19)
  const todayStr = useMemo(() => {
    const now = new Date(2026, 8, 19); // 2026-09-19
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }, []);

  const [customSelectedDate, setCustomSelectedDate] = useState(() => {
    const now = new Date(2026, 8, 19);
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  });

  // 기간 필터링 계산
  const filteredNews = useMemo(() => {
    const baseDate = new Date(2026, 8, 19, 23, 59, 59);

    const d3 = new Date(baseDate);
    d3.setDate(d3.getDate() - 2);
    const d3Str = `${d3.getFullYear()}-${String(d3.getMonth() + 1).padStart(2, '0')}-${String(d3.getDate()).padStart(2, '0')}`;

    const d7 = new Date(baseDate);
    d7.setDate(d7.getDate() - 6);
    const d7Str = `${d7.getFullYear()}-${String(d7.getMonth() + 1).padStart(2, '0')}-${String(d7.getDate()).padStart(2, '0')}`;

    const d30 = new Date(baseDate);
    d30.setDate(d30.getDate() - 29);
    const d30Str = `${d30.getFullYear()}-${String(d30.getMonth() + 1).padStart(2, '0')}-${String(d30.getDate()).padStart(2, '0')}`;

    return (youtubeNewsData || []).filter((item) => {
      const dateStr = item.date || item.datetime?.substring(0, 10) || '';

      // 1. 기간 필터
      if (periodFilter === 'TODAY' && dateStr !== todayStr) {
        return false;
      }
      if (periodFilter === '3DAYS' && dateStr < d3Str) {
        return false;
      }
      if (periodFilter === '7DAYS' && dateStr < d7Str) {
        return false;
      }
      if (periodFilter === '1MONTH' && dateStr < d30Str) {
        return false;
      }
      if (periodFilter === 'CUSTOM' && customSelectedDate && dateStr !== customSelectedDate) {
        return false;
      }

      // 2. 지역 필터
      if (selectedRegion !== '전국 (전체)') {
        const pureRegion = selectedRegion.replace(/특별자치시|특별자치도|광역시|특별시|도$/, '').trim();
        const itemRegion = (item.region || '').trim();
        const itemLoc = item.location || '';
        const itemTitle = item.title || '';
        if (itemRegion !== pureRegion && !itemLoc.includes(pureRegion) && !itemTitle.includes(pureRegion)) {
          return false;
        }
      }

      // 3. 방송사/채널 필터
      if (selectedBroadcaster !== '전체 방송사') {
        const itemChan = item.channel || '';
        const itemTitle = item.title || '';
        if (!itemChan.includes(selectedBroadcaster) && !itemTitle.includes(selectedBroadcaster)) {
          return false;
        }
      }

      // 4. 검색어 필터
      if (searchTerm.trim()) {
        const st = searchTerm.toLowerCase();
        const matchTitle = (item.title || '').toLowerCase().includes(st);
        const matchLoc = (item.location || '').toLowerCase().includes(st);
        const matchCause = (item.cause || '').toLowerCase().includes(st);
        const matchChan = (item.channel || '').toLowerCase().includes(st);
        if (!matchTitle && !matchLoc && !matchCause && !matchChan) {
          return false;
        }
      }

      return true;
    });
  }, [periodFilter, selectedRegion, selectedBroadcaster, searchTerm, customSelectedDate, todayStr]);

  const visibleCards = filteredNews.slice(0, displayLimit);

  return (
    <div className="tab-panel-container" style={{ padding: '12px 14px 80px 14px', maxWidth: 860, margin: '0 auto' }}>
      {/* 🔴 상단 배너 타이틀 */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.22) 0%, rgba(15, 23, 42, 0.9) 100%)',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          borderRadius: 16,
          padding: '14px 16px',
          marginBottom: 12,
          boxShadow: '0 4px 20px rgba(220, 38, 38, 0.15)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(239, 68, 68, 0.5)'
              }}
            >
              <Tv size={18} color="#ffffff" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.02rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
                유튜브 실시간 화재 뉴스
              </h2>
              <p style={{ fontSize: '0.72rem', color: '#fca5a5', margin: '2px 0 0 0' }}>
                KBS·YTN·SBS·MBC·연합뉴스 등 최근 일주일간 방송 뉴스 영상
              </p>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                background: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid #ef4444',
                color: '#f87171',
                padding: '3px 8px',
                borderRadius: 20,
                fontSize: '0.68rem',
                fontWeight: 700
              }}
            >
              <Radio size={11} className="animate-pulse" /> 라이브 연동
            </span>
          </div>
        </div>
      </div>

      {/* 🔍 검색창 */}
      <div style={{ position: 'relative', marginBottom: 10 }}>
        <input
          type="text"
          className="search-input"
          placeholder="화재 위치, 사고 건물, 방송사, 원인 등 영상 검색..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 38px 10px 36px',
            background: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: 12,
            color: '#f8fafc',
            fontSize: '0.82rem',
            outline: 'none'
          }}
        />
        <Search
          size={16}
          style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            style={{
              position: 'absolute',
              right: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer'
            }}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* 📍 17개 시도 선택 칩 바 */}
      <div style={{ marginBottom: 8 }}>
        <div className="filter-chips" style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
          {REGIONS.map((region) => (
            <button
              key={region}
              className={`chip ${selectedRegion === region ? 'active' : ''}`}
              onClick={() => setSelectedRegion(region)}
              style={{
                background: selectedRegion === region ? '#ef4444' : 'rgba(30, 41, 59, 0.8)',
                border: selectedRegion === region ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.08)',
                color: selectedRegion === region ? '#ffffff' : '#94a3b8',
                padding: '4px 10px',
                borderRadius: 20,
                fontSize: '0.72rem',
                fontWeight: selectedRegion === region ? 700 : 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
            >
              {region}
            </button>
          ))}
        </div>
      </div>

      {/* 📺 방송사/채널 선택 칩 바 */}
      <div style={{ marginBottom: 10 }}>
        <div className="filter-chips" style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
          {BROADCASTERS.map((chan) => (
            <button
              key={chan}
              className={`chip ${selectedBroadcaster === chan ? 'active' : ''}`}
              onClick={() => setSelectedBroadcaster(chan)}
              style={{
                background: selectedBroadcaster === chan ? 'rgba(56, 189, 248, 0.25)' : 'rgba(15, 23, 42, 0.7)',
                border: selectedBroadcaster === chan ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.06)',
                color: selectedBroadcaster === chan ? '#38bdf8' : '#64748b',
                padding: '3px 9px',
                borderRadius: 8,
                fontSize: '0.68rem',
                fontWeight: selectedBroadcaster === chan ? 700 : 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
            >
              {chan}
            </button>
          ))}
        </div>
      </div>

      {/* 📅 기간 선택 버튼 바 */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
          {PERIOD_OPTIONS.map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriodFilter(p.id)}
              style={{
                background: periodFilter === p.id ? 'rgba(239, 68, 68, 0.2)' : 'rgba(15, 23, 42, 0.7)',
                border: periodFilter === p.id ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.08)',
                color: periodFilter === p.id ? '#f87171' : '#94a3b8',
                padding: '4px 10px',
                borderRadius: 8,
                fontSize: '0.72rem',
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
      </div>

      {/* 📅 날짜 직접 선택 달력 */}
      {periodFilter === 'CUSTOM' && (
        <div
          style={{
            marginTop: 4,
            marginBottom: 10,
            padding: '10px 14px',
            background: 'rgba(30, 41, 59, 0.85)',
            border: '1px solid #ef4444',
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <CalendarDays size={16} style={{ color: '#ef4444' }} />
            <span style={{ fontSize: '0.78rem', color: '#f8fafc', fontWeight: 700 }}>조회 희망 날짜:</span>
          </div>
          <input
            type="date"
            max={todayStr}
            value={customSelectedDate}
            onChange={(e) => setCustomSelectedDate(e.target.value)}
            style={{
              background: '#0f172a',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: 8,
              color: '#f8fafc',
              padding: '4px 10px',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              outline: 'none'
            }}
          />
        </div>
      )}

      {/* 📊 목록 헤더 건수 바 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, marginBottom: 8 }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Flame size={16} style={{ color: '#ef4444' }} />
          <span>
            유튜브 화재 뉴스 목록 ({selectedRegion})
            {periodFilter === '7DAYS' && ' - 최근 7일'}
            {periodFilter === 'TODAY' && ' - 오늘'}
            {periodFilter === '3DAYS' && ' - 최근 3일'}
            {periodFilter === 'CUSTOM' && customSelectedDate ? ` - ${customSelectedDate}` : ''}
          </span>
        </div>
        <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#ef4444' }}>
          총 {filteredNews.length.toLocaleString()}건
        </div>
      </div>

      {/* 🎴 상세 카드 목록 (발생 정보 목록과 완벽히 동일한 카드 레이아웃 + 영상 미리보기) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {visibleCards.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '36px 16px',
              background: 'rgba(15, 23, 42, 0.85)',
              border: '1px dashed rgba(255, 255, 255, 0.15)',
              borderRadius: 16
            }}
          >
            <Video size={36} style={{ color: '#ef4444', margin: '0 auto 10px auto' }} />
            <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#f8fafc', marginBottom: 6 }}>
              선택하신 조건의 유튜브 화재 뉴스가 없습니다
            </h4>
            <p style={{ fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.6, maxWidth: 360, margin: '0 auto 14px auto' }}>
              기간 또는 지역 필터를 변경하시거나 '전체 기간'으로 조회해보세요.
            </p>
            <button
              onClick={() => {
                setPeriodFilter('7DAYS');
                setSelectedRegion('전국 (전체)');
                setSelectedBroadcaster('전체 방송사');
                setSearchTerm('');
              }}
              style={{
                background: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid #ef4444',
                color: '#f87171',
                padding: '6px 14px',
                borderRadius: 8,
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              🔄 최근 7일 전체 뉴스 보기
            </button>
          </div>
        ) : (
          visibleCards.map((item, idx) => (
            <div
              key={item.id || idx}
              className="glass-card clickable-card"
              onClick={() => setPlayingVideo(item)}
              style={{
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                position: 'relative',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}
              title="클릭하여 영상 시청 및 상세 정보 보기"
            >
              {/* 상단 뱃지 라인 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span
                    style={{
                      background: 'rgba(239, 68, 68, 0.15)',
                      color: '#ef4444',
                      padding: '2px 8px',
                      borderRadius: 4,
                      fontSize: '0.72rem',
                      fontWeight: 700
                    }}
                  >
                    {item.region} #{idx + 1}
                  </span>

                  {/* 방송사 배지 */}
                  <span
                    style={{
                      background: 'rgba(220, 38, 38, 0.15)',
                      color: '#f87171',
                      border: '1px solid rgba(220, 38, 38, 0.3)',
                      padding: '1px 7px',
                      borderRadius: 4,
                      fontSize: '0.66rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 3
                    }}
                  >
                    <Tv size={10} />
                    {item.channel}
                  </span>

                  {/* 완진/진화중 배지 */}
                  <span
                    style={{
                      background: item.statusText === '완진' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                      color: item.statusText === '완진' ? '#34d399' : '#fbbf24',
                      border: item.statusText === '완진' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)',
                      padding: '1px 6px',
                      borderRadius: 4,
                      fontSize: '0.66rem',
                      fontWeight: 700
                    }}
                  >
                    {item.statusText || '완진'}
                  </span>
                </div>

                <span style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 600, whiteSpace: 'nowrap' }}>
                  <Clock size={12} style={{ display: 'inline', marginRight: 3 }} />
                  {item.datetime || item.date}
                </span>
              </div>

              {/* 뉴스 제목 */}
              <h4
                style={{
                  fontSize: '0.92rem',
                  fontWeight: 800,
                  color: '#f8fafc',
                  marginBottom: 8,
                  lineHeight: 1.4
                }}
              >
                📍 {item.title}
              </h4>

              {/* 유튜브 썸네일 미리보기 프리뷰 (재생 버튼 오버레이) */}
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  aspectRatio: '16/9',
                  borderRadius: 10,
                  overflow: 'hidden',
                  marginBottom: 10,
                  background: '#0f172a',
                  border: '1px solid rgba(255, 255, 255, 0.08)'
                }}
              >
                <img
                  src={item.thumbnail}
                  alt={item.title}
                  loading="lazy"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transition: 'transform 0.3s ease'
                  }}
                  onError={(e) => {
                    e.target.src = `https://img.youtube.com/vi/${item.videoId}/mqdefault.jpg`;
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.1) 60%, transparent 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: '50%',
                      background: 'rgba(239, 68, 68, 0.9)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 14px rgba(239, 68, 68, 0.6)',
                      transition: 'transform 0.2s ease'
                    }}
                  >
                    <Play size={20} color="#ffffff" style={{ marginLeft: 3 }} />
                  </div>
                </div>
                {/* 썸네일 우측 하단 영상 길이 & 조회수 배지 */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: 6,
                    right: 8,
                    background: 'rgba(0, 0, 0, 0.8)',
                    color: '#ffffff',
                    padding: '2px 6px',
                    borderRadius: 4,
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <span>⏱️ {item.duration || '01:30'}</span>
                  {item.views && <span>👁️ {item.views}</span>}
                </div>
              </div>

              {/* 2x2 상세 그리드 정보 (발생정보 탭과 100% 동일) */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, fontSize: '0.78rem', color: '#cbd5e1' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <AlertTriangle size={14} style={{ color: '#f59e0b', flexShrink: 0 }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    원인: {item.fireCause || item.cause}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Building size={14} style={{ color: '#38bdf8', flexShrink: 0 }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    출처: {item.channel}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Users size={14} style={{ color: '#ef4444', flexShrink: 0 }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    인명피해: {item.casualtyText || '조사 중'}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Flame size={14} style={{ color: '#f97316', flexShrink: 0 }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    추정피해: {item.damageAmount || '조사 중'}
                  </span>
                </div>
              </div>

              {/* 카드 하단 액션 버튼 */}
              <div style={{ marginTop: 8, paddingTop: 6, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                  {item.publishedText || item.datetime}
                </span>
                <span style={{ fontSize: '0.72rem', color: '#ef4444', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Play size={12} fill="#ef4444" /> 영상 바로보기 &rsaquo;
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 더 보기 버튼 */}
      {displayLimit < filteredNews.length && (
        <button
          onClick={() => setDisplayLimit((prev) => prev + 30)}
          className="btn-primary"
          style={{
            width: '100%',
            marginTop: 14,
            padding: '12px',
            background: 'rgba(30, 41, 59, 0.9)',
            border: '1px solid #ef4444',
            color: '#f87171',
            borderRadius: 12,
            fontSize: '0.82rem',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          유튜브 화재 뉴스 더 보기 ({displayLimit} / {filteredNews.length}건)
        </button>
      )}

      {/* 🎬 유튜브 영상 재생 팝업 모달 */}
      {playingVideo && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16
          }}
          onClick={() => setPlayingVideo(null)}
        >
          <div
            style={{
              background: '#0f172a',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: 18,
              width: '100%',
              maxWidth: 640,
              overflow: 'hidden',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.8)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 모달 상단 헤더 */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 16px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                background: 'rgba(30, 41, 59, 0.6)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Tv size={16} color="#ef4444" />
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#f8fafc' }}>
                  {playingVideo.channel} 화재 보도 영상
                </span>
              </div>
              <button
                onClick={() => setPlayingVideo(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: 4
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* 유튜브 반응형 임베드 플레이어 */}
            <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', background: '#000' }}>
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${playingVideo.videoId}?autoplay=1`}
                title={playingVideo.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%'
                }}
              />
            </div>

            {/* 영상 상세 정보 */}
            <div style={{ padding: 16 }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#f8fafc', marginBottom: 8, lineHeight: 1.4 }}>
                {playingVideo.title}
              </h3>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                <span
                  style={{
                    background: 'rgba(239, 68, 68, 0.15)',
                    color: '#f87171',
                    padding: '2px 8px',
                    borderRadius: 6,
                    fontSize: '0.72rem',
                    fontWeight: 700
                  }}
                >
                  📍 {playingVideo.region}
                </span>
                <span
                  style={{
                    background: 'rgba(56, 189, 248, 0.15)',
                    color: '#38bdf8',
                    padding: '2px 8px',
                    borderRadius: 6,
                    fontSize: '0.72rem',
                    fontWeight: 700
                  }}
                >
                  🕒 {playingVideo.datetime || playingVideo.date}
                </span>
                <span
                  style={{
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: '#34d399',
                    padding: '2px 8px',
                    borderRadius: 6,
                    fontSize: '0.72rem',
                    fontWeight: 700
                  }}
                >
                  {playingVideo.statusText || '완진'}
                </span>
              </div>

              {playingVideo.description && (
                <p
                  style={{
                    fontSize: '0.78rem',
                    color: '#94a3b8',
                    lineHeight: 1.6,
                    background: 'rgba(30, 41, 59, 0.5)',
                    padding: '10px 12px',
                    borderRadius: 8,
                    marginBottom: 14,
                    maxHeight: 100,
                    overflowY: 'auto'
                  }}
                >
                  {playingVideo.description}
                </p>
              )}

              {/* 하단 버튼 */}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <a
                  href={playingVideo.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    background: '#ef4444',
                    color: '#ffffff',
                    padding: '8px 14px',
                    borderRadius: 8,
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    textDecoration: 'none'
                  }}
                >
                  <ExternalLink size={14} /> YouTube 앱으로 열기
                </a>
                <button
                  onClick={() => setPlayingVideo(null)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#cbd5e1',
                    padding: '8px 14px',
                    borderRadius: 8,
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default YouTubeFireNews;
