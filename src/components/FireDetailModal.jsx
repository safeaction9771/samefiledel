import React, { useMemo } from 'react';
import { X, MapPin, Clock, Building, Users, ShieldAlert, Database, Flame, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';
import { getIncidentSourceBadge, NFA_SIDO_RECEPTION, NFA_NATIONAL_DAILY, normalizeSido } from '../data/officialIncidents';

const FireDetailModal = ({ incident, onClose }) => {
  if (!incident) return null;

  const sourceBadge = getIncidentSourceBadge(incident);

  const occurDate = incident.occurDate || incident.occurTime || incident.datetime || '';
  const ymd = occurDate.replace(/-/g, '').substring(0, 8);
  const region = incident.region || normalizeSido(incident.occurPlace || '');
  const title = incident.title || `${region} 화재 발생 공식 통계`;
  const fireCount = incident.fireCount ?? incident.ocrn_mnb ?? 0;
  const deadCount = incident.deathCount ?? incident.vctm_percnt ?? 0;
  const injuredCount = incident.injuryCount ?? incident.injrdpr_percnt ?? 0;
  const totalCasualties = incident.casualtyCount ?? (deadCount + injuredCount);

  // 시도별 화재접수 및 출동 통계 매칭 (sido_reception 원본)
  const receptionData = useMemo(() => {
    if (!ymd) return null;
    return NFA_SIDO_RECEPTION.find(
      (item) => String(item.ocrn_ymd) === ymd && normalizeSido(item.sido_nm) === region
    );
  }, [ymd, region]);

  // 전국 일별 종합 통계 매칭 (national_summary 원본)
  const nationalData = useMemo(() => {
    if (!ymd) return null;
    return NFA_NATIONAL_DAILY.find((item) => String(item.ocrn_ymd) === ymd);
  }, [ymd]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-handle" />

        {/* 헤더 영역 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  color: '#ef4444',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  padding: '3px 8px',
                  borderRadius: 4,
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                <Flame size={12} />
                공공데이터포털 실측치
              </span>
              <span
                style={{
                  background: sourceBadge.bg,
                  color: sourceBadge.color,
                  border: sourceBadge.border,
                  padding: '3px 8px',
                  borderRadius: 4,
                  fontSize: '0.72rem',
                  fontWeight: 700,
                }}
              >
                {sourceBadge.label}
              </span>
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginTop: 8, color: '#f8fafc' }}>
              {title}
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              borderRadius: '50%',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* 기본 메타 정보 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.82rem', color: '#cbd5e1', marginTop: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <MapPin size={16} style={{ color: '#f97316' }} />
            <span><strong>지역:</strong> {incident.occurPlace || `${region} 소방관할구역`}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock size={16} style={{ color: '#38bdf8' }} />
            <span><strong>발생/집계 일자:</strong> {occurDate}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Building size={16} style={{ color: '#a855f7' }} />
            <span><strong>관할 소방본부:</strong> {incident.jurisStation || `${region}소방본부`}</span>
          </div>
        </div>

        {/* 1. 공식 화재 및 인명피해 수치 카드 */}
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 12,
            padding: 12,
            marginTop: 12,
          }}
        >
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#38bdf8', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
            <Users size={14} /> 소방청 공식 인명피해 및 발생 집계
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, textAlign: 'center' }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: 8, borderRadius: 8, border: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>화재 발생건수</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc', marginTop: 2 }}>
                {fireCount > 0 ? `${fireCount.toLocaleString()}건` : '-'}
              </div>
            </div>
            <div style={{ background: 'rgba(239, 68, 68, 0.08)', padding: 8, borderRadius: 8, border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              <div style={{ fontSize: '0.72rem', color: '#fca5a5' }}>사망자 수</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ef4444', marginTop: 2 }}>
                {deadCount}명
              </div>
            </div>
            <div style={{ background: 'rgba(249, 115, 22, 0.08)', padding: 8, borderRadius: 8, border: '1px solid rgba(249, 115, 22, 0.2)' }}>
              <div style={{ fontSize: '0.72rem', color: '#fdba74' }}>부상자 수</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f97316', marginTop: 2 }}>
                {injuredCount}명
              </div>
            </div>
          </div>
        </div>

        {/* 2. 119 출동 및 접수 상세 통계 (OpenAPI getOcBysidoFireSmrzPcnd) */}
        {receptionData && (
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 12,
              padding: 12,
              marginTop: 10,
            }}
          >
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#a855f7', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
              <ShieldAlert size={14} /> 119 상황실 접수 및 출동 처리 현황
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, fontSize: '0.75rem', textAlign: 'center' }}>
              <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: 6, borderRadius: 6 }}>
                <span style={{ color: '#94a3b8' }}>119 접수: </span>
                <strong style={{ color: '#e2e8f0' }}>{receptionData.fire_rcpt_mnb}건</strong>
              </div>
              <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: 6, borderRadius: 6 }}>
                <span style={{ color: '#94a3b8' }}>완진 종료: </span>
                <strong style={{ color: '#22c55e' }}>{receptionData.stn_end_mnb}건</strong>
              </div>
              <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: 6, borderRadius: 6 }}>
                <span style={{ color: '#94a3b8' }}>자체 진화: </span>
                <strong style={{ color: '#38bdf8' }}>{receptionData.slf_extsh_mnb}건</strong>
              </div>
              <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: 6, borderRadius: 6 }}>
                <span style={{ color: '#94a3b8' }}>진화 진행: </span>
                <strong style={{ color: '#f59e0b' }}>{receptionData.fire_prog_mnb}건</strong>
              </div>
              <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: 6, borderRadius: 6 }}>
                <span style={{ color: '#94a3b8' }}>오인 출동: </span>
                <strong style={{ color: '#94a3b8' }}>{receptionData.flsrp_prcs_mnb}건</strong>
              </div>
              <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: 6, borderRadius: 6 }}>
                <span style={{ color: '#94a3b8' }}>허위 신고: </span>
                <strong style={{ color: '#94a3b8' }}>{receptionData.fals_dclr_mnb}건</strong>
              </div>
            </div>
          </div>
        )}

        {/* 3. 전국 당일 집계 요약 (있는 경우) */}
        {nationalData && (
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: 12,
              padding: 10,
              marginTop: 10,
              fontSize: '0.78rem',
              color: '#94a3b8'
            }}
          >
            <div style={{ fontWeight: 700, color: '#e2e8f0', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
              <FileText size={13} /> {occurDate} 전국 화재 통계 요약
            </div>
            <div>
              전국 총 {nationalData.ocrn_mnb?.toLocaleString()}건 발생 | 
              사망 {nationalData.vctm_percnt}명, 부상 {nationalData.injrdpr_percnt}명 | 
              재산피해 약 {(nationalData.prpt_dmg_sbtt_amt / 1000)?.toLocaleString()}만원
            </div>
          </div>
        )}

        {/* 4. 데이터 출처 및 무가공 원본 안내 */}
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            borderRadius: 12,
            padding: 10,
            marginTop: 10,
            fontSize: '0.75rem',
            color: '#94a3b8'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, color: '#38bdf8', fontWeight: 700 }}>
            <Database size={13} />
            <span>데이터 수집 출처: 100% 공공데이터포털 OpenAPI 실측치</span>
          </div>
          <div style={{ lineHeight: 1.4, color: '#94a3b8' }}>
            본 데이터는 소방청 화재정보서비스(<code style={{ color: '#e2e8f0' }}>FireInformationService</code>) API 서버의 무가공 원본 통계 수치입니다. (모의/가상 데이터 0%)
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
