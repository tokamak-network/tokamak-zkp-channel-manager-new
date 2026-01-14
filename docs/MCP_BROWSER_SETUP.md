# Chrome DevTools MCP 설정 가이드

이 문서는 Cursor IDE에서 Chrome DevTools MCP (Model Context Protocol) 서버를 설정하는 방법을 설명합니다.

## 개요

Chrome DevTools MCP를 설정하면 AI 코딩 에이전트가 실제 Chrome 브라우저를 제어하고 검사할 수 있습니다. 이를 통해:

- 성능 추적 및 분석
- DOM 및 CSS 검사
- JavaScript 실행 및 디버깅
- 콘솔 출력 읽기
- 사용자 흐름 자동화
- 프론트엔드 코드 테스트

## 설정 방법

### 방법 1: Chrome DevTools MCP 패키지 사용

#### 1단계: MCP 서버 설치 확인

Chrome DevTools MCP는 `npx`를 통해 실행할 수 있습니다:

```bash
npx chrome-devtools-mcp@latest
```

#### 2단계: Cursor MCP 설정 파일 수정

Cursor IDE의 MCP 설정 파일을 찾아 수정합니다. 설정 파일 위치는 운영체제에 따라 다릅니다:

**macOS:**

```
~/.cursor/mcp.json
```

**Windows:**

```
%USERPROFILE%\.cursor\mcp.json
```

**Linux:**

```
~/.cursor/mcp.json
```

> **참고**: Cursor 설정 메뉴에서 MCP 설정을 확인할 수 있습니다. `Settings` → `Features` → `MCP Servers`에서 설정 파일 위치를 확인하거나 직접 편집할 수 있습니다.

설정 파일에 `chrome-devtools` 서버를 추가합니다. 기존 설정이 있다면 `mcpServers` 객체에 추가하세요:

**기존 설정이 없는 경우:**

```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": ["-y", "chrome-devtools-mcp@latest"]
    }
  }
}
```

**기존 설정이 있는 경우 (예시):**

```json
{
  "mcpServers": {
    "serena": {
      "command": "uvx",
      "args": [...]
    },
    "figma": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-figma"],
      "env": {...}
    },
    "chrome-devtools": {
      "command": "npx",
      "args": ["-y", "chrome-devtools-mcp@latest"]
    }
  }
}
```

> **참고**: `-y` 플래그는 npx가 패키지를 자동으로 설치하도록 합니다.

#### 3단계: Cursor 재시작

설정을 적용하기 위해 Cursor IDE를 완전히 종료한 후 다시 시작합니다.

#### 4단계: MCP 서버 승인

Cursor를 재시작하면 Chrome DevTools MCP 서버 연결 승인 요청이 표시됩니다. 승인하면 브라우저 제어 기능을 사용할 수 있습니다.

### 방법 2: Cursor Browser Extension MCP 사용

Cursor IDE에 내장된 브라우저 확장 MCP 서버를 사용할 수도 있습니다. 이 방법은 별도 설치가 필요 없습니다.

#### 설정 확인

1. Cursor IDE 설정 열기 (`Cmd+,` 또는 `Ctrl+,`)
2. **Features** → **MCP Servers** 섹션 확인
3. `cursor-browser-extension` 또는 `cursor-ide-browser` 서버가 활성화되어 있는지 확인

이 서버들은 자동으로 활성화되어 있을 수 있습니다.

## 사용 방법

### 기본 사용

MCP 서버가 설정되면, Cursor의 AI 에이전트가 브라우저를 제어할 수 있습니다:

```
브라우저에서 localhost:3000을 열고 현재 페이지의 DOM 구조를 분석해줘
```

```
앱의 성능을 측정하고 병목 지점을 찾아줘
```

### 프로젝트별 활용

이 프로젝트(Tokamak ZKP Channel Manager)에서는 다음과 같이 활용할 수 있습니다:

1. **채널 생성 플로우 테스트**

   - 채널 생성 프로세스의 UI/UX 검증
   - 폼 입력 및 제출 플로우 확인

2. **상태 탐색기 테스트**

   - State Explorer 페이지의 동작 확인
   - 트랜잭션 목록 렌더링 검증

3. **프루프 제출 플로우**

   - Proof 제출 모달의 동작 확인
   - 에러 처리 및 성공 케이스 검증

4. **Wagmi 연결 테스트**
   - 지갑 연결 플로우 확인
   - 네트워크 전환 동작 검증

## 보안 주의사항

⚠️ **중요**: Chrome DevTools MCP는 브라우저 인스턴스의 모든 내용을 MCP 클라이언트에 노출시킵니다.

