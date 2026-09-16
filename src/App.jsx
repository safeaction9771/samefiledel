import React, { useState, useEffect } from 'react';
import { Map, Flame, BarChart3, Building2, Monitor, RefreshCw, Radio } from 'lucide-react';
import Header from './components/Header';
import FireMap from './components/FireMap';
import FireOccurList from './components/FireOccurList';
import StatsDashboard from './components/StatsDashboard';
import RegionalAnalysis from './components/RegionalAnalysis';
import ApiKeyModal from './components/ApiKeyModal';
import AdminPinModal from './components/AdminPinModal';
import FireDetailModal from './components/FireDetailModal';
import { getStoredApiKey, saveApiKey, fetchFireOccurrences } from './services/fireApi';

// 일반 모바일 모드 4개 내비게이션 탭
const NAV_ITEMS = [
  { id: 'MAP', label: '실시간 지도', icon: Map },
  { id: 'OCCUR_LIST', label: '발생 정보', icon: Flame },
  { id: 'STATS', label: '화재 통계', icon: BarChart3 },
  { id: 'REGION', label: '지역 분석', icon: Building2 },
];

function App() {
  const [activeTab, setActiveTab] = useState('MAP');
  const [pcRightTab, setPcRightTab] = useState('OCCUR_LIST'); // PC 모드 우측 패널 탭
  const [apiKey, setApiKey] = useState(getStoredApiKey());
  const [isAdminPinModalOpen, setIsAdminPinModalOpen] = useState(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [isPcMode, setIsPcMode] = useState(false);
  const [liveApiData, setLiveApiData] = useState([]);

  // 소방청 라이브 OpenAPI 실시간 수신 및 주기적 동기화 (30초 주기)
  useEffect(() => {
    const loadLiveData = async () => {
      try {
        const res = await fetchFireOccurrences(200);
        if (res && res.data && res.data.length > 0) {
          setLiveApiData(res.data);
        }
      } catch (err) {
        console.warn('라이브 API 수신 중:', err);
      }
    };
    loadLiveData();
    const interval = setInterval(loadLiveData, 30000);
    return () => clearInterval(interval);
  }, [apiKey]);

  // 로고 더블클릭 또는 상단 API 버튼 클릭 시 ➔ 관리자 4자리 PIN 인증창
  const handleRequestAdminAccess = () => {
    setIsAdminPinModalOpen(true);
  };

  // PIN 인증 성공 시 ➔ 실제 ApiKeyModal 열림
  const handlePinSuccess = () => {
    setIsAdminPinModalOpen(false);
    setIsApiKeyModalOpen(true);
  };

  const handleSaveApiKey = (newKey) => {
    saveApiKey(newKey);
    setApiKey(newKey);
  };

  const handleResetToDemo = () => {
    saveApiKey('');
    setApiKey('');
    setIsApiKeyModalOpen(false);
  };

  return (
    <div className={`app-container ${isPcMode ? 'pc-expanded-view' : 'phone-frame-mode'}`}>
      <Header
        isLiveApi={Boolean(apiKey)}
        apiSource="소방청 화재정보서비스 OpenAPI"
        onOpenApiKeyModal={handleRequestAdminAccess}
        onLogoDoubleClick={handleRequestAdminAccess}
        latestIncident={selectedIncident}
        liveIncidents={liveApiData}
        isPcMode={isPcMode}
        onTogglePcMode={() => setIsPcMode(!isPcMode)}
      />

      {/* 🖥️ PC 관제 모드일 때: 좌측(실시간 지도) + 우측(발생정보/통계/지역분석) 2분할 종합 관제 대시보드 */}
      {isPcMode ? (
        <main className="pc-dashboard-grid">
          {/* 좌측 관제 패널: 전국 실시간 화재 관제 지도 */}
          <section className="pc-left-map-panel">
            <div className="pc-panel-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Radio size={16} className="text-red-500 animate-pulse" style={{ color: '#ef4444' }} />
                <span style={{ fontWeight: 800, fontSize: '0.92rem', color: '#f8fafc' }}>
                  전국 실시간 119 소방 출동 관제 지도
                </span>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 700 }}>
                ● 라이브 관제 작동 중
              </span>
            </div>
            <div className="pc-map-wrapper">
              <FireMap onSelectIncident={(inc) => setSelectedIncident(inc)} />
            </div>
          </section>

          {/* 우측 관제 패널: 실시간 발생정보 / 통계 / 지역분석 멀티 탭 */}
          <section className="pc-right-data-panel">
            <div className="pc-panel-header pc-tabs-header">
              <div className="pc-tab-buttons">
                <button
                  className={`pc-tab-btn ${pcRightTab === 'OCCUR_LIST' ? 'active' : ''}`}
                  onClick={() => setPcRightTab('OCCUR_LIST')}
                >
                  <Flame size={15} />
                  <span>실시간 발생 정보</span>
                </button>
                <button
                  className={`pc-tab-btn ${pcRightTab === 'STATS' ? 'active' : ''}`}
                  onClick={() => setPcRightTab('STATS')}
                >
                  <BarChart3 size={15} />
                  <span>화재 통계 분석</span>
                </button>
                <button
                  className={`pc-tab-btn ${pcRightTab === 'REGION' ? 'active' : ''}`}
                  onClick={() => setPcRightTab('REGION')}
                >
                  <Building2 size={15} />
                  <span>17개 시·도 분석</span>
                </button>
              </div>
            </div>

            <div className="pc-data-content-scroll">
              {pcRightTab === 'OCCUR_LIST' && (
                <FireOccurList onSelectIncident={(inc) => setSelectedIncident(inc)} />
              )}
              {pcRightTab === 'STATS' && <StatsDashboard />}
              {pcRightTab === 'REGION' && <RegionalAnalysis />}
            </div>
          </section>
        </main>
      ) : (
        /* 📱 모바일 세로 뷰일 때: 기존 4탭 단일 화면 */
        <main className="app-content">
          {activeTab === 'MAP' && <FireMap onSelectIncident={(inc) => setSelectedIncident(inc)} />}
          {activeTab === 'OCCUR_LIST' && <FireOccurList onSelectIncident={(inc) => setSelectedIncident(inc)} />}
          {activeTab === 'STATS' && <StatsDashboard />}
          {activeTab === 'REGION' && <RegionalAnalysis />}
        </main>
      )}

      {/* 모바일 뷰 전용 하단 내비게이션 바 (PC 모드일 때는 숨김) */}
      {!isPcMode && (
        <nav className="bottom-nav">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setActiveTab(item.id)}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      )}

      {/* 🔒 1단계: 관리자 4자리 PIN 인증 모달 (기본 PIN: 1190) */}
      <AdminPinModal
        isOpen={isAdminPinModalOpen}
        onClose={() => setIsAdminPinModalOpen(false)}
        onSuccess={handlePinSuccess}
      />

      {/* 🔑 2단계: 인증키 관리 모달 */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        currentKey={apiKey}
        onSaveKey={handleSaveApiKey}
        onResetToDemo={handleResetToDemo}
      />

      {/* 화재 상세 정보 모달 */}
      <FireDetailModal
        incident={selectedIncident}
        onClose={() => setSelectedIncident(null)}
      />
    </div>
  );
}

export default App;
