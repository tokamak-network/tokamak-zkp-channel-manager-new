#!/bin/bash
# Cursor 워크스페이스를 자동으로 감지하여 Serena 프로젝트 경로 설정

set -e

# 현재 Cursor 워크스페이스 감지
# Cursor는 보통 .cursor 또는 .vscode 폴더가 있는 디렉토리를 워크스페이스로 인식
# 또는 현재 디렉토리에서 .git 폴더를 찾아 프로젝트 루트로 인식

find_project_root() {
  local dir="$1"
  
  # 현재 디렉토리부터 루트까지 올라가며 프로젝트 루트 찾기
  while [ "$dir" != "/" ]; do
    # .git, package.json, 또는 .cursor 폴더가 있으면 프로젝트 루트로 간주
    if [ -d "$dir/.git" ] || [ -f "$dir/package.json" ] || [ -d "$dir/.cursor" ]; then
      echo "$dir"
      return 0
    fi
    dir="$(dirname "$dir")"
  done
  
  # 찾지 못하면 현재 디렉토리 반환
  echo "$(pwd)"
}

# 현재 디렉토리에서 프로젝트 루트 찾기
PROJECT_ROOT="$(find_project_root "$(pwd)")"
PROJECT_ROOT="$(cd "$PROJECT_ROOT" && pwd)"

echo "🔍 프로젝트 루트 감지: $PROJECT_ROOT"

# serena-set-project 스크립트 실행 (PATH에서 찾기)
if command -v serena-set-project &> /dev/null; then
  serena-set-project "$PROJECT_ROOT"
elif [ -f "$(dirname "${BASH_SOURCE[0]}")/serena-set-project.sh" ]; then
  # 상대 경로로 찾기 (로컬에서 실행하는 경우)
  "$(dirname "${BASH_SOURCE[0]}")/serena-set-project.sh" "$PROJECT_ROOT"
else
  echo "❌ 오류: serena-set-project를 찾을 수 없습니다."
  echo "   설치: cp $(dirname "${BASH_SOURCE[0]}")/serena-set-project.sh ~/bin/serena-set-project"
  exit 1
fi
