# Tokamak ZKP Channel Manager - Migration & Architecture Guide

## 📋 Overview

This document outlines the migration plan from the legacy `Tokamak-zkp-channel-manager` repository to the new monorepo structure. It serves as a guide for development instructions.

---

## 🏗️ New Architecture

### Monorepo Structure (Turborepo + pnpm)

```
tokamak-zkp-channel-manager-new/
├── apps/
│   └── web/                          # Next.js 15 Application
│       ├── app/                      # App Router pages
│       ├── components/               # App-specific components
│       └── ...
│
├── packages/
│   ├── ui/                           # Shared UI components (shadcn/ui)
│   │   ├── components/
│   │   └── styles/
│   │
│   ├── contracts/                    # Contract ABIs & addresses
│   │   ├── abis/
│   │   ├── addresses/
│   │   └── types/
│   │
│   ├── frost-wasm/                   # FROST WASM bindings
│   │   ├── pkg/                      # Built WASM files
│   │   └── wrapper/                  # TypeScript wrappers
│   │
│   ├── zk-utils/                     # ZK proof utilities
│   │   ├── circuits/
│   │   └── proof-generation/
│   │
│   ├── lib/                          # Shared utilities & types
│   │   ├── types/
│   │   ├── utils/
│   │   └── hooks/
│   │
│   └── config/                       # Shared configurations
│       ├── eslint/
│       ├── typescript/
│       └── tailwind/
│
├── external/                         # Git Subtree (read-only)
│   ├── frost-dkg/                    # For WASM rebuilding only
│   └── zk-evm/                       # For circuit compilation only
│
├── scripts/
│   ├── fetch-contracts.mjs           # Fetch deployed contract ABIs
│   ├── sync-external.sh              # Update git subtrees
│   └── build-wasm.sh                 # Rebuild FROST WASM
│
├── docs/
│   ├── MIGRATION_GUIDE.md            # This file
│   ├── ARCHITECTURE.md               # Detailed architecture docs
│   └── DEVELOPMENT.md                # Development workflow
│
├── turbo.json                        # Turborepo configuration
├── pnpm-workspace.yaml               # pnpm workspace config
├── package.json                      # Root package.json
└── README.md
```

---

## 📦 Package Responsibilities

### `apps/web`

- Next.js 15 application with App Router
- Page components and routing
- API routes (if needed)
- App-level state management

### `packages/ui`

- Reusable UI components based on shadcn/ui
- Design system tokens (colors, typography, spacing)
- Tailwind CSS configuration

### `packages/contracts`

- Contract ABI types (generated from deployed contracts)
- Contract addresses per network
- Wagmi/Viem hooks for contract interactions
- **NO Solidity source code** - fetched from deployment

### `packages/frost-wasm`

- Pre-built WASM binaries for FROST DKG
- TypeScript wrapper functions
- DKG protocol utilities
- **Source in `external/frost-dkg`** - only for rebuilding

### `packages/zk-utils`

- Circom circuit interfaces
- Proof generation utilities (snarkjs)
- WASM/zkey file management
- **Source in `external/zk-evm`** - only for circuit compilation

### `packages/lib`

- Shared TypeScript types
- Utility functions
- Custom React hooks
- Constants and configurations

---

## 🔄 Migration Phases

### Phase 1: Setup & Infrastructure

- [ ] Initialize monorepo with Turborepo
- [ ] Configure pnpm workspace
- [ ] Setup shared TypeScript/ESLint/Tailwind configs
- [ ] Create base package structures

### Phase 2: Core Packages

- [ ] Migrate `packages/contracts` (ABIs, addresses)
- [ ] Migrate `packages/frost-wasm` (WASM bindings)
- [ ] Migrate `packages/lib` (types, utils)
- [ ] Migrate `packages/ui` (components)

### Phase 3: Application

- [ ] Setup `apps/web` with Next.js 15
- [ ] Migrate pages from old repository
- [ ] Migrate API routes
- [ ] Update imports to use workspace packages

### Phase 4: External Dependencies

- [ ] Add `external/frost-dkg` as git subtree
- [ ] Add `external/zk-evm` as git subtree (if needed)
- [ ] Setup build scripts for WASM/circuits

### Phase 5: Testing & Optimization

