# Channel ID Format Guide

## 개요

모든 스마트 컨트랙트 함수는 `channelId`를 **bytes32** 형식으로 요구합니다. 이 문서는 channelId를 올바르게 처리하는 방법을 설명합니다.

## Channel ID 형식

### Contract 요구사항
- **타입**: `bytes32`
- **형식**: `0x` + 64자리 hex 문자열 (총 66자)
- **예시**: `0x97d35a8b3b938afa65d8305a201a254b609c0697fbbb63ad6bf7eacd3461dde6`

### 내부 표현
애플리케이션 내부에서는 다양한 형식으로 channelId를 사용할 수 있습니다:
- `bigint`: 숫자로 표현된 channelId
- `string`: 문자열로 표현된 channelId (hex 또는 숫자)
- `0x${string}`: 이미 bytes32 형식

## 유틸리티 함수

### `toBytes32(channelId)`

모든 형식의 channelId를 bytes32로 변환하는 표준 함수입니다.

**위치**: `lib/channelId.ts`

**사용법**:
```typescript
import { toBytes32 } from '@/lib/channelId';

// bigint에서 변환
const channelId = BigInt(123);
const bytes32Id = toBytes32(channelId);
// 결과: "0x000000000000000000000000000000000000000000000000000000000000007b"

// hex 문자열에서 변환
const bytes32Id = toBytes32("0x97d35a8b3b938afa65d8305a201a254b609c0697fbbb63ad6bf7eacd3461dde6");
// 결과: 동일한 문자열 (검증됨)

// 숫자 문자열에서 변환
const bytes32Id = toBytes32("123");
// 결과: "0x000000000000000000000000000000000000000000000000000000000000007b"
```

**반환값**: `0x${string} | undefined`

## Contract 호출 시 사용 규칙

### ✅ 올바른 사용법

모든 contract write/read 호출에서 channelId를 bytes32로 변환해야 합니다:

```typescript
import { toBytes32 } from '@/lib/channelId';

// Contract write 호출
const channelIdBytes32 = toBytes32(channelId);
if (!channelIdBytes32) {
  throw new Error("Invalid channel ID");
}

writeContract({
  functionName: "initializeChannelState",
  args: [channelIdBytes32, proof],
});

// Contract read 호출
const channelIdBytes32 = toBytes32(channelId);
const { data } = useBridgeCoreRead({
  functionName: "getChannelInfo",
  args: channelIdBytes32 ? [channelIdBytes32] : undefined,
});
```

### ❌ 잘못된 사용법

```typescript
// ❌ bigint를 직접 전달
writeContract({
  functionName: "initializeChannelState",
  args: [BigInt(channelId), proof], // 잘못됨!
});

// ❌ 문자열을 직접 전달
writeContract({
  functionName: "initializeChannelState",
  args: [channelId, proof], // channelId가 string이면 잘못됨!
});
```

## 적용된 파일 목록

다음 파일들에서 `toBytes32`를 사용하여 channelId를 올바르게 변환합니다:

### Contract Write 호출
- ✅ `app/initialize-state/page.tsx` - `initializeChannelState`
- ✅ `app/submit-proof/page.tsx` - `submitProofAndSignature`
- ✅ `app/create-channel/_hooks/useDeposit.ts` - `depositToken`
- ✅ `app/state-explorer/deposit/_hooks/useDeposit.ts` - `depositToken`
- ✅ `app/state-explorer/_hooks/useSubmitProof.ts` - `submitProofAndSignature`
- ✅ `app/state-explorer/_hooks/useCloseChannel.ts` - `verifyFinalBalancesGroth16` (이미 bytes32 사용)

### Contract Read 호출
- ✅ `hooks/useChannelInfo.ts` - `getChannelInfo`, `getChannelParticipants` (내부 변환 로직 사용)
- ✅ `app/join-channel/_hooks/useChannelParticipantCheck.ts` - `isChannelWhitelisted` (이미 bytes32 사용)
- ✅ `app/state-explorer/_hooks/usePreviousStateSnapshot.ts` - contract read 호출 (내부 변환 로직 사용)

## Store 및 State 관리

### useChannelFlowStore
- `channelId`: `bigint | null` - 내부 상태 관리용
- Contract 호출 시 `toBytes32()`로 변환 필요

### useChannelInfo Hook
- 입력: `bigint | 0x${string} | null | undefined`
- 내부적으로 bytes32로 자동 변환
- Contract 호출 시 bytes32 사용

## 검증 함수

### `isValidBytes32(value: string)`

bytes32 형식인지 검증하는 함수입니다.

**위치**: `lib/channelId.ts`

**사용법**:
```typescript
import { isValidBytes32 } from '@/lib/channelId';

if (isValidBytes32(channelId)) {
  // channelId가 올바른 bytes32 형식입니다
}
```

## 주의사항

1. **항상 변환**: Contract 호출 전에 항상 `toBytes32()`를 사용하세요
2. **null 체크**: `toBytes32()`는 `undefined`를 반환할 수 있으므로 null 체크를 수행하세요
3. **일관성**: 모든 contract 호출에서 동일한 변환 로직을 사용하세요
4. **타입 안정성**: TypeScript 타입을 활용하여 컴파일 타임에 오류를 잡으세요

## 마이그레이션 체크리스트

새로운 contract 호출을 추가할 때:

- [ ] `toBytes32()` import 확인
- [ ] channelId를 bytes32로 변환
- [ ] null/undefined 체크 추가
- [ ] Contract ABI에서 channelId 타입이 bytes32인지 확인
- [ ] 테스트에서 올바른 형식으로 전달되는지 확인

## 관련 문서

- `lib/channelId.ts` - Channel ID 유틸리티 함수
- `docs/CHANNEL_STATE.md` - Channel 상태 관리 가이드
- `docs/development/CONTRACT_HOOKS_USAGE.md` - Contract hooks 사용법
