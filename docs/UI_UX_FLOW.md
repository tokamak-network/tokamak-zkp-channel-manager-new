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
- 중앙과 상단 사이 : 채널 리더 주소로 접속 시 Initialize State, Close 버튼 노출, 리더가 아니면 아무 것도 표시 X
- 중앙 : 케이스에 따라 아래 3가지 컴포넌트 중 하나 표시
  - Initialize State 호출이 안 된 상태 : Deposit 컴포넌트
  - Initialize State 호출이 돼 active인 상태일 때 Transaction 컴포넌트
  - Close를 해서 채널이 닫힌 상태일 때 : Withdraw 컴포넌트
- Deposit : L2 MPT KEY 생성, Deposit amouunt를 입력하고 하단에 위치한 Deposit 버튼을 눌러 Depoosit 트랜잭션 실행, 이미 채널 아이디를 눌러서 왔으므로 그 채널 아이디를 그대로 활용
- Transaction : Transaction modal에 있던 인터페이스와 디자인을 그대로 가져와서 구현
- Withdraw : Withdraw 인출 가능한 금액과 토큰 심볼을 보여주고, Withdraw 가능한 상황이면 활성화 아니면 이미 withdraw 했으면 비활성화

---
