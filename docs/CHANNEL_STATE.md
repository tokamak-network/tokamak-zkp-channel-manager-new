# Channel State Reference

이 문서는 Tokamak ZKP Channel Manager에서 사용하는 채널 상태(ChannelState)에 대한 참고 문서입니다.

## ChannelState Enum

컨트랙트의 `ChannelState` enum은 다음과 같이 정의되어 있습니다:

```solidity
enum ChannelState {
    None,        // 0
    Initialized, // 1
    Open,        // 2
    Closing,     // 3
    Closed       // 4
}
```

## 상태별 상세 설명

### 0: None
- **의미**: 채널이 생성되지 않았거나 존재하지 않는 상태
- **UI 표시**: Deposit 페이지 (edge case)
- **사용 가능한 기능**: 없음
- **참고**: 일반적으로 이 상태는 채널이 제대로 초기화되지 않은 경우에만 나타남

### 1: Initialized
- **의미**: 채널이 생성되고 deposit 단계에 있는 상태
  - `openChannel` 함수 호출 후 자동으로 이 상태가 됨
  - 참여자들이 토큰을 deposit할 수 있는 단계
  - `initializeChannelState` 함수가 아직 호출되지 않음
- **UI 표시**: Deposit 페이지 (`/state-explorer/deposit`)
- **사용 가능한 기능**:
  - Deposit (참여자)
  - Initialize State (리더만, `initializeChannelState` 호출)
- **참여자 확인**: `isChannelWhitelisted` 함수 사용
- **다음 상태**: `initializeChannelState` 호출 시 → Open (2)

### 2: Open
- **의미**: 채널이 열려있고 transaction을 수행할 수 있는 상태
  - `initializeChannelState` 함수가 호출된 후의 상태
  - 채널이 활성화되어 off-chain transaction을 수행할 수 있음
- **UI 표시**: Transaction 페이지 (`/state-explorer/transaction`)
- **사용 가능한 기능**:
  - Create Transaction (참여자)
  - Submit Proof (참여자)
  - Close Channel (리더만)
- **참여자 확인**: `isChannelParticipant` 함수 사용
- **다음 상태**: `closeChannel` 호출 시 → Closing (3)

### 3: Closing
- **의미**: 채널이 닫히는 중인 상태
  - `closeChannel` 함수가 호출된 후의 상태
  - 채널이 닫히는 과정에 있음
- **UI 표시**: Withdraw 페이지 (`/state-explorer/withdraw`)
- **사용 가능한 기능**:
  - Withdraw (참여자)
- **참여자 확인**: `isChannelParticipant` 함수 사용
- **다음 상태**: 채널이 완전히 닫히면 → Closed (4)

### 4: Closed
- **의미**: 채널이 완전히 닫힌 상태
  - 모든 처리가 완료된 상태
  - 참여자들이 자금을 withdraw할 수 있음
- **UI 표시**: Withdraw 페이지 (`/state-explorer/withdraw`)
- **사용 가능한 기능**:
  - Withdraw (참여자)
- **참여자 확인**: `isChannelParticipant` 함수 사용
- **다음 상태**: 최종 상태 (더 이상 변경되지 않음)

## 상태 전이 흐름

```
None (0)
  ↓ openChannel()
Initialized (1) ──→ Deposit 페이지
  ↓ initializeChannelState()
Open (2) ──→ Transaction 페이지
  ↓ closeChannel()
Closing (3) ──→ Withdraw 페이지
  ↓ (채널 닫힘 완료)
Closed (4) ──→ Withdraw 페이지
```

## UI 컴포넌트 매핑

| State | 값 | 페이지 | 리더 버튼 | 참여자 확인 함수 |
|-------|-----|--------|----------|----------------|
| None | 0 | Deposit | 없음 | - |
| Initialized | 1 | Deposit | Initialize State | `isChannelWhitelisted` |
| Open | 2 | Transaction | Close Channel | `isChannelParticipant` |
| Closing | 3 | Withdraw | 없음 | `isChannelParticipant` |
| Closed | 4 | Withdraw | 없음 | `isChannelParticipant` |

## 코드에서의 사용 예시

### useChannelInfo 훅 사용
```typescript
const channelInfo = useChannelInfo(channelId);

// 상태 확인
if (channelInfo.state === 1) {
  // Initialized 상태 - Deposit 페이지 표시
} else if (channelInfo.state === 2) {
  // Open 상태 - Transaction 페이지 표시
} else if (channelInfo.state === 3 || channelInfo.state === 4) {
  // Closing 또는 Closed 상태 - Withdraw 페이지 표시
}
```

### 참여자 확인 로직
```typescript
// state < 2 (None 또는 Initialized): isChannelWhitelisted 사용
// state >= 2 (Open 이상): isChannelParticipant 사용
const useWhitelistCheck = channelInfo.state < 2;
const functionName = useWhitelistCheck 
  ? "isChannelWhitelisted" 
  : "isChannelParticipant";
```

### 페이지 라우팅
```typescript
// state-explorer/page.tsx
if (contractChannelState === 1 || contractChannelState === 0) {
  return <DepositPage />;
} else if (contractChannelState === 2) {
  return <TransactionPage />;
} else if (contractChannelState === 3 || contractChannelState === 4) {
  return <WithdrawPage />;
}
```

### 리더 액션 버튼
```typescript
// state-explorer/layout.tsx
{contractChannelState === 1 && (
  <Button onClick={handleInitializeState}>
    Initialize State
  </Button>
)}
{contractChannelState === 2 && (
  <Button onClick={handleCloseChannel}>
    Close Channel
  </Button>
)}
// state === 3, 4일 때는 버튼 없음
```

## 주의사항

1. **참여자 확인 함수 선택**:
   - `state < 2`: `isChannelWhitelisted` 사용 (deposit 단계)
   - `state >= 2`: `isChannelParticipant` 사용 (transaction/withdraw 단계)

2. **상태 전이는 단방향**:
   - None → Initialized → Open → Closing → Closed
   - 역방향 전이는 불가능

3. **리더 권한**:
   - `Initialize State`: state === 1일 때만 리더가 호출 가능
   - `Close Channel`: state === 2일 때만 리더가 호출 가능

4. **에지 케이스**:
   - state === 0 (None)은 일반적으로 나타나지 않지만, Deposit 페이지를 표시하도록 처리

## 관련 파일

- `hooks/useChannelInfo.ts`: 채널 정보를 가져오는 훅
- `app/state-explorer/page.tsx`: 상태에 따라 페이지를 라우팅
- `app/state-explorer/layout.tsx`: 리더 액션 버튼 표시
- `app/join-channel/_hooks/useChannelParticipantCheck.ts`: 참여자 확인 로직

## 참고

- 컨트랙트: `BridgeCore.sol`의 `ChannelState` enum
- 원본 매니저: `Tokamak-zkp-channel-manager/lib/types.ts`의 `ChannelState` enum
