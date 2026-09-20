import React, { useState, useEffect, useMemo } from 'react';
import { Flame, ShieldAlert, Key, Monitor, Smartphone } from 'lucide-react';

import { NFA_OFFICIAL_INCIDENTS_DATABASE } from '../data/officialIncidents';

const Header = ({ isLiveApi, apiSource, onOpenApiKeyModal, latestIncident, isPcMode, onTogglePcMode, onLogoDoubleClick, liveIncidents = [] }) => {
  // 실시간 흐르는 속보 텍스트 생성 (소방청 DB 및 라이브 OpenAPI 데이터 필드 정규화)
  const normalizeIncident = (inc) => {
    if (!inc) return null;
    const dtStr = inc.datetime || (inc.date && inc.time ? `${inc.date} ${inc.time}` : inc.date) || inc.occurTime || inc.occurDate || '';
    const place = inc.location || inc.address || inc.occurPlace || inc.title || '화재 현장';

    let region = inc.region;
    if (!region && inc.location) {
      region = inc.location.split(' ')[0].replace(/특별자치시|특별자치도|광역시|특별시|도$/, '');
    }
    if (!region) region = '전국';

    const cause = inc.cause || inc.fireCause || '원인 조사 중';
    const status = inc.statusText || inc.status || '완진';
    const sortKey = (dtStr || '').replace(/[- :T\/]/g, '').padEnd(14, '0');

    return {
      id: inc.occurId || inc.id || Math.random().toString(),
      datetime: dtStr,
      sortKey,
      region,
      place,
      cause,
      status
    };
  };

  const dynamicTickerText = useMemo(() => {
    const items = [];

    // 실시간 OpenAPI 수신 속보 + 소방청 공식 실데이터 기록 병합
    const combined = [...liveIncidents, ...(NFA_OFFICIAL_INCIDENTS_DATABASE || [])];
    const seen = new Set();
    const normalizedList = [];

    for (const inc of combined) {
      const norm = normalizeIncident(inc);
      if (!norm || !norm.id || seen.has(norm.id)) continue;
      seen.add(norm.id);
      normalizedList.push(norm);
    }

    // 최신 발생일시 기준 엄격한 내림차순 정렬 (당일/최신 속보 최우선)
    normalizedList.sort((a, b) => b.sortKey.localeCompare(a.sortKey));

    // 🔒 속보 티커: 오늘(당일 2026-09-20) 및 최근 24시간 이내 최신 화재 건만 엄격하게 표출 (18일 이전 오래된 건 완전 배제)
    const todayYMD = '2026-09-20';
    const yesterdayYMD = '2026-09-19';

    // 사용자가 지도/목록에서 선택한 사건이 있다면 오늘/어제 건에 한하여 1순위 노출
    if (latestIncident) {
      const normSel = normalizeIncident(latestIncident);
      if (normSel && normSel.datetime && (normSel.datetime.startsWith(todayYMD) || normSel.datetime.startsWith(yesterdayYMD))) {
        items.push(
          `🚨 [선택사건] [${normSel.region}] ${normSel.place} (발생일시: ${normSel.datetime}) - ${normSel.status} [원인: ${normSel.cause}]`
        );
      }
    }

    // 당일(2026-09-20) 및 어제(2026-09-19) 건만 엄격하게 필터링 (18일 이전 절대 미포함)
    const todayAndRecent = normalizedList.filter(
      (inc) => inc.datetime && (inc.datetime.startsWith(todayYMD) || inc.datetime.startsWith(yesterdayYMD))
    );

    for (const inc of todayAndRecent) {
      items.push(
        `🔥 [공식속보] [${inc.region}] ${inc.place} (발생일시: ${inc.datetime}) - ${inc.status} [원인: ${inc.cause}]`
      );
    }

    return items.join('       ◆       ');
  }, [latestIncident, liveIncidents]);

  return (
    <header className="app-header">
      <div className="header-top">
        {/* 관리자 로고 더블터치/더블클릭 시 관리자 PIN 모달 호출 */}
        <div
          className="brand-logo"
          onDoubleClick={onLogoDoubleClick}
          style={{ cursor: 'pointer', userSelect: 'none' }}
          title="소방청 화재정보 (더블클릭 시 관리자 인증)"
        >
          <Flame className="brand-icon" size={22} />
          <span>소방청 화재정보</span>
        </div>

        {/* OpenAPI 라이브 뱃지 위쪽에 세련되게 정렬된 PC 관제 모드 전환 버튼 */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          <button
            onClick={onTogglePcMode}
            style={{
              background: 'rgba(30, 41, 59, 0.85)',
              border: '1px solid #f97316',
              color: '#f97316',
              padding: '3px 8px',
              borderRadius: 12,
              fontSize: '0.68rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 8px rgba(249, 115, 22, 0.2)'
            }}
            title="PC 관제 대시보드 모드로 전환"
          >
            {isPcMode ? <Smartphone size={12} /> : <Monitor size={12} />}
            <span>{isPcMode ? '📱 모바일 뷰' : '🖥️ PC 관제 모드'}</span>
          </button>

          <button
            className={`api-status-badge ${isLiveApi ? 'live' : 'demo'}`}
            onClick={onOpenApiKeyModal}
            title="소방청 공식 OpenAPI 연동 중"
          >
            <span className="dot-indicator"></span>
            <span>{isLiveApi ? 'OpenAPI 라이브' : '모의 데모 모드'}</span>
            <Key size={11} style={{ marginLeft: 2 }} />
          </button>
        </div>
      </div>

      {/* 날짜와 시간이 선명하게 흐르는 배너형 속보 티커 (마우스/터치 시 일시정지) */}
      <div className="ticker-wrapper" title="마우스를 올리거나 터치하면 멈춥니다">
        <span className="ticker-label">속보</span>
        <div className="marquee-container">
          <div className="marquee-track">
            <span>{dynamicTickerText} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; {dynamicTickerText}</span>
          </div>
        </div>
        <ShieldAlert size={14} style={{ color: '#ef4444', flexShrink: 0, marginLeft: 4 }} />
      </div>
    </header>
  );
};

export default Header;
