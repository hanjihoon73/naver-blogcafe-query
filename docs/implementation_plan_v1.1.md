# 개발 구현 계획서 - v1.1

## 1. 추천 기술 스택 (Tech Stack)
초기 MVP를 DB 없이 가장 가볍게, 그러나 댓글 수집이라는 다소 무거운 태스크를 안정적으로 처리하기 위한 구성입니다.

- **프론트엔드 & 백엔드 통합**: `Next.js (App Router)`
  - React 기반 프론트엔드 구성과 데이터 수집, AI 프록시를 담당할 가벼운 백엔드 API 라우트를 하나로 관리합니다.
- **UI & 스타일링**: `Vanilla CSS (CSS Modules)`
  - 글로벌 규칙에 따라 외부 UI 라이브러리(Tailwind 등)에 의존하지 않고 유연하고 깔끔한 디자인 시스템을 구축합니다.
- **데이터 분석 (감성 분석)**: `OpenAI API (gpt-4o-mini)`
  - 가벼운 API 호출만으로 게시글과 댓글 텍스트의 긍/부정을 분류합니다. (비용 효율적이고 빠름)
- **데이터 수집 체계**: `Puppeteer` 또는 `Playwright` 기반 크롤링
  - 단순히 게시글 정보만 가져오는 네이버 Open API와 달리, **댓글**까지 모두 수집해야 하므로 JavaScript 렌더링을 기다려 DOM에서 데이터를 긁어와야 합니다. 
- **엑셀 다운로드 포맷터**: `xlsx` (또는 `exceljs`) 라이브러리
  - 분석된 테이블 데이터를 프론트엔드 브라우저 상에서 즉시 .xlsx 파일로 변환하여 다운로드하도록 지원합니다.

---

## 2. 폴더 구조 및 파일 구성 (Folder Structure)

```text
social-analysis/
├── docs/                           # 문서 저장소
│   ├── prd_v1.1.md
│   └── implementation_plan_v1.1.md
├── src/
│   ├── app/                        # 페이지 및 백엔드 API 라우트
│   │   ├── page.tsx                # 메인 화면 (조회 기간 설정 및 대시보드)
│   │   ├── api/                    
│   │   │   └── analyze/route.ts    # 크롤링 + OpenAI 분석 통합 API
│   │   ├── layout.tsx
│   │   └── globals.css             # 공통 기본 바닐라 CSS
│   ├── components/                 # 재사용 가능한 UI 컴포넌트
│   │   ├── DateScopePicker/        # 조회 월 선택기
│   │   ├── MetricCards/            # 건수 및 비율 요약 카드
│   │   ├── TrendChart/             # 월별 추이 차트
│   │   └── LoadingOverlay/         # 진행 상태 표시기
│   ├── hooks/                      
│   │   └── useAnalyticsData.ts     # API 결과 패칭 및 상태 관리
│   ├── utils/                      
│   │   ├── dataAggregator.ts       # 데이터 통계 연산 순수 함수
│   │   └── excelExport.ts          # 엑셀 변환 로직
│   └── lib/                        
│       ├── crawler.ts              # Puppeteer/Playwright 크롤링 모듈
│       └── openai.ts               # 백엔드용 OpenAI 감성 분석 연동 모듈
├── package.json
└── next.config.mjs
```

---

## 3. 단계별 개발 계획 및 테스트 일정

- **Phase 1: 프로젝트 기초 환경 세팅**
  - Next.js 기반 프로젝트 생성 (DB 관련 라이브러리 배제).
  - 컴포넌트, 훅, 유틸 규칙에 맞는 폴더 구조 반영 및 바닐라 CSS 뼈대 작업.
  - *사용자 진행 포인트*: 개발서버 구동 안내문 전달 및 초기 상태 확인.

- **Phase 2: 네이버 게시글 & 댓글 크롤러 개발 ('깨봉수학' 한정)**
  - `lib/crawler.ts`에 키워드 '깨봉수학' 기반 블로그, 카페 검색 및 상세 페이지(댓글 영역 포함) 크롤링 스크립트 작성.
  - *사용자 진행 포인트*: 로컬 터미널에서 스크래핑이 정상 작동하는지 테스트 스크립트로 확인 요청.

- **Phase 3: 감성 분석 및 데이터 집계(API) 연동**
  - 크롤러로 수집된 텍스트(포스트+댓글) 단위로 OpenAI API에 전달하여 긍/부정 라벨링.
  - 결과값을 합산(포스트/댓글 건수 및 비율)하여 JSON 응답으로 반환하는 백엔드 API 완료.

- **Phase 4: 대시보드 화면 및 엑셀 다운로드 구현**
  - 추출된 데이터를 시각적 카드나 차트로 렌더링.
  - 화면의 '엑셀 다운로드' 버튼 클릭 시 `utils/excelExport.ts`를 거쳐 .xlsx 파일 획득 기능 구현.
  - *사용자 진행 포인트*: 실제 브라우저에서 최종 테스트 진행 및 다운로드 파일 확인.

## 4. 검증 계획 (Verification Plan)
1. **수동 테스트**: 사용자가 로컬에서 `npm run dev` 구동 후 '조회' 버튼 클릭. 서버 콘솔에 크롤링 로그 및 API 호출 비용/응답 확인.
2. **다운로드 데이터 검증**: 생성된 엑셀 파일을 열정상적인 컬럼명(월, 매체, 콘텐츠유형, 건수, 긍부정비율 등)과 값이 들어있는지 육안으로 확인.
