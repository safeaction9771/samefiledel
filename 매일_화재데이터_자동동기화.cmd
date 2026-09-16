@echo off
chcp 65001 > nul
echo =========================================================
echo 🚒 [소방청 화재발생정보] 매일 자동 데이터 수집 및 동기화
echo ⏰ 실행일시: %date% %time%
echo =========================================================

echo.
echo 📥 1. 소방청 OpenAPI 및 공공데이터 전수 수집 및 증분 업데이트...
python "%~dp0sync_fire_data.py"
if %errorlevel% neq 0 (
    echo ❌ 데이터 수집 중 오류가 발생했습니다.
    pause
    exit /b %errorlevel%
)

echo.
echo 🏗️ 2. 최신 화재 데이터 기반 웹앱 프로덕션 빌드...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ 웹앱 빌드 중 오류가 발생했습니다.
    pause
    exit /b %errorlevel%
)

echo.
echo 🚀 3. Vercel 클라우드 프로덕션 자동 배포...
call npx --yes vercel --prod

echo.
echo =========================================================
echo ✅ 소방청 화재데이터 매일 자동 동기화 및 배포가 완료되었습니다!
echo 📁 저장 파일:
echo    - JSON DB: %~dp0src\data\nfa_fire_database.json
echo    - Excel DB: %~dp0소방청_화재발생정보_전체DB.xlsx
echo =========================================================
timeout /t 5 > nul
