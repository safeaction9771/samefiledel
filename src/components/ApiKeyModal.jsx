import React, { useState } from 'react';
import { X, Key, ExternalLink, Check, Eye, EyeOff, ShieldCheck } from 'lucide-react';

const ApiKeyModal = ({ isOpen, onClose, currentKey, onSaveKey, onResetToDemo }) => {
  const [inputKey, setInputKey] = useState(currentKey || '');
  const [showKey, setShowKey] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveKey(inputKey);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 800);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle" />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Key size={20} style={{ color: '#f97316' }} />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>소방청 OpenAPI Key 관리</h3>
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

        <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: 8, lineHeight: 1.4 }}>
          공공데이터포털(data.go.kr)에서 발급받은 소방청 화재정보서비스 인증키입니다. 기본 인증키가 이미 연동되어 있어 수정 없이 사용하셔도 됩니다.
        </p>

        <div style={{ marginTop: 14 }}>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#f8fafc', marginBottom: 6 }}>
            공공데이터포털 ServiceKey (보안 암호화)
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type={showKey ? 'text' : 'password'}
              className="custom-input"
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              placeholder="인증키를 입력하세요"
              style={{ fontFamily: showKey ? 'inherit' : 'monospace', letterSpacing: showKey ? 'normal' : '2px', paddingRight: 40 }}
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              style={{
                position: 'absolute',
                right: 12,
                top: 11,
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer'
              }}
              title={showKey ? '인증키 숨기기' : '인증키 보기'}
            >
              {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
          <button className="btn-primary" onClick={handleSave} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6 }}>
            {isSaved ? (
              <>
                <Check size={18} />
                <span>저장 완료 및 실시간 연동됨</span>
              </>
            ) : (
              <span>인증키 저장 및 실시간 연동</span>
            )}
          </button>

          <button
            onClick={onResetToDemo}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid var(--border-color)',
              color: '#cbd5e1',
              padding: '10px 16px',
              borderRadius: 12,
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            인증키 없이 모의 데모 모드로 사용하기
          </button>
        </div>

        <div style={{ marginTop: 14, textAlign: 'center' }}>
          <a
            href="https://www.data.go.kr/data/15059637/openapi.do"
            target="_blank"
            rel="noreferrer"
            style={{
              fontSize: '0.75rem',
              color: '#38bdf8',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            공공데이터포털 소방청 화재정보 API 신청 페이지 <ExternalLink size={12} />
          </a>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyModal;
