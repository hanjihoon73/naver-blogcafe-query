# 개발 구현 계획서 - v1.0

## 1. 추천 기술 스택 (Tech Stack)
초기 MVP(최소 기능 제품)를 가장 가볍고 효율적으로, 그리고 안정적으로 개발하기 위한 구성입니다.

- **프론트엔드 & 백엔드 통합**: `Next.js (App Router)`
  - React 기반이며, API 라우트를 제공하여 별도의 무거운 백엔드 서버 없이도 데이터 수집(스크래핑/API 연동) 로직을 처리할 수 있습니다.
- **UI & 스타일링**: `Vanilla CSS (CSS Modules)`
  - 글로벌 규칙에 따라 외부 UI 라이브러리(Tailwind 등)에 의존하지 않고 바닐라 CSS를 사용하여 유연하고 깔끔한 디자인 시스템을 구축합니다.
- **데이터 분석 (감성 및 카테고리)**: `OpenAI API (gpt-4o-mini 등)`
  - 머신러닝 모델을 직접 서버에 띄우는 것은 무겁고 설정이 복잡합니다. 가벼운 API 호출만으로 텍스트의 긍/부정, 및 테마 피드백 분류를 가장 영리하게 해낼 수 있습니다. 
- **데이터 수집 체계**: `Naver Open API` 또는 `Axios + Cheerio (가벼운 크롤링)`
  - 사용자 질문 결과에 따라 확정합니다.

---

## 2. 폴더 구조 및 파일 구성 (Folder Structure)
관심사(역할) 분리 원칙에 따라 컴포넌트, 훅, 유틸, API 등을 완벽히 나눕니다.

```text
social-analysis/
├── docs/                           # 문서 저장소 (PRD, 구현계획 등)
│   ├── prd_v1.0.md
│   └── implementation_plan_v1.0.md
├── src/
│   ├── app/                        # 페이지 및 Next.js 라우팅, 백엔드 API 라우트
│   │   ├── page.tsx                # 메인 화면 (검색창)
│   │   ├── result/page.tsx         # 대시보드 결과 화면
│   │   ├── api/                    # 백엔드 API (데이터 수집 및 OpenAI 연동)
│   │   │   └── analyze/route.ts
│   │   ├── layout.tsx
│   │   └── globals.css             # 공통 기본 바닐라 CSS
│   ├── components/                 # 재사용 가능한 UI 컴포넌트 (하나의 파일은 하나의 역할만)
│   │   ├── SearchBar/
│   │   ├── TrendChart/
│   │   ├── SentimentIndicator/
│   │   └── LoadingSpinner/
│   ├── hooks/                      # 커스텀 리액트 훅 (상태 관리, 비즈니스 로직)
│   │   ├── useSearchKeyword.ts
│   │   └── usePollingAnalysis.ts
│   ├── utils/                      # 순수 함수, 포맷팅, 데이터 가공 로직
│   │   ├── dateFormatter.ts
│   │   └── dataAggregator.ts
│   └── lib/                        # 외부 라이브러리 설정 등 (API 호출 모듈)
│       ├── apiClient.ts            # 프론트엔드용 fetch/axios 래핑
│       └── openai.ts               # 백엔드용 OpenAI 설정
├── package.json
└── next.config.mjs
```

---

## 3. 단계별 개발 계획 및 테스트 일정

- **Phase 1: 프로젝트 초기 세팅**
  - Next.js 프로젝트 생성, 불필요한 파일 제거, 폴더 구조(components, hooks, utils, api) 정의.
  - *사용자 테스트 포인트*: 기본 개발 서버 화면 구동 여부 확인.

- **Phase 2: 네이버 데이터 수집 API 및 기능 구현**
  - `/api/analyze` 백엔드 로직에 네이버 검색 API(또는 크롤러)를 연동하여 결과 가져오기.
  - *사용자 테스트 포인트*: 터미널/로그에서 특정 키워드 입력 시 네이버 데이터가 잘 받아와지는지 확인.

- **Phase 3: AI 분석 로직 (OpenAI) 연동**
  - 수집된 데이터를 OpenAI API에 보내어 월별 수치, 긍부정, 콘텐츠 종류 결과값 포맷팅.
  - *사용자 테스트 포인트*: API 응답 결과가 정해진 JSON 포맷(긍정 %, 카테고리 분포 등)으로 잘 나오는지 콘솔 테스트.

- **Phase 4: 프론트엔드 화면 구성 (검색창 및 대시보드)**
  - `components` 폴더에 시각적 요소들 구현 및 바닐라 CSS 적용.
  - 입력 폼 로직과 결과 화면 연동.
  - *사용자 테스트 포인트*: 브라우저에서 직접 키워드를 치고 로딩 창 및 최종 대시보드 차트 확인.
