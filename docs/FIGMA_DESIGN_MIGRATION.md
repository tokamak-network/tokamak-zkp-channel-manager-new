# Figma 디자인 마이그레이션 가이드

Figma 디자인을 코드로 옮길 때 **반드시 Figma에 정의된 모든 스타일 속성을 정확히 그대로** 옮겨야 합니다.

## 📋 필수 확인 항목

Figma 디자인을 코드로 옮길 때 다음 속성들을 **반드시 확인하고 정확히 적용**해야 합니다:

### 1. 폰트 (Typography)

- ✅ **Font Family**: Figma에서 정의된 폰트 패밀리 그대로 사용
  - 예: "Jersey 10", "Press Start 2P", "Inter" 등
  - Google Fonts에서 로드해야 하는 경우 `app/layout.tsx`에서 import
- ✅ **Font Size**: Figma에 표시된 픽셀 값 그대로 사용 (px 단위)
  - 반응형을 위해 `clamp()` 사용 금지
  - 정확한 픽셀 값 사용
- ✅ **Font Weight**: Figma에 정의된 weight 값 그대로 사용
  - 예: 400, 500, 600, 700 등
  - `font-bold`, `font-normal` 같은 Tailwind 클래스 대신 정확한 숫자 값 사용
- ✅ **Line Height**: Figma에 정의된 line height 값
- ✅ **Letter Spacing**: Figma에 정의된 letter spacing 값

### 2. 색상 (Colors)

- ✅ **Text Color**: Figma에 정의된 정확한 hex 색상 코드
  - 예: `#23232D`, `#666666`, `#000000` 등
- ✅ **Background Color**: Figma에 정의된 정확한 hex 색상 코드
  - 예: `#F8F8F8`, `#FFFFFF`, `#4278F5` 등
- ✅ **Border Color**: Figma에 정의된 정확한 hex 색상 코드
  - 예: `#EEEEEE`, `#ACCAFF`, `#D8CFFF` 등

### 3. 크기 및 간격 (Dimensions & Spacing)

- ✅ **Width**: Figma에 정의된 컴포넌트 가로 길이 (px 단위)
  - 예: `200px`, `400px`, `1440px` 등
- ✅ **Height**: Figma에 정의된 컴포넌트 세로 길이 (px 단위)
  - 예: `64px`, `80px` 등
- ✅ **Padding**: Figma에 정의된 padding 값
- ✅ **Margin/Gap**: Figma에 정의된 요소 간 간격
- ✅ **Border Radius**: Figma에 정의된 border radius 값

### 4. 레이아웃 (Layout)

- ✅ **Container Max Width**: Figma에 정의된 최대 너비
- ✅ **Flex Direction**: 요소 배치 방향 (row, column)
- ✅ **Alignment**: 정렬 방식 (center, start, end 등)
- ✅ **Gap**: 요소 간 간격

## 🔍 Figma에서 속성 확인하는 방법

1. **텍스트 속성 확인**:
   - 텍스트 레이어 선택
   - 우측 패널에서 "Text" 섹션 확인
   - Font family, Size, Weight, Line height, Letter spacing 확인

2. **색상 확인**:
   - 레이어 선택
   - 우측 패널에서 "Fill" 또는 "Stroke" 확인
   - Hex 코드 복사 (예: `#23232D`)

3. **크기 확인**:
   - 레이어 선택
   - 우측 패널에서 "Size" 확인
   - Width, Height 값 확인

4. **간격 확인**:
   - 여러 레이어 선택
   - 우측 하단에 표시되는 간격 값 확인
   - 또는 수동으로 측정

## 📝 코드 작성 패턴

### 폰트 로드 (app/layout.tsx)

```tsx
import { Jersey_10 } from "next/font/google";

const jersey10 = Jersey_10({
  weight: "400",  // Figma에 정의된 weight 그대로
  subsets: ["latin"],
  variable: "--font-jersey-10",
  display: "swap",
});

export default function RootLayout({ children }) {
  return (
    <html className={jersey10.variable}>
      {/* ... */}
    </html>
  );
}
```

### 스타일 적용 (컴포넌트)

