# Transaction Hook Error Handling Pattern

## Overview

이 문서는 wagmi를 사용한 트랜잭션 훅에서 에러 처리 시 반드시 따라야 할 패턴을 설명합니다.
MetaMask 등 지갑에서 사용자가 트랜잭션을 reject했을 때 UI가 올바르게 복구되도록 하는 것이 목적입니다.

## Problem

사용자가 MetaMask에서 트랜잭션 서명을 취소(reject)하면 `writeError`가 발생합니다.
이때 `isProcessing`이나 `isDepositing` 같은 로딩 상태가 `false`로 리셋되지 않으면,
UI에서 버튼이 "Confirming..." 상태로 비활성화된 채 남아있게 됩니다.

## Solution Pattern

### 필수 체크리스트

트랜잭션 훅을 작성할 때 다음을 반드시 확인하세요:

1. **writeError 받기**: `useWriteContract()`에서 `error` 속성을 받아야 합니다.
2. **에러 시 상태 리셋**: `writeError`가 발생하면 반드시 processing 상태를 `false`로 설정합니다.
3. **waitError도 처리**: 트랜잭션 제출 후 실패하는 경우도 처리해야 합니다.

### 올바른 패턴 예시

```typescript
// ✅ 올바른 패턴
const {
  writeContract,
  data: txHash,
  isPending: isWriting,
  error: writeError,  // ← 반드시 받기
} = useWriteContract();

const {
  isLoading: isWaiting,
  isSuccess,
  error: waitError,  // ← 반드시 받기
} = useWaitForTransactionReceipt({
  hash: txHash,
  query: { enabled: !!txHash },
});

// 에러 발생 시 상태 리셋
useEffect(() => {
  if (writeError) {
    setError(writeError.message);
    setIsProcessing(false);  // ← 반드시 리셋
    console.error("Write error:", writeError);
  }
}, [writeError]);

useEffect(() => {
  if (waitError) {
    setError(waitError.message);
    setIsProcessing(false);  // ← 반드시 리셋
    console.error("Wait error:", waitError);
  }
}, [waitError]);
```

### 잘못된 패턴 예시

```typescript
// ❌ 잘못된 패턴 - error를 받지 않음
const {
  writeContract,
  data: txHash,
  isPending: isWriting,
  // error가 없음!
} = useWriteContract();

// ❌ 잘못된 패턴 - 에러 시 상태를 리셋하지 않음
useEffect(() => {
  if (writeError) {
    setError(writeError.message);
    // setIsProcessing(false) 누락!
  }
}, [writeError]);
```

## Hooks Checklist

| Hook | writeError 처리 | waitError 처리 | 상태 |
|------|----------------|----------------|------|
| `useCreateChannel` | ✅ | ✅ | OK |
| `useInitializeState` | ✅ | ✅ | OK |
| `useDeposit` | ✅ | ✅ | OK |
| `useApprove` | ✅ (auto via isPending) | ✅ | OK |
| `useWithdraw` | ✅ | ✅ | OK |
| `useCloseChannel` | ✅ | ✅ | OK |

## Implementation Details

### 자동 상태 리셋 vs 명시적 리셋

일부 훅에서는 `isProcessing`을 `isWriting || isWaiting`으로 계산합니다:

```typescript
// 자동 리셋 방식
useEffect(() => {
  setIsProcessing(isWriting || isWaiting);
}, [isWriting, isWaiting]);
```

이 경우 reject 시 `isWriting`이 `false`가 되어 `isProcessing`도 자동으로 `false`가 됩니다.
그러나 **명시적 리셋을 추가하는 것이 더 안전하고 명확합니다**.

### 커스텀 상태 관리 시 주의사항

`useState`로 직접 processing 상태를 관리하는 경우:

```typescript
const [isProcessing, setIsProcessing] = useState(false);

// 에러 발생 시 반드시 리셋해야 함
useEffect(() => {
  if (writeError || waitError) {
    setIsProcessing(false);  // ← 필수!
  }
}, [writeError, waitError]);
```

## Testing

트랜잭션 훅을 작성/수정한 후 다음을 테스트하세요:

1. MetaMask에서 "Confirm" → 정상 동작 확인
2. MetaMask에서 "Reject" → 버튼이 다시 활성화되는지 확인
3. 트랜잭션 실패 (revert) → 에러 메시지 표시 및 버튼 활성화 확인

## Related Documents

- [CONTRACT_HOOKS_USAGE.md](./CONTRACT_HOOKS_USAGE.md) - 컨트랙트 훅 사용법
- [wagmi.md](./wagmi.md) - Wagmi 설정 및 사용법
