# Serena MCP 프로젝트 경로 동적 설정 가이드

Serena MCP 서버는 `--project` 옵션으로 프로젝트 경로를 지정합니다. 여러 레포지토리를 작업할 때마다 경로를 변경하는 것이 불편하므로, 환경 변수를 사용하여 동적으로 설정할 수 있습니다.

## 문제점

기본 설정에서는 프로젝트 경로가 하드코딩되어 있습니다:

```json
{
  "mcpServers": {
    "serena": {
      "args": [
        "--project",
        "/Users/son-yeongseong/Desktop/dev/all-thing-eye"  // 하드코딩된 경로
      ]
    }
  }
}
```

여러 프로젝트를 작업할 때마다 `mcp.json` 파일을 수정해야 하는 불편함이 있습니다.

## 해결 방법

### 방법 1: 환경 변수 사용 (권장)

환경 변수를 사용하여 프로젝트 경로를 동적으로 설정할 수 있습니다.

#### 1단계: 환경 변수 설정

터미널에서 현재 작업 중인 프로젝트 경로를 환경 변수로 설정:

```bash
# 현재 프로젝트 경로를 환경 변수로 설정
export SERENA_PROJECT_PATH="$(pwd)"

# 또는 특정 프로젝트 경로 지정
export SERENA_PROJECT_PATH="/Users/son-yeongseong/Desktop/dev/tokamak-zkp-channel-manager-new"
```

#### 2단계: .zshrc에 함수 추가 (편의성)

자주 사용하는 프로젝트를 쉽게 전환할 수 있도록 함수를 추가:

```bash
# ~/.zshrc에 추가
serena-activate() {
  if [ -z "$1" ]; then
    # 인자가 없으면 현재 디렉토리 사용
    export SERENA_PROJECT_PATH="$(pwd)"
    echo "✅ Serena 프로젝트 경로 설정: $SERENA_PROJECT_PATH"
  else
    # 인자가 있으면 해당 경로 사용
    export SERENA_PROJECT_PATH="$1"
    echo "✅ Serena 프로젝트 경로 설정: $SERENA_PROJECT_PATH"
  fi
  
  # Cursor 재시작 필요 안내
  echo "⚠️  Cursor를 재시작하여 변경사항을 적용하세요."
}

# 사용 예시:
# serena-activate                                    # 현재 디렉토리
# serena-activate ~/Desktop/dev/all-thing-eye        # 특정 경로
```

설정 후:
```bash
source ~/.zshrc
```

#### 3단계: mcp.json 설정 확인

`~/.cursor/mcp.json` 파일이 환경 변수를 사용하도록 설정되어 있는지 확인:

```json
{
  "mcpServers": {
    "serena": {
      "command": "uvx",
      "args": [
        "--from",
        "git+https://github.com/oraios/serena",
        "serena",
        "start-mcp-server",
        "--project",
        "${SERENA_PROJECT_PATH}",
        "--log-level",
        "INFO"
      ],
      "env": {
        "SERENA_PROJECT_PATH": "${SERENA_PROJECT_PATH}"
      }
    }
  }
}
```

> **참고**: MCP 설정에서 환경 변수 치환이 제대로 작동하지 않을 수 있습니다. 이 경우 방법 2를 사용하세요.

### 방법 2: 스크립트로 동적 설정 (더 안정적)

환경 변수 치환이 작동하지 않는 경우, 스크립트를 사용하여 동적으로 설정할 수 있습니다.

#### 1단계: 설정 스크립트 생성

```bash
# ~/bin/serena-set-project.sh 생성
cat > ~/bin/serena-set-project.sh << 'EOF'
#!/bin/bash

if [ -z "$1" ]; then
  PROJECT_PATH="$(pwd)"
else
  PROJECT_PATH="$1"
fi

# 절대 경로로 변환
PROJECT_PATH="$(cd "$PROJECT_PATH" && pwd)"

MCP_CONFIG="$HOME/.cursor/mcp.json"

# 백업 생성
cp "$MCP_CONFIG" "$MCP_CONFIG.bak"

# jq를 사용하여 프로젝트 경로 업데이트 (jq가 설치되어 있는 경우)
if command -v jq &> /dev/null; then
  jq --arg path "$PROJECT_PATH" \
    '.mcpServers.serena.args[5] = $path' \
    "$MCP_CONFIG.bak" > "$MCP_CONFIG"
  echo "✅ Serena 프로젝트 경로 업데이트: $PROJECT_PATH"
  echo "⚠️  Cursor를 재시작하여 변경사항을 적용하세요."
else
  echo "❌ jq가 설치되어 있지 않습니다."
  echo "   brew install jq"
  exit 1
fi
EOF

chmod +x ~/bin/serena-set-project.sh
```

#### 2단계: 사용 방법

```bash
# 현재 디렉토리를 프로젝트로 설정
serena-set-project.sh

# 또는 특정 경로 지정
serena-set-project.sh ~/Desktop/dev/tokamak-zkp-channel-manager-new
```

### 방법 3: 여러 프로젝트 설정 파일 관리

각 프로젝트별로 설정 파일을 만들어두고 필요할 때 교체하는 방법:

```bash
# 프로젝트별 설정 파일 생성
cp ~/.cursor/mcp.json ~/.cursor/mcp.all-thing-eye.json
cp ~/.cursor/mcp.json ~/.cursor/mcp.tokamak.json

# 각 파일의 프로젝트 경로 수정 후
# 필요할 때 교체
cp ~/.cursor/mcp.tokamak.json ~/.cursor/mcp.json
```

### 방법 4: 심볼릭 링크 사용

현재 작업 중인 프로젝트를 가리키는 심볼릭 링크를 사용:

```bash
# 심볼릭 링크 생성
ln -sf /Users/son-yeongseong/Desktop/dev/tokamak-zkp-channel-manager-new ~/.serena-current-project

# mcp.json에서 심볼릭 링크 사용
# --project "$HOME/.serena-current-project"
```

## 추천 워크플로우

가장 편리한 방법은 **방법 1 (환경 변수 + 함수)**입니다:

1. `.zshrc`에 `serena-activate` 함수 추가
2. 프로젝트 작업 시작 시:
   ```bash
   cd ~/Desktop/dev/tokamak-zkp-channel-manager-new
   serena-activate
   ```
3. Cursor 재시작
4. Serena MCP가 올바른 프로젝트 경로로 작동

## 문제 해결

### 환경 변수가 적용되지 않는 경우

1. Cursor를 완전히 종료하고 재시작
2. 터미널에서 환경 변수 확인:
   ```bash
   echo $SERENA_PROJECT_PATH
   ```
3. Cursor가 터미널의 환경 변수를 상속받지 못할 수 있으므로, 방법 2(스크립트) 사용 권장

### jq 설치

방법 2를 사용하려면 `jq`가 필요합니다:

```bash
brew install jq
```

## 참고

- Serena MCP 서버 문서: https://github.com/oraios/serena
- MCP 설정 파일 위치: `~/.cursor/mcp.json`
- Cursor 재시작이 필요한 이유: MCP 서버는 Cursor 시작 시 설정을 읽습니다
