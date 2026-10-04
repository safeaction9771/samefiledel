// Vercel Serverless Function: Realtime YouTube Fire News Fetcher
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const CHANNELS = [
    { name: 'YTN', id: 'UChlgI3UHCOnwUGzWzbJ3H5w' },
    { name: 'KBS 뉴스', id: 'UCcQTRi69dsVYHN3exePtZ1A' },
    { name: 'SBS 뉴스', id: 'UCkinYTS9IHqOEwR1Sze2JTw' },
    { name: '연합뉴스TV', id: 'UCTHCOPwqNfZ0uiKOvFyhGwg' },
    { name: 'JTBC 뉴스', id: 'UCsU-I-vHLiaMfV_ceaYz5rQ' },
    { name: '채널A 뉴스', id: 'UCfq4V1DAuaojnr2ryvWNysw' }
  ];

  const FIRE_KEYWORDS = ['화재', '산불', '불길', '전소', '발화', '소방차', '소방관', '소방서', '소방대', '119', '화마', '방화'];
  const EXCLUDE_KEYWORDS = [
    '불닭', '불장난', '캠핑 불멍', '마인크래프트', '게임', '파병', '트럼프',
    '불순물', '불법', '불안', '불출마', '불통', '불만', '청와대 진화',
    '논란 진화', '갈등 진화', '사태 진화', '대통령실', '국회', '의원', '정치', '선거'
  ];

  const REGION_MAP = {
    '서울': '서울', '수도권': '서울', '강남': '서울', '종로': '서울',
    '경기': '경기', '수원': '경기', '성남': '경기', '고양': '경기', '용인': '경기', '화성': '경기', '포천': '경기',
    '인천': '인천', '송도': '인천', '부평': '인천',
    '부산': '부산', '해운대': '부산',
    '대구': '대구', '대전': '대전', '광주': '광주', '울산': '울산', '세종': '세종',
    '강원': '강원', '춘천': '강원', '원주': '강원', '강릉': '강원', '속초': '강원',
    '충북': '충북', '청주': '충북', '충남': '충남', '천안': '충남', '아산': '충남',
    '전북': '전북', '전주': '전북', '전남': '전남', '목포': '전남', '여수': '전남',
    '경북': '경북', '포항': '경북', '경주': '경북', '안동': '경북',
    '경남': '경남', '창원': '경남', '김해': '경남',
    '제주': '제주'
  };

  try {
    const fetchPromises = CHANNELS.map(async (ch) => {
      try {
        const url = `https://www.youtube.com/feeds/videos.xml?channel_id=${ch.id}`;
        const resp = await fetch(url, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
          signal: AbortSignal.timeout(6000)
        });
        if (!resp.ok) return [];
        const xml = await resp.text();

        const entries = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)];
        const list = [];

        for (const e of entries) {
          const content = e[1];
          const vidMatch = content.match(/<yt:videoId>(.*?)<\/yt:videoId>/);
          const titleMatch = content.match(/<title>(.*?)<\/title>/);
          const pubMatch = content.match(/<published>(.*?)<\/published>/);

          if (!vidMatch || !titleMatch) continue;
          const videoId = vidMatch[1].trim();
          const title = titleMatch[1].replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
          const published = pubMatch ? pubMatch[1] : new Date().toISOString();

          // 화재 키워드 검증
          const hasFire = FIRE_KEYWORDS.some(k => title.includes(k)) || (title.includes('진화') && (title.includes('불') || title.includes('소방') || title.includes('헬기')));
          if (!hasFire) continue;

          // 제외 키워드 검증
          if (EXCLUDE_KEYWORDS.some(k => title.includes(k))) continue;

          // 날짜 파싱
          const dt = new Date(published);
          const kstDt = new Date(dt.getTime() + (9 * 60 * 60 * 1000));
          const dateStr = kstDt.toISOString().substring(0, 10);
          const timeStr = kstDt.toISOString().substring(11, 16);
          const datetimeStr = `${dateStr} ${timeStr}`;

          // 지역 추출
          let region = '전국';
          for (const [key, val] of Object.entries(REGION_MAP)) {
            if (title.includes(key)) {
              region = val;
              break;
            }
          }

          list.push({
            id: `YT-${videoId}`,
            videoId,
            title,
            channel: ch.name,
            date: dateStr,
            time: timeStr,
            datetime: datetimeStr,
            occurDate: datetimeStr,
            occurTime: datetimeStr,
            publishedText: '실시간 속보',
            region,
            location: `${region} ${title.slice(0, 32)}`,
            address: `${region} ${title.slice(0, 32)}`,
            occurPlace: `${region} ${title.slice(0, 32)}`,
            cause: '원인 정밀 조사 중',
            fireCause: '원인 정밀 조사 중',
            statusText: title.includes('완진') || title.includes('꺼져') ? '완진' : '진화 중',
            status: title.includes('완진') || title.includes('꺼져') ? '완진' : '진화 중',
            views: '최신 영상',
            duration: '02:00',
            thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
            videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
            embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1`,
            description: `[${ch.name}] ${title}`,
            jurisStation: `${region} 관할 소방서 출동`,
            casualtyText: '인명피해 및 피해 규모 조사 중',
            deathCount: 0,
            injuryCount: 0,
            damageAmount: '조사 중',
            sourceType: 'YOUTUBE_NEWS',
            badgeLabel: `🎥 ${ch.name}`
          });
        }
        return list;
      } catch (err) {
        return [];
      }
    });

    const results = await Promise.allSettled(fetchPromises);
    const allVideos = [];
    const seen = new Set();

    results.forEach(res => {
      if (res.status === 'fulfilled' && Array.isArray(res.value)) {
        res.value.forEach(v => {
          if (!seen.has(v.videoId)) {
            seen.add(v.videoId);
            allVideos.push(v);
          }
        });
      }
    });

    allVideos.sort((a, b) => b.datetime.localeCompare(a.datetime));

    return res.status(200).json({
      success: true,
      count: allVideos.length,
      data: allVideos,
      updatedAt: new Date().toISOString()
    });
  } catch (globalErr) {
    return res.status(500).json({
      success: false,
      error: globalErr.message
    });
  }
}
