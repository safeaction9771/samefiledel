@echo off
chcp 65001 > nul
echo =========================================================
echo ⏰ [윈도우 작업 스케줄러] 매일 소방청 화재데이터 자동 동기화 등록
echo =========================================================

set TASK_NAME=NFA_FireData_Daily_Sync
set SCRIPT_PATH=%~dp0매일_화재데이터_자동동기화.cmd

echo.
echo 📅 매일 새벽 01:00에 소방청 화재 데이터를 자동으로 수집/저장/배포하도록 등록합니다.
echo 작업 이름: %TASK_NAME%
echo 실행 대상: %SCRIPT_PATH%
echo.

schtasks /create /tn "%TASK_NAME%" /tr "\"%SCRIPT_PATH%\"" /sc daily /st 01:00 /f

if %errorlevel% equ 0 (
    echo.
    echo =========================================================
    echo ✅ [성공] 윈도우 작업 스케줄러에 성공적으로 등록되었습니다!
    echo    이제 매일 새벽 01:00에 자동으로 소방청 최신 화재 데이터가 파일로 갱신됩니다.
    echo =========================================================
) else (
    echo.
    echo ⚠️ 관리자 권한이 필요할 수 있습니다. 마우스 우클릭 후 '관리자 권한으로 실행'을 선택해 주세요.
)

pause
