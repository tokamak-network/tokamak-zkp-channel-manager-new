#!/bin/bash
# Chrome을 원격 디버깅 모드로 실행하는 스크립트

# Chrome이 이미 실행 중인지 확인
if pgrep -f "Google Chrome.*remote-debugging-port" > /dev/null; then
    echo "Chrome이 이미 원격 디버깅 모드로 실행 중입니다."
    exit 0
fi

# Chrome 실행
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222 > /dev/null 2>&1 &

echo "Chrome이 원격 디버깅 모드로 실행되었습니다."
echo "포트: 9222"
