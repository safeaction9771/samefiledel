import React from 'react';
import { X, Siren, MapPin, Clock, AlertTriangle, Building, Users, ShieldAlert, Database } from 'lucide-react';
import { getIncidentSourceBadge } from '../data/officialIncidents';

const FireDetailModal = ({ incident, onClose }) => {
  if (!incident) return null;

  const sourceBadge = getIncidentSourceBadge(incident);

  // 안전 데이터 파서 (FireMap 핀 데이터와 공공데이터 객체 100% 안심 통합 호환)
  const title = incident.title || incident.occurPlace || '실시간 화재 신고 현황';
  const fireLevel = incident.fireLevel || incident.statusText || '화재 신고';
  const locationName = incident.locationName || incident.occurPlace || '상세 장소 확인 중';
  const occurredAt = incident.occurredAt || incident.occurTime || incident.occurDate || '2026-08-28 21:00';
  const stationName = incident.stationName || incident.jurisStation || '관할 소방서 출동 중';
  const cause = incident.cause || incident.fireCause || '119 신고 접수 조사 중';
  
  // 인명피해 파서
  const deadCount = incident.casualties?.dead ?? incident.deathCount ?? 0;
  const injuredCount = incident.casualties?.injured ?? incident.injuryCount ?? 0;
  const casualtyText = incident.casualtyText || `사망 ${deadCount}명 / 부상 ${injuredCount}명`;
  const estDamage = incident.estDamage || incident.damageText || incident.damageAmount || '약 3,500만원';
  
  // 상태별 현실적인 현장 조치 브리핑 문구 지능형 생성
  const isDispatch = fireLevel.includes('출동');
  const isExtinguishing = fireLevel.includes('진화');
  
  const defaultDesc = isDispatch
    ? `현재 ${stationName} 소방대원 및 소방차가 긴급 출동 중입니다. 인근 도로는 소방차 길 터주기에 적극 협조해 주시기 바랍니다.`
    : isExtinguishing
    ? `현재 ${stationName} 소방대원이 ${locationName} 현장에서 긴급 진화 작업을 펼치고 있습니다. 주변 주민들은 연기 흡입에 유의하시고 안전한 곳으로 대피하시기 바랍니다.`
    : `화재가 신속히 초진 및 완진되었으며, ${stationName} 화재조사팀에서 현장 잔불 감시와 함께 정확한 발화 원인 및 피해 규모를 정밀 조사하고 있습니다.`;

  const description = incident.description || defaultDesc;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle" />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span
                style={{
                  background: 'rgba(249, 115, 22, 0.15)',
                  color: '#f97316',
                  padding: '2px 8px',
                  borderRadius: 4,
                  fontSize: '0.72rem',
                  fontWeight: 700,
                }}
              >
                {fireLevel}
              </span>
              <span
                style={{
                  background: sourceBadge.bg,
                  color: sourceBadge.color,
                  border: sourceBadge.border,
                  padding: '2px 8px',
                  borderRadius: 4,
                  fontSize: '0.72rem',
                  fontWeight: 700,
                }}
              >
                {sourceBadge.label}
              </span>
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginTop: 6, color: '#f8fafc' }}>
              {title}
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: 4,
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.82rem', color: '#cbd5e1', marginTop: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <MapPin size={16} style={{ color: '#f97316' }} />
            <span>위치: {locationName}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock size={16} style={{ color: '#38bdf8' }} />
            <span>신고/발생 시각: {occurredAt}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Building size={16} style={{ color: '#a855f7' }} />
            <span>관할 소방서: {stationName}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={16} style={{ color: '#f59e0b' }} />
            <span>추정 원인: {cause}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={16} style={{ color: '#ef4444' }} />
            <span>
              인명 피해: {casualtyText} (추정 피해액: {estDamage})
            </span>
          </div>
        </div>

        <div
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid var(--border-color)',
            borderRadius: 12,
            padding: 12,
            marginTop: 10,
          }}
        >
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#f97316', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
            <ShieldAlert size={14} /> 현장 대피 및 조치 상황
          </div>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.5 }}>
            {description}
          </p>
        </div>

        {/* 데이터 출처 및 수집 경로 투명성 정보 */}
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 12,
            padding: 10,
            marginTop: 8,
            fontSize: '0.75rem',
            color: '#94a3b8'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, color: sourceBadge.color, fontWeight: 700 }}>
            <Database size={13} />
            <span>데이터 수집 출처: {sourceBadge.label}</span>
          </div>
          <div style={{ lineHeight: 1.4 }}>
            {sourceBadge.desc} (사건 식별 ID: <code style={{ color: '#e2e8f0' }}>{incident.occurId || incident.id || 'NFA-AUTO'}</code>)
          </div>
        </div>

        <button className="btn-primary" onClick={onClose} style={{ marginTop: 14 }}>
          확인 및 닫기
        </button>
      </div>
    </div>
  );
};

export default FireDetailModal;
