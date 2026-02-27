'use client';

import { useState } from 'react';

export default function Home() {
  const [keyword, setKeyword] = useState('깨봉수학');

  // Date format: YYYY-MM-DD
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ summary: { blogPostCount: number; cafePostCount: number; totalPosts: number } } | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setResult(null);

    // 유효성 검사
    if (startDate > endDate) {
      setErrorMsg('종료일은 시작일 이후여야 합니다.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword, startDate, endDate })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || '수집 중 오류 발생');
      }
      setResult(data);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container">
      <header className="header">
        <h1>소셜 데이터 분석기</h1>
        <p>네이버 블로그 및 카페의 지정 기간 내 초고속 게시물 건수 집계 (댓글 제외)</p>
      </header>

      <section className="search-section card">
        <form onSubmit={handleSearch} className="search-form">
          <div className="form-group">
            <label>키워드</label>
            <input
              type="text"
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              placeholder="검색할 키워드 (예: 깨봉수학)"
              required
            />
          </div>
          <div className="form-group">
            <label>시작</label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>종료</label>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="search-btn" disabled={loading}>
            {loading ? '집계 중 (1~5초 내외)...' : '결과 조회하기'}
          </button>
        </form>
      </section>

      {errorMsg && (
        <div className="error-message card">
          <p>❌ {errorMsg}</p>
        </div>
      )}

      {loading && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>백그라운드에서 블로그 API를 조회하고, 동시에 카페 검색 페이지의 스크롤을 끝까지 내려 건수를 집계하고 있습니다.<br />잠시만 기다려 주세요...</p>
        </div>
      )}

      {result && !loading && (
        <section className="dashboard">
          <div className="summary-cards">
            <div className="stat-card" style={{ gridColumn: '1 / -1' }}>
              <h3>기간 내 총 게시물 건수 (블로그 + 카페 합산)</h3>
              <p className="stat-number highlight">{result.summary.totalPosts}<span>건</span></p>
            </div>
          </div>

          <div className="split-cards">
            <div className="platform-card blog">
              <h4>네이버 블로그 지표</h4>
              <ul>
                <li>작성된 포스트 전체 개수: <strong>{result.summary.blogPostCount}</strong> 건</li>
              </ul>
            </div>
            <div className="platform-card cafe">
              <h4>네이버 카페 지표</h4>
              <ul>
                <li>작성된 게시글 전체 개수: <strong>{result.summary.cafePostCount}</strong> 건</li>
              </ul>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
