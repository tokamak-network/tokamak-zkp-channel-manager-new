# Contract Hooks

공통 컨트랙트 호출 훅 모음입니다. `@tokamak/config`에서 컨트랙트 주소와 ABI를 자동으로 가져와 사용합니다.

## 사용법

### BridgeCore 컨트랙트

#### Read (읽기)

```tsx
import { useBridgeCoreRead } from '@/hooks/contract';

function MyComponent() {
  const { data, isLoading, error } = useBridgeCoreRead({
    functionName: 'getChannelInfo',
    args: [channelId],
  });
  
  return <div>{data?.toString()}</div>;
}
```

#### Write (쓰기)

```tsx
import { useBridgeCorePrepareWrite, useBridgeCoreWrite } from '@/hooks/contract';

function MyComponent() {
  const { config, error: prepareError } = useBridgeCorePrepareWrite({
    functionName: 'openChannel',
    args: [{
      targetContract: '0x...',
      whitelisted: ['0x...'],
      enableFrostSignature: false,
    }],
  });
  
  const { write, isLoading, error } = useBridgeCoreWrite({
    ...config,
    onSuccess: (data) => {
      console.log('Transaction hash:', data.hash);
    },
  });
  
  return (
    <button onClick={() => write?.()}>
      Create Channel
    </button>
  );
}
```

### 다른 컨트랙트들

- `useBridgeDepositManagerRead` / `useBridgeDepositManagerWrite`
- `useBridgeProofManagerRead` / `useBridgeProofManagerWrite`
- `useBridgeWithdrawManagerRead` / `useBridgeWithdrawManagerWrite`

## 특징

- ✅ 자동 네트워크 감지: 현재 연결된 네트워크에 맞는 컨트랙트 주소 사용
- ✅ 타입 안전성: TypeScript로 완전한 타입 지원
- ✅ wagmi 통합: wagmi의 모든 기능 활용 가능
- ✅ 중앙화된 설정: `@tokamak/config`에서 주소와 ABI 관리

