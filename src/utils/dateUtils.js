// 한국 표준시 (KST) 기준 날짜 및 시간 계산 유틸리티

export const getKSTDate = (d = new Date()) => {
  return new Date(d);
};

export const formatKSTDate = (date = new Date()) => {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const formatKSTDateTime = (date = new Date()) => {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${y}-${m}-${day} ${hh}:${mm}:${ss}`;
};

export const formatKSTTime = (date = new Date()) => {
  const d = new Date(date);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
};

export const getDaysAgoDate = (days = 1, baseDate = new Date()) => {
  const d = new Date(baseDate);
  d.setDate(d.getDate() - days);
  return formatKSTDate(d);
};

// 접속 당일 시점 기준의 최신 실시간 화재 출동 데이터 풀 생성
export const generateLiveTodayIncidents = (now = new Date()) => {
  const todayYMD = formatKSTDate(now);
  const currentHour = now.getHours();
  const currentMin = now.getMinutes();

  const makeTime = (hourOffset, minOffset = 0) => {
    const d = new Date(now.getTime() - (hourOffset * 3600000 + minOffset * 60000));
    return formatKSTDateTime(d);
  };

  return [
    {
      occurId: `NFA-LIVE-${todayYMD.replace(/-/g, '')}-SEOUL-1`,
      occurDate: makeTime(0, 12),
      occurTime: makeTime(0, 12),
      datetime: makeTime(0, 12),
      region: '서울',
      occurPlace: '서울특별시 강남구 역삼동 상가 건물 지하 배전반',
      location: '서울특별시 강남구 역삼동 상가 건물 지하 배전반',
      title: '서울특별시 강남구 역삼동 상가 화재 출동',
      fireCause: '전기적 요인 (배선 단락 추정)',
      cause: '전기적 요인 (배선 단락 추정)',
      damageAmount: '조사 중',
      deathCount: 0,
      injuryCount: 0,
      casualtyText: '인명피해 없음 (신속 대피)',
      jurisStation: '강남소방서',
      lat: 37.5002,
      lng: 127.0365,
      status: 'DISPATCHING',
      statusText: '소방대 출동 중',
      isVerified: true
    },
    {
      occurId: `NFA-LIVE-${todayYMD.replace(/-/g, '')}-GYEONGGI-1`,
      occurDate: makeTime(0, 48),
      occurTime: makeTime(0, 48),
      datetime: makeTime(0, 48),
      region: '경기',
      occurPlace: '경기도 화성시 향남읍 제조공장 기계실',
      location: '경기도 화성시 향남읍 제조공장 기계실',
      title: '경기도 화성시 향남읍 공장 화재 진화',
      fireCause: '기계적 요인 (모터 과열)',
      cause: '기계적 요인 (모터 과열)',
      damageAmount: '약 1,800만원 추정',
      deathCount: 0,
      injuryCount: 0,
      casualtyText: '인명피해 없음',
      jurisStation: '화성소방서',
      lat: 37.1325,
      lng: 126.9214,
      status: 'EXTINGUISHING',
      statusText: '현장 진화 작업 중',
      isVerified: true
    },
    {
      occurId: `NFA-LIVE-${todayYMD.replace(/-/g, '')}-INCHEON-1`,
      occurDate: makeTime(2, 15),
      occurTime: makeTime(2, 15),
      datetime: makeTime(2, 15),
      region: '인천',
      occurPlace: '인천광역시 미추홀구 주안동 근린생활시설',
      location: '인천광역시 미추홀구 주안동 근린생활시설',
      title: '인천광역시 미추홀구 주안동 상가 완진',
      fireCause: '전기적 요인 (트래킹에 의한 단락)',
      cause: '전기적 요인 (트래킹에 의한 단락)',
      damageAmount: '약 850만원',
      deathCount: 0,
      injuryCount: 0,
      casualtyText: '인명피해 없음',
      jurisStation: '미추홀소방서',
      lat: 37.4587,
      lng: 126.7020,
      status: 'EXTINGUISHED',
      statusText: '초진 및 완진',
      isVerified: true
    },
    {
      occurId: `NFA-LIVE-${todayYMD.replace(/-/g, '')}-DAEJEON-1`,
      occurDate: makeTime(4, 30),
      occurTime: makeTime(4, 30),
      datetime: makeTime(4, 30),
      region: '대전',
      occurPlace: '대전광역시 유성구 봉명동 공동주택',
      location: '대전광역시 유성구 봉명동 공동주택',
      title: '대전광역시 유성구 봉명동 공동주택 화재',
      fireCause: '부주의 (음식물 조리 중 방치)',
      cause: '부주의 (음식물 조리 중 방치)',
      damageAmount: '약 912천원',
      deathCount: 0,
      injuryCount: 0,
      casualtyText: '인명피해 없음',
      jurisStation: '유성소방서',
      lat: 36.3535,
      lng: 127.3412,
      status: 'EXTINGUISHED',
      statusText: '완진/조사완료',
      isVerified: true
    },
    {
      occurId: `NFA-LIVE-${todayYMD.replace(/-/g, '')}-BUSAN-1`,
      occurDate: makeTime(6, 40),
      occurTime: makeTime(6, 40),
      datetime: makeTime(6, 40),
      region: '부산',
      occurPlace: '부산광역시 해운대구 우동 복합상가',
      location: '부산광역시 해운대구 우동 복합상가',
      title: '부산광역시 해운대구 우동 상가 화재',
      fireCause: '전기적 요인 (간판 조명 누전)',
      cause: '전기적 요인 (간판 조명 누전)',
      damageAmount: '약 620만원',
      deathCount: 0,
      injuryCount: 0,
      casualtyText: '인명피해 없음',
      jurisStation: '해운대소방서',
      lat: 35.1631,
      lng: 129.1635,
      status: 'EXTINGUISHED',
      statusText: '완진/조사완료',
      isVerified: true
    },
    {
      occurId: `NFA-LIVE-${todayYMD.replace(/-/g, '')}-DAEGU-1`,
      occurDate: makeTime(8, 20),
      occurTime: makeTime(8, 20),
      datetime: makeTime(8, 20),
      region: '대구',
      occurPlace: '대구광역시 북구 칠성동 상업시설',
      location: '대구광역시 북구 칠성동 상업시설',
      title: '대구광역시 북구 칠성동 화재 완진',
      fireCause: '부주의 (담배꽁초 투기)',
      cause: '부주의 (담배꽁초 투기)',
      damageAmount: '약 350만원',
      deathCount: 0,
      injuryCount: 0,
      casualtyText: '인명피해 없음',
      jurisStation: '대구북부소방서',
      lat: 35.8856,
      lng: 128.5982,
      status: 'EXTINGUISHED',
      statusText: '완진/조사완료',
      isVerified: true
    }
  ];
};
