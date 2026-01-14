#!/bin/bash
# Serena MCP 프로젝트 경로를 동적으로 설정하는 스크립트

set -e

# 인자가 없으면 현재 디렉토리 사용
if [ -z "$1" ]; then
  # CURSOR_WORKSPACE 환경 변수가 있으면 사용 (Cursor에서 설정됨)
  if [ -n "$CURSOR_WORKSPACE" ]; then
    PROJECT_PATH="$CURSOR_WORKSPACE"
  else
    PROJECT_PATH="$(pwd)"
  fi
else
  PROJECT_PATH="$1"
fi

# 절대 경로로 변환
if [ -d "$PROJECT_PATH" ]; then
  PROJECT_PATH="$(cd "$PROJECT_PATH" && pwd)"
else
  echo "❌ 오류: 디렉토리를 찾을 수 없습니다: $PROJECT_PATH"
  exit 1
fi

MCP_CONFIG="$HOME/.cursor/mcp.json"

# 설정 파일이 존재하는지 확인
if [ ! -f "$MCP_CONFIG" ]; then
  echo "❌ 오류: MCP 설정 파일을 찾을 수 없습니다: $MCP_CONFIG"
  exit 1
fi

# 백업 생성
BACKUP_FILE="${MCP_CONFIG}.bak.$(date +%Y%m%d_%H%M%S)"
cp "$MCP_CONFIG" "$BACKUP_FILE"
echo "📦 백업 생성: $BACKUP_FILE"

# jq를 사용하여 프로젝트 경로 업데이트
if command -v jq &> /dev/null; then
  # 임시 파일에 업데이트된 설정 저장
  jq --arg path "$PROJECT_PATH" \
    '.mcpServers.serena.args[5] = $path' \
    "$MCP_CONFIG" > "${MCP_CONFIG}.tmp"
  
  # 성공적으로 업데이트되었는지 확인
  if [ $? -eq 0 ]; then
    mv "${MCP_CONFIG}.tmp" "$MCP_CONFIG"
    echo "✅ Serena 프로젝트 경로 업데이트 완료:"
    echo "   $PROJECT_PATH"
    echo ""
    echo "⚠️  Cursor를 재시작하여 변경사항을 적용하세요."
  else
    echo "❌ 오류: 프로젝트 경로 업데이트 실패"
    rm -f "${MCP_CONFIG}.tmp"
    exit 1
  fi
else
  echo "❌ 오류: jq가 설치되어 있지 않습니다."
  echo "   설치: brew install jq"
  exit 1
fi
