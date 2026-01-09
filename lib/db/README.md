# Database Module

공통 데이터베이스 API 모듈입니다. lowdb를 사용하여 로컬 JSON 파일 기반 데이터베이스를 제공합니다.

## 설치

```bash
npm install lowdb
```

## 구조

```
lib/db/
├── client.ts      # lowdb 클라이언트 초기화
├── helpers.ts     # 공통 CRUD 함수들
├── channels.ts    # 채널 관련 특화 함수들
├── index.ts       # 모듈 export
└── README.md      # 이 파일
```

## 사용법

### 기본 CRUD 작업

```typescript
import { getData, setData, pushData, updateData, deleteData } from '@/lib/db';

// 데이터 읽기
const channel = await getData('channels.123');

// 데이터 쓰기
await setData('channels.123', { status: 'active' });

// 배열/객체에 추가 (자동 키 생성)
const key = await pushData('channels.123.proofs', { proofData: '...' });

// 데이터 업데이트 (병합)
await updateData('channels.123', { status: 'closed' });

// 데이터 삭제
await deleteData('channels.123');
```

### 채널 관련 함수

```typescript
import {
  getChannel,
  getAllChannels,
  getActiveChannels,
  saveChannel,
  updateChannel,
  deleteChannel,
  getChannelParticipants,
  getChannelSnapshots,
  getLatestSnapshot,
  getProofs,
  getCurrentStateNumber,
} from '@/lib/db';

// 채널 조회
const channel = await getChannel('123');
const allChannels = await getAllChannels();
const activeChannels = await getActiveChannels();

// 채널 저장/업데이트
await saveChannel('123', {
  status: 'active',
  targetContract: '0x...',
  participants: ['0x...', '0x...'],
});

await updateChannel('123', { status: 'closed' });

// 참여자 조회
const participants = await getChannelParticipants('123');

// 스냅샷 조회
const snapshots = await getChannelSnapshots('123', 10); // 최근 10개
const latest = await getLatestSnapshot('123');

// Proof 조회
const submittedProofs = await getProofs('123', 'submitted');
const verifiedProofs = await getProofs('123', 'verified');

// 현재 상태 번호
const nextStateNumber = await getCurrentStateNumber('123');
```

## API 라우트에서 사용

```typescript
// app/api/channels/route.ts
import { NextResponse } from 'next/server';
import { getActiveChannels } from '@/lib/db';

export async function GET() {
  const channels = await getActiveChannels();
  return NextResponse.json({ success: true, data: channels });
}
```

## 데이터 구조

데이터는 `data/db.json` 파일에 저장됩니다:

```json
{
  "channels": {
    "123": {
      "channelId": "123",
      "status": "active",
      "targetContract": "0x...",
      "participants": ["0x...", "0x..."],
      "participants": {
        "0x...": {
          "address": "0x...",
          "_createdAt": "2026-01-08T..."
        }
      },
      "stateSnapshots": {
        "snapshot-1": {
          "sequenceNumber": 1,
          "merkleRoot": "0x...",
          "_createdAt": "2026-01-08T..."
        }
      },
      "submittedProofs": {},
      "verifiedProofs": {},
      "rejectedProofs": {},
      "_createdAt": "2026-01-08T...",
      "_updatedAt": "2026-01-08T..."
    }
  }
}
```

## 주의사항

1. **서버 사이드 전용**: 이 모듈은 Next.js API 라우트에서만 사용할 수 있습니다. 클라이언트 컴포넌트에서는 사용하지 마세요.

2. **파일 경로**: 데이터베이스 파일은 `data/db.json`에 저장됩니다. 이 디렉토리는 자동으로 생성됩니다.

3. **타임스탬프**: 모든 데이터는 자동으로 `_createdAt` 또는 `_updatedAt` 타임스탬프가 추가됩니다.

4. **경로 표기법**: 경로는 점(.) 또는 슬래시(/)로 구분할 수 있습니다:
   - `channels.123` 또는 `channels/123`
   - `channels.123.participants.0x...` 또는 `channels/123/participants/0x...`

## 레거시 코드와의 호환성

레거시 코드의 `lib/realtime-db-helpers.ts`와 유사한 API를 제공합니다:

| 레거시 (Firebase) | 새로운 (lowdb) |
|------------------|---------------|
| `getChannel(id)` | `getChannel(id)` |
| `getActiveChannels()` | `getActiveChannels()` |
| `getData(path)` | `getData(path)` |
| `setData(path, data)` | `setData(path, data)` |
| `pushData(path, data)` | `pushData(path, data)` |
| `updateData(path, data)` | `updateData(path, data)` |
| `deleteData(path)` | `deleteData(path)` |

## 마이그레이션 가이드

레거시 코드에서 새로운 DB 모듈로 마이그레이션:

```typescript
// Before (Firebase)
import { getChannel, getData } from '@/lib/realtime-db-helpers';

// After (lowdb)
import { getChannel, getData } from '@/lib/db';
```

API는 동일하므로 import 경로만 변경하면 됩니다.