- [ ] Add unit tests for packages
- [ ] Setup CI/CD pipeline
- [ ] Performance optimization
- [ ] Documentation completion

---

## 📁 File Mapping (Old → New)

### From `Tokamak-zkp-channel-manager`:

| Old Path            | New Path                                   | Notes              |
| ------------------- | ------------------------------------------ | ------------------ |
| `app/`              | `apps/web/app/`                            | Pages migration    |
| `components/ui/`    | `packages/ui/components/`                  | Shared UI          |
| `components/dkg/`   | `apps/web/components/dkg/`                 | App-specific       |
| `components/*.tsx`  | Split between `apps/web` and `packages/ui` | Case by case       |
| `lib/types.ts`      | `packages/lib/types/`                      | Shared types       |
| `lib/contracts.ts`  | `packages/contracts/`                      | Contract utilities |
| `lib/frost-wasm.ts` | `packages/frost-wasm/wrapper/`             | WASM wrapper       |
| `lib/wasm/pkg/`     | `packages/frost-wasm/pkg/`                 | WASM binaries      |
| `hooks/`            | `packages/lib/hooks/`                      | Shared hooks       |
| `proof-generation/` | `packages/zk-utils/`                       | ZK utilities       |

### Not Migrated (Fetched/External):

| Old Path          | New Approach                                     |
| ----------------- | ------------------------------------------------ |
| `contracts/`      | Fetch ABIs from GitHub (no source needed)        |
| `frost-dkg/`      | Git subtree in `external/` (only for WASM build) |
| `Tokamak-Zk-EVM/` | Git subtree in `external/` (only for circuits)   |

---

## 🛠️ Development Commands

```bash
# Install dependencies
pnpm install

# Development
pnpm dev                    # Start all apps
pnpm dev --filter web       # Start web app only

# Build
pnpm build                  # Build all packages
pnpm build --filter web     # Build web app only

# Type checking
pnpm typecheck

# Linting
pnpm lint
pnpm lint:fix

# Testing
pnpm test

# External dependencies
pnpm sync:external          # Update git subtrees
pnpm build:wasm             # Rebuild FROST WASM
pnpm fetch:contracts        # Fetch contract ABIs
```

---

## 🎯 Key Improvements Over Old Repository

### 1. **Clear Package Boundaries**

- Each package has a single responsibility
- Dependencies are explicit and manageable
- Easier to test and maintain

### 2. **No Unnecessary Submodules**

- Contracts: Fetch deployed ABIs (no source needed)
- FROST: Pre-built WASM included, source only for rebuilding
- ZK-EVM: Only needed for circuit compilation

### 3. **Better Developer Experience**

- Turborepo caching for faster builds
- Shared configurations reduce duplication
- Clear import paths with workspace aliases

### 4. **Scalability**

- Easy to add new apps (mobile, admin, etc.)
- Packages can be published to npm if needed
- CI/CD can build/test packages independently

---

## 🎨 Tailwind CSS Styling Convention

### @apply로 커스텀 클래스 정의

Tailwind의 유틸리티 클래스가 길어지면 가독성이 떨어지므로, `@apply`를 사용해 커스텀 클래스를 정의합니다.

### 파일 구조

```
styles/
├── globals.css           # 글로벌 스타일 + Tailwind directives
├── components.css        # 컴포넌트 클래스 (@layer components)
└── utilities.css         # 유틸리티 클래스 (@layer utilities)
```

