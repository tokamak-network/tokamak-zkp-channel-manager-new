# UI/UX Flow Documentation

이 문서는 UI/UX 리팩토링 시 화면 간 흐름과 사용자 인터랙션을 기록합니다.

---

## 📱 페이지 플로우 개요

### 메인 플로우

```
홈 → 채널 생성 → 입금 → 상태 초기화 → 거래 실행 → 증명 제출 → 출금
```

---

## 🏠 페이지별 상세 플로우

### 1. 홈 페이지 (`/`)

**화면 구성:**

- 상단 오른쪽 위 : 어카운트 주소와 네트워크를 표시
- 중앙: Create Channel, Join Channel이 수직 정렬로 두 개 버튼이 위치

**사용자 액션:**

- **"Create Channel" 버튼 클릭** → `/create-channel` 페이지로 이동
- **"Join Channel" 버튼 클릭** → `/join-channel` 페이지로 이동
- 상단 오른쪽 위 어카운트 주소를 표시해주는 컴포넌트를 클릭할 경우 오른쪽에 접혀 있던 account panel이 슬라이딩으로 등장

---

### 2. 채널 생성 페이지 (`/create-channel`)

**화면 구성:**

- 상단에 Create Channel 타이틀
- 중앙에 보더 박스가 위치해있으며, 박스 안에 Target 타이틀과 함께 선택할 수 있는 버튼이 3개 위치, 각각 TON, USDC, USDT로 버튼 안에는 이미지 심볼과 텍스트가 같이 존재. 기본적으로 톤만 선택돼있고 USDC, USDT는 비활성화 스타일. Target 밑에는 Number of Participants 타이틀이 있고 옆에 숫자 위치. 그 밑에는 Participants Address 타이틀이 있으며, 그 아래에 인풋 박스가 기본적으로 하나 보여짐. 인풋 박스에는 이더리움의 EOA를 입력할 수 있으며, 입력된 스트링이 EOA가 맞으면 초록색으로 체크 표시가 되고, 새로운 인풋 박스가 아래에 등장. EOA가 아닐 경우 보더라인을 빨간색으로 변경하고, 올바른 형식의 EOA를 입력하라는 경고 문구를 입력 필드 보더 라인 오른쪽 하단에 정렬해 표시. 이 입력 필드 수를 카운트 해 Number of Participants가 자동으로 카운팅 돼서 표시
- 하단에는 Crate Channel 버튼이 있으며 참가자 수는 최소 2명, 최대 128명이며 모든 입력 필드가 올바른 경우 제일 하단에 위치한 Crate Channel 버튼이 활성화

**사용자 액션:**

- **"생성" 버튼 클릭** → 트랜잭션 서명 → 성공 시 Transaction Confirm 모달이 노출되고, Confirm 버튼 클릭 시 `join-channel`로 이동

---

### 3. 채널 참여 페이지 (`/join-channel`)

**화면 구성:**

- 상단: "Join Channel" 제목
- 중앙: 입금 폼
  - 채널 아이디
  - "Join" 버튼

**사용자 액션:**

- **"Join" 버튼 클릭** → 해당 채널에 지금 지갑 연결된 주소가 참여자로 등록돼있는 경우, `/state-explorer` 페이지로 이동, 등록이돼있지않다면 참여자가 아니라는 에러 메세지 노출

---

### 4. state explorer 페이지 (`/state-explorer`)

**화면 구성:**

- 상단: 'Channel #<Channel Id>'
- 중앙과 상단 사이 : 채널 리더 주소로 접속 시 Initialize State, Submit Proof, Close Channel 버튼 노출, 리더가 아니면 아무 것도 표시 X
  - **Submit Proof 버튼**: DB에 저장되고 리더가 승인한 proof들을 자동으로 submit proof 형식에 맞춰 제출
  - **Close Channel 버튼**: 채널 종료 프로세스 시작 (2단계 플로우)
- 중앙 : 케이스에 따라 아래 4가지 컴포넌트 중 하나 표시
  - Initialize State 호출이 안 된 상태 : Deposit 컴포넌트
  - Initialize State 호출이 돼 active인 상태일 때 Transaction 컴포넌트
  - Close Channel 버튼 클릭 시 : Close Channel 컴포넌트 (Transaction 컴포넌트 대신 표시)
  - Close를 해서 채널이 닫힌 상태일 때 : Withdraw 컴포넌트

**컴포넌트 상세:**

- **Deposit**: L2 MPT KEY 생성, Deposit amount를 입력하고 하단에 위치한 Deposit 버튼을 눌러 Deposit 트랜잭션 실행
- **Transaction**: Transaction modal에 있던 인터페이스와 디자인을 그대로 가져와서 구현
  - **Proof List**: 채널에 제출된 모든 proof 목록 표시 (승인됨, 대기중, 거부됨)
  - **Submit Proof 버튼**: Proof List 최하단에 위치, 리더만 표시, 승인된 proof가 있을 때만 활성화
- **Close Channel**: 2단계 채널 종료 프로세스 (아래 상세 설명 참조)
- **Withdraw**: Withdraw 인출 가능한 금액과 토큰 심볼을 보여주고, Withdraw 가능한 상황이면 활성화, 이미 withdraw 했으면 비활성화

**사용자 액션:**

- **"Submit Proof" 버튼 클릭** (Transaction 컴포넌트 내) → DB에서 승인된 proof들을 자동 포맷팅하여 `submitProofAndSignature` 트랜잭션 실행 (아래 상세 설명 참조)
- **"Close Channel" 버튼 클릭** → Close Channel 컴포넌트 표시 (Transaction 컴포넌트 대체)

