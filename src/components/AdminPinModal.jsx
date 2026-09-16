import React, { useState } from 'react';
import { Lock, X, KeyRound, Check, AlertCircle } from 'lucide-react';

const AdminPinModal = ({ isOpen, onClose, onSuccess }) => {
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  // 관리자 마스터 PIN 번호 (기본: 1190)
  const ADMIN_PIN = '1190';

  const handleNumClick = (num) => {
    if (pin.length < 4) {
      const nextPin = pin + num;
      setPin(nextPin);
      setErrorMsg('');

      if (nextPin.length === 4) {
        if (nextPin === ADMIN_PIN) {
          onSuccess();
          setPin('');
          setErrorMsg('');
        } else {
          setErrorMsg('비밀번호가 일치하지 않습니다.');
          setTimeout(() => setPin(''), 600);
        }
      }
    }
  };

  const handleDelete = () => {
    setPin(pin.slice(0, -1));
    setErrorMsg('');
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-sheet"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 320, padding: '24px 20px', borderRadius: 20, textAlign: 'center' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#f97316', fontWeight: 800, fontSize: '0.95rem' }}>
            <Lock size={18} /> 관리자 인증
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4 }}
          >
            <X size={20} />
          </button>
        </div>

        <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: 16 }}>
          관리자 4자리 비밀번호를 입력해 주세요.
        </p>

        {/* PIN 4자리 표시 도트 */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 14, marginBottom: 18 }}>
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              style={{
                width: 14,
                height: 14,
                borderRadius: '50%',
                background: idx < pin.length ? '#f97316' : 'rgba(255, 255, 255, 0.1)',
                border: '1px solid var(--border-color)',
                transition: 'all 0.2s ease',
                transform: idx < pin.length ? 'scale(1.15)' : 'scale(1)'
              }}
            />
          ))}
        </div>

        {errorMsg && (
          <div style={{ color: '#ef4444', fontSize: '0.75rem', fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            <AlertCircle size={13} /> {errorMsg}
          </div>
        )}

        {/* 숫자 키패드 */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 10,
            maxWidth: 240,
            margin: '0 auto'
          }}
        >
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => handleNumClick(String(num))}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid var(--border-color)',
                color: '#f8fafc',
                fontSize: '1.2rem',
                fontWeight: 700,
                padding: '12px 0',
                borderRadius: 12,
                cursor: 'pointer',
                transition: 'background 0.15s'
              }}
            >
              {num}
            </button>
          ))}
          <button
            onClick={() => setPin('')}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            초기화
          </button>
          <button
            onClick={() => handleNumClick('0')}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid var(--border-color)',
              color: '#f8fafc',
              fontSize: '1.2rem',
              fontWeight: 700,
              padding: '12px 0',
              borderRadius: 12,
              cursor: 'pointer'
            }}
          >
            0
          </button>
          <button
            onClick={handleDelete}
            style={{
              background: 'none',
              border: 'none',
              color: '#ef4444',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            ← 지움
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminPinModal;