### globals.css 예시

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* 컴포넌트 레이어에 커스텀 클래스 정의 */
@layer components {
  /* 버튼 */
  .btn {
    @apply inline-flex items-center justify-center rounded-lg font-medium transition-colors;
    @apply focus:outline-none focus:ring-2 focus:ring-offset-2;
    @apply disabled:cursor-not-allowed disabled:opacity-50;
  }

  .btn-primary {
    @apply btn bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500;
  }

  .btn-secondary {
    @apply btn bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500;
  }

  .btn-outline {
    @apply btn border border-gray-300 bg-transparent hover:bg-gray-50 focus:ring-gray-500;
  }

  .btn-sm { @apply px-3 py-1.5 text-sm; }
  .btn-md { @apply px-4 py-2; }
  .btn-lg { @apply px-6 py-3 text-lg; }

  /* 카드 */
  .card {
    @apply rounded-xl border border-gray-200 bg-white;
  }

  .card-hover {
    @apply transition-shadow hover:shadow-md;
  }

  .card-header {
    @apply border-b border-gray-200 px-6 py-4;
  }

  .card-content {
    @apply px-6 py-4;
  }

  .card-footer {
    @apply border-t border-gray-200 px-6 py-4;
  }

  /* 인풋 */
  .input {
    @apply w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2;
    @apply focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent;
    @apply disabled:cursor-not-allowed disabled:opacity-50;
  }

  .input-error {
    @apply border-red-500 focus:ring-red-500;
  }

  /* 레이아웃 */
  .container-page {
    @apply mx-auto max-w-6xl px-4 py-8;
  }

  .section {
    @apply py-16;
  }
}

@layer utilities {
  /* 텍스트 */
  .text-muted {
    @apply text-gray-500;
  }

  /* 그라디언트 */
  .gradient-primary {
    @apply bg-gradient-to-r from-primary-500 to-primary-700;
  }
}
```

### 사용 예시

```tsx
// ❌ Before: 가독성 나쁨
<button className="inline-flex items-center justify-center rounded-lg font-medium transition-colors bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50">
  Submit
</button>

// ✅ After: 가독성 좋음
<button className="btn-primary btn-md">
  Submit
</button>
```

```tsx
// ❌ Before
<div className="rounded-xl border border-gray-200 bg-white px-6 py-4 transition-shadow hover:shadow-md">

// ✅ After
<div className="card card-content card-hover">
```

### 네이밍 컨벤션

| 패턴                     | 예시                            | 용도          |
| ------------------------ | ------------------------------- | ------------- |
| `.{component}`           | `.btn`, `.card`, `.input`       | 기본 컴포넌트 |
| `.{component}-{variant}` | `.btn-primary`, `.btn-outline`  | 변형          |
| `.{component}-{size}`    | `.btn-sm`, `.btn-lg`            | 크기          |
| `.{component}-{part}`    | `.card-header`, `.card-content` | 하위 요소     |

### 주의사항

1. **@layer components** 안에 정의해야 Tailwind 유틸리티로 오버라이드 가능
2. 너무 많은 커스텀 클래스는 피하기 - 재사용되는 것만
3. 조건부 스타일링이 필요하면 `cn()` 유틸리티 함께 사용

```tsx
import { cn } from '@/lib/utils';

<button className={cn('btn-primary btn-md', isLoading && 'opacity-50')}>
```

---

## 📝 Instructions for AI Assistant

When asked to implement features, follow these guidelines:

### Creating New Components

```
1. Determine if component is shared (packages/ui) or app-specific (apps/web)
2. Follow existing patterns in the package
3. Export from package index.ts
4. Add to package.json exports if public API
```

### Adding New Packages

```
1. Create folder in packages/
2. Add package.json with proper name (@tokamak/package-name)
3. Configure TypeScript (tsconfig.json)
4. Add to pnpm-workspace.yaml if needed
5. Update turbo.json for build tasks
```

### Migrating from Old Repository

```
1. Check file mapping table above
2. Update imports to workspace packages (@tokamak/*)
3. Remove old dependencies, use workspace:*
4. Test functionality after migration
```

### Working with External Dependencies

```
1. WASM rebuild: Use scripts/build-wasm.sh
2. Contract ABIs: Use scripts/fetch-contracts.mjs
3. Subtree update: Use scripts/sync-external.sh
```

---

## ⚠️ Important Notes

1. **Do NOT copy Solidity source code** - Use fetch script for ABIs
2. **Do NOT copy full frost-dkg** - Only WASM pkg is needed
3. **Prefer workspace dependencies** - Use `workspace:*` version
4. **Keep packages focused** - Single responsibility principle
5. **Document public APIs** - JSDoc for exported functions

---

## 🔗 References

- [Turborepo Documentation](https://turbo.build/repo/docs)
- [pnpm Workspaces](https://pnpm.io/workspaces)
- [Next.js 15 Documentation](https://nextjs.org/docs)
- [Old Repository Analysis](./ARCHITECTURE.md)
