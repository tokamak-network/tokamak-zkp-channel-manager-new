# Tokamak ZKP Channel Manager

> 🚧 **Work in Progress** - ZK-Rollup 기반 State Channel 관리 시스템

## 프로젝트 구조 (하이브리드 패턴)

```
tokamak-zkp-channel-manager-new/
├── app/                    # Next.js App Router
│   ├── layout.tsx          # 루트 레이아웃
│   ├── page.tsx            # 홈페이지 (조합)
│   ├── _components/        # 홈페이지 전용 컴포넌트
│   ├── channels/
│   │   ├── page.tsx        # 채널 목록 (조합)
│   │   └── _components/    # 채널 페이지 전용 컴포넌트
│   └── api/                # API 라우트
│       └── channels/
├── components/             # 공통 컴포넌트
│   ├── ui/                 # Button, Card, Input 등
│   └── layout/             # Header, Footer 등
├── lib/                    # 유틸리티 함수
├── hooks/                  # 커스텀 React 훅
├── types/                  # TypeScript 타입 정의
└── docs/                   # 문서
```

## 패턴 설명

### 하이브리드 패턴

- `page.tsx`: **조합자** 역할 - 메타데이터 + 데이터 페칭 + 컴포넌트 조합
- `_components/`: 해당 페이지 **전용** 컴포넌트 (언더스코어로 라우트 제외)
- `components/`: **공통** 재사용 컴포넌트

```tsx
// app/channels/page.tsx - 페이지 구조가 한눈에 보임
export default function ChannelsPage() {
  return (
    <main>
      <ChannelStats />      {/* 통계 */}
      <ChannelFilter />     {/* 필터 */}
      <ChannelList />       {/* 목록 */}
    </main>
  );
}
```

## 시작하기

### 레포지토리 클론

이 프로젝트는 `Tokamak-Zk-EVM` 서브모듈을 사용합니다. **가장 간단한 방법**은 일반 클론 후 `npm install`만 하면 됩니다:

```bash
git clone <repository-url>
cd tokamak-zkp-channel-manager-new
npm install  # postinstall 스크립트가 자동으로 서브모듈을 설정합니다
```

**다른 방법들:**

서브모듈을 클론 시점에 함께 가져오려면:

```bash
git clone --recursive <repository-url>
# 또는
git clone --recurse-submodules <repository-url>
```

수동으로 서브모듈만 설정하려면:

```bash
npm run setup
# 또는
bash scripts/setup-submodules.sh
```

### 개발 환경 설정

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 타입 체크
npm run type-check

# 빌드
npm run build
```

## 문서

- [마이그레이션 가이드](./docs/MIGRATION_GUIDE.md)
- [아키텍처 분석](./docs/ARCHITECTURE.md)

## 기술 스택

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript 5.7
- **Styling**: Tailwind CSS 3.4
- **React**: React 19

## 라이선스

MIT