- 민감한 정보(개인 데이터, API 키 등)가 포함된 페이지를 열 때 주의하세요
- 프로덕션 환경의 실제 데이터를 사용하지 마세요
- 테스트 환경에서만 사용하는 것을 권장합니다

## 문제 해결

### MCP 서버가 연결되지 않는 경우

1. **설정 파일 경로 확인**

   - 설정 파일이 올바른 위치에 있는지 확인
   - JSON 형식이 올바른지 확인 (쉼표, 따옴표 등)

2. **Node.js 설치 확인**

   ```bash
   node --version
   npm --version
   ```

   Node.js 18 이상이 필요합니다.

3. **npx 실행 확인**

   ```bash
   npx chrome-devtools-mcp@latest --help
   ```

4. **Cursor 로그 확인**
   - Cursor의 개발자 도구에서 MCP 관련 에러 메시지 확인
   - `Help` → `Toggle Developer Tools` → `Console` 탭

### 브라우저가 열리지 않는 경우

1. Chrome 브라우저가 설치되어 있는지 확인
2. Chrome이 기본 브라우저로 설정되어 있는지 확인
3. 방화벽이나 보안 소프트웨어가 연결을 차단하지 않는지 확인

### 권한 오류가 발생하는 경우

1. Cursor에 필요한 권한이 부여되었는지 확인
2. 시스템 설정에서 Cursor의 접근 권한 확인 (macOS의 경우)
3. 관리자 권한으로 Cursor를 실행해보기

## 고급 설정

### 확장 프로그램 사용하기 (MetaMask 등)

Chrome DevTools MCP는 기본적으로 새로운 Chrome 인스턴스를 시작하므로 확장 프로그램이 로드되지 않습니다. MetaMask와 같은 확장 프로그램을 사용하려면 다음 방법 중 하나를 사용하세요.

#### 방법 1: 기존 Chrome 인스턴스에 연결 (권장)

이 방법은 이미 실행 중인 Chrome 브라우저(확장 프로그램 포함)에 MCP가 연결됩니다.

**1단계: Chrome을 원격 디버깅 모드로 실행**

터미널에서 다음 명령어를 실행합니다:

**macOS:**

```bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222
```

**Windows:**

```bash
"C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222
```

**Linux:**

```bash
/usr/bin/google-chrome --remote-debugging-port=9222
```

> **참고**: 이미 Chrome이 실행 중이라면 먼저 완전히 종료한 후 위 명령어로 실행해야 합니다.

**2단계: MCP 설정 파일 수정**

`~/.cursor/mcp.json` 파일에서 `chrome-devtools` 설정에 `--browser-url` 옵션을 추가합니다:

```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": [
        "-y",
        "chrome-devtools-mcp@latest",
        "--browser-url=http://127.0.0.1:9222"
      ]
    }
  }
}
```

**3단계: Cursor 재시작**

설정을 적용하기 위해 Cursor를 재시작합니다.

이제 MCP는 기존 Chrome 인스턴스에 연결되므로 MetaMask 등 모든 확장 프로그램을 사용할 수 있습니다.

#### 방법 2: 사용자 프로필 디렉토리 지정

특정 사용자 프로필(확장 프로그램 포함)을 사용하도록 설정할 수 있습니다:

```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": [
        "-y",
        "chrome-devtools-mcp@latest",
        "--user-data-dir=/Users/your-username/Library/Application Support/Google/Chrome"
      ]
    }
  }
}
```

> **주의**: 이 방법은 기존 Chrome 프로필을 사용하므로, Chrome이 실행 중이 아닐 때만 사용하세요.

### 커스텀 Chrome 실행 옵션

Chrome을 특정 옵션으로 실행하려면 설정을 다음과 같이 수정할 수 있습니다:

```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": [
        "-y",
        "chrome-devtools-mcp@latest",
        "--headless=false",
        "--disable-web-security"
      ]
    }
  }
}
```

### 여러 브라우저 인스턴스 관리

여러 브라우저 인스턴스를 동시에 관리하려면 각각 다른 포트나 설정으로 실행할 수 있습니다.

## 참고 자료

- [Chrome DevTools MCP npm 패키지](https://www.npmjs.com/package/chrome-devtools-mcp)
- [Model Context Protocol 공식 문서](https://modelcontextprotocol.io/)
- [Cursor IDE 공식 문서](https://cursor.sh/docs)

## 관련 문서

- [CURSOR_COMMANDS_SETUP.md](./CURSOR_COMMANDS_SETUP.md) - Cursor 커스텀 명령어 설정
- [UI_UX_FLOW.md](./UI_UX_FLOW.md) - UI/UX 플로우 문서
- [development/](./development/) - 개발 관련 문서

---

**마지막 업데이트**: 2024년