```tsx
// ❌ 잘못된 예: Tailwind 클래스와 반응형 사용
<h1 className="text-5xl md:text-6xl font-bold text-gray-900">
  Title
</h1>

// ✅ 올바른 예: Figma 값 그대로 인라인 스타일 사용
<h1
  style={{
    fontFamily: 'var(--font-jersey-10), "Jersey 10", sans-serif',
    fontSize: '64px',  // Figma에 정의된 정확한 값
    fontWeight: '400',  // Figma에 정의된 정확한 값
    lineHeight: '1.2',  // Figma에 정의된 정확한 값
    letterSpacing: '0.02em',  // Figma에 정의된 정확한 값
    color: '#000000',  // Figma에 정의된 정확한 hex 색상
  }}
>
  Title
</h1>
```

### 버튼 스타일

```tsx
// ✅ Figma 값 그대로 적용
<button
  style={{
    width: '200px',  // Figma에 정의된 정확한 너비
    height: '64px',  // Figma에 정의된 정확한 높이
    fontSize: '18px',  // Figma에 정의된 정확한 폰트 사이즈
    fontWeight: '400',  // Figma에 정의된 정확한 weight
    fontFamily: 'system-ui, -apple-system, sans-serif',  // Figma에 정의된 폰트
    backgroundColor: '#4278F5',  // Figma에 정의된 정확한 색상
    border: '1px solid #ACCAFF',  // Figma에 정의된 정확한 테두리
    borderRadius: '8px',  // Figma에 정의된 정확한 border radius
    color: '#FFFFFF',  // Figma에 정의된 정확한 텍스트 색상
  }}
>
  Button Text
</button>
```

## ✅ 체크리스트

Figma 디자인을 코드로 옮길 때 다음 체크리스트를 확인하세요:

- [ ] **Font Family**: Figma에 정의된 폰트 패밀리 그대로 적용했는가?
- [ ] **Font Size**: Figma에 표시된 픽셀 값 그대로 사용했는가? (반응형 `clamp()` 사용하지 않음)
- [ ] **Font Weight**: Figma에 정의된 숫자 값 그대로 사용했는가? (Tailwind 클래스 대신)
- [ ] **Line Height**: Figma에 정의된 값 그대로 사용했는가?
- [ ] **Letter Spacing**: Figma에 정의된 값 그대로 사용했는가?
- [ ] **Text Color**: Figma에 정의된 hex 색상 코드 그대로 사용했는가?
- [ ] **Background Color**: Figma에 정의된 hex 색상 코드 그대로 사용했는가?
- [ ] **Border Color**: Figma에 정의된 hex 색상 코드 그대로 사용했는가?
- [ ] **Width**: Figma에 정의된 컴포넌트 가로 길이 그대로 사용했는가?
- [ ] **Height**: Figma에 정의된 컴포넌트 세로 길이 그대로 사용했는가?
- [ ] **Padding/Margin**: Figma에 정의된 간격 값 그대로 사용했는가?
- [ ] **Border Radius**: Figma에 정의된 값 그대로 사용했는가?

## 🚫 하지 말아야 할 것

1. ❌ **반응형을 위해 `clamp()` 사용**: Figma에 정의된 정확한 픽셀 값 사용
2. ❌ **Tailwind 클래스로 추상화**: `font-bold`, `text-5xl` 등 대신 정확한 값 사용
3. ❌ **대략적인 색상 사용**: `text-gray-900` 대신 정확한 hex 코드 `#23232D` 사용
4. ❌ **임의의 크기 조정**: Figma에 정의된 정확한 크기 사용
5. ❌ **폰트 weight 추정**: Figma에 정의된 정확한 숫자 값 사용

## 📌 참고 예시

현재 구현된 홈 페이지 (`app/(home)/page.tsx`)를 참고하세요:

- **제목 (지갑 연결 상태)**: Jersey 10, 64px, weight 400
- **부제목**: System UI, 24px, weight 400
- **버튼**: 200px × 64px, 18px 폰트
- **색상**: 정확한 hex 코드 사용 (`#4278F5`, `#7E57FB`, `#23232D` 등)

## 🔗 관련 문서

- [MIGRATION_PATTERNS.md](./MIGRATION_PATTERNS.md) - 컴포넌트 마이그레이션 패턴
- [COMPONENT_SEPARATION_GUIDE.md](./COMPONENT_SEPARATION_GUIDE.md) - 컴포넌트 분리 가이드
