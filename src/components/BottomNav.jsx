import React from 'react';
import { MapPin, Flame, BarChart3, Building2, Youtube, Settings } from 'lucide-react';

const BottomNav = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'MAP', label: '실시간 지도', icon: MapPin },
    { id: 'OCCUR_LIST', label: '발생 정보', icon: Flame },
    { id: 'YOUTUBE', label: '유튜브 뉴스', icon: Youtube },
    { id: 'STATS', label: '화재 통계', icon: BarChart3 },
    { id: 'REGION', label: '지역 분석', icon: Building2 },
  ];

  return (
    <nav className="bottom-nav">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            className={`nav-item ${isActive ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <Icon size={20} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default BottomNav;
