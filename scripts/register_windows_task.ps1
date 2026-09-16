# 윈도우 작업 스케줄러 등록 스크립트 (매일 06:30 실행)
$TaskName = "NFA_Fire_Daily_Update_0630"
$Action = New-ScheduledTaskAction -Execute "c:\Users\강민호\.gemini\antigravity\scratch\samefiledel\scripts\run_daily_update.bat"
$Trigger = New-ScheduledTaskTrigger -Daily -At 6:30AM
$Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable

Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue
Register-ScheduledTask -TaskName $TaskName -Action $Action -Trigger $Trigger -Settings $Settings -Description "매일 아침 06:30 전국 17개 시도 소방본부 119일일상황 자동 수집 및 Vercel 자동 배포"

Write-Host "✅ 윈도우 작업 스케줄러 등록 완료: $TaskName (매일 06:30 AM)"
