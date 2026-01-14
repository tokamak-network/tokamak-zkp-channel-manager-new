# Chrome 원격 디버깅 모드 실행 가이드

Chrome을 원격 디버깅 모드로 실행하여 MetaMask 등 확장 프로그램을 사용할 수 있도록 설정하는 방법입니다.

## 방법 1: 스크립트 직접 실행

프로젝트의 `scripts/chrome-debug.sh` 파일을 실행합니다:

```bash
./scripts/chrome-debug.sh
```

## 방법 2: Spotlight에서 바로 실행하기

### 옵션 A: PATH에 추가하기 (터미널에서 실행)

1. **스크립트를 PATH에 추가할 위치로 복사:**
   ```bash
   mkdir -p ~/bin
   cp scripts/chrome-debug.sh ~/bin/chrome-debug
   chmod +x ~/bin/chrome-debug
   ```

2. **PATH에 추가 (zsh 사용 시):**
   ```bash
   echo 'export PATH="$HOME/bin:$PATH"' >> ~/.zshrc
   source ~/.zshrc
   ```

3. **이제 어디서든 실행 가능:**
   ```bash
   chrome-debug
   ```

4. **Spotlight에서 실행:**
   - `Cmd + Space`로 Spotlight 열기
   - "Terminal" 입력 후 Enter
   - `chrome-debug` 입력 후 Enter

### 옵션 B: Automator로 빠른 작업 만들기 (추천)

Spotlight에서 바로 실행할 수 있는 macOS 빠른 작업을 만듭니다.

1. **Automator 열기:**
   - `Cmd + Space` → "Automator" 또는 "자동화" 입력

2. **새 문서 생성:**
   - **한국어 macOS:**
     - "빠른 작업" 선택 → "선택" 클릭
     - "워크플로가 받는 항목" → "입력 없음" 선택
     - "다음에서" → "모든 애플리케이션" 선택
   
   - **영어 macOS:**
     - "Quick Action" 선택 → "Choose" 클릭
     - "Workflow receives" → "no input" 선택
     - "in" → "any application" 선택

3. **액션 추가:**
   - 왼쪽 검색창에서 "셸 스크립트 실행" 또는 "Run Shell Script" 검색
   - 검색 결과를 오른쪽 작업 영역으로 드래그
   - "입력 전달" 또는 "Pass input" → "인수로" 또는 "as arguments" 선택
   - 스크립트 입력란에 다음 코드 입력:
     ```bash
     /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222 > /dev/null 2>&1 &
     ```

4. **저장:**
   - `Cmd + S` → 이름: "Chrome Debug Mode" 또는 "Chrome 디버그 모드"
   - 저장 위치: 기본 위치 (자동으로 서비스에 추가됨)

5. **사용 방법:**
   - `Cmd + Space` → "Chrome Debug Mode" 또는 "Chrome 디버그 모드" 입력 → Enter
   - 또는 `Cmd + Shift + ,` (서비스 메뉴) → "Chrome Debug Mode" 선택

> **참고**: 한국어 macOS에서는 메뉴가 한국어로 표시되지만, Spotlight 검색은 영어 이름으로도 가능합니다.

### 옵션 C: 스크립트를 Applications 폴더에 추가

1. **스크립트를 Applications 폴더에 복사:**
   ```bash
   cp scripts/chrome-debug.sh /Applications/ChromeDebug.command
   chmod +x /Applications/ChromeDebug.command
   ```

2. **Spotlight에서 실행:**
   - `Cmd + Space` → "ChromeDebug" 입력 → Enter

## 방법 3: 별칭(Alias) 설정

`.zshrc` 파일에 별칭을 추가합니다:

```bash
echo 'alias chrome-debug="/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222"' >> ~/.zshrc
source ~/.zshrc
```

터미널에서 `chrome-debug`로 실행 가능합니다.

## 확인 방법

Chrome이 원격 디버깅 모드로 실행되었는지 확인:

```bash
curl http://127.0.0.1:9222/json/version
```

응답이 오면 정상입니다.

## 주의사항

- Chrome을 원격 디버깅 모드로 실행하기 전에 기존 Chrome을 완전히 종료하세요 (`Cmd + Q`)
- 원격 디버깅 포트(9222)는 로컬에서만 접근 가능하므로 상대적으로 안전합니다
- 테스트 환경에서만 사용하세요

## 문제 해결

### "포트가 이미 사용 중" 에러

다른 프로세스가 9222 포트를 사용 중일 수 있습니다:

```bash
lsof -i :9222
```

해당 프로세스를 종료하거나 다른 포트를 사용하세요.

### Chrome이 실행되지 않음

Chrome 경로를 확인하세요:

```bash
ls -la "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```

경로가 다르다면 스크립트의 경로를 수정하세요.

---

**추천 방법**: Automator Quick Action (옵션 B)이 가장 편리하고 Spotlight에서 바로 실행할 수 있습니다.
