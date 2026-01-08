# Migration Patterns & Guidelines

이 문서는 기존 레거시 코드를 새로운 아키텍처로 마이그레이션할 때 따라야 할 패턴과 가이드라인을 정의합니다.

---

## 🎯 핵심 원칙

### 1. 비즈니스 로직과 UI의 엄격한 분리

**UI 컴포넌트** (`packages/ui/`)
- 순수한 프레젠테이션 컴포넌트만 포함
- Props를 통해서만 데이터와 콜백을 받음
- 비즈니스 로직, 상태 관리, API 호출 금지
- 재사용 가능하고 테스트하기 쉬운 구조

**비즈니스 로직** (`app/`)
- 커스텀 훅 (`app/*/hooks/`)
- 상태 관리
- API 호출 및 데이터 변환
- 페이지별 특화 로직

---

## 📁 디렉토리 구조

### UI 컴포넌트 (packages/ui)

```
packages/ui/src/
├── components/
│   ├── forms/              # 폼 관련 컴포넌트
│   │   ├── FormField.tsx
│   │   ├── FormInput.tsx
│   │   └── FormSelect.tsx
│   ├── buttons/            # 버튼 컴포넌트
│   ├── modals/             # 모달 컴포넌트
│   └── ...
└── index.ts
```

### 비즈니스 로직 (app)

```
app/
├── channels/
│   ├── page.tsx            # 메인 페이지 (UI 컴포넌트 조합)
│   ├── hooks/               # 페이지별 훅
│   │   ├── useCreateChannel.ts
│   │   └── useChannelData.ts
│   └── _components/         # 페이지별 특화 컴포넌트 (비즈니스 로직 포함)
│       ├── CreateChannelForm.tsx
│       └── ChannelList.tsx
```

---

## 🔄 마이그레이션 패턴

### 패턴 1: 페이지 통합

**기존 (레거시)**
```
app/
├── create-channel/
│   └── page.tsx
├── deposit-tokens/
│   └── page.tsx
└── channels/
    └── page.tsx
```

**새로운 구조**
```
app/
└── channels/
    ├── page.tsx              # 단일 페이지로 통합
    ├── hooks/
    │   ├── useCreateChannel.ts
    │   ├── useDeposit.ts
    │   └── useChannelData.ts
    └── _components/
        ├── CreateChannelSection.tsx
        ├── DepositSection.tsx
        └── ChannelListSection.tsx
```

### 패턴 2: 컴포넌트 분리

#### ✅ 올바른 예시

**UI 컴포넌트** (`packages/ui/src/components/forms/FormInput.tsx`)
```tsx
// 순수 UI 컴포넌트 - 비즈니스 로직 없음
interface FormInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
}

export function FormInput({ 
  label, 
  value, 
  onChange, 
  error, 
  placeholder 
}: FormInputProps) {
  return (
    <div>
      <label>{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      {error && <span className="error">{error}</span>}
    </div>
  );
}
```

**비즈니스 로직** (`app/channels/_components/CreateChannelForm.tsx`)
```tsx
'use client';

import { FormInput } from '@tokamak/ui';
import { useCreateChannel } from '../hooks/useCreateChannel';

export function CreateChannelForm() {
  const {
    formData,
    errors,
    isLoading,
    handleChange,
    handleSubmit,
  } = useCreateChannel();

  return (
    <form onSubmit={handleSubmit}>
      <FormInput
        label="Channel Name"
        value={formData.name}
        onChange={(value) => handleChange('name', value)}
        error={errors.name}
        placeholder="Enter channel name"
      />
      {/* ... */}
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Creating...' : 'Create Channel'}
      </button>
    </form>
  );
}
```

**커스텀 훅** (`app/channels/hooks/useCreateChannel.ts`)
```tsx
import { useState } from 'react';
import { useWriteContract } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@tokamak/config/networks';

export function useCreateChannel() {
  const [formData, setFormData] = useState({ name: '', participants: [] });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { writeContract, isPending } = useWriteContract();

  const handleChange = (field: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Validation logic here
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Business logic: validation, API calls, contract interactions
    await writeContract({
      address: CONTRACT_ADDRESSES.sepolia.BridgeCore,
      abi: BRIDGE_CORE_ABI,
      functionName: 'createChannel',
      args: [formData.name, formData.participants],
    });
  };

  return {
    formData,
    errors,
    isLoading: isPending,
    handleChange,
    handleSubmit,
  };
}
```

#### ❌ 잘못된 예시

```tsx
// ❌ UI 컴포넌트에 비즈니스 로직 포함
export function FormInput({ label }: { label: string }) {
  const { writeContract } = useWriteContract(); // ❌ 훅 사용 금지
  const [data, setData] = useState(); // ❌ 상태 관리 금지
  
  const handleSubmit = async () => {
    await fetch('/api/channels'); // ❌ API 호출 금지
  };
  
  return <input />;
}
```

---

## 📋 마이그레이션 체크리스트

### Create Channel 마이그레이션 예시

#### 1단계: UI 컴포넌트 추출
- [ ] 기존 폼 필드들을 `packages/ui`로 이동
- [ ] Props 인터페이스 정의 (비즈니스 로직 제거)
- [ ] 스타일링 및 접근성 확인

