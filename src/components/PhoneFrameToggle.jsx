import React from 'react';
import { Smartphone, Monitor } from 'lucide-react';

const PhoneFrameToggle = ({ isPhoneFrame, onToggle }) => {
  return (
    <button className="frame-toggle-btn" onClick={onToggle} title="스마트폰 뷰 / 화면 맞춤 토글">
      {isPhoneFrame ? (
        <>
          <Monitor size={16} />
          <span>데스크톱 뷰</span>
        </>
      ) : (
        <>
          <Smartphone size={16} style={{ color: '#f97316' }} />
          <span>스마트폰 뷰</span>
        </>
      )}
    </button>
  );
};

export default PhoneFrameToggle;
