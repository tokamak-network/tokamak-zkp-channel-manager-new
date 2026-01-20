# 컨트랙트 업그레이드: ChannelId 타입 변경

## 중요: ChannelId 타입 차이

**이 문서는 AI 코딩 어시스턴트가 컨트랙트 업그레이드 전후의 channelId 타입 차이를 올바르게 인식하도록 작성되었습니다.**

## 컨트랙트 업그레이드 전후 비교

### 업그레이드 전 (Old Manager)
- **ChannelId 타입**: `uint256`
- **전달 방식**: `BigInt(channelId)`로 변환하여 전달
- **레퍼런스**: `tokamak-zkp-channel-manager-old.txt`에 있는 코드는 업그레이드 전 컨트랙트를 기준으로 작성됨

### 업그레이드 후 (Current Manager)
- **ChannelId 타입**: `bytes32`
- **전달 방식**: Hex string (`0x...`) 그대로 전달
- **레퍼런스**: `tokamak-zk-evm-contracts.txt`에 있는 최신 컨트랙트 코드 반영

## 영향받는 함수들

다음 함수들은 모두 channelId를 `bytes32`로 받습니다:

1. **`submitProofAndSignature`**
   ```solidity
   function submitProofAndSignature(bytes32 channelId, ProofData[] calldata proofs, Signature calldata signature)
   ```

2. **`getChannelInfo`**
   ```solidity
   function getChannelInfo(bytes32 channelId) external view returns (...)
   ```

3. **`getChannelState`**
   ```solidity
   function getChannelState(bytes32 channelId) external view returns (ChannelState)
   ```

4. 기타 모든 channelId를 파라미터로 받는 함수들

## 코드 작성 시 주의사항

### ❌ 잘못된 방법 (업그레이드 전 방식)
```typescript
// channelId를 BigInt로 변환 (잘못됨!)
const channelIdUint256 = BigInt(channelId);
writeContract({
  functionName: "submitProofAndSignature",
  args: [channelIdUint256, proofs, signature] // ❌ uint256으로 전달하면 안됨
});
```

### ✅ 올바른 방법 (업그레이드 후 방식)
```typescript
// channelId를 bytes32 hex string으로 전달
let channelIdBytes32: `0x${string}`;
if (channelId.startsWith("0x")) {
  // 이미 hex string이면 그대로 사용
  channelIdBytes32 = channelId as `0x${string}`;
} else {
  // 숫자 문자열이면 bytes32 hex 형식으로 변환
  const hexValue = BigInt(channelId).toString(16).padStart(64, "0");
  channelIdBytes32 = `0x${hexValue}` as `0x${string}`;
}

writeContract({
  functionName: "submitProofAndSignature",
  args: [channelIdBytes32, proofs, signature] // ✅ bytes32로 전달
});
```

## 레퍼런스 문서 참고 시 주의

1. **`tokamak-zkp-channel-manager-old.txt`**
   - ⚠️ **업그레이드 전 코드**를 참고한 문서
   - channelId를 `uint256`으로 처리하는 코드가 포함되어 있음
   - **현재 프로젝트에서는 사용하지 않음**

2. **`tokamak-zk-evm-contracts.txt`**
   - ✅ **최신 컨트랙트 코드** 반영
   - channelId는 모두 `bytes32` 타입
   - **이 문서를 기준으로 코드 작성**

## ABI 확인 방법

컨트랙트 ABI에서 channelId 타입을 확인하려면:

```typescript
// packages/config/src/contracts/abis.ts
{
  "name": "submitProofAndSignature",
  "inputs": [
    {
      "name": "channelId",
      "type": "bytes32",  // ✅ bytes32 확인
      "internalType": "bytes32"
    },
    // ...
  ]
}
```

## 요약

- **현재 프로젝트**: channelId는 **항상 `bytes32`** 타입
- **Old Manager 레퍼런스**: `uint256` 타입이지만 **사용하지 않음**
- **코드 작성 시**: channelId를 hex string으로 직접 전달하거나 bytes32 형식으로 변환