#### 2단계: 비즈니스 로직 분리
- [ ] 커스텀 훅 생성 (`useCreateChannel.ts`)
- [ ] 상태 관리 로직 이동
- [ ] API 호출 로직 이동
- [ ] 컨트랙트 상호작용 로직 이동

#### 3단계: 페이지 통합
- [ ] 기존 `create-channel/page.tsx` 내용 분석
- [ ] `channels/page.tsx`에 섹션으로 통합
- [ ] 라우팅 및 네비게이션 업데이트

#### 4단계: 테스트
- [ ] UI 컴포넌트 단위 테스트
- [ ] 훅 단위 테스트
- [ ] 통합 테스트

---

## 🎨 컴포넌트 설계 원칙

### UI 컴포넌트 설계

1. **Props 기반 통신**
   ```tsx
   // ✅ Good
   <Button onClick={handleClick} disabled={isLoading}>
     Submit
   </Button>
   
   // ❌ Bad
   <Button onSubmit={async () => { /* logic */ }}>
     Submit
   </Button>
   ```

2. **제어 컴포넌트 패턴**
   ```tsx
   // ✅ Good - Controlled component
   <Input value={value} onChange={setValue} />
   
   // ❌ Bad - Uncontrolled with internal state
   <Input defaultValue={value} />
   ```

3. **타입 안정성**
   ```tsx
   // ✅ Good - Strict types
   interface ButtonProps {
     variant: 'primary' | 'secondary' | 'danger';
     size: 'sm' | 'md' | 'lg';
     onClick: () => void;
   }
   ```

### 비즈니스 로직 설계

1. **훅으로 로직 캡슐화**
   ```tsx
   // ✅ Good
   const { data, isLoading, error, refetch } = useChannelData(channelId);
   
   // ❌ Bad - Component에 직접 로직
   function ChannelDetails() {
     const [data, setData] = useState();
     useEffect(() => { /* fetch logic */ }, []);
   }
   ```

2. **에러 처리**
   ```tsx
   // ✅ Good - Centralized error handling
   export function useCreateChannel() {
     try {
       // logic
     } catch (error) {
       // error handling
       return { error: error.message };
     }
   }
   ```

3. **로딩 상태 관리**
   ```tsx
   // ✅ Good - Loading state in hook
   const { isLoading, data } = useCreateChannel();
   
   if (isLoading) return <Spinner />;
   ```

---

## 🔗 의존성 규칙

### 허용되는 의존성

**UI 컴포넌트에서:**
- ✅ `@tokamak/ui` 내부 컴포넌트
- ✅ React 기본 훅 (`useState`, `useRef` - UI 상태만)
- ✅ 타입 정의 (`@tokamak/config`의 타입만)

**비즈니스 로직에서:**
- ✅ `@tokamak/config` (상수, 네트워크 설정)
- ✅ `@tokamak/ui` (UI 컴포넌트)
- ✅ `wagmi`, `viem` (블록체인 상호작용)
- ✅ API 라우트 (`/api/*`)

### 금지되는 의존성

**UI 컴포넌트에서:**
- ❌ `wagmi`, `viem` (블록체인 로직)
- ❌ API 호출 (`fetch`, `axios`)
- ❌ 비즈니스 로직 훅
- ❌ 컨텍스트 (Theme 제외)

---

## 📝 네이밍 컨벤션

### UI 컴포넌트
- `FormInput.tsx` - 폼 입력 필드
- `Modal.tsx` - 모달 컨테이너
- `Button.tsx` - 버튼 컴포넌트

### 비즈니스 컴포넌트
- `CreateChannelForm.tsx` - 채널 생성 폼 (로직 포함)
- `ChannelList.tsx` - 채널 목록 (데이터 fetching 포함)

### 훅
- `useCreateChannel.ts` - 채널 생성 로직
- `useChannelData.ts` - 채널 데이터 fetching
- `useDeposit.ts` - 입금 로직

---

## 🚀 마이그레이션 순서

1. **Create Channel** (현재 진행 중)
   - UI 컴포넌트 추출
   - 비즈니스 로직 분리
   - 페이지 통합

2. **Deposit Tokens**
   - 동일한 패턴 적용

3. **Channel Management**
   - 리스트, 상세, 수정 등

4. **DKG Integration**
   - FROST DKG 로직 마이그레이션

5. **Proof Generation**
   - ZK Proof 생성 로직

---

## 📚 참고 자료

- [기존 아키텍처 분석](./ARCHITECTURE.md)
- [전체 마이그레이션 가이드](./MIGRATION_GUIDE.md)
- [UI 패키지 가이드](../packages/ui/CLAUDE.md)
- [Config 패키지 가이드](../packages/config/CLAUDE.md)

---

## ⚠️ 주의사항

1. **점진적 마이그레이션**: 한 번에 모든 것을 바꾸지 말고 단계적으로 진행
2. **기존 코드 보존**: 마이그레이션 완료 전까지 레거시 코드 유지
3. **테스트 우선**: 마이그레이션 전후 동작이 동일한지 확인
4. **타입 안정성**: TypeScript 타입을 엄격하게 유지
5. **재사용성**: UI 컴포넌트는 최대한 재사용 가능하게 설계

---

**마지막 업데이트**: 2026-01-08
**다음 마이그레이션**: Create Channel 기능

