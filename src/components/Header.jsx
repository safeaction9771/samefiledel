import React, { useState, useEffect, useMemo } from 'react';
import { Flame, ShieldAlert, Key, Monitor, Smartphone } from 'lucide-react';

import { NFA_OFFICIAL_INCIDENTS_DATABASE } from '../data/officialIncidents';

const Header = ({ isLiveApi, apiSource, onOpenApiKeyModal, latestIncident, isPcMode, onTogglePcMode, onLogoDoubleClick, liveIncidents = [] }) => {
  // 실시간 흐르는 속보 텍스트 생성 (날짜 및 시간 완벽 포함)
  const dynamicTickerText = useMemo(() => {
    const items = [];

    // 사용자가 지도/목록에서 선택한 사건이 있다면 1순위로 즉시 노출
    if (latestIncident) {
      items.push(
        `🚨 [선택사건] [${latestIncident.region || '전국'}] ${latestIncident.occurPlace || latestIncident.title || '화재'} (발생일시: ${latestIncident.occurDate || latestIncident.occurTime || ''}) - ${latestIncident.statusText || '완진'} [원인: ${latestIncident.fireCause || latestIncident.cause || '조사 중'}]`
      );
    }

    // 실시간 OpenAPI 수신 속보 + 소방청 공식 실데이터 기록 병합
    const combined = [...liveIncidents, ...(NFA_OFFICIAL_INCIDENTS_DATABASE || [])];
    const seen = new Set();
    const uniqueList = [];
    for (const inc of combined) {
      const id = inc.occurId || inc.id;
      if (!id || seen.has(id)) continue;
      seen.add(id);
      uniqueList.push(inc);
    }

    // 최신 발생일시(occurTime / occurDate) 기준 엄격한 내림차순 정렬 (당일/최신 속보 최우선)
    uniqueList.sort((a, b) => {
      const timeA = (a.occurTime || a.occurDate || '').replace(/[- :]/g, '');
      const timeB = (b.occurTime || b.occurDate || '').replace(/[- :]/g, '');
      return timeB.localeCompare(timeA);
    });

    const recentIncidents = uniqueList.slice(0, 20);
    for (const inc of recentIncidents) {
      items.push(
        `🔥 [공식속보] [${inc.region}] ${inc.occurPlace} (발생일시: ${inc.occurDate || inc.occurTime || ''}) - ${inc.statusText || '완진'} [원인: ${inc.fireCause || inc.cause || '조사 중'}]`
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
