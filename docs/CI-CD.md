# CI/CD Pipeline Documentation

이 문서는 Tokamak Private App Channels Manager의 CI/CD 파이프라인 구성 및 E2E 테스트 실행 방법을 설명합니다.

## 목차

1. [파이프라인 개요](#파이프라인-개요)
2. [GitHub Actions 워크플로우](#github-actions-워크플로우)
3. [E2E 테스트 구조](#e2e-테스트-구조)
4. [로컬 실행 방법](#로컬-실행-방법)
5. [Docker Compose 실행](#docker-compose-실행)
6. [테스트 계정 정보](#테스트-계정-정보)
7. [트러블슈팅](#트러블슈팅)

---

## 파이프라인 개요

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         전체 CI/CD 파이프라인 흐름                            │
└─────────────────────────────────────────────────────────────────────────────┘

PR/Push ──────────────────────────────────────────────────────────────────────►

    ci.yml                    docker.yml                 e2e-lifecycle.yml
    ───────                   ──────────                 ─────────────────
    
    ┌─────────┐              
    │  lint   │◄─── 코드 품질 검사 (ESLint, TypeScript)
    └────┬────┘              
         │                   
    ┌────┴────┐              
    │  test   │◄─── 단위 테스트 (Jest)
    └────┬────┘              
         │                   
    ┌────┴────┐               ┌──────────┐
    │  build  │──────────────►│  docker  │◄─── Docker 이미지 빌드 & GHCR Push
    └─────────┘               └────┬─────┘
                                   │
                                   ▼
                              ┌─────────────────┐
                              │ e2e-lifecycle   │◄─── 채널 라이프사이클 E2E
                              │  (7 Jobs)       │
                              └─────────────────┘
```

---

## GitHub Actions 워크플로우

### 1. CI 워크플로우 (`ci.yml`)

**트리거**: PR, push to main/develop

| Job | 설명 | 타임아웃 |
|-----|------|---------|
| lint | ESLint + TypeScript 타입 체크 | 5분 |
| test | Jest 단위 테스트 | 5분 |
| build | Next.js 빌드 검증 | 10분 |

### 2. Docker 빌드 워크플로우 (`docker.yml`)

**트리거**: push to main, tags (v*)

- Production 이미지 빌드 및 GHCR 푸시
- Development 이미지 빌드 (main 브랜치만)

### 3. E2E 라이프사이클 워크플로우 (`e2e-lifecycle.yml`)

**트리거**: push to main/develop, PR to main, 수동 실행

채널 라이프사이클을 7개의 독립적인 Job으로 분리:

```
setup ─► step-1 ─► step-2 ─► step-3 ─► step-4 ─► step-5 ─► step-6 ─► step-7 ─► summary
         Create    Deposit   Init      L2 Tx     Submit    Close     Withdraw
         (5min)    (5min)    (15min)   (15min)   (5min)    (15min)   (5min)
```

| Job | 설명 | 타임아웃 |
|-----|------|---------|
| setup | 테스트 환경 초기화 | 20분 |
| step-1-create-channel | 채널 생성 | 10분 |
| step-2-deposit | 토큰 입금 (Leader + Participant) | 10분 |
| step-3-initialize | 상태 초기화 (Groth16 증명) | 20분 |
| step-4-l2-transaction | L2 트랜잭션 생성 | 20분 |
| step-5-submit-proof | 증명 제출 | 10분 |
| step-6-close-channel | 채널 종료 (Groth16 증명) | 20분 |
| step-7-withdraw | 출금 | 10분 |
| summary | 결과 요약 | 5분 |

**필요한 Secrets**:
- `RPC_URL`: Alchemy Sepolia RPC URL
- `NEXT_PUBLIC_ALCHEMY_API_KEY`: Alchemy API Key

---

## E2E 테스트 구조

### 디렉토리 구조

```
e2e/
├── fixtures/
│   ├── test-accounts.ts    # Anvil 테스트 계정 (Leader, Participant)
│   ├── mock-wallet.ts      # Mock Ethereum Provider (자동 서명)
│   └── channel-state.ts    # Job 간 상태 공유 (JSON 파일)
│
├── helpers/
│   ├── wait-for-tx.ts      # 트랜잭션 완료 대기 유틸리티
│   └── wait-for-proof.ts   # 증명 생성 대기 (10분 타임아웃)
│
├── steps/                  # 채널 라이프사이클 테스트 (순차 실행)
│   ├── 01-create-channel.spec.ts
│   ├── 02-deposit.spec.ts
│   ├── 03-initialize.spec.ts
│   ├── 04-l2-transaction.spec.ts
│   ├── 05-submit-proof.spec.ts
│   ├── 06-close-channel.spec.ts
│   └── 07-withdraw.spec.ts
│
└── home.spec.ts            # 기본 UI 테스트
```

### Mock Wallet 동작

테스트에서는 실제 MetaMask 대신 Mock Provider를 사용합니다:

```typescript
// e2e/fixtures/mock-wallet.ts

// 1. 지갑 연결 요청 → 자동 승인
// 2. 트랜잭션 서명 요청 → 자동 서명 (Anvil RPC 통해)
// 3. 메시지 서명 요청 → 자동 서명
```

---

## 로컬 실행 방법

### 사전 요구사항

```bash
# Node.js 20+
node --version  # v20.x.x

# Foundry (Anvil용)
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

### 1. 의존성 설치

```bash
npm install
```

### 2. Anvil 로컬 체인 시작

```bash
# 터미널 1: Anvil 시작 (Sepolia fork)
anvil --fork-url https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY --port 8545
```

### 3. 개발 서버 시작

```bash
# 터미널 2: Next.js 개발 서버
RPC_URL=http://localhost:8545 npm run dev
```

### 4. E2E 테스트 실행

```bash
# 터미널 3: Playwright 테스트

# 모든 테스트 실행
npm run test:e2e

# 특정 테스트만 실행
npx playwright test e2e/steps/01-create-channel.spec.ts

# UI 모드로 실행 (디버깅)
npm run test:e2e:ui

# 특정 브라우저로 실행
npx playwright test --project=chromium
```

### 5. 라이프사이클 테스트 순차 실행

```bash
# 전체 라이프사이클 순차 실행
npx playwright test e2e/steps/ --workers=1
```

---

## Docker Compose 실행

### 기본 E2E 테스트

```bash
# .env 파일 생성
echo "RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY" > .env
echo "NEXT_PUBLIC_ALCHEMY_API_KEY=YOUR_KEY" >> .env

# E2E 테스트 실행
docker-compose -f docker-compose.yml -f docker-compose.test.yml up --build --abort-on-container-exit
```

### 라이프사이클 테스트

```bash
# 전체 라이프사이클 테스트 실행
docker-compose -f docker-compose.yml -f docker-compose.test.yml --profile lifecycle up --build
```

### 서비스별 실행

```bash
# Anvil만 시작
docker-compose -f docker-compose.yml -f docker-compose.test.yml up anvil

# App만 시작 (Anvil 의존)
docker-compose -f docker-compose.yml -f docker-compose.test.yml up app

# 테스트만 실행 (App, Anvil 의존)
docker-compose -f docker-compose.yml -f docker-compose.test.yml run e2e
```

---

## 테스트 계정 정보

Anvil 기본 테스트 계정을 사용합니다:

### Leader 계정
```
Address:     0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

### Participant 계정
```
Address:     0x70997970C51812dc3A010C7d01b50e0d17dc79C8
Private Key: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
```

### 토큰 정보
```
TON Token (Sepolia): 0xa30fe40285B8f5c0457DbC3B7C8A280373c40044
```

---

## 트러블슈팅

### 1. Anvil 연결 실패

```bash
# 문제: Anvil이 시작되지 않거나 연결 실패
# 해결: Anvil 프로세스 확인 및 재시작

# 기존 프로세스 종료
pkill -f anvil

# 재시작
anvil --fork-url $RPC_URL --port 8545
```

### 2. 증명 생성 타임아웃

```bash
# 문제: Groth16 증명 생성이 10분 내에 완료되지 않음
# 원인: CI 머신 성능 부족 또는 네트워크 지연

# 해결 1: 로컬에서 더 긴 타임아웃으로 테스트
npx playwright test --timeout=1200000  # 20분

# 해결 2: GitHub Actions에서 더 큰 runner 사용
# .github/workflows/e2e-lifecycle.yml에서 runs-on: ubuntu-latest-4-cores
```

### 3. Mock Wallet 서명 실패

```bash
# 문제: Mock wallet이 서명을 처리하지 못함
# 원인: Anvil RPC URL이 올바르지 않음

# 확인: Anvil이 http://localhost:8545에서 실행 중인지 확인
curl -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

### 4. 테스트 상태 공유 실패

```bash
# 문제: channel-test-state.json 파일이 Job 간에 공유되지 않음
# 원인: GitHub Actions artifact 업로드/다운로드 실패

# 확인: artifact가 제대로 업로드되었는지 확인
# GitHub Actions 로그에서 "Upload state" 단계 확인

# 로컬 테스트시: 파일 직접 확인
cat channel-test-state.json
```

### 5. 빌드 실패

```bash
# 문제: Next.js 빌드 실패
# 해결: 의존성 재설치 및 캐시 정리

rm -rf node_modules .next
npm ci --legacy-peer-deps
npm run build
```

---

## 관련 파일

| 파일 | 설명 |
|------|------|
| `.github/workflows/ci.yml` | 기본 CI 파이프라인 |
| `.github/workflows/docker.yml` | Docker 빌드 & 푸시 |
| `.github/workflows/e2e.yml` | 기본 E2E 테스트 |
| `.github/workflows/e2e-lifecycle.yml` | 채널 라이프사이클 E2E |
| `docker-compose.test.yml` | E2E 테스트용 Docker Compose |
| `playwright.config.ts` | Playwright 설정 |
| `e2e/` | E2E 테스트 코드 |

---

## 참고 자료

- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Foundry/Anvil Documentation](https://book.getfoundry.sh/anvil/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