---

### 4-1. Transaction 컴포넌트 - Submit Proof 기능

**위치:** `/state-explorer` 페이지 내 Transaction 컴포넌트 (Proof List 최하단)

**화면 구성:**

- Proof List 최하단에 "Submit Proof (N)" 버튼 표시
  - 리더만 표시됨
  - 승인된 proof가 있을 때만 활성화
  - 승인된 proof 개수 표시

**동작 방식:**

1. **"Submit Proof" 버튼 클릭**

   - DB에서 승인된(verified) proof들을 `getProofs(channelId, 'verified')`로 가져오기
   - `sequenceNumber` 기준으로 정렬
   - 각 proof의 ZIP 파일을 `/api/get-proof-zip` API로 로드

2. **자동 포맷팅**

   - 공용 포맷팅 함수 `formatVerifiedProofsForSubmission()` 사용
   - 각 proof ZIP 파일을 파싱하여 `proof.json`과 `instance.json` 추출
   - `formatProofForContract()` 함수로 contract 형식으로 변환:
     - `proofPart1`: `proof_entries_part1` 배열을 bigint 배열로 변환
     - `proofPart2`: `proof_entries_part2` 배열을 bigint 배열로 변환
     - `publicInputs`: `a_pub_user + a_pub_block + a_pub_function` 배열을 bigint 배열로 변환
     - `smax`: 고정값 `256`
   - 마지막 proof에서 final state root 추출 (`extractFinalStateRoot()`)
   - Message hash 계산 (`computeMessageHash()`)

3. **확인 모달 표시**

   - 포맷팅된 proof 리스트 표시
   - 각 proof의 sequence number와 제출 날짜 표시
   - Final state root 미리보기
   - 총 proof 개수 표시

4. **"Confirm & Submit" 버튼 클릭**

   - `submitProofAndSignature()` 트랜잭션 호출
   - 파라미터:
     - `channelId`: 현재 채널 ID (bigint)
     - `proofs`: 포맷팅된 proof 배열 (최대 5개)
     - `signature`: 서명 객체 (현재는 빈 서명 사용)

5. **성공 처리**
   - 트랜잭션 성공 시 success 스타일 모달 표시
   - Final state root 표시
   - "Close" 버튼으로 모달 닫기
   - Proof List 자동 새로고침

**공용 포맷팅 함수:**

- 위치: `app/state-explorer/_utils/proofFormatter.ts`
- 함수: `formatVerifiedProofsForSubmission(proofZipFiles: (File | Blob)[], channelId: string)`
- 반환값: `FormattedProofForSubmission`
  - `proofData`: `ProofData[]` - contract 형식의 proof 배열
  - `finalStateRoot`: `0x${string}` - 최종 state root
  - `messageHash`: `0x${string}` - 서명용 메시지 해시

**에러 처리:**

- 승인된 proof가 없을 경우: 버튼 비활성화 또는 에러 메시지
- Proof 파일 로드 실패: 에러 메시지 표시
- 포맷팅 실패: 에러 메시지 표시
- 트랜잭션 실패: 에러 메시지 표시 및 재시도 가능

---

### 5. Close Channel 페이지 (`/state-explorer/close-channel`)

**2단계 채널 종료 프로세스:**

#### **Phase 1: Open → Closing (Proof 제출)**

**화면 구성:**

- 상단: "Close Channel - Step 1: Submit Proof" 타이틀
- 중앙: Proof 제출 정보 표시
  - DB에 저장된 승인된 proof 목록 표시
  - 가장 최근 proof가 자동 선택됨
  - Final State Root 미리보기
  - Proof 데이터 요약 (트랜잭션 수, public inputs 수 등)
- 하단: "Submit Proof & Move to Closing" 버튼

**동작 방식:**

1. DB에서 승인된(approved) proof 중 가장 최근 proof를 자동 선택
2. Proof를 `submitProofAndSignature` 형식에 맞춰 자동 포맷팅
3. `submitProofAndSignature()` 호출하여 채널 상태를 Closing으로 변경
4. 성공 시 자동으로 Phase 2로 전환

**사용자 액션:**

- **"Submit Proof & Move to Closing" 버튼 클릭** → 트랜잭션 서명 → 성공 시 Phase 2로 자동 전환

---

#### **Phase 2: Closing → Closed (Final Balance 검증)**

**화면 구성:**

- 상단: "Close Channel - Step 2: Verify Final Balances" 타이틀
- 중앙: Final Balance 검증 정보 표시
  - 각 참여자별 최종 잔액 표시
  - Final State Root 표시
  - Permutation 배열 생성 상태
  - Groth16 Proof 생성 진행 상황
- 하단: "Verify & Close Channel" 버튼

**동작 방식:**

1. Phase 1에서 제출한 proof의 final state root 사용
2. Final state snapshot 데이터 자동 생성
3. Permutation 배열 자동 계산
4. Groth16 proof 브라우저에서 자동 생성
5. `verifyFinalBalancesGroth16()` 호출하여 채널 완전 종료
6. 성공 시 채널 상태가 Closed로 변경되고 Withdraw 가능

**사용자 액션:**

- **"Verify & Close Channel" 버튼 클릭** → Proof 생성 (로딩) → 트랜잭션 서명 → 성공 시 Withdraw 컴포넌트로 전환

---
